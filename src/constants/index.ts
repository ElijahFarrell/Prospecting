// ============================================================================
// API & Service Configuration
// ============================================================================

export const FOLLOWER_RANGE = {
  MIN: 1000,
  MAX: 100000,
} as const;

export const APIFY_ACTORS = {
  FAST_SCRAPER: "apidojo/instagram-scraper-api",
  PROFILE_SCRAPER: "apify/instagram-profile-scraper", // Dedicated profile scraper with postsCount
  COMMENT_SCRAPER: "apify/instagram-comment-scraper", // For fetching comments
} as const;

export const ANALYSIS_CONFIG = {
  COMMENTS_TO_FETCH: 15,
  POSTS_TO_FETCH: 10,
  INTENT_SCORE_THRESHOLD: {
    HIGH: 7,
    LOW: 4,
  },
} as const;

// Vercel AI Gateway model IDs (vercel/<provider>/<model>)
export const MODELS = {
  FAST: "vercel/google/gemini-3-flash",
  DEEP: "vercel/google/gemini-3-pro",
} as const;

// Tavily configuration constants
export const TAVILY_CONFIG = {
  SEARCH_DEPTH: {
    BASIC: "basic",
    ADVANCED: "advanced",
  } as const,
  TOPIC: {
    GENERAL: "general",
    NEWS: "news",
    FINANCE: "finance",
  } as const,
  FORMAT: {
    MARKDOWN: "markdown",
    TEXT: "text",
  } as const,
  DEFAULT_MAX_RESULTS: 5,
} as const;

// ============================================================================
// UI Constants
// ============================================================================

export const SEARCH_DEPTH_OPTIONS = [
  { value: 10, label: "Quick" },
  { value: 30, label: "Standard" },
  { value: 50, label: "Deep" },
  { value: 100, label: "Exhaustive" },
] as const;

export const CREATOR_LIMIT_OPTIONS = [3, 5, 10, 15, 20] as const;

export const STATUS_OPTIONS = [
  { value: "New", label: "New", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "Qualified", label: "Qualified", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "Outreached", label: "Outreached", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "In Discussion", label: "In Discussion", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "Closed", label: "Closed", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
] as const;

// ============================================================================
// Business Logic Constants
// ============================================================================

export const NICHE_HASHTAG_MAP: Record<string, string[]> = {
  fitness: ["fitnessmotivation", "fitnessjourney", "personaltrainer", "weightloss"],
  finance: ["personalfinance", "financialfreedom", "investing", "wealthbuilding"],
  business: ["entrepreneur", "onlinebusiness", "businesscoach", "sidehustle"],
  productivity: ["productivity", "timemanagement", "goalsetting", "selfimprovement"],
  kingdom: ["faithpreneur", "christianentrepreneur", "kingdombusiness"],
  health: ["healthcoach", "holistichealth", "wellnessjourney", "mentalhealth"],
  relationships: ["datingcoach", "relationshipadvice", "marriagecoach"],
} as const;

export const WORKFLOW_DURATION_NOTICE = "This workflow typically takes 5-10 minutes for comprehensive results" as const;

