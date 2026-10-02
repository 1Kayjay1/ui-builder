import test from 'node:test'; import assert from 'node:assert/strict'; import { parseAgents } from '../dist/lib/options.js';
test('CLI option parser de-duplicates agents',()=>assert.deepEqual(parseAgents('codex, claude,codex'),['codex','claude']));
test('CLI option parser rejects unsupported agent',()=>assert.throws(()=>parseAgents('codex,cursor'),/Unsupported/));
