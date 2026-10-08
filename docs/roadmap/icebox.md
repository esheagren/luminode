# Icebox

Feature ideas. Not prioritized - use `/prioritize` to pick the next one.

---

## Learn Experience & Content Architecture

### Unified Learn Architecture
The learn experience is currently split into two disconnected systems: (1) a standalone `/learn` page with three long-form essays, scroll-tracking, and a diagram sidebar — where all 16 diagram slots render empty placeholder divs, and (2) a `LearnPanel` sidebar inside the main app that shows tool-specific explainers (vector embeddings, PCA, distance, analogies, slicing). These systems share no state, no navigation, and no content. Unify them into a coherent architecture where educational content and interactive tools are first-class partners. Key decisions: should essays live alongside tools (in-app), on their own page, or both? Should the learn panel link into essay sections and vice versa?

### Essay Diagram Implementation
The essay infrastructure has scroll-tracked `diagramId` mappings for 16 diagram slots across all three essays (e.g., `E1_SemanticSpace`, `E2_VectorAnalogies`, `E3_RAG`), but every slot renders `PlaceholderDiagram` — an empty div. Implement actual visual content for these slots. Diagrams should range from static illustrations (for conceptual sections) to embedded interactive tools (for sections that map to existing Luminode features like analogies, nearest neighbors, slicing). This is the most direct way to connect the written content to the interactive experience.

### Learn Page Discoverability
The `/learn` page is only linked from the Footer and the About page. It's invisible from the landing page and the main app. Add prominent navigation: a "Learn" entry in the main app's nav/toolbar, a CTA on the landing page, and contextual links from the tool-specific LearnPanel content ("Want to go deeper? Read the full essay on analogies →"). The essays are substantial — they just need to be findable.

### Learn Panel Chat Assistant
Add a chat component to the LearnPanel sidebar so users can ask questions about the tool they're currently using. The chat has context about which tool is active (analogies, slicing, PCA, etc.), what the user is looking at, and the relevant educational content. Answers should be grounded in the concepts Luminode teaches — not generic AI chat. Could use Claude API with a system prompt scoped to the active tool's domain. Natural extension of the existing per-tool explainer content: static text explains the basics, chat handles follow-up questions like "why did king - man + woman land near queen?" or "what happens if the vectors are orthogonal?" or "how is this different from t-SNE?"

### Essay Content Refresh
The three existing essays cover: (1) what embeddings are and why they encode meaning, (2) visualizing and exploring embeddings (PCA, neighbors, analogies, slicing), (3) vector databases and RAG. Review and update these for accuracy, add sections where the new feature vision extends beyond current coverage (transformer internals, tokenization, attention). Consider whether new essays are needed or whether existing ones should be expanded to cover the broader scope (embedding algorithm evolution, how transformers work, matrix foundations).

---

## Transformer & Attention Visualization

### Attention Heatmap Explorer
Input a sentence and visualize attention patterns as an interactive heatmap. Show which tokens attend to which others, with layer/head selection. Helps demystify "what attention actually computes." Could use a small model (DistilBERT or similar) running server-side, or pre-computed attention snapshots for curated examples.

### Matrix Multiplication Step-Through
Animated walkthrough of how Q, K, V matrices are formed from input embeddings and multiplied during self-attention. Step-by-step: input vectors → linear projections → QK^T → softmax → weighted V sum. Each step visualized as matrix operations with color-coded cells. Target audience: anyone who wants to see what "attention is all you need" literally means in matrix terms.

### Transformer Block Walkthrough
Full animated pipeline of a single transformer block: embedding → multi-head attention → residual connection → layer norm → FFN → residual → layer norm. Users step through each stage, seeing how the matrix of token representations transforms at each point. Could start with a small (e.g. 4-token) example so the matrices stay readable.

### Multi-Head Attention Visualizer
Show how different attention heads learn to focus on different relationships (syntactic, semantic, positional). Display multiple heads simultaneously so users can see specialization. Use pre-computed examples from known models where head roles are well-documented (e.g., "this head tracks subject-verb agreement").

---

## Interpretability & Feature Activation

The natural rung above attention: not just *how* a model routes information, but *which concepts are actually active* inside it as it processes a prompt. This is the modern mechanistic-interpretability frontier (sparse autoencoders / dictionary learning), and it fits Luminode's mission — making AI internals tangible and visual — better than anything else. Luminode already renders concept-spaces in 3D and finds neighbors/axes/clusters; a feature-activation view reuses that engine on a new data source. (Idea migrated here 2026-07-16 from a discussion originally noted in the ai-aesthetics project — it belongs in Luminode.)

**Implementation reality (important):** these need model *internal activations*, not embeddings — a white-box open model. The turnkey path is **Neuronpedia** (hosted SAE features + an API) on **Gemma Scope** (DeepMind's full open-weights SAE suite for Gemma 2 2B). Deeper/custom: **SAELens + TransformerLens** or **nnsight** server-side; **circuit-tracer** (Anthropic, open-sourced 2025) for attribution graphs. Closed models (Claude, GPT) can't be probed this way — API returns no activations — so this is inherently an open-small-model feature. Good "play models": Gemma 2 2B (best SAE coverage), Pythia, GPT-2 small.

### Feature Activation Explorer
Input a word or sentence, see which internal *features* light up in a small model — "the Golden Gate Bridge," "code that opens a file," "a sense of foreboding" — ranked by activation strength, each with its top-activating examples. The pedagogical payoff of the whole "how LLMs work" track: attention shows routing, this shows *content of thought*. Data via Neuronpedia's API against Gemma 2 2B; render the active features as points/clusters in Luminode's existing 3D space so users see not just a list but the geometry of what's active.

### "What's on the model's mind" — Global Workspace view
Educational framing of Anthropic's **J-space / global workspace** work (anthropic.com/research/global-workspace, 2025): a small subset of a model's activity acts like a broadcast channel — the concepts it can *report* and *flexibly reuse* — while most processing (grammar, quick facts) runs below that line. Visualize the distinction: given an input, show the handful of "workspace" concepts vs. the background substrate. Connects Global Workspace Theory (Baars/Dehaene) to something a learner can watch happen.

### Stated Reason vs. Real Reason (faithfulness demo)
The critical-thinking capstone, and a perfect entry for the existing **Failure Case Gallery** idea. Show a case where a model's *verbalized* explanation diverges from the features actually driving its output (e.g., Anthropic's "Biology of an LLM" arithmetic example: the model says "carry the one" but computes it a different way internally). Teaches that a model's stated reasons are generated text, not a readout of the mechanism. Deep lineage worth citing in the copy: Ericsson & Simon's *protocol analysis* (verbal reports valid only for heeded working-memory contents, never for "why"), Nisbett & Wilson's "Telling More Than We Can Know" (people confabulate reasons), and the CoT-faithfulness literature (Turpin et al.). Interpretability is the first tool that can check the stated reason against the real one.

### Feature Steering Playground
Amplify or suppress a chosen feature and watch the model's output change in real time — the interpretability sibling of Luminode's existing "manipulate the vectors" ethos. Neuronpedia supports steering, so this could ride on the same integration as the Feature Activation Explorer. "Turn up the 'formality' feature and re-generate; turn up 'Golden Gate Bridge' and watch it intrude everywhere." Makes causality visceral: these features aren't just labels, they *drive* behavior.

---

## Embedding Algorithm Comparison

### Static vs Contextual Embedding Comparison
Side-by-side visualization: a word like "bank" gets ONE fixed point in GloVe space, but a CLOUD of positions in transformer space depending on context ("river bank" vs "bank account"). Users input a polysemous word and see its static embedding vs multiple contextual embeddings from different sentences. Makes the leap from Word2Vec/GloVe to BERT/GPT tangible.

### Embedding Algorithm Timeline
Interactive historical progression: one-hot → TF-IDF → Word2Vec (CBOW & Skip-gram) → GloVe → ELMo → BERT → GPT-style embeddings. Each stop on the timeline includes a mini-visualization showing how that algorithm represents meaning, what it can capture, and what it can't. Narrative thread: "each generation solved a problem the previous one couldn't."

### Tokenization Explorer
Compare how different tokenizers split the same text: character-level, BPE (GPT-2), WordPiece (BERT), SentencePiece (T5). Show that modern models don't operate on "words" at all - they operate on subword tokens. Visualize the vocabulary size tradeoffs and how rare words get decomposed. Input any text, see it tokenized side-by-side.

### Word2Vec Training Visualization
Animate the training process of Word2Vec skip-gram: show a sliding context window moving through a sentence, the prediction task ("given 'cat', predict 'sat'"), and how the embedding vectors gradually adjust. Use a tiny vocabulary (~20 words) so users can watch the entire space evolve over training steps.

---

## Interactive RAG Pipeline

### End-to-End RAG Playground
Paste a document, choose chunking strategy, embed chunks, then query. Visualize the full pipeline: chunking → embedding → vector store → query embedding → retrieval (with similarity scores) → generation. Users see their chunks appear as points in the existing vector space, then watch a query vector find the nearest chunks. Bridges the gap between Luminode's embedding explorer and real-world RAG applications.

### Chunking Strategy Comparison
Visualize different chunking strategies on the same document: fixed-size, sentence-level, paragraph-level, semantic (embedding-based splitting). Show how chunk boundaries affect retrieval quality. Color-code overlapping chunks and show what gets lost or preserved at each boundary.

### Retrieval Quality Visualizer
Given a query and a set of document chunks, visualize why certain chunks are retrieved and others aren't. Show the cosine similarity landscape - the query as a point, all chunks as points, a "retrieval radius" threshold. Let users drag the query around and see the retrieval set change in real time.

---

## Linear Algebra Foundations

### Vector Operations Playground
Interactive 2D/3D space where users manipulate vectors: add them, scale them, compute dot products, see projections. Build intuition for why dot product measures similarity (cosine of the angle). Targeted at the high school audience - no jargon, visual-first. Scaffolds up to "now imagine this in 200 dimensions."

### Matrix Transformation Visualizer
Show how a matrix transforms a set of vectors: rotation, scaling, shearing, projection. Users adjust matrix values with sliders, watch vectors move. Then connect: "a neural network layer is just a matrix multiplication followed by a non-linearity." Each slider tweak is literally what training adjusts.

### Dimensionality Intuition Builder
Interactive module that builds intuition for high-dimensional spaces. Start in 2D, then 3D, then show what happens to distance and volume as dimensions increase. Demonstrate the curse of dimensionality, why PCA works, and why cosine similarity is preferred over Euclidean distance in high dimensions. Use Luminode's existing PCA visualization as the capstone.

### Dot Product & Cosine Similarity Deep Dive
Focused interactive explanation of why cosine similarity is the standard metric for embeddings. Geometric visualization: two vectors, the angle between them, the projection of one onto the other. Show edge cases: orthogonal (unrelated), parallel (identical meaning), anti-parallel (opposite meaning). Connect to the existing distance/ruler tool.

---

## Guided Learning Paths

### Audience-Specific Learning Tracks
Three guided paths through Luminode's tools and content, tailored to different audiences:
- **"Matrices & AI" (High School):** Vector basics → matrix transformations → "a neural network is matrix multiplication" → embeddings as learned representations → play with Luminode's tools
- **"RAG for Practitioners":** What embeddings are (quick) → vector databases → chunking → retrieval → end-to-end RAG demo
- **"How LLMs Work":** Embeddings → tokenization → attention → transformer blocks → how it all composes into generation

Each track is a curated sequence of existing + new interactive modules with narrative connective tissue.

### Interactive Quizzes & Checkpoints
Lightweight comprehension checks within learning paths. "Before moving on, predict: if we add the vector for 'king' minus 'man' plus 'woman', where will we land?" User clicks a spot in the visualization, then sees the actual answer. Reinforces concepts through prediction rather than passive reading.

### Concept Prerequisite Map
Visual graph of how concepts relate and depend on each other. Users can see "to understand attention, you need: dot product, matrix multiplication, softmax." Clicking a concept opens its interactive module. Helps self-directed learners find their own path based on what they already know.

---

## Visualization & Interaction Enhancements

### Embedding Space Comparison View
Split-screen or overlay mode showing the same set of words in two different embedding spaces simultaneously (e.g., GloVe vs Llama). See how semantic neighborhoods reorganize between algorithms. Words that cluster together in one space might spread apart in another.

### Animated Training Dynamics
Show how an embedding space evolves during training. Pre-compute snapshots of embeddings at different training checkpoints, let users scrub through time. Watch clusters form, words find their neighborhoods, analogies emerge. Powerful for understanding that embeddings are *learned*, not hand-coded.

### Projection Method Comparison
Currently using PCA for dimensionality reduction. Add t-SNE and UMAP as alternatives. Let users toggle between them on the same data and see how the 2D/3D layout changes. Each method preserves different properties - teach users what each is good at.

### Cluster Highlighting
Automatic detection and coloring of semantic clusters in the visualization. When a user loads many words, highlight emergent groups (e.g., animals, emotions, tools). Option to label clusters. Helps users see structure in the embedding space without manually searching for it.

---

## Content & Examples

### Curated "Aha Moment" Examples
Pre-built examples that reliably produce interesting results for each tool. "Try the analogy: Paris - France + Japan = ?" or "Find the midpoint between 'science' and 'art'." Designed to be immediately compelling, especially for first-time users. Each example includes a brief explanation of why the result is meaningful.

### Failure Case Gallery
Curated examples where embeddings fail or produce surprising results. "Why does the analogy 'doctor - man + woman = nurse' reveal bias?" Shows limitations honestly, teaches critical evaluation of AI systems, and is particularly valuable for the educational mission.

### Interactive Essay Diagrams
Upgrade the existing essay diagrams to be interactive - tied to the live embedding tools. When the essay discusses analogies, the diagram is actually the analogy tool pre-loaded with the example. Readers can modify inputs and explore without leaving the essay context.
