import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const html=fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../index.html'),'utf8').replace(/\r\n/g,'\n');
function sourceBetween(start,end){
  const from=html.indexOf(start),to=html.indexOf(end,from);
  assert.ok(from>=0&&to>from,`Bloc absent : ${start}`);
  return html.slice(from,to);
}
function deferred(){
  let resolve;
  const promise=new Promise(done=>{resolve=done;});
  return {promise,resolve};
}
function element(id='',dataset={}){
  const classes=new Set(),attributes=new Map(),events={};
  return {id,dataset,events,style:{setProperty(){}},textContent:'',value:'',hidden:false,
    addEventListener:(type,fn)=>{events[type]=fn;},
    setAttribute:(key,value)=>attributes.set(key,value),getAttribute:key=>attributes.get(key),
    getBoundingClientRect:()=>({height:120}),
    classList:{toggle:(name,on)=>{if(on)classes.add(name);else classes.delete(name);},add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name)}
  };
}
const entries=[
  {id:'lake',aln8ba:'Wli',fr:'L’été au lac',en:'Summer lake',cat:'nature',date_added:'2026-08-01',source:'Revu dans le projet'},
  {id:'walk',aln8ba:'N’dal8wzi',fr:'Je marche',en:'I walk',cat:'action',date_added:null,source:'Revu dans le projet'},
  {id:'hello',aln8ba:'Kwai',fr:'Bonjour',en:'Hello',cat:'salut',date_added:'2026-09-07',source:'Revu dans le projet'},
  {id:'unreviewed',aln8ba:'Test',fr:'Non examiné',en:'Not reviewed',cat:'nature',source:''},
  {id:'nullable',aln8ba:null,fr:null,en:'Unknown row',cat:null,date_added:null,source:'Revu dans le projet'}
];
const searchSource=sourceBetween('let WORD_LEVEL_CACHE=new WeakMap();',"// ── Ordre d'affichage")+
  sourceBetween('function markWordsChanged()','function wordBatchSize()');
function searchHarness(){
  const sort=element('sortSel'); sort.value='alpha';
  const context=vm.createContext({
    WORDS:structuredClone(entries),WORDS_REVISION:0,WORD_RENDER_KEY:'',FILTER_CACHE_KEY:'',FILTER_CACHE_RESULT:[],
    FAVS:['hello'],adminUnlocked:false,S:{view:'all',cat:'',letter:'',q:'',lang:'aln8ba'},
    document:{getElementById:id=>id==='sortSel'?sort:null}
  });
  vm.runInContext(searchSource,context);
  return {context,sort,ids:()=>Array.from(context.filtered(),entry=>entry.id)};
}

test('la recherche trouve accents, apostrophes courbes et espaces sans changer les mots',()=>{
  const h=searchHarness();
  h.context.S.q='  ÉTÉ  ';
  assert.deepEqual(h.ids(),['lake']);
  h.context.S.q="n'dal8wzi";
  assert.deepEqual(h.ids(),['walk']);
  h.context.S.q='N‘DAL8WZI';
  assert.deepEqual(h.ids(),['walk']);
  assert.equal(h.context.WORDS[1].aln8ba,'N’dal8wzi');
});

test('changer la langue renouvelle les résultats même avec une recherche déjà en cache',()=>{
  const h=searchHarness();
  h.context.S.q='summer';
  const all=h.context.filtered();
  assert.deepEqual(Array.from(all,w=>w.id),['lake']);
  assert.equal(h.context.filtered(),all,'La même recherche doit réutiliser son résultat.');
  h.context.S.lang='fr';
  assert.deepEqual(h.ids(),[]);
  h.context.S.lang='en';
  assert.deepEqual(h.ids(),['lake']);
  h.context.S.q='été';
  assert.deepEqual(h.ids(),[]);
  h.context.S.lang='fr';
  assert.deepEqual(h.ids(),['lake']);
  h.context.S.q="n'dal8wzi";
  assert.deepEqual(h.ids(),[]);
  h.context.S.lang='aln8ba';
  assert.deepEqual(h.ids(),['walk']);
});

test('la recherche publique ignore les mentions présentes seulement dans les notes ou la grammaire',()=>{
  const h=searchHarness();
  h.context.WORDS[0].notes='Un rapprochement historique avec un tambour.';
  h.context.WORDS[1].grammar='Comparaison avec tambour';
  h.context.markWordsChanged();
  h.context.S.q='tambour';
  assert.deepEqual(h.ids(),[]);
  h.context.WORDS[2].fr='Tambour';
  h.context.markWordsChanged();
  assert.deepEqual(h.ids(),['hello']);
});

test('un mot exact puis un sens exact précèdent un préfixe et une simple mention',()=>{
  const h=searchHarness();
  h.context.WORDS=[
    {id:'mention',aln8ba:'Aaaa',fr:'Sur le lac'},
    {id:'prefix',aln8ba:'Bbbb',fr:'Lac profond'},
    {id:'meaning',aln8ba:'Cccc',fr:'Étang · lac'},
    {id:'exact',aln8ba:'Zzzz',fr:'Lac'}
  ].map(w=>({...w,source:'Revu dans le projet'}));
  h.context.markWordsChanged();
  h.context.S.q='lac';
  assert.deepEqual(h.ids(),['exact','meaning','prefix','mention']);
  h.context.S.lang='fr';
  assert.deepEqual(h.ids(),['exact','meaning','prefix','mention']);
});

test('les frontières entre mot et traduction ne créent pas une correspondance artificielle',()=>{
  const h=searchHarness();
  h.context.WORDS=[{id:'separate',aln8ba:'Foo',fr:'Bar',en:'Baz',source:'Revu dans le projet'}];
  h.context.markWordsChanged();
  for(const query of ['foo bar','bar baz']){
    h.context.S.q=query;
    assert.deepEqual(h.ids(),[]);
  }
  h.context.S.q='bar';
  assert.deepEqual(h.ids(),['separate']);
});

test('une fiche mise à jour invalide aussi le texte préparé pour la recherche',()=>{
  const h=searchHarness();
  h.context.S.q='été';
  assert.deepEqual(h.ids(),['lake']);
  h.context.WORDS[0].fr='La neige';
  h.context.markWordsChanged();
  assert.deepEqual(h.ids(),[]);
  h.context.S.q='neige';
  assert.deepEqual(h.ids(),['lake']);
});

test('tous les tris tolèrent les champs absents et placent les dates récentes en premier',()=>{
  const h=searchHarness();
  for(const sort of ['alpha','alpha-fr','cat','recent']){
    h.sort.value=sort;
    assert.equal(h.ids().length,4);
  }
  assert.deepEqual(h.ids().slice(0,2),['hello','lake']);
  h.context.S.letter='N';
  assert.deepEqual(h.ids(),['walk']);
});

test('le cache distingue favoris, catégories et accès administrateur',()=>{
  const h=searchHarness();
  assert.equal(h.ids().includes('unreviewed'),false);
  h.context.adminUnlocked=true;
  assert.equal(h.ids().includes('unreviewed'),true);
  h.context.S.cat='nature';
  assert.deepEqual(h.ids().sort(),['lake','unreviewed']);
  h.context.S.cat=''; h.context.S.view='favorites';
  assert.deepEqual(h.ids(),['hello']);
});

test('une lettre choisie reste active au retour au dictionnaire et peut être retirée',()=>{
  const nodes=new Map();
  const get=id=>{if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id);};
  const letters=['K','N','W'].map(l=>element('',{l}));
  const categories=[element('',{cat:'nature'})];
  const views=['all','favorites','stats'].map(view=>element('',{view}));
  const renders=[];
  const context=vm.createContext({
    S:{view:'favorites',cat:'nature',letter:''},jCtx:null,
    document:{body:element('body'),getElementById:get,querySelectorAll:selector=>selector==='.ab'?letters:selector.includes('data-cat')?categories:views},
    cancelAnswerAdvance(){},renderWords:()=>renders.push({...context.S}),renderStats(){},catLabel:cat=>cat,
    initFC(){},renderAdmin(){},initPratique(){},aprInit(){},jeuInit(){},renderArchives(){}
  });
  vm.runInContext(sourceBetween('function setView(','function setLayout('),context);
  context.filterLetter('N');
  assert.equal(context.S.view,'all');
  assert.equal(context.S.letter,'N');
  assert.equal(context.S.cat,'');
  assert.equal(renders.at(-1).letter,'N');
  assert.equal(letters[1].classList.contains('on'),true);
  assert.equal(get('viewTitle').textContent,'Lettre N');
  context.filterLetter('N');
  assert.equal(context.S.letter,'');
  assert.ok(letters.every(node=>!node.classList.contains('on')));
  context.filterLetter('K');
  context.filterCat('nature');
  assert.equal(context.S.cat,'nature');
  assert.equal(context.S.letter,'');
  assert.equal(categories[0].classList.contains('on'),true);
  context.setView('stats');
  assert.equal(context.S.cat,'');
  assert.ok(categories.every(node=>!node.classList.contains('on')));
});

function warningHarness({seen=false,storageBlocked=false}={}){
  const warning=element('entryWarning'),accept=element('entryWarningAccept'),summary=element('sources'),search=element('searchIn');
  const header=element('header'),main=element('main'),script={tagName:'SCRIPT'};
  const storage=new Map(seen?[['aln8ba_entry_welcome_seen_session_v3','1']]:[]);
  const document={body:{children:[warning,header,main,script],classList:element().classList},activeElement:null,getElementById:id=>({entryWarning:warning,entryWarningAccept:accept,searchIn:search})[id]};
  for(const node of [summary,accept,search]){node.focus=()=>{document.activeElement=node;};node.getClientRects=()=>[{}];}
  warning.querySelectorAll=selector=>selector.includes('summary')?[summary,accept]:[accept];
  const context=vm.createContext({document,requestAnimationFrame:fn=>fn(),sessionStorage:{
    getItem:key=>{if(storageBlocked)throw new Error('Storage denied');return storage.get(key);},
    setItem:(key,value)=>{if(storageBlocked)throw new Error('Storage denied');storage.set(key,value);}
  }});
  vm.runInContext(sourceBetween('function setEntryWarningActive(','function openAbout()'),context);
  const key=(shiftKey=false)=>{
    let prevented=false;
    warning.events.keydown({key:'Tab',shiftKey,preventDefault:()=>{prevented=true;}});
    return prevented;
  };
  return {context,document,warning,accept,summary,search,header,main,script,storage,key};
}

test('l’accueil reste lisible jusqu’à acceptation et permet le clavier entre sources et entrée',async()=>{
  const h=warningHarness();
  h.context.initEntryWarning();
  await Promise.resolve();
  assert.equal(h.warning.hidden,false);
  assert.equal(h.header.inert,true);
  assert.equal(h.main.inert,true);
  assert.equal(h.script.inert,undefined);
  assert.equal(h.document.activeElement,h.accept);
  assert.equal(h.key(),true);
  assert.equal(h.document.activeElement,h.summary,'Tab doit atteindre Sources et repères.');
  assert.equal(h.key(true),true);
  assert.equal(h.document.activeElement,h.accept,'Maj+Tab doit revenir à Entrer.');
  assert.equal(h.key(true),false,'Depuis Entrer, le navigateur peut rejoindre naturellement Sources.');
  assert.equal(h.storage.size,0);
  h.context.acceptEntryWarning();
  assert.equal(h.warning.hidden,true);
  assert.equal(h.header.inert,false);
  assert.equal(h.main.inert,false);
  assert.equal(h.document.activeElement,h.search);
  assert.equal(h.storage.get('aln8ba_entry_welcome_seen_session_v3'),'1');
});

test('l’accueil respecte la session et reste utilisable si le stockage est indisponible',()=>{
  const returning=warningHarness({seen:true});
  returning.context.initEntryWarning();
  assert.equal(returning.warning.hidden,true);
  assert.equal(returning.main.inert,false);
  const restricted=warningHarness({storageBlocked:true});
  restricted.context.initEntryWarning();
  assert.equal(restricted.warning.hidden,false);
  restricted.context.acceptEntryWarning();
  assert.equal(restricted.warning.hidden,true);
  assert.equal(restricted.document.activeElement,restricted.search);
});

function releaseHarness(){
  const notice=element('releaseNotice'); notice.hidden=true;
  const replaced=[],removed=[],requests=[];
  let etag='version-one';
  const context=vm.createContext({
    URL,AbortSignal,APP_RELEASE_KEY:'release',PUBLIC_WORDS_CACHE_KEY:'words',
    location:{href:'https://example.invalid/dictionary/?mode=learn#step',origin:'https://example.invalid',replace:url=>replaced.push(url)},
    document:{hidden:false,baseURI:'https://example.invalid/dictionary/',getElementById:id=>id==='releaseNotice'?notice:null,addEventListener(){}},
    window:{addEventListener(){}},setInterval(){},console:{warn(){}},
    localStorage:{getItem:()=>'old-session',setItem(){},removeItem:key=>removed.push(key)},
    fetch:async(url,options)=>{requests.push({url:String(url),options});return {ok:true,headers:{get:key=>key==='etag'?etag:null}};}
  });
  vm.runInContext(sourceBetween('let releaseCheckBusy=false;','// ── SUPABASE ──'),context);
  return {context,notice,replaced,removed,requests,setVersion:value=>{etag=value;}};
}

test('une nouvelle version est proposée sans interrompre la visite et s’applique au clic',async()=>{
  const h=releaseHarness();
  h.context.applyPublishedRelease();
  assert.equal(h.replaced.length,0);
  await h.context.checkPublishedRelease();
  assert.equal(h.notice.hidden,true);
  assert.equal(h.replaced.length,0);
  h.setVersion('version-two');
  await h.context.checkPublishedRelease();
  assert.equal(h.notice.hidden,false);
  assert.equal(h.replaced.length,0);
  assert.equal(h.removed.length,0);
  h.context.applyPublishedRelease();
  assert.equal(h.replaced.length,1);
  const destination=new URL(h.replaced[0]);
  assert.ok(destination.searchParams.get('v'));
  assert.equal(destination.searchParams.get('mode'),'learn');
  assert.equal(destination.hash,'#step');
});

test('une vérification de version inactive ou échouée ne recharge pas la page',async()=>{
  const h=releaseHarness();
  h.context.document.hidden=true;
  await h.context.checkPublishedRelease();
  assert.equal(h.requests.length,0);
  h.context.document.hidden=false;
  h.context.fetch=async()=>{throw new Error('Offline');};
  await h.context.checkPublishedRelease();
  h.context.applyPublishedRelease();
  assert.equal(h.replaced.length,0);
  assert.equal(h.notice.hidden,true);
});

test('les commandes publiques répondent pendant que la connexion admin et les mots chargent',async()=>{
  const auth=deferred(),words=deferred(),events=[];
  const nodes=new Map();
  const get=id=>{if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id);};
  const langs=['aln8ba','fr','en'].map(l=>element('',{l}));
  const listeners={};
  const context=vm.createContext({
    S:{view:'all',q:'',lang:'aln8ba'},WORDS:[],WORDS_REMOTE_READY:false,WORDS_LOAD_STATE:'loading',adminUnlocked:false,WORD_SEARCH_TIMER:0,SK:{theme:'theme'},
    document:{documentElement:element('html'),getElementById:get,querySelector:()=>get('header'),querySelectorAll:selector=>selector==='.ltog button'?langs:[],addEventListener:(event,fn)=>{listeners[event]=fn;}},
    initEntryWarning:()=>events.push('warning'),initMusicPlayers(){},getComputedStyle:()=>({position:'sticky'}),
    loadCachedPublicWords:()=>[],restoreAdminSession:()=>{events.push('auth-start');return auth.promise;},loadWords:()=>{events.push('words-start');return words.promise;},
    markWordsChanged:()=>events.push('changed'),updateCounts:()=>events.push('counts'),renderWords:()=>events.push('render'),scheduleWordRender:()=>events.push('search-render'),
    scheduleIdleWork(){},refreshPracticeCoverage(){},setView:view=>{context.S.view=view;},
    localStorage:{getItem:()=>null,setItem(){}},clearTimeout(){},console:{warn(){}},closeModal(){}
  });
  vm.runInContext(sourceBetween('function settlePublicWords(','function saveWords(')+sourceBetween("document.addEventListener('DOMContentLoaded', ()=>{",'// ===== TRADUCTEUR IA ====='),context);
  const result=listeners.DOMContentLoaded();
  assert.equal(result,undefined,'Le branchement des commandes ne doit pas attendre les promesses.');
  assert.ok(events.includes('auth-start')&&events.includes('words-start'));
  assert.equal(typeof get('searchIn').events.input,'function');
  assert.equal(typeof get('searchX').events.click,'function');
  assert.equal(typeof get('ltog').events.click,'function');
  assert.equal(typeof get('themeBtn').events.click,'function');
  get('searchIn').value='été'; get('searchIn').events.input();
  assert.equal(context.S.q,'été');
  assert.ok(events.includes('search-render'));
  get('ltog').events.click({target:langs[1]});
  assert.equal(context.S.lang,'fr');
  assert.equal(langs[1].getAttribute('aria-pressed'),'true');
  get('searchX').events.click();
  assert.equal(context.S.q,'');
  words.resolve([entries[0]]);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(context.WORDS_REMOTE_READY,true,'Les mots doivent paraître même si la connexion admin est encore suspendue.');
  assert.equal(context.WORDS[0].id,'lake');
  auth.resolve(false);
});
