import React, { useMemo, useRef, useState } from 'react';
import {
  Bot,
  Check,
  LoaderCircle,
  MessageCircle,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { applyConfirmedAction, buildRickAiSnapshot } from './contracts.mjs';
import { sendRickAiMessage, speakRickAiText, transcribeRickAiAudio } from './client.mjs';
import './rick-ai.css';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(Error('Não consegui preparar a gravação.'));
    reader.onloadend = () => {
      const value = String(reader.result || '');
      resolve(value.includes(',') ? value.split(',')[1] : value);
    };
    reader.readAsDataURL(blob);
  });
}

function audioUrlFromBase64(audioBase64, mimeType) {
  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

export default function RickAiPanel({ data, page, role, setData, notify }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Tô por aqui, Rick. Manda o que você quer analisar 😏',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [recording, setRecording] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef('');
  const micHeldRef = useRef(false);

  const snapshot = useMemo(() => buildRickAiSnapshot(data, page), [data, page]);

  function stopPlayback() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = '';
    }
  }

  async function playVoice(text) {
    if (!voiceEnabled || !text) return;
    setVoiceBusy(true);
    try {
      const reply = await speakRickAiText(text);
      stopPlayback();
      const url = audioUrlFromBase64(reply.audioBase64, reply.mimeType);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        if (audioUrlRef.current === url) {
          URL.revokeObjectURL(url);
          audioUrlRef.current = '';
          audioRef.current = null;
        }
      };
      await audio.play();
    } catch (error) {
      notify?.(error.message || 'A voz da Rick IA não conseguiu tocar.');
    } finally {
      setVoiceBusy(false);
    }
  }

  async function sendMessage(message) {
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage || loading) return;
    if (role !== 'admin') {
      notify?.('A Rick IA pessoal fica disponível apenas no modo ADM.');
      return;
    }

    setDraft('');
    setMessages((current) => [...current, { role: 'user', content: cleanMessage }]);
    setLoading(true);
    try {
      const reply = await sendRickAiMessage({ message: cleanMessage, page, snapshot });
      setMessages((current) => [...current, { role: 'assistant', content: reply.message }]);
      setPendingAction(reply.pendingAction);
      if (voiceEnabled) void playVoice(reply.message);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: error.message || 'Deu ruim aqui por um instante. Tenta de novo.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submit(event) {
    event?.preventDefault();
    await sendMessage(draft);
  }

  async function finishRecording() {
    const mimeType = recorderRef.current?.mimeType || 'audio/webm';
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setRecording(false);

    if (!blob.size) return;
    setVoiceBusy(true);
    try {
      const audioBase64 = await blobToBase64(blob);
      const result = await transcribeRickAiAudio({ audioBase64, mimeType });
      setDraft(result.transcript);
      await sendMessage(result.transcript);
    } catch (error) {
      notify?.(error.message || 'Não consegui entender sua gravação.');
    } finally {
      setVoiceBusy(false);
    }
  }

  async function startRecording(event) {
    if (role !== 'admin' || loading || voiceBusy || recording || micHeldRef.current) return;
    micHeldRef.current = true;
    event?.currentTarget?.setPointerCapture?.(event.pointerId);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      micHeldRef.current = false;
      notify?.('Seu navegador não oferece gravação de áudio compatível.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!micHeldRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (dataEvent) => {
        if (dataEvent.data?.size) chunksRef.current.push(dataEvent.data);
      };
      recorder.onstop = () => void finishRecording();
      recorder.start();
      setRecording(true);
    } catch {
      micHeldRef.current = false;
      notify?.('Não consegui acessar o microfone. Confira a permissão do navegador.');
    }
  }

  function stopRecording() {
    micHeldRef.current = false;
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') recorder.stop();
  }

  function toggleVoice() {
    setVoiceEnabled((current) => {
      const next = !current;
      if (!next) stopPlayback();
      return next;
    });
  }

  function confirmAction() {
    if (!pendingAction || role !== 'admin') return;
    try {
      const next = applyConfirmedAction(data, pendingAction);
      const accepted = setData(next);
      if (accepted === false) return;
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'Feito. Agora sim eu alterei porque você confirmou 😏' },
      ]);
      notify?.('Ação da Rick IA confirmada.');
      setPendingAction(null);
    } catch (error) {
      notify?.(error.message || 'Não foi possível aplicar a ação da Rick IA.');
    }
  }

  return (
    <div className="rick-ai-root">
      {open && (
        <section className="rick-ai-panel" aria-label="Rick IA">
          <header className="rick-ai-header">
            <div>
              <span className="rick-ai-orb"><Bot size={18} /></span>
              <div>
                <strong>RICK IA</strong>
                <small>
                  {recording ? 'ouvindo... solte para enviar' : loading ? 'pensando...' : voiceBusy ? 'preparando voz...' : 'assistente pessoal · online'}
                </small>
              </div>
            </div>
            <div className="rick-ai-header-actions">
              <button
                className={`rick-ai-icon ${voiceEnabled ? 'active' : ''}`}
                type="button"
                aria-label={voiceEnabled ? 'Silenciar voz da Rick IA' : 'Ativar voz da Rick IA'}
                title="Voz gerada por IA"
                onClick={toggleVoice}
              >
                {voiceEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>
              <button className="rick-ai-icon" aria-label="Fechar Rick IA" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="rick-ai-messages">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`rick-ai-message ${message.role}`}>
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="rick-ai-message assistant loading">
                <LoaderCircle size={15} className="rick-ai-spin" /> pensando
              </div>
            )}
          </div>

          {pendingAction && (
            <div className="rick-ai-action-card">
              <small>A RICK IA QUER ALTERAR O OS</small>
              <strong>{pendingAction.preview}</strong>
              <p>Nada foi alterado ainda.</p>
              <div>
                <button type="button" className="rick-ai-cancel" onClick={() => setPendingAction(null)}>
                  Cancelar
                </button>
                <button type="button" className="rick-ai-confirm" onClick={confirmAction}>
                  <Check size={15} /> Confirmar
                </button>
              </div>
            </div>
          )}

          <form className="rick-ai-composer" onSubmit={submit}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={recording ? 'Ouvindo você...' : role === 'admin' ? 'Fala comigo...' : 'Disponível no modo ADM'}
              disabled={role !== 'admin' || loading || recording}
              maxLength={4000}
              aria-label="Mensagem para Rick IA"
            />
            <button
              type="button"
              className={`rick-ai-mic ${recording ? 'recording' : ''}`}
              aria-label={recording ? 'Solte para enviar a gravação' : 'Segure para falar com a Rick IA'}
              title="Segure para falar"
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerCancel={stopRecording}
              disabled={role !== 'admin' || loading || voiceBusy}
            >
              {recording ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
            <button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim() || loading || recording || role !== 'admin'}>
              <Send size={17} />
            </button>
          </form>
          <div className="rick-ai-voice-note">Segure o microfone para falar · Voz sintética gerada por IA</div>
        </section>
      )}

      <button
        type="button"
        className={`rick-ai-launcher ${open ? 'active' : ''}`}
        aria-label={open ? 'Rick IA aberta' : 'Abrir Rick IA'}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={22} /> : <MessageCircle size={23} />}
        {!open && <span className="rick-ai-launcher-label">RICK IA</span>}
      </button>
    </div>
  );
}
