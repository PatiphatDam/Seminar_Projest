/**
 * Reading content for the Lessons menu (/lessons). Edited by the team in code — change the text here and deploy.
 *
 * Source: MFU "KEY POINT BOOK 1 — The skeletal muscle" (STEP I–III, learning outcomes OL1–OL5), as summarised in
 * C:\board-claude\docs\PROJECT_CONTEXT.md §2. Replace or extend with the instructor's own text when it arrives.
 *
 * Writing format: `**bold**` inside any text is shown in bold. Keep paragraphs short — students read on phones.
 */

export type LessonBlock =
  | { kind: "h"; text: string }
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; caption: string; head: string[]; rows: string[][] }
  | { kind: "keypoints"; items: string[] }
  | { kind: "figure"; src: string; alt: string; caption: string };

export interface Lesson {
  slug: string;
  /** Book step, e.g. "STEP I" */
  step: string;
  /** Learning outcomes covered, e.g. "OL1" */
  lo: string;
  title: string;
  summary: string;
  minutes: number;
  blocks: LessonBlock[];
}

export const LESSONS: Lesson[] = [
  {
    slug: "types-of-muscle-tissue",
    step: "STEP I",
    lo: "OL1",
    title: "Types of muscle tissue",
    summary: "Skeletal, cardiac and smooth muscle: where they are, what they do and how they look.",
    minutes: 4,
    blocks: [
      {
        kind: "p",
        text: "The body has **three types of muscle tissue**. They are first split by how they are controlled: **voluntary** muscle is controlled by the somatic nervous system, **involuntary** muscle by the autonomic nervous system.",
      },
      {
        kind: "list",
        items: [
          "**Voluntary** (somatic nervous system) → **skeletal muscle**",
          "**Involuntary** (autonomic nervous system) → **cardiac muscle** and **smooth muscle**",
        ],
      },
      { kind: "h", text: "Compare the three types" },
      {
        kind: "table",
        caption: "Location, function and structure of the three muscle tissues",
        head: ["", "Skeletal", "Cardiac", "Smooth"],
        rows: [
          ["Location and function", "Pulls on bones to move the body", "Wall of the heart; pumps blood", "Walls of internal organs (abdominal organs, airways, blood vessels, ciliary body, erector pili); moves their contents"],
          ["Striation", "Striated", "Striated", "**Non-striated**"],
          ["Cell shape", "Cylindrical and elongated", "Short and **branched**", "Short and **spindle-shaped (fusiform)**"],
          ["Nucleus", "**Many nuclei, at the edge (peripheral)**", "One, central", "One, central (oval)"],
          ["Special feature", "—", "**Intercalated discs** (desmosomes + gap junctions join the cells)", "—"],
        ],
      },
      {
        kind: "keypoints",
        items: [
          "Only skeletal muscle is voluntary.",
          "Skeletal and cardiac muscle are striated; smooth muscle is not.",
          "Many peripheral nuclei → skeletal. Branched cells with intercalated discs → cardiac. Spindle cells with one central nucleus → smooth.",
        ],
      },
    ],
  },
  {
    slug: "organization-of-skeletal-muscle",
    step: "STEP II",
    lo: "OL2 · OL3",
    title: "Organization of skeletal muscle",
    summary: "From the whole muscle down to filaments, and the three connective tissue layers that wrap them.",
    minutes: 5,
    blocks: [
      {
        kind: "p",
        text: "A skeletal muscle is built like a cable: bundles inside bundles. Each level has its own size, and three levels are wrapped by their own **connective tissue**.",
      },
      { kind: "h", text: "From small to large" },
      {
        kind: "table",
        caption: "Structures of skeletal muscle, their diameter and the connective tissue around them",
        head: ["Diameter", "Structure", "Connective tissue around it"],
        rows: [
          ["5–6 nm", "**Thin filament**: actin + tropomyosin + troponin", "—"],
          ["10–12 nm", "**Thick filament**: myosin, with myosin heads", "—"],
          ["1–2 µm", "**Myofibril**: sarcomeres in a row, surrounded by the sarcoplasmic reticulum", "—"],
          ["about 100 µm", "**Muscle fiber** (one muscle cell): membrane = sarcolemma, many nuclei at the edge", "**Endomysium**"],
          ["—", "**Muscle fascicle**: a bundle of muscle fibers", "**Perimysium**"],
          ["—", "**Skeletal muscle**: the whole muscle", "**Epimysium**"],
        ],
      },
      { kind: "h", text: "The muscle fiber" },
      {
        kind: "p",
        text: "A muscle fiber is one long cell with **many nuclei at its edge**. Its cell membrane is the **sarcolemma**, which folds inward to form **T-tubules**. Inside, the fiber is packed with **myofibrils**, and each myofibril is a chain of **sarcomeres** — the units that actually contract.",
      },
      {
        kind: "keypoints",
        items: [
          "Order from large to small: muscle → fascicle → fiber → myofibril → filaments.",
          "Endo- (inside) wraps one fiber, peri- (around) wraps a fascicle, epi- (upon) wraps the whole muscle.",
          "Students often mix up the three layers — match the prefix to the size.",
        ],
      },
    ],
  },
  {
    slug: "from-nerve-to-contraction",
    step: "STEP II",
    lo: "OL3",
    title: "From nerve to contraction",
    summary: "How a nerve signal at the neuromuscular junction releases calcium inside the muscle fiber.",
    minutes: 3,
    blocks: [
      {
        kind: "p",
        text: "A skeletal muscle fiber contracts only when a **motor neuron** tells it to. The meeting point of the nerve and the fiber is the **neuromuscular junction**.",
      },
      { kind: "h", text: "Step by step" },
      {
        kind: "list",
        items: [
          "The signal travels down the motor neuron's axon (wrapped in a myelin sheath) to the **axon terminal**.",
          "Vesicles in the axon terminal release **acetylcholine** into the **synaptic cleft**.",
          "Acetylcholine binds to **acetylcholine receptors on the sarcolemma**.",
          "The signal spreads along the sarcolemma and down the **T-tubules**.",
          "The **sarcoplasmic reticulum** releases **Ca²⁺** into the sarcoplasm — and the sarcomeres contract.",
        ],
      },
      {
        kind: "keypoints",
        items: [
          "One motor neuron and all the muscle fibers it controls = a **motor unit**.",
          "Calcium from the sarcoplasmic reticulum is the trigger for contraction.",
        ],
      },
    ],
  },
  {
    slug: "the-sarcomere",
    step: "STEP III",
    lo: "OL4 · OL5",
    title: "The sarcomere and contraction",
    summary: "Bands, lines and proteins of the sarcomere, and what changes when the muscle contracts.",
    minutes: 6,
    blocks: [
      {
        kind: "p",
        text: "The **sarcomere** is the functional (contractile) unit of a myofibril. It runs from one **Z-disc** to the next. Try it in 3D Explore after reading.",
      },
      { kind: "h", text: "Lines and bands" },
      {
        kind: "list",
        items: [
          "**Z-disc** — the two ends of the sarcomere; thin filaments are attached here.",
          "**M-line** — the middle of the sarcomere (centre of the A-band and of the H-zone).",
          "**A-band** (dark) — the whole length of the thick filaments; thick and thin filaments overlap here, except in the H-zone.",
          "**H-zone** — the centre of the A-band, where there are **only thick filaments**.",
          "**I-band** (light) — the part with **only thin filaments**; it spans the Z-disc.",
        ],
      },
      { kind: "h", text: "The proteins" },
      {
        kind: "list",
        items: [
          "**Thin filament**: G-actin beads twisted into a double strand, plus **tropomyosin** (covers the myosin-binding sites) and the **troponin complex (TnC, TnI, TnT)**. Tropomyosin and troponin are the regulatory proteins.",
          "**Thick filament**: **myosin**. Each **myosin head** binds actin and pulls the thin filament toward the M-line.",
        ],
      },
      { kind: "h", text: "Contraction vs. relaxation" },
      {
        kind: "p",
        text: "In the **sliding filament** model the filaments do not get shorter. The thin filaments slide over the thick filaments, so the Z-discs move closer together.",
      },
      {
        kind: "table",
        caption: "What changes in the sarcomere during contraction",
        head: ["Part", "During contraction"],
        rows: [
          ["Sarcomere length", "**Shorter** — the Z-discs move closer"],
          ["I-band", "**Shorter**"],
          ["H-zone", "**Disappears** — thin and thick filaments overlap completely"],
          ["A-band", "**Same length** — the thick filaments do not shorten"],
          ["Thin and thick filaments", "**Same length** — they only slide"],
        ],
      },
      {
        kind: "keypoints",
        items: [
          "Sarcomere = Z-disc to Z-disc.",
          "During contraction the sarcomere, I-band and H-zone shorten; the A-band and the filaments keep their length.",
          "Tropomyosin covers the binding sites on actin; troponin moves it when Ca²⁺ arrives.",
        ],
      },
    ],
  },
];

export const lessonBySlug = (slug: string | undefined) => LESSONS.find((l) => l.slug === slug);
