import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const start = html.indexOf('const LANG = {');
const end = html.indexOf('\n};', start) + '\n};'.length;
assert.ok(start >= 0 && end > start, 'Le validateur du produit doit être présent.');
const LANG = vm.runInNewContext(`${html.slice(start, end)}\nLANG;`);

test('un tréma transmis dans nd’aïbna ne devient pas une erreur automatique', () => {
  for (const aln8ba of ["nd'aïbna", "nd'ai\u0308bna"]) {
    const word = { aln8ba, grammar: '', related: [], notes: '' };
    const before = JSON.stringify(word);
    const result = LANG.validate(word);
    assert.equal(result.issues.length, 0);
    assert.equal(result.ok, true);
    assert.equal(result.tips.length, 1);
    assert.equal(JSON.stringify(word), before, 'Aucune normalisation ne doit réécrire la fiche.');
  }
});

test('les graphies portant des signes restent intactes sans être certifiées par le validateur', () => {
  for (const aln8ba of ['Kwaï', 'Wôlinak']) {
    const result = LANG.validate({ aln8ba, grammar: '', related: [], notes: '' });
    assert.equal(result.issues.length, 0);
    assert.ok(['tip', 'warning'].includes(result.score));
    assert.match(result.tips[0], /à elle seule/);
  }
});

test('préserver les accents ne désactive pas les autres contrôles existants', () => {
  const missing = LANG.validate({ aln8ba: '', grammar: '', related: [], notes: '' });
  assert.equal(missing.ok, false);
  const mismatchedPlural = LANG.validate({
    aln8ba: 'Namas', grammar: 'nom animé', related: ['Namasisak'], notes: ''
  });
  assert.equal(mismatchedPlural.ok, false);
  assert.match(mismatchedPlural.issues[0], /DIMINUTIF/);
});
