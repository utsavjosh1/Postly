import { Router } from 'express';
import { ChatService } from '../services/chat.service';
import { conversationQueries } from '@postly/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const chatService = new ChatService();

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
router.get('/conversations/:id', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const conversation = await conversationQueries.findById(id, userId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' },
      });
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
router.delete('/conversations/:id', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const deleted = await conversationQueries.delete(id, userId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' },
      });
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
router.post('/stream', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { message, conversation_id } = req.body;

    if (!message || !conversation_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'message and conversation_id are required' },
      });
    }

    // Verify conversation belongs to user
    const conversation = await conversationQueries.findById(conversation_id, userId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Conversation not found' },
      });
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
