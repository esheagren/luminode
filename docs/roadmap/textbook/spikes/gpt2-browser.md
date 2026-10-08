# Spike: GPT-2 small live in the browser

**Date:** 2026-10-08 · **Code:** `spikes/gpt2-browser/` · **Machine:** M-series Mac, 12 cores, 16 GB, Chromium 148 headless (Playwright 1.49.1)
**Question:** can GPT-2 small run in the browser well enough to power live chapters on the forward pass, residual stream, logit lens, attention patterns and induction heads?

## Verdict: GO (with one required preprocessing step)

GPT-2 small runs in headless Chromium on the wasm backend at ~20–30 ms per 10-token forward pass, returns all 13 residual-stream
tensors and all 12 attention maps, predicts " Paris" for the Eiffel Tower prompt, and the induction-diagonal test picks out
exactly the five canonical induction heads (L5H1, L5H5, L6H9, L7H2, L7H10) as the top five of 144 heads.

The catch: **no published GPT-2 ONNX export exposes hidden states or attentions.** `Xenova/gpt2` and `onnx-community/gpt2-ONNX`
output `logits` + 24 KV-cache tensors only; transformers.js' `output_attentions` flag only works for models exported with them.
A 60-line ONNX graph-surgery script (`add_probe_outputs.py`, no PyTorch needed) adds the outputs to the stock file; the result
must be hosted by us (HF repo or `public/models/`). That is the one-time step this plan depends on.

## Results

All runs: prompt "The Eiffel Tower is in the city of" (10 tokens), 1 cold + 5 warm forwards, served from localhost unless noted.
"probe" = stock graph + our extra outputs. Heap = `performance.memory.usedJSHeapSize` at end of run (excludes wasm linear memory where
the weights actually live, so treat as a floor).

| Model file (dtype) | Backend | Size | Load (local) | 1st fwd | warm fwd | hidden/attn returned | top-1 | Induction top heads (L5–7) | Heap |
|---|---|---|---|---|---|---|---|---|---|
| model_probe_quantized (q8) | wasm | 128 MB | 0.98 s | 91 ms | **27 ms** | 13×[1,10,768] / 12×[1,12,10,10] | " Paris" .105 | L5H5 .76, L5H1 .59 · L6H9 .83 · L7H10 .79, L7H2 .66 | 169 MB |
| model_probe (fp32) | wasm | 501 MB | 1.8 s | 49 ms | **19 ms** | yes, same shapes | " Paris" .070 | L5H5 .94, L5H1 .87 · L6H9 .89 · L7H10 .87, L7H2 .79 | 527 MB |
| model_probe_fp16 (fp16) | wasm | 251 MB | 0.9 s | 82 ms | 43 ms | yes (fp16 tensors) | " Paris" | matches fp32 ranking | 48 MB |
| model_probe (fp32) | **webgpu** (Metal) | 501 MB | 2.1 s | 225 ms | 28 ms | yes | " Paris" .070 | identical to fp32 wasm | 36 MB |
| model_probe_quantized (q8) | webgpu | 128 MB | 0.9 s | 532 ms | 57 ms | shapes yes, **values garbage** | " mastered" | all ≈ 0.02 — WRONG | 43 MB |
| model_probe_fp16 / stock model_fp16 | webgpu | 251 MB | fails | – | – | – | – | ORT session create throws (numeric wasm error) | – |
| stock decoder_model_merged (q8) | wasm | 128 MB | 0.8 s | 78 ms | 24 ms | **none** (logits + present.* only) | " Paris" | n/a | 169 MB |
| stock decoder_model_merged (q8), **cold from huggingface.co** | wasm | 128 MB | **8.3 s** (128.3 MB over the wire) | 75 ms | 25 ms | none | " Paris" | n/a | 43 MB |
| stock model (fp32) | webgpu | 501 MB | 1.9 s | 86 ms | 10 ms | none | " Paris" | n/a | 527 MB |

Other measurements:
- Fixed overhead per page: ORT wasm runtime 21.6 MB (`ort-wasm-simd-threaded.jsep.wasm`) + esbuild bundle 2.0 MB + tokenizer 2.1 MB + vocab/merges 1.3 MB.
- Induction test: `<|endoftext|>` + 20 random tokens ×2 (41 tokens): 76 ms (q8 wasm), 42 ms (fp32 webgpu). Mean attention on the i→i−19 diagonal; top-10 overall in q8 = L6H9 .83, L7H10 .79, L5H5 .76, L7H2 .66, L10H7 .64, L5H1 .59, L9H6 .54, L10H1 .50, L9H9 .47, L11H10 .46.
- Residual-stream L2 norm at the last position grows 4.7 → 54 → … → 406 across layers 0–12 (the familiar norm growth; useful for the Stream chapter).
- WebGPU in headless Chromium: `navigator.gpu.requestAdapter()` returns null by default; with `--enable-unsafe-webgpu --enable-features=Vulkan,WebGPU --use-angle=metal --ignore-gpu-blocklist` both the headless shell and full Chromium get an Apple metal-3 adapter with `shader-f16`. Shipping browsers' WebGPU availability was not tested here; the app must feature-detect `navigator.gpu` and fall back to wasm.
- transformers.js' prebuilt `dist/transformers.web.min.js` has bare `import "onnxruntime-common"` specifiers; load it through a bundler (we use esbuild in the spike, Vite in the app) or an import map, never as a raw `<script type=module>`. Loading needs COOP/COEP headers for the multithreaded wasm (we send them from the spike server; needs the same on Netlify/Vercel).

## Practical constraints

- **Download:** 128 MB (q8) is the floor for a model that also carries probes; fp32 is 501 MB. 8.3 s cold on this office connection (~15 MB/s); ~100 s at 10 Mbit/s. transformers.js caches in the browser Cache API, so second visits are local-speed. Serve from our own origin or HF with `Cache-Control`; ship a visible progress bar (`progress_callback` option) and start the fetch on the chapter before the first live one.
- **Cold start:** session creation adds ~0.8–1.8 s after download; first forward 50–100 ms on wasm; later forwards 20–30 ms, which is well under one animation beat. Keep one model instance per page (a module singleton) — re-creating sessions is the expensive part.
- **Memory:** fp32 holds ~500 MB in wasm memory plus ~500 MB JS heap transiently during load; q8 is ~170 MB peak. On mobile Safari (≈1–1.5 GB per tab) only q8 is realistic, and iOS wasm has no SIMD-threads in some versions, so expect 3–5× slower forwards there. Not measured here (no device).
- **Backends:** use wasm + q8 as the default. WebGPU only pays off for fp32 (10 ms stock; 28 ms with probes because 25 probe tensors are read back from the GPU each call) and costs 4× the download; q8 on WebGPU is silently wrong and fp16 does not load in ORT-web 1.22 (bundled with transformers.js 3.8.1) — do not offer them.
- **Sequence length:** attentions are 12×12×seq² floats; at 128 tokens that is 9.4 MB per forward, fine; at 1024 it is 600 MB, so cap live chapters at ~256 tokens.
- **Logit lens:** hidden states are returned, but `ln_f` weight/bias and `wte` are not. Either expose `ln_f_out`-style outputs per layer in the same surgery (cheap, 768 floats × seq × 13) or fetch `ln_f` params (6 KB) + `wte` (fp16, 77 MB) once; the former is better. Not done in this spike.

## Exact recipe that worked

Model id `Xenova/gpt2` (files as of 2025-08-18; `onnx-community/gpt2-ONNX` is the same export minus the legacy `decoder_*` files).
Our probe file is built from `onnx/decoder_model_merged_quantized.onnx` (128 MB, the only fully-int8 file; `model_int8.onnx` is 281 MB because it leaves embeddings in fp32).

```
cd spikes/gpt2-browser && npm ci                      # @huggingface/transformers 3.8.1, playwright 1.49.1, esbuild 0.24.2
python -m venv .venv && .venv/bin/pip install onnx onnxruntime numpy
.venv/bin/python add_probe_outputs.py model-cache/Xenova/gpt2/onnx/decoder_model_merged_quantized.onnx \
                                      model-cache/Xenova/gpt2/onnx/model_probe_quantized.onnx
.venv/bin/python validate_probe.py model-cache/Xenova/gpt2/onnx/model_probe_quantized.onnx   # shapes, row sums, causal mask
npm run bundle && node run.js --file model_probe --dtype q8 --device wasm --source local --label probe-q8-wasm
```

`add_probe_outputs.py` resolves tensors by *node* name (stable across fp32/fp16/q8 exports): the input of `/transformer/h.{i}/ln_1/ReduceMean`
is `hidden_states.{i}`, the input of `/transformer/ln_f/ReduceMean` is `hidden_states.12`, the output of `/transformer/h.{i}/attn/Softmax` is
`attentions.{i}`. It appends an `Identity` + graph output to **both** branches of the optimum `If` node, then to the `If` node and outer graph.

Browser side (`main.js`):

```js
import { env, AutoTokenizer, AutoModelForCausalLM, Tensor } from '@huggingface/transformers';
env.backends.onnx.wasm.wasmPaths = '/node_modules/@huggingface/transformers/dist/';   // or copy the 2 ORT files to public/
env.localModelPath = '/models/'; env.allowRemoteModels = false;                        // our hosted copy of Xenova/gpt2 + probe file
const tok = await AutoTokenizer.from_pretrained('Xenova/gpt2');
const model = await AutoModelForCausalLM.from_pretrained('Xenova/gpt2', { device: 'wasm', dtype: 'q8', model_file_name: 'model_probe' });
const out = await model(tok('The Eiffel Tower is in the city of'));       // plain forward, no generate()
out.logits            // Tensor [1, seq, 50257]
out['hidden_states.0'] … out['hidden_states.12']   // Tensor [1, seq, 768] each (Float32Array in .data)
out['attentions.0']   … out['attentions.11']       // Tensor [1, 12, seq, seq], rows sum to 1, causal
out['ln_f_out']       // [1, seq, 768]; out['present.N.key/value'] also present (ignore)
```

`model_file_name: 'model_probe'` + `dtype: 'q8'` resolves to `onnx/model_probe_quantized.onnx`; `fp32` → `model_probe.onnx`, `fp16` → `model_probe_fp16.onnx`.
transformers.js' `sessionRun` returns every ONNX graph output by name, which is why no library patch is needed.

## Failures / dead ends recorded

- Raw `<script type=module src=dist/transformers.web.min.js>` fails (`Failed to resolve module specifier "onnxruntime-common"`); cost a 15-min timeout before the runner aborted on page errors.
- The first surgery used tensor names (`/transformer/Add_output_0`), which is an int64 position tensor in the with-cache branch and has different names in the fp16 export; resolving by node name fixed both.
- `performance.measureUserAgentSpecificMemory` is unavailable in headless shell even with COOP/COEP; only `performance.memory` worked.
- q8 + WebGPU returns plausible shapes but wrong numbers (no error raised) — any backend switch must be validated against the " Paris" / induction checks, which this spike's page does automatically.

## Recommendation for the textbook

Ship `model_probe_quantized.onnx` (128 MB) on wasm as the live engine for Stream, Attention and the induction chapter; treat WebGPU fp32 as an opt-in "high fidelity" toggle only on desktop after an in-page correctness check. Keep the hand-written JS forward pass for step-through anatomy as planned; use the ONNX model for anything that needs the real weights at interactive speed. Next step: add per-layer logit-lens outputs to the surgery and publish the probe file to a `luminode/gpt2-probe` HF repo so the app can load it with `env.remoteHost`.
