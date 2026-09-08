import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
function between(start, end) {
  const from = html.indexOf(start);
  const to = html.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `bloc introuvable : ${start}`);
  return html.slice(from, to);
}

test('repratiquer une halte migrée conserve les deux meilleures notes historiques', () => {
  const source = between('function aprMergeProgressStates', 'function aprCourseProgressState');
  const getState = new Function(`${source}
    const aprChapterProgressKey=()=> 'course.chapter.p.1';
    const APR_PREVIOUS_COURSE_CHAPTER_KEYS={Saluer:'course-d.0.chapter.1'};
    const APR_PREVIOUS_MODULE_PROGRESS_KEYS={Saluer:'p.1'};
    return aprChapterProgressState;`)();
  const level = {mods:[{chapters:[{t:'Saluer', legacyKey:'p.1'}]}]};
  const scores = {'course-d.0.chapter.1':{retenir:100, utiliser:80}, 'p.1':{utiliser:100}};
  assert.deepEqual(getState(level, 0, 0, scores), {retenir:100, utiliser:100});
  scores['course.chapter.p.1'] = {retenir:80};
  assert.deepEqual(getState(level, 0, 0, scores), {retenir:100, utiliser:100});
  scores['course.chapter.p.1'] = {retenir:NaN, utiliser:200};
  assert.deepEqual(getState(level, 0, 0, scores), {retenir:100, utiliser:100});
});

test('les listes suivantes excluent les formes déjà introduites dans les autres niveaux et haltes', () => {
  const source = between('let aprLessonChapter=null;', 'function aprNamedModuleItems');
  const run = new Function(`${source}
    const aprLessonKey=value=>value.toLowerCase();
    const aprLessonItems=()=>[];
    const aprNamedModuleItems=names=>names.map(aln8ba=>({aln8ba}));
    const first={cat:'nombre',items:[{aln8ba:'Pazokw'}]};
    const second={cat:'nombre',itemNames:['Nis']};
    const later={cat:'nombre',itemNames:['Mdala']};
    const target={cat:'nombre',lec:()=>[...aprPreviousModuleKeys('nombre')]};
    const NIVEAUX=[
      {id:'d',mods:[{chapters:[first]}]},
      {id:'co',mods:[{chapters:[second,target,later]}]}
    ];
    const aprNiv='co',aprMod=0;
    return {during:aprChapterLesson(target),outside:[...aprPreviousModuleKeys('nombre')]};`)();
  assert.deepEqual(run.during, ['pazokw', 'nis']);
  assert.deepEqual(run.outside, ['pazokw']);
  assert.ok(!run.during.includes('mdala'));
});

test('une halte de trois émotions propose trois choix et ne consulte aucune banque extérieure', () => {
  const unique = between('function jUniqueBy', 'const TERRITORY_TRAIL');
  const vocabulary = between('function aprVocabChoices', 'function exRetVocab');
  const execute = new Function('pool', `${unique};${vocabulary}
    let result='';
    const window={};
    const jShuf=items=>[...items],jPick=items=>items[0];
    const aprLessonKey=value=>value.toLowerCase();
    const aprSur=()=>{throw new Error('banque extérieure consultée');};
    const exEcris=()=>{throw new Error('écriture imposée au lieu du choix');};
    const exCadre=value=>result=value;
    const exPoolOverride=pool,exCat='description',exVariant='recognize',exQ=0;
    let exAsked=[];
    exVocab();
    return result;`);
  const pool = [
    {id:'joie',aln8ba:'Wiagaldamw8gan',fr:'joie'},
    {id:'tristesse',aln8ba:'Siwaldamw8gan',fr:'tristesse'},
    {id:'peur',aln8ba:'Sagezow8gan',fr:'peur'}
  ];
  assert.equal((execute(pool).match(/class="jopt"/g)||[]).length, 3);
  assert.equal((execute(pool.slice(0,2)).match(/class="jopt"/g)||[]).length, 2);
  assert.match(execute([]), /pas disponibles/);
});

function tableRow(label, {header=false, rowSpan=1, zeroSpan=false}={}) {
  return {
    label,
    cells:[{tagName:header?'TH':'TD', rowSpan,
      getAttribute:name=>name==='rowspan'&&zeroSpan?'0':null}],
    closest:()=>null
  };
}

test('24 animaux se répartissent en six étapes de quatre sans perdre une ligne ni les en-têtes', () => {
  const source = between('function aprTablePages', 'function aprSplitLessonTables');
  const paginate = new Function(`${source};return aprTablePages;`)();
  const header = tableRow('Aln8ba / Français', {header:true});
  const animalLesson = between('{t:"Les animaux"', '{t:"Les bêtes de chez nous"');
  const names = [...animalLesson.matchAll(/<td class="k">([^<]+)<\/td>/g)].map(match=>match[1]);
  assert.equal(names.length, 24);
  const rows = names.map(name=>tableRow(name));
  const result = paginate({rows:[header,...rows]});
  assert.equal(result.pages.length, 6);
  assert.ok(result.pages.every(page=>page.length===4));
  assert.deepEqual(result.pages.flat().map(row=>row.label), names);
  assert.deepEqual(result.headers, [header]);
  assert.equal(paginate({rows:rows.slice(0,3)}), null);
  assert.equal(paginate({rows:[tableRow('liée',{rowSpan:2}),...rows]}), null);
  assert.equal(paginate({rows:[tableRow('liée',{zeroSpan:true}),...rows]}), null);
});

test('la nature commence par une introduction seule puis trois étapes Ciel, Paysage et Sol', () => {
  const lesson = between('{t:"La nature autour"', '{t:"Le territoire"');
  const markers = [...lesson.matchAll(/^ {2}<(section|h3|table|div)\b([^>]*)>/gm)];
  const children = markers.map((match,index)=>({
    markup:lesson.slice(match.index,markers[index+1]?.index??lesson.lastIndexOf('`}')),
    matches(selector) {
      const classes=(match[2].match(/class="([^"]*)"/)?.[1]||'').split(/\s+/);
      return selector.split(',').some(part=>{
        const [tag,...names]=part.split('.');
        return (!tag||tag===match[1])&&names.every(name=>classes.includes(name));
      });
    }
  }));
  const source = between('function aprPacedLessonGroups', 'function aprRenderPacedLesson');
  const group = new Function(`${source};return aprPacedLessonGroups;`)();
  const steps = group({children});
  assert.equal(steps[0].length, 1);
  assert.match(steps[0][0].markup, /Construis une carte du monde visible/);
  assert.doesNotMatch(steps[0][0].markup, /<table/);
  const expected = [
    ['Ciel',['Kizos','P8guas','Alakws']],
    ['Paysage',['Nebi','Watzo']],
    ['Sol',['Aki','Skweda']]
  ];
  expected.forEach(([label,names],index)=>{
    const markup=steps[index+1].map(element=>element.markup).join('');
    assert.match(markup,new RegExp(`<h3>${label}</h3>`));
    assert.match(markup,/<th>Zone observée<\/th><th>Forme aln8ba<\/th><th>Repère<\/th>/);
    assert.match(markup,new RegExp(`rowspan="${names.length}"><b>${label}</b>`));
    assert.deepEqual([...markup.matchAll(/<td class="k">([^<]+)<\/td>/g)].map(match=>match[1]),names);
  });
});

test('le retour reprend la dernière étape de lecture et garde une seule étape visible', () => {
  const source = between('const APR_READING_KEY=', 'function aprTablePages');
  const render = between('function aprRenderPacedLesson', 'function aprMovePacedLesson');
  const saved = new Map();
  const storage = {getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)};
  const api = new Function('localStorage', `${source};${render};
    return {render:aprRenderPacedLesson,read:aprReadingState,save:aprSaveReadingPosition};`)(storage);
  function shell() {
    const steps = Array.from({length:3},()=>({hidden:false}));
    const nodes = {
      '.apr-paced-content':{querySelectorAll:()=>steps},
      '.apr-paced-status':{}, '[data-paced-counter]':{},
      '[data-paced-fill]':{style:{}}, '[data-paced-previous]':{},
      '[data-paced-next]':{}, '[data-paced-practice]':{}
    };
    return {dataset:{lessonKey:'p.1'},querySelector:selector=>nodes[selector],steps,nodes};
  }
  const first = shell();
  api.render(first, 2);
  api.save('courses', 'saluer', 'p.1');
  const next = shell();
  api.render(next, api.read().steps['p.1']);
  assert.deepEqual(next.steps.map(step=>step.hidden), [true,true,false]);
  assert.equal(next.nodes['[data-paced-practice]'].hidden, false);
  assert.equal(next.nodes['[data-paced-next]'].hidden, true);
  assert.equal(api.read().courses.saluer, 'p.1');
  api.render(next, 0);
  assert.deepEqual(next.steps.map(step=>step.hidden), [false,true,true]);
  assert.equal(next.nodes['[data-paced-practice]'].hidden, true);
  storage.setItem('aln8ba_reading.v1', 'null');
  api.save('steps', 'p.1', 1);
  assert.equal(api.read().steps['p.1'], 1);
});

test('la classe des noms est présentée avant les couleurs et les nombres avancés', () => {
  const source = between('const NIVEAUX=', 'const APR_EXERCISE_TARGETS');
  const levels = new Function('aprCourse', `${source};return NIVEAUX;`)(definition=>definition);
  const consolidation = levels.find(level=>level.id==='co').mods;
  const chapters = consolidation.flatMap(module=>module.chapters);
  assert.ok(chapters.indexOf('Animé ou inanimé') < chapters.indexOf('Les couleurs : forme ou état?'));
  assert.ok(chapters.indexOf('Le pluriel') < chapters.indexOf("Compter plus loin"));
});

test('les jeux de Découverte excluent les nombres avancés même dans une catégorie commune', () => {
  const launch = between('function aprJeux', 'function aprLecon');
  const context = between('function jContextPool', 'const jPick=');
  const first = {aln8ba:'Pazokw',cat:'nombre'};
  const next = {aln8ba:'Mdala',cat:'nombre'};
  const future = {aln8ba:'Nda',cat:'salut'};
  const levels = [
    {id:'d',t:'Découverte',mods:[{items:[first]}]},
    {id:'co',t:'Consolidation',mods:[{items:[next]}]},
    {id:'a',t:'Approfondissement',mods:[{items:[future]}]}
  ];
  const run = new Function('NIVEAUX', `${launch};${context};
    let jCtx=null;
    const aprLessonKey=word=>word.toLowerCase();
    const aprModuleItemsForGuide=module=>module.items;
    const setView=()=>{};
    return (level,words)=>{aprJeux(level);return {pool:jContextPool(words),games:jCtx.games};};`)(levels);
  assert.deepEqual(run('d',[first,next,future]).pool, [first]);
  assert.deepEqual(run('co',[first,next,future]).pool, [first,next]);
  assert.ok(!run('co',[]).games.includes('negat'));
  assert.ok(run('a',[]).games.includes('negat'));
});

test('la morphologie est facultative dans les deux niveaux débutants', () => {
  const source = between('function aprWritingRequiresAnalysis', 'function exWritingOptionalAnalysisHtml');
  const policy = level=>new Function('aprNiv', `${source};return aprWritingRequiresAnalysis;`)(level);
  for(const level of ['d','f']) assert.equal(policy(level)({equation:'exemple documenté'}), false);
  for(const level of ['co','a','au']) assert.equal(policy(level)({equation:'exemple documenté'}), true);
  assert.equal(policy('co')(null), false);
});
