import { NextRequest, NextResponse } from "next/server";

import { createNotification, fetchNotifications } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchNotifications();
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
      type: string;
      title: string;
      message: string;
      channel: "dashboard" | "email" | "telegram" | "whatsapp";
      status: "pending" | "delivered" | "failed";
      relatedJobId?: number;
      relatedReferralId?: number;
      deliveredAt?: string;
    };
    const data = await createNotification(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
