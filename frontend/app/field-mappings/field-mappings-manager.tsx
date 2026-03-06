"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { FieldMapping } from "@/lib/api";

const emptyForm = {
  rawLabel: "",
  profileKey: "",
  confidence: "manual" as FieldMapping["confidence"],
};

export function FieldMappingsManager({ initialMappings }: { initialMappings: FieldMapping[] }) {
  const [mappings, setMappings] = useState(initialMappings);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    setMappings(initialMappings);
  }, [initialMappings]);

  return (
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
  );
}
