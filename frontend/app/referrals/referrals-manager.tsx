"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

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
    () => jobs.map((job) => ({ id: job.id, label: `${job.company} - ${job.title} - ${job.location}` })),
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
    if (!response.ok) {
      throw new Error("Failed to refresh contacts");
    }
    const payload = (await response.json()) as { data: Contact[] };
    setContacts(payload.data);
  }

  async function refreshReferrals() {
    const response = await fetch("/api/referrals", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to refresh referrals");
    }
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

      if (!response.ok) {
        throw new Error("Unable to save contact");
      }

      setContactForm(emptyContactForm);
      await refreshContacts();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save contact");
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

      if (!response.ok) {
        throw new Error("Unable to save referral");
      }

      setReferralForm(emptyReferralForm);
      await refreshReferrals();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save referral");
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
      const primarySkills = ["React", "TypeScript", "UI engineering"];
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
          primarySkills,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to generate referral draft");
      }

      const payload = (await response.json()) as { data: ReferralDraftResult };
      setDraftResult(payload.data);
      setReferralForm((current) => ({
        ...current,
        outreachMessage: payload.data.outreachMessage,
        connectionRequestMessage: payload.data.connectionRequestMessage,
      }));
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Failed to generate referral draft");
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

      if (!response.ok) {
        throw new Error("Unable to update referral status");
      }

      await refreshReferrals();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update referral status");
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
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Contacts</p>
            <h2 className="text-2xl font-semibold text-ink">Capture referral targets by company and role context.</h2>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleContactSubmit}>
            <Input placeholder="Company" required value={contactForm.company} onChange={(event) => setContactForm((current) => ({ ...current, company: event.target.value }))} />
            <Input placeholder="Full name" required value={contactForm.fullName} onChange={(event) => setContactForm((current) => ({ ...current, fullName: event.target.value }))} />
            <Input placeholder="First name" required value={contactForm.firstName} onChange={(event) => setContactForm((current) => ({ ...current, firstName: event.target.value }))} />
            <Input placeholder="Title" required value={contactForm.title} onChange={(event) => setContactForm((current) => ({ ...current, title: event.target.value }))} />
            <Input placeholder="Profile URL" value={contactForm.profileUrl} onChange={(event) => setContactForm((current) => ({ ...current, profileUrl: event.target.value }))} />
            <Input placeholder="Email" value={contactForm.email} onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))} />
            <select
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
              value={contactForm.sourcePlatform}
              onChange={(event) => setContactForm((current) => ({ ...current, sourcePlatform: event.target.value as Job["primarySourcePlatform"] }))}
            >
              <option value="linkedin">linkedin</option>
              <option value="instahyre">instahyre</option>
              <option value="hirist">hirist</option>
              <option value="naukri">naukri</option>
              <option value="company_site">company_site</option>
            </select>
            <Button className="w-full" disabled={isLoadingContact} type="submit">
              {isLoadingContact ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save contact
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Referrals</p>
            <h2 className="text-2xl font-semibold text-ink">Link a job to a contact and store outreach drafts.</h2>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleReferralSubmit}>
            <select
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
              required
              value={referralForm.jobId}
              onChange={(event) => setReferralForm((current) => ({ ...current, jobId: event.target.value }))}
            >
              <option value="">Select job</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.label}
                </option>
              ))}
            </select>

            <select
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
              required
              value={referralForm.contactId}
              onChange={(event) => setReferralForm((current) => ({ ...current, contactId: event.target.value }))}
            >
              <option value="">Select contact</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.fullName} - {contact.company} - {contact.title}
                </option>
              ))}
            </select>

            <select
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
              value={referralForm.status}
              onChange={(event) => setReferralForm((current) => ({ ...current, status: event.target.value as Referral["status"] }))}
            >
              <option value="pending">pending</option>
              <option value="replied">replied</option>
              <option value="referred">referred</option>
              <option value="no_response">no_response</option>
            </select>

            <textarea
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
              placeholder="Referral outreach message"
              required
              value={referralForm.outreachMessage}
              onChange={(event) => setReferralForm((current) => ({ ...current, outreachMessage: event.target.value }))}
            />

            <textarea
              className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
              placeholder="Connection request draft"
              value={referralForm.connectionRequestMessage}
              onChange={(event) => setReferralForm((current) => ({ ...current, connectionRequestMessage: event.target.value }))}
            />

            <input
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
              type="datetime-local"
              value={referralForm.messageSentAt}
              onChange={(event) => setReferralForm((current) => ({ ...current, messageSentAt: event.target.value }))}
            />

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <Button className="w-full" disabled={isGeneratingDraft} onClick={handleGenerateDraft} type="button">
              {isGeneratingDraft ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Generate agent draft
            </Button>

            <Button className="w-full" disabled={isLoadingReferral} type="submit">
              {isLoadingReferral ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save referral
            </Button>
          </form>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Agent Drafting</p>
            <h2 className="text-2xl font-semibold text-ink">OpenClaw-compatible prompts, deterministic output today.</h2>
          </div>
          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
            Profile fields available: {profileFields.length}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3 rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Draft context</p>
            <div className="space-y-2 text-sm text-slate-300">
              <p>Job: {selectedJob ? `${selectedJob.company} - ${selectedJob.title}` : "Select a job above"}</p>
              <p>Contact: {selectedContact ? `${selectedContact.fullName} - ${selectedContact.title}` : "Select a contact above"}</p>
              <p>Resume: {profileFieldMap.get("resume_link") ?? "Missing from profile"}</p>
              <p>Portfolio: {profileFieldMap.get("portfolio") ?? "Missing from profile"}</p>
            </div>
          </div>

          <div className="space-y-4 rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Latest result</p>
              {draftResult ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  {draftResult.provider}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-300">
              {draftResult?.summary ?? "Generate a draft to fill the outreach fields with a backend-produced result."}
            </p>
            {draftResult ? (
              <div className="rounded-[20px] border border-white/10 bg-black/20 p-4 text-xs text-slate-400">
                Prompt template: {draftResult.promptArtifact.templateName}
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="overflow-hidden p-2">
          <div className="flex items-center justify-between px-4 pb-4 pt-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Contacts</p>
            <p className="rounded-full bg-slate-900/80 px-3 py-1 text-sm font-medium text-ink">{contacts.length} contacts</p>
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
                    <TableCell className="px-4 py-10 text-muted" colSpan={3}>
                      No contacts saved yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.fullName}</TableCell>
                      <TableCell>{contact.company}</TableCell>
                      <TableCell>{contact.title}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="overflow-hidden p-2">
          <div className="flex items-center justify-between px-4 pb-4 pt-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Referrals</p>
            <p className="rounded-full bg-slate-900/80 px-3 py-1 text-sm font-medium text-ink">{referrals.length} referrals</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Company</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Contact</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {referrals.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-4 py-10 text-muted" colSpan={5}>
                      No referrals tracked yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">{referral.company}</TableCell>
                      <TableCell>{referral.jobTitle}</TableCell>
                      <TableCell>{referral.contactName}</TableCell>
                      <TableCell className="capitalize">{referral.status}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink"
                            disabled={updatingReferralId === referral.id || referral.status === "replied"}
                            onClick={() => void handleReferralStatusUpdate(referral.id, "replied")}
                            type="button"
                          >
                            {updatingReferralId === referral.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                            Replied
                          </Button>
                          <Button
                            className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink"
                            disabled={updatingReferralId === referral.id || referral.status === "referred"}
                            onClick={() => void handleReferralStatusUpdate(referral.id, "referred")}
                            type="button"
                          >
                            Referred
                          </Button>
                          <Button
                            className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink"
                            disabled={updatingReferralId === referral.id || referral.status === "no_response"}
                            onClick={() => void handleReferralStatusUpdate(referral.id, "no_response")}
                            type="button"
                          >
                            No response
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
