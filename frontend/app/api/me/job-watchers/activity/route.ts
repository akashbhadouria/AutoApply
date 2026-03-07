import { NextResponse } from "next/server";

import { fetchJobWatcherActivities } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchJobWatcherActivities();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
