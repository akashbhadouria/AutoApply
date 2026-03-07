import { NextRequest, NextResponse } from "next/server";

import { generateReferralDraft } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      company: string;
      jobTitle: string;
      location?: string;
      contactFirstName: string;
      contactTitle?: string;
      userName: string;
      resumeLink?: string;
      portfolioLink?: string;
      yearsOfExperience?: string;
      primarySkills?: string[];
    };
    const data = await generateReferralDraft(body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
