# Setup guide — UpForge Learning

This walks you (a complete beginner is fine) through turning this code into a
live, working app at a real URL. Follow the steps in order — later steps
depend on earlier ones. Budget about 30–45 minutes the first time.

The code is already written and already in this GitHub repository, on the
branch `claude/new-session-xqqu7b`. What's left is: create the two free
accounts that host the database and the website, connect them to this code,
load the course content into the database, and invite yourself as the first
admin.

---

## 0. What you're setting up, in one picture

```
GitHub (this code)  --auto-deploys-->  Vercel (hosts the website)
                                              |
                                              v
                                        Supabase (database + login)
```

You'll create free accounts on **Supabase** and **Vercel**, wire them
together with a handful of copy-paste values, and you're live.

---

## 1. Create your Supabase project (the database)

1. Go to [supabase.com](https://supabase.com) and click **Start your project**.
2. Sign up (GitHub sign-in is the fastest option) — no credit card required.
3. Click **New project**.
   - **Name**: `upforge-learning` (or anything you like).
   - **Database password**: click "Generate a password" and **save it
     somewhere** (a password manager, or a note) — you likely won't need it
     again, but keep it just in case.
   - **Region**: pick the one closest to your team.
   - Plan: leave it on **Free**.
4. Click **Create new project** and wait ~2 minutes while it provisions.

### 1a. Run the database schema

1. In your new project, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file `supabase/migrations/0001_init.sql` from this repository,
   copy its entire contents, and paste it into the SQL editor.
4. Click **Run** (bottom right). You should see "Success. No rows returned."
   This creates every table, security rule, and function the app needs. It's
   safe to run more than once if you ever need to.
5. Repeat for **every other file in `supabase/migrations/`, in filename
   order** — `0002_marketplace_skills_media.sql` adds the course
   marketplace, cohort bundles, the skills system, and per-resource
   progress for the video player; `0003` and `0004` backfill marketplace
   metadata and the onboarding-completed flag.

> **Important:** run a migration *before* deploying code that depends on it.
> Each file is additive and safe to re-run, so if you're unsure whether one
> has been applied, running it again is harmless.

### 1b. Turn off public sign-up

Employees are invited by an admin, not self-serve, so turn off open signup:

1. Left sidebar → **Authentication** → **Sign In / Providers** (or
   **Settings** → **Auth**, depending on the current Supabase UI).
2. Find **"Allow new users to sign up"** and turn it **off**.
3. Leave **Email** provider **on** — that's what invites and sign-in use.

### 1c. Get your API keys

1. Left sidebar → **Project Settings** (gear icon) → **API**.
2. You'll need three values from this page in step 3 below:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (a long string under "Project API keys")
   - **service_role** key (also under "Project API keys" — click "Reveal").
     This one is secret. Never put it in the browser or commit it to git.

Keep this browser tab open — you'll copy these in a moment.

---

## 2. Put this code on Vercel (the website host)

1. Go to [vercel.com](https://vercel.com) and sign up using **your GitHub
   account** (the same one that owns this repository) — no credit card
   required for the Hobby plan.
2. Click **Add New...** → **Project**.
3. Find and select this repository (`Tjcodeiimb/roadmap`) and click
   **Import**.
4. **Important**: under "Configure Project", set the branch to
   `claude/new-session-xqqu7b` if Vercel asks, or plan to merge that branch
   into your repo's default branch first — Vercel deploys whichever branch
   you point it at (usually the default branch, so merge or rename branches
   as you prefer).
5. Before clicking Deploy, open the **Environment Variables** section and
   add these four (paste the values you copied from Supabase in step 1c):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase `anon public` key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase `service_role` key |
   | `NEXT_PUBLIC_SITE_URL` | leave blank for now — see step 2a |

6. Click **Deploy**. Wait 1–2 minutes.
7. You'll get a URL like `https://roadmap-xyz.vercel.app`. Open it to
   confirm you see the sign-in screen (it's fine that you can't log in yet).

### 2a. Set the site URL (do this once you have your real URL)

1. Copy your Vercel URL (e.g. `https://roadmap-xyz.vercel.app` — or your own
   custom domain if you attach one later).
2. Back in Vercel: **Project** → **Settings** → **Environment Variables** →
   edit `NEXT_PUBLIC_SITE_URL` → paste that URL (no trailing slash) → Save.
3. **Settings** → **Deployments** → redeploy the latest deployment (⋯ menu →
   **Redeploy**) so the new value takes effect.

### 2b. Tell Supabase about that URL

1. Back in Supabase: **Authentication** → **URL Configuration**.
2. **Site URL**: paste your Vercel URL.
3. **Redirect URLs**: add `https://YOUR-VERCEL-URL/auth/confirm` and
   `https://YOUR-VERCEL-URL/auth/callback` (two entries).
4. Save.

---

## 3. Load the course content into the database

This inserts all 9 tracks (AI, Finance, Consulting, Excel & Business
Modelling, Behavioral Psychology, Growth & Marketing, Data & Analytics,
Product & Strategy, B2B Sales — every phase, topic, and resource link),
plus the resume-ready skills and marketplace cohort bundles built on top
of them, into Supabase. It only touches content tables, never anyone's
personal progress, so it's safe to re-run later after you add more
resources through the SQL editor directly (though normally you'll use the
in-app Admin panel for that instead — see step 5).

Before seeding, `node scripts/validate-seed.mjs` checks every seed-data
file for structural problems (duplicate ids, broken foreign keys, missing
marketplace metadata) and `node scripts/check-links.mjs` sweeps every
resource URL for a live response — worth running after editing any
seed-data file directly.

On your own computer (not required to be the same machine this was built
on):

1. Install [Node.js](https://nodejs.org) (v20 or later) if you don't have it.
2. Clone this repository and check out the branch:
   ```
   git clone https://github.com/Tjcodeiimb/roadmap.git
   cd roadmap
   git checkout claude/new-session-xqqu7b
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a file named `.env.local` in the project root (copy
   `.env.local.example` and fill in the same four values you used in Vercel).
5. Run:
   ```
   npm run seed
   ```
6. You should see output like:
   ```
   Seeding 9 tracks, 56 phases, 198 topics, 378 resources, 12 skills, 4 cohorts...
     tracks: 9 rows
     phases: 56 rows
     topics: 198 rows
     resources: 378 rows
     skills: 12 rows
     cohorts: 4 rows
     cohort_courses: 12 rows
     skill_resources: 72 rows
   Done. All tracks, skills and cohorts are now live in the database.
   ```

---

## 4. Invite yourself as the first admin

The app's own "invite employee" button only works for people who are
already admins — so the very first admin (you) has to be created directly
in Supabase, once:

1. Supabase dashboard → **Authentication** → **Users** → **Add user** →
   **Invite user**.
2. Enter your own email address and send the invite.
3. Check your email, click the invite link — it opens your live app and
   signs you in.
4. Go through the short onboarding walkthrough, then browse the
   **Marketplace** and enroll in a course or cohort bundle — the dashboard
   stays empty until you enroll in something.
5. Back in Supabase → **SQL Editor** → run this once, with your real email:
   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'you@upforge.com');
   ```
6. Refresh the app. You'll now see an **Admin** item in the sidebar.

From here on, invite every other employee from inside the app: **Admin** →
**Invite an employee** — no more manual Supabase steps needed.

---

## 5. Using the admin panel

- **Admin → Invite an employee**: sends them a real email with a sign-in
  link. They land straight in onboarding.
- **Admin → Manage content**: add, edit, reorder, or remove any phase,
  topic, or resource in any track — changes are live immediately, no
  redeploy, no code.
- **Admin → aggregate completion**: shows how many people completed each
  phase, team-wide — never an individual's personal progress (unless that
  person has separately opted into the leaderboard).

---

## 6. Free-tier limits this relies on (re-check these periodically)

This app is built to run at **$0/month for 25–100 employees**, using only
free tiers. Here's specifically what it depends on, so you can sanity-check
it as the team grows:

- **Supabase Free plan**: 500 MB database storage, 5 GB egress/month,
  50,000 monthly active users for Auth, unlimited API requests (rate
  limited, not capped). A roadmap app for 100 employees — a few hundred
  rows of content plus a handful of small rows per user — will use a tiny
  fraction of the 500 MB. The one real caveat: **a free Supabase project
  pauses itself after 7 days with zero API requests** (e.g., if the whole
  team stops using it, say over a long shutdown). Un-pausing is one click
  in the Supabase dashboard ("Restore project") and takes a couple of
  minutes — no data is lost. If your team uses the app at all regularly,
  this never triggers.
- **Vercel Hobby plan**: 100 GB bandwidth/month, generous serverless
  function execution included. For 100 people loading a few pages a day,
  this is far below the limit. **Important caveat to be aware of**:
  Vercel's Hobby plan terms are written for personal, non-commercial use;
  Vercel's own enforcement in practice is lenient for small internal
  company tools like this one, and plenty of small teams run internal apps
  on it, but it is technically outside the letter of the Hobby ToS. If you
  want to be fully compliant, Vercel's Pro plan starts at $20/month per
  member — which breaks the $0 requirement, so it's flagged here rather
  than silently assumed. Many teams this size simply stay on Hobby; that's
  your call to make with that tradeoff in mind.
- **GitHub**: free private repositories are unlimited in count and size for
  a project this small.

Nothing else in the stack (Next.js, Tailwind, Supabase client libraries,
lucide-react, Framer Motion) has any cost at any scale — they're all
open-source libraries that run inside your own Vercel deployment.

---

## 7. Day-to-day maintenance

- **Adding/editing content**: use the in-app Admin panel. No redeploy
  needed.
- **Changing code**: push to the `claude/new-session-xqqu7b` branch (or
  merge it to your default branch) — Vercel redeploys automatically.
- **Re-running the seed script**: safe to re-run any time; it upserts by
  ID, so it won't create duplicates. It never touches user progress, XP,
  streaks, or spaced-repetition data.
