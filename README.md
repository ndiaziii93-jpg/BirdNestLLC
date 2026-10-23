# BirdNest Hub

Private corporate-development instrument for one senior BD executive in ophthalmology. It tracks biotechs and medtechs seeking capital, Big Pharma buyers and investors; scores them on a weighted fit scorecard; matches buyers to assets; logs discussions; and exports a one-page PDF per company.

Data rule: **public information plus the owner's own notes only. Nothing under a CDA.** Private notes never print.

The approved design lives in [`design/`](design/) (the HTML prototype and screenshots). This app recreates it in Next.js and persists everything to Postgres.

## What is in the box

| Area | Where |
|---|---|
| Dashboard: world map, company card, overview strip, refine panel, full list | `src/components/dashboard/`, `src/components/modals/ListSheet.tsx` |
| Company profile sheet (editable, live scorecard, buy box for pharma/investors, lens switch) | `src/components/modals/ProfileSheet.tsx` |
| Big Pharma / investor account pop-up, introductions, fit matrix | `src/components/modals/AccountSheet.tsx`, `MatrixSheet.tsx` |
| One-pager export (A4 / Letter, print to PDF) | `src/components/modals/ExportSheet.tsx` |
| Add company with Claude research (web search) and follow-up questions | `src/components/modals/AddSheet.tsx`, `src/app/api/research`, `src/app/api/assess` |
| Companies, Partnering (drag-and-drop board), Discussions, Settings | `src/components/views/` |
| Scoring, matching, filters, sample data (pure functions) | `src/lib/` |
| Persistence (Prisma + Postgres), auth (Supabase Google sign-in), logos (Supabase Storage) | `src/lib/repo.ts`, `src/proxy.ts`, `src/app/api/` |

Present mode (top bar) hides private notes and every edit control so the screen can be shown to others.

## Run it locally

Requirements: Node 22, a Postgres you can reach.

```bash
npm install
cp .env.example .env         # fill in DATABASE_URL / DIRECT_URL; set AUTH_DISABLED=true locally
npx prisma migrate deploy     # creates the tables
npm run dev                   # http://localhost:3000
```

With `AUTH_DISABLED=true` there is no sign-in. Open Settings → Data → **Load sample data** to see the 60-company sample set from the design; it is tagged as sample and can be removed again from the same place.

## Deploy (Supabase + Vercel)

1. **Supabase project** (you already have one)
   - *Database*: Project Settings → Database → Connection string. Copy the **Transaction pooler** URI (port 6543) as `DATABASE_URL` and the **Session pooler / direct** URI (port 5432) as `DIRECT_URL`.
   - *Auth*: Authentication → Providers → Google → enable, and paste a Google OAuth client ID and secret (Google Cloud Console → APIs & Services → Credentials → OAuth client ID, type Web; authorised redirect URI is the one Supabase shows on that page, `https://PROJECT.supabase.co/auth/v1/callback`).
   - *Auth redirect*: Authentication → URL Configuration → add `https://YOUR-VERCEL-DOMAIN/auth/callback` to Redirect URLs and set Site URL to your Vercel domain.
   - *Storage*: SQL editor → run [`supabase/setup.sql`](supabase/setup.sql) once (creates the public `logos` bucket).
   - *Keys*: Project Settings → API → copy the project URL, the `anon` key and the `service_role` key.
2. **Vercel project** → Import the GitHub repo. Framework preset Next.js, build command `npm run build` (default). Add the environment variables from `.env.example`:
   `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_LOGO_BUCKET=logos`, `OWNER_EMAIL=ndiaziii93@gmail.com`, `AUTH_DISABLED=false`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL=claude-sonnet-5-5`.
3. **Create the tables** once, from your laptop, with the direct connection string:
   `DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy`
   (Or add `npx prisma migrate deploy &&` in front of the Vercel build command so every deploy applies pending migrations.)
4. Deploy. Only the Google account in `OWNER_EMAIL` can get past the sign-in page; everyone else is bounced back with a notice.

Claude research uses the Anthropic API with web search. Without `ANTHROPIC_API_KEY` the Add flow still works through **Skip and fill in manually**.

## Tests

```bash
npm run lint && npm run typecheck
npm test               # vitest: fit maths, weight rebalancing, matching, filters, sample data
npm run test:e2e       # playwright: drives the real app on a local Postgres (starts next dev on :3100)
```

The e2e suite loads the sample set before each test and checks filters, profile edits surviving a reload, introductions, the one-pager geometry (A4 794×1123, Letter 816×1056) and that private notes never print, the partnering board, discussions, weight apply, present mode, and the phone layout. GitHub Actions runs the whole set on every push (`.github/workflows/ci.yml`). Set `CHROME_PATH` to use an already-installed Chromium instead of downloading one.

## Design fidelity notes

- `src/app/prototype.css` is the prototype's CSS verbatim (all `<style>` blocks, `views.css`, and the styles the scripts injected), so sizes, colours and type match the screenshots. `src/app/globals.css` only adds the nav links, present mode, sign-in page and the iPad / iPhone layouts.
- Where the written brief and the screenshots disagreed (light vs teal top bar), the screenshots win.
- Dates are live: "as of" and "Prepared" show today; each seeking company has its own *runway as of* date.
- Fit = Σ(score ÷ 5 × weight), 0–100. Decision suggestion: ≥ 76 Pursue, ≥ 50 Watch, else Pass; the saved decision is yours to override.
- New indications typed on a profile join the picklist of their segment automatically.
