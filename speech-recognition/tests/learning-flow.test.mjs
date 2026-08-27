import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(here, '..', '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

function sourceBetween(start, end) {
  const from = html.indexOf(start);
  const to = html.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `bloc introuvable: ${start}`);
  return html.slice(from, to);
}

test('la reponse ecrite ignore casse, espaces, apostrophes et ponctuation', () => {
  const source = sourceBetween('function aprNorm', 'function aprSrc');
  const aprNorm = new Function(`${source}; return aprNorm;`)();
  assert.equal(aprNorm('t8ni aliwizian'), aprNorm('T8ni aliwizian?'));
  assert.equal(aprNorm("T8ni kd'aliwizian"), aprNorm('t8ni-kd’aliwizian!'));
  assert.notEqual(aprNorm("T8ni kd'aliwizian"), aprNorm('T8ni aliwizian?'));
  assert.notEqual(aprNorm('t8ni aliwizian'), aprNorm('toni aliwizian'));
  assert.match(html, /Le <b>8 est une lettre importante<\/b> et doit être écrit/);
});

test('une bonne reponse avance seule et une erreur garde le bouton', () => {
  const source = sourceBetween('function finishAnsweredStep', '// ── NIVEAU 1');
  assert.match(source, /if\(!correct\)\{scrollToNextAction\(scopeSelector\);return;\}/);
  assert.match(source, /Question suivante automatiquement/);
  assert.match(source, /setTimeout/);
  assert.match(html, /finishAnsweredStep\(correct,'#pratArena',nextQ\)/);
  assert.match(html, /finishAnsweredStep\(correct,'#exBody',exSuivant\)/);
  assert.match(html, /finishAnsweredStep\(correct,'#jBody',jNext\)/);
});

test('le defilement reserve la hauteur du lecteur musical', () => {
  const source = sourceBetween('function fixedBottomInset', 'let answerAdvanceTimer');
  assert.match(source, /musicDock/);
  assert.match(source, /fixedBottomInset\(\)/);
  assert.match(source, /viewportBottom/);
});

test('une prise locale validee passe avant la synthese et affiche sa couverture', () => {
  const playback = sourceBetween('async function playApprovedWordAudio', 'async function corpusDbGet');
  const voice = sourceBetween('async function voiceListenCurrent', 'function voiceResetMic');
  assert.ok(playback.indexOf('corpusLatestRecordForWord') < playback.indexOf('word.audio'));
  assert.match(voice, /playApprovedWordAudio/);
  assert.match(html, /mots enregistrés/);
});

test('la deuxieme personne interrogative est enseignee sans regle inventee', () => {
  assert.match(html, /La deuxième personne interrogative/);
  assert.match(html, /forme en <b>-an<\/b>/);
  assert.match(html, /préfixe <b>kd'-<\/b> conservé/);
  assert.match(html, /ex:'inter2'/);
  assert.match(html, /inter2:exInter2/);
  assert.match(html, /w\.id==='man_r02'/);
  assert.match(html, /INTERROGATIVE_FORM_NOTES/);
  assert.match(html, /deuxième personne interrogative',\s*notes:/);
  const search = sourceBetween('function filtered()', "// ── Ordre d'affichage");
  assert.match(search, /w\.grammar,w\.notes/);
});

test('le quiz interrogatif utilise seulement les contrastes documentes', () => {
  const source = sourceBetween('const EXINTER2', 'function exInter2');
  const questions = new Function(`${source}; return EXINTER2;`)();
  assert.equal(questions.length, 7);
  for (const form of ['T8ni aliwizian?', 'T8ni alosan?', 'T8ni wigian?',
    "Kagwi k'michi?", "T8ni kd'al8wzin?", "K'kasigadma?"]) {
    assert.ok(questions.some(question => question.p === form), `forme absente: ${form}`);
  }
  const nameQuestion = questions.find(question => question.p === "Comment t'appelles-tu?");
  assert.equal(nameQuestion.o[nameQuestion.r], 'T8ni aliwizian?');
  assert.ok(nameQuestion.o.includes("T8ni kd'aliwizian?"));
});

test("l'ecriture explique aliwizian avant de passer a la suite", () => {
  const normSource = sourceBetween('function aprNorm', 'function aprSrc');
  const analysisSource = sourceBetween('const APR_WRITING_ANALYSES', 'const APR_PREF');
  const analyses = new Function(`${normSource}; ${analysisSource}; return APR_WRITING_ANALYSES;`)();
  const aliwizian = analyses.get('t8nialiwizian');
  assert.equal(analyses.size, 6);
  assert.equal(aliwizian.equation, 'aliwizi + -an → aliwizian');
  assert.equal(aliwizian.parts.at(-1).form, '-an');
  assert.match(aliwizian.explanation, /i \+ an donne ian/);
  assert.match(html, /Pourquoi <span class="al8">aliwizian<\/span> finit par/);
  const writing = sourceBetween('function exWritingGenericNote', '/* — révision espacée');
  assert.match(writing, /APR_WRITING_ANALYSES\.get/);
  assert.match(writing, /exWritingAnalysisAnswer/);
  assert.match(writing, /state\.writingOk&&correct/);
  assert.match(writing, /finishAnsweredStep\(ok,'#exBody',exSuivant,4500\)/);
  assert.match(writing, /Aucun découpage n'est affiché sans analyse documentée/);
});

test('les modules grammaticaux exigent une production ecrite', () => {
  for (const marker of [
    'ex:\'genre\',use:\'genre\'',
    'ex:\'plur\',use:\'plur\'',
    'ex:\'poss\',use:\'poss\'',
    'ex:\'conjp\',use:\'conjp\'',
    'ex:\'inter2\',use:\'inter2\'',
    'ex:\'negs\',use:\'neg\'',
    'ex:\'classfx\',use:\'classfx\'',
    'ex:\'vta\',use:\'vta\'',
    'ex:\'ordre\',use:\'ordre\'',
    'ex:\'suf\',use:\'suf\''
  ]) assert.ok(html.includes(marker), `phase Utiliser absente: ${marker}`);
  const mastery = sourceBetween('const APR_LEVEL_PATHS', 'const COACH_TIPS');
  assert.match(mastery, /function aprModuleNeedsUse/);
  assert.match(mastery, /state\.utiliser>=100/);
  const lesson = sourceBetween('function aprLecon', 'function aprDecorView');
  assert.match(lesson, /produis la forme/);
  assert.match(lesson, /ecrisgram/);
});

test('la production grammaticale suit une procedure documentee', () => {
  const writing = sourceBetween('function grammarWritingPool', '/* — révision espacée');
  for (const key of ['genre','plur','poss','conjp','inter2','neg','classfx','structure','vta','aimuk','ordre','suf','fam','trad']) {
    assert.match(writing, new RegExp(`key==='${key}'`), `banque absente: ${key}`);
  }
  assert.match(writing, /DOCUMENTED_NEGATION_PARADIGMS\.map/);
  assert.match(writing, /pair=>pair\.oa\.exact&&pair\.oi\.exact/);
  assert.match(writing, /APR_WRITING_ANALYSES\.get/);
  assert.match(writing, /Raisonnement complet/);
  assert.match(writing, /finishAnsweredStep\(ok,'#exBody',exSuivant,6500\)/);
});

test('le parcours affiche les prerequis dans leur ordre pedagogique', () => {
  const path = sourceBetween('const APR_LEVEL_PATHS', 'function aprModulePerfect');
  for (const phase of ['Nom et classe','Phrase affirmative','Interrogation','Négation','Structure verbale','Ordres de conjugaison','Morphologie','Production']) {
    assert.match(path, new RegExp(phase));
  }
  assert.ok(path.indexOf('Phrase affirmative') < path.indexOf('Interrogation'));
  assert.ok(path.indexOf('Interrogation') < path.indexOf('Négation'));
});

test('le module des couleurs apprend par limage sans inventer detymologie', () => {
  const colors = sourceBetween('{t:"Les couleurs"', '{t:"Décrire le monde"');
  assert.match(colors, /Six formes verbales/);
  assert.match(colors, /assets\/learning\/couleurs-territoire\.webp/);
  assert.match(colors, /Mkwigen[\s\S]*Mskikwimen/);
  assert.match(colors, /pas une preuve d'étymologie/);
  assert.match(colors, /Observe → pointe → dis → retrouve/);
  assert.doesNotMatch(colors, /Dix couleurs/);
  for (const word of ['Mkwigen','W8bigen','Mkazawigen','Wl8wigen','Wiz8wigen','Askaskwigen']) {
    assert.match(colors, new RegExp(word));
  }

  const asset = path.resolve(here, '..', '..', 'assets', 'learning', 'couleurs-territoire.webp');
  assert.ok(fs.existsSync(asset), 'image pédagogique absente');
  assert.ok(fs.statSync(asset).size < 400_000, 'image trop lourde pour le mobile');
});

test('le jeu du territoire relie observation et vocabulaire vert actuel', () => {
  const trailSource = sourceBetween('const TERRITORY_TRAIL', 'let jTrailStep');
  const trail = new Function(`${trailSource}; return TERRITORY_TRAIL;`)();
  assert.equal(trail.length, 7);
  assert.deepEqual(trail.map(stop => stop.target), [
    'Aki', 'W8linaktegw', 'Koa', 'Nolka', 'Mskikwimen', 'Skweda', 'Alakws'
  ]);
  for (const stop of trail) {
    assert.equal(stop.options.length, 4, `quatre choix requis: ${stop.id}`);
    assert.equal(new Set(stop.options).size, 4, `choix distincts requis: ${stop.id}`);
    assert.ok(stop.options.includes(stop.target), `bonne réponse absente: ${stop.id}`);
    assert.match(stop.field, /\S/);
  }
  assert.doesNotMatch(trailSource, /\b(?:Sibo|Sata|Tmakwa)\b/);

  const gameSource = sourceBetween('function jTerritoryStops', 'function jGenre');
  assert.match(gameSource, /new Map\(aprSur\(\)/);
  assert.match(gameSource, /stop\.words\.length===4/);
  assert.match(gameSource, /stops\.length!==TERRITORY_TRAIL\.length/);
  assert.match(gameSource, /Toutes les réponses proposées sont des entrées vertes actuelles/);
  assert.match(html, /p:\['territoire','sens','caches'\]/);
  assert.match(html, /s:\['territoire','genre','sens','negat','plur','caches'\]/);
  assert.match(html, /c:\['territoire','negat','fam'\]/);

  for (const file of [
    'territoire-riviere.webp',
    'territoire-pin-chevreuil.webp',
    'territoire-feu-etoiles.webp'
  ]) {
    const asset = path.resolve(here, '..', '..', 'assets', 'learning', file);
    assert.ok(fs.existsSync(asset), `image pédagogique absente: ${file}`);
    assert.ok(fs.statSync(asset).size < 300_000, `image trop lourde pour le mobile: ${file}`);
  }
});
