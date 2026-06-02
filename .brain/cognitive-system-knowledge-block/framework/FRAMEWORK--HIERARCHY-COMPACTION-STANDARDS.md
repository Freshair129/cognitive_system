---
id: FRAMEWORK--HIERARCHY-COMPACTION-STANDARDS
phase: 0
type: framework
status: stable
vault_id: default
tier: master
promoted_from: GENESIS--COGNITIVE-ENGINE
promoted_at: 2026-06-02T20:13:00.000+07:00
promotion_adr: ADR--TAXONOMY-CAPABILITY-SYMMETRY
source_type: axiomatic
title: Hierarchy Compaction & Context Scaling Standards
summary: มาตรฐานการบีบอัดไฟล์กายภาพ (Chain-Driven Atom Compaction) และการกำหนดขอบเขตบริบทของ AI Agent (Local Graph Hop Scaling H0-H5)
tags:
  - architecture
  - compaction
  - scaling
  - graph
created_at: "2026-06-02T19:40:00+07:00"
created_by: "system"
last_updated: "2026-06-02T19:40:00+07:00"
delivered_from: "agent"
version: 1.0.0
enforcement_state: active
aliases:
  - FRAMEWORK--, HIERARCHY-COMPACTION-STANDARDS
cluster: implementation_flow
role: Governance / architectural framework
---

# 🌐 FRAMEWORK--HIERARCHY-COMPACTION-STANDARDS

**Hierarchy: Chain-Driven Atom Compaction Model & Local Graph Scaling**
เอกสารมาตรฐานการจัดลำดับขอบเขตไฟล์ระดับกายภาพ (On-Disk) และระดับตรรกะ (In-Memory Graph)
ออกแบบมาเพื่อจำกัดขอบเขต Context และแก้ไขปัญหา Disk I/O Bottleneck ในโปรเจกต์ Enterprise Scale

---

## **1. บทนำ (Introduction & Rationale)**
ในการทำระบบ **Doc-Driven Development (DDD)** และ **Diagram-to-Code** ระดับ Enterprise ที่มีขนาดความต้องการสูง ปัญหาคลาสสิกที่พบคือ **Inode Exhaustion, File I/O Bottleneck, และ Git Graph Fragmentation** ที่เกิดจากการมีไฟล์ขนาดเล็ก (1-2 KB) กระจัดกระจายเป็นหมื่นๆ ไฟล์บนฮาร์ดดิสก์

**Chain-Driven Atom Compaction Model** แก้ปัญหานี้โดยใช้หลักการ **"Compound Document"** หรือการยุบรวม Node ที่อยู่ในสายสัมพันธ์การทำงานเดียวกัน (Execution Chain) ให้บันทึกอยู่บน **1 ไฟล์กายภาพเดี่ยว (1 Physical File)** แต่เมื่อเข้าสู่ขั้นตอนการประมวลผลระบบกราฟ (GKS Parser Engine) จะแยกสับออกมาเป็น Node ย่อยๆ ในเมมโมรีตามระดับความลึกที่เลือกใช้งาน

---

## **2. มาตรฐานระดับความลึกการบีบอัดไฟล์ (Compaction Heights: H5 - H1)**
การเลือกใช้งานความสูง (Height) จะเป็นตัวกำหนดว่าใน 1 ไฟล์จะมีการซ้อนทับกันกี่ระดับชั้น โดยแบ่งออกตามความซับซ้อนของแต่ละ System ดังนี้:

### **📊 สรุปความสัมพันธ์ (Hierarchy Resolution Map)**
* **H5 (3 Layers)**  ➔ `[L2-System] ➔ [L1-Module] ➔ [L0-Function]`
* **H4 (4 Layers)**  ➔ `[L3-System] ➔ [L2-Module] ➔ [L1-Feat] ➔ [L0-Function]`
* **H3 (5 Layers)**  ➔ `[L4-System] ➔ [L3-Module] ➔ [L2-Feat] ➔ [L1-Component] ➔ [L0-Method]`
* **H2 (6 Layers)**  ➔ `[L5-System] ➔ [L4-Module] ➔ [L3-Sub-Module] ➔ [L2-Feat] ➔ [L1-Component] ➔ [L0-Method]`
* **H1 (8 Layers)**  ➔ `[L7-System] ➔ [L6-Sub-System] ➔ [L5-Module] ➔ [L4-Sub-Module] ➔ [L3-Feat] ➔ [L2-Component] ➔ [L1-Class] ➔ [L0-Method]`

---

## **3. 🪐 Context Scaling Tiers (Graph Database & Small World Phenomenon)**
นอกจากการบีบอัดไฟล์แล้ว การควบคุม **"ความสนใจของ Agent (Context Window)"** เป็นสิ่งสำคัญที่สุด ระบบ GKS ได้ดึงเอาทฤษฎี **"หกช่วงคน (Six Degrees of Separation)"** หรือปรากฏการณ์ **"Small World Phenomenon"** ซึ่งเป็นหัวใจหลักของโครงสร้างข่ายงานและ Graph Database มาประยุกต์ใช้ 

ตามทฤษฎีนี้ระบุว่า *'Node ทุกตัวในเครือข่ายสามารถเชื่อมต่อถึงกันได้ภายใน 6 ก้าว'* ดังนั้นเราจึงสร้าง **"Scaling Tier"** เพื่อจำกัดวง (Local Graph Mode) ของ Agent ไว้สูงสุดที่ **5 Hops (รวมตัวมันเอง = 6 Nodes)** ซึ่งพิสูจน์ได้ทางคณิตศาสตร์แล้วว่าเพียงพอต่อการเข้าถึง Context ทั้งโปรเจกต์โดยไม่ต้องโหลดไฟล์ทั้งหมด:

*   **H0 - Quick Task / Zero Hop (Trivial Level)** 
    *   **ลักษณะงาน:** งานเล็กน้อย, จุกจิก, Hotfix, แก้ Typo หรือปรับ Logic ภายในฟังก์ชันเดียว
    *   **บริบทที่ใช้:** `0 Hop` (มองเห็นแค่ Node ตนเอง) โฟกัสเฉพาะไฟล์ที่ถูกระบุชื่อตรงๆ เท่านั้น
    *   **Workflow:** สามารถจบงานได้โดยไม่ต้องวางแผน (No Plan Required)
*   **H1 - Component Assembly (1 Hop)** 
    *   **ลักษณะงาน:** สร้างหรือแก้ไข Component และเชื่อมต่อกับไฟล์ที่เกี่ยวข้องโดยตรง
    *   **บริบทที่ใช้:** `1 Hop` (Node ตัวเอง + Imports/Exports รอบข้าง 1 ชั้น)
*   **H2 - Feature Assembly (2 Hops)** 
    *   **ลักษณะงาน:** สร้างหรือปรับปรุงฟีเจอร์ย่อยระดับ `[L2-Feat]` (เช่น ตะกร้าสินค้า, หน้า Profile)
    *   **บริบทที่ใช้:** `2 Hops` ครอบคลุมโฟลเดอร์ฟีเจอร์ทั้งหมด รวมถึง API และ Types ที่เกี่ยวข้อง
*   **H3 - Module Integration (3 Hops)** 
    *   **ลักษณะงาน:** งานเชื่อมต่อระดับโมดูล `[L3-Module]` (เช่น เอา Payment Module ไปผูกกับ Order Module)
    *   **บริบทที่ใช้:** `3 Hops` ดึง Cross-File Resolution กว้างขึ้น เพื่อวิเคราะห์ผลกระทบระดับโมดูลข้างเคียง
*   **H4 - System Architecture (4 Hops)** 
    *   **ลักษณะงาน:** การปรับโครงสร้างใหญ่ระดับ `[L4-System]` (เช่น เปลี่ยน Database ORM)
    *   **บริบทที่ใช้:** `4 Hops` ดึงภาพรวมของ System ลงมาจนถึง Component `[L1]` เพื่อตรวจสอบผลกระทบวงกว้าง
*   **H5 - Enterprise / Cross-System (5 Hops)** 
    *   **ลักษณะงาน:** วางแผนสถาปัตยกรรมระดับรากฐาน หรือรื้อโครงสร้างข้ามระบบ (Cross-System Refactoring)
    *   **บริบทที่ใช้:** `5 Hops` สแกนภาพรวมของ GKS ทั้งหมด (เทียบเท่ากระบวนการ 12-Step Top-Down เต็มรูปแบบ)

> [!TIP]
> กฎ 6 Nodes (H0 ถึง H5) คือมาตรฐานที่อ้างอิงจาก **Small World Phenomenon**: หากงานใดในระบบของคุณต้องวิเคราะห์ลึกเกิน 5 Hops เพื่อที่จะเข้าใจความสัมพันธ์ แสดงว่าสถาปัตยกรรมของคุณไม่ได้เป็นแบบ Small World Network แต่เป็น Spaghetti Code ที่มีการผูกขาด (Coupling) ผิดปกติ และจำเป็นต้อง Refactoring ทันที

---

## **4. กฎสถาปัตยกรรมและการแปลงข้อมูล (Parser Engine Protocol)**
เพื่อให้ระบบกราฟ (Genesis Block Graph Backend) และดัชนี L0 (`atomic_index.jsonl`) ทำงานได้อย่างราบรื่น ตัวแปลงสัญญาณ (GKS Parser) จะทำงานดังนี้:

1.  **State Partitioning:** ระบบจะสแกนหาตัวแบ่งพาร์ติชันคือกิ่งหัวข้อ Markdown `^#\s.+\s\[L\d-.+\]\s([A-Z0-9_--]+)` เพื่อขึ้นรูปอะตอมย่อยแบบ Virtual อัตโนมัติ
2.  **Deterministic Backlink Injection:** ตัวแปรสิทธิ์การทำงาน (YAML/JSON Block) ในแต่ละระดับชั้น จะได้รับการฉีดพ่นค่าความสัมพันธ์ `crosslinks` วิ่งขนานย้อนคืนสายโซ่ขึ้นไปทีละลำดับชั้นโดยผู้ดูแลระบบคอมไพล์ เพื่อป้องกันการเกิดปัญหาหักวงจรแบบลูป (Acyclic Invariant Enforcement)
3.  **Block Overwrite Mechanism:** เมื่อ AI สั่งอัปเดตระบบในระดับ `L0` หรือ `L1` ระบบจำเพาะเจาะจงล็อกเป้าหมายเฉพาะช่วงของส่วนหัวข้อที่แก้ไขและทำการเขียนเนื้อหาเปลี่ยนถ่ายสอดไส้ข้อมูลกลับเข้าไปในตำแหน่งไฟล์กายภาพเดิมอย่างแม่นยำ โดยรักษาข้อมูลของระดับอื่นไว้ครบถ้วน 100%
