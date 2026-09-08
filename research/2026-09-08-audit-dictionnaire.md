# Audit du dictionnaire — 8 septembre 2026

Cet audit technique et éditorial ne constitue pas une validation linguistique externe. Il ne reproduit pas la conversation privée à l’origine de la correction.

## Correction explicite : Iotali

L’auteur du projet demande de retenir **Iotali — Ici**, à la place de la graphie erronée de la fiche `mst287`.

- Correction appliquée par la couche existante de présentation des données, au chargement distant comme au rechargement d’une ancienne copie locale. L’identifiant est conservé pour les favoris et références. Une requête directe à Supabase conserve encore la donnée brute : aucune écriture distante de corpus n’a été effectuée pendant cet audit.
- Ancienne attribution bibliographique retirée de cette fiche corrigée : Iotali n’est pas faussement attribué à Masta par un simple remplacement de lettres.
- Ni prononciation synthétisée, ni paradigme, ni phrase de tatouage ajoutés à partir du mot isolé.
- Exemple de cours, quiz et correspondance lexicale interne mis à jour. Les liens entre fiches ciblent Iotali.
- L’ancien assemblage `lau_yudali_als` reste en archive, explicitement identifié comme assemblage interne et citation non vérifiée. Il n’est pas réécrit sous le nom d’une source historique.
- Les enregistrements et titres artistiques originaux restent intacts. Les paroles anciennes concernées sont signalées comme non corrigées dans l’audio et ne sont plus présentées comme la graphie du dictionnaire.

## Graphies à revoir, sans conversion automatique

Lecture publique paginée : **1 476 fiches**. Le relevé lexical initial, après exclusion des archives, corpus, sens inconnus et fiches techniques, comprenait 1 106 entrées, dont 64 avec `u`. Ce relevé brut inclut la fiche corrigée et des noms propres; ce n’est pas un décompte d’erreurs.

Après application de la correction et des exclusions de contrôle, **60 graphies** reçoivent le signal compact « graphie à revoir ». Elles restent consultables, mais le sélecteur central des banques automatiques ne les considère plus comme sûres pour les exercices. Le signal ne fournit ni une nouvelle graphie ni une condamnation de la transcription historique.

| Priorité | Fiche | Motif de vérification |
| --- | --- | --- |
| Yugik | `mst236` | Même amorce `yu`; graphie actuelle à demander. |
| Yugalta | `nds006` | Même amorce `yu`; provenance d’un texte chanté à relire. |
| Mkuigen | `lsn025` | Coexiste avec Mkwigen; la note annonce un décodage par soustraction. Ne pas fusionner sans vérifier le sens et la source. |
| Amku | `lsn003` | La note prétend isoler cette forme d’un segment plus long. Vérifier transcription et découpage. |
| Wkeskouan | `corp002` | Séquence `ou` dans une graphie attribuée à Laurent; comparer source et écriture actuelle. |
| Paakuin8gwzian | `lau_paakui` | Forme réutilisée dans des salutations et contenus; vérifier son écriture actuelle. |

Ouabmaska et les autres noms propres ne sont pas transformés. Les guides de prononciation en français peuvent comporter `ou` sans que cela signale une erreur du mot aln8ba. Les titres français de fiches techniques ne sont pas analysés comme des mots aln8ba.

Les sources mentionnées dans les fiches ont été relevées, pas revérifiées sur l’ensemble des fac-similés. Les rapprochements ci-dessus demeurent des pistes de révision humaine.

## Vérificateur de saisie

L’ancienne règle assimilait des accents, dont le tréma, à une faute certaine. Elle contredisait notamment la graphie `nd’aïbna` transmise par l’utilisateur. Les signes sont désormais conservés, sans certification automatique de la graphie. Les autres contrôles de saisie restent actifs.

## Correctifs issus de l’audit d’utilisation

- Recherche : plus de correspondances dues aux seules notes ou explications grammaticales; recherche limitée aux mots et traductions; correspondances exactes prioritaires, y compris un sens précédé d’un article; accents et apostrophes tolérés sans modifier les données; langues distinguées; tri des dates incomplet toléré.
- Navigation : filtre alphabétique conservé après changement de vue; titres des cartes accessibles au clavier; détails masqués jusqu’à action, favoris indépendants, focus conservé après rendu.
- Accueil : ne disparaît pas automatiquement; accès clavier aux sources et au bouton d’entrée.
- Progression : listes simples par quatre lignes; animaux en six petits groupes, puis bilan; nature séparée en introduction, ciel, paysage et sol; reprise de la halte et de l’étape; meilleures notes anciennes et nouvelles fusionnées.
- Difficulté : morphologie facultative au début; classe des noms avant couleurs; quiz restreints à la halte; jeux de vocabulaire limités aux formes introduites dans les passages atteints.
- Fiabilité : aucun faux succès de suggestion/édition; publication confirmée avant nettoyage des propositions; suppressions vérifiées; doubles soumissions bloquées; import décrit et exécuté comme fusion; synchronisation arrêtée au premier refus.
- Chargement : commandes publiques branchées sans attendre l’authentification; état de chargement distinct de zéro résultat; délai limite et bouton Réessayer; maintien du cache en cas d’échec; favoris corrompus et stockage refusé ne bloquent plus l’ouverture.
- Mise à jour : notification discrète et actualisation volontaire; aucun nettoyage des caches d’autres sites de la même origine; retrait de la réécriture répétée des URL de médias.

## Vérifications et limites

**174 tests réussis**, dont des tests exécutant les véritables fonctions avec réponses réseau simulées. Aucune contribution factice n’a été envoyée à la base.

Le script `speech-recognition/tools/audit-orthography.mjs` lit les données publiques sans les exporter ni les modifier. Résultat : une seule fiche Iotali, aucune ancienne fiche autonome « ici » dans la présentation corrigée, 60 signalements et zéro signalement accepté par `isExerciseSafe`.

Essais partiels dans Chrome sur ordinateur : accueil au clavier, lettre M, cartes repliées, recherche, affichage de quatre animaux à la fois. L’outil Chrome a ensuite refusé l’action en signalant un manque de crédits; les derniers essais mobiles et le parcours complet après toutes les corrections ne sont donc pas revendiqués comme vérifiés visuellement.

Les tableaux historiques complexes, les banques particulières des marches illustrées, la justesse linguistique de tout le corpus et les politiques serveur Supabase ne sont pas intégralement audités. La protection des écritures côté serveur n’est pas remplacée par les contrôles du navigateur.
