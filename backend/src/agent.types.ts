export type AgentProvider = "template";

export interface PromptArtifact {
  templateName: string;
  prompt: string;
  input: Record<string, unknown>;
}

export interface ReferralDraftRequest {
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
}

export interface ReferralDraftResult {
  provider: AgentProvider;
  outreachMessage: string;
  connectionRequestMessage: string;
  summary: string;
  promptArtifact: PromptArtifact;
}

export interface FieldMappingSuggestionRequest {
  rawLabel: string;
  company?: string;
  jobTitle?: string;
  existingProfileKeys: string[];
}

export interface FieldMappingSuggestionResult {
  provider: AgentProvider;
  normalizedLabel: string;
  suggestedProfileKey: string;
  confidence: "high" | "medium" | "low";
  rationale: string;
  promptArtifact: PromptArtifact;
}

export interface JobSummaryRequest {
  company: string;
  jobTitle: string;
  jobDescription: string;
}

export interface JobSummaryResult {
  provider: AgentProvider;
  summary: string;
  topSignals: string[];
  risks: string[];
  promptArtifact: PromptArtifact;
}

export interface NotificationSummaryRequest {
  type: string;
  title: string;
  message: string;
  channel: "dashboard" | "email" | "telegram" | "whatsapp";
}

export interface NotificationSummaryResult {
  provider: AgentProvider;
  severity: "high" | "medium" | "low";
  summary: string;
  recommendedAction: string;
  promptArtifact: PromptArtifact;
}
