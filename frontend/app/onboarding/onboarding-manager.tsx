"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CurrentUser, UserJobPreferences } from "@/lib/api";

const notificationChannelOptions = [
  { value: "dashboard", label: "Dashboard" },
  { value: "email", label: "Email" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
] as const;

async function parseError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function OnboardingManager({
  initialUser,
  initialPreferences,
}: {
  initialUser: CurrentUser;
  initialPreferences: UserJobPreferences;
}) {
  const router = useRouter();
  const [user, setUser] = useState({
    email: initialUser.email,
    notificationEmail: initialUser.notificationEmail ?? initialUser.email,
    fullName: initialUser.fullName,
    phone: initialUser.phone ?? "",
    whatsappNumber: initialUser.whatsappNumber ?? initialUser.phone ?? "",
    location: initialUser.location ?? "",
    linkedinUrl: initialUser.linkedinUrl ?? "",
    telegramUsername: initialUser.telegramUsername ?? "",
    telegramChatId: initialUser.telegramChatId ?? "",
    portfolioUrl: initialUser.portfolioUrl ?? "",
    githubUrl: initialUser.githubUrl ?? "",
    resumeUrl: initialUser.resumeUrl ?? "",
    resumeStoragePath: initialUser.resumeStoragePath ?? "",
    onboardingCompleted: initialUser.onboardingCompleted,
  });
  const [preferences, setPreferences] = useState({
    preferredRoles: initialPreferences.preferredRoles.join(", "),
    preferredLocations: initialPreferences.preferredLocations.join(", "),
    remotePreference: initialPreferences.remotePreference,
    referralPreference: initialPreferences.referralPreference,
    instantApplyEnabled: initialPreferences.instantApplyEnabled,
    blockedCompanies: initialPreferences.blockedCompanies.join(", "),
    targetApplicationsPerDay: String(initialPreferences.targetApplicationsPerDay),
    notificationChannels: initialPreferences.notificationChannels,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(uploadError instanceof Error ? uploadError.message : "Resume upload failed");
    } finally {
      event.target.value = "";
      setIsUploadingResume(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const [userResponse, preferencesResponse] = await Promise.all([
        fetch("/api/me", {
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
            telegramUsername: user.telegramUsername || undefined,
            telegramChatId: user.telegramChatId || undefined,
            portfolioUrl: user.portfolioUrl || undefined,
            githubUrl: user.githubUrl || undefined,
            resumeUrl: user.resumeUrl || undefined,
            resumeStoragePath: user.resumeStoragePath || undefined,
          }),
        }),
        fetch("/api/me/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preferredRoles: preferences.preferredRoles.split(",").map((entry) => entry.trim()).filter(Boolean),
            preferredLocations: preferences.preferredLocations.split(",").map((entry) => entry.trim()).filter(Boolean),
            remotePreference: preferences.remotePreference,
            referralPreference: preferences.referralPreference,
            instantApplyEnabled: preferences.instantApplyEnabled,
            blockedCompanies: preferences.blockedCompanies.split(",").map((entry) => entry.trim()).filter(Boolean),
            targetApplicationsPerDay: Number(preferences.targetApplicationsPerDay),
            notificationChannels: preferences.notificationChannels,
          }),
        }),
      ]);

      if (!userResponse.ok) {
        throw new Error(await parseError(userResponse, "Unable to save profile details"));
      }

      if (!preferencesResponse.ok) {
        throw new Error(await parseError(preferencesResponse, "Unable to save onboarding preferences"));
      }

      setMessage("Onboarding and job preferences saved. Redirecting to connected accounts...");
      router.push("/connected-accounts");
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save onboarding");
    } finally {
      setIsSaving(false);
    }
  }

  function goToNextStep() {
    setError(null);
    setMessage(null);
    setActiveStep(2);
  }

  function goToPreviousStep() {
    setError(null);
    setMessage(null);
    setActiveStep(1);
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Setup Flow</p>
            <h2 className="text-2xl font-semibold text-ink">
              {activeStep === 1 ? "Step 1 · Candidate identity and contact targets." : "Step 2 · Job preferences and automation policy."}
            </h2>
            <p className="text-sm text-muted">
              {activeStep === 1
                ? "Pehle candidate identity, notification destinations, aur resume setup complete karo."
                : "Ab AutoApply ko batao ki kis type ki jobs chase karni hain aur kis policy se react karna hai."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="Go to previous onboarding step"
              className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={activeStep === 1}
              type="button"
              onClick={goToPreviousStep}
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="min-w-28 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-sm text-slate-300">
              {activeStep} / 2
            </div>
            <button
              aria-label="Go to next onboarding step"
              className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={activeStep === 2}
              type="button"
              onClick={goToNextStep}
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </Card>

      {activeStep === 1 ? (
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Founder Identity</p>
            <h2 className="text-2xl font-semibold text-ink">Candidate identity and launch profile.</h2>
            <p className="text-sm text-muted">This data becomes the canonical user record for outreach, ATS autofill, and watcher targeting.</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input placeholder="Founder Name" value={user.fullName} onChange={(event) => setUser((current) => ({ ...current, fullName: event.target.value }))} />
            <Input placeholder="founder@autoapply.dev" type="email" value={user.email} onChange={(event) => setUser((current) => ({ ...current, email: event.target.value }))} />
            <Input placeholder="Notification email" type="email" value={user.notificationEmail} onChange={(event) => setUser((current) => ({ ...current, notificationEmail: event.target.value }))} />
            <Input placeholder="+91..." value={user.phone} onChange={(event) => setUser((current) => ({ ...current, phone: event.target.value }))} />
            <Input placeholder="WhatsApp number" value={user.whatsappNumber} onChange={(event) => setUser((current) => ({ ...current, whatsappNumber: event.target.value }))} />
            <Input placeholder="Bangalore" value={user.location} onChange={(event) => setUser((current) => ({ ...current, location: event.target.value }))} />
            <Input placeholder="LinkedIn URL" value={user.linkedinUrl} onChange={(event) => setUser((current) => ({ ...current, linkedinUrl: event.target.value }))} />
            <Input placeholder="Telegram username" value={user.telegramUsername} onChange={(event) => setUser((current) => ({ ...current, telegramUsername: event.target.value }))} />
            <Input placeholder="Telegram chat ID (optional, best for live bot delivery)" value={user.telegramChatId} onChange={(event) => setUser((current) => ({ ...current, telegramChatId: event.target.value }))} />
            <Input placeholder="Portfolio URL" value={user.portfolioUrl} onChange={(event) => setUser((current) => ({ ...current, portfolioUrl: event.target.value }))} />
            <Input placeholder="GitHub URL" value={user.githubUrl} onChange={(event) => setUser((current) => ({ ...current, githubUrl: event.target.value }))} />
            <Input placeholder="Public resume URL" value={user.resumeUrl} onChange={(event) => setUser((current) => ({ ...current, resumeUrl: event.target.value }))} />
          </div>

          <div className="mt-4">
            <Input placeholder="Local resume storage path (optional)" value={user.resumeStoragePath} onChange={(event) => setUser((current) => ({ ...current, resumeStoragePath: event.target.value }))} />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-ink">Resume upload</p>
                <p className="text-xs text-muted">PDF, DOC, and DOCX files can be uploaded locally for ATS autofill.</p>
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-500/20">
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
              <p className="mt-3 text-xs text-muted">No local resume uploaded yet.</p>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button disabled={isUploadingResume} type="button" onClick={goToNextStep}>
              Next step
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Job Preferences</p>
            <h2 className="text-2xl font-semibold text-ink">What AutoApply should chase.</h2>
          </div>

          <div className="mt-6 space-y-4">
            <Input placeholder="Preferred roles, comma separated" value={preferences.preferredRoles} onChange={(event) => setPreferences((current) => ({ ...current, preferredRoles: event.target.value }))} />
            <Input placeholder="Preferred locations, comma separated" value={preferences.preferredLocations} onChange={(event) => setPreferences((current) => ({ ...current, preferredLocations: event.target.value }))} />
            <Input placeholder="Blocked companies, comma separated" value={preferences.blockedCompanies} onChange={(event) => setPreferences((current) => ({ ...current, blockedCompanies: event.target.value }))} />
            <Input placeholder="Target applications per day" type="number" value={preferences.targetApplicationsPerDay} onChange={(event) => setPreferences((current) => ({ ...current, targetApplicationsPerDay: event.target.value }))} />

            <select className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none" value={preferences.remotePreference} onChange={(event) => setPreferences((current) => ({ ...current, remotePreference: event.target.value as typeof current.remotePreference }))}>
              <option value="remote_only">remote_only</option>
              <option value="hybrid">hybrid</option>
              <option value="onsite_only">onsite_only</option>
              <option value="any">any</option>
            </select>

            <select className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none" value={preferences.referralPreference} onChange={(event) => setPreferences((current) => ({ ...current, referralPreference: event.target.value as typeof current.referralPreference }))}>
              <option value="referral_first">referral_first</option>
              <option value="instant_apply">instant_apply</option>
              <option value="balanced">balanced</option>
            </select>

            <label className="flex items-center gap-3 text-sm text-ink">
              <input checked={preferences.instantApplyEnabled} type="checkbox" onChange={(event) => setPreferences((current) => ({ ...current, instantApplyEnabled: event.target.checked }))} />
              Fresh jobs ke liye instant apply allow karo
            </label>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-ink">Notification channels</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {notificationChannelOptions.map((channel) => {
                  const checked = preferences.notificationChannels.includes(channel.value);

                  return (
                    <label key={channel.value} className="flex items-center gap-3 text-sm text-ink">
                      <input
                        checked={checked}
                        type="checkbox"
                        onChange={(event) =>
                          setPreferences((current) => ({
                            ...current,
                            notificationChannels: event.target.checked
                              ? [...current.notificationChannels, channel.value]
                              : current.notificationChannels.filter((value) => value !== channel.value),
                          }))
                        }
                      />
                      {channel.label}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted">Kam se kam ek channel select karo. Dashboard usually on rehna chahiye.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Button className="sm:w-auto" type="button" variant="secondary" onClick={goToPreviousStep}>
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>

            <div className="space-y-2 text-right">
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
            </div>

            <Button className="sm:w-auto" disabled={isSaving} type="submit">
              {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save and continue
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </Card>
      )}
    </form>
  );
}
