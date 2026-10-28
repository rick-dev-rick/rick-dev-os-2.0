// Validadores originais do RICK_DEV OS 1.0, commit cbf0454 (25/10/2026).
// Isolados do DOM para validar importações sem alterar o aplicativo original.
const window = {};

(() => {
  "use strict";
  const types = Object.freeze({ run: "Corrida", mixed: "Corrida e caminhada", walk: "Caminhada" });
  const places = Object.freeze({ street: "Rua", park: "Parque", track: "Pista", treadmill: "Esteira", trail: "Trilha", other: "Outro" });
  const efforts = Object.freeze({ light: "Leve", moderate: "Moderado", hard: "Intenso" });
  const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
  function localDate(date = new Date()) { return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function validMonth(month) { return typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month); }
  function validDate(date) {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const parsed = new Date(date + "T00:00:00Z"); return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
  }
  function validateEntry(entry) {
    if (!object(entry) || typeof entry.id !== "string" || !entry.id || entry.id.length > 100 || !validDate(entry.date) || entry.date > localDate() || !Number.isFinite(entry.distanceKm) || entry.distanceKm < .01 || entry.distanceKm > 500 || !Number.isInteger(entry.durationSeconds) || entry.durationSeconds < 1 || entry.durationSeconds > 86399 || !Object.hasOwn(types, entry.type) || !Object.hasOwn(places, entry.place) || !Object.hasOwn(efforts, entry.effort) || typeof entry.note !== "string" || entry.note.length > 300) throw new Error("Confira a data, a distância, o tempo e os campos da atividade. Registre apenas atividades já realizadas.");
    return { id: entry.id, date: entry.date, distanceKm: Math.round(entry.distanceKm * 100) / 100, durationSeconds: entry.durationSeconds, type: entry.type, place: entry.place, effort: entry.effort, note: entry.note };
  }
  function validateJournal(value) {
    if (!object(value) || Object.keys(value).some(key => !["entries", "goals"].includes(key)) || !Array.isArray(value.entries) || value.entries.length > 10000 || !object(value.goals)) throw new Error("Os dados de corrida têm uma estrutura inválida.");
    const entries = value.entries.map(validateEntry); const goals = {};
    if (new Set(entries.map(entry => entry.id)).size !== entries.length) throw new Error("Existem atividades repetidas nos dados de corrida.");
    for (const [month, distance] of Object.entries(value.goals)) {
      if (!validMonth(month) || !Number.isFinite(distance) || distance < .01 || distance > 10000) throw new Error("Existe uma meta mensal inválida nos dados de corrida.");
      goals[month] = Math.round(distance * 100) / 100;
    }
    return { entries, goals };
  }
  function isValidJournal(value) { try { validateJournal(value); return true; } catch (_) { return false; } }
  function summarize(journal, month) {
    if (!validMonth(month)) throw new Error("Selecione um mês válido.");
    const entries = journal.entries.slice().reverse().filter(entry => entry.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date));
    const distanceKm = Math.round(entries.reduce((sum, entry) => sum + entry.distanceKm, 0) * 100) / 100;
    const durationSeconds = entries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
    const goalKm = journal.goals[month] || 0;
    return { entries, distanceKm, durationSeconds, sessions: entries.length, paceSeconds: distanceKm > 0 ? Math.round(durationSeconds / distanceKm) : null, longestKm: entries.reduce((max, entry) => Math.max(max, entry.distanceKm), 0), activeDays: new Set(entries.map(entry => entry.date)).size, goalKm, goalPercent: goalKm ? Math.min(100, distanceKm / goalKm * 100) : null };
  }
  function duration(seconds) { const total = Math.max(0, Math.round(seconds)); const hours = Math.floor(total / 3600); return (hours ? String(hours).padStart(2, "0") + ":" : "") + String(Math.floor(total / 60) % 60).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0"); }
  function pace(seconds) { if (seconds === null || !Number.isFinite(seconds)) return "—"; const rounded = Math.max(0, Math.round(seconds)); return Math.floor(rounded / 60) + ":" + String(rounded % 60).padStart(2, "0") + " /km"; }
  window.rickRunningCore = Object.freeze({ types, places, efforts, localDate, validMonth, validateEntry, validateJournal, isValidJournal, summarize, duration, pace });
})();
    

(() => {
  const statuses = Object.freeze({ done: "Concluído", doing: "Em desenvolvimento", improve: "Melhorias", later: "Depois" });
  const modules = Object.freeze({ home: "RICK_HOME", study: "RICK_STUDY", fit: "RICK_FIT", finance: "RICK_FINANCE", lab: "RICK_LAB", system: "RICK_SYSTEM" });
  const seed = [
    ["modules", "Organização dos módulos", "Áreas próprias, menu recolhível e navegação no celular.", "home", "done"],
    ["library", "Biblioteca de materiais independente", "Vídeos, sites e cursos separados das matérias.", "study", "done"],
    ["running", "Diário de corrida", "Distância, duração, ritmo, metas mensais e histórico.", "fit", "done"],
    ["vault", "Cofre de Códigos local", "Trechos, favoritos, pesquisa e exportação no navegador.", "lab", "done"],
    ["tools", "Ferramentas do sistema", "Backups de dados, recuperação validada, diagnóstico e formatador.", "system", "done"],
    ["visual-review", "Conferir a interface nos dispositivos", "Revisar o uso no notebook e no iPhone.", "home", "improve"],
    ["restore-test", "Validar uma recuperação de ponta a ponta", "Conferir a restauração com cópias de teste dos dados.", "system", "improve"],
    ["vault-sync", "Sincronização do Cofre de Códigos", "Avaliar o acesso aos trechos entre dispositivos.", "lab", "later"],
    ["fixer", "RICK_FIXER com revisão", "Propostas de correção, aprovação e testes.", "system", "later"],
    ["app", "Aplicativo instalável", "Avaliar a evolução para PWA após estabilizar a base.", "home", "later"]
  ];
  function initial() { return { items: seed.map(([id, title, description, module, status]) => ({ id: "initial-" + id, title, description, module, status })) }; }
  function validate(value) {
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(key => key !== "items") || !Array.isArray(value.items) || value.items.length > 200) throw new Error("O painel aceita até 200 marcos válidos.");
    const items = value.items.map(item => {
      if (!item || typeof item.id !== "string" || !item.id || item.id.length > 100 || typeof item.title !== "string" || !item.title.trim() || item.title.length > 100 || typeof item.description !== "string" || item.description.length > 300 || !Object.hasOwn(modules, item.module) || !Object.hasOwn(statuses, item.status)) throw new Error("Existe um marco inválido no painel de evolução.");
      return { id: item.id, title: item.title, description: item.description, module: item.module, status: item.status };
    });
    if (new Set(items.map(item => item.id)).size !== items.length) throw new Error("Existem marcos repetidos no painel.");
    return { items };
  }
  function isValid(value) { try { validate(value); return true; } catch (_) { return false; } }
  window.rickEvolutionCore = Object.freeze({ statuses, modules, initial, validate, isValid });
})();
    

(() => {
  "use strict";
  const key = "rick-dev-system-progress";
  const validDay = day => typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0,10) === day;
  function valid(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value)
      && ["backupDays","diagnosticDays"].every(k => Array.isArray(value[k]) && value[k].length <= 20 && value[k].every(validDay) && new Set(value[k]).size === value[k].length);
  }
  const empty = () => ({ backupDays: [], diagnosticDays: [] });
  function parse(raw) { try { const v = JSON.parse(raw); return valid(v) ? v : empty(); } catch (_) { return empty(); } }
  function percent(v) { return Math.min(100, v.backupDays.length * 10 + v.diagnosticDays.length * 5); }
  function missions(total, count, projects) { return Math.max(0, Math.min(100, (count ? total / count : 0) + projects * 5)); }
  function day(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    const get = type => parts.find(p => p.type === type).value;
    return get("year") + "-" + get("month") + "-" + get("day");
  }
  window.rickProgressCore = Object.freeze({ key, valid, parse, percent, missions, day });
})();

    

(() => {
  "use strict";
  const key = "rick-dev-style";
  const categories = Object.freeze({ camisa: "Camisa", calca: "Calça", bermuda: "Bermuda", acessorio: "Acessório", tenis: "Tênis" });
  const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
  function safeUrl(value) {
    if (typeof value !== "string" || value.length > 2048) throw new Error("Informe um link válido da loja.");
    let url;
    try { url = new URL(value.trim()); } catch (_) { throw new Error("Informe um link completo da loja, começando com https://."); }
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Use um link de loja com http:// ou https://, sem credenciais.");
    return url.href;
  }
  function parsePrice(raw) {
    const value = String(raw).trim();
    let normalized;
    if (/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value)) normalized = value.replace(/\./g, "").replace(",", ".");
    else if (/^\d+\.\d{1,2}$/.test(value)) normalized = value;
    else throw new Error("Informe um valor em reais, como 129,90.");
    const [whole, fraction = ""] = normalized.split(".");
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
    if (!Number.isSafeInteger(cents) || cents < 0 || cents > 999999999) throw new Error("O valor precisa estar entre R$ 0,00 e R$ 9.999.999,99.");
    return cents;
  }
  function validate(items) {
    if (!Array.isArray(items) || items.length > 500) throw new Error("A lista de estilo precisa conter até 500 produtos.");
    const result = items.map(item => {
      if (!object(item) || typeof item.id !== "string" || !item.id.trim() || item.id.length > 80
        || typeof item.name !== "string" || !item.name.trim() || item.name.length > 100
        || !Object.hasOwn(categories, item.category)
        || (item.purchased !== undefined && typeof item.purchased !== "boolean")
        || !Number.isSafeInteger(item.priceCents) || item.priceCents < 0 || item.priceCents > 999999999) throw new Error("Existe um produto inválido na lista de estilo.");
      return { id: item.id, name: item.name.trim(), category: item.category, url: safeUrl(item.url), priceCents: item.priceCents, purchased: item.purchased === true };
    });
    if (new Set(result.map(item => item.id)).size !== result.length) throw new Error("Existem produtos com identificadores repetidos.");
    return result;
  }
  function summarize(items) {
    const total = items.length, purchased = items.filter(item => item.purchased).length;
    return { total, purchased, budgetCents: items.reduce((sum, item) => sum + item.priceCents, 0), spentCents: items.reduce((sum, item) => sum + (item.purchased ? item.priceCents : 0), 0), percent: total ? Math.round(purchased / total * 100) : 0 };
  }
  function isValid(value) { try { validate(value); return true; } catch (_) { return false; } }
  const money = cents => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  window.rickStyleCore = Object.freeze({ key, categories, safeUrl, parsePrice, validate, summarize, isValid, money });
})();
    

(() => {
  "use strict";
  const key = "rick-dev-soundcloud";
  function safeUrl(value) {
    let url;
    try { if (typeof value !== "string" || value.length > 2048) throw new Error(); url = new URL(value.trim()); }
    catch (_) { throw new Error("Cole o link completo de uma música ou playlist pública do SoundCloud."); }
    const host = url.hostname.replace(/^(www\.|m\.)/, ""), parts = url.pathname.split("/").filter(Boolean);
    const privateLink = [...url.searchParams.keys()].some(key => key.toLowerCase() === "secret_token");
    if (url.protocol !== "https:" || host !== "soundcloud.com" || url.port || url.username || url.password || privateLink
      || !(parts.length === 2 && parts[1] !== "sets" || parts.length === 3 && parts[1] === "sets")) throw new Error("Use um link público completo de soundcloud.com/artista/música ou soundcloud.com/artista/sets/playlist, sem senha ou token privado.");
    return "https://soundcloud.com/" + parts.join("/");
  }
  function validate(items) {
    if (!Array.isArray(items) || items.length > 100) throw new Error("Salve até 100 músicas ou playlists do SoundCloud.");
    const result = items.map(item => {
      if (!item || typeof item !== "object" || typeof item.id !== "string" || !item.id.trim() || item.id.length > 80 || typeof item.name !== "string" || !item.name.trim() || item.name.length > 80) throw new Error("Existe uma playlist inválida na lista do SoundCloud.");
      return { id: item.id, name: item.name.trim(), url: safeUrl(item.url) };
    });
    if (new Set(result.map(item => item.id)).size !== result.length || new Set(result.map(item => item.url)).size !== result.length) throw new Error("Essa música ou playlist já está salva.");
    return result;
  }
  function isValid(value) { try { validate(value); return true; } catch (_) { return false; } }
  window.rickSoundCloudCore = Object.freeze({ key, safeUrl, validate, isValid });
})();
    

(() => {
  "use strict";
  const keys = Object.freeze([
    "rick-dev-study-topics", "rick-dev-studies", "rick-dev-missions", "rick-dev-projects",
    "rick-dev-pc-parts", "rick-dev-style", "rick-dev-soundcloud", "rick-dev-fitness-log", "rick-dev-study-resources",
    "rick-dev-focus-seconds", "rick-dev-focus-minutes", "rick-dev-focus-remaining", "rick-dev-running", "rick-dev-evolution", "rick-dev-system-progress"
  ]);
  const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const text = value => typeof value === "string";
  const optionalText = value => value === undefined || text(value);
  const numeric = value => typeof value === "number" && Number.isFinite(value);
  const safeLink = value => { try { return ["https:", "http:"].includes(new URL(value).protocol); } catch (_) { return false; } };
  function validateData(data) {
    if (!object(data)) throw new Error("Os dados precisam ser um objeto.");
    if (JSON.stringify(data).length > 5 * 1024 * 1024) throw new Error("O backup excede o limite de 5 MB.");
    for (const [key, raw] of Object.entries(data)) {
      if (!keys.includes(key) || !text(raw)) throw new Error("Campo de dados desconhecido ou inválido: " + key);
      let value;
      try { value = JSON.parse(raw); } catch (_) { throw new Error("Dados inválidos em " + key); }
      let valid = false;
      if (key === "rick-dev-study-topics") valid = Array.isArray(value) && value.every(item => object(item) && text(item.id) && item.id.length > 0 && text(item.label)) && new Set(value.map(item => item.id)).size === value.length;
      if (key === "rick-dev-studies") valid = Array.isArray(value) && value.every(text);
      if (key === "rick-dev-missions") valid = Array.isArray(value) && value.every(item => object(item) && text(item.text) && typeof item.done === "boolean" && optionalText(item.description) && (item.progress === undefined || numeric(item.progress) && item.progress >= 0 && item.progress <= 100));
      if (key === "rick-dev-projects") valid = Array.isArray(value) && value.every(item => object(item) && text(item.name) && text(item.description) && (item.technologies === undefined || Array.isArray(item.technologies) && item.technologies.every(text)) && (item.link === undefined || item.link === "" || safeLink(item.link)));
      if (key === "rick-dev-pc-parts") valid = Array.isArray(value) && value.every(item => object(item) && text(item.id) && text(item.name) && optionalText(item.model) && typeof item.purchased === "boolean" && (item.price === null || numeric(item.price) && item.price >= 0) && (item.link === undefined || item.link === "" || safeLink(item.link)));
      if (key === "rick-dev-fitness-log") valid = Array.isArray(value) && value.every(item => object(item) && text(item.date) && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && Number.isFinite(Date.parse(item.date)) && text(item.workout) && (item.weight === null || numeric(item.weight) && item.weight > 0) && optionalText(item.note));
      if (key === "rick-dev-study-resources") valid = object(value) && Object.values(value).every(items => Array.isArray(items) && items.every(item => object(item) && text(item.id) && text(item.title) && text(item.type) && safeLink(item.url)));
      if (key === "rick-dev-system-progress") valid = window.rickProgressCore.valid(value);
      if (key === "rick-dev-evolution") valid = window.rickEvolutionCore.isValid(value);
      if (key === "rick-dev-soundcloud") valid = window.rickSoundCloudCore.isValid(value);
      if (key === "rick-dev-style") valid = window.rickStyleCore.isValid(value);
      if (key === "rick-dev-running") valid = window.rickRunningCore.isValidJournal(value);
      if (key.startsWith("rick-dev-focus-")) valid = /^\d+$/.test(raw) && Number.isSafeInteger(value) && value >= 0 && value <= (key === "rick-dev-focus-minutes" ? 1440 : 86400);
      if (!valid) throw new Error("Estrutura inválida em " + key.replace("rick-dev-", "") + ". Nenhum dado foi alterado.");
    }
    return JSON.parse(JSON.stringify(data));
  }
  function validatePreferences(value) {
    if (!object(value) || Object.keys(value).some(key => !["tabWidth", "printWidth", "sidebarCollapsed"].includes(key))) throw new Error("Preferências inválidas.");
    if (![2, 4].includes(value.tabWidth) || ![80, 100, 120].includes(value.printWidth) || typeof value.sidebarCollapsed !== "boolean") throw new Error("Preferências incompatíveis.");
    return { tabWidth: value.tabWidth, printWidth: value.printWidth, sidebarCollapsed: value.sidebarCollapsed };
  }
  async function checksum(data, preferences) {
    const orderedData = Object.fromEntries(Object.keys(data).sort().map(key => [key, data[key]]));
    const input = new TextEncoder().encode(JSON.stringify({ data: orderedData, preferences: validatePreferences(preferences) }));
    const digest = await crypto.subtle.digest("SHA-256", input);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  }
  async function createBackup(data, preferences) {
    data = validateData(data);
    preferences = validatePreferences(preferences);
    return { format: "rick-dev-os-data", schemaVersion: 1, appVersion: "SYSTEM 1.3", createdAt: new Date().toISOString(), data, preferences, checksum: await checksum(data, preferences) };
  }
  async function validateBackup(backup) {
    if (!object(backup) || backup.format !== "rick-dev-os-data" || backup.schemaVersion !== 1 || !text(backup.createdAt) || !Number.isFinite(Date.parse(backup.createdAt))) throw new Error("Este arquivo não é um backup compatível do RICK_DEV OS.");
    const data = validateData(backup.data);
    validatePreferences(backup.preferences);
    if (!Object.keys(data).length) throw new Error("O backup não contém dados para restaurar.");
    if (!text(backup.checksum) || await checksum(backup.data, backup.preferences) !== backup.checksum) throw new Error("A verificação de integridade falhou. O arquivo foi alterado ou está incompleto.");
    return { ...backup, data, preferences: validatePreferences(backup.preferences) };
  }
  window.rickSystemCore = Object.freeze({ keys, validateData, validatePreferences, createBackup, validateBackup });
})();
    
export const legacySystem=window.rickSystemCore;

