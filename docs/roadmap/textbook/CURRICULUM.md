# Curriculum

Five movements. Each chapter lists its lens, its data source, the canonical example the sandbox *performs* on arrival, what the reader is invited to try, and the bridge to the next chapter. Part I is skippable by readers who already know embeddings; everything else is linear.

## I. Meaning as geometry — lens: Space — data: Pinecone

| # | Chapter | Performance | Try | Bridge |
|---|---|---|---|---|
| 1 | Words become points | cat, dog, horse arrive and cluster; car, truck, bus arrive apart | add `banana`, `violin` | "Position is meaning. But what is a *direction*?" |
| 2 | Directions are relations | king→queen interval lights, slides to man→woman, lands | hamburger→America as pizza→? ; project onto a gender axis | "Every relation is a direction. Which ones does the space actually have?" |
| 3 | Flattening | the same words in 3D rotate into 2D; a near pair separates | measure two words in 2D vs 3D | "The picture is a projection. The truth is 1024-D." |
| 4 | Paths through meaning | a slice from `cold` to `hot` plays as a phrase | linear vs greedy path between two words | "`bank` is one point here. It should be two." |

## II. The stream — lenses: Stream, Attention — data: GPT-2 small live; toy models trained in page

| # | Chapter | Performance | Try | Bridge |
|---|---|---|---|---|
| 5 | Tokens, not words | "Luminode" splits into pieces on the beat | type anything, watch BPE | "Each piece gets a vector. Then what?" |
| 6 | The forward pass | one sub-step per beat: embed, +position, attention read, write, MLP, write, …, unembed | step through; pause anywhere | "Every block *adds* to one vector per token." |
| 7 | The residual stream | a token's vector travels layer by layer in the Space lens; logit lens staircase shows when "Paris" appears | different prompts; watch the staircase | "Where did the information come from? Other tokens." |
| 8 | Attention | a head's filaments from each token to what it reads | head/layer selectors; previous-token and positional heads | "Some heads do something you can name." |
| 9 | Induction heads | random tokens repeated; the diagonal lights on the second copy | ablate the head, loss jumps; train a 2-layer toy and watch the bump appear | "Named mechanisms exist. But neurons are not the unit." |

## III. Features — lens: Features (+ Space) — data: in-page toy; precomputed Gemma-2-2B / Gemma Scope

| # | Chapter | Performance | Try | Bridge |
|---|---|---|---|---|
| 10 | Superposition | toy model trains; sparsity slider; the pentagon appears | change sparsity, dimension | "More features than dimensions. So how do we read them?" |
| 11 | Dictionary learning | a sentence; sparse features fire per token with explanations | curated prompts; try-your-own (offline, honest) | "Features are directions. Directions have geometry." |
| 12 | Feature geometry | features as points in the Space lens; splitting | neighbours of a feature | "Features compose into computations." |

## IV. Circuits — lens: Circuit — data: GPT-2 small live; Gemma bundles

| # | Chapter | Performance | Try | Bridge |
|---|---|---|---|---|
| 13 | Circuits as graphs | the IOI circuit draws itself head by head | hover roles (name mover, S-inhibition, …) | "A story. Is it true?" |
| 14 | Activation patching | patch one head, logit difference moves on the beat | patch any head/position | "Whole-prompt stories: attribution graphs." |
| 15 | Attribution graphs | a precomputed graph for one prompt plays feature→feature | curated prompts | "If features cause outputs, we can turn the dial." |
| 16 | Steering | add a feature direction; output changes (precomputed) | curated features | "What can a circuit story claim?" |

## V. How we know — lens: Experiment — data: all of the above

| # | Chapter | Performance | Try | Bridge |
|---|---|---|---|---|
| 17 | Ablation, patching, faithfulness | earlier examples re-run as counterfactuals | design an ablation | "Stated reason vs real reason." |
| 18 | Stated reason vs real reason | a case where the verbalised explanation diverges from the driving features | — | colophon |

## Sources to cite in copy

Olsson et al. 2022 (induction heads); Elhage et al. 2021 (mathematical framework), 2022 (superposition); Wang et al. 2022 (IOI); Hanna et al. 2023 (greater-than); Bricken et al. 2023 and Templeton et al. 2024 (dictionary learning, scaling monosemanticity); Lieberum et al. 2024 (Gemma Scope); Dunefsky et al. 2024 (transcoders); Ameisen et al. / Lindsey et al. 2025 (circuit tracing, biology of an LLM); nostalgebraist 2020 (logit lens); Turpin et al. 2023 (CoT faithfulness).
