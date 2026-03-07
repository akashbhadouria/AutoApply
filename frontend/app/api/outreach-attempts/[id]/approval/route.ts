import { NextRequest, NextResponse } from "next/server";

import { updateOutreachAttemptApproval } from "@/lib/api";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      approvalStatus: "approved" | "rejected" | "not_required";
      approvedAt?: string;
    };
    const data = await updateOutreachAttemptApproval(Number(id), body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
