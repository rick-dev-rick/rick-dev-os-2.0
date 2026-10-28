import React, { useEffect, useState } from "react";
import {
  Music2,
  ChevronUp,
  ChevronDown,
  Shuffle,
  Plus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Settings2,
  ExternalLink,
  Headphones,
} from "lucide-react";
import { mediaUrl } from "./models.mjs";
import { useCollection } from "./components.jsx";
import useSpotify from "./useSpotify.jsx";
import { formatTime, pickOther, spotifySource } from "./music-helpers.mjs";
import "./music-modern.css";
export default function Music({ data, setData, notify, readOnly }) {
  const [open, setOpen] = useState(false),
    [provider, setProvider] = useState("spotify"),
    [selected, setSelected] = useState(null),
    [config, setConfig] = useState(false),
    [draft, setDraft] = useState(""),
    [source, setSource] = useState(""),
    [position, setPosition] = useState(0),
    [switching, setSwitching] = useState(false);
  const spotify = useSpotify(provider === "spotify");
  const editor = useCollection("media", data, setData, notify, {
    fields: [
      { name: "title", label: "Nome da música ou playlist", required: true },
      {
        name: "url",
        label: "Link público Spotify ou SoundCloud",
        required: true,
        type: "url",
      },
    ],
    title: "trilha sonora",
  });
  const list = (data.media || []).filter(
    (item) => mediaUrl(item.url)?.provider === provider,
  );
  const track = list.find((item) => item.id === selected) || list[0];
  const media = track ? mediaUrl(track.url) : null;
  const now = spotify.state?.track_window?.current_track;
  const duration = spotify.state?.duration || now?.duration_ms || 0;
  useEffect(() => {
    setPosition(spotify.state?.position || 0);
    if (!spotify.state || spotify.state.paused) return;
    const initial = spotify.state.position,
      at = Date.now();
    const timer = setInterval(
      () => setPosition(Math.min(duration, initial + Date.now() - at)),
      500,
    );
    return () => clearInterval(timer);
  }, [spotify.state, duration]);
  async function changeProvider(next) {
    if (next === provider || switching || spotify.busy) return;
    setSwitching(true);
    try {
      if (provider === "spotify") await spotify.pause();
      setProvider(next);
      setSelected(null);
    } catch {
      notify?.("Pause o Spotify antes de trocar o serviço.");
    } finally {
      setSwitching(false);
    }
  }
  const title =
    provider === "spotify"
      ? now?.name || "Sua trilha sonora"
      : track?.title || "Sua trilha sonora";
  return (
    <>
      <section
        className={"music-dock native-music " + (open ? "expanded" : "")}
        aria-label="Player de música"
      >
        <button
          className="music-dock-heading"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="native-music-panel"
        >
          <span className="music-badge">
            <Music2 size={17} />
          </span>
          <div>
            <strong>{title}</strong>
            <small>
              {provider === "spotify" ? "SPOTIFY" : "SOUNDCLOUD"}{" "}
              <span className="music-live-dot" />{" "}
              {provider === "spotify" && spotify.state && !spotify.state.paused
                ? "TOCANDO"
                : "SEU ESPAÇO DE SOM"}
            </small>
          </div>
          {open ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
        </button>
        <div className="music-dock-body" id="native-music-panel" hidden={!open}>
          <div
            className="music-player-tabs"
            role="group"
            aria-label="Serviço de música"
          >
            {["spotify", "soundcloud"].map((name) => (
              <button
                key={name}
                className={provider === name ? "selected" : ""}
                aria-pressed={provider === name}
                disabled={switching || spotify.busy}
                onClick={() => changeProvider(name)}
              >
                {name === "spotify" ? "Spotify" : "SoundCloud"}
              </button>
            ))}
          </div>
          {provider === "spotify" ? (
            <>
              <div className="native-track">
                <div className="native-art">
                  {now?.album?.images?.[0]?.url?.startsWith("https://") ? (
                    <img src={now.album.images[0].url} alt="Capa do álbum" />
                  ) : (
                    <Headphones size={29} />
                  )}
                </div>
                <div>
                  <small>SPOTIFY / RICK OS</small>
                  <strong>{now?.name || "O foco tem uma trilha."}</strong>
                  <span>
                    {now?.artists?.map((a) => a.name).join(", ") ||
                      "Conecte sua conta e aperte o play."}
                  </span>
                </div>
              </div>
              <div className="native-progress">
                <input
                  type="range"
                  aria-label="Posição da música"
                  min="0"
                  max={duration || 1}
                  value={Math.min(position, duration || 1)}
                  disabled={!duration || spotify.busy}
                  onChange={(e) => setPosition(Number(e.target.value))}
                  onPointerUp={(e) =>
                    spotify.seek(Number(e.currentTarget.value))
                  }
                  onKeyUp={(e) => {
                    if (
                      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                    )
                      spotify.seek(Number(e.currentTarget.value));
                  }}
                />
                <div>
                  <span>{formatTime(position)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              <div className="native-controls">
                <button
                  className="icon"
                  aria-label="Faixa anterior"
                  disabled={!now || !spotify.ready || spotify.busy}
                  onClick={spotify.previous}
                >
                  <SkipBack size={18} />
                </button>
                <button
                  className="native-play"
                  aria-label={
                    spotify.state && !spotify.state.paused
                      ? "Pausar"
                      : "Reproduzir"
                  }
                  disabled={
                    !spotify.connected ||
                    spotify.busy ||
                    (!now && !spotifySource(source || track?.url))
                  }
                  onClick={() =>
                    now && spotify.ready
                      ? spotify.toggle()
                      : spotify.start(source || track?.url)
                  }
                >
                  {spotify.state && !spotify.state.paused ? (
                    <Pause size={21} />
                  ) : (
                    <Play size={21} />
                  )}
                </button>
                <button
                  className="icon"
                  aria-label="Próxima faixa"
                  disabled={!now || !spotify.ready || spotify.busy}
                  onClick={spotify.next}
                >
                  <SkipForward size={18} />
                </button>
                <button
                  className="icon native-settings"
                  aria-label="Configurar Spotify"
                  aria-expanded={config}
                  onClick={() => {
                    setDraft(spotify.clientId);
                    setConfig(!config);
                  }}
                >
                  <Settings2 size={17} />
                </button>
              </div>
              <p className="native-status" role="status">
                {spotify.busy ? "Conectando ao Spotify…" : spotify.status}
              </p>
              {!spotify.connected ? (
                <button
                  className="native-connect"
                  disabled={spotify.busy}
                  onClick={() =>
                    spotify.clientId
                      ? spotify.connect()
                      : (setDraft(""), setConfig(true))
                  }
                >
                  Conectar Spotify <ExternalLink size={13} />
                </button>
              ) : (
                <button className="text-button" onClick={spotify.disconnect}>
                  Desconectar
                </button>
              )}
              {(config || !spotify.clientId) && (
                <form
                  className="native-config"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (spotify.saveClient(draft)) setConfig(false);
                  }}
                >
                  <label>
                    Client ID público
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Client ID do seu app Spotify"
                      autoComplete="off"
                      spellCheck="false"
                      required
                    />
                  </label>
                  <small>
                    Cadastre este endereço de retorno no{" "}
                    <a
                      href="https://developer.spotify.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Spotify Developer Dashboard
                    </a>
                    :
                  </small>
                  <code>{new URL(import.meta.env.BASE_URL, location.origin).href}</code>
                  <small>
                    Reprodução com Spotify Premium. A autorização fica neste
                    navegador.
                  </small>
                  <button className="secondary" type="submit">
                    Salvar configuração
                  </button>
                </form>
              )}
              {spotify.connected && (
                <form
                  className="native-source"
                  onSubmit={(e) => {
                    e.preventDefault();
                    spotify.start(source || track?.url);
                  }}
                >
                  <label htmlFor="spotify-source">O que vamos ouvir?</label>
                  <div>
                    <input
                      id="spotify-source"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="Link de música, álbum ou playlist"
                    />
                    <button
                      className="icon"
                      aria-label="Tocar link no Spotify"
                      disabled={
                        spotify.busy || !spotifySource(source || track?.url)
                      }
                    >
                      <Play size={16} />
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : media ? (
            <iframe
              key={track.id}
              title={`${track.title} — SoundCloud`}
              src={media.embed}
              width="100%"
              height="166"
              allow="autoplay"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="music-empty">
              <Headphones size={28} />
              <p>Seu próximo som começa aqui.</p>
              <small>Adicione uma música ou playlist do SoundCloud.</small>
            </div>
          )}
          <div className="native-library">
            <div className="native-library-heading">
              <span>SUA SELEÇÃO</span>
              <button
                className="icon"
                disabled={list.length < 2}
                aria-label="Escolher outra playlist aleatória"
                onClick={() => {
                  const next = pickOther(list, track?.id);
                  if (next) setSelected(next.id);
                }}
              >
                <Shuffle size={14} />
              </button>
            </div>
            {list.length > 0 && (
              <select
                aria-label="Selecionar música ou playlist"
                value={track?.id || ""}
                onChange={(e) => setSelected(e.target.value)}
              >
                {list.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            )}
            {provider === "spotify" && track && spotify.connected && (
              <button
                className="text-button"
                disabled={spotify.busy}
                onClick={() => spotify.start(track.url)}
              >
                <Play size={13} /> Tocar seleção
              </button>
            )}
            <div className="music-dock-actions">
              <button
                className="text-button"
                disabled={readOnly}
                onClick={() => editor.open()}
              >
                <Plus size={14} /> Adicionar
              </button>
              {track && !readOnly && (
                <button
                  className="text-button"
                  onClick={() => editor.remove(track)}
                >
                  Remover
                </button>
              )}
              {track && (
                <a
                  className="text-button"
                  href={track.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir seleção no serviço"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
          {readOnly && (
            <small className="music-tip">
              Modo visitante · ouça e conecte sua conta. A seleção salva é do
              proprietário.
            </small>
          )}
        </div>
      </section>
      {editor.ui}
    </>
  );
}
