import { useCallback, useEffect, useRef, useState } from "react";
import {
  spotifySource,
  validOAuthCallback,
  oauthReturnUrl,
} from "./music-helpers.mjs";
const CLIENT = "rick-dev-spotify-client-id",
  TOKEN = "rick-os2-spotify-token",
  PENDING = "rick-os2-spotify-pkce";
const read = (key) => {
  try {
    return JSON.parse(sessionStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};
const savedClient = () => {
  try {
    return localStorage.getItem(CLIENT) || "";
  } catch {
    return "";
  }
};
let sdkPromise;
function loadSdk() {
  if (window.Spotify?.Player) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      script.remove();
      sdkPromise = null;
      reject(new Error("O player demorou para carregar. Tente novamente."));
    }, 15000);
    window.onSpotifyWebPlaybackSDKReady = () => {
      clearTimeout(timer);
      resolve();
    };
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      sdkPromise = null;
      reject(new Error("Não foi possível carregar o Spotify."));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}
async function tokenRequest(payload) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(payload),
  });
  const json = await response.json();
  if (!response.ok)
    throw new Error("Autorização Spotify indisponível. Conecte novamente.");
  return json;
}
const base64 = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
export default function useSpotify(active) {
  const [clientId, setClientId] = useState(savedClient),
    [connected, setConnected] = useState(() => Boolean(read(TOKEN))),
    [status, setStatus] = useState("Sua trilha, no seu ritmo."),
    [state, setState] = useState(null),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false);
  const player = useRef(null),
    device = useRef(null),
    generation = useRef(0),
    refresh = useRef(null),
    initializing = useRef(null),
    activeRef = useRef(active);
  activeRef.current = active;
  const storeToken = useCallback((json, old) => {
    const value = {
      accessToken: json.access_token,
      refreshToken: json.refresh_token || old,
      expiresAt: Date.now() + json.expires_in * 1000,
    };
    sessionStorage.setItem(TOKEN, JSON.stringify(value));
    setConnected(true);
    return value.accessToken;
  }, []);
  const accessToken = useCallback(async () => {
    const saved = read(TOKEN);
    if (!saved) throw new Error("Conecte sua conta Spotify.");
    if (saved.expiresAt > Date.now() + 60000) return saved.accessToken;
    if (!refresh.current) {
      const current = generation.current;
      refresh.current = tokenRequest({
        grant_type: "refresh_token",
        client_id: clientId,
        refresh_token: saved.refreshToken,
      })
        .then((json) => {
          if (current !== generation.current)
            throw new Error("Conexão encerrada.");
          return storeToken(json, saved.refreshToken);
        })
        .finally(() => {
          refresh.current = null;
        });
    }
    return refresh.current;
  }, [clientId, storeToken]);
  const api = useCallback(
    async (path, method = "PUT", payload) => {
      const current = generation.current;
      const token = await accessToken();
      if (current !== generation.current) throw new Error("Conexão encerrada.");
      const response = await fetch("https://api.spotify.com/v1" + path, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(payload ? { "Content-Type": "application/json" } : {}),
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
      });
      if (!response.ok)
        throw new Error(
          response.status === 403
            ? "O Spotify exige Premium e permissão deste app para reproduzir."
            : response.status === 429
              ? "Aguarde um momento antes de tentar novamente."
              : "Não foi possível controlar o Spotify. Reconecte e tente novamente.",
        );
    },
    [accessToken],
  );
  useEffect(() => {
    const pending = read(PENDING);
    if (!pending || !validOAuthCallback(location.href, pending)) return;
    const url = new URL(location.href);
    sessionStorage.removeItem(PENDING);
    history.replaceState(
      history.state,
      "",
      oauthReturnUrl(url.href, pending.returnTo),
    );
    if (url.searchParams.has("error")) {
      setStatus("Conexão cancelada. Você pode tentar novamente.");
      return;
    }
    setBusy(true);
    tokenRequest({
      grant_type: "authorization_code",
      client_id: pending.clientId,
      code: url.searchParams.get("code"),
      redirect_uri: pending.redirectUri,
      code_verifier: pending.verifier,
    })
      .then((json) => {
        storeToken(json);
        setStatus("Spotify conectado. Escolha uma faixa e dê Play.");
      })
      .catch((e) => setStatus(e.message))
      .finally(() => setBusy(false));
  }, [storeToken]);
  const disconnect = useCallback(() => {
    generation.current++;
    player.current?.pause().catch(() => {});
    player.current?.disconnect();
    player.current = null;
    device.current = null;
    initializing.current = null;
    sessionStorage.removeItem(TOKEN);
    sessionStorage.removeItem(PENDING);
    setConnected(false);
    setReady(false);
    setState(null);
    setStatus("Spotify desconectado deste navegador.");
  }, []);
  useEffect(
    () => () => {
      generation.current++;
      player.current?.disconnect();
    },
    [],
  );
  useEffect(() => {
    if (!active) player.current?.pause().catch(() => {});
  }, [active]);
  async function ensurePlayer() {
    if (device.current) return device.current;
    if (initializing.current) return initializing.current;
    const current = generation.current;
    initializing.current = (async () => {
      await loadSdk();
      if (current !== generation.current) throw new Error("Conexão encerrada.");
      return new Promise((resolve, reject) => {
        const instance = new window.Spotify.Player({
          name: "RICK_DEV OS 2.0",
          volume: 0.5,
          getOAuthToken: (callback) => {
            accessToken()
              .then(callback)
              .catch((e) => setStatus(e.message));
          },
        });
        player.current = instance;
        const timer = setTimeout(
          () => fail("O player não respondeu. Tente novamente."),
          20000,
        );
        function fail(message) {
          clearTimeout(timer);
          instance.disconnect();
          if (player.current === instance) {
            player.current = null;
            device.current = null;
            setReady(false);
          }
          reject(new Error(message));
        }
        instance.addListener("ready", ({ device_id }) => {
          if (current !== generation.current || player.current !== instance) {
            instance.disconnect();
            return;
          }
          clearTimeout(timer);
          device.current = device_id;
          setReady(true);
          resolve(device_id);
        });
        instance.addListener("not_ready", () => {
          if (current !== generation.current || player.current !== instance)
            return;
          instance.disconnect();
          player.current = null;
          device.current = null;
          setReady(false);
          setStatus("Player offline. Dê Play para reconectar.");
        });
        instance.addListener("player_state_changed", (value) => {
          if (current === generation.current && player.current === instance) {
            setState(value);
            if (value && !value.paused && !activeRef.current)
              instance.pause().catch(() => {});
          }
        });
        for (const [event, message] of [
          [
            "initialization_error",
            "Este navegador não liberou áudio protegido (DRM).",
          ],
          [
            "authentication_error",
            "Sua autorização expirou. Reconecte o Spotify.",
          ],
          ["account_error", "A reprodução no navegador exige Spotify Premium."],
        ])
          instance.addListener(event, () => fail(message));
        instance.addListener("playback_error", ({ message }) =>
          setStatus(message || "Não foi possível reproduzir esta faixa."),
        );
        instance.addListener("autoplay_failed", () =>
          setStatus("Clique em Play novamente para liberar o áudio."),
        );
        instance
          .connect()
          .then((ok) => {
            if (!ok) fail("Não foi possível conectar o player.");
          })
          .catch((e) => fail(e.message));
      });
    })().finally(() => {
      initializing.current = null;
    });
    return initializing.current;
  }
  const run = async (action) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      setStatus("Spotify · neste navegador");
    } catch (e) {
      setStatus(e.message);
    } finally {
      setBusy(false);
    }
  };
  return {
    clientId,
    connected,
    status,
    state,
    busy,
    ready,
    saveClient(value) {
      const id = value.trim();
      if (!/^[a-f\d]{32}$/i.test(id)) {
        setStatus("Informe um Client ID válido com 32 caracteres.");
        return false;
      }
      if (id !== clientId) disconnect();
      localStorage.setItem(CLIENT, id);
      setClientId(id);
      setStatus("Client ID salvo. Conecte sua conta Spotify.");
      return true;
    },
    connect: () =>
      run(async () => {
        if (!clientId)
          throw new Error("Configure o Client ID público do Spotify primeiro.");
        const verifier = base64(crypto.getRandomValues(new Uint8Array(64))),
          oauthState = base64(crypto.getRandomValues(new Uint8Array(24))),
          redirectUri = new URL(import.meta.env.BASE_URL, location.origin).href;
        const challenge = base64(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(verifier),
          ),
        );
        sessionStorage.setItem(
          PENDING,
          JSON.stringify({
            verifier,
            state: oauthState,
            createdAt: Date.now(),
            clientId,
            redirectUri,
            returnTo: location.href,
          }),
        );
        const url = new URL("https://accounts.spotify.com/authorize");
        url.search = new URLSearchParams({
          client_id: clientId,
          response_type: "code",
          redirect_uri: redirectUri,
          state: oauthState,
          code_challenge_method: "S256",
          code_challenge: challenge,
          scope:
            "streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state",
        });
        location.assign(url.href);
      }),
    disconnect,
    start: (value) =>
      run(async () => {
        const source = spotifySource(value);
        if (!source)
          throw new Error(
            "Use um link oficial de faixa, álbum ou playlist do Spotify.",
          );
        const current = generation.current;
        const id = await ensurePlayer();
        if (current !== generation.current || !activeRef.current) return;
        await player.current.activateElement?.();
        await api("/me/player", "PUT", { device_ids: [id], play: false });
        if (current !== generation.current || !activeRef.current) return;
        await api(
          "/me/player/play?device_id=" + encodeURIComponent(id),
          "PUT",
          source,
        );
        if (current !== generation.current || !activeRef.current) {
          await player.current?.pause();
        }
      }),
    toggle: () =>
      run(async () => {
        if (!player.current || !ready)
          throw new Error("Cole um link e toque para iniciar.");
        await player.current.activateElement?.();
        await player.current.togglePlay();
      }),
    previous: () =>
      run(async () => {
        await player.current?.previousTrack();
      }),
    next: () =>
      run(async () => {
        await player.current?.nextTrack();
      }),
    seek: (value) =>
      run(async () => {
        await player.current?.seek(value);
      }),
    pause: async () => {
      try {
        await player.current?.pause();
      } catch (e) {
        setStatus(e.message);
        throw e;
      }
    },
  };
}
