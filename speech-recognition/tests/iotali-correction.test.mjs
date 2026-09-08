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

test('le contrôle ne confond pas guide phonétique, nom de lieu et graphie lexicale',()=>{
  const ctx=harness();
  assert.equal(ctx.needsOrthographyReview({aln8ba:'Iotali',phonetic:'guide français avec ou'}),false);
  assert.equal(ctx.needsOrthographyReview({id:'s84',aln8ba:'Ouabmaska',cat:'territoire'}),false);
  assert.equal(ctx.needsOrthographyReview({aln8ba:'Nom du lieu',cat:'toponymie'}),false);
  assert.equal(ctx.needsOrthographyReview({aln8ba:'Aimuk',cat:'archive'}),false);
  assert.equal(ctx.needsOrthographyReview({aln8ba:'RACINE · mkw- / makw- (le rouge)',cat:'grammaire'}),false);
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
