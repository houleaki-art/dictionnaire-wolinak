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
