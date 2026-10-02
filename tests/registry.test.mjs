import test from 'node:test'; import assert from 'node:assert/strict'; import { loadRegistry,searchRegistry } from '../dist/lib/registry.js';
test('registry validates',async()=>{const r=await loadRegistry();assert.ok(r.items.length>=5)});
test('registry finds shader metadata without bundled source',async()=>{const r=await searchRegistry('shader background','react');assert.equal(r[0].id,'react-bits/dither');assert.equal(r[0].license.redistribution,'restricted')});
test('registry finds accessible dialog',async()=>{const r=await searchRegistry('accessible dialog','react');assert.ok(r.some(x=>x.id==='shadcn/dialog'))});
