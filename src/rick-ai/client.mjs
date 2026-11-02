import { client } from '../cloud-client.mjs';
import { validatePendingAction } from './contracts.mjs';

export function buildRickAiRequest({ message, page, snapshot, conversationId = null }) {
  const text = String(message || '').trim();
  if (!text || text.length > 4000) throw Error('Escreva uma mensagem válida para a Rick IA.');
  const cleanConversationId = typeof conversationId === 'string' && conversationId.trim() ? conversationId.trim() : null;
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
    conversationId: typeof data.conversationId === 'string' && data.conversationId.trim() ? data.conversationId.trim() : null,
  };
}

export function parseRickAiHistory(data) {
  const conversationId = typeof data?.conversationId === 'string' && data.conversationId.trim() ? data.conversationId.trim() : null;
  const messages = Array.isArray(data?.messages)
    ? data.messages
      .filter((item) => item && (item.role === 'user' || item.role === 'assistant'))
      .map((item) => ({ role: item.role, content: String(item.content || '').trim() }))
      .filter((item) => item.content)
    : [];
  return { conversationId, messages };
}

async function currentUser() {
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw Error('Sessão inválida para a memória da Rick IA.');
  return user;
}

export async function loadRickAiHistory(conversationId = null) {
  const user = await currentUser();
  let conversation = null;

  if (typeof conversationId === 'string' && conversationId.trim()) {
    const { data, error } = await client
      .from('rick_ai_conversations')
      .select('id')
      .eq('owner_id', user.id)
      .eq('id', conversationId.trim())
      .maybeSingle();
    if (error) throw Error('Não foi possível carregar a conversa da Rick IA.');
    conversation = data;
  } else {
    const { data, error } = await client
      .from('rick_ai_conversations')
      .select('id')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw Error('Não foi possível carregar o histórico da Rick IA.');
    conversation = data;
  }

  if (!conversation) return { conversationId: null, messages: [] };

  const { data: rows, error: messagesError } = await client
    .from('rick_ai_messages')
    .select('role,content,created_at')
    .eq('owner_id', user.id)
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(20);
  if (messagesError) throw Error('Não foi possível carregar as mensagens da Rick IA.');

  return parseRickAiHistory({ conversationId: conversation.id, messages: (rows || []).reverse() });
}

export async function saveRickAiExchange({ conversationId = null, userMessage, assistantMessage }) {
  const user = await currentUser();
  const userText = String(userMessage || '').trim();
  const assistantText = String(assistantMessage || '').trim();
  if (!userText || !assistantText) throw Error('Conversa inválida para salvar.');

  let id = typeof conversationId === 'string' && conversationId.trim() ? conversationId.trim() : null;
  if (id) {
    const { data, error } = await client
      .from('rick_ai_conversations')
      .select('id')
      .eq('owner_id', user.id)
      .eq('id', id)
      .maybeSingle();
    if (error || !data) id = null;
  }

  if (!id) {
    const { data, error } = await client
      .from('rick_ai_conversations')
      .insert({ owner_id: user.id, title: userText.slice(0, 72) || 'Nova conversa' })
      .select('id')
      .single();
    if (error || !data?.id) throw Error('Não foi possível criar a memória da Rick IA.');
    id = data.id;
  }

  const { error: insertError } = await client.from('rick_ai_messages').insert([
    { conversation_id: id, owner_id: user.id, role: 'user', content: userText },
    { conversation_id: id, owner_id: user.id, role: 'assistant', content: assistantText },
  ]);
  if (insertError) throw Error('Não foi possível salvar a conversa da Rick IA.');

  await client
    .from('rick_ai_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('owner_id', user.id)
    .eq('id', id);

  return id;
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
