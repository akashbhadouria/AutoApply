"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { FieldMapping, FieldMappingSuggestionResult, Job } from "@/lib/api";

const emptyForm = {
  rawLabel: "",
  profileKey: "",
  confidence: "manual" as FieldMapping["confidence"],
};

const emptySuggestionForm = {
  rawLabel: "",
  jobId: "",
};

export function FieldMappingsManager({
  initialMappings,
  jobs,
  profileKeys,
}: {
  initialMappings: FieldMapping[];
  jobs: Job[];
  profileKeys: string[];
}) {
  const [mappings, setMappings] = useState(initialMappings);
  const [form, setForm] = useState(emptyForm);
  const [suggestionForm, setSuggestionForm] = useState(emptySuggestionForm);
  const [suggestion, setSuggestion] = useState<FieldMappingSuggestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  async function refreshMappings() {
    const response = await fetch("/api/field-mappings", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to refresh field mappings");
    }
    const payload = (await response.json()) as { data: FieldMapping[] };
    setMappings(payload.data);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/field-mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Unable to save field mapping");
      }

      setForm(emptyForm);
      await refreshMappings();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save field mapping");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSuggest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSuggesting(true);

    try {
      const selectedJob = jobs.find((job) => job.id === Number(suggestionForm.jobId));
      const response = await fetch("/api/agents/field-mapping-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawLabel: suggestionForm.rawLabel,
          company: selectedJob?.company,
          jobTitle: selectedJob?.title,
          existingProfileKeys: profileKeys,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to generate mapping suggestion");
      }

      const payload = (await response.json()) as { data: FieldMappingSuggestionResult };
      setSuggestion(payload.data);
      setForm({
        rawLabel: suggestionForm.rawLabel,
        profileKey: payload.data.suggestedProfileKey,
        confidence: "suggested",
      });
    } catch (suggestionError) {
      setError(suggestionError instanceof Error ? suggestionError.message : "Failed to suggest field mapping");
    } finally {
      setIsSuggesting(false);
    }
  }

  useEffect(() => {
    setMappings(initialMappings);
  }, [initialMappings]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Agent Suggestion</p>
            <h2 className="text-2xl font-semibold text-ink">Generate a candidate mapping before saving it.</h2>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSuggest}>
            <Input
              placeholder="Unknown ATS label"
              required
              value={suggestionForm.rawLabel}
              onChange={(event) => setSuggestionForm((current) => ({ ...current, rawLabel: event.target.value }))}
            />
            <select
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
              value={suggestionForm.jobId}
              onChange={(event) => setSuggestionForm((current) => ({ ...current, jobId: event.target.value }))}
            >
              <option value="">Optional job context</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.company} - {job.title}
                </option>
              ))}
            </select>
            <div className="rounded-[20px] border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
              Existing profile keys: {profileKeys.join(", ")}
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button className="w-full" disabled={isSuggesting} type="submit">
              {isSuggesting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Suggest mapping
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Suggested Result</p>
            <h2 className="text-2xl font-semibold text-ink">Review the agent output before persisting it.</h2>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[20px] border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
              <p>Normalized label: {suggestion?.normalizedLabel ?? "Waiting for suggestion"}</p>
              <p>Suggested key: {suggestion?.suggestedProfileKey ?? "Waiting for suggestion"}</p>
              <p>Confidence: {suggestion?.confidence ?? "Waiting for suggestion"}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              {suggestion?.rationale ?? "The suggestion rationale will appear here after the agent runs."}
            </div>
            {suggestion ? (
              <div className="rounded-[20px] border border-cyan-400/20 bg-cyan-400/10 p-4 text-xs text-cyan-100">
                Prompt template: {suggestion.promptArtifact.templateName}
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Field Mappings</p>
          <h2 className="text-2xl font-semibold text-ink">Teach the ATS engine how raw labels map to profile fields.</h2>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input placeholder="Raw field label" required value={form.rawLabel} onChange={(event) => setForm((current) => ({ ...current, rawLabel: event.target.value }))} />
          <Input placeholder="Profile key" required value={form.profileKey} onChange={(event) => setForm((current) => ({ ...current, profileKey: event.target.value }))} />
          <select
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
            value={form.confidence}
            onChange={(event) => setForm((current) => ({ ...current, confidence: event.target.value as FieldMapping["confidence"] }))}
          >
            <option value="manual">manual</option>
            <option value="learned">learned</option>
            <option value="suggested">suggested</option>
          </select>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save field mapping
          </Button>
        </form>
        </Card>

        <Card className="overflow-hidden p-2">
          <div className="flex items-center justify-between px-4 pb-4 pt-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Known mappings</p>
            <p className="rounded-full bg-slate-900/80 px-3 py-1 text-sm font-medium text-ink">{mappings.length} mappings</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Raw label</TableHeaderCell>
                  <TableHeaderCell>Profile key</TableHeaderCell>
                  <TableHeaderCell>Confidence</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mappings.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-4 py-10 text-muted" colSpan={3}>
                      No field mappings yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  mappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell className="font-medium">{mapping.rawLabel}</TableCell>
                      <TableCell>{mapping.profileKey}</TableCell>
                      <TableCell>{mapping.confidence}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
