import { client } from '../cloud-client.mjs';
import { validatePendingAction } from './contracts.mjs';

export function buildRickAiRequest({ message, page, snapshot, conversationId = null }) {
  const text = String(message || '').trim();
  if (!text || text.length > 4000) {
    throw Error('Escreva uma mensagem válida para a Rick IA.');
  }

  const cleanConversationId = typeof conversationId === 'string' && conversationId.trim()
    ? conversationId.trim()
    : null;

  return {
    message: text,
    page: typeof page === 'string' && page ? page : 'home',
    snapshot: snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot) ? snapshot : {},
    conversationId: cleanConversationId,
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

export function parseRickAiHistory(data) {
  const conversationId = typeof data?.conversationId === 'string' && data.conversationId.trim()
    ? data.conversationId.trim()
    : null;
  const messages = Array.isArray(data?.messages)
    ? data.messages
      .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
      .map((item) => ({ role: item.role, content: String(item.content || '').trim() }))
      .filter((item) => item.content)
    : [];
  return { conversationId, messages };
}

export async function loadRickAiHistory(conversationId = null) {
  const { data, error } = await client.functions.invoke('rick-ai', {
    body: {
      mode: 'history',
      conversationId: typeof conversationId === 'string' && conversationId.trim() ? conversationId.trim() : null,
    },
  });
  if (error) throw Error(error.message || 'Não foi possível carregar o histórico da Rick IA.');
  return parseRickAiHistory(data);
}

export function buildRickAiVoiceRequest(input = {}) {
  if (input.mode === 'transcribe') {
    const audioBase64 = typeof input.audioBase64 === 'string' ? input.audioBase64.trim() : '';
    const mimeType = typeof input.mimeType === 'string' ? input.mimeType.trim() : '';
    if (!audioBase64 || !mimeType.startsWith('audio/')) throw Error('Gravação de áudio inválida.');
    return { mode: 'transcribe', audioBase64, mimeType };
  }

  if (input.mode === 'speak') {
    const text = String(input.text || '').trim();
    if (!text || text.length > 4000) throw Error('Informe um texto válido para a Rick IA falar.');
    return { mode: 'speak', text };
  }

  throw Error('Modo de voz inválido.');
}

export function parseRickAiVoiceResponse(data) {
  if (data?.mode === 'transcribe') {
    const transcript = typeof data.transcript === 'string' ? data.transcript.trim() : '';
    if (!transcript) throw Error(data?.error || 'Não consegui entender o áudio.');
    return { mode: 'transcribe', transcript, audioBase64: null, mimeType: null };
  }

  if (data?.mode === 'speak') {
    const audioBase64 = typeof data.audioBase64 === 'string' ? data.audioBase64.trim() : '';
    const mimeType = typeof data.mimeType === 'string' ? data.mimeType.trim() : '';
    if (!audioBase64 || !mimeType.startsWith('audio/')) throw Error(data?.error || 'A Rick IA não conseguiu gerar voz.');
    return { mode: 'speak', transcript: null, audioBase64, mimeType };
  }

  throw Error(data?.error || 'A Rick IA retornou uma resposta de voz inválida.');
}

export async function sendRickAiMessage(input) {
  const body = buildRickAiRequest(input);
  const { data, error } = await client.functions.invoke('rick-ai', { body });

  if (error) throw Error(error.message || 'Não foi possível falar com a Rick IA.');
  return parseRickAiResponse(data);
}

async function sendVoiceRequest(input) {
  const body = buildRickAiVoiceRequest(input);
  const { data, error } = await client.functions.invoke('rick-ai-voice', { body });
  if (error) throw Error(error.message || 'Não foi possível usar a voz da Rick IA.');
  return parseRickAiVoiceResponse(data);
}

export async function transcribeRickAiAudio({ audioBase64, mimeType }) {
  return sendVoiceRequest({ mode: 'transcribe', audioBase64, mimeType });
}

export async function speakRickAiText(text) {
  return sendVoiceRequest({ mode: 'speak', text });
}
