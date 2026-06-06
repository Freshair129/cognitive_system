---
id: ISSUE--ASYMMETRIC-TAXONOMY
phase: 6
type: issue
status: [superseded]
vault_id: default
tier: process
source_type: axiomatic
title: "Asymmetric Taxonomy: DDD vs Diagram-to-Code"
summary: บันทึกการค้นพบความไม่สมมาตรทางตรรกะในระบบ GKS Taxonomy ระหว่าง Concept และ Skill
tags:
  - issue
  - tech-debt
  - taxonomy
created_at: 2026-06-02T20:13:00.000+07:00
cluster: governance
role: Issue tracker
crosslinks:
  references:
    - "CONCEPT--DOC-DRIVEN-DEVELOPMENT"
    - "SKILL--DIAGRAM-TO-CODE"
  resolved_by:
    - "ADR--TAXONOMY-CAPABILITY-SYMMETRY"
---
# 🚨 ISSUE--ASYMMETRIC-TAXONOMY

**Title:** Asymmetric Taxonomy: DDD vs Diagram-to-Code
**Date:** 2026-06-02
**Reporter:** GKS User / System Architect

## **1. Description (รายละเอียดปัญหา)**
พบความไม่สมมาตร (Asymmetry) ในการตั้งชื่อและการจัดกลุ่ม (Taxonomy) ของระบบ GKS Genesis Block ดังนี้:
*   ก่อนหน้านี้ระบบมีแนวคิด `Doc-to-Code` และ `Diagram-to-Code` ซึ่งทำหน้าที่เป็นทักษะ (Skill) คู่กัน
*   แต่เมื่อมีการปรับมาตรฐาน `Doc-to-Code` ถูกเปลี่ยนชื่อและเลื่อนขั้นเป็น `CONCEPT--DOC-DRIVEN-DEVELOPMENT` (DDD)
*   ในขณะที่ `Diagram-to-Code` ยังคงถูกกำหนดให้เป็น `SKILL--DIAGRAM-TO-CODE` 
*   **ผลกระทบ:** ทำให้มาตรฐานของคำว่า "Concept" (แนวคิด) และ "Skill" (ทักษะปฏิบัติ) ปะปนกัน สร้างความสับสนในการกำหนดสถาปัตยกรรม (Architectural Tech Debt)

## **2. Root Cause Analysis (สาเหตุของปัญหา)**
เกิดจากการที่ System Agent กรุ๊ปแนวคิดเชิงปรัชญา (Philosophy) เข้ากับการกระทำเชิงปฏิบัติ (Execution) แบบหลวมๆ ทำให้ลืมสร้าง Node ที่ทำหน้าที่เป็น "ทักษะเฉพาะ" สำหรับการแปลเอกสารเป็นโค้ด

## **3. Expected Outcome (ผลลัพธ์ที่คาดหวัง)**
ระบบควรมีโครงสร้างที่ชัดเจน แยกแยะระหว่าง "ร่มใหญ่ที่เป็นปรัชญา" (CONCEPT) และ "เครื่องมือที่ใช้ทำงานจริง" (SKILL) ออกจากกันอย่างสมมาตร

*   **Status:** Resolved (ดูวิธีการแก้ไขที่ `[[ADR--TAXONOMY-CAPABILITY-SYMMETRY]]`)
