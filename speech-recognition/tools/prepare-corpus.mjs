#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { assignSpeakerSplits, buildVocabulary, canonicalText } from './recognition-lib.mjs';

function option(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

export function inspectWav(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 44) throw new Error('WAV trop court.');
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Le fichier n’est pas un WAV RIFF.');
  }
  let offset = 12;
  let format = null;
  let dataBytes = 0;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (start + size > buffer.length) throw new Error(`Bloc WAV ${id} tronqué.`);
    if (id === 'fmt ' && size >= 16) {
      format = {
        audioFormat: buffer.readUInt16LE(start),
        channels: buffer.readUInt16LE(start + 2),
        sampleRate: buffer.readUInt32LE(start + 4),
        bitsPerSample: buffer.readUInt16LE(start + 14),
      };
    } else if (id === 'data') dataBytes += size;
    offset = start + size + (size % 2);
  }
  if (!format || !dataBytes) throw new Error('WAV sans blocs fmt ou data valides.');
  const bytesPerSample = format.bitsPerSample / 8;
  const durationSeconds = dataBytes / (format.sampleRate * format.channels * bytesPerSample);
  return { ...format, dataBytes, durationSeconds };
}

function readJsonLines(filePath) {
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).map(line => line.trim())
    .filter(Boolean).map((line, index) => {
      try { return JSON.parse(line); }
      catch (error) { throw new Error(`${filePath}:${index + 1}: JSON invalide (${error.message}).`); }
    });
}

function writeJsonLines(filePath, records) {
  fs.writeFileSync(filePath, `${records.map(record => JSON.stringify(record)).join('\n')}\n`, 'utf8');
}

export function validateRecordShape(record, index) {
  const where = `entrée ${index + 1}`;
  const required = [
    'clip', 'transcript', 'speaker_id', 'consent_id', 'consent_scope',
    'review_status', 'reviewer_id', 'source_status', 'dialect', 'recorded_at',
  ];
  const missing = required.filter(field => record[field] === undefined || record[field] === '');
  if (missing.length) throw new Error(`${where}: champs manquants: ${missing.join(', ')}.`);
  if (!/^spk-[a-z0-9-]{3,40}$/.test(record.speaker_id)) throw new Error(`${where}: speaker_id invalide.`);
  if (!/^consent-[a-z0-9-]{3,60}$/.test(record.consent_id)) throw new Error(`${where}: consent_id invalide.`);
  if (!Array.isArray(record.consent_scope) || !record.consent_scope.includes('asr-training')) {
    throw new Error(`${where}: consent_scope doit contenir asr-training.`);
  }
  if (record.review_status !== 'approved') throw new Error(`${where}: review_status doit être approved.`);
  if (record.source_status !== 'green-current') throw new Error(`${where}: source_status doit être green-current.`);
  if (!['Odanak', 'Wolinak', 'Odanak-Wolinak'].includes(record.dialect)) throw new Error(`${where}: dialect invalide.`);
  if (Number.isNaN(Date.parse(record.recorded_at))) throw new Error(`${where}: recorded_at invalide.`);
}

export function prepareCorpus({ manifestPath, lexiconPath, outputDirectory, minSpeakers = 5, minPerForm = 3 }) {
  const manifest = readJsonLines(manifestPath);
  const lexicon = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'));
  const approved = new Map((lexicon || []).map(entry => {
    const text = typeof entry === 'string' ? entry : entry.aln8ba;
    return [canonicalText(text), text];
  }).filter(([key]) => key));
  if (!approved.size) throw new Error('Le lexique vert approuvé est vide.');

  const corpusRoot = path.dirname(manifestPath);
  const errors = [];
  const clips = [];
  const hashes = new Set();
  const consentSpeakers = new Map();

  manifest.forEach((record, index) => {
    try {
      validateRecordShape(record, index);
      const transcriptKey = canonicalText(record.transcript);
      if (!approved.has(transcriptKey)) throw new Error(`transcription hors du lexique vert: ${record.transcript}.`);
      const clipPath = path.resolve(corpusRoot, record.clip);
      const relative = path.relative(corpusRoot, clipPath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('clip hors du dossier corpus.');
      if (path.extname(clipPath).toLowerCase() !== '.wav') throw new Error('seuls les WAV sont acceptés.');
      const bytes = fs.readFileSync(clipPath);
      const wav = inspectWav(bytes);
      if (wav.audioFormat !== 1 || wav.channels !== 1 || wav.sampleRate !== 16000 || wav.bitsPerSample !== 16) {
        throw new Error('WAV exigé: PCM 16 bits, mono, 16 kHz.');
      }
      if (wav.durationSeconds < 0.25 || wav.durationSeconds > 15) throw new Error('durée hors de 0,25 à 15 secondes.');
      const digest = crypto.createHash('sha256').update(bytes).digest('hex');
      if (hashes.has(digest)) throw new Error('clip audio dupliqué.');
      hashes.add(digest);
      const consentSpeaker = consentSpeakers.get(record.consent_id);
      if (consentSpeaker && consentSpeaker !== record.speaker_id) throw new Error('consent_id associé à plusieurs speaker_id.');
      consentSpeakers.set(record.consent_id, record.speaker_id);
      clips.push({
        audio: clipPath,
        text: approved.get(transcriptKey),
        speaker_id: record.speaker_id,
        consent_id: record.consent_id,
        dialect: record.dialect,
        duration_seconds: Number(wav.durationSeconds.toFixed(3)),
      });
    } catch (error) {
      errors.push(`entrée ${index + 1}: ${error.message}`);
    }
  });
  if (errors.length) throw new Error(`Corpus refusé:\n- ${errors.join('\n- ')}`);

  const splitBySpeaker = assignSpeakerSplits(clips.map(clip => clip.speaker_id));
  const datasets = { train: [], validation: [], test: [] };
  clips.forEach(clip => datasets[splitBySpeaker.get(clip.speaker_id) || 'train'].push(clip));

  const speakersByForm = new Map();
  clips.forEach(clip => {
    const key = canonicalText(clip.text);
    if (!speakersByForm.has(key)) speakersByForm.set(key, new Set());
    speakersByForm.get(key).add(clip.speaker_id);
  });
  const incompleteForms = [...speakersByForm.entries()]
    .filter(([, speakers]) => speakers.size < minPerForm)
    .map(([key, speakers]) => ({ form: approved.get(key), speakers: speakers.size, required: minPerForm }));
  const speakerCount = new Set(clips.map(clip => clip.speaker_id)).size;
  const ready = speakerCount >= minSpeakers && incompleteForms.length === 0
    && datasets.train.length > 0 && datasets.validation.length > 0 && datasets.test.length > 0;

  fs.mkdirSync(outputDirectory, { recursive: true });
  for (const [split, records] of Object.entries(datasets)) {
    writeJsonLines(path.join(outputDirectory, `${split}.jsonl`), records);
  }
  fs.writeFileSync(path.join(outputDirectory, 'vocab.json'), `${JSON.stringify(buildVocabulary(clips.map(clip => clip.text)), null, 2)}\n`, 'utf8');
  const report = {
    schema_version: 1,
    ready_for_training: ready,
    clips: clips.length,
    speakers: speakerCount,
    forms: speakersByForm.size,
    splits: Object.fromEntries(Object.entries(datasets).map(([name, records]) => [name, {
      clips: records.length,
      speakers: new Set(records.map(record => record.speaker_id)).size,
    }])),
    incomplete_forms: incompleteForms,
  };
  fs.writeFileSync(path.join(outputDirectory, 'corpus-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

async function main() {
  const manifestPath = path.resolve(option('--manifest', 'corpus/manifest.jsonl'));
  const lexiconPath = path.resolve(option('--lexicon', 'build/approved-lexicon.json'));
  const outputDirectory = path.resolve(option('--out', 'build'));
  const minSpeakers = Number(option('--min-speakers', '5'));
  const minPerForm = Number(option('--min-speakers-per-form', '3'));
  const allowIncomplete = process.argv.includes('--allow-incomplete');
  const report = prepareCorpus({ manifestPath, lexiconPath, outputDirectory, minSpeakers, minPerForm });
  console.log(JSON.stringify(report, null, 2));
  if (!report.ready_for_training && !allowIncomplete) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}

