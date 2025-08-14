/**
 * Types for API responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

/**
 * Utility class for consistent API response formatting
 */
class ApiResponse {
  /**
   * Create a successful response
   */
  static success<T>(
    data: T,
    message?: string,
    meta?: PaginationMeta,
  ): ApiSuccessResponse<T> {
    return {
      success: true,
      ...(message && { message }),
      data,
      ...(meta && { meta }),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a paginated response
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string,
  ): ApiSuccessResponse<T[]> {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };

    return this.success(data, message, meta);
  }

  /**
   * Create a response for created resources (201)
   */
  static created<T>(
    data: T,
    message: string = "Resource created successfully",
  ): ApiSuccessResponse<T> {
    return this.success(data, message);
  }

  /**
   * Create a response for updated resources (200)
   */
  static updated<T>(
    data: T,
    message: string = "Resource updated successfully",
  ): ApiSuccessResponse<T> {
    return this.success(data, message);
  }

  /**
   * Create a response for deleted resources (200)
   */
  static deleted(
    message: string = "Resource deleted successfully",
  ): ApiSuccessResponse<null> {
    return this.success(null, message);
  }

  /**
   * Create a response with no content (204) - rarely used in JSON APIs
   */
  static noContent(): ApiSuccessResponse<null> {
    return this.success(null);
  }

  /**
   * Create a response for list/collection endpoints
   */
  static list<T>(data: T[], message?: string): ApiSuccessResponse<T[]> {
    return this.success(data, message || `Retrieved ${data.length} items`);
  }

  /**
   * Create a response for single resource endpoints
   */
  static single<T>(data: T, message?: string): ApiSuccessResponse<T> {
    return this.success(data, message || "Resource retrieved successfully");
  }

  /**
   * Create a search response with search metadata
   */
  static search<T>(
    data: T[],
    query: string,
    page: number = 1,
    limit: number = 10,
    total: number,
    filters?: Record<string, unknown>,
  ): ApiSuccessResponse<T[]> & {
    searchMeta: { query: string; filters?: Record<string, unknown> };
  } {
    const response = this.paginated(
      data,
      page,
      limit,
      total,
      `Found ${total} results for "${query}"`,
    );

    return {
      ...response,
      searchMeta: {
        query,
        ...(filters && { filters }),
      },
    };
  }

  /**
   * Create a response with custom metadata
   */
  static withMeta<T>(
    data: T,
    meta: Record<string, unknown>,
    message?: string,
  ): ApiSuccessResponse<T> & { customMeta: Record<string, unknown> } {
    const response = this.success(data, message);

    return {
      ...response,
      customMeta: meta,
    };
  }
}

export default ApiResponse;
