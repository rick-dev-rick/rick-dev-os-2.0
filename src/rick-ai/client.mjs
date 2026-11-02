import { client } from '../cloud-client.mjs';
import { validatePendingAction } from './contracts.mjs';

export async function sendRickAiMessage({ message, page, snapshot }) {
  const text = String(message || '').trim();
  if (!text || text.length > 4000) throw Error('Escreva uma mensagem válida para a Rick IA.');

  const { data, error } = await client.functions.invoke('rick-ai', {
    body: { message: text, page, snapshot },
  });

  if (error) throw Error(error.message || 'Não foi possível falar com a Rick IA.');
  if (!data || typeof data.message !== 'string' || !data.message.trim()) {
    throw Error(data?.error || 'A Rick IA retornou uma resposta inválida.');
  }

  let pendingAction = null;
  if (data.pendingAction) pendingAction = validatePendingAction(data.pendingAction);

  return {
    message: data.message.trim(),
    pendingAction,
  };
}
