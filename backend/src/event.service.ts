import { createEventSchema } from "./event.schema.js";
import { createEvent, listEvents } from "./event.repository.js";

export async function getEvents() {
  return listEvents();
}

export async function saveEvent(payload: unknown) {
  const input = createEventSchema.parse(payload);
  return createEvent(input);
}

