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

test('le traducteur nest plus propose dans les navigations publiques', () => {
  const desktop = sourceBetween('<!-- SIDEBAR -->', '<!-- MAIN -->');
  const mobile = sourceBetween('<!-- TIROIR MOBILE -->', '<script>');
  assert.doesNotMatch(desktop, /setView\('traducteur'\)|>Traducteur</);
  assert.doesNotMatch(mobile, /mobileNav\('traducteur'\)|>Traducteur</);
});

test('une ancienne demande douverture du traducteur revient au dictionnaire', () => {
  const setView = sourceBetween('function setView(', 'function filterCat(');
  assert.match(setView, /if\(v==='traducteur'\) v='all'/);
  assert.match(setView, /traducteurView'\)\.style\.display = 'none'/);
  assert.doesNotMatch(setView, /traducteur:'Traducteur'/);
});

test('la recherche predictive publique reste active', () => {
  assert.match(html, /id="searchIn"[^>]+Recherche prédictive/);
  const init = sourceBetween("document.addEventListener('DOMContentLoaded'", '// ===== TRADUCTEUR IA =====');
  assert.match(init, /si\.addEventListener\('input'/);
  assert.match(init, /S\.q=si\.value/);
  assert.match(init, /renderWords\(\)/);
});
