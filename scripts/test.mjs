import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sync,validate} from './sync.mjs';
const snapshot=JSON.parse(await readFile(new URL('../site/data/issues.json',import.meta.url),'utf8'));
test('complete published snapshot is accepted',()=>{assert.equal(validate(snapshot),snapshot)});
test('upstream fallback or incomplete data is rejected',()=>{
 assert.throws(()=>validate({...snapshot,status:{mode:'snapshot'}}));
 const partial=structuredClone(snapshot);partial.issues[0].categories.pop();assert.throws(()=>validate(partial));
});
test('failed synchronization leaves existing data untouched',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'weekly-pages-'));const destination=join(dir,'issues.json');
 await writeFile(destination,JSON.stringify(snapshot));
 await assert.rejects(sync({destination,fetchImpl:async()=>({ok:false,status:503})}));
 assert.deepEqual(JSON.parse(await readFile(destination,'utf8')),snapshot);
});
test('site requests local data and contains no runtime credentials',async()=>{
 const html=await readFile(new URL('../site/index.html',import.meta.url),'utf8');
 assert.ok(html.includes("fetch('./data/issues.json')"));
 assert.ok(!html.includes('SITES_BACKEND_TOKEN'));assert.ok(!html.includes("fetch('/api/issues')"));
});
