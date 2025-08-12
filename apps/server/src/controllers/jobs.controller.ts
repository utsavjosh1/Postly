import type { Request, Response } from "express";
import prisma from "../config/prisma";
import ApiResponse from "../utils/ApiResponse";
import ApiError from "../utils/ApiError";
import { asyncHandler } from "../middlewares/error.middleware";

interface JobsQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  workType?: string;
  seniorityLevel?: string;
  category?: string;
  skills?: string;
  salaryMin?: string;
  salaryMax?: string;
  location?: string;
}

class Jobs {
  /**
   * Get all jobs with filtering, pagination, and search
   */
  static getAllJobs = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = '1',
      limit = '20',
      search,
      workType,
      seniorityLevel,
      category,
      skills,
      salaryMin,
      salaryMax,
      location
    } = req.query as JobsQueryParams;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for filtering
    const where: Record<string, unknown> = {};

    // Text search across title, description, and company name
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Work type filter
    if (workType) {
      where.workType = workType.toUpperCase();
    }

    // Seniority level filter
    if (seniorityLevel) {
      where.seniorityLevel = seniorityLevel.toUpperCase();
    }

    // Category filter
    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    // Skills filter
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      where.skills = {
        some: {
          skill: {
            name: { in: skillArray, mode: 'insensitive' }
          }
        }
      };
    }

    // Salary range filter
    if (salaryMin || salaryMax) {
      if (!where.AND) {
        where.AND = [];
      }
      const andArray = where.AND as unknown[];
      
      if (salaryMin) {
        andArray.push({
          OR: [
            { salaryMin: { gte: parseInt(salaryMin) } },
            { salaryMax: { gte: parseInt(salaryMin) } }
          ]
        });
      }
      
      if (salaryMax) {
        andArray.push({
          OR: [
            { salaryMin: { lte: parseInt(salaryMax) } },
            { salaryMax: { lte: parseInt(salaryMax) } }
          ]
        });
      }
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Execute queries
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              website: true,
              industry: true,
              employees: true,
              logo: true
            }
          },
          skills: {
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  category: true
                }
              }
            }
          }
        },
        orderBy: [
          { postedDate: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.job.count({ where })
    ]);

    // Transform the response to include skills as a flat array
    const transformedJobs = jobs.map(job => ({
      ...job,
      skills: job.skills.map(js => js.skill)
    }));

    const response = search 
      ? ApiResponse.search(transformedJobs, search, pageNum, limitNum, total, {
          workType,
          seniorityLevel,
          category,
          skills,
          location,
          salaryRange: salaryMin || salaryMax ? { min: salaryMin, max: salaryMax } : undefined
        })
      : ApiResponse.paginated(transformedJobs, pageNum, limitNum, total);

    res.status(200).json(response);
  });

  /**
   * Get a single job by ID
   */
  static getJobById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest('Job ID is required');
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
        skills: {
          include: {
            skill: true
          }
        }
      }
    });

    if (!job) {
      throw ApiError.notFound('Job not found');
    }

    // Transform skills to flat array
    const transformedJob = {
      ...job,
      skills: job.skills.map(js => js.skill)
    };

    res.status(200).json(ApiResponse.single(transformedJob));
  });

  /**
   * Get job statistics
   */
  static getJobStats = asyncHandler(async (req: Request, res: Response) => {
    const [
      totalJobs,
      workTypeStats,
      seniorityStats,
      categoryStats,
      recentJobs
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.groupBy({
        by: ['workType'],
        _count: true
      }),
      prisma.job.groupBy({
        by: ['seniorityLevel'],
        _count: true,
        where: { seniorityLevel: { not: null } }
      }),
      prisma.job.groupBy({
        by: ['category'],
        _count: true,
        where: { category: { not: null } },
        orderBy: { _count: { category: 'desc' } },
        take: 10
      }),
      prisma.job.count({
        where: {
          postedDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    const stats = {
      totalJobs,
      recentJobs,
      workTypeDistribution: workTypeStats.reduce((acc, item) => {
        acc[item.workType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      seniorityDistribution: seniorityStats.reduce((acc, item) => {
        if (item.seniorityLevel) {
          acc[item.seniorityLevel] = item._count;
        }
        return acc;
      }, {} as Record<string, number>),
      topCategories: categoryStats.map(item => ({
        category: item.category,
        count: item._count
      }))
    };

    res.status(200).json(ApiResponse.success(stats, 'Job statistics retrieved successfully'));
  });
}

export default Jobs;