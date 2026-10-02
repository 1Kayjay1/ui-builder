import path from 'node:path';
import { adapterTarget, packStateRoot } from './adapters.js';
import { exists, readJson } from './fs.js';
import { sha256File } from './hash.js';
import { designProfileSchema, receiptSchema, registrySchema } from './schema.js';
import type { DoctorCheck, Scope } from './types.js';

export async function doctor(projectRoot:string,scope:Scope):Promise<DoctorCheck[]>{
  const checks:DoctorCheck[]=[]; const stateRoot=packStateRoot(scope,projectRoot); const receiptFile=path.join(stateRoot,'install-receipt.json');
  if(!(await exists(receiptFile))) return [{name:'receipt',status:'fail',message:'No install receipt found.'}];
  let receipt:any; try{receipt=receiptSchema.parse(await readJson(receiptFile));checks.push({name:'receipt',status:'pass',message:`Receipt schema valid (${receipt.packageVersion}).`});}catch(e:any){return [{name:'receipt',status:'fail',message:`Receipt invalid: ${e.message}`}];}
  for(const item of receipt.managedFiles){const target=path.resolve(stateRoot,item.path); if(!(await exists(target))){checks.push({name:`file:${item.path}`,status:'fail',message:'Managed file is missing.'});continue;} const hash=await sha256File(target); checks.push({name:`file:${item.path}`,status:hash===item.sha256?'pass':'warn',message:hash===item.sha256?'Checksum matches.':'File was modified after install; it will be preserved on uninstall.'});}
  for(const agent of Object.keys(receipt.adapters) as Array<'codex'|'claude'>){const root=adapterTarget(agent,scope,projectRoot).skillRoot;checks.push({name:`agent:${agent}`,status:await exists(root)?'pass':'fail',message:`Skill root ${root}`});}
  const registryPath=path.join(stateRoot,'core','registry','components.json'); try{registrySchema.parse(await readJson(registryPath));checks.push({name:'registry',status:'pass',message:'Local component registry is valid.'});}catch(e:any){checks.push({name:'registry',status:'fail',message:`Registry invalid: ${e.message}`});}
  if(scope==='project'){const profilePath=path.join(projectRoot,'.design','design-profile.json'); if(await exists(profilePath)){try{designProfileSchema.parse(await readJson(profilePath));checks.push({name:'profile',status:'pass',message:'Design profile is valid.'});}catch(e:any){checks.push({name:'profile',status:'warn',message:`Design profile exists but is not schema-valid: ${e.message}`});}}else checks.push({name:'profile',status:'warn',message:'No design profile yet; run designpack profile.'});}
  const major=Number(process.versions.node.split('.')[0]); checks.push({name:'node',status:major>=20?'pass':'fail',message:`Node ${process.versions.node}`});
  return checks;
}
