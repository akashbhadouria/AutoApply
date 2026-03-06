import { NextResponse } from "next/server";

import { fetchAutomationQueues } from "@/lib/api";

export async function GET() {
  try {
    const data = await fetchAutomationQueues();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
