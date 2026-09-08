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
const source=[
  sourceBetween('async function pushToSB(words)','function removeExactDuplicateRows'),
  sourceBetween('function saveWords(words)','// ── SUGGESTIONS DE MODIFICATION'),
  sourceBetween('async function deleteSuggestion(id)','// Cache local des pending'),
  sourceBetween('async function deletePending(id)','function loadFavs'),
  sourceBetween('let adminMutationBusy=false;','// ══════════════════════════════════════════════════════════\n//  EDIT WORD'),
  sourceBetween('async function applySuggestion(id)','function toggleAdminExp'),
  sourceBetween('async function saveEdit()','// ══════════════════════════════════════════════════════════\n//  ADD WORD FORM'),
  sourceBetween('function importJSON(e)','// ══════════════════════════════════════════════════════════\n//  ALPHA GRID + COUNTS')
].join('\n');

function response(status=200,body=[]){
  return {ok:status>=200&&status<300,status,json:async()=>body,text:async()=>JSON.stringify(body)};
}
function deferred(){
  let resolve;
  const promise=new Promise(done=>{resolve=done;});
  return {promise,resolve};
}
const word={id:'w1',aln8ba:'Test',fr:'Ancienne traduction',cat:'nature',source:'À examiner',corrections:[]};
const pending={id:'p1',aln8ba:'Proposition',fr:'À examiner',status:'pending',audio:'private-review-only',contributor:'Anonyme'};
const suggestion={id:'s1',word_id:'w1',field:'fr',current_value:word.fr,suggested_value:'Nouvelle traduction'};
function harness({words=[word],pendingWords=[pending],suggestions=[suggestion],fetchResult=()=>response()}={}){
  const calls=[],messages=[],closed=[],events=[];
  const controls=[{disabled:false},{disabled:true}];
  const fields={};
  for(const [id,value] of Object.entries({id:'w1',aln8ba:'Test',fr:'Nouvelle traduction',cat:'nature',source:'À examiner',phonetic:'',en:'',gram:'',exA:'',exF:'',notes:'',related:'',corrNote:'Révision'}))fields['e-'+id]={value};
  let reader;
  const context=vm.createContext({
    WORDS:structuredClone(words),PENDING_CACHE:structuredClone(pendingWords),SUGGESTIONS_CACHE:structuredClone(suggestions),
    adminUnlocked:true,SB_URL:'https://mock.invalid',SB_HEADERS:{},S:{view:'admin'},
    console:{warn(){}},
    fetch:async(url,options)=>{
      assert.ok(url.startsWith('https://mock.invalid/'),'Les tests ne doivent jamais atteindre la vraie base.');
      const call={url,method:options.method,body:options.body?JSON.parse(options.body):null,headers:options.headers};
      calls.push(call);
      return fetchResult(call,calls.length);
    },
    document:{querySelectorAll:()=>controls,getElementById:id=>fields[id]},
    toast:message=>messages.push(message),closeModal:id=>closed.push(id),confirm:()=>true,
    sanitizePlain:value=>String(value).replace(/<[^>]*>/g,'').trim(),
    projectReviewedSource:value=>'Retenu : '+value,
    markWordsChanged:()=>events.push('changed'),renderWords:()=>events.push('render'),updateCounts:()=>events.push('counts'),
    renderAdmin:async()=>events.push('admin'),updateAdminBadge:()=>events.push('badge'),
    FileReader:class{
      constructor(){reader=this;}
      readAsText(file){this.done=this.onload({target:{result:file.text}});}
    }
  });
  vm.runInContext(source,context);
  return {context,calls,messages,closed,events,controls,fields,import:async data=>{
    context.importJSON({target:{files:[{text:JSON.stringify(data)}],value:'backup.json'}});
    return reader.done;
  }};
}

test('une publication refusée conserve la proposition et ne modifie pas le dictionnaire',async()=>{
  const h=harness({fetchResult:()=>response(403)});
  assert.equal(await h.context.approvePending('p1'),false);
  assert.equal(h.context.WORDS.length,1);
  assert.equal(h.context.PENDING_CACHE.length,1);
  assert.deepEqual(h.calls.map(c=>c.method),['POST']);
  assert.equal(h.events.length,0);
  assert.ok(h.messages.every(m=>!m.includes('✅')));
  assert.deepEqual(h.controls.map(c=>c.disabled),[false,true]);
});

test('une approbation attend son enregistrement et bloque les clics concurrents',async()=>{
  const post=deferred();
  const h=harness({fetchResult:call=>call.method==='POST'?post.promise:response(200,[{id:'p1'}])});
  const saving=h.context.approvePending('p1');
  assert.equal(h.context.WORDS.length,1);
  assert.equal(h.controls[0].disabled,true);
  assert.equal(await h.context.approvePending('p1'),false);
  assert.equal(await h.context.rejectPending('p1'),false);
  assert.equal(h.calls.length,1);
  post.resolve(response(201));
  assert.equal(await saving,true);
  assert.deepEqual(h.calls.map(c=>c.method),['POST','DELETE']);
  assert.equal(h.context.PENDING_CACHE.length,0);
  assert.equal(h.context.WORDS.length,2);
  assert.equal(h.context.WORDS[1].audio,undefined);
  assert.equal(h.context.WORDS[1].contributor,undefined);
  assert.deepEqual(h.controls.map(c=>c.disabled),[false,true]);
});

test('un nettoyage refusé peut être repris sans publier deux fiches',async()=>{
  let allowDelete=false;
  const h=harness({fetchResult:call=>call.method==='POST'?response(201):response(allowDelete?200:403,[{id:'p1'}])});
  assert.equal(await h.context.approvePending('p1'),false);
  assert.equal(h.context.WORDS.length,2);
  assert.equal(h.context.PENDING_CACHE.length,1);
  allowDelete=true;
  assert.equal(await h.context.approvePending('p1'),true);
  assert.equal(h.context.WORDS.length,2);
  assert.equal(h.calls.filter(c=>c.method==='POST').length,1);
  assert.equal(h.context.PENDING_CACHE.length,0);
});

test('une réponse réseau perdue conserve un identifiant de publication stable à la reprise',async()=>{
  const saved=[];
  const h=harness({fetchResult:call=>{
    if(call.method==='POST'){
      saved.push(call.body[0].id);
      if(saved.length===1) throw new Error('Connexion interrompue après enregistrement');
      return response(201);
    }
    return response(200,[{id:'p1'}]);
  }});
  assert.equal(await h.context.approvePending('p1'),false);
  assert.equal(await h.context.approvePending('p1'),true);
  assert.equal(saved[0],saved[1]);
  assert.equal(h.context.WORDS.length,2);
});

test('une correction refusée conserve le mot et la suggestion sans ajouter un historique',async()=>{
  const h=harness({fetchResult:()=>response(500)});
  assert.equal(await h.context.applySuggestion('s1'),false);
  assert.equal(h.context.WORDS[0].fr,word.fr);
  assert.equal(h.context.WORDS[0].corrections.length,0);
  assert.equal(h.context.SUGGESTIONS_CACHE.length,1);
  assert.deepEqual(h.calls.map(c=>c.method),['POST']);
});

test('reprendre une correction déjà enregistrée ne duplique pas son historique',async()=>{
  let allowDelete=false;
  const h=harness({fetchResult:call=>call.method==='POST'?response(201):response(allowDelete?200:500,[{id:'s1'}])});
  assert.equal(await h.context.applySuggestion('s1'),false);
  assert.equal(h.context.WORDS[0].fr,suggestion.suggested_value);
  assert.equal(h.context.WORDS[0].corrections.length,1);
  allowDelete=true;
  assert.equal(await h.context.applySuggestion('s1'),true);
  assert.equal(h.context.WORDS[0].corrections.length,1);
  assert.equal(h.calls.filter(c=>c.method==='POST').length,1);
  assert.equal(h.context.SUGGESTIONS_CACHE.length,0);
});

test('une suggestion ancienne ou visant un champ interdit ne remplace pas une fiche',async()=>{
  for(const changed of [{...suggestion,current_value:'Encore plus ancien'},{...suggestion,field:'id'}]){
    const h=harness({suggestions:[changed]});
    assert.equal(await h.context.applySuggestion('s1'),false);
    assert.equal(h.calls.length,0);
    assert.equal(h.context.WORDS[0].id,'w1');
    assert.equal(h.context.WORDS[0].fr,word.fr);
    assert.equal(h.context.SUGGESTIONS_CACHE.length,1);
  }
});

test('une édition conserve la fiche et le formulaire en cas de refus puis réussit à la reprise',async()=>{
  let accepted=false;
  const h=harness({fetchResult:()=>response(accepted?201:403)});
  assert.equal(await h.context.saveEdit(),false);
  assert.equal(h.context.WORDS[0].fr,word.fr);
  assert.equal(h.context.WORDS[0].corrections.length,0);
  assert.equal(h.closed.length,0);
  assert.equal(h.fields['e-fr'].value,'Nouvelle traduction');
  accepted=true;
  assert.equal(await h.context.saveEdit(),true);
  assert.equal(h.context.WORDS[0].fr,'Nouvelle traduction');
  assert.equal(h.context.WORDS[0].corrections.length,1);
  assert.deepEqual(h.closed,['editModal']);
});

test('une suppression doit confirmer la bonne ligne avant de retirer le mot de la vue',async()=>{
  for(const result of [response(403),response(200,[]),response(200,[{id:'autre'}])]){
    const h=harness({fetchResult:()=>result});
    assert.equal(await h.context.deleteWord('w1'),false);
    assert.equal(h.context.WORDS.length,1);
    assert.equal(h.closed.length,0);
    assert.equal(h.events.length,0);
  }
  const h=harness({fetchResult:()=>response(200,[{id:'w1'}])});
  assert.equal(await h.context.deleteWord('w1'),true);
  assert.equal(h.context.WORDS.length,0);
});

test('le rejet conserve les files si la suppression ne confirme aucune ligne',async()=>{
  const h=harness({fetchResult:()=>response(200,[])});
  assert.equal(await h.context.rejectPending('p1'),false);
  assert.equal(await h.context.rejectSuggestion('s1'),false);
  assert.equal(h.context.PENDING_CACHE.length,1);
  assert.equal(h.context.SUGGESTIONS_CACHE.length,1);
});

test('un changement de statut refusé ne rend pas un mot retenu en mémoire',async()=>{
  const h=harness({fetchResult:()=>response(403)});
  assert.equal(await h.context.confirmWord('w1'),false);
  assert.equal(h.context.WORDS[0].source,word.source);
  assert.equal(h.events.length,0);
});

test('la synchronisation s’arrête au premier lot refusé et annonce le nombre réellement enregistré',async()=>{
  const h=harness({words:Array.from({length:120},(_,i)=>({...word,id:'w'+i})),fetchResult:(call,number)=>response(number===1?201:503)});
  assert.equal(await h.context.syncAllToSupabase(),false);
  assert.equal(h.calls.length,2);
  assert.match(h.messages.at(-1),/50 fiches enregistrées/);
  assert.doesNotMatch(h.messages.at(-1),/✅/);
});

test('l’importation conserve les mots existants et ne fusionne qu’après confirmation du serveur',async()=>{
  let accepted=false;
  const h=harness({fetchResult:()=>response(accepted?201:500)});
  const imported={id:'w2',aln8ba:'Autre',fr:'Autre traduction'};
  assert.equal(await h.import({words:[imported]}),false);
  assert.equal(h.context.WORDS.length,1);
  accepted=true;
  assert.equal(await h.import({words:[imported]}),true);
  assert.equal(h.context.WORDS.length,2);
  assert.equal(h.context.WORDS[0].id,'w1');
  assert.equal(h.context.WORDS[1].id,'w2');
  assert.ok(h.calls.every(c=>c.method==='POST'));
});

test('un fichier invalide ou aux identifiants ambigus ne déclenche aucune écriture',async()=>{
  const h=harness();
  for(const words of [[],[null],[{id:'w2'}],[word,word]]){
    assert.equal(await h.import({words}),false);
  }
  assert.equal(h.calls.length,0);
});

test('les mutations administrateur ne démarrent pas sans session ouverte',async()=>{
  const h=harness();
  h.context.adminUnlocked=false;
  assert.equal(await h.context.approvePending('p1'),false);
  assert.equal(await h.context.saveEdit(),false);
  assert.equal(await h.context.deleteWord('w1'),false);
  assert.equal(h.calls.length,0);
});
