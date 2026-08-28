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
  const source = sourceBetween('const PRACTICE_LEVELS', 'function initPratique');
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
    const catLabel = category => ({ nature:'Nature / Ciel', temps:'Temps' }[category] || category || '');
    const shuffle = items => [...items];
    ${source}
    return {
      PRACTICE_LEVELS, practiceConfirmedEntries, practicePoolsByLevel, practicePoolForLevel,
      practiceLevelForWord, practiceHasAdvancedGrammar, practiceMeaningHint, practiceMeaningNote,
      practiceRotationSlice, practiceExpertQueue, practiceFormClass
    };
  `)();
}

function word(id, aln8ba, fr, cat, grammar = '') {
  return { id, aln8ba, fr, cat, grammar, notes: '', safe: true };
}

test('les cinq niveaux ont une seance cible de 50 questions', () => {
  const { PRACTICE_LEVELS } = practiceApi();
  assert.deepEqual(Object.values(PRACTICE_LEVELS).map(level => level.total), [50, 50, 50, 50, 50]);
  assert.equal((html.match(/class="plvl lvl-/g) || []).length, 5);
});

test('chaque forme verte praticable appartient a un seul niveau', () => {
  const { practiceConfirmedEntries, practicePoolsByLevel } = practiceApi();
  const words = [
    word('hello', 'Kwai', 'Bonjour', 'salut', 'Formule de conversation'),
    word('dog', 'Almos', 'Un chien', 'animal', 'Nom animé'),
    word('village', 'Odana', 'Village', 'territoire', 'Nom de lieu'),
    word('work', "Nd'aloka", 'Je travaille', 'action', 'Verbe VAI'),
    word('possessed', 'Wkeskwanal', 'Ses dents', 'corps', 'Nom possédé — pluriel inanimé')
  ];
  const confirmed = practiceConfirmedEntries(words);
  const pools = practicePoolsByLevel(words);
  const assigned = Object.values(pools).flat();
  assert.equal(assigned.length, confirmed.length);
  assert.equal(new Set(assigned.map(item => item.id)).size, confirmed.length);
  assert.deepEqual(Object.keys(pools).map(level => pools[level].map(item => item.id)), [
    ['hello'], ['dog'], ['village'], ['work'], ['possessed']
  ]);
});

test('une meme forme aln8ba napparait jamais deux fois dans une seance', () => {
  const { practiceConfirmedEntries } = practiceApi();
  const words = [
    word('dog-1', 'Almos', 'Un chien', 'animal', 'Nom animé'),
    word('dog-2', 'ALMOS', 'Chien', 'animal', 'Nom animé'),
    word('wolf', 'M8lsem', 'Loup', 'animal', 'Nom animé')
  ];
  assert.deepEqual(practiceConfirmedEntries(words).map(item => item.id), ['dog-1', 'wolf']);
});

test('la rotation sert 50 formes differentes puis continue dans la banque', () => {
  const { practiceRotationSlice } = practiceApi();
  const pool = Array.from({ length: 120 }, (_, index) => word(
    `word-${index}`, `Forme${String(index).padStart(3, '0')}`, `Sens ${index}`, 'action', 'Verbe'
  ));
  const first = practiceRotationSlice(pool, 50, 0);
  const second = practiceRotationSlice(pool, 50, 50);
  const third = practiceRotationSlice(pool, 50, 100);
  assert.equal(first.length, 50);
  assert.equal(new Set(first.map(item => item.id)).size, 50);
  assert.equal(first.filter(item => second.includes(item)).length, 0);
  assert.equal(new Set([...first, ...second, ...third].map(item => item.id)).size, 120);
});

test('les mots proches mois et jour recoivent un contexte distinct', () => {
  const { practiceMeaningHint, practiceMeaningNote } = practiceApi();
  const month = word('month', 'Kizos', 'Mois', 'nature', 'Nom · division du temps');
  const day = word('day', 'Kizokw', 'Jour', 'nature', 'Nom · division du temps');
  assert.equal(practiceMeaningHint(month), 'une division du temps : le mois, et non le jour');
  assert.equal(practiceMeaningHint(day), 'une division du temps : le jour, et non le mois');
  assert.match(practiceMeaningNote(month), /Pazgo kizos/);
  assert.match(practiceMeaningNote(day), /Pazgwen kizokw/);
});

test('les niveaux proposent cinq taches progressives et distinctes', () => {
  const level1 = sourceBetween('function renderLvl1', 'function checkLvl1QCM');
  const level2 = sourceBetween('function renderLvl2', 'function checkLvl2');
  const level3 = sourceBetween('function renderLvl3', 'function checkLvl3Class');
  const level4 = sourceBetween('function renderLvl4', 'function checkLvl4Write');
  const level5 = sourceBetween('function renderLvl5', 'function checkLvl5A');
  assert.match(level1, /Que signifie ce mot/);
  assert.match(level2, /Choisis la forme aln8ba/);
  assert.match(level2, /Quel mot signifie/);
  assert.match(level3, /Quelle sorte de forme est-ce/);
  assert.match(level4, /Écris la forme qui signifie/);
  assert.match(level5, /Autonomie/);
  for (const source of [level1, level2, level3, level4, level5]) assert.doesNotMatch(source, /w\.en/);
});

test('la consolidation classe la nature grammaticale sans inventer un domaine semantique', () => {
  const { practiceFormClass } = practiceApi();
  assert.equal(practiceFormClass(word('month', 'Kikas', 'Mai', 'temps', 'Nom')), 'Nom ou forme nominale');
  assert.equal(practiceFormClass(word('basket', 'Abaznoda', 'Un panier', 'territoire', 'Nom inanimé')), 'Nom ou forme nominale');
  assert.equal(practiceFormClass(word('lamp', 'Lal8b', 'Lampe', 'territoire', 'Nom inanimé')), 'Nom ou forme nominale');
  assert.equal(practiceFormClass(word('work', "Nd'aloka", 'Je travaille', 'action', 'Verbe VAI')), 'Forme verbale : action ou état');
  const level3 = sourceBetween('function renderLvl3', 'function checkLvl3Class');
  assert.doesNotMatch(level3, /domaine de sens|famille de sens/);
});

test('les distracteurs restent dans la seance', () => {
  assert.match(html, /getBestDistractors\(w, 2, 'fr'\)/);
  const distractors = sourceBetween('function getBestDistractors', 'function shuffle');
  assert.match(distractors, /const base=PS\.queue\.filter/);
  assert.doesNotMatch(distractors, /:WORDS/);
});

test('une longue seance autonome ne repete aucune entree et conserve aussi les formes plurielles', () => {
  const { practiceExpertQueue } = practiceApi();
  const pool = [
    word('plural', 'Alakws', 'Étoile', 'nature', 'Nom animé'),
    ...Array.from({ length: 48 }, (_, index) => word(
      `general-${index}`,
      `Forme${index}`,
      `Sens ${index}`,
      'temps',
      'Adverbe'
    ))
  ];
  const pluralForm = word('plural-form', 'Alakwsak', 'Étoiles', 'nature', 'Nom animé pluriel');
  pool.push(pluralForm);
  const queue = practiceExpertQueue(pool, 50);
  assert.equal(queue.length, 50);
  assert.equal(new Set(queue.map(item => item.id)).size, 50);
  assert.equal(queue.filter(item => item.practiceType === 'plural').length, 1);
  assert.ok(queue.some(item => item.id === 'plural-form'));
  assert.ok(queue.some(item => item.practiceType === 'writeAln8ba'));
  assert.ok(queue.some(item => item.practiceType === 'translateFrench'));
});

test('l autonomie alterne les taches et reserve le pluriel aux paires documentees', () => {
  const queue = sourceBetween('function practiceExpertQueue', 'function initPratique');
  assert.match(queue, /DOCUMENTED_PLURALS\[w\.aln8ba\]/);
  assert.match(queue, /'writeAln8ba'/);
  assert.match(queue, /'translateFrench'/);
  assert.match(queue, /practiceType:'plural'/);
  const renderer = sourceBetween('function renderLvl5', 'function checkLvl5A');
  assert.match(renderer, /w\.practiceType/);
});
