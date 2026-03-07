import { NextRequest, NextResponse } from "next/server";

import { createContact, fetchContacts } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchContacts();
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
      fullName: string;
      firstName: string;
      title: string;
      profileUrl?: string;
      email?: string;
      sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
    };
    const data = await createContact(body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
