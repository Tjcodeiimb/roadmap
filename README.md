# UpForge Learning

A self-paced, gamified employee development platform for UpForge Consulting.
Three tracks — **AI**, **Finance**, **Consulting** — each broken into
phases → topics → curated free resources. Employees earn XP, keep a streak,
and get spaced-repetition reminders to revisit what they've learned.

Built with Next.js (App Router) + TypeScript + Tailwind CSS, backed by
Supabase (Postgres, Auth, Row Level Security), deployed on Vercel. Runs on
$0/month infrastructure — see [`docs/SETUP.md`](docs/SETUP.md) for the
exact free-tier limits this relies on.

## First time here?

Follow **[docs/SETUP.md](docs/SETUP.md)** start to finish — it walks
through creating the Supabase and Vercel accounts, running the database
schema, loading the course content, and inviting the first admin. No prior
experience with any of these tools is assumed.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project's values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project layout

```
src/app/                 Routes (App Router)
src/app/actions/         Server actions (auth, progress, admin)
src/components/          UI, layout, track, review, profile, admin, auth components
src/lib/supabase/        Browser / server / admin Supabase clients
src/lib/queries.ts       Server-side data-fetching helpers
src/lib/gamification/    XP levels, spaced-repetition constants
supabase/migrations/     SQL schema, RLS policies, RPC functions
scripts/seed.mjs         One-time (re-runnable) content seed script
scripts/seed-data/       AI / Finance / Consulting track content as JSON
docs/SETUP.md            Full setup guide
docs/reference/          The original single-user AI Mastery Roadmap tool
                          this app's AI track content was migrated from
```

## Content

- **AI track**: migrated as-is from the original single-user tool
  (`docs/reference/ai-mastery-roadmap-v9.html`) — 7 phases, 65 topics, 116
  resources.
- **Finance track**: 7 phases, 15 topics, 32 resources.
- **Consulting track**: 6 phases, 15 topics, 25 resources.

Re-running `npm run seed` re-applies this content (by ID, so it's safe to
run repeatedly) without ever touching anyone's personal progress, XP,
streak, or spaced-repetition data. Ongoing content edits after that are
made through the in-app Admin panel, not by re-running the script.
