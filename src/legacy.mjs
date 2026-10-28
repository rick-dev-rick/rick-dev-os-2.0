import { legacySystem } from "./legacy-cores.mjs";
import { initialData, normalizeData } from "./models.mjs";
import { createId } from "./data.mjs";
export function fromLegacyData(raw) {
  const verified = legacySystem.validateData(raw);
  const read = (k, fallback) =>
    verified[k] ? JSON.parse(verified[k]) : fallback;
  const done = read("rick-dev-studies", []),
    running = read("rick-dev-running", { entries: [], goals: {} }),
    topics = read("rick-dev-study-topics", []);
  const d = {
    ...initialData,
    name: "Rick",
    legacySnapshot: verified,
    systemProgress: read("rick-dev-system-progress", {
      backupDays: [],
      diagnosticDays: [],
    }),
    focusSeconds: read("rick-dev-focus-seconds", 1500),
    tasks: read("rick-dev-missions", []).map((m, i) => ({
      id: m.id || "legacy-mission-" + i,
      title: m.text,
      description: m.description || "",
      done: m.done,
      progress: m.done ? 100 : m.progress || 0,
      module: m.module === "home" ? "home" : "study",
      tag: m.tag || "Pessoal",
    })),
    topics: topics.map((t) => ({
      id: t.id,
      title: t.label,
      done: done.includes(t.id),
    })),
    pc: read("rick-dev-pc-parts", []).map((i) => ({
      id: i.id,
      title: i.name,
      model: i.model || "",
      url: i.link || "",
      priceCents: Math.round((i.price || 0) * 100),
      purchased: i.purchased,
    })),
    style: read("rick-dev-style", []).map((i) => ({ ...i, title: i.name })),
    body: read("rick-dev-fitness-log", []).map((i, n) => ({
      id: i.id || "legacy-body-" + n,
      date: i.date,
      weight: i.weight,
      activity: i.workout,
      note: i.note || "",
    })),
    runs: running.entries,
    runningGoals: running.goals,
    resources: Object.entries(read("rick-dev-study-resources", {})).flatMap(
      ([category, a]) =>
        a.map((r) => ({
          ...r,
          id: r.id,
          category:
            topics.find((t) => t.id === category)?.label ||
            (category.startsWith("__") ? "Geral" : category),
        })),
    ),
    projects: read("rick-dev-projects", []).map((p, i) => ({
      id: p.id || "legacy-project-" + i,
      title: p.name,
      description: p.description,
      tech: (p.technologies || []).join(", "),
      url: p.link || "",
      status: p.status || "doing",
    })),
    evolution: read("rick-dev-evolution", { items: [] }).items,
    media: read("rick-dev-soundcloud", []).map((m) => ({
      ...m,
      title: m.name,
    })),
  };
  return normalizeData(d);
}
export async function importLegacy(backup) {
  await legacySystem.validateBackup(backup);
  return { ...fromLegacyData(backup.data), preferences: backup.preferences };
}
export async function parseBackup(raw) {
  if (raw?.format === "rick-dev-os-data") return importLegacy(raw);
  return normalizeData(raw);
}
