import { legacySystem } from "./legacy-cores.mjs";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const parse = (raw, key, fallback) =>
  raw[key] === undefined ? fallback : JSON.parse(raw[key]);
export function cloudPatch(before, after, raw) {
  const patch = {},
    expected = {};
  function put(key, value) {
    const serialized = JSON.stringify(value);
    if (serialized === raw[key]) return;
    patch[key] = serialized;
    expected[key] = raw[key] ?? null;
  }
  if (!same(before.tasks, after.tasks)) {
    const old = parse(raw, "rick-dev-missions", []);
    put(
      "rick-dev-missions",
      after.tasks.map((t) => ({
        ...old.find((x, i) => (x.id || "legacy-mission-" + i) === t.id),
        id: t.id,
        text: t.title,
        description: t.description || "",
        done: t.done,
        progress: t.done ? 100 : t.progress || 0,
        module: t.module,
        tag: t.tag,
      })),
    );
  }
  if (!same(before.topics, after.topics)) {
    const old = parse(raw, "rick-dev-study-topics", []);
    put(
      "rick-dev-study-topics",
      after.topics.map((t) => ({
        ...old.find((x) => x.id === t.id),
        id: t.id,
        label: t.title,
      })),
    );
    put(
      "rick-dev-studies",
      after.topics.filter((t) => t.done).map((t) => t.id),
    );
  }
  if (!same(before.pc, after.pc)) {
    const old = parse(raw, "rick-dev-pc-parts", []);
    put(
      "rick-dev-pc-parts",
      after.pc.map((p) => {
        const previous = old.find((x) => x.id === p.id);
        return {
          ...previous,
          id: p.id,
          name: p.title,
          model: p.model,
          price:
            p.priceCents === 0 && previous?.price === null
              ? null
              : p.priceCents / 100,
          link: p.url,
          purchased: p.purchased,
          custom: previous?.custom ?? true,
        };
      }),
    );
  }
  if (!same(before.style, after.style)) {
    const old = parse(raw, "rick-dev-style", []);
    put(
      "rick-dev-style",
      after.style.map((s) => ({
        ...old.find((x) => x.id === s.id),
        id: s.id,
        name: s.title,
        model: s.model,
        category: s.category,
        url: s.url,
        priceCents: s.priceCents,
        purchased: s.purchased,
      })),
    );
  }
  if (!same(before.body, after.body)) {
    const old = parse(raw, "rick-dev-fitness-log", []);
    put(
      "rick-dev-fitness-log",
      after.body.map((b) => ({
        ...old.find((x, i) => (x.id || "legacy-body-" + i) === b.id),
        id: b.id,
        date: b.date,
        weight: b.weight,
        workout: b.activity,
        note: b.note,
      })),
    );
  }
  if (
    !same(before.runs, after.runs) ||
    !same(before.runningGoals, after.runningGoals)
  )
    put("rick-dev-running", {
      entries: after.runs,
      goals: Object.fromEntries(
        Object.entries(after.runningGoals).filter(([, n]) => n > 0),
      ),
    });
  if (!same(before.resources, after.resources)) {
    const old = parse(raw, "rick-dev-study-resources", {}),
      buckets = {};
    for (const r of after.resources) {
      const oldKey = Object.keys(old).find((k) =>
        old[k].some((x) => x.id === r.id),
      );
      const original = before.resources.find((x) => x.id === r.id);
      const key =
        original?.category === r.category && oldKey
          ? oldKey
          : after.topics.find((t) => t.title === r.category)?.id ||
            r.category ||
            "library";
      (buckets[key] ??= []).push({
        id: r.id,
        title: r.title,
        type: r.type,
        url: r.url,
      });
    }
    put("rick-dev-study-resources", buckets);
  }
  if (!same(before.projects, after.projects)) {
    const old = parse(raw, "rick-dev-projects", []);
    put(
      "rick-dev-projects",
      after.projects.map((p) => ({
        ...old.find((x, i) => (x.id || "legacy-project-" + i) === p.id),
        id: p.id,
        name: p.title,
        description: p.description,
        technologies: p.tech
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        link: p.url,
        status: p.status,
      })),
    );
  }
  if (!same(before.evolution, after.evolution))
    put("rick-dev-evolution", { items: after.evolution });
  if (!same(before.media, after.media)) {
    // O player Spotify é local; a lista SoundCloud mantém o formato existente.
    const sc = after.media.filter((m) =>
      new URL(m.url).hostname.includes("soundcloud.com"),
    );
    put(
      "rick-dev-soundcloud",
      sc.map((m) => ({ id: m.id, name: m.title, url: m.url })),
    );
  }
  if (!same(before.systemProgress, after.systemProgress))
    put("rick-dev-system-progress", after.systemProgress);
  if (before.focusSeconds !== after.focusSeconds)
    put("rick-dev-focus-seconds", after.focusSeconds);
  legacySystem.validateData({ ...raw, ...patch });
  return { expected, patch };
}
export function applyPatchToBaseline(raw, patch) {
  return { ...raw, ...patch };
}

export function hasSharedChanges(before, after) {
  return [
    "tasks",
    "topics",
    "pc",
    "style",
    "body",
    "runs",
    "runningGoals",
    "resources",
    "projects",
    "evolution",
    "media",
    "systemProgress",
    "focusSeconds",
  ].some((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
}
