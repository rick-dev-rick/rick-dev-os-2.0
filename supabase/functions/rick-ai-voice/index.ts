import { createClient } from '@supabase/supabase-js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json' },
});

function readPublishableKey() {
  const keys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (keys) {
    const parsed = JSON.parse(keys);
    if (parsed.default) return parsed.default as string;
  }
  const legacy = Deno.env.get('SUPABASE_ANON_KEY');
  if (legacy) return legacy;
  throw new Error('Supabase publishable key unavailable.');
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function extensionFor(mimeType: string) {
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  if (mimeType.includes('ogg')) return 'ogg';
  return 'webm';
}

async function transcribe(body: any, apiKey: string) {
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


function pcmToWavBase64(pcmBase64: string) {
  const pcm = decodeBase64(pcmBase64);
  if (pcm.byteLength > 5_000_000) throw new Error('Audio response too long.');
  const wav = new Uint8Array(44 + pcm.length);
  const view = new DataView(wav.buffer);
  const ascii = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) wav[offset + i] = value.charCodeAt(i);
  };
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + pcm.length, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 24000, true);
  view.setUint32(28, 48000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, 'data');
  view.setUint32(40, pcm.length, true);
  wav.set(pcm, 44);
  let result = '';
  for (let i = 0; i < wav.length; i += 16384) {
    result += String.fromCharCode(...wav.subarray(i, i + 16384));
  }
  return btoa(result);
}

async function speak(body: any, apiKey: string) {
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > 1000) return json({ error: 'Fala inválida ou muito longa (máximo 1000 caracteres).' }, 400);
  const model = Deno.env.get('GEMINI_TTS_MODEL') || 'gemini-3.8-flash-lite-tts';
  const voice = Deno.env.get('RICK_AI_TTS_VOICE') || 'Gacrux';
  // Send only the spoken transcript. Instructions in this field can be spoken verbatim.
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          languageCode: 'pt-BR',
        },
      },
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error('Gemini TTS error', response.status, detail.slice(0, 700));
    if (response.status === 429) return json({ error: 'Limite gratuito de voz do Gemini atingido.' }, 429);
    if (response.status === 404) return json({ error: 'Modelo de voz do Gemini indisponível. Ajustar GEMINI_TTS_MODEL.' }, 502);
    if ([500, 502, 503, 504].includes(response.status)) return json({ error: 'O serviço de voz do Gemini está temporariamente indisponível.' }, 503);
    return json({ error: 'O Gemini não conseguiu gerar a voz.' }, 502);
  }
  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const audio = parts.find((part: any) => part?.inlineData?.data && String(part.inlineData.mimeType || '').startsWith('audio/'));
  if (!audio) return json({ error: 'O Gemini não retornou áudio.' }, 502);
  return json({ mode: 'speak', audioBase64: pcmToWavBase64(audio.inlineData.data), mimeType: 'audio/wav' });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) return json({ error: 'Authentication required.' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      readPublishableKey(),
      { global: { headers: { Authorization: authorization } } },
    );

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const user = authData?.user;
    if (authError || !user) return json({ error: 'Invalid session.' }, 401);

    const { data: admin, error: adminError } = await supabase
      .from('rick_dev_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (adminError || !admin) return json({ error: 'Admin access required.' }, 403);

    const body = await req.json();
    if (body?.mode === 'speak') {
      const geminiKey = Deno.env.get('GEMINI_API_KEY');
      if (!geminiKey) return json({ error: 'GEMINI_API_KEY não configurada.' }, 503);
      return await speak(body, geminiKey);
    }
    if (body?.mode === 'transcribe') return json({ error: 'Use o ditado do navegador. A transcrição por API está desativada.' }, 501);
    return json({ error: 'Invalid voice mode.' }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: 'Unexpected Rick IA voice backend error.' }, 500);
  }
});
