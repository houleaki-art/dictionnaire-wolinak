import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8').replace(/\r\n/g,'\n');
function block(start,end){
  const from=html.indexOf(start),to=html.indexOf(end,from);
  assert.ok(from>=0&&to>from,`Bloc introuvable : ${start}`);
  return html.slice(from,to);
}
const fetchSource=block('function parseWordList(', 'async function pushToSB(');
const settleSource=block('function settlePublicWords(', 'function saveWords(');
function context(extra={}){return vm.createContext({console:{warn(){}},...extra});}

test('le premier chargement et un échec sont distincts d’une recherche sans résultat',()=>{
  const container={contains:()=>false},count={};
  const ctx=context({
    WORDS:[],WORDS_LOAD_STATE:'loading',document:{getElementById:id=>id==='wordsContainer'?container:count},
  });
  vm.runInContext(block('function renderWords(', "window.addEventListener('beforeprint'"),ctx);
  ctx.renderWords();
  assert.match(container.innerHTML,/Le dictionnaire arrive/);
  assert.doesNotMatch(container.innerHTML,/Aucun mot trouvé|retryPublicWords/);
  ctx.WORDS_LOAD_STATE='error';
  ctx.renderWords();
  assert.match(container.innerHTML,/retryPublicWords/);
  assert.match(container.innerHTML,/n’ont pas pu être chargés/);
});

test('une liste related ou corrections corrompue ne fait pas disparaître tous les mots',async()=>{
  let cleared=false;
  const ctx=context({
    AbortController,setTimeout:()=>1,clearTimeout:()=>{cleared=true;},SB_URL:'https://example.invalid',SB_HEADERS:{},
    fetch:async()=>({ok:true,json:async()=>[
      {id:'a',related:'{invalid',corrections:'null'},
      {id:'b',related:'["Mot",null,42]',corrections:'[{"field":"fr"},null,42]'},
    ]}),
  });
  vm.runInContext(fetchSource,ctx);
  const result=await ctx.fetchWordsFromSB();
  assert.equal(result.length,2);
  assert.equal(result[0].related.length,0);
  assert.equal(result[0].corrections.length,0);
  assert.deepEqual(Array.from(result[1].related),['Mot']);
  assert.equal(result[1].corrections[0].field,'fr');
  assert.equal(result[1].corrections.length,1);
  assert.equal(cleared,true);
});

test('une requête publique bloquée est interrompue au bout de quinze secondes',async()=>{
  let timeoutCallback,timeoutMs,cleared=false;
  const ctx=context({
    AbortController,SB_URL:'https://example.invalid',SB_HEADERS:{},
    setTimeout:(fn,ms)=>{timeoutCallback=fn;timeoutMs=ms;return 1;},clearTimeout:()=>{cleared=true;},
    fetch:(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('AbortError')))),
  });
  vm.runInContext(fetchSource,ctx);
  const request=ctx.fetchWordsFromSB();
  assert.equal(timeoutMs,15000);
  timeoutCallback();
  assert.equal(await request,null);
  assert.equal(cleared,true);
});

test('une mise à jour en échec préserve le cache et la séance en cours',()=>{
  const cached=[{id:'cached'}],queue=[{id:'question'}];
  const ctx=context({WORDS:cached,WORDS_LOAD_STATE:'loading',WORDS_REMOTE_READY:false,S:{view:'pratique'},PS:{queue}});
  vm.runInContext(settleSource,ctx);
  ctx.settlePublicWords(null);
  assert.equal(ctx.WORDS,cached);
  assert.equal(ctx.PS.queue,queue);
  assert.equal(ctx.WORDS_LOAD_STATE,'error');
});

test('réessayer reste en lecture seule et empêche les lancements en double',async()=>{
  let complete,calls=0;
  const promise=new Promise(resolve=>{complete=resolve;});
  const queue=[{id:'question'}];
  const ctx=context({
    WORDS:[],WORDS_LOAD_STATE:'error',WORDS_REMOTE_READY:false,S:{view:'all',q:'soleil'},PS:{queue},
    adminUnlocked:false,renderWords(){},markWordsChanged(){},updateCounts(){},scheduleIdleWork(){},
    loadWords:()=>{calls++;return promise;},
  });
  vm.runInContext(settleSource,ctx);
  const first=ctx.retryPublicWords();
  await ctx.retryPublicWords();
  assert.equal(calls,1);
  assert.equal(ctx.WORDS_LOAD_STATE,'loading');
  complete([{id:'new'}]);
  await first;
  assert.equal(ctx.WORDS[0].id,'new');
  assert.equal(ctx.WORDS_LOAD_STATE,'ready');
  assert.equal(ctx.WORDS_REMOTE_READY,true);
  assert.equal(ctx.S.q,'soleil');
  assert.equal(ctx.PS.queue,queue);
});
