import { readFile } from "node:fs/promises";
import path from "node:path";

const promptFallbacks = {
  "referral-message.prompt.md": `# Referral Message Agent

Generate one concise outreach draft and one concise connection request draft.
Do not send automatically. Keep tone professional and direct.`,
  "field-mapping.prompt.md": `# Field Mapping Agent

Suggest the best canonical profile key for a new ATS field label.
Prefer existing profile keys when they are a clear match.`,
  "job-summary.prompt.md": `# Job Summary Agent

Summarize the job description into fit signals, key requirements, and risks for the candidate.`,
  "notification-summary.prompt.md": `# Notification Summary Agent

Condense a notification into a short operational summary and a single recommended next action.`,
};

const promptCache = new Map<string, string>();

function getPromptRoots() {
  return [path.resolve(process.cwd(), "agents"), path.resolve(process.cwd(), "..", "agents")];
}

export async function loadPromptTemplate(fileName: keyof typeof promptFallbacks) {
  const cached = promptCache.get(fileName);
  if (cached) {
    return cached;
  }

  for (const root of getPromptRoots()) {
    try {
      const prompt = await readFile(path.join(root, fileName), "utf8");
      promptCache.set(fileName, prompt);
      return prompt;
    } catch {
      continue;
    }
  }

  const fallback = promptFallbacks[fileName];
  promptCache.set(fileName, fallback);
  return fallback;
}
