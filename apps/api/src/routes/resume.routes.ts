import { Router } from 'express';

const router = Router();

// POST /api/v1/resumes/upload
router.post('/upload', (_req, res) => {
  res.json({ message: 'Upload resume - Coming soon' });
});

// GET /api/v1/resumes
router.get('/', (_req, res) => {
  res.json({ message: 'Get user resumes - Coming soon' });
});

// GET /api/v1/resumes/:id
router.get('/:id', (req, res) => {
  res.json({ message: `Get resume ${req.params.id} - Coming soon` });
});

export default router;
