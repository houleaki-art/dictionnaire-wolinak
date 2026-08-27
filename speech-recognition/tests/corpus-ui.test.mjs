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

test('le consentement est verifie avant toute demande de microphone', () => {
  const source = sourceBetween('async function corpusStartRecording()', 'function corpusStopRecording()');
  assert.ok(source.indexOf('corpusConsentCheck') < source.indexOf('getUserMedia'));
  assert.match(source, /Le microphone reste fermé/);
});

test('le bouton des cartes utilise la collecte rapide sans ouvrir de modal', () => {
  const source = sourceBetween('async function corpusQuickStart', 'function corpusQuickStop');
  assert.ok(source.indexOf('corpusQuickConsent()') < source.indexOf('getUserMedia'));
  assert.match(html, /onclick="corpusQuickStart\('/);
  assert.doesNotMatch(html, /class="ca corpus-rec[^>]+onclick="openCorpusRecorder\('/);
});

test('la vue de collecte ne montre que les formes vertes enregistrables', () => {
  const filterSource = sourceBetween('function filtered()', '// ── Ordre');
  const openSource = sourceBetween('function corpusOpenDictionary()', 'function corpusDefaultConsentId()');
  assert.match(filterSource, /S\.corpusOnly/);
  assert.match(filterSource, /r\.filter\(isCorpusEligible\)/);
  assert.match(openSource, /S\.corpusOnly=true/);
  assert.match(openSource, /function corpusExitDictionary/);
  assert.match(html, /id="corpusModeBanner" hidden/);
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

test('le collecteur reste local et necrit jamais dans Supabase', () => {
  const source = sourceBetween('// Corpus vocal prive', '//  PRATIQUE VOCALE');
  assert.doesNotMatch(source, /fetch\s*\(|saveWords\s*\(|pushPending\s*\(|SB_URL|SB_AUTH/);
  assert.match(source, /indexedDB\.open/);
  assert.match(source, /review_status:'approved'/);
  assert.match(source, /source_status:'green-current'/);
});

test('le WAV produit est PCM 16 bits mono a 16 kHz', async () => {
  const source = sourceBetween('function corpusEncodeWav', 'function corpusSlug');
  const encode = new Function(`${source}; return corpusEncodeWav;`)();
  const bytes = Buffer.from(await encode(new Float32Array(16000), 16000).arrayBuffer());
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
  assert.equal(bytes.readUInt16LE(20), 1);
  assert.equal(bytes.readUInt16LE(22), 1);
  assert.equal(bytes.readUInt32LE(24), 16000);
  assert.equal(bytes.readUInt16LE(34), 16);
  assert.equal(bytes.length, 32044);
});
