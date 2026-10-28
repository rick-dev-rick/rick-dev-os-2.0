import { initialData, normalizeData } from "./models.mjs";
export function loadWorkspace(raw) {
  if (!raw) return { data: initialData, recoveryRaw: null, error: "" };
  try {
    return {
      data: normalizeData(JSON.parse(raw)),
      recoveryRaw: null,
      error: "",
    };
  } catch (err) {
    return { data: initialData, recoveryRaw: raw, error: err.message };
  }
}
export function persistWorkspace(storage, data, recoveryRaw, role = "local") {
  if (recoveryRaw || role === "guest") return false;
  storage.setItem("rick-os-v2", JSON.stringify(normalizeData(data)));
  return true;
}
export function restoreWorkspace(storage, current, incoming, role = "local") {
  if (role === "guest") throw Error("Modo convidado: apenas leitura.");
  const checked = normalizeData(incoming);
  storage.setItem("rick-os-v2-before-import", JSON.stringify(current));
  return checked;
}
