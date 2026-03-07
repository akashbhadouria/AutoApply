"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CurrentUser, UserJobPreferences } from "@/lib/api";

export function OnboardingManager({
  initialUser,
  initialPreferences,
}: {
  initialUser: CurrentUser;
  initialPreferences: UserJobPreferences;
}) {
  const [user, setUser] = useState({
    email: initialUser.email,
    fullName: initialUser.fullName,
    phone: initialUser.phone ?? "",
    location: initialUser.location ?? "",
    linkedinUrl: initialUser.linkedinUrl ?? "",
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
    notificationChannels: initialPreferences.notificationChannels.join(", "),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
            phone: user.phone || undefined,
            location: user.location || undefined,
            linkedinUrl: user.linkedinUrl || undefined,
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
            notificationChannels: preferences.notificationChannels.split(",").map((entry) => entry.trim()).filter(Boolean),
          }),
        }),
      ]);

      if (!userResponse.ok || !preferencesResponse.ok) {
        throw new Error("Unable to save onboarding data");
      }

      setMessage("Onboarding and job preferences saved.");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save onboarding");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]" onSubmit={handleSubmit}>
      <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Founder Identity</p>
          <h2 className="text-2xl font-semibold text-ink">Candidate identity and launch profile.</h2>
          <p className="text-sm text-muted">This data becomes the canonical user record for outreach, ATS autofill, and watcher targeting.</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Input placeholder="Founder Name" value={user.fullName} onChange={(event) => setUser((current) => ({ ...current, fullName: event.target.value }))} />
          <Input placeholder="founder@hirepilot.dev" type="email" value={user.email} onChange={(event) => setUser((current) => ({ ...current, email: event.target.value }))} />
          <Input placeholder="+91..." value={user.phone} onChange={(event) => setUser((current) => ({ ...current, phone: event.target.value }))} />
          <Input placeholder="Bangalore" value={user.location} onChange={(event) => setUser((current) => ({ ...current, location: event.target.value }))} />
          <Input placeholder="LinkedIn URL" value={user.linkedinUrl} onChange={(event) => setUser((current) => ({ ...current, linkedinUrl: event.target.value }))} />
          <Input placeholder="Portfolio URL" value={user.portfolioUrl} onChange={(event) => setUser((current) => ({ ...current, portfolioUrl: event.target.value }))} />
          <Input placeholder="GitHub URL" value={user.githubUrl} onChange={(event) => setUser((current) => ({ ...current, githubUrl: event.target.value }))} />
          <Input placeholder="Public resume URL" value={user.resumeUrl} onChange={(event) => setUser((current) => ({ ...current, resumeUrl: event.target.value }))} />
        </div>

        <div className="mt-4">
          <Input placeholder="Local resume storage path (optional)" value={user.resumeStoragePath} onChange={(event) => setUser((current) => ({ ...current, resumeStoragePath: event.target.value }))} />
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Job Preferences</p>
            <h2 className="text-2xl font-semibold text-ink">What HirePilot should chase.</h2>
          </div>

          <div className="mt-6 space-y-4">
            <Input placeholder="Preferred roles, comma separated" value={preferences.preferredRoles} onChange={(event) => setPreferences((current) => ({ ...current, preferredRoles: event.target.value }))} />
            <Input placeholder="Preferred locations, comma separated" value={preferences.preferredLocations} onChange={(event) => setPreferences((current) => ({ ...current, preferredLocations: event.target.value }))} />
            <Input placeholder="Blocked companies, comma separated" value={preferences.blockedCompanies} onChange={(event) => setPreferences((current) => ({ ...current, blockedCompanies: event.target.value }))} />
            <Input placeholder="dashboard, telegram" value={preferences.notificationChannels} onChange={(event) => setPreferences((current) => ({ ...current, notificationChannels: event.target.value }))} />
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
          </div>
        </Card>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

        <Button className="w-full" disabled={isSaving} type="submit">
          {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Save onboarding
        </Button>
      </div>
    </form>
  );
}
