// Lecture seule : contrôle des graphies reçues et de leur présentation effective.
// Ne crée aucun export du corpus et ne modifie jamais la base.
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../../index.html',import.meta.url),'utf8').replace(/\r\n/g,'\n');
function block(start,end){
  const from=html.indexOf(start),to=html.indexOf(end,from);
  if(from<0||to<=from) throw new Error(`Bloc absent : ${start}`);
  return html.slice(from,to);
}
const url=html.match(/const SB_URL = '([^']+)'/)[1];
const key=html.match(/const SB_KEY = '([^']+)'/)[1];
const words=[];
for(let offset=0;;offset+=1000){
  const response=await fetch(`${url}/rest/v1/words?select=*&order=id&limit=1000&offset=${offset}`,{
    headers:{apikey:key,Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(15000),
  });
  if(!response.ok) throw new Error(`Lecture impossible : HTTP ${response.status}`);
  const page=await response.json();
  if(!Array.isArray(page)) throw new Error('La réponse ne contient pas une liste.');
  words.push(...page);
  if(page.length<1000) break;
}
const context=vm.createContext({});
vm.runInContext(block('const NDAABA_CURRENT_USAGE=', 'async function fetchWordsFromSB('),context);
vm.runInContext(block('let WORD_LEVEL_CACHE=new WeakMap();', "// ── Ordre d'affichage"),context);
const normalized=words.map(w=>({...w,related:context.parseWordList(w.related),corrections:context.parseWordList(w.corrections)}));
const current=context.applyCurrentUsageOverrides(normalized);
const iotali=current.filter(w=>/^iotali$/i.test(w.aln8ba||''));
const uncorrected=current.filter(w=>!context.enAttente(w)&&/^yudali$/i.test(w.aln8ba||''));
const flagged=current.filter(w=>context.needsOrthographyReview(w)&&!context.enAttente(w));
const unsafeInExercises=flagged.filter(w=>context.isExerciseSafe(w));
console.log(JSON.stringify({
  remoteRows:words.length,
  currentIotali:iotali.map(({id,aln8ba,fr})=>({id,aln8ba,fr})),
  uncorrectedIci:uncorrected.length,
  spellingReviewSignals:flagged.length,
  reviewSignalsInAutomaticExercises:unsafeInExercises.length,
  priority:flagged.filter(w=>/^yu|ou|^mkuigen$|^amku$|^paakuin8gwzian$/i.test(w.aln8ba)).map(({id,aln8ba})=>({id,aln8ba})),
},null,2));
if(iotali.length!==1||iotali[0].id!=='mst287'||uncorrected.length||unsafeInExercises.length) process.exitCode=1;
