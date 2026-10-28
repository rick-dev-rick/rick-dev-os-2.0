export function spotifySource(value) {
  let uri = String(value || "").trim();
  if (uri.startsWith("https://")) {
    try {
      const url = new URL(uri);
      if (url.hostname !== "open.spotify.com") return null;
      const match = url.pathname.match(
        /^\/(?:intl-[a-z-]+\/)?(track|playlist|album)\/([A-Za-z0-9]{22})\/?$/,
      );
      uri = match ? `spotify:${match[1]}:${match[2]}` : "";
    } catch {
      return null;
    }
  }
  if (!/^spotify:(track|playlist|album):[A-Za-z0-9]{22}$/.test(uri))
    return null;
  return uri.startsWith("spotify:track:")
    ? { uris: [uri] }
    : { context_uri: uri };
}
export function validOAuthCallback(href, pending, now = Date.now()) {
  const url = new URL(href);
  return Boolean(
    pending?.verifier &&
    pending.state &&
    url.searchParams.get("state") === pending.state &&
    (url.searchParams.has("code") || url.searchParams.has("error")) &&
    now - pending.createdAt >= 0 &&
    now - pending.createdAt < 600000,
  );
}
export function oauthReturnUrl(callback, returnTo) {
  const source = new URL(callback),
    target = new URL(returnTo, source.origin);
  if (target.origin !== source.origin) return source.origin + "/";
  for (const [key, value] of source.searchParams)
    if (!["code", "state", "error", "error_description"].includes(key))
      target.searchParams.set(key, value);
  return target.href;
}
export function pickOther(items, current, random = Math.random) {
  const others = items.filter((item) => item.id !== current);
  return others[Math.floor(random() * others.length)] || null;
}
export function formatTime(ms = 0) {
  const sec = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
