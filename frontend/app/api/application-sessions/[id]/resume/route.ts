import { NextRequest, NextResponse } from "next/server";

import { resumeApplicationSession } from "@/lib/api";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      resumePath?: string;
    };
    const data = await resumeApplicationSession(Number(id), body);
    return NextResponse.json(data, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
