// Adaptações de hospedagem: sem alterar módulos, autorização ou dados compartilhados.
window.RICK_DEV_SPOTIFY_REDIRECT_URI = new URL('index.html', window.location.href).href.split('?')[0].split('#')[0];
window.RICK_DEV_PRETTIER_BASE = new URL('vendor/prettier/', window.location.href).href;
