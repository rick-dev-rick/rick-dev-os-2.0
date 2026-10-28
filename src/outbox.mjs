import { createId } from "./data.mjs";
import { normalizeData } from "./models.mjs";
const key = "rick-os2-cloud-outbox";
export function recoverPrivateFields(data) {
  return { ...data, snippets: [], notes: "", transactions: [], workouts: [] };
}
export function writeOutbox(storage, after, before, raw) {
  const item = {
    version: 1,
    createdAt: new Date().toISOString(),
    after,
    before,
    raw,
  };
  storage.setItem(key, JSON.stringify(item));
  return item;
}
export function readOutbox(storage) {
  const rawText = storage.getItem(key);
  if (!rawText) return null;
  try {
    const item = JSON.parse(rawText);
    if (item.version !== 1 || !item.raw || typeof item.raw !== "object")
      throw Error();
    normalizeData(item.after);
    normalizeData(item.before);
    return { ...item, rawText };
  } catch {
    return { rawText, invalid: true };
  }
}
export function archiveOutbox(storage) {
  const raw = storage.getItem(key);
  if (raw) {
    storage.setItem("rick-os2-draft-recovery-" + createId(), raw);
    storage.removeItem(key);
  }
}
export function clearMatchingOutbox(storage, after) {
  const pending = readOutbox(storage);
  if (
    pending &&
    !pending.invalid &&
    JSON.stringify(pending.after) === JSON.stringify(after)
  )
    storage.removeItem(key);
}
