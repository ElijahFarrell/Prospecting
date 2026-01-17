# Creator Scout

AI-powered Instagram creator prospecting engine built with Next.js 15, Mastra workflows, and Gemini.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **AI Agent:** Mastra Agent Framework (v1)
- **AI Models:** Google Gemini (via Vercel AI Gateway)
- **Database:** Convex (real-time backend)
- **Data Source:** Apify Instagram scrapers
- **UI:** Tailwind CSS + shadcn/ui
- **Validation:** Zod

## Architecture

```
User Request
     │
     ▼
┌────────────────┐
│  Orchestrator  │  (Chat Interface)
│     Agent      │
└───────┬────────┘
        │ triggers
        ▼
┌────────────────────────────────────┐
│       Prospecting Workflow         │
│  ┌──────┐  ┌─────────┐  ┌────────┐│
│  │Scout │→ │ Analyst │→ │Profiler││
│  │(Apify)│  │(Qualify)│  │(Angles)││
│  └──────┘  └─────────┘  └────────┘│
└────────────────┬───────────────────┘
                 │
                 ▼
         ┌─────────────┐
         │   Convex    │
         │  Database   │
         └─────────────┘
```

### Agents

1. **Orchestrator** - Routes user requests, manages workflows, summarizes results
2. **Scout** - Searches Instagram hashtags, filters by follower count
3. **Analyst** - Evaluates creators on 3 pillars: Transformation, Authenticity, Demographics
4. **Profiler** - Creates personalized outreach angles and identifies monetization gaps

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Vercel AI Gateway key
- Apify API token
- Convex account (free tier available)

### Installation

```bash
pnpm install
```

### Environment Setup

Create a `.env.local` file:

```env
# Vercel AI Gateway - single key for all AI models
VERCEL_API_KEY=your-vercel-api-key

# Apify for Instagram data
APIFY_API_TOKEN=your-apify-token

# Convex (auto-populated after convex dev)
CONVEX_DEPLOYMENT=your-deployment-id
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### Convex Setup

Initialize Convex (first time only):

```bash
npx convex dev
```

This will:
1. Create a Convex project (follow prompts)
2. Generate type definitions in `convex/_generated`
3. Deploy your schema and functions

### Development

```bash
pnpm dev
```

In a separate terminal, run Convex dev server:

```bash
npx convex dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Features

- **Natural Language Search:** Describe what creators you want in plain English
- **Multi-Niche Support:** Search Finance, Fitness, Business, Productivity, and more
- **3-Pillar Analysis:** Transformation, Audience Authenticity, Demographics
- **Personalized Outreach:** AI-generated hooks based on creator content
- **Streaming Progress:** Real-time progress as workflows execute
- **Convex Persistence:** Qualified leads saved to real-time database
- **Chat History:** Persistent conversation threads stored in Convex
- **Prospects Panel:** Live-updating sidebar showing all discovered creators
- **Search Configuration:** Adjustable search depth and creator limits
- **Deduplication:** Automatically skips creators already in your database
- **API Test Console:** Test individual Apify APIs with prefilled inputs
- **Debug Console:** Monitor all API calls, tool executions, and agent activity

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/          # AI chat endpoint (Orchestrator)
│   │   └── test/          # API testing endpoints
│   ├── debug/             # Debug console page
│   ├── test/              # API test console page
│   └── page.tsx           # Main dashboard
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── chat.tsx           # Chat interface with search config
│   ├── chat-history.tsx   # Thread sidebar
│   ├── prospects-panel.tsx # Qualified creators sidebar
│   ├── convex-provider.tsx # Convex React provider
│   ├── creator-card.tsx
│   └── scout-progress.tsx
├── lib/
│   ├── convex-client.ts   # Server-side Convex HTTP client
│   └── convex-queries.ts  # Typed Convex query wrappers
├── mastra/
│   ├── agents/            # Orchestrator, Analyst, Profiler, Scout
│   ├── workflows/         # Prospecting workflow (with dedup & persistence)
│   └── tools/             # Workflow triggers
├── services/
│   ├── agent-analyst.ts   # Analyst/Profiler LLM calls
│   └── apify.ts           # Instagram scraping (batched)
└── types/
    └── index.ts           # Zod schemas and types

convex/
├── schema.ts              # Database schema (prospects, threads, messages)
├── prospects.ts           # Prospect mutations and queries
├── chats.ts               # Chat history mutations and queries
└── _generated/            # Auto-generated types (run npx convex dev)
```

## Prospect Schema

Each creator is stored with:

```typescript
{
  handle: string,
  niche: string,
  followerCount: number,
  followingCount: number,
  postsCount: number,
  engagementRate: number,
  transformationScore: number,  // 1-10
  isQualified: boolean,
  disqualificationReason?: string,
  outreachAngle?: string,
  monetizationGap?: string,
  recentPostSummary?: string,
  bio?: string,
  profilePicUrl?: string,
  isVerified: boolean,
  locationTier: string,
  status: string,  // "New", "Contacted", "Replied", "Disqualified"
  redFlags?: string[],
  createdAt: number,
  updatedAt: number
}
```

## Supported Niches

- Fitness (weightlifting, weight loss, personal training)
- Finance (personal finance, investing, wealth building)
- Business (online business, consulting, agencies)
- Productivity (time management, goal setting)
- Kingdom Entrepreneurship (faith-based business)
- Health (wellness, mental health, holistic)
- Relationships (dating, marriage coaching)

## Pages

- **/** - Main dashboard with chat, thread history sidebar, and prospects panel
- **/test** - API test console for testing Apify APIs
- **/debug** - API calls, tool executions, performance stats

## Search Configuration

The chat interface includes adjustable search settings:

| Setting | Options | Description |
|---------|---------|-------------|
| Search Depth | 10, 30, 50, 100 | Number of hashtag posts to scan |
| Creator Limit | 3, 5, 10, 15, 20 | Max creators to analyze per niche |

Higher values find more creators but take longer.
