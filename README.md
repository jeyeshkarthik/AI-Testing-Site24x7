# Site24x7 API Search & Testing Tool

An AI-powered search interface for exploring and testing all **720 API endpoints** across the 15 feature modules of the [Site24x7 Admin API](https://www.site24x7.com/app/demo).

---

## What It Does

- **Search** any API endpoint by typing a plain-English question (e.g. *"list all monitor groups"*, *"webhook configuration"*)
- **Browse** all 15 feature modules with endpoint counts and descriptions
- **Filter** by HTTP method (GET / POST / PUT / DELETE / PATCH) and module
- **Expand** any result card to see response fields, request fields, and a payload summary
- **Mark Correct** and **Add to Dataset** to build a labeled Q&A training dataset
- **Export** your dataset as JSON or CSV
- **Track** your search history and replay past queries

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v16 or later

### Install dependencies
```bash
npm install
```

### Build & run
```bash
npm start
```

This builds `index.html` from the Excel source and serves it at **http://localhost:3333**.

### Or run separately
```bash
# Just build the HTML
npm run build

# Just serve (if already built)
npm run serve
```

---

## Project Structure

```
├── site24x7_Admin_API.xlsx   ← Source of truth: 15 sheets, 720 API endpoints
├── generate_html.js          ← Reads the Excel, generates index.html
├── extract_apis.js           ← Helper: raw API extraction from Excel
├── build_data.js             ← Helper: data transformation
├── compact_data.js           ← Helper: creates compact JSON for the app
├── examine_excel.js          ← Helper: inspect Excel sheet structure
├── read_excel.js             ← Helper: basic Excel reader
├── index.html                ← The generated single-file search app
└── package.json
```

> **Note:** `node_modules/`, intermediate JSON files, and temp files are excluded via `.gitignore`. Run `npm run build` to regenerate `index.html` after any changes.

---

## How to Build the Dataset

1. Open the app and type a question in the search bar
2. Review the results — click **▶ Try API** to see the live response (requires session cookie setup)
3. Click **✓ Mark Correct** on the right API for that question
4. Or **+ Add to Dataset** to capture it without marking it correct yet
5. Switch to the **Dataset** tab to review all collected pairs
6. Click **Export JSON** or **Export CSV** to download your dataset

---

## Modules Covered

| Module | APIs |
|--------|------|
| Inventory | Monitor listing, groups, subgroups |
| Tags | Tag creation, assignment, listing |
| Automations | Alert automation rules |
| Third-Party Integrations | Webhooks, PagerDuty, Slack, etc. |
| Scheduled Reports | Email reports, PDF exports |
| Threshold Profiles | Alert thresholds per monitor type |
| Notification Profiles | Who gets notified and when |
| On-Call Schedule | On-call rotation management |
| Server Templates | APM server configuration templates |
| User & User Group Management | User roles, permissions, groups |
| Downloads | Agent download links (Java, .NET, Node, etc.) |
| Zia | AI-powered recommendations and workflows |
| Log Management | Log profile and group management |
| Dashboards | Custom dashboard management |
| MSP (Multi-org) | Multi-tenant organisation management |

---

## Roadmap

- [x] Phase 0 — Stable foundation with search, dataset, history
- [ ] Phase 1 — Build 50–100 labeled Q&A pairs
- [ ] Phase 2 — Live API testing via Settings + local proxy
- [ ] Phase 3 — Semantic / vector search
- [ ] Phase 4 — AI-generated answers (Gemini / GPT-4)
- [ ] Phase 5 — Automated evaluation framework
- [ ] Phase 6 — Deploy to GitHub Pages / Netlify

---

## Data Source

All API data was extracted from `site24x7_Admin_API.xlsx`, recorded from the [Site24x7 Demo Environment](https://www.site24x7.com/app/demo).
