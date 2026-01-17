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

