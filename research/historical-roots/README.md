# Racines historiques reliees a l'usage actuel

Ce dossier contient un audit reproductible des deux sources primaires suivantes :

- Joseph Laurent, *New Familiar Abenakis and English Dialogues* (1884);
- Henry Lorne Masta, *Abenaki Indian Legends, Grammar and Place Names* (1932).

L'outil ne transforme jamais une ressemblance graphique en fait linguistique. Il separe :

- les formes identiques a une entree actuelle;
- les familles et paradigmes documentes dans `overrides.json`;
- les rapprochements structuraux forts;
- les candidats graphiques qui doivent etre verifies sur la page et par une personne competente.

Les PDF ne sont pas recopies dans le depot. Les chemins locaux, les empreintes SHA-256 et les pages controlees sont consignes dans le rapport genere.

## Regenerer le rapport

```powershell
python research/historical-roots/build_report.py `
  --masta-pdf "C:\chemin\Masta-1932.pdf" `
  --laurent-pdf "C:\chemin\Laurent-1884.pdf" `
  --words-json "C:\chemin\supabase-live.json"
```

Le fichier `words-json` est un export en lecture seule de la table publique. Le script ne connait aucune cle Supabase et ne peut effectuer aucune ecriture distante.

## Sources numeriques

- Masta : scan McGill conserve par Internet Archive, `McGillLibrary-rbsc_abenaki-indian-legends_Ind0446-18027`.
- Laurent : exemplaire numerise de 1884, identifiant Internet Archive `newfamiliaraben00laurgoog`; Canadiana `oocihm.08895` permet aussi de verifier les images.

