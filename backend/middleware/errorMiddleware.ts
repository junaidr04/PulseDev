import { Request, Response, NextFunction } from 'express';

/**
 * 404 Route Not Found Handler
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Resource endpoint not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/** Log internal failures for operators while returning a safe, predictable API response. */
export const sendServerError = (res: Response, error: unknown, context: string) => {
  console.error(`[${context}]`, error);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again.',
  });
};

/**
 * Centralized Production Error Handler
 * Standardizes API error responses across the entire fullstack system.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = statusCode >= 500
    ? 'Something went wrong. Please try again.'
    : err.message || 'The request could not be completed.';

  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'The request body is not valid JSON.';
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'The requested resource could not be found.';
  }

  // Handle Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    message = 'A record with that value already exists.';
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((val: any) => val.message)
      .join(', ');
  }

  // Handle JSON Web Token Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token signature.';
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    stack: null,
  });
};
