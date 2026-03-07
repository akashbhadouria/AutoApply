import { NextRequest, NextResponse } from "next/server";

import { createConnectedAccount, fetchConnectedAccounts } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchConnectedAccounts();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await createConnectedAccount(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
