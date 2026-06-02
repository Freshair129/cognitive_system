---
id: FRAMEWORK--WORKFLOW-DYNAMICS
phase: 0
type: framework
status: stable
vault_id: default
tier: master
promoted_from: GENESIS--COGNITIVE-ENGINE
promoted_at: 2026-06-02T20:13:00.000+07:00
promotion_adr: ADR--TAXONOMY-CAPABILITY-SYMMETRY
source_type: axiomatic
title: Genesis Workflow Dynamics
summary: คู่มืออธิบายความสัมพันธ์เชิงลึกของกระบวนการ 12-Step Top-Down, 7-Phase Bottom-up และโครงสร้างเอกสาร Enterprise
tags:
  - architecture
  - workflow
  - genesis-block
  - msp
created_at: 2026-06-02T20:13:00.000+07:00
cluster: implementation_flow
role: Governance / architectural framework
---

# 🔄 Genesis Workflow Dynamics (พลวัตของระบบการทำงาน GKS)

> [!NOTE]
> ระบบ Genesis Knowledge Block System (GKS) ทำงานอยู่บนแนวคิดของ **"The Infinite Loop"** (วัฏจักรที่ไม่มีจุดสิ้นสุด) โดยสถาปัตยกรรมจะแบ่งการทำงานออกเป็นสองฝั่งหลักๆ คือ **การทำความเข้าใจสิ่งที่มีอยู่เดิม (Decomposition)** และ **การสร้างสิ่งใหม่ขึ้นมา (Assembly)** สองกระบวนการนี้จะทำงานประสานกันตลอดเวลาเพื่อให้ Agent (LLM) มีความเข้าใจที่แม่นยำ 100%

---

## 1. 🔍 12-Step Top-Down (Block Decomposition)
**เป้าหมาย:** ชำแหละและทำความเข้าใจ Codebase ขนาดใหญ่ (Monorepo) จากระดับบนสุด ลงลึกไปจนถึงรากฐาน แล้วสกัดออกมาเป็น กราฟความสัมพันธ์ (Architectural Knowledge Graph) 

กระบวนการนี้เป็น **Top-Down** เพราะเริ่มจาก "ซอฟต์แวร์ที่สำเร็จรูปแล้ว" ย่อยให้กลายเป็น "ความรู้ที่เป็นนามธรรม"

### 🎯 Phase A: Discovery (สแกนโครงสร้างภายนอก)
* 1. **Scan (File paths):** Agent ทำการสแกนระบบไฟล์ทั้งหมดเพื่อดูโครงสร้างของโปรเจกต์ โฟลเดอร์ใดบ้างที่เป็น Code โฟลเดอร์ใดเป็น Config
* 2. **Structure (Hierarchy):** สร้างแผนผังลำดับชั้นของระบบ (Tree Mapping) เพื่อดูว่า Bounded Context อยู่ที่ไหน

### 🧠 Phase B: Extraction (เจาะลึกรายละเอียดและสกัด Logic)
* 3. **Specialized Parse (Markdown):** อ่านและตีความเอกสารที่มีอยู่เดิม เพื่อหาว่ามีสเปกหรือโครงสร้างความรู้อะไรถูกนิยามไว้บ้าง
* 4. **Specialized Parse (COBOL/Legacy):** สกัดและแปลงโค้ดเก่าๆ ที่ไม่มีคนดูแลให้กลายเป็นโครงสร้างที่อ่านเข้าใจได้
* 5. **Symbolic Parse (AST):** ใช้ Tree-sitter หรือเครื่องมือคล้ายกัน ดึงเอาสัญลักษณ์ต่างๆ (Classes, Functions, Types) ออกมาจากโค้ด
* 6. **Framework - Routes:** แกะรอย API Entry points ทั้งหมด (เช่น เช็คไฟล์ `routes/`, `controllers/`)
* 7. **Framework - Tools:** ค้นหาและดึงคำนิยามของ MCP Tools หรือสคริปต์อัตโนมัติภายในโปรเจกต์
* 8. **Framework - ORM:** อ่าน Schema ของฐานข้อมูล (Entities) เพื่อดูว่าระบบเก็บข้อมูลรูปแบบใด

### 🌐 Phase C: Relationship & Logic (ผูกโยงความสัมพันธ์และเส้นทาง)
* 9. **Cross-File Resolution:** วิเคราะห์การ Import/Export ระหว่างไฟล์ กราฟจะถูกสร้างขึ้นเพื่อบอกว่าไฟล์ A เรียกใช้ไฟล์ B
* 10. **MRO (Method Resolution Order):** แกะรอยระบบการสืบทอด (Inheritance) และ Interfaces ต่างๆ ของคลาส
* 11. **Communities (Leiden Algorithm):** จัดกลุ่มโค้ดที่มีความสัมพันธ์กันสูง (High Cohesion) ให้อยู่ใน Bounded Context หรือ Module เดียวกัน
* 12. **Processes (Execution Flows):** ลากเส้นทางการทำงานทั้งหมด (Call Chains) ว่าข้อมูลวิ่งจาก UI ➔ API ➔ DB อย่างไร

---

## 2. 🏗️ 7-Phase Bottom-up (Block Assembly & Specification-to-System)
**เป้าหมาย:** กระบวนการสร้างซอฟต์แวร์ที่เปลี่ยนจากการทำงานแบบเส้นตรง (Sequential) ของมนุษย์ ไปสู่การประมวลผลแบบขนาน (Parallel Convergence) ของ Agentic AI 

กระบวนการนี้เป็น **Bottom-Up** เพราะเริ่มจากไอเดียเปล่าๆ แล้วค่อยๆ สร้างเอกสารอ้างอิง จนประกอบร่างกลายเป็นซอฟต์แวร์ที่ทำงานได้จริง

### 🧩 2.1 Pipeline การเปลี่ยนสถานะความรู้ (Knowledge Transformation State)
การทำงานเริ่มจากการเปลี่ยนมวลความคิดให้มีโครงสร้างที่ AI สามารถเข้าใจได้:
*   **Intent, Insight, Idea ➔ Text:** เปลี่ยนความตั้งใจและไอเดียดิบๆ ให้อยู่ในรูปแบบข้อความ
*   **Text ➔ Doc:** นำข้อความมาจัดโครงสร้างให้เป็นเอกสารสเปก (เช่น PRD.md, Requirements)
*   **Doc ➔ Diagram:** แปลงข้อความให้เห็นเป็นภาพ โครงสร้างและความสัมพันธ์ (เช่น Architecture.drawio, ERD.mmd)
*   **Diagram ➔ Code:** เปลี่ยนภาพและสเปกทั้งหมดให้กลายเป็นโค้ดที่รันได้จริง

### 🚀 2.2 Agentic Paradigm: "Specification-to-System"
ในสถาปัตยกรรมระดับ AI Agent การเขียนโปรแกรมไม่ได้เกิดขึ้นทีละไฟล์ แต่เป็นการ **หลอมรวม (Synthesize)** บริบทหลายมิติพร้อมกัน เพื่อสร้างระบบที่เสร็จสมบูรณ์ในครั้งเดียว:

```text
[ Inputs (Specifications & Context) ]
   ├── Doc-to-Code       (เช่น PRD.md, API.yaml)
   ├── Diagram-to-Code   (เช่น Architecture.drawio, ERD.mmd)
   ├── Design-to-Code    (เช่น Figma UI Mockups สำหรับ Frontend)
   ├── Repo-to-Code      (บริบทและโครงสร้างเดิมจาก Codebase ปัจจุบัน)
   └── Feedback-to-Code  (ข้อเสนอแนะและคอมเมนต์จากมนุษย์)
             ↓
        [ AI AGENTS ]  (ประมวลผลแบบขนาน - Specification-to-System)
             ↓
[ Outputs (Executable System) ]
   ├── Frontend          (UI/UX Components, State Management)
   ├── Backend           (Business Logic, API Routes)
   ├── Database          (Migrations, Models)
   ├── Tests             (Unit, Integration, E2E)
   ├── CI/CD             (Pipelines, GitHub Actions)
   ├── Deployment        (IaC, Docker, Server Config)
   └── Documentation     (Generated Docs, README)
```
ด้วยแนวคิดนี้ AI Agent จึงทำหน้าที่เป็นเหมือนโรงงานผลิตซอฟต์แวร์ครบวงจรที่รับ Input ทุกรูปแบบมาสร้างเป็น Executable System ที่พร้อมใช้งาน

### 📈 2.3 The 7-Phase Assembly Workflow (ขั้นตอนการเติบโตของระบบ)
กระบวนการประกอบร่างจากอากาศว่างเปล่าสู่ระบบโปรดักชัน จะทำงานผ่านลำดับขั้นดังนี้:
*   **Phase 1: Inception (ริเริ่มโครงการ):** เปลี่ยนความต้องการทางธุรกิจหรือปัญหา (Intent & Insight) ให้กลายเป็นภาพรวมโปรเจกต์ (Project Charter)
*   **Phase 2: Requirements (รวบรวมสเปก):** สร้าง Text ➔ Doc เพื่อนิยามสเปกและฟีเจอร์ทั้งหมด (PRD, BRD) เพื่อใช้เป็นขอบเขต (L4 ➔ L3)
*   **Phase 3: Design (ออกแบบสถาปัตยกรรม):** สร้าง Doc ➔ Diagram แปลงข้อความเป็นพิมพ์เขียว, สถาปัตยกรรม, ขอบเขตโมดูล และภาพ Mockups (เพื่อใช้เป็น Design-to-Code Input)
*   **Phase 4: Development (หลอมรวมระบบ):** จุดที่เกิด **Specification-to-System** โดย AI Agent นำข้อมูลจาก Phase 1-3 มาประมวลผลคู่ขนานเพื่อสร้าง Executable Code ทะลวงความละเอียดตั้งแต่ L2 ➔ L0
*   **Phase 5: Testing (ตรวจสอบคุณภาพ):** นำระบบที่ได้มาทดสอบแบบย้อนกลับ (Reverse Testing L0 ➔ L4) เพื่อสร้างวงจร Feedback-to-Code กลับไปให้ AI แก้ไขจนสมบูรณ์
*   **Phase 6: Deployment & Ops (ติดตั้งและดำเนินการ):** นำระบบขึ้นสู่โปรดักชัน พร้อมให้ Agent สกัดคู่มือโครงสร้าง (IaC, Runbook) จากโค้ดที่รันจริง
*   **Phase 7: Handover & Closure (ส่งมอบ):** ส่งมอบเอกสารคู่มือ และบันทึกองค์ความรู้ทั้งหมดกลับเข้าสู่ระบบ GKS เพื่อรอวันชำแหละ (Top-down) ในการอัปเกรดครั้งต่อไป

---

## 3. 📂 7-Phase Enterprise Project Documents
เพื่อควบคุมกระบวนการ 7-Phase Bottom-up ให้มีมาตรฐานเทียบเท่าบริษัทระดับ Enterprise (Enterprise-grade Compliance) ระบบ GKS จึงบังคับให้เอกสารทั้งหมดถูกจัดเรียงตาม 7 ระยะของวงจรชีวิตซอฟต์แวร์ (SDLC) ดังนี้:

```text
Enterprise Project Documents
│
├── Phase 1: Inception / Discovery (ริเริ่มโครงการ)
│   ├── Business Case & Feasibility Study
│   ├── Project Charter
│   ├── Stakeholder Matrix & RACI
│   └── Risk Register
│
├── Phase 2: Requirements (รวบรวมความต้องการ)
│   ├── BRD (Business Requirements Document)
│   ├── PRD / SRS (รวม Functional & Non-Functional)
│   └── Requirements Traceability Matrix (RTM)
│
├── Phase 3: Design (ออกแบบสถาปัตยกรรม)
│   ├── SAD / HLD (System Architecture & High-Level Design)
│   ├── LLD (Low-Level Design) — แยกรายโมดูล
│   ├── API & Database Design Document
│   ├── UI/UX Design Document (Wireframes)
│   └── Security & Integration Design Document
│
├── Phase 4: Development (ลงมือพัฒนา)
│   ├── Technical Standards & Coding Guidelines
│   ├── ADR (Architecture Decision Records)
│   ├── CI/CD Pipeline & DevOps Configuration
│   └── Developer Runbook
│
├── Phase 5: Testing (ทดสอบคุณภาพ)
│   ├── Test Strategy & Plan
│   ├── Test Cases / Test Scripts
│   ├── VA/PT & Security Test Report
│   └── UAT Sign-off Document
│
├── Phase 6: Deployment & Operations (ส่งมอบและดูแล)
│   ├── Deployment Plan & Release Notes
│   ├── Infrastructure as Code (IaC)
│   ├── Runbook / Operations Manual
│   └── DR Plan (Disaster Recovery)
│
├── Phase 7: Handover & Closure (ปิดโครงการ)
│   ├── User & Admin Manual
│   ├── Training Material
│   └── Project Closure & Lessons Learned Report
```

---

## 4. 🗺️ Omni-Directional Mapping Matrix (จุดตัด 4 มิติ)
ความลับของระบบ GKS คือการบูรณาการทั้ง 4 แกนเข้าด้วยกัน เพื่อให้เห็นภาพการทำงานของ Agent ที่สมบูรณ์ที่สุด:
1. **แกนเวลา (Time):** 7 Phase Lifecycle
2. **แกนพื้นที่ (Space):** L4-L0 Architectural Hierarchy
3. **แกนประกอบร่าง (Assembly):** กระบวนการแปลงสภาพความรู้สู่ระบบ (Specification-to-System)
4. **แกนชำแหละ (Decomposition):** การทำงานของ 12-Step Top-Down เพื่อทำความเข้าใจระบบ

| Phase (เวลา) | สถาปัตยกรรม (พื้นที่) | Assembly Paradigm (การประกอบร่าง) | 12-Step Top-Down (การชำแหละ) |
| :--- | :--- | :--- | :--- |
| **Phase 1-2** (Inception & Req) | **L4 (`{system}`) ➔ L3 (`{module}`)** | **Intent ➔ Text ➔ Doc**<br/>(สกัดความต้องการเป็น PRD, BRD) | **Stage 1-3**<br/>(Scan Path, Structure Tree, Parse Markdown) |
| **Phase 3** (Design) | **L3 (`{module}`) ➔ L2 (`{feature}`)** | **Doc ➔ Diagram / Design**<br/>(สร้าง HLD, LLD, Flow, ERD, UI Mockups) | **Stage 6-8**<br/>(สกัด Routes API, วิเคราะห์ Tools, ถอด Schema ORM) |
| **Phase 4** (Development) | **L2 (`{feature}`) ➔ L1 (`{component}`) ➔ L0 (`{method}`)** | **Diagram / Design ➔ Code**<br/>(AI รับ Input คู่ขนานเพื่อเขียน Executable System) | **Stage 5, 9-12**<br/>(สกัด AST, Cross-File Import, แกะ MRO, จัดกลุ่ม Leiden, ตามรอย Process Flow) |
| **Phase 5** (Testing) | **L0 ➔ L4** (Reverse Testing) | **Feedback ➔ Code**<br/>(ทดสอบและนำ Test Result กลับไปแก้โค้ด) | *(ทำงานร่วมกับ Stage 12 Process Flow)* |
| **Phase 6-7** (Deploy & Closure) | **`root/` และ L4** | **Code ➔ Documentation**<br/>(สร้างคู่มือ, IaC, Runbook) | **Stage 4**<br/>(Specialized Parse สำหรับ Infrastructure & Legacy) |

> [!TIP]
> หากโปรเจกต์ของคุณไม่ใช่ระดับ Enterprise ที่มีหลายระบบ (Microservices) ซ้อนกัน โฟลเดอร์ `{system}` (L4) อาจไม่มีความจำเป็น คุณสามารถเลื่อน `{module}` ขึ้นมาเป็น L4 (Top-level) และขยับทุกระดับขึ้นมาแทนได้เลย
