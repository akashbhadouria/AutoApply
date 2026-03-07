import { listApplicationMethods } from "./application-method.repository.js";

export async function getApplicationMethods() {
  return listApplicationMethods();
}
