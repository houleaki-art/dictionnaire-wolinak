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

test('la confiance porte sur une structure et non sur le nombre de mots', () => {
  const source = sourceBetween('const TRANSLATION_CONFIDENCE', 'function tradEssayer');
  assert.match(source, /objectClass:\{score:85/);
  assert.match(source, /fragments:\{score:35/);
  assert.match(source, /passagesCoverAll&&hasClassConstruction/);
  assert.match(source, /confidence\.score>=80/);
});

test('une construction moderne copiable exclut les trous et les formes consultatives', () => {
  const source = sourceBetween('const confidenceUsable', 'const lnk');
  assert.match(source, /!previewHasGaps/);
  assert.match(source, /!hasConsultative/);
  assert.match(source, /passagesCoverAll&&confidenceUsable\?continuousProposal/);
});

test('le visiteur voit le statut contemporain sans confusion avec une citation', () => {
  const source = sourceBetween('const confidenceExplanation', '// Détail morceau par morceau');
  assert.match(source, /CONSTRUCTION CONTEMPORAINE/);
  assert.match(source, /non une citation ancienne/);
  assert.match(source, /SOUS LE SEUIL DE 80 %/);
});

test('un résultat partiel reste compact et replie son analyse technique', () => {
  const source = sourceBetween('const partialOutput', 'function tradEssayer');
  assert.match(source, /Traduction complète non disponible/);
  assert.match(source, /<details class="trad-details">/);
  assert.match(source, /Voir l’analyse grammaticale et les mots reconnus/);
  assert.match(source, /!partialOutput&&continuousProposal/);
});

test('les intentions fréquentes proposent seulement des phrases proches documentées', () => {
  const source = sourceBetween('const DOCUMENTED_INTENT_ALTERNATIVES', 'const DOCUMENTED_OBJECT_CLASS_PAIRS');
  assert.match(source, /id:'venir-te-voir'[\s\S]*aln8ba:'Paakuin8gwzian',consultative:true/);
  assert.match(source, /id:'vouloir-danser'[\s\S]*aln8ba:"N'pemeg8",consultative:true/);
  assert.match(source, /Elle ne traduit pas l'intention future/);
  assert.match(source, /Elle ne traduit ni « je veux » ni « au pow-wow »/);
});

test('une explication étymologique ne devient jamais un sens lexical', () => {
  const match = html.match(/function tradFrenchSenses\(value\)\{[\s\S]*?\r?\n\}/);
  assert.ok(match, 'fonction de séparation des sens introuvable');
  const splitSenses = Function(`return (${match[0]});`)();

  assert.deepEqual(
    splitSenses('Mai — on travaille la terre (de kik, la terre)'),
    ['Mai']
  );
  assert.deepEqual(
    splitSenses('Tu mets des efforts / Tu travailles'),
    ['Tu mets des efforts', 'Tu travailles']
  );
});

test('travaillé sans personne présente la famille documentée sans choisir Kikas', () => {
  const family = sourceBetween('const DOCUMENTED_VERB_FAMILY_GUIDES', 'const DOCUMENTED_NEGATION_PARADIGMS');
  assert.match(family, /title:'Famille documentée du travail'/);
  assert.match(family, /aln8ba:"Nd'aloka",fr:'je travaille'/);
  assert.match(family, /aln8ba:"K'milaloka",fr:'tu travailles/);
  assert.match(family, /aln8ba:"K'milaloka kizi",fr:'tu as déjà beaucoup travaillé/);
  assert.match(family, /Kikas ne traduit jamais le verbe « travailler »/);

  const translator = sourceBetween('function traduire', 'function tradEssayer');
  assert.ok(
    translator.indexOf("DOCUMENTED_VERB_FAMILY_GUIDES.find") < translator.indexOf('// 1) expression'),
    'la famille verbale doit bloquer le repli lexical avant tout faux appariement'
  );
  assert.match(translator, /Aucune forme n’est sélectionnée automatiquement/);
});

test('un mot intérieur de définition ne devient pas un faux synonyme', () => {
  const indexSource = sourceBetween('// Index 1 : premier token du sens', '// Lemmes :');
  assert.match(indexSource, /if\(toks\.length===1\) toks\.forEach/);
  assert.match(indexSource, /« fort » un faux[\s\S]*synonyme d'Akwbi/);
});

test('tu travailles fort utilise la forme complète documentée', () => {
  const sentences = sourceBetween('const DOCUMENTED_SENTENCES', 'const DOCUMENTED_SENTENCE_ALIASES');
  assert.match(sentences, /fr:\['Tu travailles','Tu travailles fort','Tu mets des efforts'\],aln8ba:"K'milaloka"/);
  assert.match(sentences, /« Fort » n'est pas traduit séparément/);
  assert.match(sentences, /fr:\['Tu as déjà beaucoup travaillé','Tu travailles tellement'\],aln8ba:"K'milaloka kizi"/);
  assert.match(html, /APP_RESET_VERSION = '2026-08-27-color-hunt-009'/);
});

test('un mot français connu est protégé contre une correction verbale hasardeuse', () => {
  const translator = sourceBetween('function traduire', 'function tradEssayer');
  assert.match(translator, /const lexicalChoiceIdx=new Map\(\)/);
  assert.match(translator, /WORDS\.filter\(w=>w\.fr&&w\.aln8ba[\s\S]*isConfirmed\(w\)/);
  assert.match(translator, /type:'lexchoices'/);
  assert.ok(
    translator.indexOf('const exactLexChoices') < translator.indexOf('const verbGuess'),
    'les sens du dictionnaire doivent gagner avant une correction vers un autre verbe français'
  );
  assert.match(translator, /Mot connu · contexte grammatical requis/);
  assert.match(translator, /Aucune forme n’est sélectionnée automatiquement/);
});
