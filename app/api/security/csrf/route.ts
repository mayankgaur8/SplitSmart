import { NextResponse } from "next/server";
import { attachCsrfCookie, createCsrfToken } from "@/lib/csrf";

export async function GET() {
  const token = createCsrfToken();
  const response = NextResponse.json({ csrfToken: token });
  attachCsrfCookie(response, token);
  return response;
}
