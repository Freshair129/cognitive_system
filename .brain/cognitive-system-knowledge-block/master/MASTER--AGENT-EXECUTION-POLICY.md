---
id: MASTER--AGENT-EXECUTION-POLICY
phase: 0
type: master
status: stable
vault_id: default
tier: master
promoted_from: GENESIS--COGNITIVE-ENGINE
promoted_at: 2026-06-02T20:13:00.000+07:00
promotion_adr: ADR--TAXONOMY-CAPABILITY-SYMMETRY
source_type: axiomatic
title: "Agent Execution Policy: The Prime Directive"
summary: กฎหมายแม่บทระดับสูงสุด (Root Policy) ที่บังคับให้ Agent ต้องประเมินและตั้งค่า Context Boundary (H0-H5) ก่อนการลงมือปรับปรุงโค้ดใดๆ
tags:
  - policy
  - master-rule
  - prime-directive
created_at: 2026-06-02T20:13:00.000+07:00
cluster: governance
role: Root level policy
crosslinks:
  references:
    - "[[RUNBOOK--CONTEXT-RESOLUTION-LOOP]]"
  parent_blueprint:
    - "[[GENESIS--COGNITIVE-ENGINE]]"
---

# ⚖️ MASTER--AGENT-EXECUTION-POLICY

**Agent Execution Policy (The Prime Directive)**
นี่คือกฎระเบียบระดับสูงสุด (Master Tier) สำหรับ AI Agents ทุกตัวที่ปฏิบัติงานภายใต้ GKS (Genesis Knowledge System) 
กฎข้อนี้มีสถานะเป็น Absolute Rule ที่ห้ามละเมิดเด็ดขาด

## **1. The Core Mandate (คำสั่งแกนกลาง)**
**"NO BLIND EXECUTION. CONTEXT MUST BE ISOLATED."**
(ห้ามลงมือทำแบบมืดบอด ต้องจำกัดวงบริบทก่อนเสมอ)

*   Agent **ห้าม** พิมพ์โค้ด หรือพยายามแก้ไขไฟล์โดยอาศัยเพียง "การเดา" จากความจำเดิมของตัวเอง
*   Agent **ต้อง** รันกระบวนการใน `[[RUNBOOK--CONTEXT-RESOLUTION-LOOP]]` ก่อนเสมอ เพื่อล็อกระยะ Hop Level (H0-H5)
*   การวิเคราะห์ปัญหาจะต้องอ้างอิงจากหลักฐานทางไฟล์ (Documentation/Context) ในพื้นที่จำกัดรัศมีเท่านั้น

## **2. Escalation & Violation (บทลงโทษและการยกระดับ)**
*   หาก Agent พยายามจะเขียนโค้ดลัดขั้นตอน (Skip SOP):
    *   **Enforcement:** ระบบจะแจ้งเตือน (Halt) และบังคับให้ Agent ชี้แจง `[ROOT CAUSE]` ตามปรัชญาของระบบ
*   หาก Agent พบว่าต้องการข้อมูลเกิน 5 Hops (`H5` Limit):
    *   **Enforcement:** ถือว่ากำลังเผชิญหน้ากับ "Spaghetti Code" ระบบไม่อนุญาตให้เขียนโค้ดเพิ่มแบบ Tight-coupling ให้ Agent หยุดทำงานและเสนอทางเลือก `Refactoring` หรือสร้าง `Sub-agent` ให้กับมนุษย์แทน

## **3. Compliance Checklist**
ก่อน Agent จะเรียกใช้ Tool `write_to_file` หรือ `multi_replace_file_content`:
- [ ] ประเมิน Phase ของงานแล้วหรือยัง?
- [ ] กำหนด Hop Level (H0-H5) ตาม `FRAMEWORK--HIERARCHY-COMPACTION` แล้วหรือยัง?
- [ ] อ่านไฟล์ Context ที่เกี่ยวข้องครบถ้วนแล้วหรือยัง?
