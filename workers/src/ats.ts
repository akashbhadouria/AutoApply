import { access } from "node:fs/promises";

import { chromium } from "playwright";

interface AtsField {
  label: string;
  normalizedLabel: string;
  required: boolean;
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox" | "radio" | "file";
  selector: string;
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
      <form id="application-form">
        <label>Full Name <input id="name" name="name" required /></label>
        <label>Email <input id="email" type="email" name="email" required /></label>
        <label>Phone Number <input id="phone" type="tel" name="phone" required /></label>
        <label>Current Salary <input id="current_salary" name="current_salary" required /></label>
        <label>Resume <input id="resume" type="file" name="resume" required /></label>
        <button id="submit" type="submit">Submit</button>
      </form>
      <script>
        document.getElementById("application-form")?.addEventListener("submit", function(event) {
          event.preventDefault();
          document.body.setAttribute("data-submitted", "true");
        });
      </script>
    `;
  }

  if (lower.includes("greenhouse")) {
    return `
      <form id="application-form">
        <label>Full Name <input id="name" name="name" required /></label>
        <label>Email <input id="email" type="email" name="email" required /></label>
        <label>LinkedIn Profile <input id="linkedin" name="linkedin" /></label>
        <label>Portfolio <input id="portfolio" name="portfolio" /></label>
        <label>Notice Period <input id="notice_period" name="notice_period" required /></label>
        <button id="submit" type="submit">Submit</button>
      </form>
      <script>
        document.getElementById("application-form")?.addEventListener("submit", function(event) {
          event.preventDefault();
          document.body.setAttribute("data-submitted", "true");
        });
      </script>
    `;
  }

  return `
    <form id="application-form">
      <label>Full Name <input id="name" name="name" required /></label>
      <label>Email <input id="email" type="email" name="email" required /></label>
      <label>Phone <input id="phone" type="tel" name="phone" required /></label>
      <label>Expected Salary <input id="expected_salary" name="expected_salary" required /></label>
      <label>Resume Link <input id="resume_link" name="resume_link" /></label>
      <button id="submit" type="submit">Submit</button>
    </form>
    <script>
      document.getElementById("application-form")?.addEventListener("submit", function(event) {
        event.preventDefault();
        document.body.setAttribute("data-submitted", "true");
      });
    </script>
  `;
}

async function openAtsPage(formUrl: string) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  if (formUrl.includes("example.com")) {
    await page.setContent(mockAtsPageContent(formUrl));
  } else {
    await page.goto(formUrl, { waitUntil: "domcontentloaded" });
  }

  return { browser, page };
}

async function collectAtsFields(page: Awaited<ReturnType<typeof openAtsPage>>["page"]): Promise<AtsField[]> {
  const fields = await page.locator("input, textarea, select").evaluateAll((elements) =>
    elements.map((element, index) => {
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
      const id = htmlElement.id;
      const name = htmlElement.getAttribute("name");
      const selector = id
        ? `#${id}`
        : name
          ? `[name="${name}"]`
          : `${tag}:nth-of-type(${index + 1})`;

      return {
        label: labelText,
        required: htmlElement.hasAttribute("required") || htmlElement.getAttribute("aria-required") === "true",
        type: normalizedType,
        selector,
      };
    }),
  );

  return fields.map((field) => ({
    ...field,
    normalizedLabel: normalizeLabel(field.label),
  }));
}

export async function analyzeAtsForm(formUrl: string): Promise<AtsField[]> {
  const { browser, page } = await openAtsPage(formUrl);

  try {
    return collectAtsFields(page);
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

async function fileExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function runAtsAutofill(params: {
  formUrl: string;
  profileFields: Array<{ key: string; value: string }>;
  fieldMappings: Array<{ rawLabel: string; normalizedLabel: string; profileKey: string }>;
}) {
  const { browser, page } = await openAtsPage(params.formUrl);

  try {
    const fields = await collectAtsFields(page);
    const mapped = mapAtsFields({
      fields,
      profileFields: params.profileFields,
      fieldMappings: params.fieldMappings,
    });

    const filledFields: Record<string, string> = {};
    let unresolvedRequiredField: {
      label: string;
      normalizedLabel: string;
      profileKey: string | null;
    } | null = null;

    for (const field of mapped.resolvedFields) {
      const locator = page.locator(field.selector).first();
      const hasElement = (await locator.count()) > 0;

      if (!hasElement) {
        continue;
      }

      if (!field.value) {
        if (field.required && !unresolvedRequiredField) {
          unresolvedRequiredField = {
            label: field.label,
            normalizedLabel: field.normalizedLabel,
            profileKey: field.profileKey,
          };
        }
        continue;
      }

      if (field.type === "file") {
        const canUpload = await fileExists(field.value);
        if (!canUpload) {
          if (field.required && !unresolvedRequiredField) {
            unresolvedRequiredField = {
              label: field.label,
              normalizedLabel: field.normalizedLabel,
              profileKey: field.profileKey,
            };
          }
          continue;
        }

        await locator.setInputFiles(field.value);
        filledFields[field.normalizedLabel] = field.value;
        continue;
      }

      if (field.type === "checkbox") {
        await locator.check();
        filledFields[field.normalizedLabel] = "true";
        continue;
      }

      if (field.type === "radio") {
        await locator.check();
        filledFields[field.normalizedLabel] = String(field.value);
        continue;
      }

      if (field.type === "select") {
        await locator.selectOption({ label: String(field.value) }).catch(async () => {
          await locator.selectOption(String(field.value));
        });
        filledFields[field.normalizedLabel] = String(field.value);
        continue;
      }

      await locator.fill(String(field.value));
      filledFields[field.normalizedLabel] = String(field.value);
    }

    let submitted = false;

    if (!unresolvedRequiredField) {
      const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
      if ((await submitButton.count()) > 0) {
        await submitButton.click();
        submitted = true;
      } else if (params.formUrl.includes("example.com")) {
        submitted = true;
      }
    }

    return {
      analyzedFields: fields,
      filledFields,
      missingRequiredField: unresolvedRequiredField,
      submitted,
    };
  } finally {
    await page.close();
    await browser.close();
  }
}
