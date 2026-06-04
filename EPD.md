```
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
│
Technical Architecture Document/ High Level Design Document
│
High Level Design Document: L4
├── root/
│   ├── {system}/ # L4 
│   │   ├── {module}/ # L3
│   │   │   ├── {feature}/ # L2          
│   │   │   │   ├── {component}/ # L1
│   │   │   │   │   └──  {method}# L0
│   ├── {module}/ # L4 < หรือ L3 ?
│   │   ├── {feature}/  # L2           
│   │   │   ├── {component}/ # L1
│   │   │   │   └──  {method}# L0
│   │   │   │   

       docs/
---
```