import { NextRequest, NextResponse } from "next/server";

import { fetchReferrals, upsertReferral } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchReferrals();
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
      jobId: number;
      contactId: number;
      status: "pending" | "replied" | "referred" | "no_response";
      outreachMessage: string;
      connectionRequestMessage?: string;
      messageSentAt?: string;
      repliedAt?: string;
    };
    const data = await upsertReferral(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
