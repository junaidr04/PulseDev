import { Request, Response, NextFunction } from 'express';

/**
 * 404 Route Not Found Handler
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Resource endpoint not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized Production Error Handler
 * Standardizes API error responses across the entire fullstack system.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = `MongoDB Resource not found with ID of: ${err.value}`;
  }

  // Handle Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate field value entered for '${field}'. Must be unique.`;
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
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export const rawErrorMiddlewareCode = `
export const notFound = (req, res, next) => {
  const error = new Error(\`Not Found - \${req.originalUrl}\`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
`.trim();
