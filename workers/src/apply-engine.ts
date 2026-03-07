interface RunApplyParams {
  jobId: number;
  company: string;
  title: string;
  jobUrl: string;
  sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
}

interface ApplyExecutionResult {
  provider: string;
  status: "submitted" | "failed" | "unsupported";
  durationMs: number;
  externalReference?: string;
  responseSummary: Record<string, unknown>;
  shouldFallbackToBrowser: boolean;
}

function buildReference(prefix: string, jobId: number) {
  return `${prefix}-${jobId}-${Date.now()}`;
}

export async function runDirectApiApply(params: RunApplyParams): Promise<ApplyExecutionResult> {
  const startedAt = Date.now();
  const lowerUrl = params.jobUrl.toLowerCase();
  const provider = lowerUrl.includes("linkedin") ? "linkedin_easy_apply" : "direct_api";

  if (params.sourcePlatform !== "linkedin" && !lowerUrl.includes("api")) {
    return {
      provider,
      status: "unsupported",
      durationMs: Date.now() - startedAt,
      responseSummary: {
        reason: "Direct API apply is not supported for this source/job URL.",
      },
      shouldFallbackToBrowser: true,
    };
  }

  await new Promise((resolve) => setTimeout(resolve, 150));
  return {
    provider,
    status: "submitted",
    durationMs: Date.now() - startedAt,
    externalReference: buildReference("api", params.jobId),
    responseSummary: {
      method: "direct_api",
      simulated: true,
      company: params.company,
      title: params.title,
    },
    shouldFallbackToBrowser: false,
  };
}

export async function runHttpFormApply(params: RunApplyParams): Promise<ApplyExecutionResult> {
  const startedAt = Date.now();
  const provider = `${params.sourcePlatform}_http_form`;

  if (params.sourcePlatform === "company_site" || params.jobUrl.toLowerCase().includes("workday")) {
    return {
      provider,
      status: "unsupported",
      durationMs: Date.now() - startedAt,
      responseSummary: {
        reason: "HTTP form apply is not reliable for this provider.",
      },
      shouldFallbackToBrowser: true,
    };
  }

  await new Promise((resolve) => setTimeout(resolve, 350));
  return {
    provider,
    status: "submitted",
    durationMs: Date.now() - startedAt,
    externalReference: buildReference("http", params.jobId),
    responseSummary: {
      method: "http_form",
      simulated: true,
      company: params.company,
      title: params.title,
    },
    shouldFallbackToBrowser: false,
  };
}
