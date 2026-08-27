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
