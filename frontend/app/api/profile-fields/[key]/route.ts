import { NextRequest, NextResponse } from "next/server";

import { removeProfileField, upsertProfileField } from "@/lib/api";

interface RouteContext {
  params: Promise<{ key: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { key } = await context.params;
    const body = (await request.json()) as { label: string; value: string; source: "manual" | "learned" | "imported" };
    const data = await upsertProfileField(key, body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { key } = await context.params;
    await removeProfileField(key);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

