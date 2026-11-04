# Importing company profiles

BirdNest imports company profiles from documents you have written elsewhere: in Cowork, in Word, or by hand. Open **Settings → Data → Import profiles** (also on the Companies page and the empty dashboard), drop in one or more files, review each company, then save.

## What you can import

| File | How it is read |
|---|---|
| Word `.docx` | Text is extracted, then Claude maps it to BirdNest fields |
| PDF `.pdf` | Sent to Claude as a document |
| Markdown `.md`, text `.txt` | Sent to Claude as text |
| BirdNest JSON `.json` | Read directly, no Claude call (the format below) |

Each file can hold one company or many. Files must be under 4 MB.

## What happens on import

- **Nothing is saved until you press Import** on the review screen. You can untick companies and edit any field first.
- **Existing companies are updated, never duplicated.** A profile matches an existing company by website, else by name (legal and sector suffixes such as *AG*, *Bio*, *Therapeutics* are ignored).
- **Updates only touch what the file states.** Scores, decision, deal stage, logo and map position stay as they are unless the file sets them. Imported notes are added; notes already logged with the same date and text are skipped. Nothing is ever deleted.
- **New companies** start with the default scorecard (fit 60, Watch) until you score them.
- **New indications** join the posterior or anterior picklist automatically.
- **Data rule.** If Claude sees that a document is marked confidential or under a CDA, the review screen says so before you import.

## BirdNest JSON format

Use this when Claude in another workspace prepares the profiles for you. Only `name` is required; leave out anything you do not know rather than guessing.

```json
{
  "companies": [
    {
      "name": "Foventa",
      "kind": "seeking",
      "website": "foventa.co.uk",
      "city": "London",
      "country": "United Kingdom",
      "region": "Europe",
      "own": "VC-backed (Series A)",
      "founded": "2019",
      "heads": "22",
      "type": "Drug",
      "seg": "Posterior",
      "ind": "NPDR/DR",
      "asset": "FV-1 · NPDR · topical eye drop",
      "phase": "Phase 1",
      "cat": "Phase 2 start · Q2 2027",
      "raise": "$18M Series A, Mar 2025",
      "runwayMonths": 20,
      "seeking": "Series B or regional licence",
      "timing": "Raising from Q1 2027",
      "dealStage": "First contact",
      "decision": "Watch",
      "rationale": "Topical route is the differentiator if posterior exposure holds.",
      "overview": "Two plain sentences about the company.",
      "diffs": ["Differentiator one", "Differentiator two", "Differentiator three"],
      "risk": "One line on the main risk.",
      "pipeline": [{ "code": "FV-1", "description": "NPDR · topical", "stage": "Phase 1", "catalyst": "Phase 2 start · Q2 2027" }],
      "economics": [{ "label": "Upfront", "value": "$20–40M" }],
      "contacts": [{ "name": "Jane Doe", "role": "CEO" }],
      "whereMet": "AAO 2026, Orlando",
      "nextStep": "Send non-confidential deck",
      "rightsOpen": ["US", "EU", "UK", "JP", "CN", "RoW"],
      "notes": [{ "date": "2026-10-30", "type": "Call", "text": "Intro call with the CEO.", "private": false }],
      "lowConfidence": ["heads"],
      "sources": ["https://foventa.co.uk"]
    }
  ]
}
```

Allowed values:

- `kind`: `seeking`, `pharma`, `investor`
- `region`: `Americas`, `Europe`, `APAC` (worked out from the country when left out)
- `type`: `Drug`, `Device` · `seg`: `Posterior`, `Anterior`
- `phase`: any wording; it is placed on the ladder (Preclinical to Phase 4, or Pilot, Pivotal, Post-market) and shown as written
- `dealStage`: `Identified`, `First contact`, `Intro call`, `CDA signed`, `Diligence`, `Term sheet`, `Closed`, `Parked`
- `decision`: `Pursue`, `Watch`, `Pass`
- `pipeline[].stage`: `Discovery`, `Preclinical`, `IND-enabling`, `Phase 1`, `Phase 1/2`, `Phase 2`, `Phase 2b/3`, `Phase 3`, `NDA/BLA filed`, `Approved`
- `rightsOpen`: territories still available, from `US`, `EU`, `UK`, `JP`, `CN`, `RoW`
- `notes[].type`: `Call`, `Meeting`, `Email`, `Congress`, `Note` · `notes[].date`: `YYYY-MM-DD` (today if null) · `private: true` keeps a note off every printout
- `lowConfidence`: field names to mark "check" on the review screen

For Big Pharma and investors, add a `buyBox`:

```json
"buyBox": {
  "inds": ["Dry eye", "Glaucoma/OHT"],
  "mods": ["Small molecule", "Peptide"],
  "stStart": 2, "stEnd": 3,
  "geo": ["JP", "CN"],
  "deals": ["Regional rights", "In-license"],
  "excl": ["Gene therapy"],
  "money": [{ "label": "Upfront", "value": "$10–40M" }],
  "contact": "Name · VP Business Development"
}
```

`stStart` and `stEnd` index the stage window: 0 Preclinical, 1 Phase 1, 2 Phase 2, 3 Phase 3, 4 Phase 4 / approved.

## Prompt for Claude in another workspace

> Turn the company profiles in this workspace into one BirdNest import file. Follow the format in `docs/import-format.md` of the BirdNestLLC repository. Include only facts the profiles state; leave out fields you do not know. Put any field you inferred in `lowConfidence`. Do not include anything under a CDA. Give me the result as a downloadable `.json` file.

`docs/examples/senju-review-7.json` holds the seven companies from the Senju asset review in this format.
