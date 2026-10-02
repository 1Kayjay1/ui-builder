import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';
import { exists } from './fs.js';
import type { AgentId, DetectionResult } from './types.js';

const execFileAsync = promisify(execFile);

async function findExecutable(name: string): Promise<string | undefined> {
  const command = process.platform === 'win32' ? 'where' : 'which';
  try {
    const { stdout } = await execFileAsync(command, [name], { timeout: 2500 });
    return stdout.trim().split(/\r?\n/)[0] || undefined;
  } catch { return undefined; }
}

async function getVersion(executable: string): Promise<string | undefined> {
  try {
    const { stdout, stderr } = await execFileAsync(executable, ['--version'], { timeout: 3500 });
    return (stdout || stderr).trim().split(/\r?\n/)[0] || undefined;
  } catch { return undefined; }
}

export async function detectAgent(id: AgentId, projectRoot: string): Promise<DetectionResult> {
  const home = os.homedir();
  const command = id === 'codex' ? 'codex' : 'claude';
  const configCandidates = id === 'codex'
    ? [path.join(home, '.codex'), path.join(projectRoot, '.agents'), path.join(projectRoot, 'AGENTS.md')]
    : [path.join(home, '.claude'), path.join(projectRoot, '.claude'), path.join(projectRoot, 'CLAUDE.md')];
  const executable = await findExecutable(command);
  const configPaths: string[] = [];
  for (const p of configCandidates) if (await exists(p)) configPaths.push(p);
  const version = executable ? await getVersion(executable) : undefined;
  let confidence = 0;
  if (executable) confidence += 0.6;
  if (version) confidence += 0.25;
  if (configPaths.length) confidence += Math.min(0.15, configPaths.length * 0.05);
  return {
    id, confidence: Math.min(1, Number(confidence.toFixed(2))), version,
    signals: { executable, versionCommand: executable ? `${command} --version` : undefined, configPaths },
    warnings: executable ? [] : [`${command} executable was not found on PATH; manual installation selection is still supported.`]
  };
}

export async function detectAgents(projectRoot: string): Promise<DetectionResult[]> {
  return Promise.all([detectAgent('codex', projectRoot), detectAgent('claude', projectRoot)]);
}
