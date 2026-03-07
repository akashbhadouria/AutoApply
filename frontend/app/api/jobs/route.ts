import { NextRequest, NextResponse } from "next/server";

import { discoverJob, fetchJobs } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchJobs();
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
      company: string;
      title: string;
      location: string;
      jobUrl: string;
      sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
      postedDate?: string;
    };
    const data = await discoverJob(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
