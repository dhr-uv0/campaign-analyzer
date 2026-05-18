# CampaignAnalyzer — Poll Intelligence Platform

A full-stack political campaign poll intelligence platform. Collects Twilio poll responses, surfaces AI-detected voter correlations, and generates strategic memos — with full multi-campaign isolation via Supabase RLS.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: Supabase (Postgres + Row Level Security + Realtime)
- **Auth**: Supabase Auth (email/password)
- **AI**: Anthropic Claude API (`claude-sonnet-4-20250514`)
- **SMS**: Twilio for Politics webhook + CSV import
- **Styling**: Tailwind CSS + custom UI components
- **Charts**: Recharts
- **Deployment**: Vercel (CI/CD from GitHub main)

## Features

- **Multi-tenant**: Each campaign is fully isolated. Users can belong to multiple campaigns and switch between them.
- **Poll Statistics**: Horizontal bar charts per question, filterable respondent table, CSV export, contact slide-over with full poll history.
- **AI Correlations**: Claude identifies cross-question and demographic patterns. Cached in Supabase.
- **Strategic Memos**: Claude writes a full political strategist memo with executive summary, segmentation, messaging, outreach priorities, and risk flags. Exportable as PDF.
- **Twilio Webhook**: Validated webhook endpoint ingests live poll responses.
- **CSV Import**: Bulk import from Twilio exports.
- **Seed Mode**: Dev-only endpoint that populates realistic mock data.

## Setup

### 1. Clone & install

```bash
git clone <your-repo>
cd campaignAnalyzer
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=        # From Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # From Supabase project settings → API
SUPABASE_SERVICE_ROLE_KEY=       # From Supabase project settings → API (keep secret)
TWILIO_ACCOUNT_SID=              # From Twilio console
TWILIO_AUTH_TOKEN=               # From Twilio console
ANTHROPIC_API_KEY=               # From Anthropic console
ENABLE_SEED=false                # Set to "true" only in development
```

### 3. Supabase database setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/migrations/001_initial_schema.sql`
3. Enable email auth under Authentication → Providers → Email

### 4. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Twilio Webhook Configuration

1. Go to Twilio Console → Phone Numbers → your number → Messaging
2. Set the webhook URL to: `https://your-vercel-domain.vercel.app/api/twilio/webhook`
3. Method: `HTTP POST`

The webhook expects these parameters from Twilio for Politics:
- `From`: respondent phone number
- `Body`: their answer text
- `PollId`: your poll UUID (set as a custom parameter in Twilio)
- `QuestionId`: question ID within the poll (optional, defaults to `q1`)

## CSV Import

Send a `multipart/form-data` POST to `/api/import` with a `file` field containing a CSV with these columns:

```
phone,answer,question_id,poll_id,timestamp
+15551234567,Support,q1,<poll-uuid>,2026-05-01T12:00:00Z
```

`timestamp` is optional.

## Development: Seed Data

Set `ENABLE_SEED=true` in `.env.local`, then in Settings click **Seed Mock Data** or POST to:

```bash
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"campaign_id": "<your-campaign-uuid>"}'
```

This creates 3 polls with 200 respondents each and varied demographics.

## Deployment

This project is configured for Vercel. Connect the GitHub repo in the Vercel dashboard and set the environment variables. Every push to `main` triggers an automatic deploy.

```bash
# Install Vercel CLI (optional)
npm i -g vercel
vercel --prod
```

## Project Structure

```
app/
  page.tsx                    # Landing page
  auth/login/                 # Login page
  auth/register/              # Register page
  onboarding/                 # Create/join campaign
  dashboard/
    page.tsx                  # Poll list
    polls/new/                # Create poll form
    polls/[id]/               # Poll report hub (3 tabs)
    contacts/                 # Contact directory
    settings/                 # Campaign settings
  api/
    twilio/webhook/           # Twilio webhook
    import/                   # CSV import
    seed/                     # Dev seed endpoint
    ai/correlations/          # Claude correlations
    ai/insights/              # Claude strategic memo

components/
  ui/                         # Button, Input, Textarea, Badge
  dashboard/                  # Nav, campaign switcher
  polls/                      # Report hub, tabs, slide-over

lib/
  supabase/                   # Browser client, server client, types
  utils.ts                    # cn, maskPhone, formatDate

supabase/migrations/          # SQL schema + RLS policies
```
