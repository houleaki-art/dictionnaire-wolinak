# Journal de travail

Ce document conserve la trace du développement continu du dictionnaire
Aln8ba8dwaw8gan.

> Important : ce journal décrit un processus de travail informatique et
> éditorial. Il ne constitue pas une attestation linguistique, professionnelle,
> communautaire ou officielle. Les formulations des anciens jalons reflètent
> l'état du projet au moment où elles ont été écrites et ne doivent pas être
> interprétées comme des validations.

Le journal ne reproduit aucune ancienne version du code ni aucune ancienne
banque de données. Il conserve seulement les grandes étapes du travail.

## Fondation et sécurité

- Création initiale du site du dictionnaire, avec le code séparé des données.
- Sécurisation de l'administration avec Supabase Auth et retrait du PIN en clair.
- Ajout de l'avis de droit d'auteur.
- Ajout des sections Apprendre et Jeux au menu mobile.
- Retrait du jeu de données embarqué afin d'utiliser une source de données unique.
- Nettoyage de doublons et amélioration de la gestion du cache.
- Désactivation de l'autocorrection et des majuscules automatiques dans la connexion administrateur mobile.
- Correction d'une vulnérabilité XSS dans les suggestions et le panneau d'administration.

## Parcours d'apprentissage

- Création des modules du primaire avec Retenir, Utiliser, écriture et révision espacée.
- Développement des parcours du secondaire et du cégep.
- Ajout d'un accompagnement pédagogique dans les leçons.
- Regroupement des anciens onglets d'entraînement dans un parcours plus cohérent.
- Intégration des cartes mémoire et des jeux directement dans les niveaux.
- Ajout des repères de prononciation W et I au module des sons.
- Correction progressive des leçons, des exemples et des exercices actifs.
- Exclusion des formes historiques des exercices actifs.
- Ajout de la pratique vocale, du suivi de progression et d'un repli sans score.
- Amélioration de l'accessibilité des scores et des retours de réponse.
- Séparation des banques de chaque leçon afin que quiz, cartes et pratique vocale portent sur son contenu propre; les modules d'approfondissement excluent les mots déjà enseignés plus tôt dans la même catégorie.
- Contextualisation des exercices répétés du secondaire et élimination des questions identiques au cours d'une même séance pour les banques fixes.
- Séparation des deux exercices de familles du cégep entre dérivations documentées et alternances de bases verbales documentées.
- Ajout d'une explication sujet-action-objet et de contextes comparés pour les formes choisies selon la classe grammaticale de l'objet.

## Archives et prudence linguistique

- Séparation des formes historiques du dictionnaire moderne.
- Création d'une vue Archives dédiée aux formes anciennes.
- Regroupement des variantes historiques et amélioration de leur contexte.
- Exclusion des archives, fragments et entrées sans sens établi des exercices actifs.
- Clarification des classes grammaticales animé et inanimé sans interprétation philosophique.
- Limitation des pluriels actifs aux paires documentées retenues par le projet.
- Séparation stricte du jeu des pluriels et du jeu des familles morphologiques.

## Traducteur

- Développement progressif de la traduction de mots et de fragments.
- Ajout de la correspondance par phrases complètes documentées avant l'analyse des fragments.
- Ajout de patrons de phrases, de synonymes, de lemmes et d'explications grammaticales.
- Ajout d'une tolérance aux fautes de frappe et d'indications de couverture.
- Exclusion des formes historiques et des entrées non actives.
- Suppression des fausses traductions obtenues par assemblage de fragments incomplets.
- Retrait des exemples consultatifs des banques actives.
- Amélioration des locutions reconnues dans les phrases longues.

## Jeux et exercices

- Filtrage des questions selon le niveau et les formes actives.
- Exclusion des fiches de règle, suffixes et métadonnées des réponses et distracteurs.
- Correction des distracteurs, répétitions, scores et retours pédagogiques.
- Sécurisation de l'ensemble des jeux contre les banques trop petites ou incomplètes.
- Correction du diminutif Awassosis dans les exercices concernés.
- Stabilisation du quiz de traduction et synchronisation du score visible.
- Parcours complet des banques de Jeux avant toute répétition d'un mot, d'une négation, d'un pluriel ou d'une famille.

## Pratique vocale

- Priorité donnée aux enregistrements natifs lorsqu'ils existent.
- Ajout d'un guide synthétique explicitement présenté comme approximatif.
- Ajout de la reconnaissance tolérante, de la transcription et d'un score pédagogique.
- Arrêt automatique du microphone et absence de sauvegarde des enregistrements vocaux.
- Application des repères CH vers TS, J vers DZ, 8 nasal, W et I au guide synthétique.
- Fluidification des mots et protection du premier phonème contre les coupures audio.
- Séparation du découpage visuel et de la parole : le guide documenté détermine les sons, mais la synthèse reçoit un mot continu, sans coupures syllabiques; l'orthographe complète sert de repli lorsqu'aucun guide n'existe.
- Ajout d'une écoute lente.
- Correction de 8h8 afin de le guider comme un « hon-hon » murmuré.
- Stabilisation du groupe 8K dans le guide synthétique : le repère visible « an-k » reste inchangé, tandis que l'orthographe technique envoyée à la voix française préserve la voyelle nasale suivie du son K.
- Protection des 61 finales en -ak contre la coupure du K par la synthèse française; les cartes rappellent aussi que 8 est une voyelle nasale entre « an » et « on », et non un simple « an » français.

## Avertissement public

- Ajout d'un avertissement obligatoire à chaque chargement du site.
- Mention claire du caractère personnel, non officiel et non validé professionnellement du projet.
- Blocage de la consultation jusqu'à la confirmation explicite du visiteur.
- Rappel que rien ne doit être tenu pour acquis et que chaque élément doit être vérifié auprès de sources fiables et de personnes compétentes.

## Principe pour la suite

Chaque amélioration doit rester petite, vérifiable et réversible. Les choix
linguistiques qui dépassent les formes documentées doivent être soumis à une
personne compétente avant d'être présentés comme établis.
