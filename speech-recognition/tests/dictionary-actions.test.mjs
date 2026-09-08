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
function context(extra={}){
  return vm.createContext({console:{warn(){}},...extra});
}
const pushSource=block('async function pushSuggestion(', 'async function deleteSuggestion(');

test('une suggestion refusée ou hors ligne ne rejoint pas le cache des contributions reçues',async()=>{
  for(const fetch of [async()=>({ok:false,status:403}),async()=>{throw new Error('offline');}]){
    const ctx=context({fetch,SB_URL:'https://example.invalid',SB_HEADERS:{},SUGGESTIONS_CACHE:[]});
    vm.runInContext(pushSource,ctx);
    assert.equal(await ctx.pushSuggestion({id:'suggestion'}),false);
    assert.equal(ctx.SUGGESTIONS_CACHE.length,0);
  }
});

test('une suggestion acceptée est conservée après la réponse HTTP',async()=>{
  const ctx=context({fetch:async()=>({ok:true,status:201}),SB_URL:'https://example.invalid',SB_HEADERS:{},SUGGESTIONS_CACHE:[]});
  vm.runInContext(pushSource,ctx);
  assert.equal(await ctx.pushSuggestion({id:'suggestion'}),true);
  assert.equal(ctx.SUGGESTIONS_CACHE[0].id,'suggestion');
});

function suggestionForm(pushSuggestion){
  const elements={
    suggField:{value:'fr'},suggValue:{value:'Le sens proposé'},suggReason:{value:'Une précision'},
    suggPrivacyConsent:{checked:true},suggSubmit:{disabled:false,textContent:'Envoyer la suggestion'},
    suggStatus:{hidden:true,textContent:''},
  };
  const closed=[],messages=[];
  const ctx=context({
    document:{getElementById:id=>elements[id]},pushSuggestion,
    _suggWordId:'word',_suggWordData:{id:'word',aln8ba:'Mot',fr:'Sens'},_suggSubmitting:false,
    sanitizePlain:value=>value,closeModal:id=>closed.push(id),toast:message=>messages.push(message),
  });
  vm.runInContext(block('async function submitSuggestion(', 'async function applySuggestion('),ctx);
  return {ctx,elements,closed,messages};
}

test('un échec de transmission garde le formulaire et le texte, sans message de succès',async()=>{
  const {ctx,elements,closed,messages}=suggestionForm(async()=>false);
  await ctx.submitSuggestion();
  assert.equal(elements.suggValue.value,'Le sens proposé');
  assert.equal(closed.length,0);
  assert.equal(messages.length,0);
  assert.equal(elements.suggStatus.hidden,false);
  assert.equal(elements.suggSubmit.disabled,false);
  assert.equal(ctx._suggSubmitting,false);
});

test('un double clic pendant la transmission ne soumet pas deux fois',async()=>{
  let complete,calls=0;
  const pending=new Promise(resolve=>{complete=resolve;});
  const {ctx,elements,closed}=suggestionForm(()=>{calls++;return pending;});
  const first=ctx.submitSuggestion();
  await ctx.submitSuggestion();
  assert.equal(calls,1);
  assert.equal(elements.suggSubmit.disabled,true);
  complete(true);
  await first;
  assert.deepEqual(closed,['suggestionModal']);
  assert.equal(elements.suggSubmit.disabled,false);
});

function cards(){
  const ctx=context({
    FAVS:[],S:{q:'',expanded:new Set()},PRINT_WORD_DETAILS:false,
    FORM_LABELS:{base:'Base',diminutif:'Diminutif'},
    cardPhonetic:()=>'',catLabel:value=>value,levelBadge:()=>'',
    publicNoteText:value=>value,publicSourceLabel:value=>value,
  });
  vm.runInContext(block('function escQ(', '// Sur mobile'),ctx);
  ctx.hl=ctx.escH;
  vm.runInContext(block('function makeFamilyCard(', 'function renderWords('),ctx);
  return ctx;
}
const word={id:'mot-1',aln8ba:'Mot',fr:'Un sens',cat:'nature',notes:'Une explication',source:'Source citée'};

test('les détails disposent de boutons natifs et restent masqués avant activation',()=>{
  const ctx=cards();
  const single=ctx.makeSingleCard(word);
  assert.match(single,/<button type="button" class="word card-word-toggle"[^>]*aria-expanded="false"/);
  assert.match(single,/id="details-body-mot-1" hidden/);
  assert.doesNotMatch(single,/Une explication/);
  ctx.S.expanded.add(word.id);
  const expanded=ctx.makeSingleCard(word);
  assert.match(expanded,/aria-expanded="true"/);
  assert.match(expanded,/Une explication/);
  const family=ctx.makeFamilyCard([{...word,formType:'base'},{...word,id:'mot-2',formType:'diminutif'}]);
  assert.match(family,/id="forms-toggle-mot-1"/);
  assert.match(family,/aria-controls="forms-mot-1"/);
});

test('les favoris gardent leur action séparée et annoncent leur état',()=>{
  const ctx=cards();
  let rendered=0;
  ctx.renderWords=()=>{rendered++;};
  vm.runInContext(block('function toggleCard(', 'function toggleFav('),ctx);
  ctx.toggleCard(word.id,{target:{closest:()=>({})}});
  assert.equal(ctx.S.expanded.size,0);
  assert.equal(rendered,0);
  ctx.toggleCard(word.id,{target:{closest:()=>null}});
  assert.equal(ctx.S.expanded.has(word.id),true);
  assert.equal(rendered,1);
  ctx.FAVS.push(word.id);
  assert.match(ctx.makeSingleCard(word),/aria-pressed="true"/);
});

test('ouvrir les détails au clavier conserve le focus après le remplacement des fiches',()=>{
  const ctx=cards();
  const focusCalls=[];
  const trigger={id:'details-mot-1',focus:options=>focusCalls.push(options)};
  const container={contains:element=>element===trigger,innerHTML:'',className:''};
  const nodes={wordsContainer:container,sortSel:{value:'alpha'},resCount:{},'details-mot-1':trigger};
  Object.assign(ctx,{
    document:{activeElement:trigger,getElementById:id=>nodes[id]},
    WORDS:[word],WORDS_LOAD_STATE:'ready',
    filtered:()=>[word],buildDisplayItems:()=>[{type:'single',word}],wordBatchSize:()=>18,
    adminUnlocked:false,WORD_RENDER_KEY:'',WORD_RENDER_LIMIT:0,
  });
  Object.assign(ctx.S,{view:'all',cat:'',letter:'',lang:'aln8ba',layout:'grid'});
  vm.runInContext(block('function renderWords(', "window.addEventListener('beforeprint'"),ctx);
  ctx.renderWords();
  assert.equal(focusCalls.length,1);
  assert.equal(focusCalls[0].preventScroll,true);
  ctx.document.activeElement={id:'searchIn'};
  ctx.renderWords();
  assert.equal(focusCalls.length,1);
});

test('les guillemets et apostrophes du texte ne cassent pas le bouton de correction',()=>{
  const ctx=cards();
  ctx.S.expanded.add(word.id);
  const markup=ctx.makeSingleCard({...word,fr:'L’objet "rouge"'});
  const handler=markup.match(/onclick="(openSuggestion\([^"]*)"/)[1];
  assert.match(handler,/&quot;rouge&quot;/);
  const decoded=handler.replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&');
  assert.doesNotThrow(()=>new vm.Script(decoded));
});

const storageKeys={version:'version',words:'words',pending:'pending',favs:'favorites'};
const migrationSource=block('(function checkVersion()', '// ══════════════════════════════════════════════════════════\n//  SEED DATA');
const favoritesSource=block('function loadFavs(', 'function uid(');

test('un refus du stockage ne bloque pas le démarrage pendant la migration du cache',()=>{
  for(const operation of ['getItem','removeItem','setItem']){
    const localStorage={getItem:()=>null,removeItem(){},setItem(){}};
    localStorage[operation]=()=>{throw new Error('Stockage refusé');};
    const ctx=context({localStorage,SK:storageKeys,DATA_VERSION:'current'});
    vm.runInContext(migrationSource+'\nglobalThis.started=true;',ctx);
    assert.equal(ctx.started,true,operation);
  }
});

test('la migration ne supprime que les anciens caches de mots',()=>{
  const removed=[],written=[];
  const ctx=context({
    localStorage:{getItem:()=>null,removeItem:key=>removed.push(key),setItem:(...args)=>written.push(args)},
    SK:storageKeys,DATA_VERSION:'current',
  });
  vm.runInContext(migrationSource,ctx);
  assert.deepEqual(removed,['words','pending']);
  assert.deepEqual(written,[['version','current']]);
});

test('des favoris corrompus ou de mauvais type ne font pas planter le dictionnaire',()=>{
  for(const value of ['{','null','{}','42','"mot-1"']){
    const ctx=context({localStorage:{getItem:()=>value},SK:storageKeys});
    vm.runInContext(favoritesSource,ctx);
    assert.deepEqual(Array.from(ctx.loadFavs()),[]);
  }
  const ctx=context({localStorage:{getItem(){throw new Error('Accès refusé');}},SK:storageKeys});
  vm.runInContext(favoritesSource,ctx);
  assert.deepEqual(Array.from(ctx.loadFavs()),[]);
});

test('les favoris valides sont conservés et les éléments invalides sont ignorés',()=>{
  const values=['mot-1',null,12,{},'',false,'  ','mot-1','mot-2'];
  const ctx=context({localStorage:{getItem:()=>JSON.stringify(values)},SK:storageKeys});
  vm.runInContext(favoritesSource,ctx);
  assert.deepEqual(Array.from(ctx.loadFavs()),['mot-1','mot-2']);
});

test('un quota dépassé garde les favoris utilisables en mémoire et annonce leur durée',()=>{
  const messages=[];
  let updates=0,renders=0;
  const ctx=context({
    localStorage:{setItem(){throw new Error('QuotaExceededError');}},SK:storageKeys,
    FAVS:[],FILTER_CACHE_KEY:'old',toast:message=>messages.push(message),
    updateCounts:()=>{updates++;},renderWords:()=>{renders++;},
  });
  vm.runInContext(favoritesSource,ctx);
  vm.runInContext(block('function toggleFav(', 'function audioPlaybackBlocked('),ctx);
  ctx.toggleFav('mot-1');
  assert.deepEqual(Array.from(ctx.FAVS),['mot-1']);
  assert.equal(updates,1);
  assert.equal(renders,1);
  assert.match(messages[0],/pour cette visite/);
  ctx.toggleFav('mot-1');
  assert.deepEqual(Array.from(ctx.FAVS),[]);
});
