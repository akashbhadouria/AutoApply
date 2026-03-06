import { createContact, listContacts } from "./contact.repository.js";
import { upsertContactSchema } from "./contact.schema.js";

export async function getContacts() {
  return listContacts();
}

export async function saveContact(payload: unknown) {
  const input = upsertContactSchema.parse(payload);
  return createContact(input);
}

