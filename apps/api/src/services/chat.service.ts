import { streamTextWithMeta, generateText } from "@postly/ai-utils";
import { conversationQueries, resumeQueries } from "@postly/database";
import type {
  StreamChatResponse,
  MessageMetadata,
  Message,
} from "@postly/shared-types";

export class ChatService {
  /**
   * Stream AI response with Server-Sent Events
   */
  async *streamChatResponse(
    conversationId: string,
    userId: string,
    userMessage: string,
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

      // 3. Load resume context if available
      let resumeContext = "";
      if (conversation.resume_id) {
        const resume = await resumeQueries.findById(conversation.resume_id);
        if (resume?.parsed_text) {
          resumeContext = `\n\nUser's Resume Summary:\n${resume.parsed_text.substring(0, 2000)}`;
        }
      }

      // 4. Build system prompt
      const systemPrompt = `You are an AI career assistant helping with resume analysis and job search.

Your capabilities:
- Analyze resumes and provide constructive feedback
- Suggest relevant job opportunities
- Offer career advice and interview tips
- Help with job applications

Be professional, encouraging, and specific in your responses.${resumeContext}`;

      // 5. Prepare conversation history
      const conversationHistory = messages
        .filter((m: Message) => m.role !== "system")
        .map((m: Message) => `${m.role}: ${m.content}`)
        .join("\n");

      const fullPrompt = `${systemPrompt}\n\nConversation:\n${conversationHistory}\nuser: ${userMessage}\nassistant:`;

      // 6. Stream AI response
      let fullResponse = "";
      let metadata: MessageMetadata = {};
      const stream = await streamTextWithMeta(fullPrompt);

      for await (const chunk of stream) {
        if (chunk.text) {
          fullResponse += chunk.text;
          yield { type: "chunk", content: chunk.text };
        }
        if (chunk.usage) {
          metadata.usage = {
            prompt_tokens: chunk.usage.promptTokenCount || 0,
            completion_tokens: chunk.usage.candidatesTokenCount || 0,
            total_tokens: chunk.usage.totalTokenCount || 0,
          };
        }
      }

      // 7. Save assistant message to database
      const savedMsg = await conversationQueries.createMessage(
        conversationId,
        "assistant",
        fullResponse,
        metadata,
      );

      // 8. Auto-generate conversation title if this is the first message
      if (messages.length === 0) {
        const titlePrompt = `Generate a short 3-5 word title for this conversation. User's first message: "${userMessage}". Return ONLY the title, no quotes or explanation.`;
        const title = await generateText(titlePrompt);
        await conversationQueries.updateTitle(
          conversationId,
          title.trim().substring(0, 50),
        );
      }

      // 9. Send completion event
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
