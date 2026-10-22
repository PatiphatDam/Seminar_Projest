/**
 * Reading content for the Lessons menu (/lessons). Edited by the team in code — change the text here and deploy.
 *
 * Source: lecture sheet "Muscular tissues I" (1/2568, Asst. Prof. Dr. Keerakarn Somsuan), the instructor's companion to
 * the MFU Key Point Book "The skeletal muscle". Every heading and sub-heading of the sheet (Overview … §21) appears
 * below with the sheet's own wording; the sheet's numbers are left out because lessons can be read in any order.
 * Not included on purpose: lesson plan, teaching plan, instructional materials, §22 review questions (→ a test).
 * "extra" blocks are additions that are NOT in the sheet; they are shown as "More detail". Extras on cardiac and smooth
 * muscle come from the team document "กล้ามเนื้อถูกจำแนกออกเป็น 3 ประเภทหลัก" — the same source as the 3D Explore levels
 * (src/content/exploreZoom.ts), so the lesson and the 3D model describe the same parts.
 *
 * Writing format: `**bold**` inside any text is shown in bold.
 */

export type LessonBlock =
  | { kind: "h"; text: string } // a numbered section of the sheet (e.g. "Functions of Muscle Tissue")
  | { kind: "sub"; text: string } // a sub-section (e.g. "Movement")
  | { kind: "minor"; text: string } // a named heading inside a sub-section (e.g. "Epimysium", "Z Disc")
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; caption: string; head: string[]; rows: string[][] }
  | { kind: "keypoints"; items: string[]; title?: string } // title defaults to "Key points"
  | { kind: "extra"; text: string; items?: string[]; table?: { caption: string; head: string[]; rows: string[][] } }
  | { kind: "figure"; src: string; alt: string; caption: string };

export type TopicId = "basics" | "structure" | "contraction" | "clinical";

/** Big topics shown on the Lessons page (in this order), each with its lessons underneath. */
export const TOPICS: { id: TopicId; title: string; summary: string }[] = [
  { id: "basics", title: "Muscle tissue basics", summary: "What muscle does, its properties, and how skeletal, cardiac and smooth muscle differ." },
  { id: "structure", title: "Structure of skeletal muscle", summary: "From the whole muscle down to the sarcomere and its proteins, fiber types and repair." },
  { id: "contraction", title: "Nerve to contraction", summary: "How a motor neuron makes a skeletal muscle fiber contract and relax." },
  { id: "clinical", title: "Clinical correlation", summary: "Disorders of skeletal muscle tissue: Duchenne muscular dystrophy and myasthenia gravis." },
];

export interface Lesson {
  slug: string;
  topic: TopicId;
  title: string;
  summary: string;
  blocks: LessonBlock[];
}

export const LESSONS: Lesson[] = [
  {
    slug: "overview-functions-properties",
    topic: "basics",
    title: "Overview, functions and properties of muscle tissue",
    summary: "The three types of muscle, five functions of muscle tissue and five physiological properties.",
    blocks: [
      { kind: "h", text: "Overview of Muscle Tissue" },
      {
        kind: "p",
        text: "Muscle tissue is one of the **four fundamental tissue types** of the human body. Its defining characteristic is the ability of its cells to **generate force through contraction**. Based on their structural characteristics, location and mode of control, muscles are classified into three major types: **skeletal muscle**, **cardiac muscle** and **smooth muscle**.",
      },
      {
        kind: "list",
        items: [
          "**Skeletal muscle** is primarily responsible for producing movement of the body and its parts. By generating force against the skeleton, skeletal muscles let us walk, run, maintain posture and carry out precise movements.",
          "**Cardiac muscle** forms the muscular wall of the heart. Its coordinated contractions generate the pressure that propels blood through the chambers of the heart and into the cardiovascular system.",
          "**Smooth muscle** is mainly located in the walls of hollow organs and blood vessels. Its contraction regulates the movement of substances through internal organs and contributes to gastrointestinal propulsion, regulation of blood-vessel diameter and control of the urinary and reproductive systems.",
        ],
      },

      { kind: "h", text: "Functions of Muscle Tissue" },
      { kind: "p", text: "Muscle tissue contributes to movement, posture, regulation of internal passages, thermoregulation and metabolic homeostasis." },
      { kind: "sub", text: "Movement" },
      {
        kind: "list",
        items: [
          "Muscle contraction generates movement both outside and inside the body.",
          "Skeletal muscles exert force on bones and joints, allowing simple body movements as well as complex, highly coordinated actions.",
          "Inside the body, respiratory muscles contribute to ventilation, cardiac muscle drives blood circulation and smooth muscle moves substances through the digestive, urinary and reproductive systems.",
          "Muscle activity is also important for **communication**: speech, facial expression, writing and other body language.",
        ],
      },
      { kind: "sub", text: "Maintenance of Posture and Body Stability" },
      {
        kind: "p",
        text: "Muscles maintain the position of the body by producing continuous or intermittent tension that opposes unwanted movement. **Antigravity muscles** keep the body upright against gravity, and tension within **tendons** contributes to joint stability and the alignment of bones.",
      },
      { kind: "sub", text: "Regulation of Body Openings and Internal Passages" },
      {
        kind: "p",
        text: "Muscles around body openings and in the walls of internal organs regulate the passage of materials. Muscles around the mouth take part in food intake, chewing and speech; muscles of the eye regulate the amount of light entering the eye; muscular rings and layers within organs regulate the movement of food, bile, blood and other body fluids. Skeletal and smooth muscle also control the elimination of waste through the urinary and gastrointestinal systems.",
      },
      { kind: "sub", text: "Heat Production" },
      {
        kind: "p",
        text: "During contraction only part of the chemical energy used by muscle becomes mechanical work; much of the rest is released as **heat**. Skeletal muscle is therefore an important source of body heat, especially when activity increases. **Shivering** consists of rapid involuntary contractions that increase heat production in the cold.",
      },
      { kind: "sub", text: "Regulation of Blood Glucose" },
      {
        kind: "p",
        text: "Skeletal muscle is a major site of **glucose uptake and use**. Glucose taken up by muscle cells is metabolized to produce ATP or stored as **glycogen**, so the amount and metabolic activity of muscle influence blood glucose. Reduced muscle mass and physical inactivity decrease this capacity and are associated with a higher risk of **type 2 diabetes mellitus**.",
      },

      { kind: "h", text: "Physiological Properties of Muscle Tissue" },
      {
        kind: "p",
        text: "These specialized properties enable muscle cells to detect stimuli, transmit electrical signals, generate force and undergo controlled changes in length.",
      },
      { kind: "sub", text: "Excitability" },
      {
        kind: "p",
        text: "Excitability, or **responsiveness**, is the ability of a cell to respond to an appropriate stimulus — a neurotransmitter, a change in membrane potential, mechanical stretch or another chemical signal. The stimulus produces an electrical response in the cell membrane, which may then initiate contraction.",
      },
      { kind: "sub", text: "Conductivity" },
      {
        kind: "p",
        text: "Conductivity is the ability to transmit an electrical signal from one region of a muscle cell to another. The signal propagates along the plasma membrane and, in skeletal muscle, into the cell through the **transverse tubules (T-tubules)**, so excitation reaches the structures involved in contraction.",
      },
      { kind: "sub", text: "Contractility" },
      {
        kind: "p",
        text: "Contractility is the ability to generate force after stimulation. In skeletal muscle force depends mainly on the interaction of **actin and myosin**, and is transmitted through the connective tissue framework to move the skeleton. Muscle contraction means the **development of tension** — a muscle does not necessarily become shorter when it contracts.",
      },
      { kind: "sub", text: "Extensibility" },
      {
        kind: "p",
        text: "Extensibility is the ability to lengthen when an external force is applied, without damage under normal conditions. It matters because muscles act in opposing groups: during elbow extension the **triceps brachii** contracts while the **biceps brachii** must lengthen enough to allow the movement.",
      },
      { kind: "sub", text: "Elasticity" },
      {
        kind: "p",
        text: "Elasticity is the ability to return toward the previous length after being stretched. It restores muscle length and helps keep appropriate resting tension in muscles and their connective tissues.",
      },
      {
        kind: "keypoints",
        items: [
          "Three types: skeletal, cardiac, smooth.",
          "Five functions: movement, posture and stability, regulating openings and passages, heat, blood glucose.",
          "Five properties: excitability, conductivity, contractility, extensibility, elasticity.",
        ],
      },
    ],
  },

  {
    slug: "cardiac-and-smooth-muscle",
    topic: "basics",
    title: "Cardiac and smooth muscle tissue",
    summary: "Intercalated discs, single-unit and multiunit smooth muscle, smooth-muscle structure, and a summary of all three types.",
    blocks: [
      { kind: "h", text: "Cardiac Muscle Tissue" },
      { kind: "p", text: "Cardiac muscle forms the muscular component of the heart and is specialized for **continuous rhythmic contraction**." },
      { kind: "sub", text: "Microscopic Characteristics of Cardiac Muscle" },
      { kind: "p", text: "Cardiac muscle cells share sarcomeres and striations with skeletal muscle, but they have several distinctive features. Cardiac muscle cells are:" },
      {
        kind: "list",
        items: [
          "Striated",
          "Generally **branched**",
          "Usually with a **single, centrally located nucleus**",
          "Joined end-to-end through specialized **intercalated discs**",
          "Controlled primarily through **involuntary** mechanisms",
        ],
      },
      { kind: "sub", text: "Intercalated Discs" },
      {
        kind: "p",
        text: "Intercalated discs are specialized regions where adjacent cardiac muscle cells connect. They provide both mechanical and electrical coupling:",
      },
      {
        kind: "list",
        items: [
          "**Desmosomes** strengthen the connection between neighboring cells and help prevent them from separating during contraction.",
          "**Gap junctions** let ions and electrical signals pass between adjacent cells, so cardiac muscle is activated in a coordinated way.",
        ],
      },
      {
        kind: "extra",
        text: "Cardiac muscle from the heart wall down to the myofilaments — the levels of **3D Explore → Cardiac muscle**:",
        items: [
          "**Epicardium / pericardium** — the outermost tissue layer covering the heart wall.",
          "**Myocardium** — the thick muscle layer of the heart wall, made of cardiac muscle cells working together. (The 3D model also shows the **endocardium**, the thin inner lining of the heart wall.)",
          "**Endomysium** — connective tissue around each cardiac muscle cell, with **dense capillaries**.",
          "**Cardiomyocyte** — a short, branched, cylindrical cell with **1–2 central nuclei** (usually one).",
          "**Intercalated disc** — desmosomes add strength; gap junctions pass the electrical signal.",
          "**Sarcolemma and sarcoplasm** — the T-tubules are **larger** than in skeletal muscle.",
          "**Myofibril → sarcomere** (Z disc, A band, I band, as in skeletal muscle) → **myofilaments**: thick = myosin; thin = actin + tropomyosin + troponin.",
        ],
      },

      { kind: "h", text: "Smooth Muscle Tissue" },
      { kind: "p", text: "Smooth muscle is generally controlled **involuntarily** and is widely distributed throughout the body. Two functional patterns are described:" },
      { kind: "sub", text: "Single-Unit (Visceral) Smooth Muscle" },
      {
        kind: "p",
        text: "Found in the walls of hollow organs and tubular structures — the **gastrointestinal tract, urinary bladder, uterus, small blood vessels** and other hollow organs. Its cells communicate with one another and contract in a coordinated manner.",
      },
      { kind: "sub", text: "Multiunit Smooth Muscle" },
      {
        kind: "p",
        text: "Individual fibers receive more independent neural control. Examples: smooth muscle of **large blood vessels, airways, the iris, the ciliary body of the eye** and the **arrector pili** muscles of hair follicles.",
      },
      {
        kind: "p",
        text: "Smooth muscle is innervated by the **autonomic nervous system**. Autonomic nerve fibers release neurotransmitter from swellings called **varicosities**, which act on several nearby smooth muscle cells: **norepinephrine** from sympathetic fibers and **acetylcholine** from parasympathetic fibers.",
      },

      { kind: "h", text: "Microscopic Structure of Smooth Muscle" },
      {
        kind: "p",
        text: "A typical smooth muscle cell is **spindle-shaped** with a **single, central nucleus**. It has no organized sarcomeres, so it is **not striated**. Thick and thin filaments are present but arranged in a less regular network throughout the cell.",
      },
      { kind: "sub", text: "Important structural features" },
      {
        kind: "list",
        items: [
          "**Caveolae** — small invaginations of the plasma membrane that contribute to calcium handling and signaling.",
          "**No T-tubules** — Ca²⁺ enters from the extracellular fluid and is also released from intracellular stores.",
          "**Calmodulin**, a calcium-binding protein, is the calcium sensor instead of troponin.",
          "Contractile filaments attach to **dense bodies** and **intermediate filaments**, a network that spreads force through the cell. Dense bodies play a role broadly comparable to the **Z discs** of striated muscle.",
          "In many smooth muscle tissues **gap junctions** link neighboring cells and coordinate contraction.",
        ],
      },
      {
        kind: "extra",
        text: "Smooth muscle from the organ wall down to the myofilaments — the levels of **3D Explore → Smooth muscle**:",
        items: [
          "**Muscle layers** in the wall of a hollow organ — in the intestine a **longitudinal** layer (cells run along the tube; contraction shortens it) and a **circular** layer (cells run around the tube; contraction narrows it).",
          "**Extracellular matrix / endomysium-like layer** — a thin connective tissue around each cell.",
          "**Smooth muscle cell** — spindle-shaped with tapered ends and **one central nucleus**.",
          "**Sarcolemma** — no T-tubules; **caveolae** (small invaginations) help take up and store Ca²⁺; **gap junctions** link neighboring cells.",
          "**Dense bodies** — protein anchoring points scattered through the cytoplasm and on the membrane; they take the place of **Z discs**.",
          "**Intermediate filaments** such as **desmin** link the dense bodies and spread the force of contraction through the cell.",
          "**Myofilaments** in an oblique, criss-cross lattice (no sarcomeres): thick = myosin; thin = actin + tropomyosin, with **no troponin** — **calmodulin** binds Ca²⁺ instead.",
        ],
      },

      { kind: "h", text: "Summary: Three Types of Muscle Tissue" },
      {
        kind: "table",
        caption: "Summary: three types of muscle tissue",
        head: ["Feature", "Skeletal muscle", "Cardiac muscle", "Smooth muscle"],
        rows: [
          ["Location", "Attached primarily to the skeleton", "Heart", "Walls of hollow organs and blood vessels"],
          ["Control", "Generally voluntary", "Involuntary", "Involuntary"],
          ["Striations", "Present", "Present", "Absent"],
          ["Cell shape", "Long, cylindrical", "Short, branched", "Spindle-shaped"],
          ["Nuclei", "Multiple, peripheral", "Usually one, central", "One, central"],
          ["Sarcomeres", "Present", "Present", "Absent"],
          ["Intercalated discs", "Absent", "Present", "Absent"],
          ["T-tubules", "Present", "Present", "Absent"],
          ["Major Ca²⁺ regulatory protein", "Troponin", "Troponin", "Calmodulin"],
          ["Major function", "Body movement and posture", "Pumping blood", "Movement / regulation of substances within organs"],
        ],
      },
      {
        kind: "extra",
        text: "Levels of organization in the three types — the levels you zoom through in **3D Explore**:",
        table: {
          caption: "Levels of organization in skeletal, cardiac and smooth muscle",
          head: ["Level", "Skeletal muscle", "Cardiac muscle", "Smooth muscle"],
          rows: [
            ["Connective tissue wrapping", "Epimysium → Perimysium → Endomysium", "Epicardium → Endomysium", "Muscle layer → ECM / endomysium-like layer"],
            ["Cell", "Muscle fiber (long cylinder, many nuclei)", "Cardiomyocyte (branched, intercalated discs)", "Smooth muscle cell (spindle-shaped, one nucleus)"],
            ["Inside the cell", "Myofibrils", "Myofibrils", "Dense bodies & intermediate filaments"],
            ["Contractile unit", "Sarcomere", "Sarcomere", "Protein lattice (no sarcomere)"],
            ["Myofilaments", "Myosin / actin + tropomyosin + troponin", "Myosin / actin + tropomyosin + troponin", "Myosin / actin + tropomyosin (calmodulin instead of troponin)"],
          ],
        },
      },
    ],
  },

  {
    slug: "skeletal-muscle-tissue",
    topic: "structure",
    title: "Skeletal muscle tissue and the muscle fiber",
    summary: "Gross anatomy, connective tissue layers, the structural hierarchy and the microscopic anatomy of a muscle fiber.",
    blocks: [
      { kind: "h", text: "Skeletal Muscle Tissue" },
      { kind: "sub", text: "Gross Anatomy of Skeletal Muscle" },
      {
        kind: "p",
        text: "A skeletal muscle is a complex **organ**, not just muscle cells: besides skeletal muscle fibers it contains **connective tissue, blood vessels and nerves**. The connective tissue framework gives mechanical support, lets blood vessels and nerves reach every fiber and helps transmit the force of contraction.",
      },
      { kind: "sub", text: "Connective Tissue Organization of Skeletal Muscle" },
      {
        kind: "p",
        text: "Skeletal muscle is organized into hierarchical levels. Connective tissue surrounds the entire muscle, groups of fibers and each individual fiber, giving structural support and distributing the forces of contraction.",
      },
      { kind: "minor", text: "Epimysium" },
      { kind: "p", text: "The outer layer around the **entire muscle**. Mainly dense connective tissue; it may merge with surrounding connective tissue, including the **deep fascia** of neighboring muscles." },
      { kind: "minor", text: "Perimysium" },
      { kind: "p", text: "Muscle fibers are grouped into bundles called **fascicles**; each fascicle is enclosed by the perimysium. It organizes groups of fibers and provides pathways for blood vessels and nerves." },
      { kind: "minor", text: "Endomysium" },
      { kind: "p", text: "A delicate layer around **each muscle fiber**. Much thinner than the other two, it supports individual muscle cells and helps transmit force between fibers and the surrounding connective tissue." },
      { kind: "minor", text: "Structural hierarchy" },
      {
        kind: "p",
        text: "**Whole muscle → Fascicle → Muscle fiber → Myofibril → Sarcomere → Myofilaments.** The corresponding connective tissue layers are **Epimysium → Perimysium → Endomysium**.",
      },

      { kind: "h", text: "Microscopic Anatomy of a Skeletal Muscle Fiber" },
      {
        kind: "p",
        text: "A skeletal muscle fiber is a **long, cylindrical, multinucleated cell**; its nuclei usually lie close to the sarcolemma. Its cytoplasm, the **sarcoplasm**, contains the organelles for energy production, calcium handling and contraction, large **glycogen** reserves and **myoglobin**, which helps store and transport oxygen.",
      },
      { kind: "sub", text: "Sarcolemma" },
      { kind: "p", text: "The plasma membrane of the muscle fiber. It maintains the ionic environment of the cell and conducts electrical excitation along the fiber surface." },
      { kind: "sub", text: "T-tubules" },
      { kind: "p", text: "Transverse tubules are **inward extensions of the sarcolemma**. They carry electrical excitation deep into the fiber instead of leaving it on the surface, so it reaches the contractile apparatus throughout the cell." },
      { kind: "sub", text: "Sarcoplasmic Reticulum" },
      { kind: "p", text: "The sarcoplasmic reticulum (SR) is a specialized smooth endoplasmic reticulum around the myofibrils. Its main role is the **storage and regulated release of Ca²⁺**; calcium released from the SR starts the events that allow actin–myosin interaction." },
      { kind: "sub", text: "Terminal Cisternae" },
      { kind: "p", text: "Enlarged regions of the SR next to the T-tubules — sites for the storage and **rapid release of Ca²⁺** during excitation–contraction coupling." },
      { kind: "sub", text: "Triad" },
      { kind: "p", text: "**One T-tubule between two terminal cisternae.** This arrangement lets the electrical signal on the sarcolemma rapidly trigger calcium release from the SR." },
      { kind: "sub", text: "Myofibrils" },
      {
        kind: "p",
        text: "Long contractile structures that fill much of the sarcoplasm. They are made of repeating **sarcomeres** containing two kinds of myofilaments: **thick filaments** (mainly **myosin**) and **thin filaments** (mainly **actin**). Their coordinated interaction produces tension and contraction.",
      },
      {
        kind: "keypoints",
        items: ["Epimysium → whole muscle, perimysium → fascicle, endomysium → fiber.", "Triad = one T-tubule + two terminal cisternae.", "The SR stores and releases Ca²⁺."],
      },
    ],
  },

  {
    slug: "sarcomere-and-myofilaments",
    topic: "structure",
    title: "Myofilaments and the sarcomere",
    summary: "Structure of the sarcomere, thick and thin myofilaments, and the structural proteins of the sarcomere.",
    blocks: [
      { kind: "h", text: "Myofilaments and the Sarcomere" },
      {
        kind: "p",
        text: "The contractile apparatus is organized into repeating units called **sarcomeres**, each with thick filaments (mainly myosin) and thin filaments (mainly actin). Sarcomeres lie end-to-end along each myofibril; their regular arrangement gives skeletal and cardiac muscle their **striated** appearance under the light microscope.",
      },
      { kind: "sub", text: "Structure of the Sarcomere" },
      { kind: "p", text: "The sarcomere is the basic functional unit for force generation in striated muscle. It extends **from one Z disc to the next Z disc**." },
      { kind: "minor", text: "Z Disc" },
      { kind: "p", text: "Marks the boundary between adjacent sarcomeres. Thin filaments are anchored to the Z discs and extend toward the center of the sarcomere." },
      { kind: "minor", text: "A Band" },
      { kind: "p", text: "The entire length of the thick filaments, including the regions where thick and thin filaments overlap. Its length stays **essentially constant** during contraction." },
      { kind: "minor", text: "I Band" },
      { kind: "p", text: "Contains thin filaments but **no thick filaments**; a Z disc passes through about its center. The I band **becomes shorter** during contraction." },
      { kind: "minor", text: "H Zone" },
      { kind: "p", text: "The central part of the A band where **only thick filaments** are present. As thin filaments move toward the center, the H zone gets smaller and may no longer be visible in a fully contracted sarcomere." },
      { kind: "minor", text: "M Line" },
      { kind: "p", text: "Located at the **center of the sarcomere**; its proteins help organize and stabilize the thick filaments." },
      { kind: "keypoints", title: "Key Point", items: ["One sarcomere extends from one Z disc to the next Z disc."] },

      { kind: "h", text: "Thick and Thin Myofilaments" },
      { kind: "sub", text: "Thick Filaments" },
      {
        kind: "list",
        items: [
          "The main protein is **myosin**, a motor protein that converts the chemical energy of **ATP** into mechanical work.",
          "A myosin molecule has a long **tail**, oriented toward the center of the sarcomere, and globular **heads** that project outward and interact with actin.",
          "Myosin heads contain sites for **actin binding** and **ATP hydrolysis**.",
          "Repeated head–actin interactions generate the force that moves thin filaments toward the center of the sarcomere.",
        ],
      },
      { kind: "sub", text: "Thin Filaments" },
      {
        kind: "p",
        text: "The main protein is **actin**. Individual **G-actin** molecules join into strands of **F-actin** arranged in a helix; each actin molecule has a site where a myosin head can bind. Thin filaments also contain two regulatory proteins, tropomyosin and troponin.",
      },
      { kind: "minor", text: "Tropomyosin" },
      { kind: "p", text: "A long, fibrous protein lying along the actin filament. In a relaxed fiber it **covers the myosin-binding regions** on actin, preventing cross-bridge formation." },
      { kind: "minor", text: "Troponin" },
      {
        kind: "list",
        items: ["**Troponin C (TnC)** — binds Ca²⁺", "**Troponin I (TnI)** — contributes to inhibition of actin–myosin interaction", "**Troponin T (TnT)** — binds to tropomyosin"],
      },
      { kind: "p", text: "When **Ca²⁺ binds troponin C**, the complex changes position and moves tropomyosin away from the myosin-binding sites on actin, allowing actin and myosin to interact." },

      { kind: "h", text: "Structural Proteins of the Sarcomere" },
      { kind: "p", text: "Besides actin and myosin, several proteins keep the sarcomere organized and mechanically stable." },
      { kind: "minor", text: "Titin" },
      { kind: "p", text: "A large **elastic** protein associated with the thick filament, extending from the Z disc toward the thick filament. Titin helps:" },
      {
        kind: "list",
        items: [
          "Maintain the position of thick filaments",
          "Preserve the organization of the A band",
          "Provide passive elasticity",
          "Resist excessive stretching",
          "Return the fiber toward its resting configuration after stretching",
        ],
      },
      { kind: "minor", text: "Dystrophin" },
      {
        kind: "p",
        text: "Associated with the **cytoskeleton**; it connects the contractile apparatus to the **sarcolemma** and, through membrane and extracellular-matrix proteins, transmits force from inside the fiber to the surrounding tissue. Loss or severe reduction of dystrophin makes fibers unstable and is the major feature of **Duchenne muscular dystrophy**.",
      },
      { kind: "minor", text: "Other Structural Proteins" },
      { kind: "list", items: ["Nebulin", "α-Actinin", "Tropomodulin", "Myomesin", "Myosin-binding protein C"] },
      { kind: "p", text: "Together these proteins keep the myofilaments precisely arranged and support normal muscle function." },
    ],
  },

  {
    slug: "types-of-skeletal-muscle-fibers",
    topic: "structure",
    title: "Types of skeletal muscle fibers",
    summary: "Slow oxidative, fast oxidative–glycolytic and fast glycolytic fibers.",
    blocks: [
      { kind: "h", text: "Types of Skeletal Muscle Fibers" },
      { kind: "p", text: "Skeletal muscle fibers are grouped by their structural and metabolic characteristics into three functional types:" },
      { kind: "sub", text: "Slow Oxidative Fibers" },
      { kind: "p", text: "Smaller in diameter, with relatively low peak force. They contain:" },
      { kind: "list", items: ["High concentrations of **myoglobin**", "Numerous **capillaries**", "Many **mitochondria**", "A high capacity for **aerobic** ATP production"] },
      { kind: "p", text: "They are **highly resistant to fatigue** and suit sustained activity such as long-distance running and endurance swimming." },
      { kind: "sub", text: "Fast Oxidative–Glycolytic Fibers" },
      {
        kind: "p",
        text: "Intermediate fibers with substantial myoglobin, capillaries and mitochondria; they make ATP by both **aerobic metabolism and glycolysis**. They contract faster than slow oxidative fibers but remain **relatively resistant to fatigue**, and contribute to walking, running and sprinting depending on intensity and duration.",
      },
      { kind: "sub", text: "Fast Glycolytic Fibers" },
      { kind: "p", text: "The **largest** fibers, with a high density of myofibrils, so they produce substantial force. They typically have:" },
      {
        kind: "list",
        items: ["Relatively **low myoglobin**", "Fewer capillaries", "Fewer mitochondria", "Large **glycogen** stores", "High dependence on **glycolytic** ATP production"],
      },
      { kind: "p", text: "They give strong, rapid contractions but **fatigue quickly** — important in short, high-intensity activities such as weight lifting or throwing." },
      {
        kind: "keypoints",
        items: ["Slow oxidative = endurance, fatigue-resistant.", "Fast glycolytic = strong and fast, fatigues quickly.", "Fast oxidative–glycolytic = in between."],
      },
    ],
  },

  {
    slug: "injury-and-regeneration",
    topic: "structure",
    title: "Muscle fiber injury and regeneration",
    summary: "How satellite cells repair skeletal muscle, in four stages.",
    blocks: [
      { kind: "h", text: "Muscle Fiber Injury and Regeneration" },
      { kind: "p", text: "Skeletal muscle has a limited capacity for repair after injury. A key cell population in this process is the **satellite cell**." },
      { kind: "minor", text: "Stage 1 — Normal muscle" },
      { kind: "p", text: "Skeletal muscle fibers are surrounded by a **basal lamina**; satellite cells lie close to the fiber beneath this basal lamina." },
      { kind: "minor", text: "Stage 2 — Activation and proliferation" },
      { kind: "p", text: "After injury, satellite cells are activated and proliferate, giving rise to **myoblasts** (muscle precursor cells)." },
      { kind: "minor", text: "Stage 3 — Migration and fusion" },
      { kind: "p", text: "Myoblasts migrate to the damaged region, align and fuse into developing **myotubes**, which can then fuse with surviving parts of the damaged fiber." },
      { kind: "minor", text: "Stage 4 — Regeneration" },
      { kind: "p", text: "Continued fusion and maturation form regenerated fibers, recognized histologically by their **centrally located nuclei**." },
      { kind: "keypoints", items: ["Satellite cells → myoblasts → myotubes → regenerated fibers.", "Central nuclei mark a newly regenerated skeletal muscle fiber."] },
    ],
  },

  {
    slug: "motor-unit-and-nmj",
    topic: "contraction",
    title: "Motor unit and neuromuscular junction",
    summary: "One motor neuron and the fibers it controls, and how acetylcholine starts a muscle action potential.",
    blocks: [
      { kind: "h", text: "Motor Unit" },
      {
        kind: "p",
        text: "A **motor unit** is a single somatic motor neuron and **all the skeletal muscle fibers it controls**. These neurons have their cell bodies in the **brainstem or spinal cord**; their axons travel to the muscles and branch near their ends. One motor neuron can connect with many fibers, but normally each fiber receives input from **only one** motor neuron.",
      },
      {
        kind: "list",
        items: [
          "The number of fibers per motor neuron varies between muscles and is related to the **precision** of movement required.",
          "**Small motor units** allow fine, precise movements.",
          "**Large motor units** are suited to producing greater force.",
        ],
      },

      { kind: "h", text: "Neuromuscular Junction" },
      {
        kind: "p",
        text: "The neuromuscular junction (NMJ) is the specialized **synapse** where a somatic motor neuron communicates with a skeletal muscle fiber. The axon forms a presynaptic terminal full of **synaptic vesicles** containing **acetylcholine (ACh)**. The basic sequence of neuromuscular transmission:",
      },
      {
        kind: "list",
        items: [
          "An action potential reaches the axon terminal of the motor neuron.",
          "Synaptic vesicles release ACh into the **synaptic cleft**.",
          "ACh diffuses across the synaptic cleft.",
          "ACh binds to **receptors on the sarcolemma**.",
          "Receptor activation produces an electrical response in the muscle fiber.",
          "The resulting **muscle action potential** initiates the events leading to contraction.",
        ],
      },
      {
        kind: "p",
        text: "The sarcolemma under the nerve terminal has many **junctional folds**, which increase the membrane area and hold a high density of ACh receptors for efficient transmission.",
      },
      {
        kind: "extra",
        text: "ACh does not stay in the cleft: the enzyme **acetylcholinesterase** quickly breaks it down, so each nerve impulse gives one short response. This is also why drugs that block acetylcholinesterase are used to treat **myasthenia gravis** — they leave more ACh to reach the remaining receptors.",
      },
    ],
  },

  {
    slug: "contraction-and-relaxation",
    topic: "contraction",
    title: "Contraction and relaxation of skeletal muscle",
    summary: "The four stages, the ten-step sequence, the sliding filament mechanism and the key concepts to remember.",
    blocks: [
      { kind: "h", text: "Contraction and Relaxation of Skeletal Muscle" },
      { kind: "p", text: "Contraction is a sequence of events that begins with neural stimulation and ends with the development of tension. It can be divided into four stages." },
      { kind: "sub", text: "Excitation" },
      {
        kind: "p",
        text: "An action potential reaches the motor neuron terminal and causes the release of ACh. ACh binds receptors on the muscle fiber membrane and starts an electrical response; the muscle action potential travels along the sarcolemma and into the fiber through the **T-tubules**.",
      },
      { kind: "sub", text: "Excitation–Contraction Coupling" },
      {
        kind: "p",
        text: "The processes that link the electrical signal at the membrane to activation of the contractile machinery. The action potential in the T-tubules makes the **sarcoplasmic reticulum release Ca²⁺** into the sarcoplasm; the rise in Ca²⁺ lets the thin-filament regulatory proteins **expose the myosin-binding sites** on actin.",
      },
      { kind: "sub", text: "Contraction" },
      {
        kind: "p",
        text: "Myosin heads repeatedly **attach** to actin, undergo a conformational change that generates force, **detach** and repeat the cycle, pulling the thin filaments toward the center of the sarcomere. The filaments do not substantially shorten — the thin filaments **slide** relative to the thick filaments.",
      },
      {
        kind: "extra",
        text: "**How ATP drives the cross-bridge cycle.** ATP binding makes the myosin head **detach** from actin; hydrolysis of ATP to ADP + Pi **re-cocks** the head; release of Pi triggers the **power stroke**. ATP is also used by the pump that returns Ca²⁺ to the SR during relaxation. Without ATP, myosin stays bound to actin (as in rigor mortis).",
      },
      { kind: "sub", text: "Relaxation" },
      {
        kind: "p",
        text: "When stimulation stops, no more ACh is released. **Ca²⁺ is actively transported back into the SR**; as cytosolic Ca²⁺ falls, the regulatory proteins return to rest and **tropomyosin** again limits access to the binding sites on actin. Cross-bridge cycling decreases, tension falls and the muscle relaxes.",
      },

      { kind: "h", text: "Sequence of Events in Skeletal Muscle Contraction" },
      {
        kind: "list",
        items: [
          "**Step 1 — Neural stimulation**: an action potential arrives at the terminal of a somatic motor neuron.",
          "**Step 2 — Release of acetylcholine**: ACh is released into the synaptic cleft.",
          "**Step 3 — Muscle fiber excitation**: ACh activates sarcolemma receptors; a muscle action potential spreads along the membrane and into the T-tubules.",
          "**Step 4 — Calcium release**: the SR releases Ca²⁺ into the sarcoplasm.",
          "**Step 5 — Activation of the thin filament**: Ca²⁺ binds troponin, which moves tropomyosin off the myosin-binding sites.",
          "**Step 6 — Cross-bridge formation**: activated myosin heads bind the exposed sites on actin.",
          "**Step 7 — Power stroke**: the myosin head changes position and pulls the thin filament toward the center of the sarcomere.",
          "**Step 8 — Repeated cross-bridge cycling**: continues as long as Ca²⁺ and ATP are available; tension develops.",
          "**Step 9 — Cessation of neural stimulation**: motor neuron activity stops and ACh release declines.",
          "**Step 10 — Calcium removal and relaxation**: Ca²⁺ returns to the SR, binding sites close, cycling stops and the fiber relaxes.",
        ],
      },

      { kind: "h", text: "Sliding Filament Mechanism" },
      {
        kind: "p",
        text: "At rest, actin and myosin overlap only a little. During contraction myosin heads pull the thin filaments toward the **M line**. As the thin filaments move:",
      },
      {
        kind: "list",
        items: ["The **Z discs** move closer together.", "The **I band** becomes shorter.", "The **H zone** becomes smaller or disappears.", "The **A band** stays essentially the same length."],
      },
      { kind: "p", text: "Shortening comes from **more overlap** of actin and myosin, not from shorter thick or thin filaments." },
      { kind: "keypoints", title: "Key concept", items: ["During contraction the filaments slide past one another; the individual actin and myosin filaments do not become shorter."] },

      { kind: "h", text: "Key Concepts for Students" },
      { kind: "p", text: "**Organization:** Whole muscle → Fascicle → Muscle fiber → Myofibril → Sarcomere → Actin + Myosin" },
      {
        kind: "p",
        text: "**Contraction:** Motor neuron → ACh release → Sarcolemma activation → T-tubule excitation → Ca²⁺ release from SR → Troponin activation → Tropomyosin movement → Actin–myosin interaction → Cross-bridge cycling → Muscle tension",
      },
      {
        kind: "p",
        text: "**Relaxation:** Neural stimulation stops → ACh release decreases → Ca²⁺ returns to SR → Tropomyosin again blocks actin binding sites → Cross-bridge cycling decreases → Muscle relaxes",
      },
    ],
  },

  {
    slug: "disorders-of-skeletal-muscle",
    topic: "clinical",
    title: "Disorders of skeletal muscle tissue",
    summary: "Duchenne muscular dystrophy and myasthenia gravis: cause and main clinical features.",
    blocks: [
      { kind: "h", text: "Disorders of Skeletal Muscle Tissue" },
      { kind: "sub", text: "Duchenne Muscular Dystrophy" },
      {
        kind: "p",
        text: "Duchenne muscular dystrophy (DMD) is a severe **inherited** disorder caused by mutations in the **DMD gene**, which encodes the structural protein **dystrophin**. The gene is on the **X chromosome**, so the disorder mainly affects **males**; females may be carriers. Without functional dystrophin, muscle fibers lose structural stability, and repeated mechanical stress causes progressive fiber damage and loss of function.",
      },
      { kind: "minor", text: "Major clinical features" },
      { kind: "p", text: "Children with DMD may show:" },
      {
        kind: "list",
        items: [
          "Delayed achievement of motor milestones",
          "Progressive weakness, particularly in **proximal** muscles",
          "Difficulty rising from the floor",
          "Progressive weakness of the pelvic and lower-limb muscles",
          "Use of the **Gowers maneuver** when standing",
        ],
      },
      { kind: "p", text: "The progressive loss of muscle strength eventually affects functional mobility." },

      { kind: "h", text: "Myasthenia Gravis" },
      {
        kind: "p",
        text: "Myasthenia gravis (MG) is an **autoimmune** disorder of neuromuscular transmission. The immune system produces **antibodies** against proteins at the neuromuscular junction, most commonly the **postsynaptic acetylcholine receptor**, so the nerve signal reaches the muscle less effectively and weakness **fluctuates**.",
      },
      { kind: "minor", text: "Common clinical manifestations" },
      { kind: "p", text: "Symptoms may include:" },
      {
        kind: "list",
        items: ["**Ptosis** — drooping of the upper eyelid", "**Diplopia** — double vision", "Difficulty swallowing", "Weakness of the limbs", "Reduced muscle endurance"],
      },
      { kind: "p", text: "Because respiratory muscles can also be affected, severe disease may lead to **respiratory failure**." },
      {
        kind: "keypoints",
        items: ["DMD: no functional dystrophin · X-linked · mainly boys · proximal weakness, Gowers maneuver.", "MG: antibodies against ACh receptors · fluctuating weakness · ptosis, diplopia."],
      },
    ],
  },
];

export const lessonBySlug = (slug: string | undefined) => LESSONS.find((l) => l.slug === slug);
export const lessonsOfTopic = (topic: TopicId) => LESSONS.filter((l) => l.topic === topic);
export const topicById = (id: TopicId) => TOPICS.find((t) => t.id === id)!;
