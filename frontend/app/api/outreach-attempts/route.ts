import { NextRequest, NextResponse } from "next/server";

import { createOutreachAttempt, fetchOutreachAttempts } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchOutreachAttempts({
      limit: request.nextUrl.searchParams.get("limit")
        ? Number(request.nextUrl.searchParams.get("limit"))
        : undefined,
      approvalStatus:
        request.nextUrl.searchParams.get("approvalStatus") === "pending_approval" ||
        request.nextUrl.searchParams.get("approvalStatus") === "approved" ||
        request.nextUrl.searchParams.get("approvalStatus") === "rejected" ||
        request.nextUrl.searchParams.get("approvalStatus") === "not_required"
          ? (request.nextUrl.searchParams.get("approvalStatus") as "pending_approval" | "approved" | "rejected" | "not_required")
          : undefined,
      executionStatus:
        request.nextUrl.searchParams.get("executionStatus") === "drafted" ||
        request.nextUrl.searchParams.get("executionStatus") === "queued" ||
        request.nextUrl.searchParams.get("executionStatus") === "sent" ||
        request.nextUrl.searchParams.get("executionStatus") === "failed" ||
        request.nextUrl.searchParams.get("executionStatus") === "cancelled"
          ? (request.nextUrl.searchParams.get("executionStatus") as "drafted" | "queued" | "sent" | "failed" | "cancelled")
          : undefined,
      channel:
        request.nextUrl.searchParams.get("channel") === "linkedin" ||
        request.nextUrl.searchParams.get("channel") === "email" ||
        request.nextUrl.searchParams.get("channel") === "telegram" ||
        request.nextUrl.searchParams.get("channel") === "whatsapp"
          ? (request.nextUrl.searchParams.get("channel") as "linkedin" | "email" | "telegram" | "whatsapp")
          : undefined,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await createOutreachAttempt(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
