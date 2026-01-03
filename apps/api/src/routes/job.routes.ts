import { Router } from 'express';

const router = Router();

// GET /api/v1/jobs
router.get('/', (req, res) => {
  res.json({ message: 'Get jobs - Coming soon' });
});

// GET /api/v1/jobs/:id
router.get('/:id', (req, res) => {
  res.json({ message: `Get job ${req.params.id} - Coming soon` });
});

// POST /api/v1/jobs (for employers)
router.post('/', (req, res) => {
  res.json({ message: 'Create job - Coming soon' });
});

export default router;
