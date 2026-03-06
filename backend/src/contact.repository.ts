import { pool } from "./db.js";
import type { UpsertContactInput } from "./contact.schema.js";
import type { ContactRecord } from "./contact.types.js";

function mapContactRow(row: Record<string, unknown>): ContactRecord {
  return {
    id: Number(row.id),
    company: String(row.company),
    fullName: String(row.full_name),
    firstName: String(row.first_name),
    title: String(row.title),
    profileUrl: row.profile_url ? String(row.profile_url) : null,
    email: row.email ? String(row.email) : null,
    sourcePlatform: String(row.source_platform) as ContactRecord["sourcePlatform"],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function listContacts(): Promise<ContactRecord[]> {
  const result = await pool.query(
    `SELECT id, company, full_name, first_name, title, profile_url, email, source_platform, created_at, updated_at
     FROM contacts
     ORDER BY updated_at DESC, id DESC`,
  );

  return result.rows.map(mapContactRow);
}

export async function createContact(input: UpsertContactInput): Promise<ContactRecord> {
  const result = await pool.query(
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
     RETURNING id, company, full_name, first_name, title, profile_url, email, source_platform, created_at, updated_at`,
    [
      input.company,
      input.fullName,
      input.firstName,
      input.title,
      input.profileUrl ?? null,
      input.email ?? null,
      input.sourcePlatform,
    ],
  );

  return mapContactRow(result.rows[0]);
}

