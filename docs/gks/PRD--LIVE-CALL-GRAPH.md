# PRD — Live Call Graph (New)

**Version:** 1.0  
**Status:** Draft  
**Owner:** Rwang (อาหวัง)  
**Objective:** เพื่อสร้างหน้าจอแสดงความเชื่อมโยงระดับสัญลักษณ์ข้ามไฟล์ (Cross-file Symbol Call Graph) ในระบบ CoDev Dashboard โดยทำงานผ่าน Cytoscape.js และจำลองโครงข่ายข้อมูลบน SQLite Database จาก Tree-sitter Extraction  

---

## 1. วิสัยทัศน์และเหตุผลความจำเป็น (Vision & Rationale)

ปัจจุบันระบบมี **Symbol View (AST)** ที่ช่วยแสดงความสัมพันธ์เชิงไวยากรณ์ (Syntax Tree) ภายในหนึ่งไฟล์ตัวอย่างผ่าน SVG Line Drawing แต่ยังขาดมุมมองเชิงภาพกว้างในระดับทั้งโครงการ (Project-wide / Cross-file) ซึ่งฟังก์ชันต่างๆ เรียกใช้งานกันข้ามไฟล์และข้ามแพ็กเกจ (msp, gks, ui) 

ฟีเจอร์ **Live Call Graph** นี้จะเข้ามาช่วยแก้ปัญหาโดยการแปลงข้อมูล Tree-sitter AST Extraction ไปเป็น SQLite In-memory Database จำลอง เพื่อให้ผู้ใช้งานมองเห็น **Call Hierarchy** และประเมิน **Blast Radius** (ผลกระทบเมื่อมีการแก้ไขฟังก์ชันใดๆ) ได้ทันที

---

## 2. กลุ่มเป้าหมายผู้ใช้งาน (Target Persona)

1. **Human Developer (Boss/อาหวัง):** ต้องการดูความเชื่อมโยงเพื่อวางแผนสถาปัตยกรรมโครงสร้างโปรเจกต์
2. **AI Developer Agents (Gemini, Claude, Qwen):** ใช้ประเมินเส้นทางการไหลของข้อมูลและระบุจุดเชื่อมต่อ (Integration points) เพื่อความแม่นยำในการปรับปรุงแก้ไขโค้ด

---

## 3. ข้อกำหนดเชิงฟังก์ชัน (Functional Requirements)

### 3.1 ปุ่มสลับแท็บและการวางพื้นที่แสดงกราฟ (View & Layout Switcher)
- เพิ่มปุ่ม `#btn-view-callgraph` ใน Center View Switcher ถัดจากปุ่ม "AST"
- เมื่อคลิกใช้งาน หน้ากราฟเรียกใช้ข้ามไฟล์จะเปิดตัวขึ้นมาในกรอบพื้นที่การ์ดตรงกลาง (`#callgraph-view`) โดยซ่อนมุมมอง AST และ Roadmap เก่า
- คงขอบเขต (Card boundaries) และสีพื้นหลังสีเทาเข้มแบบเดิมของระบบ Dashboard ไว้เพื่อความเป็นระเบียบและกลมกลืน

### 3.2 ระบบจำลองฐานข้อมูล SQLite DB (SQLite Integration Mockup)
- แถบเครื่องมือ (Toolbar) ด้านบนระบุสถานะดึงข้อมูลจาก `SQLite DB: in-memory (active)`
- มีปุ่ม **"Sync Tree-sitter"** เพื่อจำลองสถานการณ์การกวาดอ่านโค้ดในโปรเจกต์ (AST Indexing Run) 
- เมื่อกดปุ่ม Sync จะแสดงล็อกการจำลองกระบวนการวิเคราะห์และการสร้างตารางลงในหน้าต่าง Terminal ของระบบ

### 3.3 การจับคู่สีตามแพ็กเกจ (Visual Package Coloring)
เพื่อระบุขอบเขตของโครงสร้างได้รวดเร็ว Node ในโครงข่ายจะแยกสีตามแพ็กเกจ:
- **`packages/msp` (Memory & Soul Passport):** ใช้สีเขียว Accent (`#78f4bf`)
- **`packages/gks` (Genesis Knowledge System):** ใช้สีน้ำเงิน (`#60a5fa`)
- **`apps/web` (Genesis UI):** ใช้สีม่วง (`#c084fc`)

### 3.4 โครงสร้างแบบชั้นลำดับ (Compound Nodes Structure)
สัญลักษณ์ถูกจัดกลุ่มตามไฟล์เพื่อให้ดูง่าย:
- **Parent Nodes (File level):** วาดกรอบเส้นประล้อมรอบ ระบุชื่อไฟล์ (เช่น `App.tsx`, `index.ts`)
- **Child Nodes (Symbol level):** วาดวงกลมหรือสัญลักษณ์แสดงฟังก์ชันย่อยภายในไฟล์นั้น (เช่น `initOrchestrator()`, `syncState()`)
- **Call Edges:** เส้นหัวลูกศรชี้ทิศทางการเรียกจาก Caller ไปหา Callee

### 3.5 ปฏิสัมพันธ์ระดับไอคอนและเมนูข้อมูล (Interactive Hover & Detail Panel)
- **Hover Dimming:** เมื่อนำเมาส์ชี้ที่ Node สัญลักษณ์ใดๆ Node และ Edge ที่ไม่เกี่ยวข้องในเส้นทางการทำงานนั้นจะถูกจางแสงลง (Opacity 0.2/0.1) เพื่อขยายจุดที่เชื่อมโยงกันให้สว่างชัด
- **Info Panel (`#cy-info-panel`):** เมื่อคลิกเลือก Node จะเปิดหน้าต่างแผงข้อมูลขวาของกราฟ แสดง:
  - ชื่อสัญลักษณ์ (Symbol Name), ประเภท (Type), และ ที่อยู่ไฟล์ (File Location)
  - รายชื่อผู้เรียกใช้ต้นทาง (Inbound Callers) ที่กดข้ามไปดูความสัมพันธ์ได้
  - รายชื่อเป้าหมายปลายทางที่โดนเรียกใช้ (Outbound Calls)

---

## 4. ข้อกำหนดเชิงเทคนิคและประสิทธิภาพ (Technical Specifications)

1. **External Dependency:** โหลดไลบรารี Cytoscape.js ผ่าน cdnjs เวอร์ชันเสถียร
2. **Layout Algorithm:** ใช้โมเดลจัดเรียงแรงผลักดันและแรงดึง (`cose` layout) เพื่อกระจายตัว Node อย่างสวยงาม ไม่ซ้อนทับกัน
3. **Response Constraints:** รองรับการลากหน้าจอ (Pan), ซูมเข้า-ออก (Zoom) และการย้ายตำแหน่ง Node ทีละตัว

---

## 5. แผนการทดสอบและเกณฑ์การตรวจรับ (Acceptance Criteria)

1. **Tab Switch Test:** ปุ่มหน้ากราฟสามารถกดสลับไปมาระหว่าง AST, Roadmap และ Call Graph ได้โดยไม่เกิดความทับซ้อนในหน้า UI
2. **Interactivity Test:** การนำเมาส์ไปจ่อที่ Node สามารถสร้างแสงไฮไลต์ตามความเชื่อมโยงได้อย่างสมบูรณ์
3. **Detail Navigation Test:** คลิกข้าม Caller/Callee ในแผงแสดงผลด้านขวาแล้วไอคอนที่หน้าจอนำทางโฟกัส Node ตัวถัดไปถูกต้อง
4. **Resync Test:** ปุ่ม Sync ส่งค่าสถานะพิมพ์ออกทางบานหน้าต่างจำลอง Terminal ถูกต้องครบถ้วน
