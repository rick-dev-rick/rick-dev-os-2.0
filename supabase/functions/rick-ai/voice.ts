const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json' },
});

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function extensionFor(mimeType: string) {
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

export async function transcribeAudio(body: any, apiKey: string) {
  const audioBase64 = typeof body?.audioBase64 === 'string' ? body.audioBase64.trim() : '';
  const mimeType = typeof body?.mimeType === 'string' ? body.mimeType.trim() : '';
  if (!audioBase64 || !mimeType.startsWith('audio/') || audioBase64.length > 34_000_000) {
    return json({ error: 'Invalid audio recording.' }, 400);
  }

  const form = new FormData();
  form.append('file', new Blob([decodeBase64(audioBase64)], { type: mimeType }), `rick-voice.${extensionFor(mimeType)}`);
  form.append('model', 'gpt-transcribe');
  form.append('response_format', 'json');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) return json({ error: 'Rick IA could not transcribe audio right now.' }, 502);
  const payload = await response.json();
  const transcript = typeof payload?.text === 'string' ? payload.text.trim() : '';
  if (!transcript) return json({ error: 'Rick IA could not understand the recording.' }, 422);
  return json({ mode: 'transcribe', transcript });
}

export async function synthesizeSpeech(body: any, apiKey: string) {
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > 4000) return json({ error: 'Invalid speech text.' }, 400);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-audio-1.5',
      modalities: ['text', 'audio'],
      audio: { voice: 'marin', format: 'wav' },
      messages: [
        {
          role: 'system',
          content: 'Você é apenas a voz sintética da Rick IA. Fale em português brasileiro com voz feminina adulta, segura, sofisticada e natural, com calor moderado e leve ironia quando combinar. Não imite pessoas nem personagens. Não acrescente fatos ou comentários ao texto recebido.',
        },
        {
          role: 'user',
          content: `Leia esta resposta da Rick IA sem adicionar conteúdo:\n${text}`,
        },
      ],
      store: false,
    }),
  });

  if (!response.ok) return json({ error: 'Rick IA could not generate voice right now.' }, 502);
  const payload = await response.json();
  const audioBase64 = payload?.choices?.[0]?.message?.audio?.data;
  if (typeof audioBase64 !== 'string' || !audioBase64) {
    return json({ error: 'Rick IA returned an empty voice response.' }, 502);
  }
  return json({ mode: 'speak', audioBase64, mimeType: 'audio/wav' });
}
