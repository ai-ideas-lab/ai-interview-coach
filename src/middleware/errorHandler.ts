import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  success?: boolean;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const success = error.success || false;

  // Log error
  console.error('Error occurred:', {
    error: error,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({
      success,
      message: statusCode === 500 ? 'Internal Server Error' : message,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(statusCode).json({
      success,
      message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.success = false;
  error.isOperational = true;
  return error;
};