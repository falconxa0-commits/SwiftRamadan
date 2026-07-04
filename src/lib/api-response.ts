/**
 * Standard API response helpers for consistent response formatting across all routes.
 *
 * Usage:
 * ```ts
 * return apiSuccess({ user })
 * return apiCreated({ product })
 * return apiError('Not found', 404)
 * return apiValidationError({ email: ['Invalid email'] })
 * ```
 */

import { NextResponse } from 'next/server';

interface SuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * 200 OK with optional data and message
 */
export function apiSuccess<T>(data?: T, message?: string, status: number = 200): NextResponse {
  const body: SuccessResponse<T> = { success: true };
  if (data !== undefined) body.data = data;
  if (message) body.message = message;
  return NextResponse.json(body, { status });
}

/**
 * 201 Created
 */
export function apiCreated<T>(data?: T, message?: string): NextResponse {
  return apiSuccess(data, message || 'Created successfully', 201);
}

/**
 * Error response with appropriate status code
 */
export function apiError(message: string, status: number = 400): NextResponse {
  const body: ErrorResponse = { success: false, message };
  return NextResponse.json(body, { status });
}

/**
 * 400 Bad Request with field-level errors
 */
export function apiValidationError(errors: Record<string, string[]>, message: string = 'Validation error'): NextResponse {
  const body: ErrorResponse = { success: false, message, errors };
  return NextResponse.json(body, { status: 400 });
}

/**
 * 401 Unauthorized
 */
export function apiUnauthorized(message: string = 'Authentication required'): NextResponse {
  return apiError(message, 401);
}

/**
 * 403 Forbidden
 */
export function apiForbidden(message: string = 'You do not have permission to perform this action'): NextResponse {
  return apiError(message, 403);
}

/**
 * 404 Not Found
 */
export function apiNotFound(message: string = 'Resource not found'): NextResponse {
  return apiError(message, 404);
}

/**
 * 429 Too Many Requests
 */
export function apiRateLimited(retryAfter?: number): NextResponse {
  const body: ErrorResponse = { success: false, message: 'Too many requests. Please try again later.' };
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (retryAfter) headers['Retry-After'] = String(retryAfter);
  return NextResponse.json(body, { status: 429, headers });
}

/**
 * 500 Internal Server Error
 */
export function apiServerError(message: string = 'An internal error occurred'): NextResponse {
  return apiError(message, 500);
}
