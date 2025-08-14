/**
 * Types for error handling
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    statusCode: number;
    message: string;
    errors?: ValidationError[];
    stack?: string;
  };
}

/**
 * Custom API Error class for consistent error handling
 */
class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors: ValidationError[];
  public stack?: string;

  constructor(
    statusCode: number,
    message: string,
    errors: ValidationError[] = [],
    isOperational: boolean = true,
    stack: string = "",
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Create a Bad Request error (400)
   */
  static badRequest(
    message: string = "Bad Request",
    errors: ValidationError[] = [],
  ): ApiError {
    return new ApiError(400, message, errors);
  }

  /**
   * Create an Unauthorized error (401)
   */
  static unauthorized(message: string = "Unauthorized"): ApiError {
    return new ApiError(401, message);
  }

  /**
   * Create a Forbidden error (403)
   */
  static forbidden(message: string = "Forbidden"): ApiError {
    return new ApiError(403, message);
  }

  /**
   * Create a Not Found error (404)
   */
  static notFound(message: string = "Resource not found"): ApiError {
    return new ApiError(404, message);
  }

  /**
   * Create a Conflict error (409)
   */
  static conflict(message: string = "Resource already exists"): ApiError {
    return new ApiError(409, message);
  }

  /**
   * Create an Unprocessable Entity error (422)
   */
  static unprocessableEntity(
    message: string = "Validation failed",
    errors: ValidationError[] = [],
  ): ApiError {
    return new ApiError(422, message, errors);
  }

  /**
   * Create a Too Many Requests error (429)
   */
  static tooManyRequests(message: string = "Too many requests"): ApiError {
    return new ApiError(429, message);
  }

  /**
   * Create an Internal Server error (500)
   */
  static internal(message: string = "Internal server error"): ApiError {
    return new ApiError(500, message, [], false);
  }

  /**
   * Create a Service Unavailable error (503)
   */
  static serviceUnavailable(
    message: string = "Service temporarily unavailable",
  ): ApiError {
    return new ApiError(503, message);
  }

  /**
   * Create error from validation results
   */
  static fromValidation(
    errors: ValidationError[],
    message: string = "Validation failed",
  ): ApiError {
    return new ApiError(422, message, errors);
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): ApiErrorResponse {
    return {
      success: false,
      error: {
        statusCode: this.statusCode,
        message: this.message,
        ...(this.errors.length > 0 && { errors: this.errors }),
        ...(process.env.NODE_ENV === "development" && { stack: this.stack }),
      },
    };
  }
}

export default ApiError;
