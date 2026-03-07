import { fieldMappingSuggestionSchema, jobSummarySchema, notificationSummarySchema, referralDraftSchema } from "./agent.schema.js";
import type {
  FieldMappingSuggestionResult,
  JobSummaryResult,
  NotificationSummaryResult,
  PromptArtifact,
  ReferralDraftResult,
} from "./agent.types.js";
import { loadPromptTemplate } from "./agent.templates.js";

function createPromptArtifact(templateName: string, prompt: string, input: Record<string, unknown>): PromptArtifact {
  return {
    templateName,
    prompt,
    input,
  };
}

function toLabelToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function toKeyToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function getSkillSummary(primarySkills?: string[]) {
  if (!primarySkills || primarySkills.length === 0) {
    return "building React and TypeScript applications";
  }

  return `building ${primarySkills.slice(0, 3).join(", ")} applications`;
}

export async function generateReferralDraft(payload: unknown): Promise<ReferralDraftResult> {
  const input = referralDraftSchema.parse(payload);
  const prompt = await loadPromptTemplate("referral-message.prompt.md");
  const skillSummary = getSkillSummary(input.primarySkills);
  const experienceLine = input.yearsOfExperience
    ? `I bring ${input.yearsOfExperience} of frontend experience and have spent that time ${skillSummary}.`
    : `My background is centered on ${skillSummary}.`;
  const locationLine = input.location ? ` for the ${input.location} team` : "";
  const resumeLine = input.resumeLink ? `Resume: ${input.resumeLink}` : "";
  const portfolioLine = input.portfolioLink ? `Portfolio: ${input.portfolioLink}` : "";
  const optionalLines = [resumeLine, portfolioLine].filter(Boolean).join("\n");
  const outreachMessage = [
    `Hi ${input.contactFirstName},`,
    "",
    `I came across the ${input.jobTitle} opening at ${input.company}${locationLine} and it aligns well with my experience.`,
    experienceLine,
    "",
    `If my background looks relevant for the team, I would appreciate any guidance or referral.`,
    optionalLines,
    "",
    `Thanks,`,
    input.userName,
  ]
    .filter((line, index, lines) => line !== "" || (index > 0 && lines[index - 1] !== ""))
    .join("\n");
  const connectionRequestMessage = `Hi ${input.contactFirstName}, I am exploring the ${input.jobTitle} role at ${input.company}. My background is in ${skillSummary}. I would value connecting.`;
  const summary = `Generated a concise referral draft for ${input.company} tailored to ${input.contactFirstName}${input.contactTitle ? ` (${input.contactTitle})` : ""}.`;

  return {
    provider: "template",
    outreachMessage,
    connectionRequestMessage,
    summary,
    promptArtifact: createPromptArtifact("referral-message.prompt.md", prompt, input),
  };
}

function resolveMappingSuggestion(rawLabel: string, existingProfileKeys: string[]) {
  const normalizedLabel = toLabelToken(rawLabel);
  const normalizedKey = toKeyToken(rawLabel);
  const existingByNormalized = new Map(existingProfileKeys.map((key) => [toKeyToken(key), key]));
  const aliasMap: Record<string, string[]> = {
    current_salary: ["current ctc", "current salary", "current compensation", "current pay"],
    expected_salary: ["expected salary", "salary expectation", "expected compensation", "expected ctc", "expected pay"],
    notice_period: ["notice period", "serving notice", "available to join", "joining timeline"],
    phone: ["phone", "mobile", "contact number", "phone number", "mobile number"],
    email: ["email", "email address"],
    linkedin: ["linkedin", "linkedin profile", "linkedin url"],
    portfolio: ["portfolio", "personal site", "website", "portfolio url"],
    github: ["github", "github profile", "git hub"],
    resume_link: ["resume", "cv", "resume link", "curriculum vitae"],
    current_company: ["current company", "current employer", "present company"],
    years_experience: ["experience", "years of experience", "total experience"],
    work_authorization: ["work authorization", "visa status", "sponsorship", "right to work"],
    notice_period_days: ["notice period in days", "days to join"],
  };

  const exactExisting = existingByNormalized.get(normalizedKey);
  if (exactExisting) {
    return {
      normalizedLabel,
      suggestedProfileKey: exactExisting,
      confidence: "high" as const,
      rationale: `The field label already matches the existing profile key ${exactExisting}.`,
    };
  }

  for (const [canonicalKey, aliases] of Object.entries(aliasMap)) {
    if (aliases.some((alias) => normalizedLabel.includes(alias))) {
      const resolvedKey = existingByNormalized.get(canonicalKey) ?? canonicalKey;
      return {
        normalizedLabel,
        suggestedProfileKey: resolvedKey,
        confidence: "high" as const,
        rationale: `The label strongly matches the ${resolvedKey} concept used in ATS forms.`,
      };
    }
  }

  const overlappingKey = existingProfileKeys.find((key) => {
    const normalizedExisting = toLabelToken(key);
    return normalizedExisting.length > 0 && (normalizedLabel.includes(normalizedExisting) || normalizedExisting.includes(normalizedLabel));
  });

  if (overlappingKey) {
    return {
      normalizedLabel,
      suggestedProfileKey: overlappingKey,
      confidence: "medium" as const,
      rationale: `The label overlaps with the existing profile key ${overlappingKey}, but the match is not exact.`,
    };
  }

  return {
    normalizedLabel,
    suggestedProfileKey: normalizedKey || "custom_field",
    confidence: "low" as const,
    rationale: "No strong existing match was found, so the suggestion falls back to a normalized canonical key.",
  };
}

export async function suggestFieldMapping(payload: unknown): Promise<FieldMappingSuggestionResult> {
  const input = fieldMappingSuggestionSchema.parse(payload);
  const prompt = await loadPromptTemplate("field-mapping.prompt.md");
  const suggestion = resolveMappingSuggestion(input.rawLabel, input.existingProfileKeys);

  return {
    provider: "template",
    ...suggestion,
    promptArtifact: createPromptArtifact("field-mapping.prompt.md", prompt, input),
  };
}

export async function summarizeJobDescription(payload: unknown): Promise<JobSummaryResult> {
  const input = jobSummarySchema.parse(payload);
  const prompt = await loadPromptTemplate("job-summary.prompt.md");
  const normalizedDescription = input.jobDescription.replace(/\s+/g, " ").trim();
  const sentences = normalizedDescription.split(/(?<=[.!?])\s+/).filter(Boolean);
  const summary = sentences.slice(0, 2).join(" ").slice(0, 360);
  const topSignals = [
    normalizedDescription.match(/react/i) ? "React is explicitly mentioned." : "Frontend stack details need manual review.",
    normalizedDescription.match(/typescript/i) ? "TypeScript is part of the role expectations." : "TypeScript is not explicitly called out.",
    normalizedDescription.match(/remote|hybrid|bangalore/i)
      ? "Location and work model are called out in the description."
      : "Location and work model are not clearly described.",
  ];
  const risks = [
    normalizedDescription.match(/manager|lead|architect/i) ? "Role may expect senior leadership scope." : "Scope appears compatible with an IC frontend path.",
    normalizedDescription.match(/backend|full stack|fullstack/i)
      ? "Description suggests some cross-stack expectations."
      : "Description appears primarily frontend-oriented.",
  ];

  return {
    provider: "template",
    summary: summary || `${input.jobTitle} at ${input.company} needs a manual review because the description was too sparse to summarize cleanly.`,
    topSignals,
    risks,
    promptArtifact: createPromptArtifact("job-summary.prompt.md", prompt, input),
  };
}

export async function summarizeNotification(payload: unknown): Promise<NotificationSummaryResult> {
  const input = notificationSummarySchema.parse(payload);
  const prompt = await loadPromptTemplate("notification-summary.prompt.md");
  const severity =
    input.type.includes("failed") || input.message.match(/failed|blocked|paused/i)
      ? "high"
      : input.type.includes("timeout") || input.message.match(/timeout|rate/i)
        ? "medium"
        : "low";
  const summary = `${input.title}: ${input.message}`.slice(0, 240);
  const recommendedAction =
    severity === "high"
      ? "Inspect the related job, referral, or application session before re-queuing automation."
      : severity === "medium"
        ? "Review the queue or settings threshold and retry when the dependency clears."
        : "No urgent intervention is required beyond confirming the event in the dashboard.";

  return {
    provider: "template",
    severity,
    summary,
    recommendedAction,
    promptArtifact: createPromptArtifact("notification-summary.prompt.md", prompt, input),
  };
}
