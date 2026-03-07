import { NextRequest, NextResponse } from "next/server";

import { summarizeJobDescription } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      company: string;
      jobTitle: string;
      jobDescription: string;
    };
    const data = await summarizeJobDescription(body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
