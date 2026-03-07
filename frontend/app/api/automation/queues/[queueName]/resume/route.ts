import { NextResponse } from "next/server";

import { resumeAutomationQueue } from "@/lib/api";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ queueName: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { queueName } = await context.params;
    const data = await resumeAutomationQueue(queueName);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
