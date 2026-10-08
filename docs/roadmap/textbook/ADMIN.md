# `/admin` — the design space

A hidden route (unlisted, no auth; not linked from the app) where the textbook and the design system are dialled in before anything is built on the real stage. It lives in the repo under `src/admin/` so it evolves with the product. It uses `tokens.css` and nothing else from the legacy styling.

## Panes (tabs along the top, deep-linkable by hash)

### 1. Map
The curriculum as a path of chapter nodes grouped into the five movements (data from `src/admin/data/curriculum.js`, mirroring `CURRICULUM.md`). Each node shows number, title, lens, data source, status (`idea | prototyped | built | polished`). Clicking a node opens a side note with claim / performance / try / bridge text, editable in place for the session (not persisted). A legend of lenses and data sources. This pane is the shared mental model.

### 2. Lenses
One live prototype per lens, each a self-contained canvas component on example data, rendered with the tokens:
- **Space**: ~35 hand-placed words in clusters, k-NN filaments, spreading activation on the beat, click to fire. (Port of the sketch in the design proposal.)
- **Stream**: tokens as columns, 12 layers as rows, one residual line per token thickening as blocks write into it; a scrubber steps sub-steps on the beat; a logit-lens staircase on the right from fake per-layer top-tokens.
- **Attention**: tokens in a row, one head's pattern as filaments with alpha = weight; head/layer selectors; a fake induction pattern on a repeated sequence.
- **Features**: a sentence; per-token sparse feature bars with explanation strings; hovering a feature highlights its tokens.
- **Circuit**: a small DAG of heads/features with influence edges; a "patch" button that dims one node and animates the logit difference.
Each prototype has a caption stating what is real and what is fake data. Prototypes read the live token values, so the dials re-skin them in place.

### 3. Dials
The token system as controls: colour (ink, field, raise, fg, mute, amber, ember, phosphor), type (display/body/mono family pickers from a short list, base size, scale ratio), tempo (bpm; durations derive), easing presets. Changes write CSS custom properties on `document.documentElement` so every pane updates live. "Export tokens.css" renders the current values as the file text in a copyable block. "Reset" restores the committed values. Includes a type specimen and a motion strip (the four durations animating) so the dials can be judged.

### 4. Audit
The findings from the 2026-10-07 audit as a checklist grouped by Colour / UX / Code / Motion / Access, each with status (`open | fixed | wontfix`) and the step that absorbs it. Data in `src/admin/data/audit.js`. Session-local toggles.

## Constraints
- Route: `/admin` and `/admin/:pane`. Add to `App.jsx` only; do not change other routes.
- Styling: CSS Modules + tokens only. No literals for colour, size or duration in components.
- Fonts: load Cormorant Garamond, Manrope, JetBrains Mono from Google Fonts in `index.html` (this is the one shared change outside `src/admin/`).
- Canvas: devicePixelRatio-aware, time-based (not frame-based) animation, honours `prefers-reduced-motion`.
- No new dependencies.
- Works at 390px wide (panes stack; prototypes shrink).
