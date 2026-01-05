import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { ChatService } from '../services/chat.service.js';
import { conversationQueries } from '@postly/database';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const chatService = new ChatService();

// Rate limit for AI chat - 10 requests per minute per user
const chatStreamLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many chat requests, please wait a moment' },
  },
});

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/v1/chat/conversations
 * Get all conversations for the authenticated user
 */
router.get('/conversations', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const conversations = await conversationQueries.findByUser(userId);

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/chat/conversations
 * Create a new conversation
 */
router.post('/conversations', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { resume_id, initial_message } = req.body;

    const conversation = await conversationQueries.create(userId, resume_id);

    // If initial message provided, create it
    if (initial_message) {
      await conversationQueries.createMessage(conversation.id, 'user', initial_message);
    }

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/chat/conversations/:id
 * Get a single conversation with all messages
 */
router.get('/conversations/:id', async (req, res, next): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const conversation = await conversationQueries.findById(id, userId);
    if (!conversation) {
      res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' },
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
});

/**
 * DELETE /api/v1/chat/conversations/:id
 * Delete a conversation
 */
router.delete('/conversations/:id', async (req, res, next): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const deleted = await conversationQueries.delete(id, userId);
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' },
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
});

/**
 * POST /api/v1/chat/stream
 * Stream AI chat response using Server-Sent Events
 */
router.post('/stream', chatStreamLimiter, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { message, conversation_id } = req.body;

    if (!message || !conversation_id) {
      res.status(400).json({
        success: false,
        error: { message: 'message and conversation_id are required' },
      });
      return;
    }

    // Verify conversation belongs to user
    const conversation = await conversationQueries.findById(conversation_id, userId);
    if (!conversation) {
      res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' },
      });
      return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Stream AI response
    const stream = chatService.streamChatResponse(conversation_id, userId, message);

    for await (const event of stream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    next(error);
  }
});

export default router;
