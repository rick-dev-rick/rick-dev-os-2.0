import test from 'node:test';
import assert from 'node:assert/strict';
import { playSpotifyAccount } from '../src/spotify-account.mjs';
const uri='spotify:track:1234567890123456789012';
function setup(current,recent,options={}) {
 const calls=[];
 const api=async(path,method='PUT',body)=>{
  calls.push({path,method,body});
  if(method==='GET' && path==='/me/player') return current;
  if(method==='GET') {if(options.recentError) throw Object.assign(new Error('denied'),{status:403});return recent;}
 };
 return {calls,api};
}
test('Play sem link retoma a fila da conta no dispositivo do navegador',async()=>{
 const s=setup({item:{uri}},null);
 await playSpotifyAccount({api:s.api,deviceId:'browser',isCurrent:()=>true});
 assert.deepEqual(s.calls.map(x=>x.path),['/me/player','/me/player','/me/player/play?device_id=browser']);
 assert.deepEqual(s.calls[1].body,{device_ids:['browser'],play:false});
 assert.equal(s.calls[2].body,undefined);
});
test('Sem reprodução ativa, Play usa as músicas recentes sem pedir link',async()=>{
 const s=setup(null,{items:[{track:{uri}},{track:{uri}},{track:{uri:'spotify:track:abcdefghijklmnopqrstuv'}}]});
 await playSpotifyAccount({api:s.api,deviceId:'browser',isCurrent:()=>true});
 assert.deepEqual(s.calls.at(-1).body,{uris:[uri,'spotify:track:abcdefghijklmnopqrstuv']});
});
test('Link explícito continua opcional e tem prioridade',async()=>{
 const s=setup(null,null);
 await playSpotifyAccount({api:s.api,deviceId:'browser',value:uri,isCurrent:()=>true});
 assert.equal(s.calls.some(x=>x.method==='GET'),false);
 assert.deepEqual(s.calls.at(-1).body,{uris:[uri]});
});
test('Sem permissão de histórico informa reconexão sem transferir a reprodução',async()=>{
 const s=setup(null,null,{recentError:true});
 await assert.rejects(playSpotifyAccount({api:s.api,deviceId:'browser',isCurrent:()=>true}),/Reconecte.*recentes/);
 assert.equal(s.calls.some(x=>x.method==='PUT'),false);
});
test('Conta sem histórico informa estado vazio sem pedir URL',async()=>{
 const s=setup(null,{items:[]});
 await assert.rejects(playSpotifyAccount({api:s.api,deviceId:'browser',isCurrent:()=>true}),/histórico/);
 assert.equal(s.calls.some(x=>x.method==='PUT'),false);
});
test('Desconexão durante a leitura impede comandos de áudio tardios',async()=>{
 const s=setup(null,{items:[{track:{uri}}]});let active=true;
 const api=async(...args)=>{const result=await s.api(...args);active=false;return result;};
 await playSpotifyAccount({api,deviceId:'browser',isCurrent:()=>active});
 assert.equal(s.calls.some(x=>x.method==='PUT'),false);
});
