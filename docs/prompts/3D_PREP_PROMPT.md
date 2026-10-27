# Prompt — เตรียม Stack, Tool และเนื้อหาสำหรับหน้า 3D (Digital Muscle)

> วิธีใช้: คัดลอกทุกอย่างใต้เส้นนี้ไปวางให้ AI agent (Claude Code / Cursor / ChatGPT) หรือส่งให้เพื่อนในทีมที่รับผิดชอบงาน C — 3D
> อัปเดตล่าสุด 16 ต.ค. 2026 · อ้างอิง `C:\Seminar\palnforwork\` (แผนบังคับ) และ `src/content/lessons.ts`

---

## บทบาท

คุณคือ **Senior 3D Web Developer (React Three Fiber) + ผู้ช่วยด้านกายวิภาค** ที่จะสร้างหน้า **3D Explore** และ **Sarcomere** ของเว็บ
"Digital Muscle" — สื่อการสอนเรื่อง skeletal muscle สำหรับนักศึกษา preclinical ม.แม่ฟ้าหลวง ต่อยอดจาก
**KEY POINT BOOK 1 — The skeletal muscle** (ผศ.ดร.กีรกานต์ สมสวน)

**ห้ามเริ่มเขียนโค้ดหรือติดตั้งอะไรจนกว่าจะส่ง "แผนงาน + รายการไฟล์ที่จะแก้" ให้ผู้ใช้อนุมัติก่อน** (กฎของโปรเจกต์)

## บริบทของโปรเจกต์ (สิ่งที่มีอยู่แล้ว)

- Repo: `C:\Seminar\Seminar_Projest` (GitHub `arumaosogi-sudo/Seminar_Projest`, branch `main`)
- เว็บจริง: https://digital-muscle.arumaosogi.workers.dev (Cloudflare Workers + D1, ใช้ Free plan)
- เมนูนักศึกษา 5 เมนู: Pretest · Lessons · Games · **3D Explore** · Posttest
- หน้า 3D ตอนนี้ยังเป็น **placeholder**:
  - `src/pages/explore/Explore3D.tsx` → route `/explore`
  - `src/pages/explore/Sarcomere.tsx` → route `/explore/sarcomere`
  - checklist ในไฟล์ทั้งสองคือ requirement ที่ต้องทำ (อ่านก่อน)
- หน้า Credits: `src/pages/Credits.tsx` (ต้องเพิ่ม license ของทุกโมเดล)
- เนื้อหาบทเรียน: `src/content/lessons.ts` (ใช้ลิงก์จาก info panel ไปบทเรียน `/lessons/<slug>`)
- ธีม: Coastal Soft (light/dark) — accent ของ 3D คือ `explore` (สีทราย) ดู `src/index.css`
- คู่มือทีม: `docs/TEAMMATE_GUIDE.md`, สถาปัตยกรรม: `docs/ARCHITECTURE.md`

## Stack (ติดตั้งแล้วใน package.json — ห้ามเปลี่ยน major version โดยไม่ถาม)

| ส่วน | Package | เวอร์ชันใน repo |
|---|---|---|
| UI | React 19 + TypeScript + Vite 8 + Tailwind CSS v4 | – |
| 3D engine | `three` | ^0.186 |
| React renderer | `@react-three/fiber` | ^9.8 |
| Helpers | `@react-three/drei` | ^10.7 (`CameraControls`, `Html`, `useGLTF`, `Bounds`, `PerformanceMonitor`, `Instances`) |
| Types | `@types/three` | ^0.186 |

**อนุญาตให้เพิ่มได้ถ้าจำเป็น (ถามก่อน):** `r3f-perf` (devDependency, วัด fps), `@react-spring/three` หรือ `maath` (easing/animation)
**ห้ามเพิ่ม:** physics engine, postprocessing หนัก ๆ, โมเดลจาก AI text-to-3D (Meshy, Tripo ฯลฯ) — ความถูกต้องทางกายวิภาคต่ำ

### กฎทางเทคนิค

1. import `@react-three/*` และ `three` **เฉพาะใน `src/pages/explore/**`** (route โหลดแบบ lazy อยู่แล้ว → ไม่เพิ่มขนาดหน้าอื่น)
2. `<Canvas frameloop="demand" dpr={[1, 1.5]}>` · ใช้ `invalidate()` เมื่อมีการเปลี่ยน state
3. Filament ที่ซ้ำกันใช้ **instancing** (`<Instances>` / `InstancedMesh`)
4. JS ของหน้า 3D ≤ 300 KB gzip · โมเดล ≤ 3–5 MB ต่อ scene · ~50–100k triangles ต่อ scene
5. ~60 fps บนมือถือระดับกลาง (ขั้นต่ำ 30 fps) — ทดสอบบนมือถือจริง
6. มี loading progress (`useProgress`) และ fallback เมื่อไม่มี WebGL (รูปนิ่ง + ข้อความ)
7. ใช้ได้ทั้งนิ้วและเมาส์ (หมุน / zoom / pan) · desktop: info panel ด้านขวา · มือถือ: bottom sheet
8. ที่เก็บโมเดล: เริ่มจาก `public/models/*.glb` (static assets ของ Workers ฟรีไม่จำกัด, ไฟล์ละ ≤ 25 MB) — ย้ายไป R2 เมื่อจำเป็นเท่านั้น
9. ข้อความบนหน้าเว็บเป็นภาษาอังกฤษ (ตามเว็บส่วนอื่น) · ชื่อทางกายวิภาคสะกดตาม Key Point Book
10. ผ่าน `npm run lint`, `npx vitest run`, `npm run build` ก่อนส่งงาน

## Tool ที่ต้องเตรียม (นอก repo)

| Tool | ใช้ทำอะไร |
|---|---|
| **Blender 4.x** (ฟรี) | ตัด/ลด polygon โมเดลที่ดาวน์โหลด, สร้าง fascicle → fiber → myofibril เอง, export `.glb` |
| **gltf-transform CLI** (`npx @gltf-transform/cli`) | บีบอัด: `optimize in.glb out.glb --compress meshopt --texture-compress webp` (หรือ KTX2) |
| **gltf.report** (เว็บ) | ตรวจขนาด/จำนวน triangle/texture ก่อนนำเข้า |
| **gltfjsx** (`npx gltfjsx model.glb -t -T`) | สร้าง React component (TypeScript) จากโมเดล |
| **r3f-perf** / Chrome DevTools Performance | วัด fps / draw calls |
| มือถือจริง 1 เครื่อง (Android ระดับกลาง) | ทดสอบ fps และการสัมผัส |

**ขั้นตอนบังคับทุกโมเดล:** ดาวน์โหลด → **ลงตารางเครดิตทันที** (ชื่อ, ผู้สร้าง, ลิงก์, license) → Blender ตัด/ลด polygon → export `.glb` →
gltf-transform บีบอัด → ตรวจที่ gltf.report → gltfjsx → วางใน `public/models/` → เพิ่มใน `/credits`

### แหล่งโมเดล (เรียงตามลำดับที่แนะนำ)

| แหล่ง | ใช้กับ | License |
|---|---|---|
| **Z-Anatomy** (z-anatomy.com / GitHub) ⭐ แหล่งหลัก | แขน + biceps brachii, หัวใจ | CC BY-SA 4.0 |
| BodyParts3D (DBCLS) | อวัยวะแยกชิ้น | CC BY-SA 2.1 JP |
| Sketchfab (กรอง *Downloadable* + ตรวจ license ทีละโมเดล) | fascicle / muscle fiber / หัวใจ | แตกต่างกัน |
| NIH 3D (3d.nih.gov) | อวัยวะ / โมเลกุล | ส่วนใหญ่ PD / CC |
| RCSB PDB | โปรตีน actin / myosin จริง (Future) | CC0 |

- **BY** = ต้องให้เครดิต · **SA** = งานดัดแปลงต้องใช้ license เดียวกัน · **NC** = ห้ามเชิงพาณิชย์ (งานมหาวิทยาลัยใช้ได้)
- **Fascicle → Muscle fiber → Myofibril:** สร้างเองใน Blender (ทรงกระบอกซ้อน + texture ลาย striation)
- **Sarcomere:** **สร้างด้วยโค้ดใน R3F ทั้งหมด** (ไม่ใช้ไฟล์โมเดล) เพื่อให้ slider ควบคุมได้ตรงตาม sliding filament theory

---

## เนื้อหาที่มีอยู่แล้วในเว็บ (Lessons — 4 หัวข้อใหญ่, 9 บท)

| หัวข้อใหญ่ | บท (slug → `/lessons/<slug>`) | หัวข้อในบท |
|---|---|---|
| **Muscle tissue basics** | `overview-functions-properties` | Overview · Functions (movement, posture, body openings, heat, blood glucose) · Properties (excitability, conductivity, contractility, extensibility, elasticity) |
| | `cardiac-and-smooth-muscle` | Cardiac muscle (microscopic features, **intercalated discs**) · Smooth muscle (single-unit, multiunit, microscopic structure) · **Summary: 3 types of muscle tissue** |
| **Structure of skeletal muscle** | `skeletal-muscle-tissue` | Gross anatomy · **Connective tissue (epimysium, perimysium, endomysium)** · Muscle fiber: **sarcolemma, T-tubules, SR, terminal cisternae, triad, myofibrils** |
| | `sarcomere-and-myofilaments` | **Structure of the sarcomere** · **Thick filaments (myosin)** · **Thin filaments (actin, tropomyosin, troponin)** · **Structural proteins (titin, nebulin …)** |
| | `types-of-skeletal-muscle-fibers` | Slow oxidative · Fast oxidative–glycolytic · Fast glycolytic |
| | `injury-and-regeneration` | Muscle fiber injury and regeneration (satellite cells) |
| **Nerve to contraction** | `motor-unit-and-nmj` | **Motor unit** · **Neuromuscular junction** |
| | `contraction-and-relaxation` | Excitation · Excitation–contraction coupling · Contraction · Relaxation · Sequence of events · **Sliding filament mechanism** · Key concepts |
| **Clinical correlation** | `disorders-of-skeletal-muscle` | Duchenne muscular dystrophy · Myasthenia gravis |

**ตัวหนา** = เนื้อหาที่หน้า 3D ต้องแสดงหรือลิงก์ไป · ข้อความใน info panel ให้ดึง/สรุปจาก `lessons.ts` (ห้ามแต่งเนื้อหาใหม่ที่ขัดกับบทเรียน)

### ข้อมูลจากการสอนจริง (เหตุผลที่ต้องทำ 3D ให้ดี)

- ข้อที่นักศึกษาผิดมากใน Pretest: ชนิดกล้ามเนื้อ, **perimysium**, **องค์ประกอบของ thin filament**, **A-band**
- หลังเรียนยังผิดราว 30% ว่า "myosin เป็นส่วนของ thin filament" → **ต้องแยกสี actin / myosin ให้ชัดมาก**
- กิจกรรมที่นักศึกษาให้คะแนนสูงสุดคือ **movable sarcomere model** (โมเดลอะคริลิกเลื่อน Z-disc ได้) → หน้า Sarcomere คือหัวใจของงาน
- ลำดับการสอนในห้อง: ชนิดกล้ามเนื้อ → การจัดเรียงโครงสร้าง → muscle fiber → sarcomere → วิดีโอการหดตัว → Posttest

---

## เนื้อหาของหน้า 3D (สิ่งที่ต้องสร้าง)

### หน้า 1 — `/explore` 3D Explore (zoom chain แนว BioDigital)

**Topic picker:**

| Topic | สถานะ | เนื้อหา |
|---|---|---|
| **Skeletal muscle** | Must — เปิดใช้ | zoom chain 5 ระดับด้านล่าง |
| Cardiac muscle | Should — "Coming soon" ถ้ายังไม่เสร็จ | หัวใจ → cardiac cells แตกแขนง, nucleus 1 อันอยู่กลาง, **intercalated disc = desmosome + gap junction** |
| Smooth muscle | Future — แสดงเป็น "Future" | กระเพาะ/หลอดเลือด → spindle cell, nucleus กลาง, non-striated |

**Zoom chain ของ Skeletal (breadcrumb กดย้อนกลับได้ทุกระดับ, เปลี่ยนระดับ = บินกล้อง + fade):**

| ระดับ | Scene | Hotspot ที่ต้องมี (คลิก → ชื่อ + หน้าที่ + ลิงก์บทเรียน) | ลิงก์บทเรียน |
|---|---|---|---|
| 1. Arm · Biceps brachii | แขน + กล้ามเนื้อ biceps brachii (Z-Anatomy) | Skeletal muscle (ทั้งมัด), **Epimysium**, Tendon → bone, voluntary control | `skeletal-muscle-tissue` |
| 2. Fascicle | ภาพตัดขวางกล้ามเนื้อเห็นมัด fascicle | **Fascicle**, **Perimysium**, blood vessels & nerves | `skeletal-muscle-tissue` |
| 3. Muscle fiber | เซลล์ทรงกระบอกยาว 1 เซลล์ (ตัดให้เห็นด้านใน) | **Endomysium**, **Sarcolemma**, **multiple peripheral nuclei**, **T-tubule**, **Sarcoplasmic reticulum**, **Terminal cisternae**, **Triad**, Mitochondria, Myofibrils · (Should) Satellite cell | `skeletal-muscle-tissue`, `injury-and-regeneration` |
| 3b. (Should) Neuromuscular junction | hotspot บน fiber | Motor neuron, Axon terminal (vesicles of **acetylcholine**), Synaptic cleft, ACh receptors, **Motor unit** | `motor-unit-and-nmj` |
| 4. Myofibril | เส้น myofibril เห็นลาย striation ซ้ำ ๆ | **A-band (dark)**, **I-band (light)**, **Z-disc**, SR หุ้มรอบ · ปุ่ม "Open interactive sarcomere →" | `sarcomere-and-myofilaments` |
| 5. Sarcomere | ลิงก์ไป `/explore/sarcomere` | – | – |

**ขนาด (แสดงเป็นข้อมูลประกอบใน info panel):** thin filament 5–6 nm · thick filament 10–12 nm · myofibril 1–2 µm · muscle fiber ~100 µm (ตาม Key Point Book)

### หน้า 2 — `/explore/sarcomere` Interactive Sarcomere (หัวใจของโปรเจกต์ — สร้างด้วยโค้ด)

**ชิ้นส่วนที่ต้องมี (คลิกได้ทุกชิ้น → ป้ายชื่อ + info panel):**

| ชิ้นส่วน | สีแนะนำ (ต้องต่างกันชัด + มีรูปแบบ/ป้ายช่วยสำหรับคนตาบอดสี) | หน้าที่ (สรุป) |
|---|---|---|
| **Z-disc** ×2 | เทาเข้ม | ขอบ sarcomere, thin filament ยึดที่นี่ |
| **M-line** | ม่วง | กึ่งกลาง ยึด thick filament |
| **Thin filament — Actin** | ฟ้า | F-actin เกลียวคู่ มี binding site ของ myosin |
| **Tropomyosin** | เหลือง (เส้นพันรอบ actin) | ปิด binding site ขณะพัก |
| **Troponin complex (TnC, TnI, TnT)** | เขียว (ก้อนเล็กเป็นระยะ) | TnC จับ Ca²⁺ → ดึง tropomyosin เปิด binding site |
| **Thick filament — Myosin** | แดง/ส้ม (มี head ยื่นออก) | head จับ actin + ATP, tail รวมเป็นแกน |
| **Titin** | เส้นบางสีชมพู Z-disc → M-line | ความยืดหยุ่น, คืนรูป |
| **Nebulin** | เส้นบาง ตาม thin filament | กำหนดความยาว thin filament |

**แถบ label บน sarcomere (เปลี่ยนตาม slider แบบ real-time):** **A-band** · **I-band** · **H-zone** · **Sarcomere length (µm)**

**Slider หด ↔ คลาย (sliding filament theory) — ต้องถูกต้องตามนี้:**

| ส่วน | เมื่อหดตัว (contraction) |
|---|---|
| Sarcomere (Z → Z) | **สั้นลง** (Z-disc เลื่อนเข้าหากัน) |
| I-band | **สั้นลง** |
| H-zone | **แคบลงจนหายไป** |
| A-band | **ยาวเท่าเดิม** (= ความยาว thick filament) |
| Thin / Thick filament | **ยาวเท่าเดิม** — แค่เลื่อนซ้อนกันมากขึ้น |

ค่าตั้งต้นตามตำรามาตรฐาน (ให้อาจารย์ยืนยันก่อนใช้จริง): thick filament ≈ 1.6 µm (คงที่) · thin filament ≈ 1.0 µm ต่อข้างจาก Z-disc (คงที่) ·
sarcomere พัก ≈ 2.5 µm → หดสุด ≈ 2.0 µm (H-zone = 0) · เขียนเป็น pure function `bandsAt(t)` แล้วมี **unit test** ยืนยันว่า A-band และความยาว filament คงที่ทุกค่า t

**ส่วนเสริมในหน้า:**
- กล่องเตือนเด่น ๆ: **"Myosin is NOT part of the thin filament"**
- ปุ่ม/แท็บ "Steps of contraction" สรุปลำดับ: action potential → T-tubule → SR ปล่อย Ca²⁺ → Ca²⁺ จับ TnC → tropomyosin เลื่อน → myosin head จับ actin (cross-bridge) → power stroke → ATP ทำให้หลุด → Ca²⁺ ถูกปั๊มกลับ SR → relaxation (ลิงก์ `contraction-and-relaxation`)
- ฝังวิดีโอ Motion VDO: https://youtu.be/ousflrOzQHc ผ่าน `youtube-nocookie.com`, `loading="lazy"`, มี `title`
- (Future) แอนิเมชัน Ca²⁺ ออกจาก SR ใน 3D, โมเดลโปรตีนจริงจาก PDB

---

## Requirement IDs (จาก `palnforwork/02_REQUIREMENTS.md`)

Must: 3D-1 topic picker · 3D-2 zoom chain 5 ระดับ · 3D-3 บินกล้อง + fade · 3D-4 หมุน/zoom/pan · 3D-5 sarcomere สร้างด้วยโค้ด ·
3D-6 slider หด/คลาย · 3D-7 คลิกชิ้นส่วน → info panel · 3D-8 แถบ A/I/H · 3D-9 วิดีโอ · 3D-14 credits
Should: 3D-10 cardiac · Future: 3D-11 smooth, 3D-12 Ca²⁺ animation, 3D-13 โมเดลทั้งร่าง

## สิ่งที่ต้องส่งในรอบแรก (ก่อนเขียนโค้ดจริง)

1. **แผนงาน** แบ่งเป็นขั้นเล็ก ๆ ที่ทดสอบได้ (แนะนำ: Sarcomere ก่อน → zoom chain → cardiac)
2. **รายการไฟล์** ที่จะสร้าง/แก้ (เช่น `src/pages/explore/sarcomere/model.ts` สำหรับ `bandsAt`, `Scene.tsx`, `InfoPanel.tsx`, `src/content/explore.ts` สำหรับข้อความ hotspot)
3. **ตารางโมเดลที่จะใช้** (ชื่อ, แหล่ง, ลิงก์, license, ขนาดหลังบีบอัด) — ยังไม่ต้องดาวน์โหลดจนกว่าจะอนุมัติ
4. **คำถามที่ต้องให้อาจารย์ยืนยัน** (ค่าความยาว sarcomere, สีของโปรตีน, รายชื่อ hotspot)

## เกณฑ์ตรวจรับ

- [ ] ทุกข้อ Must ด้านบนทำงาน · slider ถูกต้องตามตาราง sliding filament (มี unit test)
- [ ] เนื้อหาทุกข้อตรงกับ `lessons.ts` / Key Point Book และอาจารย์ตรวจแล้ว (กฎ R6)
- [ ] ทุกโมเดลอยู่ในหน้า `/credits` พร้อม license (กฎ R7)
- [ ] ≥ 30 fps บนมือถือจริง · JS หน้า 3D ≤ 300 KB gzip · โมเดล ≤ 5 MB/scene
- [ ] ใช้ได้ทั้ง light/dark, มือถือ/แท็บเล็ต/desktop, คีย์บอร์ด (hotspot กด Tab ได้), มี fallback เมื่อไม่มี WebGL
- [ ] `npm run lint` · `npx vitest run` · `npm run build` ผ่าน · ไม่ commit/push/deploy จนกว่าผู้ใช้สั่ง
