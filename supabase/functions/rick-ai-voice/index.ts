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

async function speak(body: any, apiKey: string) {
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
          content: 'Fale em português brasileiro com voz feminina adulta, segura, sofisticada e natural, com calor moderado e leve ironia quando combinar. Não imite pessoas nem personagens e não acrescente conteúdo.',
        },
        { role: 'user', content: `Leia exatamente esta resposta da Rick IA:\n${text}` },
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

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) return json({ error: 'Rick IA provider is not configured yet.' }, 503);

    const body = await req.json();
    if (body?.mode === 'transcribe') return await transcribe(body, openAiKey);
    if (body?.mode === 'speak') return await speak(body, openAiKey);
    return json({ error: 'Invalid voice mode.' }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: 'Unexpected Rick IA voice backend error.' }, 500);
  }
});
