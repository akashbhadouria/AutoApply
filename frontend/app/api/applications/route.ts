import { NextRequest, NextResponse } from "next/server";

import { fetchApplications, upsertApplication } from "@/lib/api";

export async function GET() {
  try {
    const data = await fetchApplications();
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
      sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
      applied: boolean;
      appliedDate?: string;
      status: "pending" | "applied" | "interview" | "rejected" | "offer";
    };
    const data = await upsertApplication(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
