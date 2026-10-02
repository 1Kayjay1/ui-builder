import type { AgentId } from './types.js';
export function parseAgents(value?:string):AgentId[]{
  if(!value)return[];
  const all=value.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  const bad=all.filter(x=>!['codex','claude'].includes(x));
  if(bad.length) throw new Error(`Unsupported agent(s): ${bad.join(', ')}`);
  return [...new Set(all)] as AgentId[];
}
