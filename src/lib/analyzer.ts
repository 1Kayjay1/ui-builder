import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { exists, readJson, walkFiles } from './fs.js';
import type { ProjectAnalysis } from './types.js';

const IGNORE = new Set(['node_modules','.git','dist','build','.next','.nuxt','.svelte-kit','coverage','.designpack']);
const TEXT_EXTS = new Set(['.css','.scss','.sass','.less','.tsx','.ts','.jsx','.js','.vue','.svelte','.html']);

function countMatches(text: string, re: RegExp): Map<string, number> {
  const m = new Map<string, number>();
  for (const match of text.matchAll(re)) {
    const value = (match[1] ?? match[0]).trim();
    m.set(value, (m.get(value) ?? 0) + 1);
  }
  return m;
}
function merge(target: Map<string,number>, incoming: Map<string,number>) {
  for (const [k,v] of incoming) target.set(k, (target.get(k) ?? 0) + v);
}
function top(map: Map<string,number>, limit = 24) {
  return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([value,count])=>({value,count}));
}
function depHas(deps: Record<string,string>, prefix: string) { return Object.keys(deps).some(k => k === prefix || k.startsWith(prefix)); }

export async function analyzeProject(projectRoot: string): Promise<ProjectAnalysis> {
  const pkgPath = path.join(projectRoot, 'package.json');
  let pkg: any = {};
  const warnings: string[] = [];
  if (await exists(pkgPath)) {
    try { pkg = await readJson<any>(pkgPath); } catch { warnings.push('package.json could not be parsed.'); }
  } else warnings.push('No package.json found; framework confidence is reduced.');
  const deps = {...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {})};
  let framework = 'unknown';
  if (deps.next) framework = 'next'; else if (deps['@sveltejs/kit']) framework = 'sveltekit'; else if (deps.vue) framework = 'vue'; else if (deps.react) framework = 'react'; else if (deps['@angular/core']) framework = 'angular';
  const styling = new Set<string>();
  if (depHas(deps,'tailwindcss') || await exists(path.join(projectRoot,'tailwind.config.js')) || await exists(path.join(projectRoot,'tailwind.config.ts'))) styling.add('tailwind');
  if (depHas(deps,'sass')) styling.add('sass');
  if (depHas(deps,'styled-components')) styling.add('styled-components');
  if (depHas(deps,'@emotion/')) styling.add('emotion');
  const componentLibraries = new Set<string>();
  if (depHas(deps,'@radix-ui/')) componentLibraries.add('radix');
  if (await exists(path.join(projectRoot,'components.json'))) componentLibraries.add('shadcn');
  if (depHas(deps,'@mui/')) componentLibraries.add('mui');
  if (depHas(deps,'@chakra-ui/')) componentLibraries.add('chakra');
  if (depHas(deps,'@mantine/')) componentLibraries.add('mantine');
  if (depHas(deps,'react-aria') || depHas(deps,'react-aria-components')) componentLibraries.add('react-aria');
  const animationLibraries = new Set<string>();
  for (const [needle,label] of [['motion','motion'],['framer-motion','framer-motion'],['gsap','gsap'],['@react-spring','react-spring']] as const) if (depHas(deps,needle)) animationLibraries.add(label);

  const files = await walkFiles(projectRoot, IGNORE);
  const cssVars = new Map<string, {value:string; count:number}>();
  const colors = new Map<string,number>(), spacing = new Map<string,number>(), radii = new Map<string,number>(), fontSizes = new Map<string,number>(), shadows = new Map<string,number>(), motion = new Map<string,number>();
  const fonts = new Set<string>(), icons = new Set<string>(), images = new Set<string>(), threeD = new Set<string>(), routes = new Set<string>();
  const evidence: ProjectAnalysis['evidence'] = [];
  for (const file of files) {
    const rel = path.relative(projectRoot,file).split(path.sep).join('/');
    const ext = path.extname(file).toLowerCase();
    if (/\.(woff2?|ttf|otf)$/i.test(file)) fonts.add(rel);
    if (/\.(png|jpe?g|webp|avif|svg)$/i.test(file)) images.add(rel);
    if (/\.(glb|gltf|obj|fbx)$/i.test(file)) threeD.add(rel);
    if (/icon/i.test(path.basename(file)) && /\.(tsx?|jsx?|svg)$/i.test(file)) icons.add(rel);
    if (/(^|\/)app\/.*\/(page|route)\.(tsx?|jsx?)$/.test(rel) || /(^|\/)pages\/.*\.(tsx?|jsx?)$/.test(rel)) routes.add(rel);
    if (!TEXT_EXTS.has(ext)) continue;
    let text = ''; try { text = await readFile(file,'utf8'); } catch { continue; }
    const varRe = /(--[\w-]+)\s*:\s*([^;}{]+)[;}]/g;
    for (const m of text.matchAll(varRe)) {
      const name = m[1], value = m[2].trim(); const prior = cssVars.get(name);
      cssVars.set(name,{value,count:(prior?.count ?? 0)+1});
    }
    merge(colors, countMatches(text, /(#[0-9a-fA-F]{3,8}\b|(?:rgb|hsl|oklch|lab|lch)a?\([^)]*\))/g));
    merge(spacing, countMatches(text, /(?:margin|padding|gap|inset|top|right|bottom|left)(?:-[\w]+)?\s*:\s*(-?(?:\d*\.)?\d+(?:px|rem|em|vh|vw))/g));
    merge(radii, countMatches(text, /border-radius\s*:\s*([^;}{]+)/g));
    merge(fontSizes, countMatches(text, /font-size\s*:\s*([^;}{]+)/g));
    merge(shadows, countMatches(text, /box-shadow\s*:\s*([^;}{]+)/g));
    merge(motion, countMatches(text, /(?:transition-duration|animation-duration)\s*:\s*([^;}{]+)/g));
    for (const m of text.matchAll(/font-family\s*:\s*([^;}{]+)/g)) fonts.add(m[1].trim());
    if (/theme|global|tokens|variables|tailwind|styles/i.test(rel)) evidence.push({kind:'style-source',path:rel,confidence:0.85});
  }
  if ([...files].some(f => /\.css$/i.test(f))) styling.add('css');
  const pm = await exists(path.join(projectRoot,'pnpm-lock.yaml')) ? 'pnpm' : await exists(path.join(projectRoot,'yarn.lock')) ? 'yarn' : await exists(path.join(projectRoot,'bun.lockb')) ? 'bun' : await exists(path.join(projectRoot,'package-lock.json')) ? 'npm' : 'unknown';
  const confidence = pkgPath && framework !== 'unknown' ? 0.9 : framework !== 'unknown' ? 0.65 : 0.35;
  return {
    schemaVersion:'1.0', projectRoot,
    project:{framework, packageManager:pm, styling:[...styling], componentLibraries:[...componentLibraries], animationLibraries:[...animationLibraries], confidence},
    routes:[...routes].slice(0,100), assets:{fonts:[...fonts].slice(0,100), icons:[...icons].slice(0,100), images:[...images].slice(0,100), threeD:[...threeD].slice(0,100)},
    candidates:{
      cssVariables:[...cssVars.entries()].map(([name,v])=>({name,...v})).sort((a,b)=>b.count-a.count).slice(0,100),
      colors:top(colors), spacing:top(spacing), radii:top(radii), fontSizes:top(fontSizes), shadows:top(shadows), motion:top(motion)
    },
    evidence, warnings
  };
}
