# 🧠 Genesis Knowledge Block System (GKS) & MSP Framework
**Architecture & Workflow Specification**

> [!NOTE]
> สถาปัตยกรรมนี้เปรียบเสมือน **"สายพานการผลิตข้อมูล" (Information Assembly Line)** ที่มีหน้าที่แปลง:
> 
> ```text
> Human Concept  ➔  Atomic Knowledge  ➔  Technical Blueprint  ➔  Code
>  (คลุมเครือ)       (โครงสร้างชัด)         (แห้ง/ไร้น้ำ)           (รันได้)
> ```
> เพื่อให้ AI แต่ละระดับและมนุษย์สามารถทำงานร่วมกันได้อย่างมีประสิทธิภาพสูงสุด

---

## 🏗 Sector 1: วิสัยทัศน์สถาปัตยกรรม (Architectural Vision)

สถาปัตยกรรมนี้จัดสรรหน้าที่ให้ AI แต่ละระดับทำงานในจุดที่ตัวเองเก่งที่สุด เพื่อประหยัด Token, ลดอาการ Hallucination, และสามารถทำงานแบบ Parallel ได้:

- **Large LLM** (e.g., Claude Opus 4.7 / Gemini 2.5 Pro / GPT-5): ทำหน้าที่ออกแบบสถาปัตยกรรม, ตัดสินใจเชิงกลยุทธ์, และ Review Architecture
- **Medium LLM** (e.g., Claude Sonnet 4.6 / Haiku 4.5 / Gemini Flash): ทำหน้าที่เป็น Composer, Validator, แปลงเอกสาร และจัดการ Generic Tasks
- **Small Local SLM** (e.g., Qwen 7-14B / Llama 3.x 7-13B / Phi-3): ทำหน้าที่เขียนโค้ดในระดับ Micro-Task ที่มี Scope แคบและ Deterministic

> [!IMPORTANT]
> **หลักการแกนกลาง:** *Context Isolation ➔ High Precision + Low Cost*

### 1.1 โปรโตคอลการส่งมอบงาน (Handoff Protocol & State Management)
เพื่อป้องกันบริบทตกหล่น (Context Loss) ระหว่างการทำงานข้ามระดับ (Large ➔ Medium ➔ Small LLMs) ระบบใช้กลไก **Contract ID State Management** 
ทุกครั้งที่มีการ Handoff งาน ตัว Orchestrator จะอ้างอิง `Contract ID` เดียวกัน เพื่อให้ LLM ระดับรองสามารถดึง State ปัจจุบันจาก Memory และทำงานต่อยอดได้ทันทีโดยไม่หลุด Scope

---

## 🏛 Sector 2: 5 เสาหลักของระบบ (The Five Pillars)

ระบบแยก Concern เป็น 5 เลเยอร์อย่างชัดเจน เพื่อความปลอดภัยและความสามารถในการ Scale เมื่อมีหลาย Agent ทำงานร่วมกัน:

### 2.1 Agent Layer (คนทำงาน)
Agent แต่ละตัวจะมี Identity และ Scratchpad ของตัวเอง
- **Worker Isolation:** แบ่งโฟลเดอร์ทำงานคนละที่ใน Home Folder (เช่น `$HOME/.claude/`, `$HOME/.gemini/`) เพื่อ Cross-Platform Compatibility
- **Short-term Memory:** มี Scratchpad ส่วนตัวสำหรับใช้ใน Session ปัจจุบันเท่านั้น

### 2.2 Manager — MSP (`$WORKSPACE_ROOT/.brain/msp/`)
ทำหน้าที่เป็น **Gatekeeper** ของความรู้ระยะยาว ทุกอย่างที่จะบันทึกเข้า GKS ต้องผ่านการตรวจสอบจาก MSP ก่อน
- **Validation:** ตรวจสอบ Schema, Forbidden Fields, และ Link Integrity
- **Candidates Flow:** Agent ไม่สามารถเขียนไฟล์เข้า `gks/` โดยตรงได้ ต้องเสนอผ่าน `msp_candidate` (MCP Tool) ไปไว้ที่โฟลเดอร์ `candidates/`
- **Contract File:** อ้างอิงจาก `$WORKSPACE_ROOT/.brain/msp/LLM_Contract/atomic_contract.yaml`

### 2.3 Internal Layering — Smart Proxy (Hexagonal) Pattern
MSP ออกแบบสถาปัตยกรรมภายในแบบ Hexagonal Pattern (ดู `ADR--MSP-INTERFACE-LAYER`) เพื่อแยกส่วน Transport ออกจาก Business Logic

```text
packages/msp/src/
├── interfaces/    ← inbound adapters (ports): mcp/, slack/, discord/, rest/, cli/
│                    หน้าที่: auth, idempotency, namespace resolution, trace ID, dedup
├── orchestrator/  ← application core (domain): router, correlation, loop
│                    หน้าที่: business logic — ไม่รู้จัก transport (ห้าม import จาก interfaces/)
├── clients/       ← outbound adapters (anti-corruption): gks-client, llm-client
│                    หน้าที่: DTO mapping — แปลง type ของ external system ➔ domain type
└── domain/        ← types + invariants: Namespace, Session, Candidate
```

### 2.4 Storage — GKS (`gks/`)
คลังความรู้ระยะยาว **(Single Source of Truth - SSOT)**
- จัดเก็บเอกสารแบบ Atomic Markdown พร้อม `atomic_index.jsonl` สำหรับการค้นหา
- **Genesis Block Engine:** เป็น Backend แบบ Graph (Rust-based) ประสิทธิภาพสูง รองรับ OpenCypher query และ Bi-temporal time-travel
- **Vector Layer:** ใช้โมเดล `nomic-embed-text-v1.5` เป็น Canonical Model สำหรับ Semantic Search

### 2.5 Viewer — Obsidian (`.obsidian/` - Optional)
หน้าต่างส่วนต่อประสาน (GUI) สำหรับมนุษย์
- ระบบทำงานได้แม้ไม่มี Obsidian (Headless/CI)
- Agent เข้าถึงข้อมูลผ่าน MCP Tools (`gks_recall`, `gks_lookup`, `gks_backlinks`) เป็นหลัก ไม่ใช่ผ่าน Obsidian

### 2.6 Workflow Layers (2 มุมมอง)
ระบบบังคับใช้ Taxonomy ที่เป็นมาตรฐานเดียว (Unified Phase Taxonomy) P1-P7:
- **Conceptual (5 Stages):** Discover ➔ Define ➔ Design ➔ Deliver ➔ Verify
- **Atomic (P1-P7 Phases):** สอดคล้องกับ Enterprise Project Documents เพื่อลดความสับสนในการทำงาน

---

## 📂 Sector 3: โครงสร้างโฟลเดอร์มาตรฐาน (Canonical Layout)

นี่คือแผนผังเชิงกายภาพที่สะท้อนให้เห็นการจัดเก็บข้อมูลและการแยก Boundary อย่างชัดเจน โดยใช้ตัวแปรสภาพแวดล้อม (Environment Variables) เช่น `$HOME/` และ `$WORKSPACE_ROOT/` แทน Hardcoded OS Path:

```text
💾 $HOME/ (System & Global Config)
├── 📁 .brain/                                    # 🟢 GLOBAL CONFIG (สมองส่วนกลางประจำตัวคุณ)
│   ├── 📁 gks/                                   # genesisblockDB & genesisgraph  
│   │   ├── gks.db                                # Sqlite DB
│   │   ├── gks.graph                             # Graph DB
│   │   ├── gks.hnsw                              # HNSW
│   │   ├── gks.jsonl                             # JSONL
│   │   └── gks.md                                # MD
│   ├── 📁 {agent-name}-knowledge-block/          # genesisblockDB & genesisgraph  
│   │   ├── .obsidian/                            # Obsidian Vault
│   │   └── 00_index/MOC.md                       # L0 search index (atomic_index.jsonl)   
│   ├── 📁 msp/                                   # Memory processing engine
│   │   ├── 📁 plugins/
│   │   ├── 📁 memory/
│   │   ├── 📁 session/                           # Sqlite DB
│   │   ├── 📁 skills/                            # Graph DB
│   │   ├── 📁 projects/                          # project-specific session data & memory
│   │   ├── └── 📁 D--zuri/                       # Project folders encoded         
│   │   ├──     └── 📁 candidates/                # candidate atoms รอ human PR review
│   │   ├── 📄 .credentials.json                  # HNSW
│   │   ├── 📄 mcp_config.md
│   │   └── 📄 config.json 
│   └── 📄 AGENT.md                               # user-profile,global-prompts บอก AI ว่าคุณคือใคร

───────────────────────────────────────────────────────────────────────────────────────────          

💾 $WORKSPACE_ROOT/ (Development & Workspaces)
│
├── 📁 work-space-1-zuri/                   # 🚀 MONOREPO: ZURI PLATFORM
│   ├── 📁 .brain/                          # 🧠 สมองเฉพาะโปรเจกต์ Zuri (ล็อกสแต็ก เช่น Supabase)
│   │   ├── 📁 msp/                      
│   │   ├── 📁 gks/                         # genesisblockDB & genesisgraph  
│   │   │   ├── gks.db                      # Sqlite DB
│   │   │   ├── gks.graph                   # Graph DB
│   │   │   ├── gks.hnsw                    # HNSW
│   │   │   ├── gks.jsonl                   # JSONL
│   │   │   └── gks.md                      # MD
│   │   ├── 📄 system_config.yaml           # master config (ROLES ONLY — no business config)   
│   │   ├── 📄 AGENT.md 
│   │   ├── 📄 .env
│   │   ├── 📄 mcp_config.md  
│   │   ├── {projectname}-knowledge-block/  # 🧠 The Shared vault/Brain
│   │   │   ├── 00_index/                   # L0 search index (atomic_index.jsonl)
│   │   │   │   ├── MOC.md
│   │   │   │   ├── agent-protocol.md
│   │   │   │   ├── atomic_index.jsonl      # ← agents scan THIS first
│   │   │   │   └── atomic_validation_report.json
│   │   │   ├── 00_MASTER_DASHBOARD.md      # command center
│   │   │   ├── 📁 ideas/                   # ⚪ (IDEA--)
│   │   │   ├── 📁 concepts/                # 🟢 (CONCEPT--)  
│   │   │   ├── 📁 .../                       # เอกสารสเปกหลัก, API Specifications, ไดอะแกรม
│   ├── 📁 platforms/
│   │   └── 📁 zuri-enterprise/
│   │       ├── 📁 apps/ 
│   │       ├── 📁 docs/                    # Systems ย่อย (zuri-ui, crm-api, line-webhook)
│   │       └── 📁 packages/                # โมดูลฐานข้อมูลและไลบรารีแชร์ภายใน Zuri
│   └── 📄 package.json
```

### 3.1 Index Scaling Strategy (การบริหารจัดการดัชนี)
ไฟล์ด่านหน้า `atomic_index.jsonl` ออกแบบมาให้มีขนาดเล็ก (~22 KB) แต่เมื่อใช้งานระดับ Enterprise Scale ไฟล์อาจบวมได้
- **Rule:** หากขนาดไฟล์เกิน 5MB ระบบจะเปลี่ยนไปใช้เทคนิค **Sharding by Atom Type** (แยกไฟล์ตามโฟลเดอร์) หรือสับเปลี่ยนไปใช้ **SQLite DB** ขนาดเล็กแทน เพื่อรักษามาตรฐาน Cost Efficiency เมื่อ Agent ต้องสแกน

### 3.2 Hierarchical Context Resolution Loop
เมื่อรัน AI Agent จะเกิดการโหลด Context ตามลำดับชั้นดังนี้:
1. อ่านข้อมูลโกลบอล ➔ `$HOME/.brain/AGENT.md`
2. อ่านข้อมูลพื้นที่ปฏิบัติการ ➔ `$WORKSPACE_ROOT/.brain/system_config.yaml`
3. ตรวจสอบดัชนีด่านหน้า ➔ `.../00_index/atomic_index.jsonl`
4. ประมวลผลบนหน่วยความจำ ➔ สแกน Hector Chain (H1-H5) -> ลงมือเขียนโค้ดลงใน apps/

---

## 📝 Sector 4: วงจรชีวิตข้อมูลและสัญญาข้อมูล (Data Lifecycle & Contracts)

### 4.1 Enterprise Project Documents (Phase Governance P1-P7)
เอกสารขององค์กรจะถูกจำแนกเป็น 7 ระยะเพื่อสอดคล้องกับการจัดการแบบ Enterprise (Unified Taxonomy):

```text
Enterprise Project Documents
│
├── Phase 1: Inception / Discovery
│   ├── Business Case & Feasibility Study
│   ├── Project Charter
│   ├── Stakeholder Matrix & RACI
│   └── Risk Register
│
├── Phase 2: Requirements
│   ├── BRD (Business Requirements Document)
│   ├── PRD / SRS (รวม Functional & Non-Functional ไว้ที่นี่)
│   └── Requirements Traceability Matrix (RTM)
│
├── Phase 3: Design
│   ├── SAD / HLD (System Architecture & High-Level Design)
│   ├── LLD (Low-Level Design) — แยกรายโมดูล
│   ├── API & Database Design Document
│   ├── UI/UX Design Document (Wireframes / Design System Links)
│   └── Security & Integration Design Document
│
├── Phase 4: Development
│   ├── Technical Standards & Coding Guidelines
│   ├── ADR (Architecture Decision Records)
│   ├── CI/CD Pipeline & DevOps Configuration
│   └── Developer Runbook
│
├── Phase 5: Testing
│   ├── Test Strategy & Plan
│   ├── Test Cases / Test Scripts
│   ├── VA/PT & Security Test Report
│   └── UAT Sign-off Document
│
├── Phase 6: Deployment & Operations
│   ├── Deployment Plan & Release Notes
│   ├── Infrastructure as Code (IaC) / Infra Document
│   ├── Runbook / Operations Manual / SLA Support Model
│   └── DR Plan (Disaster Recovery)
│
├── Phase 7: Handover & Closure
│   ├── User & Admin Manual
│   ├── Training Material (Slides / Video Links)
│   └── Project Closure & Lessons Learned Report
```

### 4.2 Candidates Flow (PR-Based Workflow)
เพื่อลดคอขวดจากการที่มนุษย์ต้อง Review ทุก PR ระบบได้เพิ่มกลไก Auto-Merge (Fast-track) สำหรับความเสี่ยงต่ำ:
1. Agent ร่างเอกสารใน Memory
2. ส่งผ่าน `msp_candidate` (MCP Tool) ลงโฟลเดอร์ `candidates/`
3. **MSP Validator** ตรวจสอบ Schema, ID Uniqueness, และ Wikilink Resolution
4. หากผ่าน จะสร้าง Git Branch + Commit
5. **Auto-Merge (Fast-track):** หากเป็นการเปลี่ยนแปลงที่มีความเสี่ยงต่ำ (Low-risk) เช่น แก้คำผิด (Typo), เพิ่ม Crosslink, หรือได้คะแนน Confidence สูงมากจาก Validator ระบบจะทำการ Merge อัตโนมัติ โดยไม่ต้องรอมนุษย์ 100%
6. งานระดับกลางถึงสูง มนุษย์ทำการตรวจสอบ (Human PR Review) ก่อน Merge เข้าสู่ `gks/<type>/`

### 4.3 Frontmatter Contract & Registry
ทุก Atom ต้องมี YAML Frontmatter ที่อ้างอิงและตรวจสอบกับ `atom_registry.yaml`:

```yaml
# msp/LLM_Contract/atomic_contract.yaml
required_fields:
  - id          # เช่น CONCEPT--EXAMPLE-FEATURE (TYPE--SLUG format)
  - phase       # 1 - 7
  - type        # ตรงกับ folder + ต้องมีใน atom_registry.yaml clusters
  - status      # draft | active | stable | deprecated | superseded
  - tier        # process | master | safety | genesis
  - cluster     # implementation_flow / agent_governance / requirements / ops / memory
  - role        # short descriptive role

naming_conventions:
  obsidian_runbook:
    description: Naming convention for all RUNBOOK atoms that document Obsidian plugin setup.
    pattern: "^RUNBOOK--OBSIDIAN-(?:COM_PG|CORE_PG)-[A-Z][A-Z0-9_]*-SETUP$"
```

### 4.4 Anti-Hallucination & Epistemic Rules
- **Wikilinks Must Resolve:** ลิงก์ทั้งหมดต้องมีอยู่จริงใน Index
- **Registry Drift Check:** ต้องตรงกับ `atom_registry.yaml` เสมอ
- **Epistemic Fields:** ต้องระบุความมั่นใจ (Confidence 0.0 - 1.0) และที่มาของแหล่งข้อมูล (Source Type)

---

## ⚙️ Sector 5: กราฟสัญลักษณ์และการประมวลผล (12-Stage DAG)

เพื่อให้ Codebase กลายเป็น **Architectural Knowledge Graph** ระบบประมวลผลผ่าน DAG 12 ระยะ 
*(อัปเดต: ระบบออกแบบให้ทำการ **Incremental DAG Updates** เฉพาะ Node/Edge ที่เกิดการเปลี่ยนแปลง เพื่อประหยัดพลังงานประมวลผล)*

1. **Scan:** สำรวจเส้นทางไฟล์และโครงสร้าง
2. **Structure:** สร้างลำดับชั้น (Hierarchy Tree)
3. **Specialized Parse (Markdown):** สกัด Atom
4. **Specialized Parse (COBOL):** รองรับ Legacy Code
5. **Symbolic Parse:** สกัด AST (Functions, Classes)
6. **Framework - Routes:** วิเคราะห์ API Entry Points
7. **Framework - Tools:** สกัดคำนิยาม MCP Tools
8. **Framework - ORM:** วิเคราะห์ Database Schema

*(ระยะที่ 9 - 12 เป็นการประมวลผลขั้นสูงแบบ **Asynchronous Background Jobs** แทนการรอแบบ Synchronous)*
9. **Cross-File Resolution:** ลิงก์ Import/Export
10. **MRO (Method Resolution Order):** ลำดับชั้นการสืบทอด
11. **Communities:** จัดกลุ่ม Functional Cohesion ด้วย Leiden Algorithm
12. **Processes:** ติดตาม Execution Flows

ผลลัพธ์ทั้งหมดถูกจัดเก็บลง **GenesisGraphBackend** และเข้าถึงผ่าน MCP Tools (เช่น `symbol_trace`).

---

## 🔍 Sector 6: เครือข่ายความรู้และการสืบค้น (Hybrid Retrieval & Traceability)

### 6.1 Hybrid Retrieval System (4-Layer Pipeline)
ระบบมีกลไก **Query Routing / Intent Classification** ที่ระดับ Orchestrator ซึ่ง LLM จะประเมินก่อนว่าคำถามนี้ควรค้นหาที่ชั้นไหน (เช่น การหา ID ตรงๆ จะวิ่งเข้าเฉพาะ Layer 1 เพื่อหลีกเลี่ยง Latency ของ Vector DB)

| ชั้น | เทคนิค | MCP Tool | ความเหมาะสม |
| --- | --- | --- | --- |
| 1. Atomic | O(1) Exact ID Match | `gks_lookup` | ค้นหาด้วย ID โดยตรง (Low Cost) |
| 2. FTS | Full-Text Search (Ripgrep) | Grep tools | ค้นหาด้วย Keyword (Low Cost) |
| 3. Vector | Semantic Search | `gks_recall` | ค้นหาตามความหมายและบริบท |
| 4. Graph | Relationship Traversal | `gks_backlinks`| ค้นหาความสัมพันธ์และการอ้างอิง |

> ผลลัพธ์จะถูกนำมา Re-rank ด้วย **RRF (Reciprocal Rank Fusion)** และปรับคะแนน (Boost/Filter) ตามสถานะของเอกสาร (เช่น `stable` ได้แต้มต่อ, `deprecated` ถูกคัดออก)

### 6.2 Traceability & Backlink Rules
- ทุก Atom ใน `gks/` ต้องระบุ `crosslinks` ให้ครบถ้วน (`implements`, `used_by`, `references`, ฯลฯ)
- ป้องกันปัญหา **Orphaned Data** โดยบังคับให้ระบุ `sessionId` หรือ Anchor Point กลับไปยัง Episodic Memory หรือ Git Commit Hash

---

## 🧠 Sector 7: ความจำและอัตลักษณ์ (Memory, Identity & MLL)

### 7.1 Rich Episodic Memory (JSON)
เก็บประวัติและเหตุการณ์สำคัญ (Episode) ระหว่างการทำงาน เพื่อใช้ในการตรวจสอบเชิงลึก (Audit)
- **Context Eviction Strategy:** เมื่อ Episodic Memory มีขนาดใหญ่สะสมแตะโควต้า (Token Limits) ระบบจะใช้กลไก **Sliding Window Memory** หรือกะเทาะเหตุการณ์แบบ **Event Summarization** อัตโนมัติ เพื่อรักษาประวัติการทำงานโดยไม่ให้บริบทพองตัวเกินจำเป็น
- **Path:** `$WORKSPACE_ROOT/.brain/msp/projects/<path-encoded>/memory/episodic_memory.json`

### 7.2 Identity & Audit Log IDs
- **User:** `MSP-USR-[NAME]` (เช่น `MSP-USR-BOSS`)
- **Agent:** `MSP-AGT-[CODENAME]-[PLATFORM]` (เช่น `MSP-AGT-ATLAS-CLI`)
- **Audit Log:** `AUDIT-YYYYMMDD-SERIAL`

### 7.3 Meta Learning Loop (MLL) — The Self-Improving Brain
ระบบที่เปลี่ยน "ประสบการณ์การทำงาน" ให้เป็น "ความรู้ถาวร":
- **Skill Creator (Hermes-style):** สกัด Workflow ที่ทำสำเร็จออกเป็น `SKILL--` อัตโนมัติ โดยสร้าง Atom รอในโฟลเดอร์ `candidates/`
- **4D Evolution:** ตรวจสอบความครบถ้วนของข้อมูลสำคัญ (Master Tier) ว่ามีครบทั้ง Algo, Concept, Frame, และ Proto หรือไม่
- **Tension Detection:** ตรวจหาความขัดแย้งระหว่าง "สิ่งที่ระบบเชื่อ" (Atoms) กับ "ความเป็นจริงในโค้ด" เพื่อสร้างแจ้งเตือน

---

## 📜 Sector 8: หลักการสำคัญ 8 ประการ (Core Principles)

กฎระเบียบที่ Agent ต้องปฏิบัติตามอย่างเคร่งครัด (Non-Negotiable):

1. **Context Isolation ➔ Precision + Cost efficiency:** ยิ่งจำกัดขอบเขตที่ Agent เห็น ยิ่งทำงานได้แม่นยำและถูกลง
2. **1 Concern ➔ 1 Task:** หากต้องใช้คำเชื่อม "and / also" ให้แตกเป็น 2 Task แยกกัน
3. **SSOT หรือไม่มีเลย:** ข้อมูลซ้ำซ้อนคือข้อมูลผิด ต้องอ้างอิงจากแหล่งเดียวเสมอ (เช่น `atom_registry.yaml`)
4. **Doc to Code:** ห้ามลงมือเขียนโค้ดก่อนมีเอกสาร (ยกเว้นงานระดับ HOTFIX เล็กๆ) 
   *(ข้อยกเว้น: การทำงานแบบ Exploratory ของ Agent เช่น การสร้าง MLL Workflow สามารถทำในพื้นที่ **Sandbox** ได้ชั่วคราว จากนั้นเมื่อมั่นใจจึง Generate เป็น Candidate Document เข้าระบบ)*
5. **Diagram-to-Code:**
6. **Right Agent for the Right Tier:** เลือกใช้ขนาดของ AI ให้เหมาะสมกับความซับซ้อนของงาน
7. **Write ➔ Queue ➔ Validate ➔ Merge:** ห้ามเขียนทับข้อมูลจริงโดยตรง ต้องผ่านกระบวนการตรวจและ PR เสมอ
8. **Generated code is disposable, task YAML is source:** หากต้องแก้ไขสเปก ให้แก้ที่ YAML หรือเอกสารต้นทางเสมอ ห้ามแก้เฉพาะผลลัพธ์สุดท้ายที่ Generate ออกมา
9. **Root Cause Analysis:**  Do not FIX Before find a Root Cause ห้ามแก้บั๊กแบบขอไปที (Reactive Patch) ต้องวิเคราะห์และหา Root Cause ให้เจอก่อนเสนอวิธีแก้เสมอ
