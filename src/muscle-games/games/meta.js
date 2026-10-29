export const GAMES = [
  {
    id: 'balloon-pop',
    title: 'Balloon Pop',
    goal: 'Zap the balloon that matches each muscle function or property.',
    lo: 'OL1',
    loText: 'Explain the major functions and physiological properties of muscular tissue',
    minutes: '2–3 min',
    keys: ['balloon-pop'],
    intro: 'Tap the balloon that matches the clue and the wizard zaps it! Golden balloons score ×2, but watch out for bombs 💣',
    achievements: [
      { id: 'perfect', icon: '🎯', name: 'Sharpshooter', desc: 'Answer all 10 clues without a single miss', test: (s) => s.perfect },
      { id: 'combo5', icon: '🔥', name: 'Combo ×5', desc: 'Get 8 answers right in a row', test: (s) => s.maxStreak >= 8 },
      { id: 'golden', icon: '🥇', name: 'Gold hunter', desc: 'Pop 2 correct golden balloons', test: (s) => s.golden >= 2 },
      { id: 'cool', icon: '❄️', name: 'Chill out', desc: 'Hit an ice balloon', test: (s) => s.ice > 0 },
      { id: 'atp', icon: '⚡', name: 'ATP power', desc: 'Use the ATP power-up', test: (s) => s.atp > 0 },
      { id: 'stars3', icon: '⭐', name: 'Three stars', desc: 'Finish with 3 stars', test: (s) => s.stars >= 3 },
    ],
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
    achievements: [
      { id: 'mem_perfect', icon: '🧠', name: 'Perfect match', desc: 'Picture Match: no wrong pairs at all', test: (s) => s.memPerfect },
      { id: 'mem_fast', icon: '⚡', name: 'Lightning fast', desc: 'Picture Match: finish with 45 seconds left', test: (s) => s.memFast },
      { id: 'conv_20', icon: '📦', name: 'Star sorter', desc: 'Conveyor Sort: sort 20 cards correctly', test: (s) => s.convSorted >= 20 },
      { id: 'combo5', icon: '🔥', name: 'Combo ×5', desc: 'Get 8 right in a row', test: (s) => s.maxStreak >= 8 },
      { id: 'stars3', icon: '⭐', name: 'Three stars', desc: 'Get 3 stars in either mode', test: (s) => s.stars >= 3 },
    ],
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
    achievements: [
      { id: 'explorer', icon: '🗺️', name: 'Explorer', desc: 'Clear all 6 stages', test: (s) => s.explorer },
      { id: 'flawless', icon: '💎', name: 'Flawless', desc: 'Clear every stage without a wrong drop', test: (s) => s.flawless },
      { id: 'builder', icon: '🧩', name: 'Puzzle master', desc: 'No wrong drops in the picture jigsaw', test: (s) => s.builder },
      { id: 'doctor', icon: '🩺', name: 'Real doctor', desc: 'No wrong diagnoses in the clinic', test: (s) => s.doctor },
      { id: 'stars3', icon: '⭐', name: 'Three stars', desc: 'Finish with 3 stars', test: (s) => s.stars >= 3 },
    ],
  },
];

// Score needed for 1, 2 and 3 stars.
const STAR_THRESHOLDS = {
  'balloon-pop': [80, 180, 300],
  'group-sort:memory': [300, 600, 850],
  'group-sort:conveyor': [100, 250, 450],
  diameter: [600, 1200, 1700],
};

export function starsFor(key, score) {
  const t = STAR_THRESHOLDS[key];
  if (!t || score === undefined) return 0;
  return t.filter((need) => score >= need).length;
}

export const gameById = (id) => GAMES.find((g) => g.id === id);
