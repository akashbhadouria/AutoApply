import { NextRequest, NextResponse } from "next/server";

import { removeSystemSetting, upsertSystemSetting } from "@/lib/api";

interface RouteContext {
  params: Promise<{ key: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { key } = await context.params;
    const body = (await request.json()) as {
      label: string;
      value: string;
      valueType: "string" | "boolean" | "number" | "json";
      category: string;
    };
    const data = await upsertSystemSetting(key, body);
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
    await removeSystemSetting(key);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
