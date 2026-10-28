(() => {
  'use strict';
  const redirect = document.querySelector('#spotify-settings code');
  if(redirect)redirect.textContent=window.RICK_DEV_SPOTIFY_REDIRECT_URI;
  const box = document.createElement('details');
  box.id='rick-experience-switcher';
  const summary=document.createElement('summary');summary.textContent='2.0 · Modo original completo';box.append(summary);
  const content=document.createElement('div');
  const intro=document.createElement('p');intro.textContent='Esta é a versão original completa, preservada enquanto a interface React é reconstruída. Login ADM e convidado usam o mesmo banco do 1.0.';content.append(intro);
  const react=document.createElement('a');react.href='/?modo=react';react.textContent='Testar a interface nova em React →';content.append(react);
  const original=document.createElement('a');original.href='https://rick-dev-rick.github.io/rick-dev-os/';original.target='_blank';original.rel='noopener noreferrer';original.textContent='Abrir o site original no endereço antigo ↗';content.append(original);
  const note=document.createElement('p');note.textContent='Seu Cofre de Códigos fica no navegador e no endereço antigo: exporte por lá e importe aqui. A conexão Spotify precisa do Client ID e do novo endereço de retorno, mostrado em Configurar.';note.className='rick-transfer-note';content.append(note);
  box.append(content);document.body.append(box);
})();
