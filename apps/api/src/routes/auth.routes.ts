import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { userQueries } from '@postly/database';
import { authenticateToken } from '../middleware/auth';
import type { AuthResponse } from '@postly/shared-types';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1, 'Full name is required').optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

// POST /api/v1/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { message: validation.error.errors[0].message },
      });
    }

    const { email, password, full_name } = validation.data;

    // Check if user already exists
    const existingUser = await userQueries.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { message: 'User with this email already exists' },
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await userQueries.create({
      email,
      password_hash,
      full_name,
    });

    // Generate tokens
    const access_token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refresh_token = jwt.sign(
      { id: user.id, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      access_token,
      refresh_token,
    };

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { message: validation.error.errors[0].message },
      });
    }

    const { email, password } = validation.data;

    // Find user
    const user = await userQueries.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' },
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' },
      });
    }

    // Generate tokens
    const access_token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refresh_token = jwt.sign(
      { id: user.id, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      access_token,
      refresh_token,
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const validation = refreshSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { message: validation.error.errors[0].message },
      });
    }

    const { refresh_token } = validation.data;

    // Verify refresh token
    let decoded: { id: string; type: string };
    try {
      decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as { id: string; type: string };
    } catch {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired refresh token' },
      });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token type' },
      });
    }

    // Get user
    const user = await userQueries.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    // Generate new access token
    const access_token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: { access_token },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await userQueries.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
