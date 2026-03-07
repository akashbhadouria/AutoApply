import { NextRequest, NextResponse } from "next/server";

import { fetchApplyAttempts } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchApplyAttempts({
      limit: request.nextUrl.searchParams.get("limit")
        ? Number(request.nextUrl.searchParams.get("limit"))
        : undefined,
      status:
        request.nextUrl.searchParams.get("status") === "queued" ||
        request.nextUrl.searchParams.get("status") === "submitted" ||
        request.nextUrl.searchParams.get("status") === "failed" ||
        request.nextUrl.searchParams.get("status") === "unsupported"
          ? (request.nextUrl.searchParams.get("status") as "queued" | "submitted" | "failed" | "unsupported")
          : undefined,
      strategy:
        request.nextUrl.searchParams.get("strategy") === "api" ||
        request.nextUrl.searchParams.get("strategy") === "http_form" ||
        request.nextUrl.searchParams.get("strategy") === "browser"
          ? (request.nextUrl.searchParams.get("strategy") as "api" | "http_form" | "browser")
          : undefined,
      provider: request.nextUrl.searchParams.get("provider") || undefined,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
