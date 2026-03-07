import { NextResponse } from "next/server";

import { fetchApplyAttemptsByJobId } from "@/lib/api";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const data = await fetchApplyAttemptsByJobId(Number(jobId));
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
