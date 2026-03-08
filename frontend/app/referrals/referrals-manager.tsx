"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { Contact, Job, ProfileField, Referral, ReferralDraftResult } from "@/lib/api";

interface ContactFormState {
  company: string;
  fullName: string;
  firstName: string;
  title: string;
  profileUrl: string;
  email: string;
  sourcePlatform: Job["primarySourcePlatform"];
}

interface ReferralFormState {
  jobId: string;
  contactId: string;
  status: Referral["status"];
  outreachMessage: string;
  connectionRequestMessage: string;
  messageSentAt: string;
}

const emptyContactForm: ContactFormState = {
  company: "",
  fullName: "",
  firstName: "",
  title: "",
  profileUrl: "",
  email: "",
  sourcePlatform: "linkedin",
};

const emptyReferralForm: ReferralFormState = {
  jobId: "",
  contactId: "",
  status: "pending",
  outreachMessage: "",
  connectionRequestMessage: "",
  messageSentAt: "",
};

const selectClass =
  "h-10 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20";

const textareaClass =
  "w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 resize-none";

export function ReferralsManager({
  initialContacts,
  initialProfileFields,
  initialReferrals,
  jobs,
}: {
  initialContacts: Contact[];
  initialProfileFields: ProfileField[];
  initialReferrals: Referral[];
  jobs: Job[];
}) {
  const [contacts, setContacts] = useState(initialContacts);
  const [referrals, setReferrals] = useState(initialReferrals);
  const [profileFields, setProfileFields] = useState(initialProfileFields);
  const [contactForm, setContactForm] = useState<ContactFormState>(emptyContactForm);
  const [referralForm, setReferralForm] = useState<ReferralFormState>(emptyReferralForm);
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  const [isLoadingReferral, setIsLoadingReferral] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [updatingReferralId, setUpdatingReferralId] = useState<number | null>(null);
  const [draftResult, setDraftResult] = useState<ReferralDraftResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const jobOptions = useMemo(
    () => jobs.map((job) => ({ id: job.id, label: `${job.company} — ${job.title}` })),
    [jobs],
  );
  const profileFieldMap = useMemo(
    () => new Map(profileFields.map((field) => [field.key, field.value])),
    [profileFields],
  );
  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === Number(referralForm.jobId)) ?? null,
    [jobs, referralForm.jobId],
  );
  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === Number(referralForm.contactId)) ?? null,
    [contacts, referralForm.contactId],
  );

  async function refreshContacts() {
    const response = await fetch("/api/contacts", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to refresh contacts");
    const payload = (await response.json()) as { data: Contact[] };
    setContacts(payload.data);
  }

  async function refreshReferrals() {
    const response = await fetch("/api/referrals", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to refresh referrals");
    const payload = (await response.json()) as { data: Referral[] };
    setReferrals(payload.data);
  }

  async function handleContactSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoadingContact(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: contactForm.company,
          fullName: contactForm.fullName,
          firstName: contactForm.firstName,
          title: contactForm.title,
          profileUrl: contactForm.profileUrl || undefined,
          email: contactForm.email || undefined,
          sourcePlatform: contactForm.sourcePlatform,
        }),
      });
      if (!response.ok) throw new Error("Unable to save contact");
      setContactForm(emptyContactForm);
      await refreshContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save contact");
    } finally {
      setIsLoadingContact(false);
    }
  }

  async function handleReferralSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoadingReferral(true);
    try {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: Number(referralForm.jobId),
          contactId: Number(referralForm.contactId),
          status: referralForm.status,
          outreachMessage: referralForm.outreachMessage,
          connectionRequestMessage: referralForm.connectionRequestMessage || undefined,
          messageSentAt: referralForm.messageSentAt ? new Date(referralForm.messageSentAt).toISOString() : undefined,
        }),
      });
      if (!response.ok) throw new Error("Unable to save referral");
      setReferralForm(emptyReferralForm);
      await refreshReferrals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save referral");
    } finally {
      setIsLoadingReferral(false);
    }
  }

  async function handleGenerateDraft() {
    if (!selectedJob || !selectedContact) {
      setError("Select both a job and a contact before generating a draft.");
      return;
    }
    setError(null);
    setIsGeneratingDraft(true);
    try {
      const response = await fetch("/api/agents/referral-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: selectedJob.company,
          jobTitle: selectedJob.title,
          location: selectedJob.location,
          contactFirstName: selectedContact.firstName,
          contactTitle: selectedContact.title,
          userName: profileFieldMap.get("name") ?? "Candidate",
          resumeLink: profileFieldMap.get("resume_link") ?? undefined,
          portfolioLink: profileFieldMap.get("portfolio") ?? undefined,
          yearsOfExperience: profileFieldMap.get("years_experience") ?? undefined,
          primarySkills: ["React", "TypeScript", "UI engineering"],
        }),
      });
      if (!response.ok) throw new Error("Unable to generate referral draft");
      const payload = (await response.json()) as { data: ReferralDraftResult };
      setDraftResult(payload.data);
      setReferralForm((c) => ({
        ...c,
        outreachMessage: payload.data.outreachMessage,
        connectionRequestMessage: payload.data.connectionRequestMessage,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate referral draft");
    } finally {
      setIsGeneratingDraft(false);
    }
  }

  async function handleReferralStatusUpdate(referralId: number, status: Referral["status"]) {
    setError(null);
    setUpdatingReferralId(referralId);
    try {
      const response = await fetch(`/api/referrals/${referralId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          repliedAt: status === "replied" ? new Date().toISOString() : undefined,
        }),
      });
      if (!response.ok) throw new Error("Unable to update referral status");
      await refreshReferrals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update referral status");
    } finally {
      setUpdatingReferralId(null);
    }
  }

  useEffect(() => {
    setContacts(initialContacts);
    setReferrals(initialReferrals);
    setProfileFields(initialProfileFields);
  }, [initialContacts, initialProfileFields, initialReferrals]);

  return (
    <div className="space-y-6">
      {/* Forms row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add Contact */}
        <Card className="p-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-500">Contacts</p>
          <h2 className="mb-5 text-lg font-semibold text-white">Add referral target</h2>
          <form className="space-y-3" onSubmit={handleContactSubmit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Company *" required value={contactForm.company} onChange={(e) => setContactForm((c) => ({ ...c, company: e.target.value }))} />
              <Input placeholder="Full name *" required value={contactForm.fullName} onChange={(e) => setContactForm((c) => ({ ...c, fullName: e.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="First name *" required value={contactForm.firstName} onChange={(e) => setContactForm((c) => ({ ...c, firstName: e.target.value }))} />
              <Input placeholder="Title *" required value={contactForm.title} onChange={(e) => setContactForm((c) => ({ ...c, title: e.target.value }))} />
            </div>
            <Input placeholder="Profile URL" value={contactForm.profileUrl} onChange={(e) => setContactForm((c) => ({ ...c, profileUrl: e.target.value }))} />
            <Input placeholder="Email" value={contactForm.email} onChange={(e) => setContactForm((c) => ({ ...c, email: e.target.value }))} />
            <select
              className={selectClass}
              value={contactForm.sourcePlatform}
              onChange={(e) => setContactForm((c) => ({ ...c, sourcePlatform: e.target.value as Job["primarySourcePlatform"] }))}
            >
              <option value="linkedin">LinkedIn</option>
              <option value="instahyre">Instahyre</option>
              <option value="hirist">Hirist</option>
              <option value="naukri">Naukri</option>
              <option value="company_site">Company Site</option>
            </select>
            {error ? (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
            ) : null}
            <Button className="w-full" disabled={isLoadingContact} type="submit">
              {isLoadingContact ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save Contact
            </Button>
          </form>
        </Card>

        {/* Add Referral */}
        <Card className="p-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400">Referrals</p>
          <h2 className="mb-5 text-lg font-semibold text-white">Link job to contact</h2>
          <form className="space-y-3" onSubmit={handleReferralSubmit}>
            <select
              className={selectClass}
              required
              value={referralForm.jobId}
              onChange={(e) => setReferralForm((c) => ({ ...c, jobId: e.target.value }))}
            >
              <option value="">Select job</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>{job.label}</option>
              ))}
            </select>

            <select
              className={selectClass}
              required
              value={referralForm.contactId}
              onChange={(e) => setReferralForm((c) => ({ ...c, contactId: e.target.value }))}
            >
              <option value="">Select contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.fullName} — {contact.company}
                </option>
              ))}
            </select>

            <select
              className={selectClass}
              value={referralForm.status}
              onChange={(e) => setReferralForm((c) => ({ ...c, status: e.target.value as Referral["status"] }))}
            >
              <option value="pending">Pending</option>
              <option value="replied">Replied</option>
              <option value="referred">Referred</option>
              <option value="no_response">No Response</option>
            </select>

            <textarea
              className={textareaClass}
              placeholder="Outreach message *"
              required
              rows={4}
              value={referralForm.outreachMessage}
              onChange={(e) => setReferralForm((c) => ({ ...c, outreachMessage: e.target.value }))}
            />

            <textarea
              className={textareaClass}
              placeholder="Connection request (optional)"
              rows={3}
              value={referralForm.connectionRequestMessage}
              onChange={(e) => setReferralForm((c) => ({ ...c, connectionRequestMessage: e.target.value }))}
            />

            <input
              className={selectClass}
              type="datetime-local"
              value={referralForm.messageSentAt}
              onChange={(e) => setReferralForm((c) => ({ ...c, messageSentAt: e.target.value }))}
            />

            {error ? (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
            ) : null}

            <Button
              className="w-full"
              disabled={isGeneratingDraft}
              onClick={handleGenerateDraft}
              type="button"
              variant="violet"
            >
              {isGeneratingDraft ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
              Generate AI Draft
            </Button>

            <Button className="w-full" disabled={isLoadingReferral} type="submit">
              {isLoadingReferral ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save Referral
            </Button>
          </form>
        </Card>
      </div>

      {/* AI Draft preview */}
      {draftResult ? (
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400">AI Draft Result</p>
              <p className="mt-1 text-sm text-slate-300">{draftResult.summary}</p>
            </div>
            <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
              {draftResult.provider}
            </span>
          </div>
          {draftResult.promptArtifact && (
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-slate-950/60 px-4 py-3 text-xs text-slate-500">
              Template: {draftResult.promptArtifact.templateName}
            </div>
          )}
        </Card>
      ) : null}

      {/* Tables row */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Contacts table */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <p className="font-semibold text-white">Contacts</p>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
              {contacts.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Company</TableHeaderCell>
                  <TableHeaderCell>Title</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-12 text-center text-slate-500" colSpan={3}>No contacts saved yet.</TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium text-white">{contact.fullName}</TableCell>
                      <TableCell className="text-slate-300">{contact.company}</TableCell>
                      <TableCell className="text-slate-400">{contact.title}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Referrals table */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <p className="font-semibold text-white">Referrals</p>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
              {referrals.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Company</TableHeaderCell>
                  <TableHeaderCell>Contact</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {referrals.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-12 text-center text-slate-500" colSpan={4}>No referrals tracked yet.</TableCell>
                  </TableRow>
                ) : (
                  referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <div className="font-medium text-white">{referral.company}</div>
                        <div className="text-xs text-slate-500">{referral.jobTitle}</div>
                      </TableCell>
                      <TableCell className="text-slate-300">{referral.contactName}</TableCell>
                      <TableCell>
                        <Badge label={referral.status} variant="referral" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            className="px-2.5 py-1 text-xs"
                            disabled={updatingReferralId === referral.id || referral.status === "replied"}
                            onClick={() => void handleReferralStatusUpdate(referral.id, "replied")}
                            type="button"
                            variant="ghost"
                          >
                            {updatingReferralId === referral.id ? <Loader2 className="size-3 animate-spin" /> : "Replied"}
                          </Button>
                          <Button
                            className="px-2.5 py-1 text-xs"
                            disabled={updatingReferralId === referral.id || referral.status === "referred"}
                            onClick={() => void handleReferralStatusUpdate(referral.id, "referred")}
                            type="button"
                            variant="ghost"
                          >
                            Referred
                          </Button>
                          <Button
                            className="px-2.5 py-1 text-xs"
                            disabled={updatingReferralId === referral.id || referral.status === "no_response"}
                            onClick={() => void handleReferralStatusUpdate(referral.id, "no_response")}
                            type="button"
                            variant="ghost"
                          >
                            No Reply
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
    </div>
  );
}
