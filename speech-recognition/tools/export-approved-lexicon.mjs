#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { canonicalText } from './recognition-lib.mjs';

function option(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const indexPath = path.resolve(option('--index', '../index.html'));
const outputPath = option('--out');
const html = fs.readFileSync(indexPath, 'utf8');
const url = html.match(/const SB_URL\s*=\s*'([^']+)'/)?.[1];
const key = html.match(/const SB_KEY\s*=\s*'([^']+)'/)?.[1];
if (!url || !key) throw new Error('Configuration publique Supabase introuvable dans index.html.');

const fields = 'id,aln8ba,fr,phonetic,cat,notes,source';
const response = await fetch(`${url}/rest/v1/words?select=${fields}&order=aln8ba`, {
  headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
});
if (!response.ok) throw new Error(`Lecture Supabase impossible: HTTP ${response.status}`);
const rows = await response.json();

const historicalSources = ['laurent', 'day', 'gordon', 'bruchac', 'swarthmore', 'ling073'];
const greenSources = [
  'bomsawin', 'nicole', 'document de langue', 'ndakina', 'w8banaki', 'caodanak',
  'conseil des abénakis', 'dictionnaireabenakis', 'guillaum', 'locuteur natif',
  'locutrice native', 'confirm',
];
const doubtfulNotes = /FORME CONSTRUITE|à confirmer|Sens à confirmer|reconstruite|à faire valider|non attestée|par analogie|HYPOTHÈSE|à valider|non glosée|Forme construite/i;
const metadata = /^(RÈGLE|SUFFIXE|RACINE|PRONONCIATION|HISTOIRE|DIVERGENCE)/;

function level(word) {
  const source = String(word.source || '').toLowerCase();
  const notes = String(word.notes || '').toLowerCase();
  if (historicalSources.some(marker => source.includes(marker))) return 'orange';
  if (greenSources.some(marker => source.includes(marker))) return 'green';
  if (['hypoth', 'morpholog', 'deriv'].some(marker => notes.includes(marker))) return 'orange';
  return 'red';
}

const approved = [];
const seen = new Set();
for (const word of rows) {
  const text = String(word.aln8ba || '').trim();
  const pending = word.cat === 'corpus' || word.cat === 'archive' || String(word.fr || '').includes('⚠');
  if (!text || text === '__version__' || word.cat === 'system' || pending) continue;
  if (level(word) !== 'green' || doubtfulNotes.test(String(word.notes || ''))) continue;
  if (text.startsWith('-') || metadata.test(text)) continue;
  const normalized = canonicalText(text);
  if (!normalized || seen.has(normalized)) continue;
  seen.add(normalized);
  approved.push({
    id: word.id,
    aln8ba: text,
    normalized,
    fr: word.fr || '',
    phonetic: word.phonetic || '',
    source: word.source || '',
  });
}

approved.sort((a, b) => a.normalized.localeCompare(b.normalized, 'fr'));
const payload = `${JSON.stringify(approved, null, 2)}\n`;
if (outputPath) {
  const absolute = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, payload, 'utf8');
  console.log(`${approved.length} formes vertes exportées vers ${absolute}`);
} else {
  process.stdout.write(payload);
}

