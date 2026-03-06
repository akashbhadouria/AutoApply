import { chromium } from "playwright";

interface AtsField {
  label: string;
  normalizedLabel: string;
  required: boolean;
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox" | "radio" | "file";
}

type AtsFieldType = AtsField["type"];

const builtInMappings: Record<string, string> = {
  "full name": "name",
  email: "email",
  phone: "phone",
  "phone number": "phone",
  linkedin: "linkedin",
  "linkedin profile": "linkedin",
  portfolio: "portfolio",
  "resume link": "resume_link",
  "notice period": "notice_period",
  "current salary": "current_salary",
  "expected salary": "expected_salary",
};

function normalizeLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

function mockAtsPageContent(formUrl: string) {
  const lower = formUrl.toLowerCase();

  if (lower.includes("workday")) {
    return `
      <form>
        <label>Full Name <input name="name" required /></label>
        <label>Email <input type="email" name="email" required /></label>
        <label>Phone Number <input type="tel" name="phone" required /></label>
        <label>Current Salary <input name="current_salary" required /></label>
        <label>Resume <input type="file" name="resume" required /></label>
      </form>
    `;
  }

  if (lower.includes("greenhouse")) {
    return `
      <form>
        <label>Full Name <input name="name" required /></label>
        <label>Email <input type="email" name="email" required /></label>
        <label>LinkedIn Profile <input name="linkedin" /></label>
        <label>Portfolio <input name="portfolio" /></label>
        <label>Notice Period <input name="notice_period" required /></label>
      </form>
    `;
  }

  return `
    <form>
      <label>Full Name <input name="name" required /></label>
      <label>Email <input type="email" name="email" required /></label>
      <label>Phone <input type="tel" name="phone" required /></label>
      <label>Expected Salary <input name="expected_salary" required /></label>
      <label>Resume Link <input name="resume_link" /></label>
    </form>
  `;
}

export async function analyzeAtsForm(formUrl: string): Promise<AtsField[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    if (formUrl.includes("example.com")) {
      await page.setContent(mockAtsPageContent(formUrl));
    } else {
      await page.goto(formUrl, { waitUntil: "domcontentloaded" });
    }

    const fields = await page.locator("input, textarea, select").evaluateAll((elements) =>
      elements.map((element) => {
        const htmlElement = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        const labelText =
          htmlElement.labels?.[0]?.textContent?.trim() ||
          htmlElement.getAttribute("aria-label") ||
          htmlElement.getAttribute("placeholder") ||
          htmlElement.getAttribute("name") ||
          "unknown field";
        const tag = htmlElement.tagName.toLowerCase();
        const inputType = tag === "input" ? (htmlElement as HTMLInputElement).type || "text" : tag;

        const normalizedType: AtsFieldType =
          inputType === "email" || inputType === "tel" || inputType === "checkbox" || inputType === "radio" || inputType === "file"
            ? inputType
            : inputType === "textarea"
              ? "textarea"
              : inputType === "select"
                ? "select"
                : "text";

        return {
          label: labelText,
          required: htmlElement.hasAttribute("required") || htmlElement.getAttribute("aria-required") === "true",
          type: normalizedType,
        };
      }),
    );

    return fields.map((field) => ({
      ...field,
      normalizedLabel: normalizeLabel(field.label),
    }));
  } finally {
    await page.close();
    await browser.close();
  }
}

export function mapAtsFields(params: {
  fields: AtsField[];
  profileFields: Array<{ key: string; value: string }>;
  fieldMappings: Array<{ rawLabel: string; normalizedLabel: string; profileKey: string }>;
}) {
  const profileFieldMap = new Map(params.profileFields.map((field) => [field.key, field.value]));
  const learnedMappingMap = new Map(
    params.fieldMappings.flatMap((mapping) => [
      [mapping.rawLabel.trim().toLowerCase(), mapping.profileKey],
      [mapping.normalizedLabel.trim().toLowerCase(), mapping.profileKey],
    ]),
  );

  const resolvedFields = params.fields.map((field) => {
    const mappedKey = learnedMappingMap.get(field.normalizedLabel) ?? builtInMappings[field.normalizedLabel];
    const mappedValue = mappedKey ? profileFieldMap.get(mappedKey) : undefined;

    return {
      ...field,
      profileKey: mappedKey ?? null,
      value: mappedValue ?? null,
    };
  });

  const missingRequiredField = resolvedFields.find((field) => field.required && !field.value);

  return {
    resolvedFields,
    missingRequiredField: missingRequiredField
      ? {
          label: missingRequiredField.label,
          normalizedLabel: missingRequiredField.normalizedLabel,
          profileKey: missingRequiredField.profileKey,
        }
      : null,
  };
}
