import { NextRequest, NextResponse } from "next/server";

import { suggestFieldMapping } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      rawLabel: string;
      company?: string;
      jobTitle?: string;
      existingProfileKeys: string[];
    };
    const data = await suggestFieldMapping(body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
