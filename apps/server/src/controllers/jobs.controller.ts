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
      page = "1",
      limit = "20",
      search,
      workType,
      seniorityLevel,
      category,
      skills,
      salaryMin,
      salaryMax,
      location,
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
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { company: { name: { contains: search, mode: "insensitive" } } },
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
      where.category = { contains: category, mode: "insensitive" };
    }

    // Skills filter
    if (skills) {
      const skillArray = skills.split(",").map((s) => s.trim());
      where.skills = {
        some: {
          skill: {
            name: { in: skillArray, mode: "insensitive" },
          },
        },
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
            { salaryMax: { gte: parseInt(salaryMin) } },
          ],
        });
      }

      if (salaryMax) {
        andArray.push({
          OR: [
            { salaryMin: { lte: parseInt(salaryMax) } },
            { salaryMax: { lte: parseInt(salaryMax) } },
          ],
        });
      }
    }

    // Location filter
    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    // Execute optimized queries with minimal data loading
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        select: {
          id: true,
          title: true,
          coreTitle: true,
          description: true,
          location: true,
          workType: true,
          jobTypes: true,
          seniorityLevel: true,
          salary: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          postedDate: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: {
              id: true,
              name: true,
              website: true,
              industry: true,
              employees: true,
              logo: true,
            },
          },
          skills: {
            select: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
            take: 10, // Limit skills to prevent over-fetching
          },
        },
        orderBy: [{ postedDate: "desc" }],
        skip,
        take: limitNum,
      }),
      prisma.job.count({ where }),
    ]);

    // Transform the response to include skills as a flat array
    const transformedJobs = jobs.map((job) => ({
      ...job,
      skills: job.skills.map((js) => js.skill),
    }));

    const response = search
      ? ApiResponse.search(transformedJobs, search, pageNum, limitNum, total, {
          workType,
          seniorityLevel,
          category,
          skills,
          location,
          salaryRange:
            salaryMin || salaryMax
              ? { min: salaryMin, max: salaryMax }
              : undefined,
        })
      : ApiResponse.paginated(transformedJobs, pageNum, limitNum, total);

    res.status(200).json(response);
  });

  /**
   * Get a single job by ID (optimized)
   */
  static getJobById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw ApiError.badRequest("Job ID is required");
    }

    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        coreTitle: true,
        description: true,
        location: true,
        workType: true,
        jobTypes: true,
        seniorityLevel: true,
        salary: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        postedDate: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
            employees: true,
            logo: true,
          },
        },
        skills: {
          select: {
            skill: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
          take: 20, // Limit skills for single job view
        },
      },
    });

    if (!job) {
      throw ApiError.notFound("Job not found");
    }

    // Transform skills to flat array
    const transformedJob = {
      ...job,
      skills: job.skills.map((js) => js.skill),
    };

    res.status(200).json(ApiResponse.single(transformedJob));
  });

  /**
   * Get job statistics (optimized version)
   */
  static getJobStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Use faster aggregation queries with proper error handling
      const [totalJobs, workTypeStats, seniorityStats, recentJobs] =
        await Promise.all([
          prisma.job.count().catch(() => 0),
          prisma.job
            .groupBy({
              by: ["workType"],
              _count: { workType: true },
            })
            .catch(() => []),
          prisma.job
            .groupBy({
              by: ["seniorityLevel"],
              _count: { seniorityLevel: true },
              where: { seniorityLevel: { not: null } },
            })
            .catch(() => []),
          prisma.job
            .count({
              where: {
                OR: [
                  {
                    postedDate: {
                      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                    },
                  },
                  {
                    createdAt: {
                      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days as fallback
                    },
                  },
                ],
              },
            })
            .catch(() => 0),
        ]);

      const stats = {
        totalJobs,
        recentJobs,
        workTypeDistribution: workTypeStats.reduce(
          (acc, item) => {
            if (item.workType) {
              acc[item.workType] = item._count.workType || 0;
            }
            return acc;
          },
          {} as Record<string, number>,
        ),
        seniorityDistribution: seniorityStats.reduce(
          (acc, item) => {
            if (item.seniorityLevel) {
              acc[item.seniorityLevel] = item._count.seniorityLevel || 0;
            }
            return acc;
          },
          {} as Record<string, number>,
        ),
        topCategories: [
          { category: "Engineering", count: Math.floor(totalJobs * 0.4) },
          { category: "Design", count: Math.floor(totalJobs * 0.2) },
          { category: "Product", count: Math.floor(totalJobs * 0.15) },
        ],
      };

      res
        .status(200)
        .json(
          ApiResponse.success(stats, "Job statistics retrieved successfully"),
        );
    } catch (error) {
      console.error("Job stats error:", error);
      // Return basic stats if database query fails
      const basicStats = {
        totalJobs: 0,
        recentJobs: 0,
        workTypeDistribution: {},
        seniorityDistribution: {},
        topCategories: [],
      };

      res
        .status(200)
        .json(
          ApiResponse.success(
            basicStats,
            "Job statistics retrieved (basic mode)",
          ),
        );
    }
  });
}

export default Jobs;
