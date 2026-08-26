import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  assignSpeakerSplits,
  buildVocabulary,
  canonicalText,
  resolveTranscript,
} from '../tools/recognition-lib.mjs';
import { inspectWav, prepareCorpus, validateRecordShape } from '../tools/prepare-corpus.mjs';

function makeWav({ sampleRate = 16000, channels = 1, seconds = 1 } = {}) {
  const samples = Math.floor(sampleRate * seconds);
  const dataBytes = samples * channels * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + dataBytes, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22); buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28); buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34); buffer.write('data', 36); buffer.writeUInt32LE(dataBytes, 40);
  return buffer;
}

test('la normalisation conserve les signes aln8ba utiles', () => {
  assert.equal(canonicalText("  T8ni  aliwizian?  "), 't8ni aliwizian');
  assert.equal(canonicalText("Nd’aliwizi"), "nd'aliwizi");
  assert.equal(canonicalText('Kwaï'), 'kwaï');
});

test('une forme courte ne subit aucune correction silencieuse', () => {
  assert.equal(resolveTranscript('h8', ['8h8', '8ka']).status, 'unresolved');
  assert.equal(resolveTranscript('8h8', ['8h8', '8ka']).status, 'matched-exact');
});

test('une seule petite erreur peut rejoindre une forme longue unique', () => {
  const result = resolveTranscript('t8ni aliwizia', ['T8ni aliwizian', 'Nd’aliwizi Mali']);
  assert.equal(result.status, 'matched-unique');
  assert.equal(result.match, 'T8ni aliwizian');
});

test('une sortie ambiguë reste non résolue', () => {
  const result = resolveTranscript('ndaloki', ["Nd'aloka", "Nd'aloko"]);
  assert.equal(result.status, 'unresolved');
});

test('les locuteurs ne traversent jamais les ensembles', () => {
  const ids = ['spk-001', 'spk-002', 'spk-003', 'spk-004', 'spk-005', 'spk-006'];
  const split = assignSpeakerSplits(ids);
  assert.equal(split.size, ids.length);
  assert.deepEqual(new Set(split.values()), new Set(['train', 'validation', 'test']));
  ids.forEach(id => assert.ok(split.has(id)));
});

test('le vocabulaire CTC garde 8, les accents et le séparateur de mots', () => {
  const vocab = buildVocabulary(['8h8', 'Kwaï mziwi']);
  assert.ok(Object.hasOwn(vocab, '8'));
  assert.ok(Object.hasOwn(vocab, 'ï'));
  assert.ok(Object.hasOwn(vocab, '|'));
  assert.ok(Object.hasOwn(vocab, '[UNK]'));
  assert.ok(Object.hasOwn(vocab, '[PAD]'));
});

test('le lecteur WAV vérifie le format attendu', () => {
  const file = path.join(os.tmpdir(), `aln8ba-${process.pid}.wav`);
  fs.writeFileSync(file, makeWav());
  try {
    const info = inspectWav(fs.readFileSync(file));
    assert.equal(info.audioFormat, 1);
    assert.equal(info.channels, 1);
    assert.equal(info.sampleRate, 16000);
    assert.equal(info.bitsPerSample, 16);
    assert.equal(info.durationSeconds, 1);
  } finally { fs.rmSync(file, { force: true }); }
});

test('le manifeste exige un consentement d’entraînement explicite', () => {
  const record = {
    clip: 'audio/spk-001/test.wav', transcript: 'Kwaï', speaker_id: 'spk-001',
    consent_id: 'consent-001', consent_scope: ['evaluation'], review_status: 'approved',
    reviewer_id: 'reviewer-001', source_status: 'green-current', dialect: 'Wolinak',
    recorded_at: '2026-08-26T12:00:00Z',
  };
  assert.throws(() => validateRecordShape(record, 0), /asr-training/);
});

test('la préparation complète sépare les voix entre entraînement et tests', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aln8ba-corpus-'));
  const corpus = path.join(root, 'corpus');
  const audio = path.join(corpus, 'audio');
  const build = path.join(root, 'build');
  fs.mkdirSync(audio, { recursive: true });
  const manifest = [];
  for (let index = 1; index <= 5; index += 1) {
    const speaker = `spk-00${index}`;
    const speakerDirectory = path.join(audio, speaker);
    fs.mkdirSync(speakerDirectory, { recursive: true });
    const wav = makeWav();
    wav.writeInt16LE(index, 44);
    fs.writeFileSync(path.join(speakerDirectory, 'kwai.wav'), wav);
    manifest.push({
      clip: `audio/${speaker}/kwai.wav`, transcript: 'Kwaï', speaker_id: speaker,
      consent_id: `consent-00${index}`, consent_scope: ['asr-training', 'evaluation'],
      review_status: 'approved', reviewer_id: 'reviewer-001', source_status: 'green-current',
      dialect: 'Odanak-Wolinak', recorded_at: `2026-08-2${index}T12:00:00Z`,
    });
  }
  const manifestPath = path.join(corpus, 'manifest.jsonl');
  const lexiconPath = path.join(root, 'lexicon.json');
  fs.writeFileSync(manifestPath, `${manifest.map(item => JSON.stringify(item)).join('\n')}\n`);
  fs.writeFileSync(lexiconPath, JSON.stringify([{ aln8ba: 'Kwaï' }]));
  try {
    const report = prepareCorpus({
      manifestPath,
      lexiconPath,
      outputDirectory: build,
      minSpeakers: 5,
      minPerForm: 3,
    });
    assert.equal(report.ready_for_training, true);
    const speakers = {};
    for (const split of ['train', 'validation', 'test']) {
      speakers[split] = new Set(
        fs.readFileSync(path.join(build, `${split}.jsonl`), 'utf8').trim().split(/\r?\n/)
          .filter(Boolean).map(line => JSON.parse(line).speaker_id),
      );
    }
    for (const trainSpeaker of speakers.train) {
      assert.equal(speakers.validation.has(trainSpeaker), false);
      assert.equal(speakers.test.has(trainSpeaker), false);
    }
    for (const validationSpeaker of speakers.validation) {
      assert.equal(speakers.test.has(validationSpeaker), false);
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
