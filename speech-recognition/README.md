# Reconnaissance vocale aln8ba (`abe`)

Ce dossier prépare un véritable moteur de reconnaissance pour l'abénakis
occidental. Il ne passe jamais une voix aln8ba dans un reconnaisseur français.

## État actuel

- La base publique contient actuellement **zéro enregistrement natif relié à un mot**.
- Le modèle ASR public MMS-1B-all couvre plus de mille langues, mais sa liste
  publiée ne contient pas le code ISO 639-3 `abe`.
- Le modèle public ne peut donc pas être présenté comme un moteur aln8ba prêt à
  l'emploi. Il faut entraîner un nouvel adaptateur sur un corpus autorisé.
- Le site public conserve pour l'instant la réécoute locale, sans transcription
  ni score automatique.

## Ce que construit cette filière

1. `tools/export-approved-lexicon.mjs` lit la base en lecture seule et exporte
   uniquement les entrées vertes actuelles selon les mêmes règles que le site.
2. `tools/prepare-corpus.mjs` refuse les clips sans consentement d'entraînement,
   sans révision, hors lexique, dupliqués ou techniquement invalides.
3. La séparation entraînement/validation/test se fait par `speaker_id`. Une même
   voix ne peut donc pas se retrouver dans l'entraînement et dans le test.
4. `service/` charge seulement un modèle aln8ba entraîné et un lexique approuvé.
   Le garde-fou lexical ne corrige jamais vers une forme historique ou orange.

## Structure locale attendue

```text
speech-recognition/
  corpus/
    manifest.jsonl
    audio/
      spk-001/kwai-001.wav
      spk-002/kwai-001.wav
  build/                    # généré, jamais publié
  models/                   # généré, jamais publié
```

Les noms réels des personnes ne doivent pas apparaître dans le manifeste. Un
`speaker_id` pseudonyme stable est nécessaire uniquement pour empêcher une
fuite de locuteur entre les ensembles.

## Préparer un corpus

```powershell
node tools/export-approved-lexicon.mjs --index ../index.html --out build/approved-lexicon.json
node tools/prepare-corpus.mjs --manifest corpus/manifest.jsonl --lexicon build/approved-lexicon.json --out build
node --test tests/*.test.mjs
```

Les fichiers WAV doivent être mono, PCM, 16 kHz, entre 0,25 et 15 secondes.
Les autres formats sont convertis hors de ce dépôt avant leur ajout au corpus.

## Seuils avant toute activation publique

- au moins cinq locuteurs consentants au total;
- au moins trois locuteurs distincts pour chaque forme activée;
- un ensemble test composé uniquement de voix jamais vues à l'entraînement;
- exactitude par mot d'au moins 90 % sur le vocabulaire fermé visé;
- taux de fausse acceptation inférieur ou égal à 2 % sur silence, bruit et mots
  hors vocabulaire;
- examen humain des erreurs portant sur `8`, `CH`, `J`, `W`, les consonnes
  finales et les préfixes personnels;
- validation du protocole et des formes par une personne compétente avant de
  présenter le résultat comme un outil pédagogique fiable.

Ces seuils sont des barrières techniques de publication, pas une attestation
linguistique officielle.

## Entraînement

Le point de départ recommandé est l'adaptation CTC de `facebook/mms-1b-all` avec
un nouveau vocabulaire aln8ba. Le script officiel de Transformers
`run_speech_recognition_ctc_adapter.py` réinitialise les adaptateurs et la tête
de vocabulaire pour une langue à faibles ressources. L'entraînement demande un
GPU et ne doit commencer qu'après la validation du corpus.

Le modèle produit doit être sauvegardé dans `models/aln8ba-mms/` avec le
processeur, le vocabulaire et les poids. Le service refuse de démarrer si le
répertoire ou le lexique approuvé manque.

## Vie privée

- Aucun microphone ne démarre sans un geste immédiat de la personne.
- Un enregistrement de pratique n'est pas automatiquement versé au corpus.
- Une contribution au corpus exige un consentement séparé et explicite.
- Le service supprime les octets audio après l'inférence et ne journalise pas le
  contenu vocal.
- Le retrait d'un consentement doit permettre de retrouver et supprimer tous
  les clips associés au `consent_id`, puis d'entraîner une nouvelle version.

