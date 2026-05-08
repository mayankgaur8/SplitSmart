import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: { page?: number; limit?: number; total?: number; hasNext?: boolean };
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
};

export function ok<T>(
  data: T,
  meta?: ApiSuccess<T>["meta"],
  status = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) }, { status });
}

export function created<T>(data: T): NextResponse<ApiSuccess<T>> {
  return ok(data, undefined, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function apiError(
  message: string,
  status = 400,
  code?: string,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: message, ...(code ? { code } : {}), ...(details ? { details } : {}) },
    { status }
  );
}

export function handleError(err: unknown): NextResponse<ApiError> {
  if (err instanceof AuthError) {
    return apiError(err.message, err.statusCode);
  }
  if (err instanceof ZodError) {
    return apiError(
      "Validation failed",
      422,
      "VALIDATION_ERROR",
      err.flatten().fieldErrors
    );
  }
  if (err instanceof Error) {
    const statusCode = (err as Error & { statusCode?: number }).statusCode;
    const code = (err as Error & { code?: string }).code;
    if (statusCode) {
      return apiError(err.message, statusCode, code);
    }
    const isPrisma = err.constructor.name.startsWith("Prisma");
    if (isPrisma) {
      // Don't leak DB internals
      console.error("[DB Error]", err.message);
      return apiError("Database error", 500, "DB_ERROR");
    }
    console.error("[API Error]", err.message);
    return apiError(err.message || "Internal server error", 500);
  }
  return apiError("Internal server error", 500);
}
