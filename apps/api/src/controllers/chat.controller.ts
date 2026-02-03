import { Request, Response, NextFunction } from "express";
import { ChatService } from "../services/chat.service.js";
import { conversationQueries } from "@postly/database";

import type { User } from "@postly/shared-types";

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  // GET /api/v1/chat/conversations
  getConversations = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = (req.user as User).id;
      const conversations = await conversationQueries.findByUser(userId);

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/chat/conversations
  createConversation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = (req.user as User).id;
      const { resume_id, initial_message } = req.body;

      const conversation = await conversationQueries.create(userId, resume_id);

      if (initial_message) {
        await conversationQueries.createMessage(
          conversation.id,
          "user",
          initial_message,
        );
      }

      res.status(201).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/chat/conversations/:id
  getConversationById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = (req.user as User).id;
      const { id } = req.params;

      const conversation = await conversationQueries.findById(id, userId);
      if (!conversation) {
        res.status(404).json({
          success: false,
          error: { message: "Conversation not found" },
        });
        return;
      }

      const messages = await conversationQueries.getMessages(id);

      res.json({
        success: true,
        data: {
          conversation,
          messages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/v1/chat/conversations/:id
  deleteConversation = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = (req.user as User).id;
      const { id } = req.params;

      const deleted = await conversationQueries.delete(id, userId);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { message: "Conversation not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: { id },
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/chat/stream
  streamResponse = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = (req.user as User).id;
      const { message, conversation_id } = req.body;

      if (!message || !conversation_id) {
        res.status(400).json({
          success: false,
          error: { message: "message and conversation_id are required" },
        });
        return;
      }

      const conversation = await conversationQueries.findById(
        conversation_id,
        userId,
      );
      if (!conversation) {
        res.status(404).json({
          success: false,
          error: { message: "Conversation not found" },
        });
        return;
      }

      // Set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");

      const stream = this.chatService.streamChatResponse(
        conversation_id,
        userId,
        message,
      );

      for await (const event of stream) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      next(error);
    }
  };
}
