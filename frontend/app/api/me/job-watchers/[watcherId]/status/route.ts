import { NextRequest, NextResponse } from "next/server";

import { updateJobFeedWatcherStatus } from "@/lib/api";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ watcherId: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { watcherId } = await context.params;
    const body = await request.json();
    const data = await updateJobFeedWatcherStatus(Number(watcherId), body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
