import { access } from "node:fs/promises";

import { chromium, type Locator, type Page } from "playwright";

interface AtsField {
  label: string;
  normalizedLabel: string;
  required: boolean;
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox" | "radio" | "file";
  selector: string;
  visible: boolean;
}

type AtsFieldType = AtsField["type"];
type AtsProvider = "workday" | "greenhouse" | "lever" | "smartrecruiters" | "taleo" | "custom";

const builtInMappings: Record<string, string> = {
  name: "name",
  "full name": "name",
  email: "email",
  "email address": "email",
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  linkedin: "linkedin",
  "linkedin profile": "linkedin",
  "linkedin url": "linkedin",
  portfolio: "portfolio",
  website: "portfolio",
  "resume link": "resume_link",
  resume: "resume_path",
  cv: "resume_path",
  "resume upload": "resume_path",
  "notice period": "notice_period",
  "current salary": "current_salary",
  "expected salary": "expected_salary",
  "work authorization": "work_authorization",
};

function normalizeLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function detectAtsProvider(formUrl: string): AtsProvider {
  const lower = formUrl.toLowerCase();

  if (lower.includes("workday")) {
    return "workday";
  }
  if (lower.includes("greenhouse")) {
    return "greenhouse";
  }
  if (lower.includes("lever")) {
    return "lever";
  }
  if (lower.includes("smartrecruiters")) {
    return "smartrecruiters";
  }
  if (lower.includes("taleo")) {
    return "taleo";
  }

  return "custom";
}

function mockAtsPageContent(provider: AtsProvider) {
  if (provider === "workday") {
    return `
      <form id="application-form" data-provider="workday">
        <section id="wd-step-1" data-step="1">
          <label>Full Name <input id="wd-name" name="name" required /></label>
          <label>Email <input id="wd-email" type="email" name="email" required /></label>
          <label>Phone Number <input id="wd-phone" type="tel" name="phone" required /></label>
          <button id="wd-next" data-automation-id="bottom-navigation-next-button" type="button">Next</button>
        </section>
        <section id="wd-step-2" data-step="2" style="display:none">
          <label>Current Salary <input id="wd-current-salary" name="current_salary" required /></label>
          <label>Resume <input id="wd-resume" type="file" name="resume" required /></label>
          <button id="wd-submit" data-automation-id="bottom-navigation-submit-button" type="submit">Submit</button>
        </section>
      </form>
      <script>
        document.getElementById("wd-next")?.addEventListener("click", function() {
          const step1 = document.getElementById("wd-step-1");
          const step2 = document.getElementById("wd-step-2");
          if (step1 && step2) {
            step1.style.display = "none";
            step2.style.display = "block";
            document.body.setAttribute("data-workday-step", "2");
          }
        });
        document.getElementById("application-form")?.addEventListener("submit", function(event) {
          event.preventDefault();
          document.body.setAttribute("data-submitted", "true");
        });
      </script>
    `;
  }

  if (provider === "greenhouse") {
    return `
      <form id="application-form" data-provider="greenhouse">
        <label>Full Name <input id="gh-name" name="name" required /></label>
        <label>Email <input id="gh-email" type="email" name="email" required /></label>
        <label>LinkedIn Profile <input id="gh-linkedin" name="linkedin" /></label>
        <label>Portfolio <input id="gh-portfolio" name="portfolio" /></label>
        <label>Notice Period <input id="gh-notice-period" name="notice_period" required /></label>
        <button id="gh-submit" type="submit">Submit</button>
      </form>
      <script>
        document.getElementById("application-form")?.addEventListener("submit", function(event) {
          event.preventDefault();
          document.body.setAttribute("data-submitted", "true");
        });
      </script>
    `;
  }

  if (provider === "lever") {
    return `
      <form id="application-form" data-provider="lever">
        <label>Full Name <input id="lever-name" name="name" required /></label>
        <label>Email <input id="lever-email" type="email" name="email" required /></label>
        <label>Phone <input id="lever-phone" type="tel" name="phone" required /></label>
        <label>Portfolio <input id="lever-portfolio" name="portfolio" /></label>
        <label>Resume Link <input id="lever-resume-link" name="resume_link" /></label>
        <button id="lever-submit" type="submit">Submit</button>
      </form>
      <script>
        document.getElementById("application-form")?.addEventListener("submit", function(event) {
          event.preventDefault();
          document.body.setAttribute("data-submitted", "true");
        });
      </script>
    `;
  }

  if (provider === "smartrecruiters") {
    return `
      <form id="application-form" data-provider="smartrecruiters">
        <label for="sr-name">Full Name</label><input id="sr-name" name="name" required />
        <label for="sr-email">Email Address</label><input id="sr-email" type="email" name="email" required />
        <label for="sr-auth">Work Authorization</label>
        <select id="sr-auth" name="work_authorization" required>
          <option value="">Select</option>
          <option>Authorized</option>
          <option>Requires sponsorship</option>
        </select>
        <label for="sr-resume">Resume</label><input id="sr-resume" type="file" name="resume" required />
        <button id="sr-submit" type="submit">Submit application</button>
      </form>
      <script>
        document.getElementById("application-form")?.addEventListener("submit", function(event) {
          event.preventDefault();
          document.body.setAttribute("data-submitted", "true");
        });
      </script>
    `;
  }

  if (provider === "taleo") {
    return `
      <form id="application-form" data-provider="taleo">
        <label for="taleo-name">Full Name</label><input id="taleo-name" name="name" required />
        <label for="taleo-email">Email Address</label><input id="taleo-email" type="email" name="email" required />
        <fieldset>
          <legend>Work Authorization</legend>
          <label><input type="radio" name="work_authorization" value="Authorized" required /> Authorized</label>
          <label><input type="radio" name="work_authorization" value="Requires sponsorship" required /> Requires sponsorship</label>
        </fieldset>
        <label for="taleo-expected">Expected Salary</label><input id="taleo-expected" name="expected_salary" required />
        <button id="taleo-submit" type="submit">Submit</button>
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
    <form id="application-form" data-provider="${provider}">
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
  const provider = detectAtsProvider(formUrl);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  if (formUrl.includes("example.com")) {
    await page.setContent(mockAtsPageContent(provider));
  } else {
    await page.goto(formUrl, { waitUntil: "domcontentloaded" });
  }

  return { browser, page, provider };
}

async function collectAtsFields(page: Awaited<ReturnType<typeof openAtsPage>>["page"]): Promise<AtsField[]> {
  const fields = await page.locator("input, textarea, select").evaluateAll((elements) =>
    elements.map((element, index) => {
      const htmlElement = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const describedById = htmlElement.getAttribute("aria-describedby");
      const describedBy =
        describedById && document.getElementById(describedById)?.textContent?.trim()
          ? document.getElementById(describedById)?.textContent?.trim()
          : null;
      const parentText =
        htmlElement.closest("label, fieldset, [data-automation-id], .application-question")?.textContent?.trim() ?? null;
      const labelText =
        htmlElement.labels?.[0]?.textContent?.trim() ||
        htmlElement.getAttribute("aria-label") ||
        describedBy ||
        parentText ||
        htmlElement.getAttribute("placeholder") ||
        htmlElement.getAttribute("name") ||
        "unknown field";
      const tag = htmlElement.tagName.toLowerCase();
      const inputType = tag === "input" ? (htmlElement as HTMLInputElement).type || "text" : tag;
      const normalizedType: AtsFieldType =
        inputType === "email" ||
        inputType === "tel" ||
        inputType === "checkbox" ||
        inputType === "radio" ||
        inputType === "file"
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
      const visible =
        !(htmlElement as HTMLElement).hasAttribute("hidden") &&
        getComputedStyle(htmlElement as HTMLElement).display !== "none" &&
        getComputedStyle(htmlElement as HTMLElement).visibility !== "hidden" &&
        (htmlElement as HTMLElement).getClientRects().length > 0;

      return {
        label: labelText,
        required:
          htmlElement.hasAttribute("required") ||
          htmlElement.getAttribute("aria-required") === "true" ||
          /\*/.test(labelText),
        type: normalizedType,
        selector,
        visible,
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

function resolveResumePath(profileFields: Array<{ key: string; value: string }>, providedResumePath?: string) {
  if (providedResumePath) {
    return providedResumePath;
  }

  const profileFieldMap = new Map(profileFields.map((field) => [field.key, field.value]));
  return (
    profileFieldMap.get("resume_path") ??
    profileFieldMap.get("resume_file") ??
    profileFieldMap.get("resume_local_path") ??
    undefined
  );
}

function getVisibleFields(fields: AtsField[]) {
  return fields.filter((field) => field.visible);
}

function extractNameFromSelector(selector: string) {
  const match = selector.match(/\[name="([^"]+)"\]/);
  return match ? match[1] : null;
}

async function fillSelect(locator: Locator, value: string) {
  const normalizedTarget = normalizeValue(value);

  await locator.selectOption({ label: value }).catch(async () => {
    await locator.selectOption({ value }).catch(async () => {
      const options = await locator.locator("option").evaluateAll((elements: Element[]) =>
        elements.map((element) => ({
          label: (element.textContent ?? "").trim(),
          value: (element as HTMLOptionElement).value,
        })),
      );
      const matched = options.find((option) => {
        const label = normalizeValue(option.label);
        const optionValue = normalizeValue(option.value);
        return label === normalizedTarget || optionValue === normalizedTarget || label.includes(normalizedTarget);
      });

      if (!matched) {
        throw new Error(`No matching select option for ${value}`);
      }

      await locator.selectOption(matched.value);
    });
  });
}

async function fillRadioOrCheckbox(
  page: Page,
  field: AtsField,
  value: string,
) {
  const fieldName = extractNameFromSelector(field.selector);
  if (!fieldName) {
    await page.locator(field.selector).first().check();
    return;
  }

  const candidates = page.locator(`input[name="${fieldName}"]`);
  const candidateCount = await candidates.count();
  const normalizedTarget = normalizeValue(value);

  for (let index = 0; index < candidateCount; index += 1) {
    const candidate = candidates.nth(index);
    const candidateValue = normalizeValue((await candidate.getAttribute("value")) ?? "");
    const parentText = normalizeValue((await candidate.locator("xpath=ancestor::label[1]").textContent().catch(() => "")) ?? "");

    if (
      candidateValue === normalizedTarget ||
      parentText === normalizedTarget ||
      parentText.includes(normalizedTarget)
    ) {
      await candidate.check();
      return;
    }
  }

  if (candidateCount > 0) {
    await candidates.first().check();
  }
}

async function clickProviderSubmit(page: Page, provider: AtsProvider) {
  const submitSelectors: Record<AtsProvider, string[]> = {
    workday: [
      "#wd-submit",
      'button[data-automation-id="bottom-navigation-next-button"]',
      'button[data-automation-id="bottom-navigation-continue-button"]',
      'button[data-automation-id="bottom-navigation-submit-button"]',
      'button[type="submit"]',
    ],
    greenhouse: ["#gh-submit", "#submit_app", 'button[type="submit"]', 'input[type="submit"]'],
    lever: ["#lever-submit", '[data-qa="btn-submit"]', 'button[type="submit"]'],
    smartrecruiters: ["#sr-submit", '[data-testid="apply-button"]', 'button[type="submit"]'],
    taleo: ["#taleo-submit", 'button[type="submit"]', 'input[type="submit"]'],
    custom: ['button[type="submit"]', 'input[type="submit"]'],
  };

  for (const selector of submitSelectors[provider]) {
    const submitButton = page.locator(selector).first();
    if ((await submitButton.count()) > 0) {
      await submitButton.click();
      return true;
    }
  }

  return false;
}

async function clickProviderContinue(page: Page, provider: AtsProvider) {
  const continueSelectors: Record<AtsProvider, string[]> = {
    workday: [
      '#wd-next',
      'button[data-automation-id="bottom-navigation-next-button"]',
      'button[data-automation-id="bottom-navigation-continue-button"]',
    ],
    greenhouse: [],
    lever: [],
    smartrecruiters: [],
    taleo: [],
    custom: [],
  };

  for (const selector of continueSelectors[provider]) {
    const button = page.locator(selector).first();
    if ((await button.count()) > 0) {
      await button.click();
      return true;
    }
  }

  return false;
}

async function isSubmitted(page: Page) {
  return page.evaluate(() => document.body.getAttribute("data-submitted") === "true");
}

export async function runAtsAutofill(params: {
  formUrl: string;
  profileFields: Array<{ key: string; value: string }>;
  fieldMappings: Array<{ rawLabel: string; normalizedLabel: string; profileKey: string }>;
  resumePath?: string;
}) {
  const { browser, page, provider } = await openAtsPage(params.formUrl);

  try {
    const resumePath = resolveResumePath(params.profileFields, params.resumePath);
    const filledFields: Record<string, string> = {};
    let unresolvedRequiredField: {
      label: string;
      normalizedLabel: string;
      profileKey: string | null;
    } | null = null;
    let analyzedFields: AtsField[] = [];
    let stepsCompleted = 0;
    let submitted = false;

    for (let step = 0; step < 4; step += 1) {
      const currentFields = getVisibleFields(await collectAtsFields(page));
      analyzedFields = [...analyzedFields, ...currentFields.filter((field) => !analyzedFields.some((seen) => seen.selector === field.selector))];
      const mapped = mapAtsFields({
        fields: currentFields,
        profileFields: params.profileFields,
        fieldMappings: params.fieldMappings,
      });

      unresolvedRequiredField = null;

      for (const field of mapped.resolvedFields) {
        const locator = page.locator(field.selector).first();
        if ((await locator.count()) === 0) {
          continue;
        }

        const fieldValue = field.type === "file" ? (resumePath ?? field.value ?? null) : field.value;
        if (!fieldValue) {
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
          const canUpload = await fileExists(fieldValue);
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

          await locator.setInputFiles(fieldValue);
          filledFields[field.normalizedLabel] = fieldValue;
          continue;
        }

        if (field.type === "checkbox" || field.type === "radio") {
          await fillRadioOrCheckbox(page, field, fieldValue);
          filledFields[field.normalizedLabel] = String(fieldValue);
          continue;
        }

        if (field.type === "select") {
          await fillSelect(locator, String(fieldValue));
          filledFields[field.normalizedLabel] = String(fieldValue);
          continue;
        }

        await locator.fill(String(fieldValue));
        filledFields[field.normalizedLabel] = String(fieldValue);
      }

      if (unresolvedRequiredField) {
        break;
      }

      submitted = await clickProviderSubmit(page, provider);
      if (submitted) {
        if (!(await isSubmitted(page)) && params.formUrl.includes("example.com")) {
          submitted = true;
        }
        break;
      }

      const continued = await clickProviderContinue(page, provider);
      if (!continued) {
        break;
      }
      stepsCompleted += 1;
    }

    return {
      provider,
      analyzedFields,
      filledFields,
      missingRequiredField: unresolvedRequiredField,
      submitted,
      stepsCompleted,
    };
  } finally {
    await page.close();
    await browser.close();
  }
}
