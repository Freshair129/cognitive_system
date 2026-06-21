---
id: SKILL--DIAGRAM-TO-CODE
phase: 2
type: skill
status: stable
vault_id: default
tier: process
source_type: learned
title: "Diagram-to-Code Skill"
summary: ทักษะความสามารถของ Agent ในการอ่านวิเคราะห์ Diagram (เช่น Mermaid) และแปลงโครงสร้างความสัมพันธ์ (Node/Edge) ให้เป็นสถาปัตยกรรมโค้ด
tags:
  - skill
  - diagram
  - codegen
created_at: 2026-06-02T20:13:00.000+07:00
cluster: ops
role: Agent capability
crosslinks:
  references:
    - "CONCEPT--DIAGRAM-TO-CODE"
  parent_blueprint:
    - "GENESIS--COGNITIVE-ENGINE"
---
# 🛠️ SKILL--DIAGRAM-TO-CODE

**Diagram-to-Code Capability**
นี่คือทักษะขั้นสูง (Skill Module) ที่ฝังอยู่ในตัว Agent เพื่อทำหน้าที่แปลงข้อมูลเชิงภาพ (Visual Structure) ให้กลายเป็นโครงสร้างซอฟต์แวร์ (Boilerplate / System Structure) 

## **1. Capability Definition (คำจำกัดความของทักษะ)**
AI Agent มีความสามารถในการอ่านโค้ดไดอะแกรมแบบ Text-based (เช่น `Mermaid.js`, `PlantUML`, หรือ กราฟความสัมพันธ์ในไฟล์ `.md`) และรับรู้ถึง:
*   **Nodes:** เปลี่ยนเป็น Class, Interface, หรือ UI Component
*   **Edges (Arrows):** เปลี่ยนเป็น Data Flow, Import Statements, หรือ Dependency Injection

## **2. Execution Trigger (เมื่อใดที่ควรใช้ทักษะนี้?)**
อ้างอิงตาม `[[FRAMEWORK--WORKFLOW-DYNAMICS]]`:
*   **Phase 2/3 (Architecture & Assembly):** เมื่อผู้ใช้ออกแบบ Flow ผ่าน Mermaid 
*   Agent จะดึงโครงร่างนั้นมากางออกเป็นไฟล์ `.ts` หรือ `.tsx` ล่วงหน้า พร้อมใส่ Template ว่างไว้รอการเชื่อมต่อ (Assembly)

## **3. Agent Execution Standard (มาตรฐานการทำ Diagram-to-Code)**
1.  **Read & Extract:** ดึงค่า Entity ทุกตัวที่ระบุใน Diagram
2.  **Scaffolding:** สร้างไฟล์และโฟลเดอร์ให้ตรงตามโครงสร้างแบบ 1:1
3.  **Cross-Check:** ย้อนกลับไปยืนยันกับ `[[CONCEPT--DOC-DRIVEN-DEVELOPMENT]]` ว่าไฟล์ทั้งหมดมีที่มาที่ไปและถูกบันทึกประวัติอย่างถูกต้อง
