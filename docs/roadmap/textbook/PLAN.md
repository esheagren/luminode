# Luminode as an interactive textbook for mechanistic interpretability

**Status:** In progress (steps 1–3 started 2026-10-08)
**Branch:** `feat/textbook`
**Design proposal:** https://claude.ai/artifact/M6jmnUQNU31H9gpzUkxHzW (audit + "neurological, musical" direction + live stage sketch)

## Thesis

Luminode today is an unopinionated explorer of one vector space. It becomes a *book*: a linear sequence of chapters, each of which introduces one lens on a single stage by performing a canonical example before handing the reader the controls. The explorer survives as the "open in explorer" from every sandbox. The stage, the textbook and the design overhaul are one project because they share one renderer and one token system.

## The stage and its five lenses

| Lens | Shows | Data source |
|---|---|---|
| Space | words / features as points, neighbours as filaments, directions as intervals | Pinecone (now), precomputed bundles later |
| Stream | tokens × layers; the residual stream as a river; logit lens | GPT-2 small in the browser |
| Attention | heads as filaments between tokens; induction patterns | GPT-2 small in the browser; toy models trained in page |
| Features | sparse features per token with explanations; feature geometry | precomputed Gemma-2-2B + Gemma Scope bundles, Neuronpedia links |
| Circuit | heads/features as nodes, influence as edges; patching; attribution graphs | GPT-2 small live (IOI, patching); Gemma bundles (attribution, steering) |

One scene model (nodes, edges, paths, pulses, a time axis) feeds every lens. One visual grammar: things are nodes, relations are filaments, computation is activation spreading on a tempo.

## Chapter shape

Every chapter: **claim** (2–3 sentences) → **performance** (sandbox arrives loaded and plays the canonical example on the beat) → **try** (ghosted suggestions) → **handoff** (open in explorer with the same state) → **bridge** (one sentence that makes the next chapter necessary). See `CURRICULUM.md`.

## Engine decisions

- **Live model:** GPT-2 small (124M) in the browser via transformers.js 3.8.1 on wasm, q8 (128 MB, ~27 ms per forward pass). Hidden states and attentions are exposed by ONNX graph surgery (`spikes/gpt2-browser/add_probe_outputs.py`); stock exports return only logits. q8 on WebGPU is silently wrong, so WebGPU only with fp32. Plus a hand-written JS forward pass for step-through anatomy. Full results in `spikes/gpt2-browser.md`.
- **Rich features / steering / attribution:** Gemma-2-2B with Gemma Scope SAEs, computed offline (TransformerLens, SAELens, circuit-tracer) into JSON bundles under `data/`. Neuronpedia for explanations by link.
- **Part I** keeps Pinecone as is.

## Steps

| # | Step | Size | Status |
|---|---|---|---|
| 1 | Spike GPT-2 small in the browser (download, latency, memory, hidden states + attentions) | ½ day | done: GO (see `spikes/gpt2-browser.md`) |
| 2 | Foundation: merge PR #2 content, delete dead code and `.next/`, strip fake styled-jsx, `tokens.css` | 1–2 days | done (commit d3836cf) |
| 3 | `/admin` design space: curriculum map, lens prototypes, token dials, audit checklist | 2–3 days | done, first pass (commit 11c211e) |
| 4 | Stage: scene model + renderer (Retina, zoom/pan, glow, filaments, halos, collision), Space lens, tools migrated, 3D parity | ~1 week | |
| 5 | Textbook shell (chapter model with performances as scripted actions), landing Begin/Explore, Part I rewritten | 3–4 days | |
| 6 | Engine + Part II: GPT-2 in page, Stream + Attention lenses, tokens → forward pass → residual/logit lens → attention → induction | 1.5–2 weeks | |
| 7 | Offline pipeline + Part III: Python → `data/` bundles, Features lens, superposition toy, SAE features, feature geometry | 1.5 weeks | |
| 8 | Circuits + Experiment (Parts IV, V): Circuit lens, IOI with live patching, attribution graphs, steering, methods chapter | 2 weeks | |
| 9 | Tempo, sound, access: motion tokens, breathing loaders, sonification toggle, keyboard, reduced motion, one mobile tree | 3–4 days | |
| 10 | Content pass: prose, examples, colophon replaces About | ongoing | |

Pattern from step 4 on: prototype the lens in `/admin` → build its renderer → write its chapters.

## Decisions log

- 2026-10-07 Erik: current design is stale; keep the landing animation; direction "musical and neurological".
- 2026-10-08 Erik: broaden to mech interp (features, circuits); textbook over explorer; `/admin` design space.
- 2026-10-08 Claude recommendation, pending Erik: GPT-2 small live + Gemma precomputed; book linear with Part I skippable.
- 2026-10-08 Spike: GPT-2 small in browser is GO; the five canonical induction heads rank top 5 of 144 in the browser.
- Open: serif vs sans for words; sound in scope; rewrite vs refactor 2D renderer (plan assumes rewrite).

## Working agreements

- Nothing is built on the real stage before it is dialled in under `/admin`.
- Build and lint stay green on every commit.
- No new colour, size or duration literals in components: tokens only (`src/styles/tokens.css`).
