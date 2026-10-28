import test from "node:test";
import assert from "node:assert/strict";
import {
  spotifySource,
  oauthReturnUrl,
  pickOther,
  formatTime,
  validOAuthCallback,
} from "../src/music-helpers.mjs";
test("Spotify playback source accepts only official tracks albums playlists", () => {
  const id = "1234567890123456789012";
  assert.deepEqual(
    spotifySource(`https://open.spotify.com/intl-pt/track/${id}?si=abc`),
    { uris: [`spotify:track:${id}`] },
  );
  assert.deepEqual(spotifySource(`spotify:playlist:${id}`), {
    context_uri: `spotify:playlist:${id}`,
  });
  for (const url of [
    "javascript:alert(1)",
    `https://evil.com/track/${id}`,
    `https://open.spotify.com.evil.com/track/${id}`,
    "spotify:track:short",
  ])
    assert.equal(spotifySource(url), null);
});
test("OAuth callback validates state and expires abandoned login", () => {
  const pending = { state: "expected", verifier: "secret", createdAt: 100 };
  assert.equal(
    validOAuthCallback(
      "https://rick.example/?code=a&state=expected",
      pending,
      200,
    ),
    true,
  );
  assert.equal(
    validOAuthCallback(
      "https://rick.example/?code=a&state=other",
      pending,
      200,
    ),
    false,
  );
  assert.equal(
    validOAuthCallback(
      "https://rick.example/?code=a&state=expected",
      pending,
      700000,
    ),
    false,
  );
});
test("OAuth return preserves original and unrelated callback parameters", () => {
  assert.equal(
    oauthReturnUrl(
      "https://rick.example/?code=secret&state=x&view=board",
      "https://rick.example/?guest=1#projects",
    ),
    "https://rick.example/?guest=1&view=board#projects",
  );
});
test("shuffle excludes active track and handles short lists", () => {
  assert.equal(pickOther([{ id: "a" }, { id: "b" }], "a", () => 0).id, "b");
  assert.equal(pickOther([{ id: "a" }], "a"), null);
  assert.equal(formatTime(61000), "1:01");
});
