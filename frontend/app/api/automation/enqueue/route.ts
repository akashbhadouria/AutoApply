import { NextRequest, NextResponse } from "next/server";

import { enqueueAutomationJob } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      queueName: "job-scanner" | "referral-engine" | "application-queue" | "browser-automation" | "notifications";
      payload: Record<string, unknown>;
    };
    const data = await enqueueAutomationJob(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
