import { NextResponse } from "next/server";

import { fetchProfileFields } from "@/lib/api";

export async function GET() {
  try {
    const data = await fetchProfileFields();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

