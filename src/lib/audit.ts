import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { exists, ensureDir } from './fs.js';

export const DEFAULT_VIEWPORTS = [
  {width:360,height:800,name:'phone-narrow'}, {width:390,height:844,name:'phone'},
  {width:768,height:1024,name:'tablet'}, {width:1280,height:800,name:'laptop'},
  {width:1440,height:900,name:'desktop'}, {width:1920,height:1080,name:'desktop-wide'}
];

type VP={width:number;height:number;name:string};

async function optionalImport(name:string):Promise<any|undefined>{try{return await import(name);}catch{return undefined;}}

async function browserExecutable(explicit?:string):Promise<string>{
  const candidates=[explicit,process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,process.platform==='linux'?'/usr/bin/chromium':undefined,
    process.platform==='linux'?'/usr/bin/google-chrome':undefined,
    process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined,
    process.platform==='win32'?path.join(process.env['PROGRAMFILES']??'C:\\Program Files','Google','Chrome','Application','chrome.exe'):undefined,
    process.platform==='win32'?path.join(process.env['PROGRAMFILES(X86)']??'C:\\Program Files (x86)','Microsoft','Edge','Application','msedge.exe'):undefined];
  for(const c of candidates)if(c&&await exists(c))return c; throw new Error('No Chromium/Chrome/Edge executable found. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE.');
}

async function playwrightAudit(url:string,outDir:string,viewports:VP[],executable?:string,html?:string){
  const pw=await optionalImport('playwright-core'), axe=await optionalImport('axe-core'); if(!pw||!axe)return undefined;
  let exe:string|undefined; try{exe=await browserExecutable(executable)}catch{}
  const browser=await pw.chromium.launch(exe?{headless:true,executablePath:exe}:{headless:true}); const results:any[]=[];
  try{for(const vp of viewports){const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},reducedMotion:'reduce'});const page=await context.newPage();const consoleErrors:string[]=[],failedRequests:string[]=[];page.on('console',(m:any)=>{if(m.type()==='error')consoleErrors.push(m.text())});page.on('requestfailed',(r:any)=>failedRequests.push(`${r.method()} ${r.url()} ${r.failure()?.errorText??''}`));const response=html?undefined:await page.goto(url,{waitUntil:'networkidle',timeout:30000});if(html)await page.setContent(html,{waitUntil:'load'});await page.addScriptTag({content:axe.default?.source??axe.source});const measurable=await page.evaluate(measurePage);const a11y=await page.evaluate(async()=>await (window as any).axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));const screenshot=path.join(outDir,`${vp.name}-${vp.width}x${vp.height}.png`);await page.screenshot({path:screenshot,fullPage:true});results.push({viewport:vp,status:response?.status(),screenshot,measurable,consoleErrors,failedRequests,accessibility:{engine:'axe',violations:a11y.violations.map((v:any)=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.length}))}});await context.close();}}finally{await browser.close();}return results;
}

function measurePage(){
  const doc=document.documentElement; const interactive=[...document.querySelectorAll('a,button,input,select,textarea,[role="button"],[tabindex]')];
  const offscreen=interactive.filter((el:any)=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&(r.right<0||r.left>innerWidth||r.bottom<0||r.top>innerHeight)}).slice(0,50).map((el:any)=>el.outerHTML.slice(0,180));
  const ids=[...document.querySelectorAll('[id]')].map((el:any)=>el.id).filter(Boolean); const duplicateIds=ids.filter((id,i,a)=>a.indexOf(id)!==i).filter((id,i,a)=>a.indexOf(id)===i);
  return {pageUrl:location.href,scrollWidth:doc.scrollWidth,clientWidth:doc.clientWidth,horizontalOverflow:Math.max(0,doc.scrollWidth-doc.clientWidth),maxElementRight:Math.max(0,...[...document.querySelectorAll('*')].map((el:any)=>el.getBoundingClientRect().right)),offscreenInteractive:offscreen,duplicateIds};
}

async function freePort(){return await new Promise<number>((resolve,reject)=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const a=s.address();if(typeof a==='object'&&a){const p=a.port;s.close(()=>resolve(p));}else reject(new Error('No port'));});s.on('error',reject);});}

class Cdp {
  ws:WebSocket; id=0; pending=new Map<number,{resolve:(v:any)=>void,reject:(e:any)=>void}>(); listeners=new Map<string,((p:any)=>void)[]>();
  constructor(url:string){this.ws=new WebSocket(url);this.ws.onmessage=e=>{const m=JSON.parse(String(e.data));if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}else if(m.method)for(const fn of this.listeners.get(m.method)??[])fn(m.params);};}
  async ready(){if(this.ws.readyState===WebSocket.OPEN)return;await new Promise<void>((r,j)=>{this.ws.onopen=()=>r();this.ws.onerror=()=>j(new Error('CDP websocket failed'));});}
  send(method:string,params:any={}){const id=++this.id;return new Promise<any>((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}));});}
  on(method:string,fn:(p:any)=>void){this.listeners.set(method,[...(this.listeners.get(method)??[]),fn]);}
  close(){this.ws.close();}
}
async function waitForJson(url:string,tries=60){for(let i=0;i<tries;i++){try{const r=await fetch(url);if(r.ok)return await r.json();}catch{}await new Promise(r=>setTimeout(r,100));}throw new Error(`Chromium remote debugging endpoint did not start: ${url}`);}

async function cdpAudit(url:string,outDir:string,viewports:VP[],executable?:string,html?:string){
  const exe=await browserExecutable(executable); const port=await freePort(); const profile=await mkdtemp(path.join(os.tmpdir(),'designpack-chrome-'));
  const child=spawn(exe,['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-sync','--no-sandbox','about:blank'],{stdio:'ignore'});
  const results:any[]=[];
  try{await waitForJson(`http://127.0.0.1:${port}/json/version`);for(const vp of viewports){const target=await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'}).then(r=>r.json() as any);const cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.ready();const consoleErrors:string[]=[],failedRequests:string[]=[];cdp.on('Runtime.consoleAPICalled',p=>{if(p.type==='error')consoleErrors.push((p.args??[]).map((a:any)=>a.value??a.description??'').join(' '))});cdp.on('Runtime.exceptionThrown',p=>consoleErrors.push(p.exceptionDetails?.text??'Runtime exception'));cdp.on('Network.loadingFailed',p=>failedRequests.push(`${p.errorText??'request failed'} ${p.blockedReason??''}`.trim()));await Promise.all([cdp.send('Page.enable'),cdp.send('Runtime.enable'),cdp.send('Network.enable')]);await cdp.send('Emulation.setDeviceMetricsOverride',{width:vp.width,height:vp.height,deviceScaleFactor:1,mobile:false});await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});if(html){await cdp.send('Runtime.evaluate',{expression:`document.open();document.write(${JSON.stringify(html)});document.close();`,awaitPromise:true});await new Promise(r=>setTimeout(r,150));}else{const loaded=new Promise<void>(resolve=>cdp.on('Page.loadEventFired',()=>resolve()));await cdp.send('Page.navigate',{url});await Promise.race([loaded,new Promise(r=>setTimeout(r,10000))]);await new Promise(r=>setTimeout(r,350));}const evalv=async(expr:string)=>{const r=await cdp.send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});return r.result?.value};const measurable=await evalv(`(${measurePage.toString()})()`);const basic=await evalv(`(()=>{const issues=[];document.querySelectorAll('button').forEach((e,i)=>{if(!(e.innerText||e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')))issues.push({id:'button-name',selector:'button:nth-of-type('+(i+1)+')'})});document.querySelectorAll('img').forEach((e,i)=>{if(!e.hasAttribute('alt'))issues.push({id:'image-alt',selector:'img:nth-of-type('+(i+1)+')'})});document.querySelectorAll('input').forEach((e,i)=>{const id=e.id;const named=e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||(id&&document.querySelector('label[for="'+CSS.escape(id)+'"]'));if(!named)issues.push({id:'input-name',selector:'input:nth-of-type('+(i+1)+')'})});return issues})()`);const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true});const screenshot=path.join(outDir,`${vp.name}-${vp.width}x${vp.height}.png`);await writeFile(screenshot,Buffer.from(shot.data,'base64'));results.push({viewport:vp,status:null,screenshot,measurable,consoleErrors,failedRequests,accessibility:{engine:'basic-cdp-fallback',violations:(basic??[]).map((x:any)=>({id:x.id,impact:'serious',description:'Basic accessible-name fallback check',nodes:1,selector:x.selector}))}});cdp.close();try{await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);}catch{}}}finally{child.kill('SIGTERM'); if(child.exitCode===null) await Promise.race([new Promise<void>(r=>child.once('exit',()=>r())),new Promise<void>(r=>setTimeout(r,1500))]); for(let i=0;i<3;i++){try{await rm(profile,{recursive:true,force:true,maxRetries:2,retryDelay:100});break}catch{await new Promise(r=>setTimeout(r,150))}}}return results;
}

export async function auditUrl(url:string,outDir:string,options:{executable?:string;viewports?:VP[];html?:string}={}){
  await ensureDir(outDir);const vps=options.viewports??DEFAULT_VIEWPORTS;let results=await playwrightAudit(url,outDir,vps,options.executable,options.html);let engine='playwright+axe';if(!results){results=await cdpAudit(url,outDir,vps,options.executable,options.html);engine='chromium-cdp-fallback';}
  const report={schemaVersion:1,url,capturedAt:new Date().toISOString(),engine,viewports:results};await writeFile(path.join(outDir,'audit.json'),JSON.stringify(report,null,2)+'\n','utf8');return report;
}
