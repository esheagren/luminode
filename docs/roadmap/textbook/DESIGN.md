# Design system (summary)

Full proposal with live sketch: https://claude.ai/artifact/M6jmnUQNU31H9gpzUkxHzW

## Principle

A nervous system that keeps time. *Neurological* is about space: a word is a neuron (core + halo), neighbours are filaments, meaning is activity that spreads and fades. *Musical* is about time: one tempo, one easing, results arrive as an arpeggio, similarity is consonance (near = warm and loud, far = cool and quiet).

## Colour

One ground, one signal, one attenuation. Tools do not own hues; a tool owns a line texture (solid = measured relation, dotted = projection, travelling pulse = path).

| Token | Value | Role |
|---|---|---|
| `--ink` | #070a16 | page |
| `--field` | #0c1226 | stage |
| `--raise` | #121a33 | rail, cards |
| `--fg` | #ece7dc | text (alabaster) |
| `--mute` | #8b90a6 | secondary |
| `--amber` | #f0a83a | query, near |
| `--ember` | #ff8a3d | firing |
| `--phosphor` | #9bb0ff | far, attenuated |

Query words amber. Results on the amber→phosphor ramp by similarity. Context alabaster at 25%. Errors dim the field and put one sentence in the margin; nothing is red.

## Type

Display: Cormorant Garamond (italic for words). Interface: Manrope. Data: JetBrains Mono. Scale 0.72 / 0.82 / 0.95 / 1.2 / 1.5 / 2.5 rem. Canvas labels use the same faces with a halo and collision avoidance. Open question: serif vs sans for words.

## Motion

120 bpm. Beat = 500 ms. Durations: eighth 125 (hover, stagger), quarter 250 (chips, rail), beat 500 (node arrival, pulse hop), bar 1000 (mode change, 2D↔3D, field breath). One easing: `cubic-bezier(.22,.61,.36,1)`. No `transition: all`. `prefers-reduced-motion` collapses to a quarter-beat fade and freezes the ambient field.

## Layout

One stage. Score (words) across the top. Instrument rail at the bottom with three verbs: Explore / Relate / Traverse. Margin note replaces learn panel, tooltips and intro modal. Results live in the margin with mono scores. Mobile is the same tree.
