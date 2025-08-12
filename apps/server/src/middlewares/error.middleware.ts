import type { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';

/**
 * Type for async route handlers
 */
type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * Global error handling middleware
 * Should be placed after all routes
 */
const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response
): void => {
  let apiError: ApiError;

  // Check if it's already an ApiError
  if (error instanceof ApiError) {
    apiError = error;
  } else {
    // Convert generic errors to ApiError
    const statusCode = 500;
    const message = error.message || 'Internal Server Error';
    apiError = new ApiError(statusCode, message, [], false, error.stack);
  }

  // Log error for debugging (only in development or for server errors)
  if (process.env.NODE_ENV === 'development' || apiError.statusCode >= 500) {
    console.error('API Error:', {
      statusCode: apiError.statusCode,
      message: apiError.message,
      errors: apiError.errors,
      stack: apiError.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // Send error response
  res.status(apiError.statusCode).json(apiError.toJSON());
};

/**
 * Middleware to catch async errors
 * Wraps async route handlers to catch promise rejections
 */
const asyncHandler = (fn: AsyncRouteHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware to handle 404 errors
 * Should be placed after all routes but before error handler
 */
const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

export { errorHandler, asyncHandler, notFoundHandler };
