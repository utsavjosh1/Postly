import { Router } from 'express';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint - Coming soon' });
});

// POST /api/v1/auth/login
router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - Coming soon' });
});

// POST /api/v1/auth/refresh
router.post('/refresh', (req, res) => {
  res.json({ message: 'Refresh token endpoint - Coming soon' });
});

// GET /api/v1/auth/me
router.get('/me', (req, res) => {
  res.json({ message: 'Get current user - Coming soon' });
});

export default router;
