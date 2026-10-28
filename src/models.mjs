import { createId, validateBackup } from "./data.mjs";
export const categories = {
  camisa: "Camisa",
  calca: "Calça",
  bermuda: "Bermuda",
  acessorio: "Acessório",
  tenis: "Tênis",
};
export const runTypes = {
  run: "Corrida",
  mixed: "Corrida e caminhada",
  walk: "Caminhada",
};
export const runPlaces = {
  street: "Rua",
  park: "Parque",
  track: "Pista",
  treadmill: "Esteira",
  trail: "Trilha",
  other: "Outro",
};
export const efforts = { light: "Leve", moderate: "Moderado", hard: "Intenso" };
export const stages = {
  doing: "Em desenvolvimento",
  improve: "Melhorias",
  later: "Depois",
  done: "Concluído",
};
export const money = (n) =>
  (n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export function today() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}
export function safeUrl(raw, optional = false) {
  if (optional && !raw) return "";
  let u;
  try {
    u = new URL(raw.trim());
  } catch {
    throw Error("Use um link completo começando com https://.");
  }
  if (!["https:", "http:"].includes(u.protocol) || u.username || u.password)
    throw Error("O link precisa usar http ou https, sem credenciais.");
  return u.href;
}
export function mediaUrl(raw) {
  const u = new URL(safeUrl(raw));
  const path = u.pathname.split("/").filter(Boolean);
  if (
    u.hostname === "open.spotify.com" &&
    ["track", "album", "playlist", "episode", "show"].includes(path[0]) &&
    /^[a-zA-Z0-9]+$/.test(path[1] || "")
  )
    return {
      provider: "spotify",
      url: `https://open.spotify.com/${path[0]}/${path[1]}`,
      embed: `https://open.spotify.com/embed/${path[0]}/${path[1]}?utm_source=generator&theme=0`,
    };
  if (
    ["soundcloud.com", "www.soundcloud.com", "m.soundcloud.com"].includes(
      u.hostname,
    ) &&
    u.protocol === "https:" &&
    ((path.length === 2 && path[1] !== "sets") ||
      (path.length === 3 && path[1] === "sets")) &&
    !u.searchParams.has("secret_token")
  ) {
    const url = "https://soundcloud.com/" + path.join("/");
    return {
      provider: "soundcloud",
      url,
      embed:
        "https://w.soundcloud.com/player/?url=" +
        encodeURIComponent(url) +
        "&color=%23b6f36b&auto_play=false&show_artwork=true&visual=false",
    };
  }
  throw Error(
    "Cole um link público de música, álbum ou playlist do Spotify ou SoundCloud.",
  );
}
export function parsePrice(raw) {
  const s = String(raw).trim();
  if (!s) return 0;
  let v;
  if (/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(s))
    v = s.replaceAll(".", "").replace(",", ".");
  else if (/^\d+\.\d{1,2}$/.test(s)) v = s;
  else throw Error("Informe um valor válido, como 129,90.");
  const n = Math.round(Number(v) * 100);
  if (!Number.isSafeInteger(n) || n < 0 || n > 999999999)
    throw Error("Valor fora do limite permitido.");
  return n;
}
function text(v, max = 300, required = false) {
  if (v === undefined || v === null) v = "";
  if (typeof v !== "string" || v.length > max || (required && !v.trim()))
    throw Error("Confira os textos e os campos obrigatórios.");
  return v.trim();
}
function number(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max)
    throw Error("Confira os valores numéricos.");
  return n;
}
function choice(v, allowed) {
  if (!allowed.includes(v)) throw Error("Selecione uma opção válida.");
  return v;
}
export function validDate(v) {
  return (
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(v + "T00:00:00Z").toISOString().slice(0, 10) === v
  );
}
export function validateRecord(kind, raw) {
  if (!raw || typeof raw !== "object") throw Error("Registro inválido.");
  const id = text(raw.id || createId(), 100, true);
  let r = { id };
  if (["pc", "style"].includes(kind)) {
    r = {
      id,
      title: text(raw.title, 140, true),
      model: text(raw.model, 140),
      url: safeUrl(raw.url || "", true),
      priceCents:
        raw.priceCents === undefined
          ? parsePrice(raw.price)
          : number(raw.priceCents, 0, 999999999),
      purchased: raw.purchased === true,
    };
    if (!Number.isInteger(r.priceCents))
      throw Error("Preço em centavos inválido.");
    if (kind === "style")
      r.category = choice(raw.category, Object.keys(categories));
  } else if (kind === "runs") {
    const duration =
      raw.durationSeconds ??
      number(raw.hours || 0, 0, 23) * 3600 +
        number(raw.minutes || 0, 0, 59) * 60 +
        number(raw.seconds || 0, 0, 59);
    if (!validDate(raw.date) || raw.date > today())
      throw Error("Escolha uma data válida de uma atividade já realizada.");
    r = {
      id,
      date: raw.date,
      distanceKm: number(raw.distanceKm, 0.01, 500),
      durationSeconds: number(duration, 1, 86399),
      type: choice(raw.type, Object.keys(runTypes)),
      place: choice(raw.place, Object.keys(runPlaces)),
      effort: choice(raw.effort, Object.keys(efforts)),
      note: text(raw.note),
    };
    if (!Number.isInteger(r.durationSeconds))
      throw Error("A duração precisa ter segundos inteiros.");
  } else if (kind === "body") {
    if (!validDate(raw.date) || raw.date > today())
      throw Error("Confira a data do registro.");
    r = {
      id,
      date: raw.date,
      weight:
        raw.weight === "" || raw.weight === null || raw.weight === undefined
          ? null
          : number(raw.weight, 1, 500),
      activity: text(raw.activity, 80, true),
      note: text(raw.note),
    };
  } else if (kind === "tasks") {
    const progress = number(raw.progress ?? (raw.done ? 100 : 0), 0, 100);
    r = {
      id,
      title: text(raw.title, 140, true),
      description: text(raw.description, 2000),
      tag: text(raw.tag, 80) || "Pessoal",
      module: choice(raw.module || "study", ["study", "home"]),
      progress,
      done: raw.done === true || progress === 100,
    };
    if (r.done) r.progress = 100;
  } else if (kind === "topics")
    r = { id, title: text(raw.title, 140, true), done: raw.done === true };
  else if (kind === "resources")
    r = {
      id,
      title: text(raw.title, 140, true),
      type: choice(raw.type, ["video", "site", "course", "book"]),
      url: safeUrl(raw.url),
      category: text(raw.category, 80) || "Geral",
    };
  else if (kind === "projects")
    r = {
      id,
      title: text(raw.title, 140, true),
      description: text(raw.description, 2000),
      tech: text(raw.tech, 300),
      url: safeUrl(raw.url || "", true),
      status: choice(raw.status || "doing", Object.keys(stages)),
    };
  else if (kind === "snippets")
    r = {
      id,
      title: text(raw.title, 140, true),
      language: text(raw.language, 40, true),
      category: text(raw.category, 80),
      description: text(raw.description, 2000),
      code: text(raw.code, 100000, true),
      notes: text(raw.notes, 5000),
      favorite: raw.favorite === true,
    };
  else if (kind === "evolution")
    r = {
      id,
      title: text(raw.title, 140, true),
      description: text(raw.description, 1000),
      module: choice(raw.module, [
        "home",
        "study",
        "fit",
        "finance",
        "lab",
        "system",
      ]),
      status: choice(raw.status, Object.keys(stages)),
    };
  else if (kind === "media") {
    const m = mediaUrl(raw.url);
    r = { id, title: text(raw.title, 100, true), url: m.url };
  } else throw Error("Tipo de registro desconhecido.");
  return r;
}
export function shoppingSummary(items) {
  const total = items.length,
    purchased = items.filter((i) => i.purchased).length;
  return {
    total,
    purchased,
    budgetCents: items.reduce((s, i) => s + i.priceCents, 0),
    spentCents: items.reduce((s, i) => s + (i.purchased ? i.priceCents : 0), 0),
    percent: total ? Math.round((purchased / total) * 100) : 0,
  };
}
export function runningSummary(entries, month, goal = 0) {
  const selected = entries.filter((e) => e.date.startsWith(month));
  const distanceKm =
      Math.round(selected.reduce((s, e) => s + e.distanceKm, 0) * 100) / 100,
    durationSeconds = selected.reduce((s, e) => s + e.durationSeconds, 0);
  return {
    entries: selected.slice().sort((a, b) => b.date.localeCompare(a.date)),
    distanceKm,
    durationSeconds,
    paceSeconds: distanceKm ? Math.round(durationSeconds / distanceKm) : null,
    percent: goal ? Math.min(100, (distanceKm / goal) * 100) : 0,
  };
}
export function timeLabel(s) {
  const n = Math.round(s);
  return (
    (n >= 3600 ? String(Math.floor(n / 3600)).padStart(2, "0") + ":" : "") +
    String(Math.floor(n / 60) % 60).padStart(2, "0") +
    ":" +
    String(n % 60).padStart(2, "0")
  );
}
export const collections = [
  "pc",
  "style",
  "runs",
  "body",
  "topics",
  "resources",
  "projects",
  "snippets",
  "evolution",
  "media",
];
export const initialData = {
  version: 2,
  tasks: [],
  workouts: [],
  transactions: [],
  name: "Rick",
  notes: "",
  focusCount: 0,
  runningGoals: {},
  systemProgress:{backupDays:[],diagnosticDays:[]},
  focusSeconds:1500,
  ...Object.fromEntries(collections.map((k) => [k, []])),
};
export function normalizeData(raw) {
  if (!validateBackup(raw)) throw Error("Backup do 2.0 inválido.");
  const out = { ...initialData, ...raw };
  for (const key of collections) {
    const a = raw[key] ?? [];
    if (!Array.isArray(a) || a.length > 2000)
      throw Error("Coleção inválida: " + key);
    out[key] = a.map((r) => {
      if (!r || typeof r.id !== "string" || !r.id)
        throw Error("Registro sem identificador: " + key);
      if (
        [
          "title",
          "description",
          "notes",
          "code",
          "note",
          "tech",
          "model",
          "category",
        ].some((k) => r[k] !== undefined && typeof r[k] !== "string")
      )
        throw Error("Campo de texto inválido: " + key);
      for (const field of ["purchased", "done", "favorite"])
        if (r[field] !== undefined && typeof r[field] !== "boolean")
          throw Error("Campo de controle inválido: " + key);
      if (
        ["pc", "style"].includes(key) &&
        (!Number.isSafeInteger(r.priceCents) || r.priceCents < 0)
      )
        throw Error("Preço inválido: " + key);
      if (
        key === "runs" &&
        (typeof r.distanceKm !== "number" ||
          typeof r.durationSeconds !== "number")
      )
        throw Error("Atividade inválida.");
      if (
        key === "body" &&
        r.weight !== null &&
        r.weight !== undefined &&
        typeof r.weight !== "number"
      )
        throw Error("Peso inválido.");
      return validateRecord(key, r);
    });
    if (new Set(out[key].map((r) => r.id)).size !== out[key].length)
      throw Error("Identificadores repetidos: " + key);
  }
  if (
    !out.runningGoals ||
    typeof out.runningGoals !== "object" ||
    Array.isArray(out.runningGoals)
  )
    throw Error("Metas inválidas.");
  for (const [m, g] of Object.entries(out.runningGoals)) {
    if (
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(m) ||
      typeof g !== "number" ||
      !Number.isFinite(g) ||
      g < 0 ||
      g > 10000
    )
      throw Error("Meta mensal inválida.");
  }
  if (
    out.tasks.some(
      (t) =>
        (t.description !== undefined && typeof t.description !== "string") ||
        (t.progress !== undefined &&
          (!Number.isFinite(t.progress) || t.progress < 0 || t.progress > 100)),
    )
  )
    throw Error("Missões inválidas.");
  if(!Number.isInteger(out.focusSeconds)||out.focusSeconds<1||out.focusSeconds>86400)throw Error('Duração de foco inválida.');
  if(!out.systemProgress||['backupDays','diagnosticDays'].some(k=>!Array.isArray(out.systemProgress[k])||out.systemProgress[k].length>20||out.systemProgress[k].some(d=>!validDate(d))))throw Error('Progresso do sistema inválido.');
  return out;
}
export function saveFile(value, name) {
  const url = URL.createObjectURL(
    new Blob(
      [typeof value === "string" ? value : JSON.stringify(value, null, 2)],
      { type: "application/json" },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function editorRecord(kind, editor, fields) {
  return validateRecord(kind, {
    ...fields,
    ...(editor.id ? { id: editor.id } : {}),
    ...(kind === "topics" ? { done: editor.done === true } : {}),
  });
}
