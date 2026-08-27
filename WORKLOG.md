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

- Retrait de la reconnaissance automatique et de ses pourcentages : Chrome interprétait l’aln8ba avec un modèle français et pouvait valoriser une transcription française sans rapport avec la prononciation. Le microphone sert désormais uniquement à un enregistrement local temporaire que la personne réécoute et compare au guide; aucun son, profil vocal, texte ou score n’est sauvegardé.
- Les préfixes personnels `N'/Nd'`, `K'/Kd'` et `W'/Wd'` restent liés au mot dans le guide vocal : l'apostrophe ne provoque plus une pause ni l'épellation de lettres séparées, notamment dans `Nd'aliwizi`.
- Correction générale du W devant consonne dans le guide synthétique : un O simple et continu est maintenant envoyé à la voix française afin qu'il reste perceptible dans Akwbi et les groupes comparables; les cartes rappellent la règle « W = O doux ».
- Priorité donnée aux enregistrements natifs lorsqu'ils existent.
- Ajout d'un guide synthétique explicitement présenté comme approximatif.
- Le parcours compte les exemples réellement enregistrés sans prétendre reconnaître automatiquement la langue.
- Arrêt automatique du microphone et absence de sauvegarde des enregistrements vocaux.
- Application des repères CH vers TS, J vers DZ, 8 nasal, W et I au guide synthétique.
- Fluidification des mots et protection du premier phonème contre les coupures audio.
- Séparation du découpage visuel et de la parole : le guide documenté détermine les sons, mais la synthèse reçoit un mot continu, sans coupures syllabiques; l'orthographe complète sert de repli lorsqu'aucun guide n'existe.
- Ajout d'une écoute lente.
- Séparation de deux formes auparavant confondues : `8h8`, le oui clair, et le `h8` historique, murmuré collectivement en conseil et conservé aux Archives. Le collecteur natif ne réutilise aucun ancien guide synthétique pour ces formes.
- Stabilisation du groupe 8K dans le guide synthétique : le repère visible « an-k » reste inchangé, tandis que l'orthographe technique envoyée à la voix française préserve la voyelle nasale suivie du son K.
- Protection des 61 finales en -ak contre la coupure du K par la synthèse française; les cartes rappellent aussi que 8 est une voyelle nasale entre « an » et « on », et non un simple « an » français.
- Protection de la suite 8w8 dans le repli synthétique : les deux voyelles nasales restent audibles et le W forme une liaison continue, sans pause ni syllabe « ou » autonome; le guide visible est explicitement qualifié d'approximatif lorsqu'aucune prononciation documentée n'est fournie.
- Protection des finales en `t` contre leur disparition dans la synthèse française; le cas historique `Ali-paskuat` reçoit en plus une commande vocale ciblée qui conserve le groupe `kw` continu et le `t` audible, sans modifier sa graphie de 1884 ni présenter son guide approximatif comme une attestation.
- Arrêt manuel ou automatique fiabilisé, durée d'écoute adaptée à la longueur du mot et libération des enregistrements temporaires dès qu'ils ne servent plus à la réécoute locale.
- Les exercices isolés `CH → TS` et `J → DZ` envoient désormais une syllabe technique continue à la voix française, afin d'éviter l'épellation lettre par lettre de `tsa` et `dza`; le guide visible demeure inchangé.
- `Almos` conserve son guide documenté `al-mos`, mais reçoit une commande synthétique ciblée qui maintient le `A`, le `O` et le `S` final sans étendre cette exception aux autres mots en `-os`.
- Le repli sans guide ne transforme plus tous les `O` en `OU` : le `O` ordinaire reste celui de « zéro », tandis que seules les exceptions documentées `-on` et `oz` deviennent respectivement `-oun` et `auz`.
- Les phrases sans guide qui commencent par `T8ni` réutilisent maintenant le guide documenté `to-ni` de l'entrée isolée, au lieu du repli générique `tanné`.
- `Kiona` reçoit une orthographe strictement technique continue utilisant le digramme français `au` pour faire entendre le `O` de « zéro » et le `A` final, sans changer la forme affichée ni la base.

## Moteur de reconnaissance aln8ba

- Création d'une filière séparée `speech-recognition/` pour entraîner un futur adaptateur ASR de langue `abe`, sans passer par un modèle français.
- Audit de la base : aucune entrée active ne possède encore d'enregistrement natif relié au mot; le modèle public MMS-1B-all ne contient pas `abe` dans sa liste ASR publiée.
- Export en lecture seule de 412 formes vertes actuelles; les formes historiques, orange, rouges, construites, en attente et `__version__` sont exclues du lexique vocal.
- Validation obligatoire du consentement, de la révision humaine, du dialecte, du format WAV et de l'appartenance au lexique avant qu'un clip puisse entrer dans le corpus.
- Séparation déterministe des ensembles par locuteur, jamais par clip, afin qu'une même voix ne puisse pas gonfler artificiellement les résultats de test.
- Ajout d'un garde-fou lexical commun à JavaScript et Python : les formes courtes exigent une sortie exacte et toute ambiguïté reste non résolue.
- Ajout d'un service d'inférence qui refuse de démarrer sans modèle entraîné, exige un consentement `one-shot`, supprime le fichier temporaire et ne produit aucun score de prononciation non calibré.
- Dix-sept tests automatisés couvrent les caractères aln8ba, les ambiguïtés, le consentement, le WAV, l'interface de collecte, le vocabulaire CTC et l'absence de fuite de locuteur.
- Ajout d'un enregistreur administrateur directement sur chaque forme verte actuelle : consentement explicite avant l'ouverture du micro, conversion WAV mono 16 kHz, réécoute, conservation privée dans le navigateur, téléchargement et export du manifeste JSONL.
- Ajout du même accès vocal directement dans la fenêtre `Modifier le mot`, en haut et dans le formulaire, pour que la collecte soit impossible à manquer.
- Remplacement du parcours à plusieurs fenêtres par une collecte rapide : un toucher sur le micro démarre la prise, une petite barre fixe permet de l'arrêter, puis le WAV est validé et conservé automatiquement; le consentement n'est demandé qu'à la première prise.
- Les prises conservées par Guillaum sont marquées comme validées par le locuteur après réécoute; cette validation sert au corpus de travail sans être présentée comme une attestation professionnelle externe.

## Avertissement public

- Ajout d'un avertissement obligatoire à chaque chargement du site.
- Mention claire du caractère personnel, non officiel et non validé professionnellement du projet.
- Blocage de la consultation jusqu'à la confirmation explicite du visiteur.
- Rappel que rien ne doit être tenu pour acquis et que chaque élément doit être vérifié auprès de sources fiables et de personnes compétentes.
- Harmonisation de la page À propos avec le statut personnel, non officiel et non attesté du projet; retrait d'une instruction médicale concrète au profit d'une mise en garde de santé neutre.

## Chansons ajoutées le 27 août 2026

- Ajout des fichiers fournis `Skweda Le feux (1).mp3` et `Askwa yudali.mp3`, avec leurs pochettes intégrées, au lecteur musical persistant.
- Affichage des paroles en graphie aln8ba du dictionnaire, séparée du guide phonétique contenu dans les fichiers Suno.
- Classement de `Skweda` comme création moderne à valider; `Kowanodana` conserve sa graphie historique et son statut de vocable non traduit chez Masta (1932).
- Réintégration d'`Askwa yudali` comme archive artistique demandée par l'auteur, avec avertissement visible sur les six lignes qui demeurent linguistiquement incertaines.
- Vérification dans Chrome des deux lectures, du changement exclusif de piste, du lecteur persistant et de l'ouverture des paroles; contrôle statique des règles mobiles, des cibles tactiles, des fichiers audio et des identifiants HTML.

## Archives : famille historique `-aldam-`

- Retrait de la fausse modernisation automatique fondée uniquement sur une traduction française semblable.
- `Wanaldozik` et `Wanalmomuk` sont présentés selon leur analyse documentée comme infinitifs historiques, respectivement avec objet inanimé et objet animé, dans la même famille radicale `-aldam-`; ils ne sont pas remplacés par `N'wanaldam`.
- `N'wanaldam` demeure une autre entrée apparentée; l'absence d'une entrée portant exactement la même fonction dans le projet ne signifie pas que la forme documentée par Laurent n'est plus utilisée.
- Toutes les cartes historiques de sens connu montrent désormais leur catégorie grammaticale et leur source; les rapprochements automatiques sont qualifiés d'autres entrées de sens proche, jamais de formes modernes équivalentes.
- La présentation précise que les formes de Laurent et Masta ne sont pas automatiquement abandonnées : une grande partie de leurs mots et de leurs constructions demeure pertinente aujourd'hui.
- Sur les fiches ordinaires, l'étiquette automatique « forme 1884, à valider dans l'usage actuel » devient « source 1884 »; son aide précise que la date seule ne prouve jamais qu'une forme n'est plus utilisée.
- `Kdakinna` est promue à l'affichage actif comme forme actuelle signalée par Guillaum Labrecque-Houle, sans écriture dans Supabase; elle est reliée à `Ndakina` et enseigne la distinction entre le `k-` inclusif et le `n-` exclusif.
- Le Décortiqueur relie fortement `Nodab8nkad` (Masta), `Nodab8nkat` (Manuel actuel) et `Ab8n` : `nod-` celui qui fait habituellement, `ab8n` le pain, `-kad / -kat` celui qui produit par métier.
- Les paradigmes `Kdakinna / Ndakina` et `Nodab8nkad / Nodab8nkat / Ab8n` possèdent une décomposition explicite et sourcée. Pour tout autre mot, une suite de lettres commune est désormais présentée comme ressemblance graphique à vérifier, jamais automatiquement comme « même racine ».
- Une forme d'archive dont le sens est directement cité n'est plus décrite comme « sens non pleinement attesté » dans le Décortiqueur; l'outil distingue désormais attestation de source et confirmation d'un usage particulier.

## Verbes et temps documentés

- Retrait du conjugueur génératif qui ajoutait automatiquement préfixes, passé, futur, conditionnel, négation et impératif à 17 radicaux; aucune de ces formes calculées n'est encore présentée au public.
- Remplacement par trois tableaux fermés : le présent actuel documenté de `Michi`, le paradigme historique de `Aimuk`, puis une comparaison entre `N'namih8` et `Namihômuk` chez Laurent (1884).
- Le Manuel actuel confirme `N'namih8 sips`. Dans le tableau comparatif, la racine historique `namihô-` est donc écrite `namih8-`, mais les terminaisons de Laurent restent intactes : `K'namih8bôb`, par exemple, conserve le `ô` de `-bôb`. La graphie originale `K'namihôbôb` demeure indiquée dans la note de source.
- Les formes historiques restent dans les exercices de reconnaissance; la production écrite exige uniquement des formes actuelles documentées par le Manuel.
- Lorsqu'un temps n'est pas documenté dans le module, l'interface montre explicitement le manque au lieu de compléter la case par analogie.
- La leçon de cégep compare la personne, le nombre et le temps dans deux classes verbales; elle explique que `-b` et `-ji` sont des contrastes lisibles dans ces tableaux, pas des recettes universelles.
- Ajout d'exercices de reconnaissance et d'écriture qui demandent d'identifier le paradigme, la personne, le nombre et le temps avant de reproduire une forme historique exacte.
- Le nombre et l'ordre des modules restent inchangés afin de préserver la progression locale déjà enregistrée par chaque visiteur.

## Nombres expliqués par étapes

- Remplacement du tableau condensé par cinq étapes repliables : bases 0 à 10, nombres 11 à 19, dizaines et `taba`, centaines et milliers, puis accord avec un nom.
- « Un mot propre » est remplacé par « une forme entière à mémoriser » afin d'éviter la confusion avec un nom propre.
- Le calculateur montre désormais chaque bloc, sa valeur et la règle employée; il distingue une forme complète documentée d'une construction guidée par une règle documentée.
- Correction d'une faille où les nombres supérieurs à 9 999 pouvaient produire `undefined`. Les valeurs de 10 000 à 999 999 sont refusées tant qu'une construction complète n'est pas documentée; `Kchi ngwed8mkwaki` demeure disponible comme forme complète de 1 000 000.
- Ajout d'exemples rapides et d'un résultat annoncé aux technologies d'assistance, avec une disposition mobile en une seule colonne.

## Principe pour la suite

Chaque amélioration doit rester petite, vérifiable et réversible. Les choix
linguistiques qui dépassent les formes documentées doivent être soumis à une
personne compétente avant d'être présentés comme établis.
