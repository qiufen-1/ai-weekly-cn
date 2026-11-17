import {readFile,writeFile,rename,mkdir,unlink} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

// Background synchronization only. Browsers read the local JSON snapshot.
const source='https://ai-weekly-cn.vercel.app/api/issues';
export function validate(data){
 if(data?.status?.mode!=='live'||!Array.isArray(data.issues)||data.issues.length===0||data.issues.length>110)throw Error('Upstream is not a verified live snapshot');
 const ids=new Set();
 for(const i of data.issues){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(i.id)||ids.has(i.id)||!Number.isFinite(Date.parse(i.publishedAt))||Date.parse(i.publishedAt)>Date.now()+600000||typeof i.title!=='string'||typeof i.summary!=='string'||!Array.isArray(i.categories)||i.categories.length!==4||!Array.isArray(i.highlights)||i.highlights.length!==3)throw Error('Incomplete issue');
  ids.add(i.id);
  if(new Set(i.categories.map(c=>c.id)).size!==4)throw Error('Duplicate category');
  for(const c of i.categories){
   if(!['text','image','video','code'].includes(c.id)||!Array.isArray(c.rows)||c.rows.length!==3||!/^\d{4}-\d{2}-\d{2}$/.test(c.sourceDate)||!c.url?.startsWith('https://arena.ai/leaderboard/'))throw Error('Invalid category');
   for(const row of c.rows)if(typeof row.name!=='string'||!Number.isFinite(row.score))throw Error('Invalid model');
  }
 }
 return data;
}
export async function sync({destination,fetchImpl=fetch}){
 const response=await fetchImpl(source,{redirect:'error',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Source returned '+response.status);
 const raw=await response.text();if(raw.length>2_000_000)throw Error('Snapshot exceeds size limit');
 const data=validate(JSON.parse(raw));
 data.issues.sort((a,b)=>b.id.localeCompare(a.id));
 try{const old=JSON.parse(await readFile(destination,'utf8'));const oldId=old.issues?.map(i=>i.id).sort().at(-1);if(oldId&&oldId>data.issues[0].id)throw Error('Refusing older snapshot');}catch(e){if(e.code!=='ENOENT')throw e;}
 const output={issues:data.issues,status:{mode:'live',lastSyncedAt:new Date().toISOString()}};
 await mkdir(dirname(destination),{recursive:true});const temp=destination+'.'+process.pid+'.tmp';
 try{await writeFile(temp,JSON.stringify(output),{encoding:'utf8',mode:0o644});await rename(temp,destination)}catch(e){await unlink(temp).catch(()=>{});throw e}
 return {issues:output.issues.length,latest:output.issues[0].id};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const destination=resolve(dirname(fileURLToPath(import.meta.url)),'../site/data/issues.json');
 try{console.log(JSON.stringify(await sync({destination})))}catch(e){console.error('Sync failed; previous snapshot preserved: '+e.message);process.exitCode=1}
}
