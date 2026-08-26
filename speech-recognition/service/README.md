# Service d'inférence

Ce service n'est pas un substitut à l'entraînement. Sans modèle local sous
`models/aln8ba-mms/`, `/health` retourne `model-missing` et `/transcribe` refuse
la requête.

```powershell
$env:ALN_ASR_MODEL_DIR = "..\models\aln8ba-mms"
$env:ALN_ASR_LEXICON = "..\build\approved-lexicon.json"
$env:ALN_ASR_MODEL_VERSION = "abe-mms-0.1-pilot"
uvicorn app:app --host 127.0.0.1 --port 8080 --no-access-log
```

Le service:

- accepte au plus 5 Mo et 15 secondes;
- exige l'en-tête `X-Aln8ba-Voice-Consent: one-shot`;
- convertit en mono 16 kHz avant l'inférence;
- supprime le fichier temporaire dans tous les cas;
- ne rapproche la sortie que du lexique vert exporté;
- ne renvoie aucun pourcentage présenté comme une note de prononciation.

En production, placer le service derrière HTTPS, une limite de débit et une
politique de suppression des journaux. GitHub Pages ne peut pas héberger ce
modèle; un hébergement séparé avec GPU ou CPU dimensionné est requis.

