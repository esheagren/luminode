// Browser-side spike: load GPT-2 small via transformers.js, run a forward pass,
// inspect which outputs the ONNX graph exposes, and test the induction signal.
// Bundled with esbuild (see package.json "bundle" script): the prebuilt
// dist/transformers.web.min.js has bare imports of onnxruntime-* that a browser
// cannot resolve without a bundler or import map.
import { env, AutoTokenizer, AutoModelForCausalLM, Tensor } from '@huggingface/transformers';

const q = new URLSearchParams(location.search);
const DEVICE = q.get('device') || 'wasm';
const DTYPE = q.get('dtype') || 'fp32';
const FILE = q.get('file') || 'model';            // onnx/<file>[suffix].onnx
const SOURCE = q.get('source') || 'local';         // local = served from /models/, remote = huggingface.co
const MODEL_ID = q.get('model') || 'Xenova/gpt2';
const N_REPEAT = Number(q.get('repeat') || 20);

const logEl = document.getElementById('log');
function log(...a) { const s = a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' '); logEl.textContent += s + '\n'; console.log(s); }
const now = () => performance.now();

// Serve ORT wasm from the installed package instead of jsDelivr.
env.backends.onnx.wasm.wasmPaths = '/node_modules/@huggingface/transformers/dist/';
env.allowLocalModels = SOURCE === 'local';
env.allowRemoteModels = SOURCE === 'remote';
env.localModelPath = '/models/';
env.useBrowserCache = SOURCE === 'remote';

const result = { params: { device: DEVICE, dtype: DTYPE, file: FILE, source: SOURCE, model: MODEL_ID }, ua: navigator.userAgent };

function sum(arr) { return arr.reduce((a, b) => a + b, 0); }
function softmaxTop(logitsRow, k) {
  let max = -Infinity; for (const v of logitsRow) if (v > max) max = v;
  let z = 0; const exps = new Float32Array(logitsRow.length);
  for (let i = 0; i < logitsRow.length; i++) { exps[i] = Math.exp(logitsRow[i] - max); z += exps[i]; }
  const idx = Array.from(exps.keys()).sort((a, b) => exps[b] - exps[a]).slice(0, k);
  return idx.map(i => ({ id: i, p: exps[i] / z }));
}
// Convert any ORT tensor (fp16 may come back as Uint16Array) to Float32Array.
function toF32(t) {
  if (t.type === 'float16') { const u = t.data; const out = new Float32Array(u.length); for (let i = 0; i < u.length; i++) out[i] = f16(u[i]); return out; }
  return t.data instanceof Float32Array ? t.data : Float32Array.from(t.data);
}
function f16(h) { const s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff; if (e === 0) return s * Math.pow(2, -14) * (f / 1024); if (e === 31) return f ? NaN : s * Infinity; return s * Math.pow(2, e - 15) * (1 + f / 1024); }

async function memory() {
  const m = {};
  if (performance.memory) m.usedJSHeapMB = +(performance.memory.usedJSHeapSize / 1048576).toFixed(1);
  if (performance.measureUserAgentSpecificMemory) {
    try { const r = await performance.measureUserAgentSpecificMemory(); m.uaSpecificMB = +(r.bytes / 1048576).toFixed(1); } catch (e) { m.uaSpecificErr = String(e); }
  }
  if (navigator.deviceMemory) m.deviceMemoryGB = navigator.deviceMemory;
  return m;
}

async function main() {
  // Backend availability
  result.backends = { webgpuApi: !!navigator.gpu, adapter: null, sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined', crossOriginIsolated: self.crossOriginIsolated, hardwareConcurrency: navigator.hardwareConcurrency };
  if (navigator.gpu) {
    try { const ad = await navigator.gpu.requestAdapter(); result.backends.adapter = ad ? { features: [...ad.features].slice(0, 10), shaderF16: ad.features.has('shader-f16'), info: ad.info ? { vendor: ad.info.vendor, architecture: ad.info.architecture, description: ad.info.description } : null } : null; } catch (e) { result.backends.adapterErr = String(e); }
  }

  // --- Load (download) ---
  const t0 = now();
  const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
  const tTok = now();
  const modelOpts = { device: DEVICE, dtype: DTYPE, model_file_name: FILE };
  const model = await AutoModelForCausalLM.from_pretrained(MODEL_ID, modelOpts);
  const tLoad = now();
  const entries = performance.getEntriesByType('resource').filter(e => /\.(onnx|json|txt|wasm|mjs)(\?|$)/.test(e.name));
  result.load = {
    tokenizerMs: +(tTok - t0).toFixed(0),
    modelMs: +(tLoad - tTok).toFixed(0),
    totalMs: +(tLoad - t0).toFixed(0),
    resourceBytes: sum(entries.map(e => e.transferSize || e.encodedBodySize || e.decodedBodySize || 0)),
    files: entries.filter(e => /\.onnx|\.wasm/.test(e.name)).map(e => ({ name: e.name.split('/').slice(-2).join('/'), bytes: e.decodedBodySize || e.transferSize, ms: +e.duration.toFixed(0) })),
    sessionInputs: model.sessions.model.inputNames,
    sessionOutputs: model.sessions.model.outputNames,
  };
  log('loaded', result.load);

  // --- Forward pass on the prompt ---
  const prompt = 'The Eiffel Tower is in the city of';
  const enc = tokenizer(prompt);
  const seq = enc.input_ids.dims[1];
  const run = async () => { const s = now(); const o = await model(enc); return { ms: now() - s, out: o }; };
  const first = await run();
  const warmTimes = []; let out = first.out;
  for (let i = 0; i < 5; i++) { const r = await run(); warmTimes.push(r.ms); out = r.out; }
  result.forward = { seqLen: seq, firstMs: +first.ms.toFixed(0), warmMs: warmTimes.map(x => +x.toFixed(0)), warmMedianMs: +warmTimes.sort((a, b) => a - b)[Math.floor(warmTimes.length / 2)].toFixed(0) };

  // --- What did the graph return? ---
  const keys = Object.keys(out);
  const shapes = {}; for (const k of keys) shapes[k] = [out[k].dims.join('x'), out[k].type];
  const hsKeys = keys.filter(k => /^hidden_states\.\d+$/.test(k)).sort((a, b) => +a.split('.')[1] - +b.split('.')[1]);
  const atKeys = keys.filter(k => /^attentions\.\d+$/.test(k)).sort((a, b) => +a.split('.')[1] - +b.split('.')[1]);
  result.outputs = {
    count: keys.length,
    nonCacheKeys: keys.filter(k => !k.startsWith('present')),
    presentCount: keys.filter(k => k.startsWith('present')).length,
    presentExampleShape: shapes[keys.find(k => k.startsWith('present'))],
    logitsShape: shapes.logits,
    hiddenStates: hsKeys.length ? { count: hsKeys.length, shape: shapes[hsKeys[0]], expected: '13 x ' + seq + ' x 768' } : null,
    attentions: atKeys.length ? { count: atKeys.length, shape: shapes[atKeys[0]], expected: '12 x 12 x ' + seq + ' x ' + seq } : null,
  };
  log('outputs', result.outputs);

  // --- Top-5 next token ---
  const logits = toF32(out.logits); const V = out.logits.dims[2];
  const last = logits.subarray((seq - 1) * V, seq * V);
  result.top5 = softmaxTop(last, 5).map(({ id, p }) => ({ token: tokenizer.decode([id]), id, p: +p.toFixed(4) }));
  log('top5', result.top5);

  // Logit-lens sanity check if hidden states exist: apply final LN + unembed to layer-6 residual at last position.
  // (Needs ln_f weights, which the ONNX graph does not expose, so just record the residual norms per layer.)
  if (hsKeys.length) {
    const D = out[hsKeys[0]].dims[2];
    result.residualNorms = hsKeys.map(k => { const d = toF32(out[k]); const row = d.subarray((seq - 1) * D, seq * D); return +Math.sqrt(row.reduce((a, b) => a + b * b, 0)).toFixed(2); });
    log('residual L2 norms at last position per layer', result.residualNorms);
  }

  // --- Induction test ---
  if (atKeys.length) {
    // Deterministic pseudo-random tokens (LCG) in a "wordy" id range.
    let s = 12345; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
    const rand = Array.from({ length: N_REPEAT }, () => 1000 + Math.floor(rnd() * 20000));
    const ids = [50256, ...rand, ...rand];
    const L = ids.length;
    const input_ids = new Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, L]);
    const attention_mask = new Tensor('int64', BigInt64Array.from(ids.map(() => 1n)), [1, L]);
    const s0 = now(); const o2 = await model({ input_ids, attention_mask }); const indMs = now() - s0;
    const perHead = []; // {layer, head, score}
    for (const k of atKeys) {
      const layer = +k.split('.')[1]; const t = o2[k]; const [, H, S] = t.dims; const d = toF32(t);
      for (let h = 0; h < H; h++) {
        let acc = 0, n = 0;
        for (let i = 1 + N_REPEAT; i < L; i++) { const j = i - (N_REPEAT - 1); acc += d[h * S * S + i * S + j]; n++; }
        perHead.push({ layer, head: h, score: +(acc / n).toFixed(3) });
      }
    }
    const known = ['L5H1', 'L5H5', 'L6H9', 'L7H2', 'L7H10'];
    const byLayer = {};
    for (const layer of [5, 6, 7]) byLayer['L' + layer] = perHead.filter(p => p.layer === layer).sort((a, b) => b.score - a.score).slice(0, 3).map(p => `H${p.head}=${p.score}`);
    const top10 = [...perHead].sort((a, b) => b.score - a.score).slice(0, 10).map(p => `L${p.layer}H${p.head}=${p.score}`);
    result.induction = { seqLen: L, forwardMs: +indMs.toFixed(0), offsetChecked: -(N_REPEAT - 1), topPerLayer5to7: byLayer, top10overall: top10, knownHeads: known.map(n => { const [, l, h] = n.match(/L(\d+)H(\d+)/); const p = perHead.find(x => x.layer === +l && x.head === +h); return `${n}=${p ? p.score : 'n/a'}`; }) };
    log('induction', result.induction);
  }

  result.memory = await memory();
  result.ok = true;
}

main().then(() => { window.__result = result; console.log('RESULT ' + JSON.stringify(result)); })
  .catch(e => { result.ok = false; result.error = String(e && e.stack || e); window.__result = result; console.log('RESULT ' + JSON.stringify(result)); });
