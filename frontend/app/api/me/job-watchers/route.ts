import { NextRequest, NextResponse } from "next/server";

import { createJobFeedWatcher, fetchJobFeedWatchers } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchJobFeedWatchers();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await createJobFeedWatcher(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
