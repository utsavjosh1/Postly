import { streamText, generateText } from "@postly/ai-utils";
import {
  conversationQueries,
  resumeQueries,
  jobQueries,
} from "@postly/database";
import { matchingService } from "./matching.service.js";
import type {
  StreamChatResponse,
  MessageMetadata,
  Message,
  Job,
  OptimizedJobMatch,
} from "@postly/shared-types";

interface MatchedJob extends Job {
  match_score: number;
  ai_explanation?: string;
}

// Helper to transform raw job data to UI-ready format
function toOptimizedJobMatch(job: MatchedJob): OptimizedJobMatch {
  const formatSalary = (min?: number, max?: number): string | undefined => {
    if (!min && !max) return undefined;
    if (min && max)
      return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    return `Up to $${(max! / 1000).toFixed(0)}k`;
  };

  return {
    id: job.id,
    display_info: {
      title: job.title,
      company: job.company_name,
      location: job.location || "Remote",
      logo_url: undefined, // Could be fetched from a logo service
      source: job.source,
    },
    matching_data: {
      match_score: job.match_score,
      ai_explanation: job.ai_explanation,
      key_skills: job.skills_required || [],
    },
    meta: {
      posted_at: job.posted_at?.toISOString(),
      apply_url: job.source_url,
      remote: job.remote,
      salary_range: formatSalary(job.salary_min, job.salary_max),
    },
  };
}

export class ChatService {
  /**
   * Stream AI response with Server-Sent Events
   */
  async *streamChatResponse(
    conversationId: string,
    userId: string,
    userMessage: string,
    resumeId?: string,
  ): AsyncGenerator<StreamChatResponse> {
    try {
      // 1. Save user message to database
      await conversationQueries.createMessage(
        conversationId,
        "user",
        userMessage,
      );

      // 2. Get conversation context
      const conversation = await conversationQueries.findById(
        conversationId,
        userId,
      );
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const messages = await conversationQueries.getMessages(conversationId);

      // 3. Determine which resume to use (parameter takes priority)
      const effectiveResumeId = resumeId || conversation.resume_id;

      // 4. Load resume context and job matches if available
      let resumeContext = "";
      let jobMatches: MatchedJob[] = [];

      if (effectiveResumeId) {
        const resume = await resumeQueries.findById(effectiveResumeId);
        if (resume?.parsed_text) {
          resumeContext = `\n\nUser's Resume Summary:\n- Skills: ${resume.skills?.join(", ") || "Not specified"}\n- Experience: ${resume.experience_years || 0} years\n- Summary: ${resume.parsed_text.substring(0, 1000)}`;

          // Find matching jobs based on resume
          try {
            jobMatches = await matchingService.findMatchingJobs(
              effectiveResumeId,
              userId,
              5, // Limit to top 5
            );
          } catch (err) {
            console.error("Failed to fetch job matches:", err);
          }
        }

        // Update conversation with resume_id if not already set
        if (!conversation.resume_id && resumeId) {
          await conversationQueries.updateResumeId(conversationId, resumeId);
        }
      }

      // 4b. FALLBACK: If no resume or no matches, fetch recent active jobs
      if (jobMatches.length === 0) {
        try {
          const recentJobs = await jobQueries.findActive(undefined, 5, 0);
          jobMatches = recentJobs.map((job) => ({
            ...job,
            match_score: 0, // No score without resume
          }));
        } catch (err) {
          console.error("Failed to fetch recent jobs:", err);
        }
      }

      // 5. Build system prompt with job context
      let jobContext = "";
      if (jobMatches.length > 0) {
        const hasResume = !!effectiveResumeId;
        jobContext = `\n\n${hasResume ? "Matching" : "Available"} job opportunities from our database:\n${jobMatches
          .map(
            (j, i) =>
              `${i + 1}. ${j.title} at ${j.company_name}${hasResume && j.match_score > 0 ? ` (${j.match_score}% match)` : ""} - ${j.location || "Remote"}`,
          )
          .join("\n")}`;
      }

      const systemPrompt = `You are an AI career assistant helping with resume analysis and job search.

Your capabilities:
- Analyze resumes and provide constructive feedback
- Suggest relevant job opportunities from our database
- Offer career advice and interview tips
- Help with job applications

IMPORTANT INSTRUCTIONS:
1. When the user asks for jobs, ALWAYS reference the jobs listed below if any are available. These are REAL jobs from our database.
2. Summarize the available jobs briefly and let the user know they can see the full details in the job cards.
3. DO NOT invent or hallucinate job listings. Only mention jobs that are explicitly listed in "Available job opportunities" or "Matching job opportunities" section below.
4. If no jobs are listed below, inform the user that no jobs are currently available in our database.

Be professional, encouraging, and concise.${resumeContext}${jobContext}`;

      // 6. Prepare conversation history
      const conversationHistory = messages
        .filter((m: Message) => m.role !== "system")
        .map((m: Message) => `${m.role}: ${m.content}`)
        .join("\n");

      const fullPrompt = `${systemPrompt}\n\nConversation:\n${conversationHistory}\nuser: ${userMessage}\nassistant:`;

      // 7. Stream AI response
      let fullResponse = "";
      const metadata: MessageMetadata = {};
      const streamResult = await streamText(fullPrompt);

      for await (const chunk of streamResult.stream) {
        fullResponse += chunk;
        yield { type: "chunk", content: chunk };
      }

      // Get metadata after stream is consumed
      const streamMeta = streamResult.getMetadata();
      metadata.usage = {
        prompt_tokens: streamMeta.promptTokens,
        completion_tokens: streamMeta.completionTokens,
        total_tokens: streamMeta.totalTokens,
      };

      // Add job matches to metadata before saving (optimized format)
      if (jobMatches.length > 0) {
        metadata.job_matches = jobMatches.map(toOptimizedJobMatch);
      }

      // 8. Save assistant message to database
      const savedMsg = await conversationQueries.createMessage(
        conversationId,
        "assistant",
        fullResponse,
        metadata as Record<string, unknown>,
      );

      // 9. Auto-generate conversation title if this is the first message
      if (messages.length === 0) {
        const titlePrompt = `Generate a short 3-5 word title for this conversation. User's first message: "${userMessage}". Return ONLY the title, no quotes or explanation.`;
        const { text: title } = await generateText(titlePrompt);
        await conversationQueries.updateTitle(
          conversationId,
          title.trim().substring(0, 50),
        );
      }

      // 10. Send job matches as separate event (for UI rendering)
      if (jobMatches.length > 0) {
        yield {
          type: "metadata",
          metadata: {
            job_matches: jobMatches.map(toOptimizedJobMatch),
          },
        };
      }

      // 11. Send completion event
      yield {
        type: "complete",
        message_id: savedMsg.id,
        metadata,
      };
    } catch (error) {
      console.error("Chat service error:", error);
      yield {
        type: "error",
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }
}
