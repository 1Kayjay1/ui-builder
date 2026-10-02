#!/usr/bin/env node
import { cp, mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await readFile(path.join(root,'evals/manifest.json'),'utf8'));
const args=process.argv.slice(2); const pick=(flag,def)=>{const i=args.indexOf(flag);return i>=0?args[i+1]:def};
const agent=pick('--agent','codex'); const only=pick('--case',null);
const baseline=process.env.BASELINE_CMD, packed=process.env.PACK_CMD;
if(!baseline||!packed){console.error('Set BASELINE_CMD and PACK_CMD to the same agent/model invocation. The pack arm differs only by installing Agent Design Pack first.');process.exit(2)}

async function run(command,cwd,env){const started=Date.now();return await new Promise(resolve=>{const child=spawn(command,{cwd,env:{...process.env,...env},shell:true});let stdout='',stderr='';child.stdout?.on('data',d=>stdout+=d);child.stderr?.on('data',d=>stderr+=d);child.on('exit',(code,signal)=>resolve({code,signal,durationMs:Date.now()-started,stdout:stdout.slice(-20000),stderr:stderr.slice(-20000)}));});}
async function workspaceFor(c){const dir=await mkdtemp(path.join(os.tmpdir(),`designpack-eval-${c.id}-`));if(c.fixture)await cp(path.join(root,'evals',c.fixture),dir,{recursive:true});else await mkdir(dir,{recursive:true});return dir;}
const results=[];
for(const c of manifest.cases.filter(c=>!only||c.id===only)){
  for(const mode of ['baseline','pack']){
    const cwd=await workspaceFor(c);
    let install=null;
    if(mode==='pack') install=await run(`node ${JSON.stringify(path.join(root,'dist/cli.js'))} init --agents ${agent} --project . --yes`,cwd,{});
    const command=mode==='pack'?packed:baseline;
    const execution=install&&install.code!==0?{code:null,signal:null,durationMs:0,stdout:'',stderr:'pack installation failed'}:await run(command,cwd,{DESIGNPACK_EVAL_CASE:c.id,DESIGNPACK_EVAL_MODE:mode,DESIGNPACK_EVAL_PROMPT:c.prompt});
    results.push({case:c.id,mode,workspace:cwd,install,execution});
    console.log(`${c.id} ${mode}: ${execution.code===0?'PASS':'FAIL'} ${execution.durationMs}ms`);
  }
}
const out=path.resolve(pick('--out',path.join(root,'evals','results.json')));await writeFile(out,JSON.stringify({schemaVersion:1,generatedAt:new Date().toISOString(),agent,results},null,2)+'\n');console.log(`Wrote ${out}`);
