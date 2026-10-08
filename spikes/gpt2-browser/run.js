// Playwright driver: starts the static server, opens index.html in headless
// Chromium with the given params, captures the RESULT JSON from the console
// and network byte counts, and writes results/<label>.json.
// Usage: node run.js --device wasm --dtype fp32 --file model --source local --label name [--browser shell|full]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => { if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]]); return acc; }, []));
const device = args.device || 'wasm', dtype = args.dtype || 'fp32', file = args.file || 'model', source = args.source || 'local';
const label = args.label || `${file}-${dtype}-${device}-${source}`;
const timeoutMs = Number(args.timeout || 900000);

const SHELL = '/Users/erik/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const FULL = '/Users/erik/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const executablePath = args.browser === 'full' ? FULL : SHELL;

const PORT = Number(args.port || 8765);
const server = spawn(process.execPath, [path.join(ROOT, 'server.js')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 400));

const launchArgs = [];
if (device === 'webgpu') launchArgs.push('--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist');
const browser = await chromium.launch({ executablePath, headless: true, args: launchArgs });
const context = await browser.newContext();
const page = await context.newPage();

let resultJson = null; const consoleLines = []; const net = { hfBytes: 0, hfRequests: 0, localBytes: 0, onnxFiles: [] };
page.on('console', m => { const t = m.text(); consoleLines.push(t); if (t.startsWith('RESULT ')) resultJson = JSON.parse(t.slice(7)); else if (process.env.VERBOSE) console.log('[page]', t.slice(0, 300)); });
let pageError = null; let rejectWait = null;
page.on('pageerror', e => { consoleLines.push('PAGEERROR ' + e.message); pageError = e.message; if (rejectWait) rejectWait(new Error('pageerror: ' + e.message)); });
page.on('response', async r => {
  const url = r.url(); const len = Number(r.headers()['content-length'] || 0);
  if (/huggingface\.co|hf\.co|cdn-lfs/.test(url)) { net.hfRequests++; if (r.status() === 200) net.hfBytes += len; }
  else if (url.startsWith(`http://127.0.0.1:${PORT}`)) net.localBytes += len;
  if (/\.onnx/.test(url) && r.status() === 200) net.onnxFiles.push({ url: url.split('/').slice(-2).join('/'), bytes: len });
});

const url = `http://127.0.0.1:${PORT}/?device=${device}&dtype=${dtype}&file=${file}&source=${source}&model=${args.model || 'Xenova/gpt2'}`;
const t0 = Date.now();
await page.goto(url);
try {
  await Promise.race([
    page.waitForFunction(() => window.__result !== undefined, null, { timeout: timeoutMs }),
    new Promise((_, rej) => { rejectWait = rej; if (pageError) rej(new Error('pageerror: ' + pageError)); }),
  ]);
} catch (e) { consoleLines.push('ABORT waiting for result: ' + e.message); }
const result = (await page.evaluate(() => window.__result)) || resultJson || { ok: false, error: pageError || 'no result' };
result.wallMs = Date.now() - t0;
result.net = net;
result.browser = { executable: path.basename(executablePath), args: launchArgs, version: browser.version() };
result.consoleTail = consoleLines.filter(l => !l.startsWith('RESULT ')).slice(-15);

fs.mkdirSync(path.join(ROOT, 'results'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'results', label + '.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ label, ok: result.ok, error: result.error, load: result.load && { totalMs: result.load.totalMs, bytes: result.load.resourceBytes }, forward: result.forward, top5: result.top5 && result.top5.map(t => t.token), hidden: result.outputs && result.outputs.hiddenStates, attn: result.outputs && result.outputs.attentions, induction: result.induction && result.induction.topPerLayer5to7, known: result.induction && result.induction.knownHeads, backends: result.backends, memory: result.memory, net, wallMs: result.wallMs, tail: result.consoleTail.slice(-4) }, null, 1));

await browser.close();
server.kill();
