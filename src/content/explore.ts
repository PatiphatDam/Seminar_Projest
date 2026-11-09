/**
 * Text for the 3D pages (info panel, legend, steps). Plain data — no three.js here, so any page may import it.
 * Wording is summarised from src/content/lessons.ts ("sarcomere-and-myofilaments", "contraction-and-relaxation")
 * and the lecture sheet "Muscular tissues I" — do not add content that is not in the lessons (rule R6).
 *
 * Colours: real proteins have no colour at this scale, so these follow the common textbook convention
 * (thin filament blue, thick filament red) and are also told apart by shape + label, never by colour alone.
 */
export type PartId = "zdisc" | "mline" | "actin" | "tropomyosin" | "troponin" | "myosin" | "titin" | "nebulin";
export type BandId = "aband" | "iband" | "hzone";

export type PartInfo = {
  id: PartId;
  name: string;
  /** Where it belongs, shown as a small eyebrow above the name. */
  group: "Thin filament" | "Thick filament" | "Structural protein" | "Sarcomere landmark";
  colour: string;
  /** How to recognise it without colour. */
  looks: string;
  points: string[];
  lesson: { slug: string; label: string };
  /** Supplementary points from the videos (shown apart from the lecture points). */
  video?: VideoNote[];
};

const SARCOMERE_LESSON = { slug: "sarcomere-and-myofilaments", label: "Myofilaments and the sarcomere" };

export const PARTS: PartInfo[] = [
  {
    id: "actin",
    name: "Actin",
    group: "Thin filament",
    colour: "#38bdf8",
    looks: "Two twisted strings of beads",
    points: [
      "The main protein of the thin filament.",
      "G-actin molecules join into strands of F-actin arranged in a helix.",
      "Each actin molecule has a site where a myosin head can bind.",
    ],
    lesson: SARCOMERE_LESSON,
  },
  {
    id: "tropomyosin",
    name: "Tropomyosin",
    group: "Thin filament",
    colour: "#eab308",
    looks: "Long thin strand lying along the actin",
    points: [
      "A long, fibrous regulatory protein lying along the actin filament.",
      "In a relaxed fiber it covers the myosin-binding regions on actin, preventing cross-bridge formation.",
    ],
    lesson: SARCOMERE_LESSON,
  },
  {
    id: "troponin",
    name: "Troponin (TnC · TnI · TnT)",
    group: "Thin filament",
    colour: "#16a34a",
    looks: "Small knobs spaced along the thin filament",
    points: [
      "Troponin C (TnC) binds Ca²⁺.",
      "Troponin I (TnI) contributes to inhibition of actin–myosin interaction.",
      "Troponin T (TnT) binds to tropomyosin.",
      "When Ca²⁺ binds TnC, tropomyosin moves away from the myosin-binding sites, so actin and myosin can interact.",
    ],
    lesson: SARCOMERE_LESSON,
  },
  {
    id: "myosin",
    name: "Myosin",
    group: "Thick filament",
    colour: "#e11d48",
    looks: "Thick rods with heads sticking out",
    points: [
      "The main protein of the thick filament — a motor protein that turns the energy of ATP into mechanical work.",
      "Its long tails point toward the centre of the sarcomere; the globular heads project outward and bind actin.",
      "Heads have sites for actin binding and ATP hydrolysis; repeated head–actin interactions pull the thin filaments toward the centre.",
    ],
    lesson: SARCOMERE_LESSON,
    video: [
      { video: "crossbridge", at: 62, text: "Before it binds, each head already holds ADP + phosphate left from the previous stroke — it is “energised”." },
      { video: "crossbridge", at: 93, text: "During the power stroke the head releases its ADP." },
      { video: "crossbridge", at: 98, text: "A new ATP binding to the head breaks the bond with actin, so the head lets go." },
      { video: "crossbridge", at: 108, text: "The head splits that ATP into ADP + phosphate and stores the energy for the next stroke." },
    ],
  },
  {
    id: "zdisc",
    name: "Z disc",
    group: "Sarcomere landmark",
    colour: "#71717a",
    looks: "The two end plates",
    points: [
      "Marks the boundary between neighbouring sarcomeres — one sarcomere runs from one Z disc to the next.",
      "Thin filaments are anchored here and extend toward the centre.",
      "During contraction the Z discs move closer together.",
    ],
    lesson: SARCOMERE_LESSON,
    video: [
      { video: "sarcomere", at: 86, text: "Also called the Z line. “Z” comes from the German zwischen, “between” — it lies between two sarcomeres." },
      { video: "sarcomere", at: 284, text: "Under the microscope it is the darkest line, in the middle of a light I band." },
    ],
  },
  {
    id: "mline",
    name: "M line",
    group: "Sarcomere landmark",
    colour: "#7c3aed",
    looks: "The thin plate in the middle",
    points: ["Located at the centre of the sarcomere.", "Its proteins help organise and stabilise the thick filaments."],
    lesson: SARCOMERE_LESSON,
    video: [
      { video: "sarcomere", at: 156, text: "“M” for middle (German Mitte): a disc down the middle of the myosin that holds the thick filaments in place." },
      { video: "sarcomere", at: 276, text: "Under the microscope it is a dark line in the centre of the H zone." },
    ],
  },
  {
    id: "titin",
    name: "Titin",
    group: "Structural protein",
    colour: "#f472b6",
    looks: "Fine springs from each Z disc to the M line",
    points: [
      "A large elastic protein associated with the thick filament.",
      "Keeps the thick filaments in position and the A band organised.",
      "Gives passive elasticity, resists over-stretching and helps the fiber return to its resting length.",
    ],
    lesson: SARCOMERE_LESSON,
  },
  {
    id: "nebulin",
    name: "Nebulin",
    group: "Structural protein",
    colour: "#94a3b8",
    looks: "Fine thread running along each thin filament",
    points: ["One of the structural proteins that keep the myofilaments precisely arranged."],
    lesson: SARCOMERE_LESSON,
  },
];

export const partById = (id: PartId) => PARTS.find((p) => p.id === id)!;

export const BANDS: Record<BandId, { name: string; colour: string; points: string[]; change: string; video?: VideoNote[] }> = {
  aband: {
    name: "A band",
    colour: "#e11d48",
    points: ["The whole length of the thick filaments, including where thick and thin filaments overlap."],
    change: "No change — the thick filaments keep their length.",
    video: [
      { video: "sarcomere", at: 213, text: "A = anisotropic. Memory tip: “A is wide” — the wide, thick filament is here, so the band looks dark." },
      { video: "sarcomere", at: 243, text: "Light I bands alternating with dark A bands are what make skeletal muscle look striated." },
    ],
  },
  iband: {
    name: "I band",
    colour: "#38bdf8",
    points: ["Thin filaments only, with no thick filaments; a Z disc runs through about its centre."],
    change: "Becomes shorter.",
    video: [{ video: "sarcomere", at: 178, text: "I = isotropic. Memory tip: “I” is the thinnest letter — only the thin filament is here, so the band looks light." }],
  },
  hzone: {
    name: "H zone",
    colour: "#eab308",
    points: ["The centre of the A band where only thick filaments are present."],
    change: "Gets smaller and may disappear when fully contracted.",
    video: [{ video: "sarcomere", at: 254, text: "H from the German heller, “brighter”: only one filament type (myosin) is here, so it is lighter than the rest of the A band." }],
  },
};

export const CONTRACTION_LESSON = { slug: "contraction-and-relaxation", label: "Contraction and relaxation" };

/** Lecture sheet §11 "Sequence of events in skeletal muscle contraction". */
export const CONTRACTION_STEPS: { title: string; text: string; /** second in the cross-bridge video */ video?: number }[] = [
  { title: "Neural stimulation", text: "An action potential arrives at the terminal of a somatic motor neuron." },
  { title: "Release of acetylcholine", text: "ACh is released from the motor neuron terminal into the synaptic cleft." },
  {
    title: "Muscle fiber excitation",
    text: "ACh activates receptors on the sarcolemma; the muscle action potential spreads along the membrane and into the T-tubules.",
  },
  { title: "Calcium release", text: "The signal triggers the sarcoplasmic reticulum to release Ca²⁺ into the sarcoplasm." },
  { title: "Activation of the thin filament", text: "Ca²⁺ binds troponin, which moves tropomyosin away from the myosin-binding sites on actin.", video: 41 },
  { title: "Cross-bridge formation", text: "Activated myosin heads bind to the exposed sites on actin.", video: 62 },
  { title: "Power stroke", text: "The myosin head changes position and pulls the thin filament toward the centre of the sarcomere.", video: 82 },
  { title: "Repeated cross-bridge cycling", text: "As long as Ca²⁺ and ATP are available, cycling continues and tension develops.", video: 98 },
  { title: "Cessation of neural stimulation", text: "Motor neuron activity stops and ACh release declines." },
  {
    title: "Calcium removal and relaxation",
    text: "Ca²⁺ is pumped back into the SR, the binding sites are covered again, cycling stops and the fiber relaxes.",
  },
];

/**
 * Videos on the sarcomere page. Their `chapters` and every `VideoNote` were written from the videos' own narration;
 * they are supplementary (not lecture sheet text), so the pages show them in a separate box labelled "From the video".
 */
export type VideoId = "crossbridge" | "sarcomere";
export type VideoNote = { video: VideoId; /** seconds into the video */ at: number; text: string };

export const VIDEOS: Record<VideoId, { id: string; tab: string; title: string; channel: string; length: string; about: string; chapters: { at: number; label: string }[] }> = {
  crossbridge: {
    id: "BVcgO4p88AA",
    tab: "Cross-bridge cycle",
    title: "Muscle Contraction – Cross Bridge Cycle, Animation",
    channel: "Alila Medical Media",
    length: "2:49",
    about: "Ca²⁺ exposes the binding sites, then each myosin head binds, pulls, lets go and re-cocks using ATP.",
    chapters: [
      { at: 3, label: "Sliding filament theory: thin and thick filaments slide past each other" },
      { at: 41, label: "Nerve impulse → Ca²⁺ binds troponin → tropomyosin moves off the binding sites" },
      { at: 62, label: "Each myosin head starts “energised”, holding ADP + phosphate" },
      { at: 75, label: "Heads release the phosphate and bind the exposed sites on actin" },
      { at: 82, label: "Power stroke: the filaments glide; heads release their ADP" },
      { at: 98, label: "ATP binds the head → the head lets go of actin" },
      { at: 108, label: "ATP → ADP + phosphate: the energy is stored in the head for the next stroke" },
      { at: 122, label: "Heads back at the start — more Ca²⁺ starts a new cycle" },
    ],
  },
  sarcomere: {
    id: "Dd9KdvnKoik",
    tab: "Sarcomere bands",
    title: "The Sarcomere Made Easy – Here’s how to study it!",
    channel: "Siebert Science",
    length: "10:16",
    about: "Z line, M line, I band, A band and H zone step by step, how they look under the microscope, and what shortens.",
    chapters: [
      { at: 41, label: "Where sarcomeres are: muscle → fascicle → fiber → myofibril" },
      { at: 86, label: "Z line and the thin (actin) filament" },
      { at: 132, label: "Thick (myosin) filament with its heads, and the M line" },
      { at: 178, label: "I band — thin filament only, looks light" },
      { at: 213, label: "A band — where the thick filament is, looks dark" },
      { at: 254, label: "H zone — myosin without actin, slightly brighter" },
      { at: 280, label: "The bands under the microscope" },
      { at: 327, label: "Contraction: A band stays the same, I band and H zone shorten" },
      { at: 392, label: "How to sketch the sarcomere quickly to study it" },
    ],
  },
};

/** Link that opens a video on the sarcomere page at a given second. */
export const videoHref = (n: Pick<VideoNote, "video" | "at">) => `/explore/sarcomere?video=${n.video}&t=${n.at}#video`;

export const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** "From the video" notes for the sarcomere level hotspot (thousands in series). */
export const SARCOMERE_VIDEO_NOTES: VideoNote[] = [
  { video: "sarcomere", at: 0, text: "Thousands of sarcomeres lie end to end; each shortens only a little, but added together the whole muscle shortens." },
];
