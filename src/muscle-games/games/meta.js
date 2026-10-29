export const GAMES = [
  {
    id: 'balloon-pop',
    title: 'Balloon Pop',
    goal: 'Zap the balloon that matches each muscle function or property.',
    lo: 'OL1',
    loText: 'Explain the major functions and physiological properties of muscular tissue',
    minutes: '2–3 min',
    keys: ['balloon-pop'],
    intro: 'Tap the balloon that matches the clue and the wizard zaps it! Right on the first try = 1 point. Watch out for bombs 💣',
  },
  {
    id: 'group-sort',
    title: 'Group Sort',
    goal: 'Sort skeletal, cardiac and smooth muscle by picture or on a conveyor belt.',
    lo: 'OL2',
    loText: 'Differentiate the gross and microscopic characteristics of skeletal, cardiac and smooth muscle',
    minutes: '2–3 min',
    keys: ['group-sort:memory', 'group-sort:conveyor'],
    modeLabels: { 'group-sort:memory': 'Picture Match', 'group-sort:conveyor': 'Conveyor' },
    intro: 'Pick a mode: Picture Match or Conveyor Sort?',
  },
  {
    id: 'diameter',
    title: 'Diameter',
    goal: 'Zoom into a muscle layer by layer across 6 stages.',
    lo: 'OL3',
    loText: 'Explain the structural organization of skeletal muscle from the whole muscle to the molecular level',
    minutes: '6–8 min',
    keys: ['diameter'],
    intro: 'Let’s explore a muscle! Tap the first stage on the map 🗺️',
  },
];

// Every game is scored out of 10 from the share of answers that were right (the course's collected score).
export const MAX_SCORE = 10;
export const scoreOutOf10 = (right, total) => (total > 0 ? Math.round((100 * right) / total) / 10 : 0);
// A game's best is its best run in any mode (Group Sort has two).
export const bestOf = (game, best) => {
  const scores = game.keys.map((k) => best[k]).filter((v) => v !== undefined);
  return scores.length ? Math.max(...scores) : undefined;
};

export const gameById = (id) => GAMES.find((g) => g.id === id);
