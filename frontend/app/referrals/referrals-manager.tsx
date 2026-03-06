"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { Contact, Job, Referral } from "@/lib/api";

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
  initialReferrals,
  jobs,
}: {
  initialContacts: Contact[];
  initialReferrals: Referral[];
  jobs: Job[];
}) {
  const [contacts, setContacts] = useState(initialContacts);
  const [referrals, setReferrals] = useState(initialReferrals);
  const [contactForm, setContactForm] = useState<ContactFormState>(emptyContactForm);
  const [referralForm, setReferralForm] = useState<ReferralFormState>(emptyReferralForm);
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  const [isLoadingReferral, setIsLoadingReferral] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobOptions = useMemo(
    () => jobs.map((job) => ({ id: job.id, label: `${job.company} - ${job.title} - ${job.location}` })),
    [jobs],
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

  useEffect(() => {
    setContacts(initialContacts);
    setReferrals(initialReferrals);
  }, [initialContacts, initialReferrals]);

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
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none transition focus:border-accent"
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
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none transition focus:border-accent"
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
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none transition focus:border-accent"
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
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none transition focus:border-accent"
              value={referralForm.status}
              onChange={(event) => setReferralForm((current) => ({ ...current, status: event.target.value as Referral["status"] }))}
            >
              <option value="pending">pending</option>
              <option value="replied">replied</option>
              <option value="referred">referred</option>
              <option value="no_response">no_response</option>
            </select>

            <textarea
              className="min-h-28 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
              placeholder="Referral outreach message"
              required
              value={referralForm.outreachMessage}
              onChange={(event) => setReferralForm((current) => ({ ...current, outreachMessage: event.target.value }))}
            />

            <textarea
              className="min-h-24 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
              placeholder="Connection request draft"
              value={referralForm.connectionRequestMessage}
              onChange={(event) => setReferralForm((current) => ({ ...current, connectionRequestMessage: event.target.value }))}
            />

            <input
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none transition focus:border-accent"
              type="datetime-local"
              value={referralForm.messageSentAt}
              onChange={(event) => setReferralForm((current) => ({ ...current, messageSentAt: event.target.value }))}
            />

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <Button className="w-full" disabled={isLoadingReferral} type="submit">
              {isLoadingReferral ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save referral
            </Button>
          </form>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="overflow-hidden p-2">
          <div className="flex items-center justify-between px-4 pb-4 pt-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Contacts</p>
            <p className="rounded-full bg-canvas px-3 py-1 text-sm font-medium text-ink">{contacts.length} contacts</p>
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
            <p className="rounded-full bg-canvas px-3 py-1 text-sm font-medium text-ink">{referrals.length} referrals</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Company</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Contact</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {referrals.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-4 py-10 text-muted" colSpan={4}>
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
