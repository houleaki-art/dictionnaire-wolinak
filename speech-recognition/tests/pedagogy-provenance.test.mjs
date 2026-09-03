import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function sourceBetween(start, end) {
  const from = html.indexOf(start);
  const to = html.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `bloc introuvable: ${start}`);
  return html.slice(from, to);
}

test('la methode du projet separe apprentissage et donnees linguistiques', () => {
  const source = sourceBetween('const APR_PROJECT_PEDAGOGY', 'const APR_DOCUMENTED_ANALYSES');
  for (const step of ['Ancrer', 'Observer', 'Retrouver', 'Produire']) {
    assert.match(source, new RegExp(step));
  }
  assert.match(source, /Données linguistiques consultées/);
  assert.match(source, /Travail propre au projet/);
  assert.match(source, /ne signifie ni participation ni approbation/);
  assert.match(source, /citations exactes nécessaires restent identifiées/);
});

test('chaque lecon affiche methode et provenance sans modifier ses formes', () => {
  const lesson = sourceBetween('function aprLecon', 'function aprDecorView');
  assert.match(lesson, /aprMethodHtml\(m\)/);
  assert.match(lesson, /aprProvenanceHtml\(m,lecHtml\)/);
  assert.ok(lesson.indexOf('aprProvenanceHtml(m,lecHtml)') > lesson.indexOf('${lecHtml}'));
  assert.match(lesson, /class="apr-lesson-tools"/);
});

test('les outils autonomes affichent aussi leur provenance', () => {
  for (const start of ['function aprDecorView', 'function aprConjView', 'function aprNombView', 'function aprGramView']) {
    const from = html.indexOf(start);
    const next = html.indexOf('\nfunction ', from + start.length);
    const source = html.slice(from, next > from ? next : from + 6000);
    assert.match(source, /aprProvenanceHtml/, `provenance absente: ${start}`);
  }
});

test('le manuel reste une source et ne parle plus comme le professeur', () => {
  assert.doesNotMatch(html, /Le Manuel (?:actuel )?(?:donne|explique|enseigne|permet|documente|fournit)/i);
  assert.match(html, /Données phonétiques consultées : Manuel de l'étudiant 1/);
  assert.match(html, /Données linguistiques consultées : Manuel de l'étudiant 1/);
});

test('le cadre de provenance est versionne avec le projet', () => {
  const file = path.join(root, 'research', 'PEDAGOGY_PROVENANCE.md');
  assert.ok(fs.existsSync(file));
  const text = fs.readFileSync(file, 'utf8');
  assert.match(text, /Les données linguistiques/);
  assert.match(text, /La pédagogie du projet/);
  assert.match(text, /Ne pas reproduire la mise en page, l'ordre ou les consignes d'un manuel/);
});
