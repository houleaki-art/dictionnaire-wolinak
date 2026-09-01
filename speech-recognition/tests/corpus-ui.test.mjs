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

test('la diction vocale est absente du site public et administrateur', () => {
  for (const forbidden of [
    'getUserMedia',
    'MediaRecorder',
    'speechSynthesis',
    'SpeechSynthesisUtterance',
    'webkitSpeechRecognition',
    'SpeechRecognition',
    'Pratique vocale',
    'M’enregistrer',
    'Enregistrer la voix',
    'corpusModal',
    'corpusQuickStart',
    'playAudio(',
    'voiceListenExercise'
  ]) {
    assert.ok(!html.includes(forbidden), `fonction vocale encore présente: ${forbidden}`);
  }
});

test('les lecteurs musicaux restent disponibles sans réactiver la diction', () => {
  for (const id of [
    'musicSkweda',
    'musicAskwa',
    'musicAskawiholji',
    'musicNikwonbi',
    'musicWlaWonGan',
    'musicKikas',
    'musicEntends'
  ]) assert.match(html, new RegExp(`<audio id="${id}"`));
  assert.match(html, /const MUSIC_TRACK_IDS=/);
  assert.match(html, /Wig8damoda — Kiona W8banakiak<\/h3>\s*<span class="music-badge">Chanson · 4:43<\/span>/);
  assert.match(html, /partie conservée de l'enregistrement, qui se termine à 4:43/);
  assert.ok(fs.statSync(path.resolve(here, '..', '..', 'audio', 'wig8damoda-kiona-w8banakiak.mp3')).size > 6_000_000);
  assert.match(html, /K'd-askawiholji<\/h3>\s*<span class="music-badge">Chanson · 3:34<\/span>/);
  assert.match(html, /Madonban[\s\S]*son sens isolé n'est pas établi dans le corpus actuel/);
  assert.ok(fs.statSync(path.resolve(here, '..', '..', 'audio', 'kd-askawiholji.mp3')).size > 4_500_000);
});

test('la confidentialité annonce clairement l absence de collecte vocale', () => {
  assert.match(html, /ne demande pas l’accès au microphone/);
  assert.match(html, /n’enregistre aucune voix/);
  assert.match(html, /n’utilise aucun moteur vocal/);
});

test('la session administrateur survit au rechargement sans conserver le mot de passe', () => {
  const sessionSource = sourceBetween('const ADMIN_SESSION_KEY', 'function openAdmin()');
  const loginSource = sourceBetween('async function checkPin()', 'async function changePin()');
  const initSource = sourceBetween("document.addEventListener('DOMContentLoaded'", '// ===== TRADUCTEUR IA =====');
  assert.match(sessionSource, /sessionStorage\.setItem/);
  assert.match(sessionSource, /refresh_token/);
  assert.doesNotMatch(sessionSource, /password/);
  assert.match(loginSource, /activateAdminSession\(d\)/);
  assert.ok(initSource.indexOf('restoreAdminSession()') < initSource.indexOf('loadWords()'));
});

test('le tableau administrateur separe le travail, la qualite et les outils', () => {
  for (const section of ['queue', 'dictionary', 'quality', 'tools']) {
    assert.match(html, new RegExp(`data-admin-section="${section}"`));
    assert.match(html, new RegExp(`data-admin-tab="${section}"`));
  }
  assert.match(html, /id="adminSummary"/);
  assert.match(html, /function setAdminSection/);
  assert.match(html, /function refreshAdminDashboard/);
  assert.match(html, /function logoutAdmin/);
});

test('la liste administrateur est filtrable et paginee sans rendre toute la base', () => {
  const source = sourceBetween('function renderAdminWords()', 'function refreshAdminDashboard');
  assert.match(html, /id="adminWordQ"/);
  assert.match(html, /id="adminWordLevel"/);
  assert.match(html, /id="adminWordCat"/);
  assert.match(html, /const ADMIN_WORDS_PER_PAGE=40/);
  assert.match(source, /slice\(start,start\+ADMIN_WORDS_PER_PAGE\)/);
  assert.match(source, /adminWordMove/);
});

test('l editeur admin expose la source et documente tous les changements', () => {
  const editor = sourceBetween('function openEdit(id)', 'function deleteWord(id)');
  assert.match(html, /id="e-source"/);
  assert.match(html, /id="e-corrNote"/);
  assert.match(editor, /source:document\.getElementById\('e-source'\)/);
  assert.match(editor, /tracked=\{aln8ba:/);
  assert.match(editor, /saveWords\(\[w\]\)/);
});

test('les ecritures Supabase signalent un refus au lieu d afficher un faux succes', () => {
  const wordsPush = sourceBetween('async function pushToSB(words)', 'async function deleteFromSB');
  const pendingPush = sourceBetween('async function pushPending(entry)', 'async function deletePending');
  assert.match(wordsPush, /if\(!resp\.ok\)/);
  assert.match(wordsPush, /return false/);
  assert.match(wordsPush, /return true/);
  assert.match(wordsPush, /familyId \|\| rest\.family_id/);
  assert.match(wordsPush, /formType \|\| rest\.form_type/);
  assert.match(pendingPush, /if\(!resp\.ok\)/);
  assert.match(pendingPush, /return false/);
  assert.match(pendingPush, /PENDING_CACHE\.push\(entry\)/);
});

test('un administrateur ajoute directement une fiche sans proposition intermediaire', () => {
  const submit = sourceBetween('async function submitWord()', 'function finishSubmit');
  assert.match(submit, /const duplicate=WORDS\.find/);
  assert.match(submit, /existe déjà dans le dictionnaire/);
  assert.match(submit, /S\.view==='admin'&&SB_AUTH/);
  assert.match(submit, /await pushToSB\(\[word\]\)/);
  assert.match(submit, /delete word\.status/);
  assert.match(submit, /WORDS\.push\(word\)/);
  assert.match(submit, /La fiche n\\'a pas été publiée/);
  assert.match(submit, /const submitted=await pushPending\(entry\)/);
});

test('la collecte de poissons ne conserve aucun script de migration public', () => {
  assert.doesNotMatch(html, /FISH_FIELD_MIGRATION_KEY/);
  assert.doesNotMatch(html, /applyFishFieldMigration/);
  const overrides = sourceBetween('const CURRENT_ENTRY_OVERRIDES', 'const INTERROGATIVE_FORM_NOTES');
  assert.match(overrides, /mst311:\{cat:'archive'/);
  assert.match(overrides, /mtfpi9qcc4st:\{en:'Trout'/);
  assert.match(overrides, /related:\['Scotam','Scotama'\]/);
});

test('les doublons strictement identiques ne sont jamais rendus au public', () => {
  const dedupe = sourceBetween('function removeExactDuplicateRows', 'async function loadWords');
  assert.match(dedupe, /const seen=new Set\(\)/);
  assert.match(dedupe, /word\.aln8ba,word\.fr,word\.en/);
  assert.match(dedupe, /JSON\.stringify\(word\.related\|\|\[\]\)/);
  assert.match(html, /return removeExactDuplicateRows\(current\)/);
});

test('la truite actuelle reste publique et ses graphies historiques vont aux archives', () => {
  const overrides = sourceBetween('const CURRENT_USAGE_OVERRIDES', 'const INTERROGATIVE_FORM_NOTES');
  assert.match(overrides, /mst311:\{cat:'archive'/);
  assert.match(overrides, /mtfpi9qcc4st:\{en:'Trout'/);
  assert.match(overrides, /related:\['Scotam','Scotama'\]/);
});
