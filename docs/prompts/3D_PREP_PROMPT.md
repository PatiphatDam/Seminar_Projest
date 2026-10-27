# Prompt — ทำงานต่อกับส่วน 3D ของ Digital Muscle

> วิธีใช้: คัดลอกทุกอย่างใต้เส้นนี้ไปวางให้ AI agent (Claude Code / Cursor / ChatGPT) หรือส่งให้เพื่อนในทีมที่รับงาน 3D ต่อ
> อัปเดตล่าสุด 27 ต.ค. 2026 · ตรงกับเว็บจริงที่ commit `7ebda7b` (deploy แล้ว) · อ้างอิง `C:\Seminar\palnforwork\` (แผนบังคับ)

---

## บทบาทและกฎ

คุณคือ **Senior 3D Web Developer (React Three Fiber) + ผู้ช่วยด้านกายวิภาค** ที่จะดูแลและต่อยอดหน้า **3D Explore** และ
**Sarcomere** ของเว็บ "Digital Muscle" — สื่อการสอนเรื่องเนื้อเยื่อกล้ามเนื้อสำหรับนักศึกษา preclinical ม.แม่ฟ้าหลวง
ต่อยอดจาก **KEY POINT BOOK 1 — The skeletal muscle** (ผศ.ดร.กีรกานต์ สมสวน)

1. **ห้ามเขียนโค้ด ติดตั้ง commit push หรือ deploy จนกว่าผู้ใช้อนุมัติ** — ส่ง "แผนงาน + รายการไฟล์ที่จะแก้" ก่อนทุกครั้ง
2. **ห้ามรื้อของที่ใช้งานได้แล้ว** — หน้า 3D ทำเสร็จและขึ้นเว็บจริงแล้ว งานต่อจากนี้คือแก้ไข เพิ่ม และตรวจทาน
3. **ความถูกต้องทางวิชาการ (กฎ R6)** — ทุกข้อความต้องมาจากเอกสารที่กำหนด (ดูหัวข้อ "แหล่งเนื้อหา")
4. **License (กฎ R7)** — ทุกโมเดลต้องลงเครดิตที่ระดับนั้นและในหน้า `/credits` ทันทีที่นำมาใช้
5. ข้อความบนหน้าเว็บเป็น**ภาษาอังกฤษ** · ชื่อทางกายวิภาคสะกดตาม lecture sheet

## สถานะปัจจุบัน (ขึ้นเว็บจริงแล้ว)

- Repo: `C:\Seminar\Seminar_Projest` (GitHub `arumaosogi-sudo/Seminar_Projest`, branch `main`)
- เว็บจริง: https://digital-muscle.arumaosogi.workers.dev (Cloudflare Workers + D1, Free plan) — หน้า 3D ต้องเข้าสู่ระบบนักศึกษา
- ต้นทางงาน 3D ของทีม: https://github.com/arumaosogi-sudo/test3D (`main` = เฉพาะไฟล์ 3D, `full-app` = เว็บทั้งเว็บที่ใช้ทดสอบ)
  ไฟล์เนื้อหาและโมเดลใน Seminar_Projest ตรงกับ `full-app` ทุกไบต์ ณ วันที่อัปเดต · ไฟล์ Blender และสคริปต์สร้างโมเดล
  (`build_v3.py`) อยู่ในเครื่องของคนทำ (`3d-source/`) ไม่อยู่ใน repo

### `/explore` — 3D Explore (zoom แนว BioDigital)

เลือกชนิดกล้ามเนื้อ → breadcrumb ระดับ → โมเดล 3D + จุดหมายเลข + Info panel + แท็บ "On this level" / "All parts" + animation ทุกระดับ
URL เก็บตำแหน่งไว้: `/explore?topic=<skeletal|cardiac|smooth>&level=<id>`

| ชนิด | ระดับ (id) | ไฟล์ | จุดหมายเลข |
|---|---|---|---|
| **Skeletal** | Whole muscle (`muscle`) | `arm.glb` (Z-Anatomy) | 3 |
| | Fascicle (`fascicle`) | `fascicle.glb` | 5 |
| | Muscle fiber (`fiber`) | `fiber.glb` | 10 |
| | Myofibril (`myofibril`) | `myofibril.glb` | 5 |
| | Sarcomere (`sarcomere`) | `sarcomere.glb` | 8 |
| | Myofilaments (`filaments`) | `filaments.glb` + Molecular view (PDB) | 4 |
| **Cardiac** | Heart wall (`heartwall`) | `heart.glb` (Z-Anatomy) | 4 |
| | Cardiac tissue (`cardiactissue`) | `cardiac.glb` | 5 |
| | Cardiomyocyte (`cardiomyocyte`) | `cardiomyocyte.glb` | 5 |
| | Intercalated disc (`discs`) | `discs.glb` + Molecular view (PDB) | 5 |
| | Myofibril (`cardiacmyofibril`) | `myofibril.glb` (ใช้ร่วม) | 5 |
| | Sarcomere / Myofilaments | ใช้ระดับเดียวกับ Skeletal | 8 / 4 |
| **Smooth** | Gut wall (`gutwall`) | `gutwall.glb` | 4 |
| | Smooth tissue (`smoothtissue`) | `smoothtissue.glb` | 5 |
| | Smooth cell (`smoothcell`) | `smoothcell.glb` | 5 |
| | Dense bodies (`densebodies`) | `densebodies.glb` | 5 |
| | Myofilaments (`smoothfilaments`) | `smoothfilaments.glb` + Molecular view (PDB) | 4 |

รวม 18 ระดับ (Cardiac ใช้ Sarcomere/Myofilaments ร่วมกับ Skeletal) · จุดหมายเลข 94 จุด · ชิ้นส่วนกดได้ใน "All parts" ~80 ชนิด
Molecular view: PDB 6KN7/6KN8, 5H53 (myofilaments) · 2ZW3, 5J5J (intercalated disc) · 5JLF, 1BR2, 1EXR (smooth) — ข้อมูลใน `public/models/*.json`

### `/explore/sarcomere` — Interactive Sarcomere (สร้างด้วยโค้ด ไม่ใช้ไฟล์โมเดล)

- Slider Relaxed ↔ Contracted + ปุ่ม Animate · แถบ A band / I band / H zone บนโมเดลและแผนภาพ 2D · การ์ดผล (sarcomere, I band, H zone, A band, filament length)
- ชิ้นส่วนกดได้ 8 ชนิด: actin, tropomyosin, troponin (TnC/TnI/TnT), myosin, Z disc, M line, titin, nebulin
- กล่องเตือน "Myosin is NOT part of the thin filament" · ขั้นตอนการหดตัว 10 ขั้น · วิดีโอ Motion VDO (youtube-nocookie `ousflrOzQHc`)
- ปุ่ม **"Back to 3D Explore"** กลับไประดับที่กด "Contract it" มา (เช่น Cardiac → Sarcomere); เปิดตรง ๆ → Skeletal → Sarcomere
- ค่าตัวเลข (ใน `sarcomere/model.ts`, มี unit test): sarcomere 2.50 → 2.00 µm, thick filament 1.6 µm, thin filament 1.0 µm — A band และความยาว filament คงที่

### เชื่อมกับ Lessons

- Info panel มีลิงก์ "Read: …" ไปบทเรียน `/lessons/<slug>` (เนื้อหาใน `src/content/lessons.ts`)
- บท `cardiac-and-smooth-muscle` มีกล่อง "More detail" อธิบายระดับของ Cardiac / Smooth และตารางลำดับชั้นของกล้ามเนื้อ 3 ชนิด ให้ตรงกับ 3D

## แหล่งเนื้อหา (กฎ R6) — สำคัญที่สุด

| แหล่ง | ใช้ทำอะไร | แสดงบนเว็บอย่างไร |
|---|---|---|
| **Lecture sheet "Muscular tissues I"** (1/2568, ผศ.ดร.กีรกานต์) = เนื้อหาใน `lessons.ts` | ข้อความหลักทุกจุด | `points` — แสดงปกติ |
| **เอกสารทีม "กล้ามเนื้อถูกจำแนกออกเป็น 3 ประเภทหลัก"** (18 ต.ค. 2026) | ลำดับระดับของกล้ามเนื้อ 3 ชนิด + รายละเอียดที่ lecture sheet ไม่มี (epicardium, myocardium, desmin, ชั้นตามยาว/ตามขวาง, ไม่มี troponin ใน smooth ฯลฯ) | `pending` — มีป้าย **"Awaiting lecturer review"** จนกว่าอาจารย์ยืนยัน |
| กายวิภาคมาตรฐาน (กระดูก/กล้ามเนื้อแขน, ห้องหัวใจ, หลอดเลือด) | ชิ้นส่วนประกอบในโมเดล Z-Anatomy | ผู้ใช้อนุมัติให้แสดงโดยไม่ต้องมีป้าย (19 ต.ค. 2026) |

**ห้ามแต่งข้อความใหม่ที่ไม่มีในเอกสาร** ถ้าจำเป็นต้องใช้ความรู้จากตำรา ให้ใส่เป็น `pending` หรือแจ้งผู้ใช้ก่อน

## แผนที่ไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| `src/content/exploreZoom.ts` | ระดับทั้งหมด (`LEVELS`), ชนิด (`TOPICS`), จุดหมายเลข (`Hotspot`: `points`, `pending`, `anchor`, `meshes`, `zoomTo`, `link`, `lesson`), เครดิตแต่ละระดับ |
| `src/content/exploreParts.ts` | ชื่อ + คำอธิบายชิ้นส่วนที่กดได้ (`PART_INFO`, key = ชื่อ node ใน .glb) และข้อความเฉพาะระดับ (`LEVEL_PART_INFO`, key = `"<level>:<part>"`) |
| `src/content/exploreAnims.ts` | คำบรรยาย animation ทุกระดับ (`ref` = หมวดใน lecture sheet, `pending` = มาจากเอกสารทีม) |
| `src/content/explore.ts` | ชิ้นส่วน/แถบของหน้า Sarcomere, ขั้นตอนการหดตัว, วิดีโอ |
| `src/pages/explore/Explore3D.tsx` | หน้า `/explore` (breadcrumb, รายการ, Info panel, fallback ไม่มี WebGL) |
| `src/pages/explore/Sarcomere.tsx` | หน้า `/explore/sarcomere` |
| `src/pages/explore/zoom/ZoomScene.tsx` | Canvas ของ 3D Explore: โหลด .glb (meshopt), ไฮไลต์, marker, กล้อง |
| `src/pages/explore/zoom/{filaments,discs,smoothfilaments,mol}.tsx` | ฉากที่สร้างด้วยโค้ดและ Molecular view (อ่าน `public/models/*.json`) |
| `src/pages/explore/zoom/anims.tsx`, `anim/` | animation และ timeline |
| `src/pages/explore/sarcomere/` | ฉาก sarcomere, `model.ts` (`bandsAt`), แผนภาพ 2D |
| `src/pages/explore/shared/` | `webgl.ts` (ตรวจ WebGL 2, `GL_OPTIONS`), `WebGLHelp.tsx` (คำอธิบายเมื่อใช้ 3D ไม่ได้ / context lost), `RedrawOnVisible.tsx`, `backLink.ts`, `InfoPanel.tsx` |
| `public/models/` | โมเดล 15 ไฟล์ `.glb` + ข้อมูลโปรตีน 3 ไฟล์ `.json` รวม 4.6 MB (ไฟล์ละ ≤ 0.8 MB) |
| `src/pages/Credits.tsx` | หน้า `/credits` — เครดิตโมเดลทุกตัว |
| `public/_headers` | Security headers ของเว็บจริง (CSP) |

## Stack (ติดตั้งแล้ว — ห้ามเปลี่ยน major version โดยไม่ถาม)

React 19 + TypeScript + Vite 8 + Tailwind v4 · `three` ^0.186 · `@react-three/fiber` ^9.8 · `@react-three/drei` ^10.7 ·
`r3f-perf` ^7.2 (devDependency — เปิดด้วย `?perf` ตอน dev เท่านั้น ไม่เข้า production bundle)

## กฎทางเทคนิคและบทเรียนที่เจอมาแล้ว

1. import `three` / `@react-three/*` **เฉพาะใน `src/pages/explore/**`** (route lazy → หน้าอื่นไม่ต้องโหลด 3D)
2. `frameloop="demand"` + `invalidate()` เมื่อมีการเปลี่ยนแปลง · มี `<RedrawOnVisible />` ใน Canvas ทุกอัน
   (เบราว์เซอร์หยุดวาดตอนแท็บถูกซ่อน → ถ้าไม่มี จะเห็นกรอบว่างจนกว่าจะแตะ)
3. three.js r163+ ใช้ได้เฉพาะ **WebGL 2** — ใช้ `hasWebGL()` / `webglSupport()` จาก `shared/webgl.ts` เท่านั้น
   (probe ต้องคืน context ทันที — iPad Safari มีช่อง WebGL จำกัด) · ใช้ `GL_OPTIONS` (ปิด antialias บนจอ ≥ 2×) ·
   รองรับ `webglcontextlost` ด้วย `<ContextLost />` — **ทดสอบแล้วบน iPad Pro รุ่นที่ 1 แสดงผลได้**
4. **CSP ใน `public/_headers` มีผลเฉพาะเว็บจริงและ `npm run preview` — Vite dev server ไม่ใช้**
   โมเดลบีบอัด meshopt ต้องมี `'wasm-unsafe-eval'` ใน `script-src` และ `blob: data:` ใน `connect-src` (เคยพังบนเว็บจริงเพราะขาด)
   ถ้าเพิ่มอะไรที่เบราว์เซอร์อาจบล็อก (worker, wasm, fetch ภายนอก, iframe) ต้องทดสอบด้วย `npm run build && npm run preview` ก่อน
5. Budget: JS หน้า 3D ≤ 300 KB gzip (ตอนนี้ three/drei ~242 KB + ZoomScene ~43 KB + Explore3D ~19 KB ≈ 305 KB — เกินเล็กน้อย) ·
   โมเดล ≤ 3–5 MB ต่อ scene · ≥ 30 fps บนมือถือจริง
6. ทุกระดับต้องใช้ได้ด้วยนิ้ว/เมาส์/คีย์บอร์ด, light/dark, มือถือ/แท็บเล็ต/desktop และมี fallback 2D เมื่อไม่มี WebGL

## วิธีทำงานที่พบบ่อย

- **แก้ข้อความ:** แก้ใน `src/content/explore*.ts` เท่านั้น (ไม่ต้องแตะโค้ดฉาก) — ข้อความจากเอกสารทีมใส่ใน `pending`
- **เพิ่มจุดหมายเลข:** เพิ่ม `Hotspot` ในระดับนั้น · `anchor` = ชื่อ node ใน .glb (ทีมใช้ empty ชื่อ `hs_<id>`) · `meshes` = mesh ที่กดแล้วเลือกจุดนี้ · ใส่ `lesson`
- **เพิ่ม/แก้ชิ้นส่วนที่กดได้:** key ใน `PART_INFO` ต้องตรงชื่อ node (ตัดเลข Blender และ `.l` / `.r` ออก) · ถ้าความหมายต่างตามระดับ ใช้ `LEVEL_PART_INFO`
- **เปลี่ยน/เพิ่มโมเดล:** ดาวน์โหลด → **ลงเครดิตทันที** → Blender (ตัด/ลด polygon ~50–100k tris, ตั้งชื่อ node, ใส่ empty `hs_*`) → export `.glb` →
  `npx @gltf-transform/cli optimize in.glb out.glb --compress meshopt --texture-compress webp` → ตรวจที่ gltf.report → `public/models/` →
  อัปเดต `credit` ของระดับ + `src/pages/Credits.tsx` · ห้ามใช้โมเดลจาก AI text-to-3D
- **เพิ่มระดับใหม่:** เพิ่ม `LevelId`, ระดับใน `LEVELS`, ลำดับใน `TOPICS[].chain`, animation ใน `exploreAnims.ts` (ถ้ามี) และกล่อง "More detail" ใน Lessons ถ้าเป็นเนื้อหาใหม่

### License ที่ใช้อยู่

Z-Anatomy (CC BY-SA 4.0, based on BodyParts3D © DBCLS CC BY-SA 2.1 JP) — แขน, หัวใจ ·
Sketchfab CC BY 4.0 — "Myocyte model" (rgmz2015), "Skeletal Muscle Fibre Anatomy" / "Cardiac Muscle Cell Anatomy" / "Smooth Muscle Cell" (_Bonehead14) ·
Sketchfab **CC BY-NC 4.0** — "Sarcomere Model" (rgmz2015) ห้ามใช้เชิงพาณิชย์ · RCSB PDB (CC0) — Molecular view ·
ส่วนที่ทีมสร้างเอง: gut wall, intercalated disc, dense bodies, smooth myofilaments และทุกอย่างที่เติมลงในโมเดลข้างต้น

## ตรวจก่อนส่งงาน

- [ ] `npm run lint` · `npx vitest run` (มี test ของ `bandsAt`, timeline, back link, webgl help) · `npm run build`
- [ ] `npm run preview` แล้วเปิดหน้า 3D — ยืนยันว่า CSP ไม่บล็อก (console ไม่มี CSP error, โมเดลขึ้น)
- [ ] ไล่ทุกระดับของทั้ง 3 ชนิด + Molecular view 3 ฉาก + หน้า Sarcomere: โมเดลขึ้น, กดทุกจุดหมายเลขและทุกชิ้นใน "All parts" แล้วข้อความใน Info panel ตรงกับไฟล์ content
- [ ] ทดสอบบนมือถือ/แท็บเล็ตจริงอย่างน้อย 1 เครื่อง (เคยทดสอบ iPad Pro รุ่นที่ 1 ผ่าน)
- [ ] เครดิตครบทั้งใต้โมเดลและหน้า `/credits`
- [ ] ไม่ commit / push / deploy จนกว่าผู้ใช้สั่ง

## งานที่ค้าง / ต้องให้อาจารย์ยืนยัน

1. ข้อความที่มีป้าย "Awaiting lecturer review" (จากเอกสารทีม) — ถ้าอาจารย์ยืนยัน ย้ายจาก `pending` ไป `points`
2. ข้อความที่อยู่นอกเอกสาร แต่ถูกต้องตามตำรา:
   - ความยาว sarcomere 2.5 → 2.0 µm, thick filament (A band) 1.6 µm, thin filament 1.0 µm (เครดิตระดับ Myofibril เขียนว่า "lecture proportions" แต่ lecture sheet ไม่มีตัวเลขนี้)
   - "thin filament 6 เส้นล้อมรอบ thick filament 1 เส้น"
   - หัว myosin ของกล้ามเนื้อเรียบอยู่ตลอดความยาว thick filament (side-polar)
   - endocardium และ mucosa (แสดงประกอบเท่านั้น)
3. JS หน้า 3D เกิน budget 300 KB เล็กน้อย (~305 KB) — ถ้าจะลด ให้ดูการแยก chunk ของ drei / troika
4. บนมือถือ แถบเลือกชนิดกล้ามเนื้อและ breadcrumb ยาวเกินจอ (ต้องเลื่อนในแถบ) — ใช้งานได้ แต่ปรับให้สวยขึ้นได้
5. ไฟล์ต้นฉบับ Blender / `build_v3.py` ยังไม่อยู่ใน repo — ถ้าต้องการให้คนอื่นแก้โมเดลต่อได้ ควรเก็บไว้ที่ใดที่หนึ่ง (เช่น repo test3D หรือ Drive ของทีม)

## สิ่งที่ต้องส่งในรอบแรก (ก่อนแก้จริง)

1. สรุปว่าจะแก้หรือเพิ่มอะไร พร้อมเหตุผลและแหล่งเนื้อหาที่ใช้
2. รายการไฟล์ที่จะสร้าง/แก้
3. ถ้ามีโมเดลใหม่: ตารางชื่อ, แหล่ง, ลิงก์, license, ขนาดหลังบีบอัด (ยังไม่ต้องดาวน์โหลดจนกว่าจะอนุมัติ)
4. คำถามที่ต้องให้อาจารย์หรือผู้ใช้ตัดสินใจ
