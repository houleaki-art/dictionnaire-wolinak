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

function practiceApi() {
  const source = sourceBetween('const PRACTICE_BEGINNER_WORDS', 'function initPratique');
  return new Function(`
    const isExerciseSafe = word => word.safe !== false;
    const DOCUMENTED_PLURALS = {
      Alakws:'Alakwsak', Awassos:'Awassosak', Awassosis:'Awassosisak',
      Koa:'Koak', Mskikwimen:'Mskikwimenak', Namasis:'Namasisak', Sata:'Satal'
    };
    const DOCUMENTED_PLURAL_FORMS = new Set(
      [...Object.keys(DOCUMENTED_PLURALS), ...Object.values(DOCUMENTED_PLURALS)]
        .map(form => form.toLowerCase())
    );
    ${source}
    return { PRACTICE_LEVELS, practicePoolForLevel, practiceHasAdvancedGrammar };
  `)();
}

function word(id, aln8ba, fr, cat, grammar = '') {
  return { id, aln8ba, fr, cat, grammar, notes: '', safe: true };
}

test('le debutant est une banque fermee sans possessif ni pluriel', () => {
  const { practicePoolForLevel } = practiceApi();
  const words = [
    word('kwai', 'Kwai', 'Bonjour', 'salut', 'Formule de conversation'),
    word('nis', 'Nis', 'Deux', 'nombre', 'Nombre cardinal'),
    word('wkeskwanal', 'Wkeskwanal', 'Ses dents', 'corps', 'Nom possédé — pluriel inanimé'),
    word('color', 'Mkwigen', "Rouge (c'est rouge)", 'couleur', 'Adjectif — forme inanimée en -igen')
  ];
  assert.deepEqual(practicePoolForLevel(1, words).map(item => item.aln8ba), ['Kwai', 'Nis']);
});

test('l intermediaire garde le vocabulaire concret sans formes complexes', () => {
  const { practicePoolForLevel } = practiceApi();
  const words = [
    word('color', 'Mkwigen', "Rouge (c'est rouge)", 'couleur', 'Adjectif — forme inanimée en -igen'),
    word('dog', 'Almos', 'Un chien', 'animal', 'Nom animé'),
    word('possessed', 'Wkeskwanal', 'Ses dents', 'corps', 'Nom possédé — pluriel inanimé'),
    { ...word('unsafe', 'Awassos', 'Ours', 'animal', 'Nom animé'), safe: false }
  ];
  assert.deepEqual(practicePoolForLevel(2, words).map(item => item.aln8ba), ['Mkwigen', 'Almos']);
});

test('l avance accepte une forme verbale complete mais pas une phrase', () => {
  const { practicePoolForLevel } = practiceApi();
  const words = [
    word('work', "Nd'aloka", 'Je travaille', 'action', 'Verbe VAI — 1re pers.'),
    word('phrase', 'Kwai mziwi', 'Bonjour tout le monde', 'salut', 'Expression')
  ];
  assert.deepEqual(practicePoolForLevel(3, words).map(item => item.aln8ba), ["Nd'aloka"]);
});

test('la charge augmente graduellement et les distracteurs restent dans la seance', () => {
  const { PRACTICE_LEVELS } = practiceApi();
  assert.deepEqual(
    Object.values(PRACTICE_LEVELS).map(level => level.total),
    [10, 12, 15, 18]
  );
  assert.match(html, /getBestDistractors\(w, 2, 'fr'\)/);
  const distractors = sourceBetween('function getBestDistractors', 'function shuffle');
  assert.match(distractors, /const base=PS\.queue\.filter/);
  assert.doesNotMatch(distractors, /:WORDS/);
});

test('l expert alterne les taches et reserve le pluriel aux paires documentees', () => {
  const queue = sourceBetween('function practiceExpertQueue', 'function initPratique');
  assert.match(queue, /DOCUMENTED_PLURALS\[w\.aln8ba\]/);
  assert.match(queue, /practiceType:'writeAln8ba'/);
  assert.match(queue, /practiceType:'translateFrench'/);
  assert.match(queue, /practiceType:'plural'/);
  const renderer = sourceBetween('function renderLvl4', 'function checkLvl4A');
  assert.match(renderer, /w\.practiceType/);
});
