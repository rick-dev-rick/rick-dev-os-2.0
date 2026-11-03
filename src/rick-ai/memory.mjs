const CATEGORY_RULES = [
  ['preference', /\b(eu\s+)?prefiro\b|\bgosto\s+mais\s+de\b|\bn[aã]o\s+gosto\s+de\b/i],
  ['goal', /\bminha\s+meta\b|\bmeu\s+objetivo\b|\bquero\s+focar\b|\bpretendo\b/i],
  ['decision', /\bdecidi\b|\bdefini\b|\bficou\s+decidido\b|\bvai\s+ser\b/i],
  ['priority', /\bminha\s+prioridade\b|\bprioridade\s+[ée]\b|\bvem\s+primeiro\b|\bmais\s+importante\b/i],
  ['routine', /\beu\s+costumo\b|\btoda\s+semana\b|\btodo\s+dia\b|\bsempre\s+fa[cç]o\b/i],
  ['project', /\bmeu\s+projeto\b|\bno\s+projeto\s+[A-Za-z0-9_Øø-]+\b/i],
];

const SENSITIVE = /\bsenha\b|\bpassword\b|\btoken\b|\bchave\s+api\b|\bapi\s*key\b|\bcpf\b|\brg\b|\bcart[aã]o\b|\bdiagn[oó]stic\w*\b|\bdepress\w*\b|\bansiedad\w*\b|\bbipolar\w*\b|\btdah\b|\bmedicamento\w*\b|\brem[eé]dio\w*\b|\bdoen[cç]a\w*\b/i;
const TRANSIENT_ONLY = /\b(hoje|agora|essa\s+noite|nesta\s+noite|amanh[aã])\b/i;

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

export function normalizeRickAiMemoryKey(category, content) {
  const safeCategory = String(category || 'memory').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 19) || 'memory';
  return `${safeCategory}:${slugify(content)}`.slice(0, 220);
}

export function extractRickAiMemoryCandidate(message) {
  const content = String(message || '').trim().replace(/\s+/g, ' ');
  if (!content || content.length < 8 || content.length > 500) return null;
  if (SENSITIVE.test(content)) return null;

  for (const [category, rule] of CATEGORY_RULES) {
    if (!rule.test(content)) continue;
    if (TRANSIENT_ONLY.test(content) && !/\b(meta|objetivo|prioridade|prefiro|decidi|defini|costumo|toda\s+semana|todo\s+dia|pretendo)\b/i.test(content)) return null;
    return { category, content, normalizedKey: normalizeRickAiMemoryKey(category, content) };
  }
  return null;
}
