"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Loader2,
  LockKeyhole,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ConnectedAccount, CurrentUser, ProfileField, UserJobPreferences } from "@/lib/api";
import { capturePlatformSessionViaExtension, detectAutoApplyExtension } from "@/lib/platform-extension";

type StepId = 1 | 2 | 3 | 4 | 5 | 6;
type PlatformProvider = "linkedin" | "naukri" | "instahyre" | "hirist";

const steps: Array<{ id: StepId; kicker: string; title: string }> = [
  { id: 1, kicker: "Start", title: "Welcome" },
  { id: 2, kicker: "Step 1", title: "Resume and identity" },
  { id: 3, kicker: "Step 2", title: "Profile details" },
  { id: 4, kicker: "Step 3", title: "Job preferences" },
  { id: 5, kicker: "Step 4", title: "Connect platforms" },
  { id: 6, kicker: "Finish", title: "Review and activate" },
];

const platformConfigs: Array<{
  provider: PlatformProvider;
  label: string;
  description: string;
  helper: string;
  badge?: string;
}> = [
  {
    provider: "linkedin",
    label: "LinkedIn",
    description: "High-demand platform with the strictest safety controls.",
    helper: "Day-1 support. Guarded limits: 25 Easy Apply + 5 Full Apply.",
    badge: "Beta",
  },
  {
    provider: "naukri",
    label: "Naukri",
    description: "High-volume India channel with HTTP-first opportunities.",
    helper: "Strong early ROI. Lower operational cost than browser-heavy flows.",
  },
  {
    provider: "instahyre",
    label: "Instahyre",
    description: "Efficient invite-driven platform with low automation friction.",
    helper: "Best HTTP-first efficiency among the launch platforms.",
  },
  {
    provider: "hirist",
    label: "Hirist",
    description: "Strong India tech-job source with light custom-form fallback.",
    helper: "Useful launch channel for additional volume alongside Naukri.",
  },
];

const watcherPollingByPlatform: Record<PlatformProvider, number> = {
  linkedin: 300,
  naukri: 120,
  instahyre: 600,
  hirist: 300,
};

const workTypeOptions = ["Remote", "Hybrid", "On-site"] as const;
const employmentTypeOptions = ["Full-time", "Contract", "Internship"] as const;

const profileFieldConfig = {
  current_company: "Current company",
  current_designation: "Current designation",
  total_years_exp: "Total years of experience",
  total_months_exp: "Additional months of experience",
  current_ctc: "Current CTC / salary",
  expected_ctc: "Expected CTC / salary",
  notice_period: "Notice period",
  highest_degree: "Highest degree",
  university: "University",
  graduation_year: "Graduation year",
  field_of_study: "Field of study",
  skills: "Skills",
  certifications: "Certifications",
  work_authorization: "Work authorization",
  willing_to_relocate: "Willing to relocate",
  relocation_cities: "Preferred relocation cities",
  cover_letter_template: "Cover letter template",
  custom_summary: "Tell us about yourself",
  why_new_role: "Why are you looking for a new role?",
  gender: "Gender",
  veteran_status: "Veteran status",
  disability_status: "Disability status",
  background_check_ok: "Background check consent",
} as const;

type ProfileFieldState = Record<keyof typeof profileFieldConfig, string>;

function parseErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function parseError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeAccountMap(accounts: ConnectedAccount[]) {
  const latestByProvider = new Map<string, ConnectedAccount>();

  for (const account of accounts) {
    if (!latestByProvider.has(account.provider)) {
      latestByProvider.set(account.provider, account);
    }
  }

  return latestByProvider;
}

function buildProfileFieldState(initialProfileFields: ProfileField[]): ProfileFieldState {
  const fieldMap = new Map(initialProfileFields.map((field) => [field.key, field.value]));

  return {
    current_company: fieldMap.get("current_company") ?? "",
    current_designation: fieldMap.get("current_designation") ?? "",
    total_years_exp: fieldMap.get("total_years_exp") ?? "",
    total_months_exp: fieldMap.get("total_months_exp") ?? "",
    current_ctc: fieldMap.get("current_ctc") ?? "",
    expected_ctc: fieldMap.get("expected_ctc") ?? "",
    notice_period: fieldMap.get("notice_period") ?? "",
    highest_degree: fieldMap.get("highest_degree") ?? "",
    university: fieldMap.get("university") ?? "",
    graduation_year: fieldMap.get("graduation_year") ?? "",
    field_of_study: fieldMap.get("field_of_study") ?? "",
    skills: fieldMap.get("skills") ?? "",
    certifications: fieldMap.get("certifications") ?? "",
    work_authorization: fieldMap.get("work_authorization") ?? "",
    willing_to_relocate: fieldMap.get("willing_to_relocate") ?? "",
    relocation_cities: fieldMap.get("relocation_cities") ?? "",
    cover_letter_template: fieldMap.get("cover_letter_template") ?? "",
    custom_summary: fieldMap.get("custom_summary") ?? "",
    why_new_role: fieldMap.get("why_new_role") ?? "",
    gender: fieldMap.get("gender") ?? "",
    veteran_status: fieldMap.get("veteran_status") ?? "",
    disability_status: fieldMap.get("disability_status") ?? "",
    background_check_ok: fieldMap.get("background_check_ok") ?? "",
  };
}

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function OnboardingManager({
  initialUser,
  initialPreferences,
  initialConnectedAccounts,
  initialProfileFields,
}: {
  initialUser: CurrentUser;
  initialPreferences: UserJobPreferences;
  initialConnectedAccounts: ConnectedAccount[];
  initialProfileFields: ProfileField[];
}) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<StepId>(1);
  const [user, setUser] = useState({
    email: initialUser.email,
    notificationEmail: initialUser.notificationEmail ?? initialUser.email,
    fullName: initialUser.fullName,
    phone: initialUser.phone ?? "",
    whatsappNumber: initialUser.whatsappNumber ?? initialUser.phone ?? "",
    location: initialUser.location ?? "",
    linkedinUrl: initialUser.linkedinUrl ?? "",
    portfolioUrl: initialUser.portfolioUrl ?? "",
    githubUrl: initialUser.githubUrl ?? "",
    resumeUrl: initialUser.resumeUrl ?? "",
    resumeStoragePath: initialUser.resumeStoragePath ?? "",
  });
  const [profileFields, setProfileFields] = useState<ProfileFieldState>(() => buildProfileFieldState(initialProfileFields));
  const [preferences, setPreferences] = useState({
    preferredRoles: initialPreferences.preferredRoles.join(", "),
    preferredLocations: initialPreferences.preferredLocations.join(", "),
    minimumSalary: initialProfileFields.find((field) => field.key === "minimum_salary")?.value ?? "",
    workTypes: splitCommaSeparated(initialProfileFields.find((field) => field.key === "work_types")?.value ?? ""),
    employmentTypes: splitCommaSeparated(initialProfileFields.find((field) => field.key === "employment_types")?.value ?? ""),
    remotePreference: initialPreferences.remotePreference,
    blockedCompanies: initialPreferences.blockedCompanies.join(", "),
    notificationChannels: initialPreferences.notificationChannels,
  });
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>(initialConnectedAccounts);
  const [platformIdentifiers, setPlatformIdentifiers] = useState<Record<PlatformProvider, string>>({
    linkedin: initialUser.linkedinUrl ?? "",
    naukri: "",
    instahyre: "",
    hirist: "",
  });
  const [linkedinConsent, setLinkedinConsent] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<PlatformProvider | null>(null);
  const [extensionReady, setExtensionReady] = useState(false);
  const [checkingExtension, setCheckingExtension] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const jobPlatformMap = useMemo(() => normalizeAccountMap(connectedAccounts), [connectedAccounts]);
  const connectedPlatformCount = platformConfigs.filter((platform) => {
    const account = jobPlatformMap.get(platform.provider);
    return account && account.connectionStatus !== "disconnected";
  }).length;

  const canActivate = connectedPlatformCount > 0;

  useEffect(() => {
    let cancelled = false;

    void detectAutoApplyExtension().then((ready) => {
      if (cancelled) {
        return;
      }
      setExtensionReady(ready);
      setCheckingExtension(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleResumeUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingResume(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/me/resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await parseError(response, "Resume upload failed"));
      }

      const payload = (await response.json()) as {
        data: { storagePath: string; publicUrl: string | null; fileName: string };
      };

      setUser((current) => ({
        ...current,
        resumeStoragePath: payload.data.storagePath,
        resumeUrl: payload.data.publicUrl ?? current.resumeUrl,
      }));
      setMessage(`Resume uploaded: ${payload.data.fileName}`);
    } catch (uploadError) {
      setError(parseErrorMessage(uploadError, "Resume upload failed"));
    } finally {
      event.target.value = "";
      setIsUploadingResume(false);
    }
  }

  async function handleConnectPlatform(provider: PlatformProvider) {
    setError(null);
    setMessage(null);

    if (provider === "linkedin" && !linkedinConsent) {
      setError("LinkedIn connect karne se pehle consent accept karna zaroori hai.");
      return;
    }

    if (!extensionReady) {
      setError("AutoApply Chrome extension detect nahi hui. Extension load karo aur platform tab me login rakho.");
      return;
    }

    setConnectingProvider(provider);

    try {
      await capturePlatformSessionViaExtension(provider);
      const accountsResponse = await fetch("/api/me/connected-accounts", { cache: "no-store" });
      if (!accountsResponse.ok) {
        throw new Error(await parseError(accountsResponse, "Platform session captured but connected accounts could not refresh."));
      }
      const accountsPayload = (await accountsResponse.json()) as { data: ConnectedAccount[] };
      setConnectedAccounts(accountsPayload.data);
      setMessage(`${platformConfigs.find((platform) => platform.provider === provider)?.label ?? provider} connected via extension.`);
    } catch (connectError) {
      setError(parseErrorMessage(connectError, `Unable to connect ${provider}`));
    } finally {
      setConnectingProvider(null);
    }
  }

  async function persistProfileFields() {
    const fieldWrites = Object.entries(profileFieldConfig).flatMap(([key, label]) => {
      const value = profileFields[key as keyof ProfileFieldState].trim();
      if (!value) {
        return [];
      }

      return fetch(`/api/profile-fields/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          value,
          source: "manual",
        }),
      });
    });

    const preferenceFields = [
      {
        key: "minimum_salary",
        label: "Minimum salary",
        value: preferences.minimumSalary.trim(),
      },
      {
        key: "work_types",
        label: "Work types",
        value: preferences.workTypes.join(", "),
      },
      {
        key: "employment_types",
        label: "Employment types",
        value: preferences.employmentTypes.join(", "),
      },
    ].flatMap((field) => {
      if (!field.value) {
        return [];
      }

      return fetch(`/api/profile-fields/${field.key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: field.label,
          value: field.value,
          source: "manual",
        }),
      });
    });

    const responses = await Promise.all([...fieldWrites, ...preferenceFields]);
    const failed = responses.find((response) => !response.ok);

    if (failed) {
      throw new Error(await parseError(failed, "Unable to save extended onboarding fields"));
    }
  }

  async function ensureWatchers(searchTitles: string[], locations: string[]) {
    const watcherResponse = await fetch("/api/me/job-watchers", { cache: "no-store" });
    if (!watcherResponse.ok) {
      throw new Error(await parseError(watcherResponse, "Unable to load job watchers"));
    }

    const watcherPayload = (await watcherResponse.json()) as {
      data: Array<{
        id: number;
        sourcePlatform: PlatformProvider;
        provider: PlatformProvider;
        status: "active" | "paused" | "error";
      }>;
    };

    const existingWatchers = watcherPayload.data;
    const activePlatforms = platformConfigs
      .filter((platform) => {
        const account = jobPlatformMap.get(platform.provider);
        return account && account.connectionStatus !== "disconnected";
      })
      .map((platform) => platform.provider);

    const watcherIds: number[] = [];

    for (const platform of activePlatforms) {
      const existing = existingWatchers.find((watcher) => watcher.sourcePlatform === platform && watcher.provider === platform);
      if (existing) {
        watcherIds.push(existing.id);
        continue;
      }

      const response = await fetch("/api/me/job-watchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${platform} auto watcher`,
          sourcePlatform: platform,
          provider: platform,
          status: "active",
          pollingIntervalSeconds: watcherPollingByPlatform[platform],
          searchTitles,
          locations,
          recencyDays: 7,
          configuration: {
            source: "onboarding_activation",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(await parseError(response, `Unable to create ${platform} watcher`));
      }

      const payload = (await response.json()) as { data: { id: number } };
      watcherIds.push(payload.data.id);
    }

    await Promise.all(
      watcherIds.map(async (watcherId) => {
        const response = await fetch("/api/automation/enqueue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            queueName: "job-feed-watcher",
            payload: {
              watcherId,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(await parseError(response, `Unable to queue watcher ${watcherId}`));
        }
      }),
    );
  }

  async function handleActivate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canActivate) {
      setError("Kam se kam ek platform connect karna zaroori hai before AutoApply activation.");
      setActiveStep(5);
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const preferredRoles = splitCommaSeparated(preferences.preferredRoles);
      const preferredLocations = splitCommaSeparated(preferences.preferredLocations);
      const userResponsePromise = fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...user,
          onboardingCompleted: true,
          notificationEmail: user.notificationEmail || undefined,
          phone: user.phone || undefined,
          whatsappNumber: user.whatsappNumber || undefined,
          location: user.location || undefined,
          linkedinUrl: user.linkedinUrl || undefined,
          portfolioUrl: user.portfolioUrl || undefined,
          githubUrl: user.githubUrl || undefined,
          resumeUrl: user.resumeUrl || undefined,
          resumeStoragePath: user.resumeStoragePath || undefined,
        }),
      });

      const preferencesResponsePromise = fetch("/api/me/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredRoles,
          preferredLocations,
          remotePreference: preferences.remotePreference,
          referralPreference: "instant_apply",
          instantApplyEnabled: true,
          blockedCompanies: splitCommaSeparated(preferences.blockedCompanies),
          targetApplicationsPerDay: 30,
          notificationChannels: preferences.notificationChannels,
        }),
      });

      const [userResponse, preferencesResponse] = await Promise.all([userResponsePromise, preferencesResponsePromise]);

      if (!userResponse.ok) {
        throw new Error(await parseError(userResponse, "Unable to save candidate profile"));
      }

      if (!preferencesResponse.ok) {
        throw new Error(await parseError(preferencesResponse, "Unable to save job preferences"));
      }

      await persistProfileFields();
      await ensureWatchers(preferredRoles, preferredLocations);

      setMessage("AutoApply activated. Discovery watchers queued. Redirecting to dashboard...");
      router.push("/");
      router.refresh();
    } catch (saveError) {
      setError(parseErrorMessage(saveError, "Failed to activate AutoApply"));
    } finally {
      setIsSaving(false);
    }
  }

  function nextStep() {
    setError(null);
    setMessage(null);
    setActiveStep((current) => Math.min(6, current + 1) as StepId);
  }

  function previousStep() {
    setError(null);
    setMessage(null);
    setActiveStep((current) => Math.max(1, current - 1) as StepId);
  }

  return (
    <form className="space-y-6" onSubmit={handleActivate}>
      <Card className="overflow-hidden p-0">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-6 py-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">AutoApply Setup</p>
              <h2 className="text-3xl font-semibold text-white">Complete onboarding once. The system handles everything after that.</h2>
              <p className="max-w-xl text-sm text-slate-300">
                Resume, profile details, targeting, and platform connections now live in one flow. Scheduling, retries,
                and per-platform behavior stay in the backend policy engine.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Activation gate</p>
              <p className="mt-1 text-lg font-semibold text-white">{connectedPlatformCount} platform connected</p>
              <p className="mt-1 text-xs text-slate-400">
                {canActivate
                  ? "Activation available. Review your setup and start AutoApply."
                  : "Connect at least one job platform before AutoApply can run."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/5 bg-slate-950/50 px-4 py-4 md:grid-cols-6">
          {steps.map((step) => {
            const isActive = step.id === activeStep;
            const isPast = step.id < activeStep;

            return (
              <button
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-cyan-400/40 bg-cyan-500/10"
                    : isPast
                      ? "border-emerald-400/20 bg-emerald-500/10"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                }`}
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{step.kicker}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{step.title}</p>
                  {isPast ? <CheckCircle2 className="size-4 text-emerald-300" /> : <ChevronRight className="size-4 text-slate-500" />}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: 14 }}
          key={activeStep}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {activeStep === 1 ? (
            <Card className="p-6">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Welcome</p>
                    <h3 className="text-3xl font-semibold text-ink">Upload your resume, connect platforms, and let AutoApply run in the background.</h3>
                    <p className="max-w-xl text-sm text-muted">
                      This onboarding flow is optimized to collect enough structured data up front so later interruptions
                      stay rare. Once activated, the backend policy engine owns platform timing, retries, and throttling.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                      <Sparkles className="size-5 text-cyan-300" />
                      <p className="mt-3 text-sm font-medium text-white">One setup flow</p>
                      <p className="mt-1 text-xs text-slate-400">Resume, profile, preferences, and platform connect in one place.</p>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                      <LockKeyhole className="size-5 text-emerald-300" />
                      <p className="mt-3 text-sm font-medium text-white">Backend-managed automation</p>
                      <p className="mt-1 text-xs text-slate-400">Users do not manage schedules, queues, or retries.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">What happens after activation</p>
                  <ul className="mt-4 space-y-3 text-sm text-slate-300">
                    <li>Jobs are discovered from all connected platforms automatically.</li>
                    <li>Preferred roles, locations, and guardrails drive backend job selection.</li>
                    <li>Only new or unknown application questions should reach the user later.</li>
                  </ul>
                </div>
              </div>
            </Card>
          ) : null}

          {activeStep === 2 ? (
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Resume and Identity</p>
                <h3 className="text-2xl font-semibold text-ink">Start with your resume and canonical candidate identity.</h3>
                <p className="text-sm text-muted">This becomes the primary source of truth for user identity, resume handling, and notifications.</p>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Resume upload</p>
                    <p className="text-xs text-slate-400">Upload PDF, DOC, or DOCX. Parsing and autofill wiring will build on this step.</p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/20">
                    {isUploadingResume ? <Loader2 className="size-4 animate-spin" /> : null}
                    {isUploadingResume ? "Uploading..." : "Upload resume"}
                    <input
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      disabled={isUploadingResume}
                      type="file"
                      onChange={handleResumeUpload}
                    />
                  </label>
                </div>
                {user.resumeStoragePath ? (
                  <p className="mt-3 break-all text-xs text-emerald-300">Stored at: {user.resumeStoragePath}</p>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">No resume uploaded yet.</p>
                )}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Input placeholder="Full name" value={user.fullName} onChange={(event) => setUser((current) => ({ ...current, fullName: event.target.value }))} />
                <Input placeholder="Email address" type="email" value={user.email} onChange={(event) => setUser((current) => ({ ...current, email: event.target.value }))} />
                <Input
                  placeholder="Notification email"
                  type="email"
                  value={user.notificationEmail}
                  onChange={(event) => setUser((current) => ({ ...current, notificationEmail: event.target.value }))}
                />
                <Input placeholder="Phone number" value={user.phone} onChange={(event) => setUser((current) => ({ ...current, phone: event.target.value }))} />
                <Input
                  placeholder="WhatsApp number"
                  value={user.whatsappNumber}
                  onChange={(event) => setUser((current) => ({ ...current, whatsappNumber: event.target.value }))}
                />
                <Input placeholder="Current city" value={user.location} onChange={(event) => setUser((current) => ({ ...current, location: event.target.value }))} />
                <Input placeholder="LinkedIn profile URL" value={user.linkedinUrl} onChange={(event) => setUser((current) => ({ ...current, linkedinUrl: event.target.value }))} />
                <Input placeholder="GitHub URL" value={user.githubUrl} onChange={(event) => setUser((current) => ({ ...current, githubUrl: event.target.value }))} />
                <Input placeholder="Portfolio URL" value={user.portfolioUrl} onChange={(event) => setUser((current) => ({ ...current, portfolioUrl: event.target.value }))} />
                <Input placeholder="Resume public URL (optional)" value={user.resumeUrl} onChange={(event) => setUser((current) => ({ ...current, resumeUrl: event.target.value }))} />
              </div>
            </Card>
          ) : null}

          {activeStep === 3 ? (
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Profile Details</p>
                <h3 className="text-2xl font-semibold text-ink">Capture the details that reduce form interruptions later.</h3>
                <p className="text-sm text-muted">These fields are stored as structured onboarding data and reused across ATS and marketplace applications.</p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Input placeholder="Current company" value={profileFields.current_company} onChange={(event) => setProfileFields((current) => ({ ...current, current_company: event.target.value }))} />
                <Input placeholder="Current designation" value={profileFields.current_designation} onChange={(event) => setProfileFields((current) => ({ ...current, current_designation: event.target.value }))} />
                <Input placeholder="Total years of experience" value={profileFields.total_years_exp} onChange={(event) => setProfileFields((current) => ({ ...current, total_years_exp: event.target.value }))} />
                <Input placeholder="Additional months of experience" value={profileFields.total_months_exp} onChange={(event) => setProfileFields((current) => ({ ...current, total_months_exp: event.target.value }))} />
                <Input placeholder="Current CTC / salary" value={profileFields.current_ctc} onChange={(event) => setProfileFields((current) => ({ ...current, current_ctc: event.target.value }))} />
                <Input placeholder="Expected CTC / salary" value={profileFields.expected_ctc} onChange={(event) => setProfileFields((current) => ({ ...current, expected_ctc: event.target.value }))} />
                <Input placeholder="Notice period" value={profileFields.notice_period} onChange={(event) => setProfileFields((current) => ({ ...current, notice_period: event.target.value }))} />
                <Input placeholder="Work authorization" value={profileFields.work_authorization} onChange={(event) => setProfileFields((current) => ({ ...current, work_authorization: event.target.value }))} />
                <Input placeholder="Highest degree" value={profileFields.highest_degree} onChange={(event) => setProfileFields((current) => ({ ...current, highest_degree: event.target.value }))} />
                <Input placeholder="University" value={profileFields.university} onChange={(event) => setProfileFields((current) => ({ ...current, university: event.target.value }))} />
                <Input placeholder="Graduation year" value={profileFields.graduation_year} onChange={(event) => setProfileFields((current) => ({ ...current, graduation_year: event.target.value }))} />
                <Input placeholder="Field of study" value={profileFields.field_of_study} onChange={(event) => setProfileFields((current) => ({ ...current, field_of_study: event.target.value }))} />
                <Input placeholder="Skills (comma separated)" value={profileFields.skills} onChange={(event) => setProfileFields((current) => ({ ...current, skills: event.target.value }))} />
                <Input placeholder="Certifications (comma separated)" value={profileFields.certifications} onChange={(event) => setProfileFields((current) => ({ ...current, certifications: event.target.value }))} />
                <Input placeholder="Willing to relocate? yes / no" value={profileFields.willing_to_relocate} onChange={(event) => setProfileFields((current) => ({ ...current, willing_to_relocate: event.target.value }))} />
                <Input placeholder="Relocation cities" value={profileFields.relocation_cities} onChange={(event) => setProfileFields((current) => ({ ...current, relocation_cities: event.target.value }))} />
              </div>

              <div className="mt-6 grid gap-4">
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
                  placeholder="Short professional summary / tell us about yourself"
                  value={profileFields.custom_summary}
                  onChange={(event) => setProfileFields((current) => ({ ...current, custom_summary: event.target.value }))}
                />
                <textarea
                  className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
                  placeholder="Why are you looking for a new role?"
                  value={profileFields.why_new_role}
                  onChange={(event) => setProfileFields((current) => ({ ...current, why_new_role: event.target.value }))}
                />
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
                  placeholder="Cover letter template"
                  value={profileFields.cover_letter_template}
                  onChange={(event) => setProfileFields((current) => ({ ...current, cover_letter_template: event.target.value }))}
                />
              </div>
            </Card>
          ) : null}

          {activeStep === 4 ? (
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Job Preferences</p>
                <h3 className="text-2xl font-semibold text-ink">Define what AutoApply should chase automatically.</h3>
                <p className="text-sm text-muted">These preferences drive discovery, filtering, and application volume in the backend policy engine.</p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Input placeholder="Desired job titles" value={preferences.preferredRoles} onChange={(event) => setPreferences((current) => ({ ...current, preferredRoles: event.target.value }))} />
                <Input placeholder="Preferred locations" value={preferences.preferredLocations} onChange={(event) => setPreferences((current) => ({ ...current, preferredLocations: event.target.value }))} />
                <Input placeholder="Minimum salary" value={preferences.minimumSalary} onChange={(event) => setPreferences((current) => ({ ...current, minimumSalary: event.target.value }))} />
                <Input placeholder="Blocked companies" value={preferences.blockedCompanies} onChange={(event) => setPreferences((current) => ({ ...current, blockedCompanies: event.target.value }))} />
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium text-white">Work type</p>
                  <div className="mt-3 grid gap-3">
                    {workTypeOptions.map((option) => {
                      const checked = preferences.workTypes.includes(option);
                      return (
                        <label className="flex items-center gap-3 text-sm text-slate-200" key={option}>
                          <input
                            checked={checked}
                            type="checkbox"
                            onChange={(event) =>
                              setPreferences((current) => ({
                                ...current,
                                workTypes: event.target.checked
                                  ? [...current.workTypes, option]
                                  : current.workTypes.filter((entry) => entry !== option),
                              }))
                            }
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium text-white">Employment type</p>
                  <div className="mt-3 grid gap-3">
                    {employmentTypeOptions.map((option) => {
                      const checked = preferences.employmentTypes.includes(option);
                      return (
                        <label className="flex items-center gap-3 text-sm text-slate-200" key={option}>
                          <input
                            checked={checked}
                            type="checkbox"
                            onChange={(event) =>
                              setPreferences((current) => ({
                                ...current,
                                employmentTypes: event.target.checked
                                  ? [...current.employmentTypes, option]
                                  : current.employmentTypes.filter((entry) => entry !== option),
                              }))
                            }
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          {activeStep === 5 ? (
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Connect Platforms</p>
                <h3 className="text-2xl font-semibold text-ink">Connect at least one job platform before AutoApply can activate.</h3>
                <p className="text-sm text-muted">As more platforms connect, the backend will automatically use all of them. No user-side scheduling is exposed.</p>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {platformConfigs.map((platform) => {
                  const account = jobPlatformMap.get(platform.provider);
                  const isConnected = account && account.connectionStatus !== "disconnected";
                  const isBusy = connectingProvider === platform.provider;

                  return (
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5" key={platform.provider}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-semibold text-white">{platform.label}</p>
                            {platform.badge ? (
                              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                                {platform.badge}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-slate-400">{platform.description}</p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                            isConnected ? "bg-emerald-500/10 text-emerald-200" : "bg-slate-500/10 text-slate-300"
                          }`}
                        >
                          {isConnected ? "Connected" : "Not connected"}
                        </span>
                      </div>

                      <p className="mt-4 text-xs text-slate-400">{platform.helper}</p>
                      <Input
                        className="mt-4"
                        placeholder={`${platform.label} profile URL, account ID, or handle`}
                        value={platformIdentifiers[platform.provider]}
                        onChange={(event) =>
                          setPlatformIdentifiers((current) => ({
                            ...current,
                            [platform.provider]: event.target.value,
                          }))
                        }
                      />

                      {platform.provider === "linkedin" ? (
                        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                          <div className="flex items-start gap-3">
                            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-200" />
                            <div className="space-y-3">
                              <p className="text-xs text-amber-100">
                                LinkedIn automation is in Beta. AutoApply is capped at 25 Easy Apply and 5 Full Apply per day per user.
                              </p>
                              <label className="flex items-start gap-3 text-xs text-amber-100">
                                <input checked={linkedinConsent} type="checkbox" onChange={(event) => setLinkedinConsent(event.target.checked)} />
                                <span>I understand that LinkedIn may restrict unusual activity and I accept that risk before connecting.</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {!extensionReady ? (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-300">
                          {checkingExtension
                            ? "Checking for AutoApply Chrome extension..."
                            : "Install/load the AutoApply Chrome extension, keep the platform tab logged in, then connect."}
                        </div>
                      ) : null}

                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          {account?.accountIdentifier ? `Saved as ${account.accountIdentifier}` : "No identifier saved yet."}
                        </p>
                        <Button disabled={isBusy || !extensionReady || (platform.provider === "linkedin" && !linkedinConsent)} type="button" onClick={() => void handleConnectPlatform(platform.provider)}>
                          {isBusy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                          {isConnected ? "Refresh connection" : "Connect"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!canActivate ? (
                <div className="mt-6 rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                  At least one job platform must be connected before AutoApply can discover or apply to jobs on your behalf.
                </div>
              ) : null}
            </Card>
          ) : null}

          {activeStep === 6 ? (
            <Card className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Review and Activate</p>
                <h3 className="text-2xl font-semibold text-ink">Confirm your setup and start AutoApply.</h3>
                <p className="text-sm text-muted">Once activated, the dashboard becomes operational and the backend policy engine starts coordinating discovery and applications.</p>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Candidate</p>
                  <p className="mt-2 text-sm font-medium text-white">{user.fullName || "No name provided"}</p>
                  <p className="mt-1 text-xs text-slate-400">{user.email}</p>
                  <p className="mt-1 text-xs text-slate-400">{user.location || "Location pending"}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Targeting</p>
                  <p className="mt-2 text-sm font-medium text-white">{preferences.preferredRoles || "No target roles yet"}</p>
                  <p className="mt-1 text-xs text-slate-400">{preferences.preferredLocations || "No target locations yet"}</p>
                  <p className="mt-1 text-xs text-slate-400">{preferences.minimumSalary || "No salary floor set"}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Connected platforms</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {platformConfigs.map((platform) => {
                      const connected = Boolean(jobPlatformMap.get(platform.provider));
                      return (
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            connected ? "bg-emerald-500/10 text-emerald-200" : "bg-slate-500/10 text-slate-400"
                          }`}
                          key={platform.provider}
                        >
                          {platform.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {!canActivate ? (
                <div className="mt-6 rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                  Connect at least one platform to activate AutoApply.
                </div>
              ) : null}
            </Card>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <Card className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
            {!error && !message ? (
              <p className="text-sm text-slate-400">
                {activeStep === 6
                  ? "Review everything once, then activate. The system will use all connected platforms automatically."
                  : "Move through the setup flow. We will persist the full onboarding state on activation."}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button disabled={activeStep === 1 || isSaving} type="button" variant="secondary" onClick={previousStep}>
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>

            {activeStep < 6 ? (
              <Button disabled={isSaving || isUploadingResume} type="button" onClick={nextStep}>
                Continue
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button disabled={isSaving || !canActivate} type="submit">
                {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Start AutoApply
                <ArrowRight className="ml-2 size-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </form>
  );
}
