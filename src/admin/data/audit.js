// Findings from the 2026-10-07 audit of the legacy app. `step` is the PLAN.md step that absorbs it.

export const GROUPS = ['Colour', 'UX', 'Code', 'Motion', 'Access']
export const AUDIT_STATUSES = ['open', 'fixed', 'wontfix']

export const AUDIT_ITEMS = [
  // Colour
  { id: 'c1', group: 'Colour', text: '95 hex colours drawn from ten palettes.', status: 'open', step: 4 },
  { id: 'c2', group: 'Colour', text: 'Four different dark backgrounds in the graph area.', status: 'open', step: 4 },
  { id: 'c3', group: 'Colour', text: 'Colour meanings collide: blue is both "first word" and "active"; orange is both "fifth word" and the projection axis.', status: 'open', step: 4 },
  { id: 'c4', group: 'Colour', text: 'Eight brand oranges.', status: 'open', step: 4 },
  { id: 'c5', group: 'Colour', text: 'Red delete / trash / cancel affordances; nothing should be red.', status: 'open', step: 4 },
  { id: 'c6', group: 'Colour', text: 'Inter declared in CSS but never loaded.', status: 'open', step: 4 },
  { id: 'c7', group: 'Colour', text: 'Canvas labels in bold Arial, no halo, no collision avoidance.', status: 'open', step: 4 },
  { id: 'c8', group: 'Colour', text: '35 font sizes with no scale.', status: 'open', step: 4 },
  { id: 'c9', group: 'Colour', text: 'tokens.css added: one place for colour, type and tempo.', status: 'fixed', step: 2 },
  // UX
  { id: 'u1', group: 'UX', text: 'Mode trap: selection mode locks sibling tools and needs a Cancel; the active tab stays lit after Calculate.', status: 'open', step: 4 },
  { id: 'u2', group: 'UX', text: 'Empty state is an infinite spinner.', status: 'open', step: 5 },
  { id: 'u3', group: 'UX', text: 'A single word divides by zero and draws nothing.', status: 'open', step: 4 },
  { id: 'u4', group: 'UX', text: 'Results have no home: the analogy slot renders the string "results"; scores are never shown.', status: 'open', step: 4 },
  { id: 'u5', group: 'UX', text: '3D view receives no selection props, so the picking tools do nothing there.', status: 'open', step: 4 },
  { id: 'u6', group: 'UX', text: 'Slice, midpoint and projection lines are never drawn in 3D.', status: 'open', step: 4 },
  { id: 'u7', group: 'UX', text: 'three.js debug axes left on.', status: 'open', step: 4 },
  { id: 'u8', group: 'UX', text: 'Midpoint tool built but unreachable.', status: 'open', step: 4 },
  { id: 'u9', group: 'UX', text: 'Hovering an analogy result throws (fromWords mismatch).', status: 'open', step: 4 },
  { id: 'u10', group: 'UX', text: 'Five loading treatments.', status: 'open', step: 9 },
  { id: 'u11', group: 'UX', text: 'Three error surfaces, including "redeploy the server" copy.', status: 'open', step: 5 },
  { id: 'u12', group: 'UX', text: 'Intro modal on every visit; no dialog role, focus trap or Escape.', status: 'open', step: 5 },
  { id: 'u13', group: 'UX', text: 'Labels collide; no zoom, pan or Retina scaling in 2D.', status: 'open', step: 4 },
  // Code
  { id: 'k1', group: 'Code', text: 'Two JSX trees for mobile vs desktop.', status: 'open', step: 9 },
  { id: 'k2', group: 'Code', text: '3D renderer recreated on every change; old loops never cancelled.', status: 'open', step: 4 },
  { id: 'k3', group: 'Code', text: 'Four components over 1,000 lines.', status: 'open', step: 4 },
  { id: 'k4', group: 'Code', text: 'Analogy search implemented four times.', status: 'open', step: 4 },
  { id: 'k5', group: 'Code', text: 'styled-jsx used but never installed, so every block was global CSS.', status: 'fixed', step: 2 },
  { id: 'k6', group: 'Code', text: '~7k lines of dead code.', status: 'fixed', step: 2 },
  { id: 'k7', group: 'Code', text: '223 console.log calls.', status: 'fixed', step: 2 },
  { id: 'k8', group: 'Code', text: 'window globals used to pass state between components.', status: 'fixed', step: 2 },
  { id: 'k9', group: 'Code', text: '.next/ build output committed.', status: 'fixed', step: 2 },
  // Motion
  { id: 'm1', group: 'Motion', text: 'Six durations and four easings.', status: 'open', step: 9 },
  { id: 'm2', group: 'Motion', text: 'transition: all in 51 places.', status: 'open', step: 9 },
  { id: 'm3', group: 'Motion', text: 'No prefers-reduced-motion handling.', status: 'open', step: 9 },
  { id: 'm4', group: 'Motion', text: 'Three conflicting pulse keyframes.', status: 'open', step: 9 },
  { id: 'm5', group: 'Motion', text: '2D↔3D flip via chained setTimeouts.', status: 'open', step: 4 },
  // Access
  { id: 'a1', group: 'Access', text: 'Keyboard cannot reach points, so five tools are unusable without a mouse.', status: 'open', step: 9 },
  { id: 'a2', group: 'Access', text: 'Suggested words are clickable divs.', status: 'open', step: 5 },
  { id: 'a3', group: 'Access', text: 'outline: none in seven places.', status: 'open', step: 9 },
  { id: 'a4', group: 'Access', text: 'Contrast failures: analogy placeholder 2.08:1, context dots 1.64:1 on canvas.', status: 'open', step: 4 },
]
