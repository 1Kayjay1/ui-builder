import os from 'node:os';
import path from 'node:path';
import type { AgentId, Scope } from './types.js';

export interface AdapterTarget {
  id: AgentId;
  skillRoot: string;
  capabilityNote: string;
}

export function adapterTarget(id: AgentId, scope: Scope, projectRoot: string): AdapterTarget {
  const root = scope === 'global' ? os.homedir() : projectRoot;
  if (id === 'codex') {
    return {
      id,
      skillRoot: scope === 'global' ? path.join(root, '.agents', 'skills') : path.join(root, '.agents', 'skills'),
      capabilityNote: 'Portable Agent Skills target used by current Codex-compatible installations.'
    };
  }
  return {
    id,
    skillRoot: scope === 'global' ? path.join(root, '.claude', 'skills') : path.join(root, '.claude', 'skills'),
    capabilityNote: 'Claude Code native project/personal skill directory.'
  };
}

export function packStateRoot(scope: Scope, projectRoot: string): string {
  return scope === 'global' ? path.join(os.homedir(), '.designpack') : path.join(projectRoot, '.designpack');
}
