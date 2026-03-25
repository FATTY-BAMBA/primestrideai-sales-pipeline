# PrimeStride AI — Sales Pipeline

Full-stack sales pipeline for PrimeStride AI products. Built with Next.js 14, Supabase, and Claude AI.

## Products covered
- **Atlas EIP** — AI HR platform, LSA compliance
- **LyraAI** — Voice interview coaching
- **EduSense AI** — Education intelligence platform
- **AI Customer Assistant** — Managed 24/7 website chatbot
- **AI Knowledge Assistant** — Internal SOP chatbot
- **OpenClaw** — AI marketing automation

---

## Setup in 4 steps

### Step 1 — Supabase database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open **SQL Editor** in your project dashboard
3. Copy the entire contents of `src/lib/schema.sql` and run it
4. This creates the prospects table, outreach logs, and seeds 8 example companies

Get your keys from **Settings → API**:
- Project URL
- Anon public key
- Service role key (secret)

### Step 2 — Environment variables

Copy the example file and fill in your keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
```

Get your Anthropic key from [console.anthropic.com](https://console.anthropic.com).

### Step 3 — Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Step 4 — Deploy to Vercel

```bash
# Push to GitHub first
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/primestride-pipeline.git
git push -u origin main
```

Then:
1. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
2. Add environment variables (same 4 as `.env.local`)
3. Deploy — you'll get a live URL in ~2 minutes

---

## What's inside

### Pages & panels
| Panel | Description |
|-------|-------------|
| Dashboard | Live stats, hot prospects, product overview, LSA urgency tracker |
| Pipeline board | Kanban view across Found → Outreach → Demo → Pilot → Closed, filterable by product |
| Prospect finder | Enter company details → Claude scores out of 100 → add to pipeline |
| Outreach templates | 9 templates across all products, editable, one-click copy |
| AI assistant | Claude-powered chat with full PrimeStride context + 8 quick-action buttons |

### API routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/score` | POST | Claude scores a prospect out of 100, returns tier + product fit |
| `/api/prospects` | GET/POST/PATCH | CRUD for pipeline prospects |
| `/api/outreach` | POST | Claude AI chat with PrimeStride sales context |

### Database tables
- `prospects` — all companies in your pipeline with scores, stages, product fit
- `outreach_logs` — record of every email/message sent
- `activities` — timeline of actions per prospect

---

## What to add next (authentication)

When you're ready to add your sales team:

```bash
npm install @supabase/auth-helpers-nextjs
```

Use Supabase Auth with email magic links or Google OAuth. Each team member gets their own login. Row-level security in Supabase can scope prospects to the rep who owns them.

---

## Contact

PrimeStride AI  
abdoulie@primestrideai.com  
[primestrideai.com](https://primestrideai.com) | [primestrideatlas.com](https://primestrideatlas.com)
