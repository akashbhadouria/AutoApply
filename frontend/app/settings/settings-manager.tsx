"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { SystemSetting } from "@/lib/api";

interface SettingFormState {
  key: string;
  label: string;
  value: string;
  valueType: SystemSetting["valueType"];
  category: string;
}

const emptyForm: SettingFormState = {
  key: "",
  label: "",
  value: "",
  valueType: "string",
  category: "general",
};

const suggestedSettings: Array<Pick<SettingFormState, "key" | "label" | "value" | "valueType" | "category">> = [
  { key: "dashboard_enabled", label: "Dashboard Enabled", value: "true", valueType: "boolean", category: "notifications" },
  { key: "email_enabled", label: "Email Enabled", value: "true", valueType: "boolean", category: "notifications" },
  { key: "telegram_enabled", label: "Telegram Enabled", value: "true", valueType: "boolean", category: "notifications" },
  { key: "whatsapp_enabled", label: "WhatsApp Enabled", value: "false", valueType: "boolean", category: "notifications" },
  { key: "application_rate_limit_per_hour", label: "Application Rate Limit / Hour", value: "10", valueType: "number", category: "automation" },
  { key: "referral_timeout_hours", label: "Referral Timeout Hours", value: "24", valueType: "number", category: "automation" },
];

export function SettingsManager({ initialSettings }: { initialSettings: SystemSetting[] }) {
  const [settings, setSettings] = useState(initialSettings);
  const [form, setForm] = useState<SettingFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function refreshSettings() {
    const response = await fetch("/api/settings", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to refresh settings");
    }
    const payload = (await response.json()) as { data: SystemSetting[] };
    setSettings(payload.data);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/settings/${form.key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Unable to save setting");
      }

      setForm(emptyForm);
      await refreshSettings();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save setting");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(key: string) {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/settings/${key}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        throw new Error("Unable to delete setting");
      }

      await refreshSettings();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete setting");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Settings</p>
            <h2 className="text-2xl font-semibold text-ink">Persist operator-level configuration outside code.</h2>
            <p className="text-sm text-muted">
              Store runtime settings for notifications, automation thresholds, and future channel integrations without editing source files.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Input placeholder="Setting key" required value={form.key} onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))} />
            <Input placeholder="Label" required value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} />
            <textarea
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
              placeholder="Value"
              required
              value={form.value}
              onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <select
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
                value={form.valueType}
                onChange={(event) => setForm((current) => ({ ...current, valueType: event.target.value as SystemSetting["valueType"] }))}
              >
                <option value="string">string</option>
                <option value="boolean">boolean</option>
                <option value="number">number</option>
                <option value="json">json</option>
              </select>
              <Input placeholder="Category" required value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button className="w-full" disabled={isSaving} type="submit">
              {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save setting
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Suggested keys</p>
          <div className="mt-4 space-y-3">
            {suggestedSettings.map((setting) => (
              <button
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
                key={setting.key}
                onClick={() => setForm(setting)}
                type="button"
              >
                <p className="text-sm font-medium text-white">{setting.label}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {setting.key} · {setting.category} · {setting.valueType}
                </p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-2">
        <div className="flex items-center justify-between px-4 pb-4 pt-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Stored settings</p>
            <p className="text-sm text-muted">These records are the control plane for future notification channels and automation policy.</p>
          </div>
          <p className="rounded-full bg-slate-900/80 px-3 py-1 text-sm font-medium text-ink">{settings.length} settings</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Key</TableHeaderCell>
                <TableHeaderCell>Label</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Value</TableHeaderCell>
                <TableHeaderCell className="text-right">Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {settings.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-10 text-muted" colSpan={6}>
                    No settings stored yet.
                  </TableCell>
                </TableRow>
              ) : (
                settings.map((setting) => (
                  <TableRow key={setting.key}>
                    <TableCell className="font-medium">{setting.key}</TableCell>
                    <TableCell>{setting.label}</TableCell>
                    <TableCell>{setting.category}</TableCell>
                    <TableCell>{setting.valueType}</TableCell>
                    <TableCell className="max-w-xs truncate">{setting.value}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink"
                          disabled={isSaving}
                          onClick={() =>
                            setForm({
                              key: setting.key,
                              label: setting.label,
                              value: setting.value,
                              valueType: setting.valueType,
                              category: setting.category,
                            })
                          }
                          type="button"
                        >
                          Edit
                        </Button>
                        <Button
                          className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink"
                          disabled={isSaving}
                          onClick={() => handleDelete(setting.key)}
                          type="button"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </Button>
                      </div>
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
