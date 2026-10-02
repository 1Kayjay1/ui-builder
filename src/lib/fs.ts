import { access, copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function exists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}

export async function ensureDir(p: string): Promise<void> { await mkdir(p, { recursive: true }); }

export async function readJson<T>(p: string): Promise<T> {
  return JSON.parse(await readFile(p, 'utf8')) as T;
}

export async function writeJson(p: string, value: unknown): Promise<void> {
  await ensureDir(path.dirname(p));
  await writeFile(p, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

export async function walkFiles(root: string, ignored = new Set<string>()): Promise<string[]> {
  if (!(await exists(root))) return [];
  const out: string[] = [];
  async function visit(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.isFile()) out.push(full);
    }
  }
  await visit(root);
  return out;
}

export async function removeEmptyParents(start: string, stop: string): Promise<void> {
  let current = start;
  const absoluteStop = path.resolve(stop);
  while (path.resolve(current).startsWith(absoluteStop) && path.resolve(current) !== absoluteStop) {
    try {
      const entries = await readdir(current);
      if (entries.length) break;
      await rm(current, { recursive: false });
      current = path.dirname(current);
    } catch { break; }
  }
}

export async function copyTextFile(src: string, dest: string): Promise<void> {
  await ensureDir(path.dirname(dest));
  await copyFile(src, dest);
}

export function toPosix(p: string): string { return p.split(path.sep).join('/'); }

export async function packageRoot(): Promise<string> {
  let current = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    if (await exists(path.join(current, 'package.json')) && await exists(path.join(current, 'assets'))) return current;
    current = path.dirname(current);
  }
  throw new Error('Could not locate package root/assets.');
}

export async function fileSize(p: string): Promise<number> { return (await stat(p)).size; }
