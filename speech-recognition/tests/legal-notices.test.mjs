import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

function sourceBetween(start, end) {
  const from = html.indexOf(start);
  const to = html.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `Missing source range: ${start}`);
  return html.slice(from, to);
}

test('public source labels never imply Nation or external approval', () => {
  const source = sourceBetween('function publicSourceLabel', 'function projectReviewedSource');
  const publicSourceLabel = new Function(`${source}; return publicSourceLabel;`)();
  const raw = "Manuel · Enseignement actuel de la Nation · ✓ Confirmé par l'admin";
  assert.equal(publicSourceLabel(raw), 'Manuel');
});

test('internal review is named as internal review', () => {
  const source = sourceBetween('function publicSourceLabel', '// ── NIVEAU DE CONFIANCE');
  const projectReviewedSource = new Function(`${source}; return projectReviewedSource;`)();
  assert.equal(
    projectReviewedSource('Ouvrage consulté · ✓ Confirmé'),
    'Ouvrage consulté · Revu dans le projet (validation interne seulement)'
  );
});

test('public notes describe project choices without claiming Nation authority', () => {
  const source = sourceBetween('function publicNoteText', 'function projectReviewedSource');
  const publicNoteText = new Function(`${source}; return publicNoteText;`)();
  const note = "L'enseignement actuel de la Nation fait autorité. ★ C'EST LA FORME À EMPLOYER.";
  const rendered = publicNoteText(note);
  assert.match(rendered, /décision interne/);
  assert.match(rendered, /FORME RETENUE PAR LE PROJET/);
  assert.doesNotMatch(rendered, /Nation fait autorité/);
});

test('legal notices distinguish sources and third-party rights', () => {
  assert.match(html, /indique uniquement une source consultée/);
  assert.match(html, /ne signifie ni participation au projet, ni attestation, ni approbation/);
  assert.match(html, /Les mots, faits linguistiques, citations et œuvres de tiers conservent leur propre statut/);
  assert.doesNotMatch(html, /Les mots, traductions et contenus linguistiques de ce dictionnaire sont protégés/);
  assert.doesNotMatch(html, /Toute reproduction identique est illégale/);
});
