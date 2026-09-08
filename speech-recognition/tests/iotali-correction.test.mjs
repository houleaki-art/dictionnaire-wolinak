import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8').replace(/\r\n/g,'\n');
function block(start,end){
  const from=html.indexOf(start),to=html.indexOf(end,from);
  assert.ok(from>=0&&to>from,`Bloc introuvable : ${start}`);
  return html.slice(from,to);
}
function harness(){
  const context=vm.createContext({});
  vm.runInContext(block('const NDAABA_CURRENT_USAGE=', 'function parseWordList('),context);
  vm.runInContext(block('let WORD_LEVEL_CACHE=new WeakMap();',"// ── Ordre d'affichage"),context);
  return context;
}

test('Iotali remplace la fiche erronée sans perdre son identifiant ni inventer sa prononciation',()=>{
  const ctx=harness();
  const original={id:'mst287',aln8ba:'Yudali',fr:'Ici',en:'Here',cat:'grammaire',phonetic:'yu-da-li',source:'Masta 1932 · confirmé',notes:'Ancienne attribution',related:['Yudali'],corrections:[]};
  const [word]=ctx.applyCurrentUsageOverrides([original]);
  assert.equal(word.id,original.id);
  assert.equal(word.aln8ba,'Iotali');
  assert.equal(word.fr,'Ici');
  assert.equal(word.phonetic,'');
  assert.doesNotMatch(word.source,/Masta|1932/);
  assert.doesNotMatch(word.notes,/Ancienne attribution/);
  assert.equal(ctx.isExerciseSafe(word),true);
  assert.equal(original.aln8ba,'Yudali','La donnée source reçue reste intacte.');
  assert.equal(JSON.stringify(ctx.applyCurrentUsageOverrides([word])),JSON.stringify([word]));
  assert.equal('replaceNotes' in word,false);
});

test('une ancienne copie ou une autre casse rejoint Iotali et les liens vont vers le mot actuel',()=>{
  const ctx=harness();
  const result=ctx.applyCurrentUsageOverrides([
    {id:'old-copy',aln8ba:'YUDALI',related:[]},
    {id:'link',aln8ba:'Askwa',related:['Yudali','Iotali']},
  ]);
  assert.equal(result[0].aln8ba,'Iotali');
  assert.deepEqual(Array.from(result[1].related),['Iotali']);
});

test('une phrase assemblée reste une archive non citée, jamais une nouvelle phrase reconstruite',()=>{
  const ctx=harness();
  const [word]=ctx.applyCurrentUsageOverrides([{id:'lau_yudali_als',aln8ba:'Yudali Alsig8ntegok',cat:'archive',source:'Laurent 1884',related:['Yudali']}]);
  assert.equal(word.aln8ba,'Yudali Alsig8ntegok');
  assert.equal(word.cat,'archive');
  assert.match(word.source,/assemblage interne/);
  assert.equal(ctx.isExerciseSafe(word),false);
  assert.deepEqual(Array.from(word.related),['Iotali']);
});

test('u dans une graphie à revoir empêche les exercices automatiques sans changer le mot',()=>{
  const ctx=harness();
  for(const aln8ba of ['Yugik','Yugalta','Mkuigen','Wkeskouan']){
    const word={id:aln8ba,aln8ba,fr:'Sens consigné',cat:'grammaire',source:'Revu dans le projet'};
    assert.equal(ctx.needsOrthographyReview(word),true);
    assert.equal(ctx.getWordLevel(word),'orange');
    assert.equal(ctx.isExerciseSafe(word),false);
    assert.match(ctx.levelBadge(word),/graphie à revoir/);
    assert.equal(word.aln8ba,aln8ba);
  }
});

test('le contrôle vise les mots, y compris noms propres, mais pas les guides ni les titres français',()=>{
  const ctx=harness();
  assert.equal(ctx.needsOrthographyReview({aln8ba:'Iotali',phonetic:'guide français avec ou'}),false);
  assert.equal(ctx.needsOrthographyReview({id:'s84',aln8ba:'Ouabmaska',cat:'toponymie'}),true);
  assert.equal(ctx.needsOrthographyReview({aln8ba:'Aimuk',cat:'archive'}),false);
  assert.equal(ctx.needsOrthographyReview({aln8ba:'RACINE · mkw- / makw- (le rouge)',cat:'grammaire'}),false);
});

test('les fiches avec u quittent la vue courante sans destruction ni remplacement inventé',()=>{
  const ctx=harness();
  const input=[
    {id:'mst236',aln8ba:'Yugik',fr:'Ceux-ci',cat:'grammaire',source:'Source initiale',notes:'Note initiale'},
    {id:'s84',aln8ba:'Ouabmaska',fr:'Lieu',cat:'toponymie',source:'Source initiale'},
    {id:'clean',aln8ba:'Iotali',cat:'grammaire',phonetic:'guide avec ou'},
    {id:'technical',aln8ba:'RACINE · mkw- (le rouge)',cat:'grammaire'},
  ];
  const output=ctx.applyCurrentUsageOverrides(input);
  assert.equal(output[0].cat,'archive');
  assert.equal(output[0].aln8ba,'Yugik');
  assert.equal(output[0].source,'Source initiale');
  assert.match(output[0].notes,/Note initiale/);
  assert.equal(output[1].cat,'archive');
  assert.equal(output[1].aln8ba,'Ouabmaska');
  assert.equal(output[2].cat,'grammaire');
  assert.equal(output[3].cat,'grammaire');
  assert.equal(input[0].cat,'grammaire');
  assert.equal(JSON.stringify(ctx.applyCurrentUsageOverrides(output)),JSON.stringify(output));
});

test('Mkwigen reste la seule fiche actuelle du mot et les liens abandonnent le doublon erroné',()=>{
  const ctx=harness();
  const result=ctx.applyCurrentUsageOverrides([
    {id:'lsn025',aln8ba:'Mkuigen',fr:'C’est rouge',cat:'couleur'},
    {id:'mn2_048',aln8ba:'Mkwigen',fr:'Rouge (c’est rouge)',cat:'couleur',source:'Manuel de l’étudiant 1 · Bomsawin'},
    {id:'link',aln8ba:'Mkwi',cat:'couleur',related:['Mkuigen','Mkwigen']},
  ]);
  assert.equal(result[0].cat,'archive');
  assert.match(result[0].notes,/Mkwigen/);
  assert.equal(result[1].id,'mn2_048');
  assert.equal(result[1].cat,'couleur');
  assert.equal(result[1].aln8ba,'Mkwigen');
  assert.deepEqual(Array.from(result[2].related),['Mkwigen','Mkwigo','Mkwigoak']);
});

test('un exemple aln8ba non corrigé est retiré sans toucher à la graphie du mot ou à sa prononciation',()=>{
  const ctx=harness();
  const original={id:'example',aln8ba:'Kwai',cat:'salut',fr:'Bonjour',phonetic:'prononciation avec ou',example_a:'Yudali',example_f:'Ici'};
  const [word]=ctx.applyCurrentUsageOverrides([original]);
  assert.equal(word.example_a,'');
  assert.equal(word.example_f,'');
  assert.equal(word.aln8ba,'Kwai');
  assert.equal(word.phonetic,original.phonetic);
  assert.equal(original.example_a,'Yudali');
});

test('les cartes excluent les graphies retirées et une liste vide ne devient jamais tout le dictionnaire',()=>{
  const ctx=harness();
  ctx.WORDS=[{aln8ba:'Iotali',cat:'grammaire'},{aln8ba:'Yugik',cat:'grammaire'},{aln8ba:'Mkuigen',cat:'archive'}];
  ctx.S={};ctx.document={getElementById:()=>null};ctx.showFC=()=>{};
  vm.runInContext(block('function initFC(', '/* Isole les mots réellement'),ctx);
  ctx.initFC();
  assert.deepEqual(Array.from(ctx.S.fcWords,w=>w.aln8ba),['Iotali']);
  ctx.initFC([]);
  assert.equal(ctx.S.fcWords.length,0);
  ctx.initFC([{aln8ba:'Yugik',cat:'grammaire'}]);
  assert.equal(ctx.S.fcWords.length,0);
});

test('le décortiqueur ne fabrique pas une analyse actuelle de graphie contenant u',()=>{
  const ctx=harness();
  const output={};ctx.document={getElementById:()=>output};
  vm.runInContext(block('function aprDecor(mot)', 'const APR_CONJ_PARADIGMS='),ctx);
  ctx.aprDecor('Mkuigen');
  assert.match(output.innerHTML,/retirée des modèles actuels/);
  assert.doesNotMatch(output.innerHTML,/racine|suffixe/);
});

test('les exemples actifs et le quiz utilisent Iotali, les paroles anciennes restent explicitement archivées',()=>{
  const lesson=block('{t:"Traduire sans découper le français"', '{id:\'c\',t:"Base d\'analyse"');
  const quiz=block('const EXSTRUCT=[', 'function exStructure(');
  assert.match(lesson,/>Iotali</);
  assert.doesNotMatch(lesson,/Yudali/i);
  assert.match(quiz,/Iotali/);
  assert.doesNotMatch(quiz,/Yudali/i);
  const song=block('<details class="song-lyrics" id="practiceAskwa">','<details class="song-lyrics" id="practiceAskawiholji">');
  assert.match(song,/Ancienne version, non corrigée dans l’audio/);
  assert.match(song,/>Iotali</);
});
