import { streamText, generateText } from "@postly/ai-utils";
import {
  conversationQueries,
  resumeQueries,
  jobQueries,
  userQueries,
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

interface JobIntent {
  isRelated: boolean;
  isSpecific: boolean;
  techKeywords: string[];
  allKeywords: string[];
}

/**
 * More precise intent detection for job-related queries
 */
function getJobIntent(message: string): JobIntent {
  const lowercaseMsg = message.toLowerCase();

  // Universal job related terms (not just tech)
  const jobKeywords = [
    "job",
    "career",
    "hiring",
    "opportunity",
    "opening",
    "position",
    "vacancy",
    "work",
    "hire",
    "recruiting",
    "talent",
    "apply",
    "application",
    "resume",
    "cv",
    "salary",
    "role",
    "looking for",
    "hunting",
    "find",
    "search",
    "offer",
    "interview",
    "employer",
    "company",
    "staff",
    "manager",
    "engineer",
    "designer",
    "architect",
    "developer",
    "sales",
    "marketing",
    "doctor",
    "nurse",
    "teacher",
    "driver",
    "chef",
    "accounting",
    "legal",
    "retail",
    "remote",
    "hybrid",
    "fullstack",
    "frontend",
    "backend",
  ];

  const foundKeywords = jobKeywords.filter((kw) => lowercaseMsg.includes(kw));

  return {
    isRelated: foundKeywords.length > 0 || message.length > 50,
    isSpecific: foundKeywords.length > 2, // A heuristic for specific queries
    techKeywords: [], // Deprecated: keep for type compatibility
    allKeywords: foundKeywords,
  };
}
// ... (omitting helper for brevity in diff)

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

      // 2. Get conversation context and user context
      const [conversation, user] = await Promise.all([
        conversationQueries.findById(conversationId, userId),
        userQueries.findById(userId),
      ]);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const userRole = user?.roles[0] || "job_seeker";

      const messages = await conversationQueries.getMessages(conversationId);

      // 3. Determine which resume to use (parameter takes priority)
      const effectiveResumeId = resumeId || conversation.resume_id;

      // 4. Load resume context and job matches if available
      let resumeContext = "";
      let jobMatches: MatchedJob[] = [];
      const intent = getJobIntent(userMessage);

      if (effectiveResumeId) {
        const resume = await resumeQueries.findById(effectiveResumeId);
        if (resume?.parsed_text) {
          resumeContext = `\n\nUser's Resume Summary:\n- Skills: ${resume.skills?.join(", ") || "Not specified"}\n- Experience: ${resume.experience_years || 0} years\n- Summary: ${resume.parsed_text.substring(0, 1000)}`;

          // Find matching jobs based on resume ONLY if not employer AND intent is related
          if (
            userRole !== "employer" &&
            userRole !== "admin" &&
            intent.isRelated
          ) {
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
        }

        // Update conversation with resume_id if not already set
        if (!conversation.resume_id && resumeId) {
          await conversationQueries.updateResumeId(conversationId, resumeId);
        }
      }

      // 4b. FALLBACK: If no resume or no matches, fetch recent active jobs
      // Only do this if the user is not an employer AND intent is related
      if (
        jobMatches.length === 0 &&
        userRole !== "employer" &&
        userRole !== "admin" &&
        intent.isRelated
      ) {
        try {
          const recentJobs = await jobQueries.findActive(undefined, 5, 0);
          jobMatches = recentJobs.map((job: Job) => ({
            ...job,
            match_score: 0, // No score without resume
          }));
        } catch (err) {
          console.error("Failed to fetch recent jobs:", err);
        }
      }

      // 4c. FILTER: If intent is specific, ensure matches are actually relevant.
      // If user specified tech keywords, at least one must match.
      // Otherwise, at least one level/general keyword must match.
      if (intent.isSpecific && jobMatches.length > 0) {
        jobMatches = jobMatches.filter((job) => {
          const searchSpace = (
            (job.title || "") +
            " " +
            (job.description || "") +
            " " +
            (job.skills_required?.join(" ") || "")
          ).toLowerCase();

          if (intent.techKeywords.length > 0) {
            return intent.techKeywords.some((kw: string) =>
              searchSpace.includes(kw),
            );
          }
          return intent.allKeywords.some((kw: string) =>
            searchSpace.includes(kw),
          );
        });
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

      let roleSpecificInstructions = "";
      if (userRole === "employer") {
        roleSpecificInstructions =
          "You are an AI assistant helping an employer looking to hire candidates. Your ONLY function is to help with hiring, evaluating candidates, and posting jobs.";
      } else {
        roleSpecificInstructions =
          "You are an AI career assistant helping with resume analysis and job search.";
      }

      const systemPrompt = `${roleSpecificInstructions}
${
  userRole !== "employer"
    ? `
Your capabilities:
- Analyze resumes and provide constructive feedback
- Suggest relevant job opportunities from our database
- Offer career advice and interview tips
- Help with job applications
`
    : ""
}
IMPORTANT INSTRUCTIONS:
1. ${userRole === "employer" ? "Focus STRICTLY on helping the employer with hiring. UNDER NO CIRCUMSTANCES should you suggest, mention, or offer job listings, career advice, or job search help to an employer. If asked for jobs, politely clarify your role." : "When the user explicitly asks for jobs or career opportunities, reference the jobs listed below. If they just say 'hi' or make small talk, respond conversationally without bringing up jobs."}
2. DO NOT invent or hallucinate facts.
${userRole !== "employer" ? "3. DO NOT hallucinate job listings. Only mention jobs explicitly listed in the context below.\n4. If the user asks for jobs and none are listed, inform the user that no jobs are currently available." : ""}

Be professional, encouraging, and concise.${resumeContext}${userRole !== "employer" ? jobContext : ""}`;

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
        metadata.usage?.total_tokens,
        metadata,
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
