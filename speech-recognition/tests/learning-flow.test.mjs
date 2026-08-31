import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(here, '..', '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

function sourceBetween(start, end) {
  const from = html.indexOf(start);
  const to = html.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `bloc introuvable: ${start}`);
  return html.slice(from, to);
}

test('la reponse ecrite ignore casse, espaces, apostrophes et ponctuation', () => {
  const source = sourceBetween('function aprNorm', 'function aprSrc');
  const aprNorm = new Function(`${source}; return aprNorm;`)();
  assert.equal(aprNorm('t8ni aliwizian'), aprNorm('T8ni aliwizian?'));
  assert.equal(aprNorm("T8ni kd'aliwizian"), aprNorm('t8ni-kd’aliwizian!'));
  assert.notEqual(aprNorm("T8ni kd'aliwizian"), aprNorm('T8ni aliwizian?'));
  assert.notEqual(aprNorm('t8ni aliwizian'), aprNorm('toni aliwizian'));
  assert.match(html, /Le <b>8 est une lettre importante<\/b> et doit être écrit/);
});

test('une bonne reponse simple avance seule mais une explication reste a lire', () => {
  const source = sourceBetween('function finishAnsweredStep', '// ── NIVEAU 1');
  assert.match(source, /if\(!correct\)\{scrollToNextAction\(scopeSelector\);return;\}/);
  assert.match(source, /learningContent/);
  assert.match(source, /Suivant après lecture/);
  assert.match(source, /Explication importante/);
  assert.match(source, /Question suivante automatiquement/);
  assert.match(source, /setTimeout/);
  assert.match(html, /finishAnsweredStep\(correct,'#pratArena',nextQ\)/);
  assert.match(html, /finishAnsweredStep\(correct,'#exBody',exSuivant\)/);
  assert.match(html, /finishAnsweredStep\(correct,'#jBody',jNext\)/);
  assert.match(html, /class="prat-example-note"/);
  assert.match(html, /class="prat-grammar-note"/);
});

test('le defilement reserve la hauteur du lecteur musical', () => {
  const source = sourceBetween('function fixedBottomInset', 'let answerAdvanceTimer');
  assert.match(source, /musicDock/);
  assert.match(source, /fixedBottomInset\(\)/);
  assert.match(source, /viewportBottom/);
});

test('les modules ne proposent plus de diction vocale', () => {
  const lesson = sourceBetween('function aprLecon', 'function aprDecorView');
  const vocabulary = sourceBetween('function exVocab', 'function exRetVocab');
  assert.doesNotMatch(lesson, /Pratique vocale|aprVoice/);
  assert.doesNotMatch(vocabulary, /Écouter|voiceListenExercise|playApprovedWordAudio/);
});

test('la deuxieme personne interrogative est enseignee sans regle inventee', () => {
  assert.match(html, /La deuxième personne interrogative/);
  assert.match(html, /forme en <b>-an<\/b>/);
  assert.match(html, /préfixe <b>kd'-<\/b> conservé/);
  assert.match(html, /ex:'inter2'/);
  assert.match(html, /inter2:exInter2/);
  assert.match(html, /w\.id==='man_r02'/);
  assert.match(html, /INTERROGATIVE_FORM_NOTES/);
  assert.match(html, /deuxième personne interrogative',\s*notes:/);
  const search = sourceBetween('function filtered()', "// ── Ordre d'affichage");
  assert.match(search, /w\.grammar,w\.notes/);
});

test('le quiz interrogatif utilise seulement les contrastes documentes', () => {
  const source = sourceBetween('const EXINTER2', 'function exInter2');
  const questions = new Function(`${source}; return EXINTER2;`)();
  assert.equal(questions.length, 7);
  for (const form of ['T8ni aliwizian?', 'T8ni alosan?', 'T8ni wigian?',
    "Kagwi k'michi?", "T8ni kd'al8wzin?", "K'kasigadma?"]) {
    assert.ok(questions.some(question => question.p === form), `forme absente: ${form}`);
  }
  const nameQuestion = questions.find(question => question.p === "Comment t'appelles-tu?");
  assert.equal(nameQuestion.o[nameQuestion.r], 'T8ni aliwizian?');
  assert.ok(nameQuestion.o.includes("T8ni kd'aliwizian?"));
});

test("l'ecriture explique aliwizian avant de passer a la suite", () => {
  const normSource = sourceBetween('function aprNorm', 'function aprSrc');
  const analysisSource = sourceBetween('const APR_WRITING_ANALYSES', 'const APR_PREF');
  const analyses = new Function(`${normSource}; ${analysisSource}; return APR_WRITING_ANALYSES;`)();
  const aliwizian = analyses.get('t8nialiwizian');
  assert.equal(analyses.size, 6);
  assert.equal(aliwizian.equation, 'aliwizi + -an → aliwizian');
  assert.equal(aliwizian.parts.at(-1).form, '-an');
  assert.match(aliwizian.explanation, /i \+ an donne ian/);
  assert.match(html, /Pourquoi <span class="al8">aliwizian<\/span> finit par/);
  const writing = sourceBetween('function exWritingGenericNote', '/* — révision espacée');
  assert.match(writing, /APR_WRITING_ANALYSES\.get/);
  assert.match(writing, /exWritingAnalysisAnswer/);
  assert.match(writing, /state\.writingOk&&correct/);
  assert.match(writing, /finishAnsweredStep\(ok,'#exBody',exSuivant,4500\)/);
  assert.match(writing, /Aucun découpage n'est affiché sans analyse documentée/);
});

test('les modules grammaticaux exigent une production ecrite', () => {
  for (const marker of [
    'ex:\'genre\',use:\'genre\'',
    'ex:\'plur\',use:\'plur\'',
    'ex:\'possfam\',use:\'possfam\'',
    'ex:\'conjp\',use:\'conjp\'',
    'ex:\'inter2\',use:\'inter2\'',
    'ex:\'negs\',use:\'neg\'',
    'ex:\'classfx\',use:\'classfx\'',
    'ex:\'vta\',use:\'vta\'',
    'ex:\'temps\',use:\'temps\'',
    'ex:\'ordre\',use:\'ordre\'',
    'ex:\'suf\',use:\'suf\''
  ]) assert.ok(html.includes(marker), `phase Utiliser absente: ${marker}`);
  const mastery = sourceBetween('const APR_LEVEL_PATHS', 'const COACH_TIPS');
  assert.match(mastery, /function aprModuleNeedsUse/);
  assert.match(mastery, /state\.utiliser>=100/);
  const lesson = sourceBetween('function aprLecon', 'function aprDecorView');
  assert.match(lesson, /produis la forme/);
  assert.match(lesson, /ecrisgram/);
});

test('la production grammaticale suit une procedure documentee', () => {
  const writing = sourceBetween('function grammarWritingPool', '/* — révision espacée');
  for (const key of ['genre','plur','possfam','conjp','inter2','neg','classfx','structure','vta','temps','ordre','suf','fam','trad']) {
    assert.match(writing, new RegExp(`key==='${key}'`), `banque absente: ${key}`);
  }
  assert.match(writing, /DOCUMENTED_NEGATION_PARADIGMS\.map/);
  assert.match(writing, /pair=>pair\.oa\.exact&&pair\.oi\.exact/);
  assert.match(writing, /APR_WRITING_ANALYSES\.get/);
  assert.match(writing, /Raisonnement complet/);
  assert.match(writing, /finishAnsweredStep\(ok,'#exBody',exSuivant,6500\)/);
});

test('le parcours affiche les prerequis dans leur ordre pedagogique', () => {
  const path = sourceBetween('const APR_LEVEL_PATHS', 'function aprModulePerfect');
  for (const phase of ['Sons et graphie','Premiers échanges','Monde vivant','Conversation',
    'Nom et classe','Phrase affirmative','Interrogation','Négation','Structure verbale',
    'Temps verbaux','Ordres de conjugaison','Morphologie','Sources','Lecture complète','Transmission']) {
    assert.match(path, new RegExp(phase));
  }
  assert.ok(path.indexOf('Phrase affirmative') < path.indexOf('Interrogation'));
  assert.ok(path.indexOf('Interrogation') < path.indexOf('Négation'));
});

test('chaque module affiche sa mission, sa place et ses formes nouvelles', () => {
  const guide = sourceBetween('const APR_TASK_GUIDES', 'function aprModulePerfect');
  for (const type of ['sons','conversation','dialogue','genre','plur','possfam','conjp','inter2',
    'negs','classfx','day','structure','vta','temps','ordre','neg','suf','fam','sourcecheck',
    'trad','history','evidence']) {
    assert.match(guide, new RegExp(`\\b${type}:\\[`), `guidage absent: ${type}`);
  }
  for (const activity of ['recognize','retrieve','context','mixed']) {
    assert.match(guide, new RegExp(`${activity}:\\[`), `activité de vocabulaire absente: ${activity}`);
  }
  assert.match(guide, /aprEarlierModuleKeys/);
  assert.match(guide, /NIVEAUX\.slice\(0,levelIndex\)\.flatMap/);
  assert.match(guide, /forme.*nouvelle.*dans ce parcours/);
  assert.match(guide, /reprise.*volontairement pour consolider/);
  const lesson = sourceBetween('function aprLecon', 'function aprDecorView');
  assert.match(lesson, /aprModuleGuideHtml\(n,m,i,lecHtml\)/);
});

test('les 45 modules enseignent chacun un principe complet et distinct', () => {
  const source = sourceBetween('const APR_MODULE_CONTRACTS=', 'function aprModuleNeedsUse');
  const contracts = new Function(`${source}; return APR_MODULE_CONTRACTS;`)();
  const library = sourceBetween('const APR_MODULE_LIBRARY', 'const APR_LIBRARY_BY_ID');
  const titles = [...library.matchAll(/\{t:"([^"]+)"/g)].map(match => match[1]);
  assert.equal(titles.length, 45);
  assert.deepEqual(new Set(Object.keys(contracts)), new Set(titles));
  assert.equal(new Set(Object.values(contracts).map(contract => contract.principle)).size, 45);
  for (const [title, contract] of Object.entries(contracts)) {
    assert.ok(contract.principle.trim().length >= 80, `principe trop court: ${title}`);
    assert.equal(contract.steps.length, 3, `trois étapes requises: ${title}`);
    assert.ok(contract.steps.every(step => step.trim().length >= 12), `étape incomplète: ${title}`);
    assert.match(contract.mastery, /^Tu /, `critère observable absent: ${title}`);
  }
  const guide = sourceBetween('function aprModuleGuideHtml', 'function aprModulePerfect');
  assert.match(guide, /APR_MODULE_CONTRACTS\[m\.t\]/);
  assert.match(guide, /Un principe complet/);
  assert.match(guide, /Entraînement qui vérifie ce principe/);
  assert.match(guide, /contract\.mastery/);
});

test('le module des trois ordres avance en trois contrastes avant les approfondissements', () => {
  const lesson = sourceBetween('{t:"Les trois ordres"', '{t:"La négation complète"');
  assert.match(lesson, /1 · Dire un fait/);
  assert.match(lesson, /2 · Donner une consigne/);
  assert.match(lesson, /3 · Poser cette question/);
  assert.match(lesson, /Procédure de lecture/);
  assert.match(lesson, /Approfondir après avoir réussi les trois contrastes/);
  assert.ok(lesson.indexOf('1 · Dire un fait') < lesson.indexOf('Interrogation historique'));
});

test('le parcours contient cinq etapes, 45 modules actifs et preserve la progression existante', () => {
  const library = sourceBetween('const APR_MODULE_LIBRARY', 'const APR_LIBRARY_BY_ID');
  const levels = sourceBetween('const NIVEAUX=', 'function aprProgressKey');
  assert.equal([...library.matchAll(/\{t:"/g)].length, 45);
  const exerciseTypes = [...library.matchAll(/ex:'([^']+)'/g)].map(match => match[1]);
  assert.equal(exerciseTypes.length, 45);
  assert.doesNotMatch(library, /ex:null/);
  for (const [id, title] of [['d','Découverte'],['f','Fondations'],['co','Consolidation'],
    ['a','Approfondissement'],['au','Autonomie']]) {
    assert.match(levels, new RegExp(`id:'${id}',t:'${title}'`));
  }
  assert.match(levels, /progressId:'p',progressOffset:0/);
  assert.match(levels, /progressId:'p',progressOffset:7/);
  assert.match(levels, /progressId:'s',progressOffset:0/);
  assert.match(levels, /progressId:'c',progressOffset:0/);
  assert.match(levels, /progressId:'c',progressOffset:6/);
  assert.match(html, /const APR_EXERCISE_TARGETS=\{d:12,f:24,co:24,a:24,au:24\}/);
  assert.match(html, /exTot=APR_EXERCISE_TARGETS\[aprNiv\]\|\|8/);
  assert.match(html, /la séance s'arrête lorsque sa banque distincte est épuisée/);
  assert.match(html, /aprModuleSessionCapacity\(level,row\.module,row\.index\)/);

  const dispatch = sourceBetween('function exSuivant()', 'function exPickUnique');
  for (const type of new Set(exerciseTypes)) {
    assert.match(dispatch, new RegExp(`${type}:`), `route d'exercice absente: ${type}`);
  }
});

test('les syntheses et les modules de sources ont des exercices distincts', () => {
  const library = sourceBetween('const APR_MODULE_LIBRARY', 'const APR_LIBRARY_BY_ID');
  for (const type of ['conversation','dialogue','day','sourcecheck','history','evidence']) {
    assert.match(library, new RegExp(`ex:'${type}'`), `module absent: ${type}`);
    assert.match(html, new RegExp(`${type}:\\(\\)=>exFixedLesson`), `route absente: ${type}`);
  }
  for (const bank of ['EXCONVERSATION','EXDIALOGUE','EXDAY','EXSOURCECHECK','EXHISTORY','EXEVIDENCE']) {
    const source = sourceBetween(`const ${bank}=`, bank === 'EXEVIDENCE' ? 'let exQ=' : `const ${{
      EXCONVERSATION:'EXDIALOGUE', EXDIALOGUE:'EXDAY', EXDAY:'EXSOURCECHECK',
      EXSOURCECHECK:'EXHISTORY', EXHISTORY:'EXEVIDENCE'
    }[bank]}=`);
    assert.equal([...source.matchAll(/\{q:/g)].length, 6, `banque incomplète: ${bank}`);
  }
});

test('T8ni est enseigne par phrases completes selon le contexte', () => {
  const lesson = sourceBetween('{t:"Lire une phrase complète"', '{t:"Lire des mots construits"');
  assert.match(lesson, /T8ni wigian\?/);
  assert.match(lesson, /peut aussi correspondre à « comment » ou « combien »/);
  assert.match(lesson, /T8ni aliwizian\?/);
  assert.match(lesson, /T8ni kd'al8wzin\?/);
  assert.doesNotMatch(lesson, /T8ni \(où\)/);
  assert.doesNotMatch(html, /T8ni tali wigian/);
});

test('le repertoire verbal affiche seulement des paradigmes documentes', () => {
  const source = sourceBetween('const APR_CONJ_PARADIGMS', 'const NU=');
  const paradigms = new Function(`${source}; return APR_CONJ_PARADIGMS;`)();
  assert.equal(paradigms.length, 3);
  assert.deepEqual(paradigms.map(paradigm => paradigm.columns), [
    ['Personne', 'Présent'],
    ['Personne', 'Présent', 'Imparfait', 'Futur'],
    ['Personne', 'Présent', 'Imparfait', 'Futur']
  ]);
  assert.ok(paradigms[0].rows.some(row => row.includes("N'michi")));
  assert.ok(paradigms[1].rows.some(row => row.includes("N'-d-aibenaji")));
  assert.ok(paradigms[2].rows.some(row => row.includes("N'namih8benaji")));
  assert.ok(paradigms[2].rows.some(row => row.includes("K'namih8bôb")));
  assert.match(paradigms[2].title, /N'namih8/);
  assert.match(paradigms[2].note, /original 1884 K'namihôbôb/);
  assert.match(source, /Cet outil ne calcule aucune forme/);
  assert.match(source, /Aucune forme passée ou future de Michi n'est construite ici/);
  assert.doesNotMatch(source, /APR_VERBES|const F=|applications de règle/);
});

test('les exercices de temps restent dans les tableaux attestes', () => {
  const source = sourceBetween('const EXTEMPS', 'function exTemps');
  const questions = new Function(`${source}; return EXTEMPS;`)();
  assert.ok(questions.length >= 16);
  for (const form of ["N'-d-aib", "N'-d-aibenaji", "'Aoakji", "N'namih8ji", "N'namih8benaji"]) {
    assert.ok(questions.some(question => question.o.includes(form)), `forme absente: ${form}`);
  }
  assert.match(html, /temps:exTemps/);
  assert.match(html, /key==='temps'/);
  const writing = sourceBetween("if(key==='temps')", "if(key==='ordre')");
  assert.match(writing, /N'namih8 sips/);
  assert.match(writing, /N'namito awikhigan/);
  assert.doesNotMatch(writing, /N'namihôji|N'-d-aiji|K'-d-aibob/);
});

test('le calculateur de nombres decompose les blocs sans inventer les grands multiplicateurs', () => {
  const source = sourceBetween('const NU=', 'function aprNombView');
  const tools = new Function(`${source}; return {aprChiffre,aprNombreAnalyse};`)();
  assert.equal(tools.aprChiffre(11), 'Ngwed8kaw');
  assert.equal(tools.aprChiffre(16), 'Ngwed8s kas8kaw');
  assert.equal(tools.aprChiffre(25), 'Nisinska taba N8lan');
  assert.equal(tools.aprChiffre(126), 'Ngwedatgwa Nisinska taba Ngwed8s');
  assert.equal(tools.aprChiffre(2026), 'Nis8mkwaki Nisinska taba Ngwed8s');
  assert.equal(tools.aprChiffre(1000000), 'Kchi ngwed8mkwaki');
  assert.equal(tools.aprChiffre(15000), '—');
  assert.equal(tools.aprNombreAnalyse(15000).safe, false);
  for (const n of [0, 9, 19, 99, 999, 9999]) assert.doesNotMatch(tools.aprChiffre(n), /undefined/);
});

test('le module des nombres enseigne une seule etape a la fois', () => {
  const lesson = sourceBetween('function aprNombView', 'function aprGramView');
  for (const step of ['Étape 1 · Les mots de base','Étape 2 · De 11 à 19',
    'Étape 3 · Les dizaines et le lien taba','Étape 4 · Centaines, milliers et limite du module',
    'Étape 5 · Compter seul ou compter un nom']) assert.match(lesson, new RegExp(step));
  assert.match(lesson, /il ne s'agit pas de noms propres/);
  assert.match(lesson, /aria-live="polite"/);
  assert.match(html, /construction guidée par une règle documentée/);
  assert.match(lesson, /refuse donc 10 000 à 999 999 au lieu d'inventer/);
});

test('le module des couleurs est revenu a sa forme simple sans ancien enrichissement', () => {
  const colors = sourceBetween('{t:"Les couleurs"', '{t:"Qualités et émotions"');
  assert.match(colors, /Six formes verbales documentées/);
  assert.match(colors, /Commence par regarder une chose, puis dis son état/);
  assert.match(colors, /Notre exercice/);
  assert.match(colors, /il ne sert pas à inventer l'étymologie/);
  assert.doesNotMatch(colors, /couleurs-territoire|color-learning|color-observe|Mskikwimen|Observe →/);
  assert.doesNotMatch(colors, /Dix couleurs/);
  for (const word of ['Mkwigen','W8bigen','Mkazawigen','Wl8wigen','Wiz8wigen','Askaskwigen']) {
    assert.match(colors, new RegExp(word));
  }
});

test('les banques automatiques respectent le principe annonce par leur module', () => {
  const description = sourceBetween('{t:"Qualités et émotions"', '{t:"Compter jusqu\'à dix"');
  assert.match(description, /qualité, un état ressenti et le nom d'une émotion/);
  assert.doesNotMatch(description, /Grand, petit, beau/);

  const fauna = sourceBetween('{t:"Les bêtes de chez nous"', '{t:"Mon corps"');
  assert.match(fauna, /!\/esprit\|aulne\/i\.test/);
  assert.match(fauna, /'animal',64/);

  const animalBasics = sourceBetween('{t:"Les animaux"', '{t:"Les bêtes de chez nous"');
  assert.equal([...animalBasics.matchAll(/<td class="k">/g)].length, 24);
  for (const form of ['Awassos','M8lsem','Mgezo','Agaskw','Nolka','Tolba','Almos','Tideso']) {
    assert.match(animalBasics, new RegExp(`<td class="k">${form}</td>`));
  }

  const territory = sourceBetween('{t:"Le territoire"', '{t:"Le temps et les saisons"');
  assert.match(territory, /rivière\|fleuve\|ruisseau\|lac\|baie/);
  assert.match(territory, /lieu\|territoire\|terre\|village/);

  const actions = sourceBetween('{t:"Les actions de tous les jours"', '{t:"Ma première conversation"');
  assert.match(actions, /!\/\(\?:pré\|pre\)\[- \]\?verbe\/i\.test/);
  const autoLesson = sourceBetween('function aprAutoWords', 'function aprGenreReviewLec');
  assert.match(autoLesson, /typeof predicate==='function'/);
  assert.match(autoLesson, /aprAutoWords\(cat,n,undefined,predicate\)/);
});

test('le jeu du territoire relie observation et vocabulaire vert actuel', () => {
  const trailSource = sourceBetween('const TERRITORY_TRAIL', 'let jTrailStep');
  const trail = new Function(`${trailSource}; return TERRITORY_TRAIL;`)();
  assert.equal(trail.length, 7);
  assert.deepEqual(trail.map(stop => stop.target), [
    'Aki', 'W8linaktegw', 'Koa', 'Nolka', 'Mskikwimen', 'Skweda', 'Alakws'
  ]);
  for (const stop of trail) {
    assert.equal(stop.options.length, 4, `quatre choix requis: ${stop.id}`);
    assert.equal(new Set(stop.options).size, 4, `choix distincts requis: ${stop.id}`);
    assert.ok(stop.options.includes(stop.target), `bonne réponse absente: ${stop.id}`);
    assert.match(stop.field, /\S/);
  }
  assert.doesNotMatch(trailSource, /\b(?:Sibo|Sata|Tmakwa)\b/);

  const gameSource = sourceBetween('function jTerritoryStops', 'function jGenre');
  assert.match(gameSource, /new Map\(aprSur\(\)/);
  assert.match(gameSource, /stop\.words\.length===4/);
  assert.match(gameSource, /stops\.length!==TERRITORY_TRAIL\.length/);
  assert.match(gameSource, /Toutes les réponses proposées sont des entrées vertes actuelles/);
  assert.match(html, /d:\['caches'\]/);
  assert.match(html, /f:\['territoire','caches'\]/);
  assert.match(html, /co:\['territoire','genre','negat','plur','caches'\]/);
  assert.match(html, /a:\['genre','negat','plur','fam'\]/);
  assert.match(html, /au:\['territoire','negat','fam'\]/);

  for (const file of [
    'couleurs-territoire.webp',
    'territoire-riviere.webp',
    'territoire-pin-chevreuil.webp',
    'territoire-feu-etoiles.webp'
  ]) {
    const asset = path.resolve(here, '..', '..', 'assets', 'learning', file);
    assert.ok(fs.existsSync(asset), `image pédagogique absente: ${file}`);
    assert.ok(fs.statSync(asset).size < 300_000, `image trop lourde pour le mobile: ${file}`);
  }
});

test('la forme locative wigw8mek reste coherente partout', () => {
  assert.doesNotMatch(html, /wigwomek/i);
  assert.match(html, /Askwa yudali kd'ai, wigw8mek\./);
  assert.match(html, /Nd'ai wigw8mek/);
  assert.match(html, /wigw8mek indique la maison comme lieu/);
});

test('les noms du corps enseignent la possession sans substitution automatique', () => {
  const body = sourceBetween('{t:"Mon corps",d:', '{t:"Le corps en entier"');
  assert.match(body, /Avant les mots : pourquoi la forme porte déjà « mon »/);
  assert.match(body, /Ndep<\/span> « ma tête »/);
  assert.match(body, /K'dup<\/span> « ta tête »/);
  assert.match(body, /Wdep<\/span> « sa tête »/);
  assert.match(body, /dep → dup/);
  assert.doesNotMatch(body, /Change le N pour un K/);
  const fullBody = sourceBetween('{t:"Le corps en entier"', '{t:"Ma famille par générations"');
  assert.match(fullBody, /lec:aprBodyPossessionLec/);
  const grouping = sourceBetween('function aprBodyPossessionLec', 'function aprGenreReviewLec');
  assert.match(grouping, /Avec moi/);
  assert.match(grouping, /Avec lui ou elle/);
  assert.match(grouping, /Avec plusieurs personnes/);
  assert.match(grouping, /une ressemblance n'est pas une règle automatique/i);
});

test('la possession compare des relations attestees et laisse les cases manquantes ouvertes', () => {
  const lesson = sourceBetween('{t:"Qui possède la relation?"', '{t:"La phrase affirmative au présent"');
  for (const form of ['Nigawes','Nnonon','Ndadan','Nid8baskwa','Nid8bana','Kid8bana','Kid8baw8','Wmitogwesa']) {
    assert.ok(lesson.includes(form), `forme absente: ${form}`);
  }
  assert.match(lesson, /Deux façons de dire « notre »/);
  assert.match(lesson, /relation complète n'est pas dans la banque actuelle/);
  assert.match(lesson, /ne permet pas de remplacer automatiquement N par K ou W/);
});

test('la morphologie definit prefixe base et suffixe avant les tableaux', () => {
  const lesson = sourceBetween('{t:"Racines et suffixes"', '{t:"Décomposer un mot"');
  assert.ok(lesson.indexOf('Trois morceaux possibles') < lesson.indexOf('<table class="aprtab">'));
  assert.match(lesson, /Préfixe · avant/);
  assert.match(lesson, /Base ou racine · cœur/);
  assert.match(lesson, /Suffixe · après/);
  assert.match(lesson, /Agakimzowinno/);
  assert.match(lesson, /Odana/);
  assert.match(lesson, /Une addition n'est pas toujours visible/);
});

test("le module de l'arbre utilise seulement sa banque active verifiee", () => {
  const lesson = sourceBetween('{t:"L\'arbre et ses repères"', '{t:"Les plantes et la nourriture"');
  for (const form of ['Abazi', 'Koa', 'Wanibagw', 'Pag8nis']) {
    assert.match(lesson, new RegExp(`<td class="k">${form}</td>`));
  }
  for (const historical of ['Molodagw', 'Senomozi', 'Maskwamozi', 'Mahlakws']) {
    assert.doesNotMatch(lesson, new RegExp(`<td class="k">${historical}</td>`));
  }
  assert.match(lesson, /ne sont\s+pas transformés silencieusement en réponses modernes/);
});

test('le site audite les routes et les banques des 45 modules au chargement', () => {
  const audit = sourceBetween('const APR_EXERCISE_ROUTES', 'function aprModuleNeedsUse');
  assert.match(audit, /function aprLearningRuntimeAudit/);
  assert.match(audit, /aprExerciseCapacity\(module\.ex,module\.cat\|\|'',modulePool\)/);
  assert.match(audit, /moins de trois situations distinctes/);
  assert.match(audit, /const dataPending=!WORDS_REMOTE_READY/);
  assert.match(audit, /route d'exercice absente/);
  assert.match(html, /APR_LAST_AUDIT=aprLearningRuntimeAudit\(\)/);
  assert.match(html, /Contrôle fonctionnel réussi/);
  assert.match(html, /document\.documentElement\.dataset\.learningAudit/);
});

test('le parcours montre la prochaine action et les modules avant les explications', () => {
  const helpers = sourceBetween('function aprModuleNeedsUse', 'const APR_TASK_GUIDES');
  const view = sourceBetween('function aprParcours()', '/* Lance les jeux');
  assert.match(helpers, /function aprLevelProgress/);
  assert.match(helpers, /row\.started&&!row\.done/);
  assert.match(helpers, /class="apr-path-more"/);
  assert.match(helpers, /Comprendre cette étape, sa méthode et ses limites/);
  assert.match(view, /class="apr-stage-tabs"/);
  assert.match(view, /aria-label="Prochaine action"/);
  assert.match(view, /class="apr-module-grid"/);
  assert.match(view, /À faire/);
  assert.match(view, /En cours/);
  assert.match(view, /Maîtrisé/);
  assert.ok(view.indexOf('class="apr-next"') < view.indexOf('class="apr-module-grid"'));
  assert.match(html, /body:has\(\.apr-path-dashboard\) \.fab\{display:none\}/);
  assert.doesNotMatch(view, /Cinq étapes qui s'appuient l'une sur l'autre/);
});

test('le projet fournit une identite visuelle originale au navigateur', () => {
  const manifestPath = path.resolve(here, '..', '..', 'manifest.webmanifest');
  const iconPath = path.resolve(here, '..', '..', 'assets', 'aln8ba-icon.svg');
  assert.ok(fs.existsSync(manifestPath));
  assert.ok(fs.existsSync(iconPath));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.short_name, 'Aln8ba8dwaw8gan');
  assert.equal(manifest.icons[0].src, 'assets/aln8ba-icon.svg');
  assert.match(html, /rel="icon" href="assets\/aln8ba-icon\.svg"/);
  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
  assert.match(html, /<div class="logo"><img src="assets\/aln8ba-icon\.svg" alt=""><\/div>/);
});
