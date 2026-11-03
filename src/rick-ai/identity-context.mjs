const DEV_MODULES = new Set(['study', 'lab']);
const PERSONAL_MODULES = new Set(['home', 'fit', 'finance']);

const DEV_SIGNALS = [
  ['rick_dev', 4], ['react', 3], ['vite', 3], ['javascript', 3], ['github', 3],
  ['portfólio', 3], ['portfolio', 3], ['freela', 3], ['freelancer', 3], ['cliente', 2],
  ['código', 2], ['codigo', 2], ['programação', 2], ['programacao', 2], ['projeto', 2],
  ['site', 2], ['deploy', 2], ['repo', 2], ['repositório', 2], ['ads', 2], ['ti', 2],
  ['rick dev', 4], ['rick', 2],
];

const PERSONAL_SIGNALS = [
  ['trabalho', 2], ['clt', 3], ['casa', 3], ['família', 3], ['familia', 3], ['mãe', 3],
  ['mae', 3], ['rafaela', 4], ['namorada', 3], ['relacionamento', 3], ['férias', 3], ['ferias', 3],
  ['aluguel', 3], ['contas', 2], ['dinheiro', 1], ['salário', 2], ['salario', 2], ['roupa', 2],
  ['corrida', 2], ['academia', 2], ['cigarro', 2], ['quarto', 2], ['comprar', 1], ['compras', 1],
  ['douglas', 4], ['vida', 1], ['folga', 2],
];

function normalize(value) {
  return String(value || '').toLocaleLowerCase('pt-BR');
}

function scoreText(text, signals) {
  return signals.reduce((score, [term, weight]) => score + (text.includes(term) ? weight : 0), 0);
}

function recentText(recentConversation) {
  return Array.isArray(recentConversation)
    ? recentConversation.slice(-4).map((item) => item?.content || '').join(' ')
    : '';
}

export function inferRickIdentityContext({ message = '', recentConversation = [], activeModule = 'home' } = {}) {
  const current = normalize(message);
  const recent = normalize(recentText(recentConversation));

  let dev = scoreText(current, DEV_SIGNALS);
  let personal = scoreText(current, PERSONAL_SIGNALS);

  dev += scoreText(recent, DEV_SIGNALS) * 0.35;
  personal += scoreText(recent, PERSONAL_SIGNALS) * 0.35;

  if (DEV_MODULES.has(activeModule)) dev += 1.5;
  if (PERSONAL_MODULES.has(activeModule)) personal += 0.5;

  const total = dev + personal;
  const difference = Math.abs(dev - personal);

  if (dev >= 3 && personal >= 3 && difference < 3) {
    return { context: 'mixed', confidence: Math.min(0.95, total / 10), preferredName: null, signals: { dev, personal } };
  }

  if (dev >= 3 && dev - personal >= 2) {
    return { context: 'dev', confidence: Math.min(0.98, 0.55 + (dev - personal) / 10), preferredName: 'Rick', signals: { dev, personal } };
  }

  if (personal >= 3 && personal - dev >= 2) {
    return { context: 'personal', confidence: Math.min(0.98, 0.55 + (personal - dev) / 10), preferredName: 'Douglas', signals: { dev, personal } };
  }

  return { context: 'neutral', confidence: total ? Math.min(0.55, total / 10) : 0, preferredName: null, signals: { dev, personal } };
}
