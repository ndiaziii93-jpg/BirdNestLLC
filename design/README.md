# Handoff: BirdNest Hub

## Overview
BirdNest is a private corporate-development instrument for one senior BD executive in ophthalmology. It tracks biotechs/medtechs seeking capital, Big Pharma buyers and investors; scores them on a weighted fit scorecard; matches buyers to assets; logs discussions; and exports a one-page PDF per company. Single user, no auth. Data rule: public information plus the owner's own notes only (nothing under CDA).

## About the design files
The files in this folder are a **working HTML prototype** — the approved design reference. Open `BirdNest Hub.html` directly in a browser (all files must sit side by side). The task is to **recreate it in a production stack exactly as it looks and behaves**. Recommended if no codebase exists: Next.js (App Router) + TypeScript, CSS variables for tokens, d3-geo + topojson-client for the map, a real datastore (Postgres/SQLite via Prisma) replacing the in-memory `DATA` array.

## Fidelity
**High-fidelity.** Final colours, type, spacing, copy and interactions. Match pixel-for-pixel; read exact values from the CSS in `BirdNest Hub.html` `<style>` and `views.css`, and the injected `<style>` blocks inside `accounts.js` and `categories.js`.

## Files
- `BirdNest Hub.html` — app shell, tokens, Dashboard (map, company card, region list, refine panel), company profile sheet, one-pager export sheet, sample data (`build()`), fit scoring (`SC`, `calcFit`).
- `views.css` / `views.js` — Companies, Partnering, Discussions, Settings views and view switching (`setView`), CSV download, scorecard-weight auto-balancing.
- `accounts.js` — Big Pharma / Investor account pop-up (wants, introductions, potential partners with match tags, fit matrix window).
- `categories.js` — company categories (Seeking capital · Big Pharma · Investor), extra sample accounts, category filter.
- `add.js` — Add company flow: Claude researches public data + logo, then asks follow-up questions to complete the profile. Uses `window.claude.complete` (prototype-only); replace with a server route calling the Anthropic API.

External: Google Fonts (Geist 300–600, Geist Mono 400–500), d3 v7.9.0, topojson-client v3.1.0, world-atlas TopoJSON.

## Screens / views
Top bar (68px): lockup (Lookout mark + "BirdNest" Geist Light 20px, −0.04em, brass rule + `NDIII` mono 8px 0.28em brass-ink) · nav Dashboard · Companies · Partnering · Discussions · Settings (active: teal text on teal-soft, bold, brass outline) · search (300×40, sunken, ⌘K) · one teal primary "Add company".

1. **Dashboard** — Row 1 (520px): world map (monochrome hairline, teal dots at HQ sized by fit; click a region/country to zoom and filter) + 400px company card (logo, name, category, lead asset/focus, stage, rights/appetite, runway/revenue, last raise, fit ring, decision pill, Open profile / one-pager). Row 2: horizontal scrolling company list refined by selected region. Row 3 (340px refine panel, white, 24px radius): Category + Type (Drug/Device) + Region column · Phase (drug: Preclinical–Phase 4; device: Pilot, Pivotal, Post-market) · Indications include/exclude toggles with "All" at top-right. Selected filters: brass-soft fill with teal outline.
2. **Company profile** (sheet) — teal header banner with company logo left and BirdNest logo right; differentiators, pipeline, deal posture, fit assessment (six 1–5 rows, live ring update), activity log with private flag, contacts, completeness.
3. **Big Pharma / Investor account** (pop-up) — teal header; colour-bucketed sections (wants = brass-soft, introductions = teal-soft, potential partners = white); top 4 matches with gold match tags (hover explains interested / not interested; gaps are grey dashed with ×) and "View full list" opening the fit matrix window.
4. **Companies** — table/cards, category switch, horizontally scrollable table, sortable columns.
5. **Partnering** — deal-stage pipeline (Identified → First contact → Intro call → CDA signed → Diligence → Term sheet → Closed / Parked), category/decision/type filters.
6. **Discussions** — activity log across companies, type filter, hide-private toggle, quick add.
7. **Settings** — scorecard weights (Partnering / Services lenses); sliders in steps of 5, capped 0–50, auto-rebalance so the total is always 100; Apply recomputes all fits; picklist management.
8. **One-pager export** — A4 portrait; teal banner matching pop-ups with company logo + BirdNest logo; overview, differentiators, key risk, pipeline, deal posture, scorecard, next catalyst (brass-soft), contacts; footer `BIRDNEST · NDIII` · "Prepared [date] · Public information and internal assessment" · page number. Toggles: scorecard, contacts, stated economics. Private notes never print.

## Interactions & behaviour
- Map: hover tooltip; click region → zoom (d3 transition) + filter list and card; click dot → select company.
- All filters combine (AND); counts update live.
- Fit = Σ(score/5 × weight), 0–100. Decision: ≥76 Pursue, ≥50 Watch, else Pass (sample rule).
- Add company: name + website → Claude public-data pass (fills HQ, category, type, segment, indication, asset, stage, ownership, logo) → clarifying questions → new profile opens (no success screen). New indications are added to the picklist automatically.
- Hover states on all buttons/rows; focus ring 2px teal, 2px offset.

## State
Company record (see `build()` and `categories.js`): id, kind (seeking|pharma|investor), name, city, country, region, lat/lon, type, seg, ind, asset, phase, fit, prevFit, scores[6], why[6], dec, deal stage, rightsArr[6], runway, raise, appetite, scale, last touch, notes[[daysAgo, type, text, private]], contacts, logo. Account data in `accounts.js`: wants (indications, modalities, stages, territories), introductions (INTROS: buyer id, seller id, date, status). UI state: view, filters per view, selected region/company, weight drafts.

## Design tokens
Colours: surface #F6F4EF · raised #FFFFFF · sunken #EEEBE4 · line #E4E0D6 · line-strong #CFC9BC · ink #1A1D20 · ink-muted #5E6368 · ink-faint #878B8F · teal #0F4C52 · teal-hover #0B3A3F · teal-soft #DCE8E6 · brass #B08D57 · brass-ink #7A5A26 · brass-soft #F0E7D6 · danger #A3352B (errors only).
Type: Geist for words, Geist Mono for all numbers (tabular). display 56/60 300 · title 32/38 400 · heading 22/28 500 · subheading 17/24 500 · body 15/22 · caption 13/18 · overline 11/16 mono 500 uppercase 0.14em · score 40/44 mono · data 13/18 mono.
Radius: inputs 6 · buttons 10 · cards 16 · sheets 24 · pills 999. Spacing: 4, 8, 12, 16, 24, 32, 48, 64.
Shadow (floating layers only): `0 1px 2px rgba(26,29,32,.04), 0 12px 32px rgba(26,29,32,.08)`. Cards: 1px line border, no shadow.

## Screenshots
`screenshots/` holds one capture per screen (01–08), taken at a narrow preview width for reference only. The HTML prototype is the source of truth for exact layout at 1440px.

## Assets
Lookout mark and compact mark are inline SVG in `BirdNest Hub.html` (brand-kit spec). Company logos in the prototype are monograms or fetched by Claude; in production, store uploaded/fetched logos. Icons: 1.5px Lucide-style strokes (use `lucide-react`).

## Not yet designed
iPad and iPhone layouts, and dark mode, are specified in the brief but were not built in this prototype.
