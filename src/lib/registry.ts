import path from 'node:path';
import { packageRoot, readJson } from './fs.js';
import { registrySchema } from './schema.js';

export interface RegistryItem {
  id:string; name:string; source:string; sourceUrl:string; categories:string[]; capabilities:string[]; frameworks:string[]; dependencies:string[];
  license:{name:string;redistribution:'allowed'|'restricted'|'unknown';notes?:string}; install:{mode:'package'|'canonical-page'|'canonical-command';command?:string};
  accessibility:{risk:string[];notes:string}; performance:{tier:'low'|'low-medium'|'medium'|'high';notes:string}; visualTags:string[]; interactionTags:string[]; verifiedAt:string;
}
export async function loadRegistry():Promise<{schemaVersion:1;items:RegistryItem[]}>{
  const root=await packageRoot(); return registrySchema.parse(await readJson(path.join(root,'assets','registry','components.json'))) as {schemaVersion:1;items:RegistryItem[]};
}
function words(s:string){return new Set(s.toLowerCase().split(/[^a-z0-9+#.-]+/).filter(Boolean));}
export async function searchRegistry(query:string,framework?:string):Promise<Array<RegistryItem & {score:number}>>{
  const registry=await loadRegistry();const q=words(query);
  return registry.items.filter((item:RegistryItem)=>!framework||item.frameworks.includes(framework)||item.frameworks.includes('any')).map((item:RegistryItem)=>{const hay=words([item.id,item.name,item.source,...item.categories,...item.capabilities,...item.visualTags,...item.interactionTags].join(' '));let score=0;for(const token of q)if(hay.has(token))score+=3;else for(const h of hay)if(h.includes(token)||token.includes(h))score+=1;return{...item,score};}).filter((x:RegistryItem&{score:number})=>x.score>0).sort((a:RegistryItem&{score:number},b:RegistryItem&{score:number})=>b.score-a.score||a.name.localeCompare(b.name));
}
