import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const allowedExtensions = new Set([".pdf", ".doc", ".docx"]);

function sanitizeBaseName(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const resume = formData.get("resume");

    if (!(resume instanceof File)) {
      return NextResponse.json({ error: "Resume file is required" }, { status: 400 });
    }

    const extension = path.extname(resume.name).toLowerCase();
    if (!allowedExtensions.has(extension) || (resume.type && !allowedMimeTypes.has(resume.type))) {
      return NextResponse.json({ error: "Only PDF, DOC, and DOCX files are supported" }, { status: 400 });
    }

    const buffer = Buffer.from(await resume.arrayBuffer());
    const uploadsDir = process.cwd().endsWith(`${path.sep}frontend`)
      ? path.join(process.cwd(), "..", "storage", "resumes")
      : path.join(process.cwd(), "storage", "resumes");
    await mkdir(uploadsDir, { recursive: true });

    const safeBaseName = sanitizeBaseName(resume.name) || "resume";
    const fileName = `${Date.now()}-${randomUUID()}-${safeBaseName}${extension}`;
    const absolutePath = path.join(uploadsDir, fileName);

    await writeFile(absolutePath, buffer);

    return NextResponse.json({
      data: {
        fileName: resume.name,
        storagePath: absolutePath,
        publicUrl: null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Resume upload failed" },
      { status: 500 },
    );
  }
}
