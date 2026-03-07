import { NextRequest, NextResponse } from "next/server";

import { fetchRecentJobDiscoveryEvents } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchRecentJobDiscoveryEvents({
      limit: request.nextUrl.searchParams.get("limit")
        ? Number(request.nextUrl.searchParams.get("limit"))
        : undefined,
      eventType:
        request.nextUrl.searchParams.get("eventType") === "job_discovered" ||
        request.nextUrl.searchParams.get("eventType") === "fresh_job_detected"
          ? (request.nextUrl.searchParams.get("eventType") as "job_discovered" | "fresh_job_detected")
          : undefined,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
