import { Router } from 'express';

const router = Router();

// GET /api/v1/users/profile
router.get('/profile', (req, res) => {
  res.json({ message: 'Get user profile - Coming soon' });
});

// PATCH /api/v1/users/profile
router.patch('/profile', (req, res) => {
  res.json({ message: 'Update user profile - Coming soon' });
});

export default router;
