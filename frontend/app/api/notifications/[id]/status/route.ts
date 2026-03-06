import { NextRequest, NextResponse } from "next/server";

import { updateNotificationStatus } from "@/lib/api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      status: "pending" | "delivered" | "failed";
      deliveredAt?: string;
    };
    const data = await updateNotificationStatus(Number(id), body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
