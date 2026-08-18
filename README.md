# Dictionnaire Aln8ba8dwaw8gan — Wôlinak

Site web du dictionnaire numérique vivant de l'abénakis de l'Ouest,
dialecte de Wôlinak — un projet de revitalisation linguistique de la
Première Nation Abénakise de Wôlinak.

**Dépôt privé.** Le code du site seulement se trouve ici.

## Règle d'or

Les **données** du dictionnaire (les mots, les gloses, les exemples)
ne vont **jamais** dans ce dépôt. Elles vivent dans la base Supabase.
Le `.gitignore` bloque les exports de données (`*.json`, `*.csv`,
sauvegardes). Ne pas contourner cette règle.

## En ligne

Le site est hébergé sur gestionsha.gt.tc.

## DANGER — à savoir avant de toucher au code

- Le front-end contient une logique dans `loadWords()` qui **efface
  la base** si `DATA_VERSION` ne correspond pas. Ne jamais modifier
  cette logique sans validation explicite.
- L'entrée `id = "__version__"` dans la base ne doit jamais être
  modifiée et doit être exclue de tout traitement par lot.

© 2026 Guillaum Houle — Première Nation Abénakise de Wôlinak.
Tous droits réservés.
