import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { resumeService } from '../services/resume.service.js';

const router = Router();

// Configure multer for memory storage (we'll process the buffer directly)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
    }
  },
});

// All resume routes require authentication
router.use(authenticateToken);

/**
 * POST /api/v1/resumes/upload
 * Upload and process a new resume
 */
router.post('/upload', upload.single('resume'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' },
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
      return;
    }

    // For now, we'll store the file URL as a placeholder
    // In production, you'd upload to S3/GCS and get a real URL
    const fileUrl = `uploads/${req.user.id}/${Date.now()}-${req.file.originalname}`;

    const resume = await resumeService.processResume(
      req.user.id,
      fileUrl,
      req.file.buffer,
      req.file.mimetype
    );

    res.status(201).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to upload resume',
      },
    });
  }
});

/**
 * GET /api/v1/resumes
 * Get all resumes for the authenticated user
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
      return;
    }

    const resumes = await resumeService.getUserResumes(req.user.id);

    res.json({
      success: true,
      data: resumes,
    });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get resumes',
      },
    });
  }
});

/**
 * GET /api/v1/resumes/:id
 * Get a specific resume by ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
      return;
    }

    const resume = await resumeService.getResumeById(req.params.id, req.user.id);

    if (!resume) {
      res.status(404).json({
        success: false,
        error: { message: 'Resume not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: resume,
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get resume',
      },
    });
  }
});

/**
 * DELETE /api/v1/resumes/:id
 * Delete a resume
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
      return;
    }

    const deleted = await resumeService.deleteResume(req.params.id, req.user.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { message: 'Resume not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { message: 'Resume deleted successfully' },
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete resume',
      },
    });
  }
});

/**
 * POST /api/v1/resumes/:id/reanalyze
 * Re-analyze an existing resume
 */
router.post('/:id/reanalyze', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' },
      });
      return;
    }

    const resume = await resumeService.reanalyzeResume(req.params.id, req.user.id);

    if (!resume) {
      res.status(404).json({
        success: false,
        error: { message: 'Resume not found or has no parsed text' },
      });
      return;
    }

    res.json({
      success: true,
      data: resume,
    });
  } catch (error) {
    console.error('Reanalyze resume error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to reanalyze resume',
      },
    });
  }
});

export default router;
