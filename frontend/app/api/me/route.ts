import { NextRequest, NextResponse } from "next/server";

import { fetchCurrentUser, upsertCurrentUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchCurrentUser();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await upsertCurrentUser(body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
