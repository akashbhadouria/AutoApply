import { NextResponse } from "next/server";

import { fetchBackendRuntimeStatus } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await fetchBackendRuntimeStatus();
  return NextResponse.json({ data: status });
}
