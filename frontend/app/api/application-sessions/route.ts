import { NextRequest, NextResponse } from "next/server";

import { fetchApplicationSessions, upsertApplicationSession } from "@/lib/api";

export async function GET() {
  try {
    const data = await fetchApplicationSessions();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      jobId: number;
      formUrl: string;
      filledFields: Record<string, string>;
      missingField: string;
      status: "paused" | "ready_to_resume" | "completed";
    };
    const data = await upsertApplicationSession(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
