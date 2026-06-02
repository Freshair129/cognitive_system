---
id: SPEC--SCHEMA-VISUALIZER
phase: 2
type: spec
status: active
vault_id: default
tier: process
source_type: axiomatic
title: Schema Visualizer Technical Specification and Table Schemas
tags:
  - covibe
  - database
  - schema
  - spec
crosslinks:
  references:
    - FEAT--SCHEMA-VISUALIZER
created_at: 2026-05-24T05:55:00.000+07:00
---

# SPEC — Schema Visualizer

Technical specification of database schemas, relationships, coordinates, and interactive lines.

## 1. Table Schema Schema Contract

### 1.1 `employees` Table
- `employee_id` (UUID, PK)
- `first_name` (Text, Non-Nullable)
- `last_name` (Text, Non-Nullable)
- `role` (Text, Nullable)
- `email` (Text, Unique)
- `phone` (Text, Nullable)
- `department` (Text, Nullable)
- `status` (Text, Non-Nullable)

### 1.2 `conversations` Table
- `conversation_id` (UUID, PK)
- `customer_id` (UUID, Non-Nullable)
- `channel` (Text, Non-Nullable)
- `participant_id` (UUID, Nullable)
- `created_at` (Timestamp, Non-Nullable)
- `status` (Text, Non-Nullable)
- `first_touch_ad_id` (UUID, Nullable)
- `owner_id` (UUID, FK $\rightarrow$ `employees.employee_id`)

### 1.3 `orders` Table
- `order_id` (UUID, PK)
- `customer_id` (UUID, Non-Nullable)
- `date` (Timestamp, Nullable)
- `status` (Text, Non-Nullable)
- `total_amount` (Numeric, Non-Nullable)
- `paid_amount` (Numeric, Non-Nullable)
- `conversation_id` (UUID, FK $\rightarrow$ `conversations.conversation_id`)

### 1.4 `transactions` Table
- `transaction_id` (UUID, PK)
- `order_id` (UUID, FK $\rightarrow$ `orders.order_id`)
- `date` (Timestamp, Non-Nullable)
- `amount` (Numeric, Non-Nullable)
- `type` (Text, Non-Nullable)
- `method` (Text, Non-Nullable)
- `status` (Text, Non-Nullable)

### 1.5 `tasks` Table
- `id` (BigInt, PK)
- `task_id` (Text, Unique)
- `customer_id` (UUID, Nullable)
- `assignee_id` (UUID, FK $\rightarrow$ `employees.employee_id`)
- `title` (Text, Non-Nullable)
- `description` (Text, Nullable)
- `status` (Text, Non-Nullable)

---

## 2. Layout & Relationships Spec

### 2.1 Default Coordinates
- `transactions`: `{ left: 280, top: 120 }`
- `orders`: `{ left: 560, top: 80 }`
- `conversations`: `{ left: 840, top: 180 }`
- `tasks`: `{ left: 840, top: 600 }`
- `employees`: `{ left: 1120, top: 320 }`

### 2.2 SVG Connector Lines Spec
- **Connector Points:** Relationship paths must draw a cubic bezier curve connecting the target key's right border edge to the foreign key's left border edge.
- **Relational Lines:**
  - Path 1: `orders.order_id` $\leftrightarrow$ `transactions.order_id`
  - Path 2: `conversations.conversation_id` $\leftrightarrow$ `orders.conversation_id`
  - Path 3: `employees.employee_id` $\leftrightarrow$ `conversations.owner_id`
  - Path 4: `employees.employee_id` $\leftrightarrow$ `tasks.assignee_id`
