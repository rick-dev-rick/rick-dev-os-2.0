import { client } from '../cloud-client.mjs';
import { validatePendingAction } from './contracts.mjs';

export function buildRickAiRequest({ message, page, snapshot }) {
  const text = String(message || '').trim();
  if (!text || text.length > 4000) {
    throw Error('Escreva uma mensagem válida para a Rick IA.');
  }

  return {
    message: text,
    page: typeof page === 'string' && page ? page : 'home',
    snapshot: snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot) ? snapshot : {},
  };
}

export function parseRickAiResponse(data) {
  if (!data || typeof data.message !== 'string' || !data.message.trim()) {
    throw Error(data?.error || 'A Rick IA retornou uma resposta inválida.');
  }

  let pendingAction = null;
  if (data.pendingAction) pendingAction = validatePendingAction(data.pendingAction);

  return {
    message: data.message.trim(),
    pendingAction,
    conversationId:
      typeof data.conversationId === 'string' && data.conversationId.trim()
        ? data.conversationId.trim()
        : null,
  };
}

export async function sendRickAiMessage(input) {
  const body = buildRickAiRequest(input);
  const { data, error } = await client.functions.invoke('rick-ai', { body });

  if (error) throw Error(error.message || 'Não foi possível falar com a Rick IA.');
  return parseRickAiResponse(data);
}
