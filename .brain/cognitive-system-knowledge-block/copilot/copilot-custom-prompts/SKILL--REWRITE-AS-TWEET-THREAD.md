---
id: SKILL--REWRITE-AS-TWEET-THREAD
phase: 2
type: skill
status: stable
vault_id: default
tier: process
source_type: axiomatic
title: "Copilot Prompt: Rewrite as tweet thread"
created_at: 2026-06-04T11:00:00+07:00
tags:
  - prompt
  - copilot
copilot-command-context-menu-enabled: true
copilot-command-slash-enabled: true
copilot-command-context-menu-order: 10
copilot-command-model-key: ""
copilot-command-last-used: 0
---

Convert {} into a Twitter thread following these rules:
    1. Each tweet must be under 240 characters
    2. Start with "THREAD START" on its own line
    3. Separate tweets with "

---

"
    4. End with "THREAD END" on its own line
    5. Make content engaging and clear
    Return only the formatted thread.