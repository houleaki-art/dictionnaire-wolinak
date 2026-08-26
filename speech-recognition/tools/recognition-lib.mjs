import crypto from 'node:crypto';

export function canonicalText(value) {
  return String(value || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’ʻ`]/g, "'")
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/[.,!?;:()[\]{}«»"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(left, right) {
  const a = Array.from(canonicalText(left));
  const b = Array.from(canonicalText(right));
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }
  return previous[b.length];
}

export function resolveTranscript(rawTranscript, lexicon) {
  const raw = canonicalText(rawTranscript);
  if (!raw) return { status: 'unresolved', raw: '', match: null, reason: 'empty' };

  const unique = new Map();
  for (const entry of lexicon || []) {
    const text = typeof entry === 'string' ? entry : entry?.aln8ba;
    const key = canonicalText(text);
    if (key && !unique.has(key)) unique.set(key, text);
  }

  if (unique.has(raw)) {
    return { status: 'matched-exact', raw, match: unique.get(raw), distance: 0 };
  }

  // Les formes courtes sont trop faciles à transformer silencieusement. Elles
  // exigent une sortie CTC exacte; les formes longues tolèrent au plus 12 %.
  const maxDistance = raw.length < 6 ? 0 : Math.min(2, Math.max(1, Math.floor(raw.length * 0.12)));
  const ranked = [...unique.entries()]
    .map(([key, text]) => ({ key, text, distance: levenshtein(raw, key) }))
    .sort((a, b) => a.distance - b.distance || a.key.localeCompare(b.key));
  const best = ranked[0];
  const second = ranked[1];
  const gap = second ? second.distance - best.distance : Number.POSITIVE_INFINITY;

  if (best && best.distance <= maxDistance && gap >= 2) {
    return {
      status: 'matched-unique',
      raw,
      match: best.text,
      distance: best.distance,
      reason: 'unique-nearest-green-form',
    };
  }
  return {
    status: 'unresolved',
    raw,
    match: null,
    reason: best && best.distance <= maxDistance ? 'ambiguous' : 'outside-approved-lexicon',
  };
}

export function assignSpeakerSplits(speakerIds, seed = 'aln8ba-abe-v1') {
  const speakers = [...new Set((speakerIds || []).filter(Boolean))]
    .map(id => ({
      id,
      order: crypto.createHash('sha256').update(`${seed}:${id}`).digest('hex'),
    }))
    .sort((a, b) => a.order.localeCompare(b.order));
  const result = new Map();
  if (!speakers.length) return result;

  if (speakers.length === 1) {
    result.set(speakers[0].id, 'train');
    return result;
  }
  if (speakers.length === 2) {
    result.set(speakers[0].id, 'train');
    result.set(speakers[1].id, 'validation');
    return result;
  }

  const testCount = Math.max(1, Math.floor(speakers.length * 0.2));
  const validationCount = Math.max(1, Math.floor(speakers.length * 0.2));
  speakers.forEach(({ id }, index) => {
    if (index < testCount) result.set(id, 'test');
    else if (index < testCount + validationCount) result.set(id, 'validation');
    else result.set(id, 'train');
  });
  return result;
}

export function buildVocabulary(transcripts) {
  const characters = new Set();
  for (const transcript of transcripts || []) {
    for (const character of Array.from(canonicalText(transcript))) {
      characters.add(character === ' ' ? '|' : character);
    }
  }
  const ordered = [...characters].sort((a, b) => a.localeCompare(b, 'fr'));
  const vocabulary = Object.fromEntries(ordered.map((character, index) => [character, index]));
  vocabulary['[UNK]'] = ordered.length;
  vocabulary['[PAD]'] = ordered.length + 1;
  return vocabulary;
}

