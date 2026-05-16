# Tool: Web Search & Deep Research Protocol
# Used by: Agents 01, 06, 07, 08, 10, 11
# Purpose: Standardized 3-layer OSINT investigation protocol

---

## Overview
This tool defines the web search methodology for all investigation agents.
It provides structured query templates, verification protocols, and ethical
guidelines for Open Source Intelligence (OSINT) data collection.

---

## 3-Layer Research Protocol

### Layer 1 — Surface Search (Mandatory)
```
PURPOSE: Quick initial scan using Google Search grounding
QUERIES: 5-10 per subject
DEPTH: First 5-10 results per query
TIME: 2-3 minutes per subject

QUERY TYPES:
  - Direct name search: "[SUBJECT]"
  - Contextual search: "[SUBJECT] [CONTEXT]"
  - Site-specific: "site:[domain] [SUBJECT]"
  - Regulatory: "[SUBJECT] OJK sanksi"
```

### Layer 2 — Deep Dive (For flagged subjects)
```
PURPOSE: In-depth investigation of subjects flagged in Layer 1
TRIGGERS: Any anomaly, legal issue, or red flag from Layer 1
QUERIES: 15-25 per subject
DEPTH: First 10-20 results per query, follow internal links
TIME: 5-10 minutes per subject

PRIORITY SOURCES:
  1. putusan.mahkamahagung.go.id (court decisions)
  2. ahu.go.id (corporate registry)
  3. ojk.go.id (regulatory data)
  4. pppk.kemenkeu.go.id (KAP/AP registry)
  5. detik.com, kompas.com, bisnis.com (media coverage)
  6. LinkedIn, Facebook (professional/social profile)
```

### Layer 3 — Cross-Verification (For critical findings)
```
PURPOSE: Verify and strengthen critical findings
TRIGGERS: Tier 1 or Tier 2 red flags detected
QUERIES: Verification-specific, correlation searches
TIME: 5-15 minutes per critical finding

APPROACH:
  - Search for counter-evidence
  - Search for confirming sources from different domains
  - Search for historical context
  - Search for related parties
```

---

## Key Search Domains

| Domain | Content | Relevance |
|--------|---------|-----------|
| `ojk.go.id` | Regulator data, sanctions | BPR license & sanctions |
| `putusan.mahkamahagung.go.id` | Court decisions | Legal track record |
| `ahu.go.id` | Corporate registry (AHU) | Company ownership |
| `pppk.kemenkeu.go.id` | KAP/AP registry | Auditor verification |
| `detik.com`, `kompas.com` | Major media | Public reputation |
| `bisnis.com`, `cnbcindonesia.com` | Business media | Financial news |

---

## Ethical Guidelines
```
1. PUBLIC SOURCES ONLY — Never attempt to access private/restricted data
2. CITE ALL SOURCES — Every finding must include source URL
3. NO FABRICATION — If not found, state "No information found"
4. PROPORTIONALITY — Investigation depth proportional to risk level
5. ACCURACY — Cross-verify critical claims from 2+ independent sources
6. PRIVACY — Respect privacy boundaries, focus on professional capacity
7. DISCLAIMER — All findings are indicative and require formal verification
```

---

## Query Language Note
All search queries should be in **Indonesian (Bahasa Indonesia)** since the
target information sources are Indonesian databases and media.
