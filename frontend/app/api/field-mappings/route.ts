import { NextRequest, NextResponse } from "next/server";

import { fetchFieldMappings, upsertFieldMapping } from "@/lib/api";

export async function GET() {
  try {
    const data = await fetchFieldMappings();
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
      rawLabel: string;
      profileKey: string;
      confidence: "manual" | "learned" | "suggested";
    };
    const data = await upsertFieldMapping(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
