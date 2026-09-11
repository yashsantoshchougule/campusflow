import { v4 as uuidv4 } from "uuid";

export function createSession() {
  return `sess_${uuidv4()}`;
}
