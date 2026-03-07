import { pool } from "./db.js";

function normalizeIdentityPart(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

async function upsertProfileFields() {
  const fields = [
    { key: "name", label: "Name", value: "Akash Bhadouria", source: "manual" },
    { key: "email", label: "Email", value: "akash@example.dev", source: "manual" },
    { key: "phone", label: "Phone", value: "+91-9876543210", source: "manual" },
    { key: "linkedin", label: "LinkedIn", value: "https://linkedin.com/in/akash-bhadouria", source: "manual" },
    { key: "portfolio", label: "Portfolio", value: "https://akash.dev", source: "manual" },
    { key: "resume_link", label: "Resume Link", value: "https://akash.dev/resume.pdf", source: "manual" },
    { key: "current_salary", label: "Current Salary", value: "18 LPA", source: "manual" },
    { key: "expected_salary", label: "Expected Salary", value: "28 LPA", source: "manual" },
    { key: "notice_period", label: "Notice Period", value: "30 days", source: "manual" },
    { key: "current_location", label: "Current Location", value: "Bangalore", source: "manual" },
  ] as const;

  for (const field of fields) {
    await pool.query(
      `INSERT INTO profile_fields (key, label, value, source)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key)
       DO UPDATE SET
         label = EXCLUDED.label,
         value = EXCLUDED.value,
         source = EXCLUDED.source,
         updated_at = NOW()`,
      [field.key, field.label, field.value, field.source],
    );
  }
}

async function upsertJobs() {
  const jobs = [
    {
      company: "Swiggy",
      title: "Frontend Engineer",
      location: "Bangalore",
      jobUrl: "https://example.com/jobs/swiggy-frontend-engineer",
      sourcePlatform: "linkedin",
      postedDate: "2026-03-05",
    },
    {
      company: "Razorpay",
      title: "React Developer",
      location: "Remote India",
      jobUrl: "https://example.com/jobs/razorpay-react-developer",
      sourcePlatform: "instahyre",
      postedDate: "2026-03-04",
    },
    {
      company: "Meesho",
      title: "UI Engineer",
      location: "Bangalore",
      jobUrl: "https://example.com/jobs/meesho-ui-engineer",
      sourcePlatform: "hirist",
      postedDate: "2026-03-03",
    },
    {
      company: "CRED",
      title: "SDE-2 Frontend",
      location: "Bangalore",
      jobUrl: "https://example.com/jobs/cred-sde2-frontend",
      sourcePlatform: "company_site",
      postedDate: "2026-03-02",
    },
  ] as const;

  const jobIds = new Map<string, number>();

  for (const job of jobs) {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO jobs (
         company,
         title,
         location,
         job_url,
         primary_source_platform,
         posted_date,
         normalized_company,
         normalized_title,
         normalized_location
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (normalized_company, normalized_title, normalized_location)
       DO UPDATE SET
         company = EXCLUDED.company,
         title = EXCLUDED.title,
         location = EXCLUDED.location,
         job_url = EXCLUDED.job_url,
         primary_source_platform = EXCLUDED.primary_source_platform,
         posted_date = EXCLUDED.posted_date,
         updated_at = NOW()
       RETURNING id`,
      [
        job.company,
        job.title,
        job.location,
        job.jobUrl,
        job.sourcePlatform,
        job.postedDate,
        normalizeIdentityPart(job.company),
        normalizeIdentityPart(job.title),
        normalizeIdentityPart(job.location),
      ],
    );

    const jobId = Number(result.rows[0].id);
    jobIds.set(`${job.company}:${job.title}:${job.location}`, jobId);

    await pool.query(
      `INSERT INTO job_sources (job_id, source_platform, job_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (job_id, source_platform)
       DO UPDATE SET
         job_url = EXCLUDED.job_url,
         discovered_at = NOW()`,
      [jobId, job.sourcePlatform, job.jobUrl],
    );
  }

  await pool.query(
    `INSERT INTO job_sources (job_id, source_platform, job_url)
     VALUES ($1, 'naukri', 'https://example.com/jobs/swiggy-frontend-engineer-naukri')
     ON CONFLICT (job_id, source_platform)
     DO UPDATE SET
       job_url = EXCLUDED.job_url,
       discovered_at = NOW()`,
    [jobIds.get("Swiggy:Frontend Engineer:Bangalore")],
  );

  return jobIds;
}

async function ensureContact(input: {
  company: string;
  fullName: string;
  firstName: string;
  title: string;
  profileUrl: string;
  email: string;
  sourcePlatform: string;
}) {
  const existing = await pool.query<{ id: string }>(
    `SELECT id
     FROM contacts
     WHERE company = $1 AND full_name = $2 AND title = $3
     LIMIT 1`,
    [input.company, input.fullName, input.title],
  );

  if (existing.rows[0]) {
    const id = Number(existing.rows[0].id);

    await pool.query(
      `UPDATE contacts
       SET first_name = $2,
           profile_url = $3,
           email = $4,
           source_platform = $5,
           updated_at = NOW()
       WHERE id = $1`,
      [id, input.firstName, input.profileUrl, input.email, input.sourcePlatform],
    );

    return id;
  }

  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO contacts (
       company,
       full_name,
       first_name,
       title,
       profile_url,
       email,
       source_platform
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [input.company, input.fullName, input.firstName, input.title, input.profileUrl, input.email, input.sourcePlatform],
  );

  return Number(inserted.rows[0].id);
}

async function upsertContacts() {
  const contacts = [
    {
      company: "Swiggy",
      fullName: "Priya Nair",
      firstName: "Priya",
      title: "Frontend Hiring Manager",
      profileUrl: "https://linkedin.com/in/priya-nair-demo",
      email: "priya.nair@swiggy.example",
      sourcePlatform: "linkedin",
    },
    {
      company: "Razorpay",
      fullName: "Karan Mehta",
      firstName: "Karan",
      title: "Talent Partner",
      profileUrl: "https://linkedin.com/in/karan-mehta-demo",
      email: "karan.mehta@razorpay.example",
      sourcePlatform: "linkedin",
    },
    {
      company: "Meesho",
      fullName: "Ananya Rao",
      firstName: "Ananya",
      title: "Frontend Lead",
      profileUrl: "https://linkedin.com/in/ananya-rao-demo",
      email: "ananya.rao@meesho.example",
      sourcePlatform: "linkedin",
    },
  ] as const;

  const contactIds = new Map<string, number>();

  for (const contact of contacts) {
    const id = await ensureContact(contact);
    contactIds.set(`${contact.company}:${contact.fullName}`, id);
  }

  return contactIds;
}

async function upsertApplications(jobIds: Map<string, number>) {
  const applications = [
    {
      jobKey: "Swiggy:Frontend Engineer:Bangalore",
      sourcePlatform: "linkedin",
      applied: true,
      appliedDate: "2026-03-06T09:30:00.000Z",
      status: "interview",
    },
    {
      jobKey: "Razorpay:React Developer:Remote India",
      sourcePlatform: "instahyre",
      applied: false,
      appliedDate: null,
      status: "pending",
    },
  ] as const;

  for (const application of applications) {
    await pool.query(
      `INSERT INTO applications (job_id, source_platform, applied, applied_date, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (job_id)
       DO UPDATE SET
         source_platform = EXCLUDED.source_platform,
         applied = EXCLUDED.applied,
         applied_date = EXCLUDED.applied_date,
         status = EXCLUDED.status,
         updated_at = NOW()`,
      [jobIds.get(application.jobKey), application.sourcePlatform, application.applied, application.appliedDate, application.status],
    );
  }
}

async function upsertReferrals(jobIds: Map<string, number>, contactIds: Map<string, number>) {
  const referrals = [
    {
      jobKey: "Razorpay:React Developer:Remote India",
      contactKey: "Razorpay:Karan Mehta",
      status: "pending",
      outreachMessage:
        "Hi Karan, I came across the React Developer role at Razorpay and it aligns well with my frontend experience building React and TypeScript products. If you think my background could be relevant, I would appreciate any guidance or referral.",
      connectionRequestMessage: "Hi Karan, I am exploring frontend roles at Razorpay and would value connecting.",
      messageSentAt: "2026-03-06T08:00:00.000Z",
      repliedAt: null,
    },
    {
      jobKey: "Meesho:UI Engineer:Bangalore",
      contactKey: "Meesho:Ananya Rao",
      status: "referred",
      outreachMessage:
        "Hi Ananya, the UI Engineer opening at Meesho looks closely aligned with my recent React and design-system work. If you think it fits, I would appreciate any referral guidance.",
      connectionRequestMessage: "Hi Ananya, I would love to connect regarding frontend opportunities at Meesho.",
      messageSentAt: "2026-03-05T10:00:00.000Z",
      repliedAt: "2026-03-05T15:30:00.000Z",
    },
  ] as const;

  for (const referral of referrals) {
    await pool.query(
      `INSERT INTO referrals (
         job_id,
         contact_id,
         status,
         outreach_message,
         connection_request_message,
         message_sent_at,
         replied_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (job_id, contact_id)
       DO UPDATE SET
         status = EXCLUDED.status,
         outreach_message = EXCLUDED.outreach_message,
         connection_request_message = EXCLUDED.connection_request_message,
         message_sent_at = EXCLUDED.message_sent_at,
         replied_at = EXCLUDED.replied_at,
         updated_at = NOW()`,
      [
        jobIds.get(referral.jobKey),
        contactIds.get(referral.contactKey),
        referral.status,
        referral.outreachMessage,
        referral.connectionRequestMessage,
        referral.messageSentAt,
        referral.repliedAt,
      ],
    );
  }
}

async function upsertSessions(jobIds: Map<string, number>) {
  const sessions = [
    {
      jobKey: "CRED:SDE-2 Frontend:Bangalore",
      formUrl: "https://example.com/workday/apply",
      filledFields: { name: "Akash Bhadouria", email: "akash@example.dev", phone: "+91-9876543210" },
      missingField: "current ctc",
      status: "paused",
    },
    {
      jobKey: "Razorpay:React Developer:Remote India",
      formUrl: "https://example.com/greenhouse/apply",
      filledFields: { name: "Akash Bhadouria", portfolio: "https://akash.dev" },
      missingField: "resume upload",
      status: "ready_to_resume",
    },
  ] as const;

  for (const session of sessions) {
    await pool.query(
      `INSERT INTO application_sessions (job_id, form_url, filled_fields, missing_field, status)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       ON CONFLICT (job_id, form_url, missing_field)
       DO UPDATE SET
         filled_fields = EXCLUDED.filled_fields,
         status = EXCLUDED.status,
         updated_at = NOW()`,
      [jobIds.get(session.jobKey), session.formUrl, JSON.stringify(session.filledFields), session.missingField, session.status],
    );
  }
}

async function upsertNotifications(jobIds: Map<string, number>) {
  await pool.query(`DELETE FROM notifications WHERE type LIKE 'seed.%'`);

  const notifications = [
    {
      type: "seed.new_jobs",
      title: "New jobs discovered",
      message: "4 normalized jobs are available in the queue.",
      channel: "dashboard",
      status: "pending",
      relatedJobId: jobIds.get("Swiggy:Frontend Engineer:Bangalore"),
      deliveredAt: null,
    },
    {
      type: "seed.application_paused",
      title: "Application paused",
      message: "CRED ATS paused because current CTC is missing.",
      channel: "telegram",
      status: "pending",
      relatedJobId: jobIds.get("CRED:SDE-2 Frontend:Bangalore"),
      deliveredAt: null,
    },
    {
      type: "seed.referral_reply",
      title: "Referral confirmed",
      message: "Meesho contact marked the referral as referred.",
      channel: "dashboard",
      status: "delivered",
      relatedJobId: jobIds.get("Meesho:UI Engineer:Bangalore"),
      deliveredAt: "2026-03-05T15:31:00.000Z",
    },
  ] as const;

  for (const notification of notifications) {
    await pool.query(
      `INSERT INTO notifications (type, title, message, channel, status, related_job_id, delivered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        notification.type,
        notification.title,
        notification.message,
        notification.channel,
        notification.status,
        notification.relatedJobId ?? null,
        notification.deliveredAt,
      ],
    );
  }
}

async function upsertEvents(jobIds: Map<string, number>) {
  await pool.query(`DELETE FROM events WHERE actor = 'seed-script'`);

  const events = [
    {
      eventType: "jobs.discovered",
      actor: "seed-script",
      payload: { jobsDiscovered: 4, source: "demo-seed" },
      relatedJobId: jobIds.get("Swiggy:Frontend Engineer:Bangalore"),
    },
    {
      eventType: "referral.generated",
      actor: "seed-script",
      payload: { company: "Razorpay", status: "pending" },
      relatedJobId: jobIds.get("Razorpay:React Developer:Remote India"),
    },
    {
      eventType: "application.paused",
      actor: "seed-script",
      payload: { provider: "workday", missingField: "current ctc" },
      relatedJobId: jobIds.get("CRED:SDE-2 Frontend:Bangalore"),
    },
  ] as const;

  for (const event of events) {
    await pool.query(
      `INSERT INTO events (event_type, actor, payload, related_job_id)
       VALUES ($1, $2, $3::jsonb, $4)`,
      [event.eventType, event.actor, JSON.stringify(event.payload), event.relatedJobId ?? null],
    );
  }
}

async function upsertFieldMappings() {
  const mappings = [
    { rawLabel: "Current CTC", normalizedLabel: "current ctc", profileKey: "current_salary", confidence: "learned" },
    { rawLabel: "Expected Salary", normalizedLabel: "expected salary", profileKey: "expected_salary", confidence: "manual" },
    { rawLabel: "Notice Period", normalizedLabel: "notice period", profileKey: "notice_period", confidence: "manual" },
    { rawLabel: "Portfolio URL", normalizedLabel: "portfolio url", profileKey: "portfolio", confidence: "suggested" },
  ] as const;

  for (const mapping of mappings) {
    await pool.query(
      `INSERT INTO field_mappings (raw_label, normalized_label, profile_key, confidence)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (raw_label)
       DO UPDATE SET
         normalized_label = EXCLUDED.normalized_label,
         profile_key = EXCLUDED.profile_key,
         confidence = EXCLUDED.confidence,
         updated_at = NOW()`,
      [mapping.rawLabel, mapping.normalizedLabel, mapping.profileKey, mapping.confidence],
    );
  }
}

async function upsertSystemSettings() {
  const settings = [
    { key: "dashboard_enabled", label: "Dashboard Enabled", value: "true", valueType: "boolean", category: "notifications" },
    { key: "email_enabled", label: "Email Enabled", value: "true", valueType: "boolean", category: "notifications" },
    { key: "telegram_enabled", label: "Telegram Enabled", value: "true", valueType: "boolean", category: "notifications" },
    { key: "whatsapp_enabled", label: "WhatsApp Enabled", value: "false", valueType: "boolean", category: "notifications" },
    { key: "application_rate_limit_per_hour", label: "Application Rate Limit / Hour", value: "10", valueType: "number", category: "automation" },
    { key: "referral_timeout_hours", label: "Referral Timeout Hours", value: "24", valueType: "number", category: "automation" },
  ] as const;

  for (const setting of settings) {
    await pool.query(
      `INSERT INTO system_settings (key, label, value, value_type, category)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (key)
       DO UPDATE SET
         label = EXCLUDED.label,
         value = EXCLUDED.value,
         value_type = EXCLUDED.value_type,
         category = EXCLUDED.category,
         updated_at = NOW()`,
      [setting.key, setting.label, setting.value, setting.valueType, setting.category],
    );
  }
}

async function main() {
  try {
    await upsertProfileFields();
    const jobIds = await upsertJobs();
    const contactIds = await upsertContacts();
    await upsertApplications(jobIds);
    await upsertReferrals(jobIds, contactIds);
    await upsertSessions(jobIds);
    await upsertNotifications(jobIds);
    await upsertEvents(jobIds);
    await upsertFieldMappings();
    await upsertSystemSettings();

    console.log("Demo data seeded successfully.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Failed to seed demo data.");
  console.error(error);
  process.exitCode = 1;
});
