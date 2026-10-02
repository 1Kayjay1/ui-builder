import path from 'node:path';
import { exists, writeJson } from './fs.js';
import { designProfileSchema } from './schema.js';
import type { ProjectAnalysis } from './types.js';

export function profileFromAnalysis(a: ProjectAnalysis) {
  const font = a.assets.fonts.find(x => !x.includes('/')) ?? 'inherit';
  return {
    schemaVersion:'1.0' as const,
    project:{framework:a.project.framework, styling:a.project.styling, componentLibraries:a.project.componentLibraries, confidence:a.project.confidence},
    identity:{traits:['project-inferred'], density:'unknown', visualComplexity:'unknown', evidence:['static-analysis']},
    tokens:{source:'./tokens.json'},
    typography:{display:font, body:font, data:'monospace', numericStyle:'tabular-when-comparison-matters'},
    layout:{strategy:'preserve-existing; container-first for new reusable regions'},
    surfaces:{levels:['canvas','surface','elevated','overlay'], separation:['project-defined']},
    motion:{level:'preserve-existing', purpose:['state','continuity','feedback'], reducedMotion:'replace-nonessential'},
    interaction:{stateIntegrity:'real-state-only' as const, destructiveActions:'explicit-confirmation-or-clear-commit-contract', optimisticRollback:true},
    advancedGraphics:{shaderPolicy:'conditional', threeDPolicy:'conditional'},
    accessibility:{target:'WCAG 2.2 AA'},
    antiPatterns:['Do not introduce a visual motif solely because it looks modern.','Do not replace established design language without explicit redesign intent.'],
    sources:a.evidence.length ? a.evidence : [{kind:'static-analysis',path:'package.json',confidence:a.project.confidence}]
  };
}

export function tokensFromAnalysis(a: ProjectAnalysis) {
  const candidate = (type:string, items:Array<{value:string,count:number}>) => Object.fromEntries(items.slice(0,12).map((v,i)=>[`candidate-${i+1}`,{$type:type,$value:v.value,$extensions:{designpack:{occurrences:v.count,confidence:Math.min(0.95,0.45+v.count*0.05)}}}]));
  return {schemaVersion:'1.0', color:candidate('color',a.candidates.colors), spacing:candidate('dimension',a.candidates.spacing), radius:candidate('dimension',a.candidates.radii), fontSize:candidate('dimension',a.candidates.fontSizes), shadow:candidate('shadow',a.candidates.shadows), motionDuration:candidate('duration',a.candidates.motion)};
}

export async function writeDesignArtifacts(projectRoot: string, analysis: ProjectAnalysis, preserve = true): Promise<string[]> {
  const dir = path.join(projectRoot,'.design');
  const out: string[] = [];
  const profilePath = path.join(dir,'design-profile.json'), tokenPath = path.join(dir,'tokens.json'), refsPath = path.join(dir,'references.json');
  const profile = designProfileSchema.parse(profileFromAnalysis(analysis));
  if (!preserve || !(await exists(profilePath))) { await writeJson(profilePath,profile); out.push(profilePath); }
  if (!preserve || !(await exists(tokenPath))) { await writeJson(tokenPath,tokensFromAnalysis(analysis)); out.push(tokenPath); }
  if (!preserve || !(await exists(refsPath))) { await writeJson(refsPath,{schemaVersion:'1.0',references:[]}); out.push(refsPath); }
  return out;
}
