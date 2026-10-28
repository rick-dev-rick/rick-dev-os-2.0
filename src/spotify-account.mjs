import { spotifySource } from './music-helpers.mjs';

// Resolve the user's own playback before moving it to the browser SDK device.
export async function playSpotifyAccount({api,deviceId,value,isCurrent}) {
  let source=spotifySource(value) || undefined;
  if(value && !source) throw new Error('Esse link não é uma música, álbum ou playlist do Spotify.');
  if(!source) {
    const current=await api('/me/player','GET');
    if(!isCurrent()) return;
    if(!spotifySource(current?.item?.uri)) {
      let recent;
      try { recent=await api('/me/player/recently-played?limit=20','GET'); }
      catch(error) {
        if(error.status===403) throw new Error('Reconecte o Spotify para autorizar suas músicas recentes e tocar aqui.');
        throw error;
      }
      if(!isCurrent()) return;
      const uris=[...new Set((recent?.items || []).flatMap(item=>spotifySource(item.track?.uri)?.uris || []))];
      if(!uris.length) throw new Error('Sua conta ainda não tem músicas no histórico. Ouça uma faixa no Spotify e tente Play aqui novamente.');
      source={uris};
    }
  }
  if(!isCurrent()) return;
  await api('/me/player','PUT',{device_ids:[deviceId],play:false});
  if(!isCurrent()) return;
  await api('/me/player/play?device_id='+encodeURIComponent(deviceId),'PUT',source);
}
