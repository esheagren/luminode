// Interactive textbook content.
//
// A chapter is DATA, not JSX: an ordered list of typed blocks rendered by
// Textbook.jsx. Writing a new chapter means adding an entry here + presets —
// no component changes.
//
// Block types:
//   { type: 'prose',   md: '<markdown, KaTeX math supported>' }
//   { type: 'sandbox', words: string[], addable?: string[], caption?: string }
//
// Keep prose short and action-driven: a beat or two, then a thing to do.

export const chapters = [
  {
    slug: 'embeddings',
    title: 'Words become points',
    subtitle: 'Chapter 1',
    blocks: [
      {
        type: 'prose',
        md: "A computer can't read the word *cat*. So we hand it coordinates instead — a position in space. Words used in similar ways get similar positions. That's the whole trick.\n\n**→ The graph below holds four words: `cat`, `dog`, `horse`, and `car`.** Look at where they landed.",
      },
      {
        type: 'sandbox',
        words: ['cat', 'dog', 'horse', 'car'],
        addable: ['truck', 'bus'],
        caption: 'Real embeddings, flattened to 2D. Add a word and watch where it lands.',
      },
      {
        type: 'prose',
        md: "Notice `cat`, `dog`, and `horse` huddle together, while `car` sits off on its own. Nobody told the computer *“animals go here.”* It placed them from how the words are **used** — and similar usage means nearby positions.\n\n**→ Now add `truck`.** It lands over by `car`, away from the animals — the vehicles are forming their own neighborhood. (Add `bus` too: same story.) Meaning turned into geography.",
      },
      {
        type: 'prose',
        md: "**That's the one idea: position = meaning.** Everything else in Luminode is just a question you can now ask about positions — *what's nearby? what's the direction between two words? what's in the middle?*\n\nYou'll meet each of those in the chapters ahead. For now, keep going on your own — open these words in the full explorer and add a few of your favorites.",
      },
    ],
  },
];

export const getChapter = (slug) =>
  chapters.find((c) => c.slug === slug) || chapters[0];

export const getChapterIndex = (slug) => {
  const i = chapters.findIndex((c) => c.slug === slug);
  return i === -1 ? 0 : i;
};
