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

- Révision des formulations trop absolues dans le parcours : les graphies historiques et les badges internes sont présentés comme des indices documentaires, jamais comme une certification de la prononciation, du sens ou de l'usage actuel.
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
- Invalidation immédiate d'un ancien résultat dès que la phrase source change, afin qu'aucune nouvelle entrée ne puisse sembler associée à une traduction périmée; ajout du raccourci Ctrl ou Cmd + Entrée.
- Sécurisation des patrons de présentation : un prénom doit être explicite et ne peut plus absorber la suite d'une phrase; une question contenant simplement « comment » et « appeler » ne peut plus être confondue avec « Comment t'appelles-tu? ».
- Reconnaissance de plusieurs phrases complètes documentées dans un même texte, en les traduisant et en les affichant séparément sans construire de nouvelle syntaxe.
- Tolérance prudente aux fautes françaises dans les phrases documentées : même nombre de mots, correction limitée, résultat unique, correction visible et copie désactivée.
- Protection des noms propres placés dans une phrase afin que la tolérance orthographique ne les transforme plus en mots courants proches.
- Exclusion explicite des prénoms capitalisés de la correction automatique des phrases documentées.
- Mise en valeur des propositions complètes actuelles reconnues à l'intérieur d'un texte partiellement inconnu : elles apparaissent comme résultats documentés, tandis que les fragments manquants restent non assemblés et la copie globale demeure désactivée.
- Même traitement dans le sens aln8ba vers français pour les formes verbales personnelles qui constituent une proposition complète en un seul mot, comme `Nd'aloka`.

## Jeux et exercices

- Les niveaux de Pratique utilisent désormais des banques distinctes : vocabulaire court du quotidien au Débutant, monde proche à l'Intermédiaire, puis actions, temps, territoire et grammaire en production avancée; les mots très longs ne peuvent plus tomber au niveau 1.
- Les choix de reconnaissance affichent le sens principal documenté sans y mêler une longue note explicative, et les distracteurs restent dans la banque de difficulté courante.
- Les réponses françaises écrites ne valident plus un fragment arbitraire de trois lettres : elles acceptent le sens documenté complet ou une variante explicitement séparée, avec tolérance aux accents et aux articles.
- Après chaque réponse, la page amène automatiquement le bouton Suivant dans la zone visible s'il se trouve sous l'écran; le comportement couvre les quiz des modules, les jeux et les niveaux de pratique, tout en respectant la préférence de mouvement réduit.
- À la fin de Retenir, chaque module disposant d'une banque de mots propose directement l'étape Utiliser pour écrire les mots de mémoire; le passage au module suivant n'est suggéré qu'après ce parcours.
- Filtrage des questions selon le niveau et les formes actives.
- Exclusion des fiches de règle, suffixes et métadonnées des réponses et distracteurs.
- Correction des distracteurs, répétitions, scores et retours pédagogiques.
- Sécurisation de l'ensemble des jeux contre les banques trop petites ou incomplètes.
- Correction du diminutif Awassosis dans les exercices concernés.
- Stabilisation du quiz de traduction et synchronisation du score visible.
- Parcours complet des banques de Jeux avant toute répétition d'un mot, d'une négation, d'un pluriel ou d'une famille.

## Pratique vocale

- Les préfixes personnels `N'/Nd'`, `K'/Kd'` et `W'/Wd'` restent liés au mot dans le guide vocal : l'apostrophe ne provoque plus une pause ni l'épellation de lettres séparées, notamment dans `Nd'aliwizi`.
- Correction générale du W devant consonne dans le guide synthétique : un O simple et continu est maintenant envoyé à la voix française afin qu'il reste perceptible dans Akwbi et les groupes comparables; les cartes rappellent la règle « W = O doux ».
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
- Protection de la suite 8w8 dans le repli synthétique : les deux voyelles nasales restent audibles et le W forme une liaison continue, sans pause ni syllabe « ou » autonome; le guide visible est explicitement qualifié d'approximatif lorsqu'aucune prononciation documentée n'est fournie.
- Protection des finales en `t` contre leur disparition dans la synthèse française; le cas historique `Ali-paskuat` reçoit en plus une commande vocale ciblée qui conserve le groupe `kw` continu et le `t` audible, sans modifier sa graphie de 1884 ni présenter son guide approximatif comme une attestation.
- Comparaison de dix hypothèses distinctes de reconnaissance afin de mieux couvrir les variations de voix et de transcription sans établir de profil vocal.
- Séparation des tolérances d'écriture et des sons obligatoires : une transcription ambiguë de `CH` ou `J` ne confirme plus automatiquement `TS` ou `DZ`, et l'absence d'une consonne finale documentée empêche un résultat vert.
- Les sons critiques proviennent toujours du guide affiché; une graphie secondaire plus permissive ne peut plus contourner cette exigence.
- Arrêt manuel ou automatique fiabilisé, durée d'écoute adaptée à la longueur du mot et libération des enregistrements temporaires dès qu'ils ne servent plus à la réécoute locale.
- Reformulation du résultat comme « transcription proposée par Chrome », avec nombre d'hypothèses comparées, diagnostic du son manquant et rappel qu'il ne s'agit pas d'une validation linguistique officielle.
- Les exercices isolés `CH → TS` et `J → DZ` envoient désormais une syllabe technique continue à la voix française, afin d'éviter l'épellation lettre par lettre de `tsa` et `dza`; le guide visible demeure inchangé.

## Avertissement public

- Ajout d'un avertissement obligatoire à chaque chargement du site.
- Mention claire du caractère personnel, non officiel et non validé professionnellement du projet.
- Blocage de la consultation jusqu'à la confirmation explicite du visiteur.
- Rappel que rien ne doit être tenu pour acquis et que chaque élément doit être vérifié auprès de sources fiables et de personnes compétentes.
- Harmonisation de la page À propos avec le statut personnel, non officiel et non attesté du projet; retrait d'une instruction médicale concrète au profit d'une mise en garde de santé neutre.

## Principe pour la suite

Chaque amélioration doit rester petite, vérifiable et réversible. Les choix
linguistiques qui dépassent les formes documentées doivent être soumis à une
personne compétente avant d'être présentés comme établis.
