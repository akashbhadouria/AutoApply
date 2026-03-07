import { NextResponse } from "next/server";

import { fetchOutreachAttemptsByReferralId } from "@/lib/api";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ referralId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { referralId } = await context.params;
    const data = await fetchOutreachAttemptsByReferralId(Number(referralId));
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
