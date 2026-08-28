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
  assert.equal(
    publicSourceLabel("Laurent, 1884 · Référence recommandée par Hélène O'Bomsawin"),
    'Laurent, 1884'
  );
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

test('public identity presents a personal Wôlinak project without institutional representation', () => {
  assert.match(html, /Projet personnel de Guillaum Labrecque-Houle · Abénakis de Wôlinak/);
  assert.match(html, /Un projet personnel de Wôlinak/);
  assert.match(html, /ni approuvé dans son ensemble par des professionnels, une Nation, un conseil de bande/);
  assert.doesNotMatch(html, /Dictionnaire vivant · Abenakis d'Odanak et Wôlinak/);
  assert.doesNotMatch(html, /Première Nation Abénakise de Wôlinak/);
});

test('music uses W8linak descriptively without claiming Council approval', () => {
  assert.match(html, /L'emploi du nom W8linak décrit l'origine, le lieu ou le sujet/);
  assert.match(html, /aucune commande, autorisation, commandite ni approbation du Conseil des Abénakis de Wôlinak/);
  assert.match(html, /aucun symbole officiel de la Nation n'est employé comme identité de ces chansons/);
});

test('public contributions are anonymous and never collect or publish a voice', () => {
  assert.match(html, /id="fPrivacyConsent"/);
  assert.match(html, /id="suggPrivacyConsent"/);
  assert.doesNotMatch(html, /id="fAudioConsent"/);
  assert.doesNotMatch(html, /id="f-contributor"/);
  assert.doesNotMatch(html, /id="suggContrib"/);
  assert.match(html, /audio:null/);
  assert.match(html, /contributor:'Anonyme'/);
  assert.match(html, /delete word\.audio;/);
  assert.match(html, /delete word\.status; delete word\.submitted_date; delete word\.contributor;/);
  assert.doesNotMatch(html, /Suggestion approuvée de ['"]?\+s\.contributor/);
});

test('privacy notice identifies the processor, purposes and withdrawal contact', () => {
  assert.match(html, /proposition linguistique anonyme à la base Supabase du projet/);
  assert.match(html, /Responsable : <strong>Guillaum Labrecque-Houle<\/strong>/);
  assert.match(html, /mailto:houle\.aki@gmail\.com/);
  assert.match(html, /demander l'accès, la rectification ou le retrait/);
});
