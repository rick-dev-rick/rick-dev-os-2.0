function cleanText(value) {
  return String(value || '').trim();
}

export function buildRickAiBriefing(snapshot = {}, priorities = [], insights = [], changes = []) {
  const ranked = Array.isArray(priorities) ? priorities.filter(Boolean) : [];
  const notices = Array.isArray(insights) ? insights.filter(Boolean) : [];
  const recentChanges = Array.isArray(changes) ? changes.filter(Boolean) : [];

  const primary = ranked[0] || null;
  const focus = primary ? {
    id: primary.id || 'focus',
    title: cleanText(primary.title) || 'Prioridade atual',
    reason: cleanText(primary.reason),
    module: cleanText(primary.module) || cleanText(snapshot?.page) || 'home',
  } : null;

  const signals = [];

  for (const item of ranked.slice(1)) {
    const title = cleanText(item?.title);
    if (!title) continue;
    signals.push({
      id: item.id || `priority-${signals.length}`,
      type: 'priority',
      text: `${item.bucket === 'depois' ? 'Depois' : 'Na sequência'}: ${title}${item.reason ? ` — ${cleanText(item.reason)}` : ''}`,
    });
    if (signals.length >= 3) break;
  }

  const focusId = focus?.id || null;
  for (const insight of notices) {
    if (!insight || insight.id === focusId) continue;
    const message = cleanText(insight.message);
    if (!message) continue;
    if (signals.some((item) => item.id === insight.id)) continue;
    signals.push({
      id: insight.id || `insight-${signals.length}`,
      type: insight.type || 'insight',
      text: message,
    });
    if (signals.length >= 3) break;
  }

  const compactChanges = recentChanges.slice(0, 2).map((change, index) => ({
    id: change?.id || `change-${index}`,
    text: cleanText(change?.message || change?.text),
  })).filter((change) => change.text);

  const conclusion = focus
    ? `Seu foco agora é “${focus.title}”. ${focus.reason || 'Vale concentrar energia nisso antes de abrir outra frente.'}`
    : 'Nenhuma prioridade urgente apareceu no OS agora. Você pode seguir pelo que fizer mais sentido sem inventar pressão.';

  return {
    focus,
    signals,
    changes: compactChanges,
    totalChanges: recentChanges.length,
    conclusion,
  };
}
