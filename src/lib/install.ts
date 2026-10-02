import path from 'node:path';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { adapterTarget, packStateRoot } from './adapters.js';
import { analyzeProject } from './analyzer.js';
import { exists, packageRoot, readJson, removeEmptyParents, toPosix, walkFiles, writeJson } from './fs.js';
import { sha256File, sha256Text } from './hash.js';
import { receiptSchema } from './schema.js';
import { writeDesignArtifacts } from './profile.js';
import type { InstallOptions, InstallReceipt, ManagedFile } from './types.js';

export interface PlanEntry { action:'create'|'update'|'skip'|'conflict'; source:string; target:string; }

async function version(): Promise<string> {
  const root=await packageRoot(); const pkg=await readJson<any>(path.join(root,'package.json')); return pkg.version;
}
function receiptPath(stateRoot:string){ return path.join(stateRoot,'install-receipt.json'); }
async function loadReceipt(stateRoot:string):Promise<InstallReceipt|undefined>{
  const p=receiptPath(stateRoot); if(!(await exists(p))) return undefined;
  try{return receiptSchema.parse(await readJson(p));}catch{return undefined;}
}
async function assetPairs(options:InstallOptions){
  const root=await packageRoot(); const pairs:Array<{source:string,target:string,adapter?:string}>=[];
  const coreTarget=path.join(packStateRoot(options.scope,options.projectRoot),'core');
  for(const sub of ['knowledge','registry','schemas']){
    const srcDir=path.join(root,'assets',sub);
    for(const source of await walkFiles(srcDir)) pairs.push({source,target:path.join(coreTarget,sub,path.relative(srcDir,source))});
  }
  const skillDir=path.join(root,'assets','skills');
  const skillFiles=await walkFiles(skillDir);
  for(const agent of options.agents){ const target=adapterTarget(agent,options.scope,options.projectRoot); for(const source of skillFiles) pairs.push({source,target:path.join(target.skillRoot,path.relative(skillDir,source)),adapter:agent}); }
  return pairs;
}

export async function planInstall(options:InstallOptions):Promise<PlanEntry[]> {
  const stateRoot=packStateRoot(options.scope,options.projectRoot); const prior=await loadReceipt(stateRoot); const priorMap=new Map((prior?.managedFiles??[]).map(x=>[path.resolve(prior!.root,x.path),x.sha256]));
  const plan:PlanEntry[]=[];
  for(const pair of await assetPairs(options)){
    const desired=sha256Text(await readFile(pair.source));
    if(!(await exists(pair.target))){ plan.push({action:'create',...pair}); continue; }
    const current=await sha256File(pair.target);
    if(current===desired){ plan.push({action:'skip',...pair}); continue; }
    const known=priorMap.get(path.resolve(pair.target));
    plan.push({action: known===current || options.force ? 'update':'conflict',...pair});
  }
  return plan;
}

export async function installPack(options:InstallOptions):Promise<{receipt?:InstallReceipt;plan:PlanEntry[];conflicts:string[]}> {
  const stateRoot=packStateRoot(options.scope,options.projectRoot); const previous=await loadReceipt(stateRoot); const plan=await planInstall(options); const conflicts=plan.filter(x=>x.action==='conflict').map(x=>x.target);
  if(options.dryRun || conflicts.length) return {receipt:previous,plan,conflicts};
  const backups=[...(previous?.backups??[])]; const managed:ManagedFile[]=[]; const adapterFiles:Record<string,string[]>={};
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  for(const entry of plan){
    if(entry.action==='skip'){ managed.push({path:toPosix(path.relative(stateRoot,entry.target)),sha256:await sha256File(entry.target)}); continue; }
    if(entry.action==='update' && await exists(entry.target) && options.force){
      const rel=toPosix(path.relative(options.scope==='project'?options.projectRoot:path.dirname(stateRoot),entry.target)).replace(/^\.\.\//,'external/');
      const backup=path.join(stateRoot,'backups',stamp,rel); await mkdir(path.dirname(backup),{recursive:true}); await cp(entry.target,backup); backups.push({originalPath:entry.target,backupPath:backup});
    }
    await mkdir(path.dirname(entry.target),{recursive:true}); await cp(entry.source,entry.target);
    managed.push({path:toPosix(path.relative(stateRoot,entry.target)),sha256:await sha256File(entry.target)});
  }
  for(const agent of options.agents){
    const target=adapterTarget(agent,options.scope,options.projectRoot).skillRoot;
    adapterFiles[agent]=managed.map(m=>path.resolve(stateRoot,m.path)).filter(p=>p.startsWith(path.resolve(target))).map(p=>toPosix(path.relative(options.scope==='project'?options.projectRoot:stateRoot,p)));
  }
  let generatedArtifacts:string[]=[];
  if(options.scope==='project'){
    const analysis=await analyzeProject(options.projectRoot); generatedArtifacts=await writeDesignArtifacts(options.projectRoot,analysis,true); await writeJson(path.join(stateRoot,'analysis.json'),analysis);
    managed.push({path:'analysis.json',sha256:await sha256File(path.join(stateRoot,'analysis.json'))});
  }
  const receipt:InstallReceipt={schemaVersion:1,packageVersion:await version(),installedAt:new Date().toISOString(),scope:options.scope,root:stateRoot,adapters:Object.fromEntries(options.agents.map(a=>[a,{version:'1',files:adapterFiles[a]??[]} ])),managedFiles:managed,backups,generatedArtifacts:generatedArtifacts.map(p=>toPosix(path.relative(options.projectRoot,p)))};
  await writeJson(receiptPath(stateRoot),receipt);
  return {receipt,plan,conflicts:[]};
}

export async function uninstallPack(projectRoot:string,scope:'project'|'global'){
  const stateRoot=packStateRoot(scope,projectRoot); const receipt=await loadReceipt(stateRoot); if(!receipt) return {removed:[],preserved:[],message:'No valid install receipt found.'};
  const removed:string[]=[],preserved:string[]=[];
  for(const item of [...receipt.managedFiles].reverse()){
    const target=path.resolve(stateRoot,item.path); if(!(await exists(target))) continue;
    const current=await sha256File(target);
    if(current!==item.sha256){preserved.push(target);continue;}
    await rm(target,{force:true}); removed.push(target); await removeEmptyParents(path.dirname(target),scope==='project'?projectRoot:stateRoot);
  }
  await rm(receiptPath(stateRoot),{force:true});
  try { if((await walkFiles(stateRoot)).length===0) await rm(stateRoot,{recursive:true,force:true}); } catch {}
  return {removed,preserved,message:preserved.length?'Uninstalled pack-owned unchanged files; preserved locally modified files.':'Uninstalled pack-owned files.'};
}

export async function getInstallReceipt(projectRoot:string,scope:'project'|'global'){ return loadReceipt(packStateRoot(scope,projectRoot)); }
