"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { ProfileField } from "@/lib/api";

interface FormState {
  key: string;
  label: string;
  value: string;
  source: ProfileField["source"];
}

const emptyForm: FormState = {
  key: "",
  label: "",
  value: "",
  source: "manual",
};

export function ProfileManager({ initialFields }: { initialFields: ProfileField[] }) {
  const [fields, setFields] = useState(initialFields);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshFields() {
    const response = await fetch("/api/profile-fields", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to refresh profile fields");
    }

    const payload = (await response.json()) as { data: ProfileField[] };
    setFields(payload.data);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/profile-fields/${form.key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: form.label,
          value: form.value,
          source: form.source,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save the field");
      }

      setForm(emptyForm);
      await refreshFields();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save field");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(key: string) {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/profile-fields/${key}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        throw new Error("Unable to delete the field");
      }

      await refreshFields();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete field");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setFields(initialFields);
  }, [initialFields]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Profile Manager</p>
          <h2 className="text-2xl font-semibold text-ink">Store canonical values once, reuse them everywhere.</h2>
          <p className="text-sm text-muted">
            Use stable keys like <span className="font-medium text-ink">current_salary</span> or <span className="font-medium text-ink">notice_period</span> so later ATS automation can map fields consistently.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="field-key">
              Field key
            </label>
            <Input
              id="field-key"
              onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))}
              placeholder="notice_period"
              required
              value={form.key}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="field-label">
              Label
            </label>
            <Input
              id="field-label"
              onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              placeholder="Notice Period"
              required
              value={form.label}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="field-value">
              Value
            </label>
            <Input
              id="field-value"
              onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
              placeholder="30 days"
              required
              value={form.value}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="field-source">
              Source
            </label>
            <select
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none transition focus:border-accent"
              id="field-source"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  source: event.target.value as ProfileField["source"],
                }))
              }
              value={form.source}
            >
              <option value="manual">manual</option>
              <option value="learned">learned</option>
              <option value="imported">imported</option>
            </select>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save field
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-2">
        <div className="flex items-center justify-between px-4 pb-4 pt-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Stored values</p>
            <p className="text-sm text-muted">These values become the source of truth for later automation workers.</p>
          </div>
          <p className="rounded-full bg-canvas px-3 py-1 text-sm font-medium text-ink">{fields.length} fields</p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Key</TableHeaderCell>
                <TableHeaderCell>Label</TableHeaderCell>
                <TableHeaderCell>Value</TableHeaderCell>
                <TableHeaderCell>Source</TableHeaderCell>
                <TableHeaderCell className="text-right">Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-10 text-muted" colSpan={5}>
                    No profile fields stored yet.
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((field) => (
                  <TableRow key={field.key}>
                    <TableCell className="font-medium">{field.key}</TableCell>
                    <TableCell>{field.label}</TableCell>
                    <TableCell>{field.value}</TableCell>
                    <TableCell className="capitalize text-muted">{field.source}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink"
                        disabled={isLoading}
                        onClick={() => handleDelete(field.key)}
                        type="button"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </Button>
                    </TableCell>
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

