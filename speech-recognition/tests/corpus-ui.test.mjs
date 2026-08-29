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
    'musicNikwonbi',
    'musicWlaWonGan',
    'musicKikas',
    'musicEntends'
  ]) assert.match(html, new RegExp(`<audio id="${id}"`));
  assert.match(html, /const MUSIC_TRACK_IDS=/);
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
