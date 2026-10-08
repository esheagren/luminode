// Mirrors docs/roadmap/textbook/CURRICULUM.md. Edit the markdown first, then this file.

export const LENSES = ['Space', 'Stream', 'Attention', 'Features', 'Circuit', 'Experiment']

export const DATA_SOURCES = [
  { id: 'pinecone', label: 'Pinecone' },
  { id: 'gpt2', label: 'GPT-2 small, live' },
  { id: 'toy', label: 'Toy model, trained in page' },
  { id: 'gemma', label: 'Gemma-2-2B / Gemma Scope, precomputed' },
  { id: 'all', label: 'All of the above' },
]

export const STATUSES = ['idea', 'prototyped', 'built', 'polished']

export const MOVEMENTS = [
  { id: 1, numeral: 'I', title: 'Meaning as geometry', lenses: ['Space'], data: ['pinecone'] },
  { id: 2, numeral: 'II', title: 'The stream', lenses: ['Stream', 'Attention'], data: ['gpt2', 'toy'] },
  { id: 3, numeral: 'III', title: 'Features', lenses: ['Features', 'Space'], data: ['toy', 'gemma'] },
  { id: 4, numeral: 'IV', title: 'Circuits', lenses: ['Circuit'], data: ['gpt2', 'gemma'] },
  { id: 5, numeral: 'V', title: 'How we know', lenses: ['Experiment'], data: ['all'] },
]

export const CHAPTERS = [
  {
    n: 1, movement: 1, title: 'Words become points', lens: 'Space', data: 'pinecone', status: 'prototyped',
    claim: 'A word is a position. Nearby positions mean nearby things.',
    performance: 'cat, dog, horse arrive and cluster; car, truck, bus arrive apart.',
    try: 'Add banana, violin.',
    bridge: 'Position is meaning. But what is a direction?',
  },
  {
    n: 2, movement: 1, title: 'Directions are relations', lens: 'Space', data: 'pinecone', status: 'idea',
    claim: 'A relation between two words is a direction, and directions can be moved.',
    performance: 'king→queen interval lights, slides to man→woman, lands.',
    try: 'hamburger→America as pizza→? ; project onto a gender axis.',
    bridge: 'Every relation is a direction. Which ones does the space actually have?',
  },
  {
    n: 3, movement: 1, title: 'Flattening', lens: 'Space', data: 'pinecone', status: 'idea',
    claim: 'What you see is a projection of a 1024-dimensional space; distances lie a little.',
    performance: 'The same words in 3D rotate into 2D; a near pair separates.',
    try: 'Measure two words in 2D vs 3D.',
    bridge: 'The picture is a projection. The truth is 1024-D.',
  },
  {
    n: 4, movement: 1, title: 'Paths through meaning', lens: 'Space', data: 'pinecone', status: 'idea',
    claim: 'Between any two words there is a path, and the path has a shape.',
    performance: 'A slice from cold to hot plays as a phrase.',
    try: 'Linear vs greedy path between two words.',
    bridge: 'bank is one point here. It should be two.',
  },
  {
    n: 5, movement: 2, title: 'Tokens, not words', lens: 'Stream', data: 'gpt2', status: 'idea',
    claim: 'The model never sees words; it sees pieces chosen by frequency.',
    performance: '"Luminode" splits into pieces on the beat.',
    try: 'Type anything, watch BPE.',
    bridge: 'Each piece gets a vector. Then what?',
  },
  {
    n: 6, movement: 2, title: 'The forward pass', lens: 'Stream', data: 'gpt2', status: 'idea',
    claim: 'One vector per token, and every block adds to it.',
    performance: 'One sub-step per beat: embed, +position, attention read, write, MLP, write, …, unembed.',
    try: 'Step through; pause anywhere.',
    bridge: 'Every block adds to one vector per token.',
  },
  {
    n: 7, movement: 2, title: 'The residual stream', lens: 'Stream', data: 'gpt2', status: 'idea',
    claim: 'The answer is written into the stream gradually; you can read it early.',
    performance: 'A token\'s vector travels layer by layer in the Space lens; logit lens staircase shows when "Paris" appears.',
    try: 'Different prompts; watch the staircase.',
    bridge: 'Where did the information come from? Other tokens.',
  },
  {
    n: 8, movement: 2, title: 'Attention', lens: 'Attention', data: 'gpt2', status: 'idea',
    claim: 'Attention is how a token reads from the others; a head is one reading rule.',
    performance: 'A head\'s filaments from each token to what it reads.',
    try: 'Head/layer selectors; previous-token and positional heads.',
    bridge: 'Some heads do something you can name.',
  },
  {
    n: 9, movement: 2, title: 'Induction heads', lens: 'Attention', data: 'toy', status: 'idea',
    claim: 'A two-head circuit copies patterns, and it appears suddenly during training.',
    performance: 'Random tokens repeated; the diagonal lights on the second copy.',
    try: 'Ablate the head, loss jumps; train a 2-layer toy and watch the bump appear.',
    bridge: 'Named mechanisms exist. But neurons are not the unit.',
  },
  {
    n: 10, movement: 3, title: 'Superposition', lens: 'Features', data: 'toy', status: 'idea',
    claim: 'A model stores more features than it has dimensions by overlapping them.',
    performance: 'Toy model trains; sparsity slider; the pentagon appears.',
    try: 'Change sparsity, dimension.',
    bridge: 'More features than dimensions. So how do we read them?',
  },
  {
    n: 11, movement: 3, title: 'Dictionary learning', lens: 'Features', data: 'gemma', status: 'idea',
    claim: 'A sparse dictionary pulls the overlapped features apart into nameable ones.',
    performance: 'A sentence; sparse features fire per token with explanations.',
    try: 'Curated prompts; try-your-own (offline, honest).',
    bridge: 'Features are directions. Directions have geometry.',
  },
  {
    n: 12, movement: 3, title: 'Feature geometry', lens: 'Space', data: 'gemma', status: 'idea',
    claim: 'Features sit in a space of their own, and that space has neighbourhoods too.',
    performance: 'Features as points in the Space lens; splitting.',
    try: 'Neighbours of a feature.',
    bridge: 'Features compose into computations.',
  },
  {
    n: 13, movement: 4, title: 'Circuits as graphs', lens: 'Circuit', data: 'gpt2', status: 'idea',
    claim: 'A behaviour is a graph of heads and features passing information.',
    performance: 'The IOI circuit draws itself head by head.',
    try: 'Hover roles (name mover, S-inhibition, …).',
    bridge: 'A story. Is it true?',
  },
  {
    n: 14, movement: 4, title: 'Activation patching', lens: 'Circuit', data: 'gpt2', status: 'idea',
    claim: 'Swap one activation and measure the output; that is what causal evidence looks like.',
    performance: 'Patch one head, logit difference moves on the beat.',
    try: 'Patch any head/position.',
    bridge: 'Whole-prompt stories: attribution graphs.',
  },
  {
    n: 15, movement: 4, title: 'Attribution graphs', lens: 'Circuit', data: 'gemma', status: 'idea',
    claim: 'For one prompt, the whole feature-to-feature story can be drawn.',
    performance: 'A precomputed graph for one prompt plays feature→feature.',
    try: 'Curated prompts.',
    bridge: 'If features cause outputs, we can turn the dial.',
  },
  {
    n: 16, movement: 4, title: 'Steering', lens: 'Circuit', data: 'gemma', status: 'idea',
    claim: 'Add a feature direction and the output changes; causes can be pushed.',
    performance: 'Add a feature direction; output changes (precomputed).',
    try: 'Curated features.',
    bridge: 'What can a circuit story claim?',
  },
  {
    n: 17, movement: 5, title: 'Ablation, patching, faithfulness', lens: 'Experiment', data: 'all', status: 'idea',
    claim: 'Every earlier picture was an experiment; here are the rules of the experiments.',
    performance: 'Earlier examples re-run as counterfactuals.',
    try: 'Design an ablation.',
    bridge: 'Stated reason vs real reason.',
  },
  {
    n: 18, movement: 5, title: 'Stated reason vs real reason', lens: 'Experiment', data: 'all', status: 'idea',
    claim: 'What a model says drove its answer and what did drive it can differ.',
    performance: 'A case where the verbalised explanation diverges from the driving features.',
    try: '—',
    bridge: 'Colophon.',
  },
]
