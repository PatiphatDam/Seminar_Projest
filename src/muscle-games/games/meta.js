export const GAMES = [
  {
    id: 'balloon-pop',
    title: 'Balloon Pop',
    goal: 'Fire darts at the balloon that matches each muscle function or property before it floats away.',
    lo: 'OL1',
    loText: 'Explain the major functions and physiological properties of muscular tissue',
    minutes: '2–3 min',
    badge: 'HOT',
    keys: ['balloon-pop'],
    intro: 'ยิงลูกดอกใส่บอลลูนที่ตรงกับคำใบ้! บอลลูนทองได้ ×2 แต่ระวังลูกระเบิดนะ 💣',
    achievements: [
      { id: 'perfect', icon: '🎯', name: 'แม่นทุกนัด', desc: 'ตอบถูกครบ 10 ข้อโดยไม่พลาดเลย', test: (s) => s.perfect },
      { id: 'combo5', icon: '🔥', name: 'คอมโบ ×5', desc: 'ตอบถูกติดกัน 8 ข้อ', test: (s) => s.maxStreak >= 8 },
      { id: 'golden', icon: '🥇', name: 'นักล่าบอลลูนทอง', desc: 'ยิงบอลลูนทองที่ถูกต้อง 2 ลูก', test: (s) => s.golden >= 2 },
      { id: 'cool', icon: '❄️', name: 'ใจเย็น ๆ', desc: 'ยิงโดนบอลลูนน้ำแข็ง', test: (s) => s.ice > 0 },
      { id: 'atp', icon: '⚡', name: 'พลัง ATP', desc: 'ใช้ตัวช่วย ATP', test: (s) => s.atp > 0 },
      { id: 'stars3', icon: '⭐', name: 'สามดาว', desc: 'จบเกมด้วย 3 ดาว', test: (s) => s.stars >= 3 },
    ],
  },
  {
    id: 'group-sort',
    title: 'Group Sort',
    goal: 'Match each picture with its name or key feature, or race the conveyor belt sorting skeletal, cardiac and smooth muscle.',
    lo: 'OL2',
    loText: 'Differentiate the gross and microscopic characteristics of skeletal, cardiac and smooth muscle',
    minutes: '2–3 min',
    badge: 'NEW',
    keys: ['group-sort:memory', 'group-sort:conveyor'],
    modeLabels: { 'group-sort:memory': 'Picture Match', 'group-sort:conveyor': 'Conveyor' },
    intro: 'เลือกโหมดก่อนเลย! จับคู่ภาพ หรือ สายพานคัดแยก?',
    achievements: [
      { id: 'mem_perfect', icon: '🧠', name: 'ความจำเลิศ', desc: 'โหมดจับคู่: ไม่พลิกผิดเลย', test: (s) => s.memPerfect },
      { id: 'mem_fast', icon: '⚡', name: 'ไวปานสายฟ้า', desc: 'โหมดจับคู่: ครบทุกคู่โดยเหลือเวลา 45 วินาที', test: (s) => s.memFast },
      { id: 'conv_20', icon: '📦', name: 'พนักงานดีเด่น', desc: 'โหมดสายพาน: คัดถูก 20 ใบ', test: (s) => s.convSorted >= 20 },
      { id: 'combo5', icon: '🔥', name: 'คอมโบ ×5', desc: 'ถูกติดกัน 8 ครั้ง', test: (s) => s.maxStreak >= 8 },
      { id: 'stars3', icon: '⭐', name: 'สามดาว', desc: 'ได้ 3 ดาวในโหมดใดก็ได้', test: (s) => s.stars >= 3 },
    ],
  },
  {
    id: 'diameter',
    title: 'Diameter',
    goal: 'Journey into a muscle: zoom through every layer, build jigsaws and diagnose patients across 6 stages.',
    lo: 'OL3',
    loText: 'Explain the structural organization of skeletal muscle from the whole muscle to the molecular level',
    minutes: '6–8 min',
    badge: 'NEW',
    keys: ['diameter'],
    intro: 'ออกสำรวจกล้ามเนื้อกัน! แตะด่านแรกบนแผนที่ได้เลย 🗺️',
    achievements: [
      { id: 'explorer', icon: '🗺️', name: 'นักสำรวจ', desc: 'ผ่านครบทั้ง 6 ด่าน', test: (s) => s.explorer },
      { id: 'flawless', icon: '💎', name: 'ไร้ที่ติ', desc: 'ผ่านครบโดยไม่วางผิดเลย', test: (s) => s.flawless },
      { id: 'builder', icon: '🧩', name: 'นักต่อจิ๊กซอว์', desc: 'ด่านภาพจิ๊กซอว์ไม่วางผิดเลย', test: (s) => s.builder },
      { id: 'doctor', icon: '🩺', name: 'คุณหมอตัวจริง', desc: 'ด่านคลินิกไม่วินิจฉัยผิดเลย', test: (s) => s.doctor },
      { id: 'stars3', icon: '⭐', name: 'สามดาว', desc: 'จบเกมด้วย 3 ดาว', test: (s) => s.stars >= 3 },
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
