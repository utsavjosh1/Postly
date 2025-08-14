import type { ApiResponse, Job, JobStats } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface JobsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  workType?: string;
  seniorityLevel?: string;
  category?: string;
  skills?: string[];
  salaryMin?: number;
  salaryMax?: number;
  location?: string;
}

// Mock data for development/fallback
const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    coreTitle: 'Frontend Developer',
    description: 'We are looking for an experienced Frontend Developer to join our team.',
    location: 'San Francisco, CA',
    workType: 'REMOTE',
    jobTypes: ['FULL_TIME'],
    seniorityLevel: 'SENIOR_LEVEL',
    salary: '$120,000 - $160,000',
    salaryMin: 120000,
    salaryMax: 160000,
    salaryCurrency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    company: {
      id: '1',
      name: 'TechCorp',
      website: 'https://techcorp.com',
      industry: 'Technology',
      employees: 500,
      logo: 'https://via.placeholder.com/64x64?text=TC'
    },
    skills: [
      { id: '1', name: 'React', category: 'Frontend' },
      { id: '2', name: 'TypeScript', category: 'Programming' },
      { id: '3', name: 'Next.js', category: 'Framework' }
    ]
  },
  {
    id: '2',
    title: 'Backend Engineer',
    coreTitle: 'Backend Engineer',
    description: 'Join our backend team to build scalable APIs.',
    location: 'New York, NY',
    workType: 'HYBRID',
    jobTypes: ['FULL_TIME'],
    seniorityLevel: 'MID_LEVEL',
    salary: '$100,000 - $140,000',
    salaryMin: 100000,
    salaryMax: 140000,
    salaryCurrency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    company: {
      id: '2',
      name: 'DataSoft',
      website: 'https://datasoft.com',
      industry: 'Software',
      employees: 200,
      logo: 'https://via.placeholder.com/64x64?text=DS'
    },
    skills: [
      { id: '4', name: 'Node.js', category: 'Backend' },
      { id: '5', name: 'PostgreSQL', category: 'Database' },
      { id: '6', name: 'Docker', category: 'DevOps' }
    ]
  }
];

const MOCK_STATS: JobStats = {
  totalJobs: 125,
  recentJobs: 15,
  workTypeDistribution: {
    REMOTE: 60,
    HYBRID: 40,
    ONSITE: 25
  },
  seniorityDistribution: {
    ENTRY_LEVEL: 30,
    MID_LEVEL: 50,
    SENIOR_LEVEL: 35,
    STAFF_LEVEL: 10
  },
  topCategories: [
    { category: 'Engineering', count: 45 },
    { category: 'Design', count: 25 },
    { category: 'Product', count: 20 }
  ]
};

// Cache for API responses
const API_CACHE = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Request deduplication map
const PENDING_REQUESTS = new Map<string, Promise<unknown>>();

class JobsAPI {
  private static async fetchWithErrorHandling<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> {
    // Check cache first
    const cacheKey = url;
    const cached = API_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data as T;
    }

    // Check for pending request
    if (PENDING_REQUESTS.has(cacheKey)) {
      return PENDING_REQUESTS.get(cacheKey)! as Promise<T>;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const request = fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
      .then(async (response) => {
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Cache successful response
        API_CACHE.set(cacheKey, { data, timestamp: Date.now() });
        
        return data;
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error('API fetch error:', error);
        throw error;
      })
      .finally(() => {
        PENDING_REQUESTS.delete(cacheKey);
      });

    PENDING_REQUESTS.set(cacheKey, request);
    return request;
  }

  static async getJobs(params: JobsQueryParams = {}): Promise<ApiResponse<Job[]>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.workType) searchParams.set('workType', params.workType);
    if (params.seniorityLevel) searchParams.set('seniorityLevel', params.seniorityLevel);
    if (params.category) searchParams.set('category', params.category);
    if (params.skills?.length) searchParams.set('skills', params.skills.join(','));
    if (params.salaryMin) searchParams.set('salaryMin', params.salaryMin.toString());
    if (params.salaryMax) searchParams.set('salaryMax', params.salaryMax.toString());
    if (params.location) searchParams.set('location', params.location);

    const url = `${API_BASE_URL}/jobs?${searchParams.toString()}`;
    
    try {
      return await this.fetchWithErrorHandling<ApiResponse<Job[]>>(url);
    } catch (error) {
      console.warn('API unavailable, using mock data:', error);
      // Return mock data as fallback
      return {
        success: true,
        message: 'Mock data (API unavailable)',
        data: MOCK_JOBS,
        meta: {
          page: params.page || 1,
          limit: params.limit || 20,
          total: MOCK_JOBS.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };
    }
  }

  static async getJobById(id: string): Promise<ApiResponse<Job>> {
    const url = `${API_BASE_URL}/jobs/${id}`;
    try {
      return await this.fetchWithErrorHandling<ApiResponse<Job>>(url);
    } catch (error) {
      console.warn('API unavailable, using mock data for job:', id, error);
      const mockJob = MOCK_JOBS.find(job => job.id === id) || MOCK_JOBS[0];
      return {
        success: true,
        message: 'Mock data (API unavailable)',
        data: mockJob
      };
    }
  }

  static async getJobStats(): Promise<ApiResponse<JobStats>> {
    const url = `${API_BASE_URL}/jobs/stats`;
    try {
      return await this.fetchWithErrorHandling<ApiResponse<JobStats>>(url);
    } catch (error) {
      console.warn('API unavailable, using mock stats:', error);
      return {
        success: true,
        message: 'Mock data (API unavailable)',
        data: MOCK_STATS
      };
    }
  }
}

export default JobsAPI;
