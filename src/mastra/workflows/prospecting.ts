import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { searchHashtag, getProfilesBatch } from "@/services/apify";
import { analyzeCreatorWithAgent, profileCreatorWithAgent } from "@/services/agent-analyst";
import { checkExistingHandles, saveProspectsBatch } from "@/lib/convex-queries";

const ProspectSchema = z.object({
  handle: z.string(),
  niche: z.string(),
  followerCount: z.number(),
  followingCount: z.number(),
  postsCount: z.number(),
  engagementRate: z.number(),
  transformationScore: z.number(),
  isQualified: z.boolean(),
  disqualificationReason: z.string().optional(),
  outreachAngle: z.string().optional(),
  monetizationGap: z.string().optional(),
  recentPostSummary: z.string().optional(),
  bio: z.string().optional(),
  profilePicUrl: z.string().optional(),
  isVerified: z.boolean(),
  locationTier: z.string(),
  status: z.string(),
  redFlags: z.array(z.string()).optional(),
});

export type Prospect = z.infer<typeof ProspectSchema>;

/**
 * STEP 1: Scout - Search hashtag OR use provided usernames, then batch fetch profiles
 * OPTIMIZED: Single Apify call for all profiles instead of N calls
 * FLEXIBLE: Can accept either hashtag (for discovery) or usernames array (for lookalikes)
 */
const scoutStep = createStep({
  id: "scout",
  inputSchema: z.object({
    niche: z.string(),
    hashtag: z.string().optional(),
    usernames: z.array(z.string()).optional(),
    minFollowers: z.number().default(20000),
    maxFollowers: z.number().default(150000),
    limit: z.number().default(5),
    searchDepth: z.number().default(30),
  }),
  outputSchema: z.object({
    niche: z.string(),
    candidates: z.array(
      z.object({
        username: z.string(),
        followers: z.number(),
        following: z.number(),
        postsCount: z.number(),
        engagementRate: z.number(),
        bio: z.string(),
        profilePicUrl: z.string(),
        isVerified: z.boolean(),
        isBusinessAccount: z.boolean(),
      })
    ),
    skippedExisting: z.number(),
  }),
  execute: async ({ inputData }) => {
    const { niche, hashtag, usernames: providedUsernames, minFollowers, maxFollowers, limit, searchDepth } = inputData;

    let usernamesToProcess: string[] = [];
    
    // If usernames are directly provided (e.g., from lookalike search), use them
    // Otherwise, search by hashtag
    if (providedUsernames && providedUsernames.length > 0) {
      usernamesToProcess = providedUsernames;
    } else if (hashtag) {
      // 1 Apify call for hashtag search with configurable depth
      const { usernames: hashtagUsernames } = await searchHashtag(hashtag, searchDepth);
      usernamesToProcess = hashtagUsernames;
    } else {
      return { niche, candidates: [], skippedExisting: 0 };
    }
    
    // Deduplication: Check which handles already exist in Convex
    const existingHandles = await checkExistingHandles(usernamesToProcess);
    
    // Filter out existing handles
    const newUsernames = usernamesToProcess.filter((u) => !existingHandles.includes(u));
    const skippedExisting = usernamesToProcess.length - newUsernames.length;
    
    // Take more usernames than limit to account for filtering
    const usernamesToFetch = newUsernames.slice(0, limit * 3);
    
    // 1 Apify call for ALL profiles (batched)
    const profiles = await getProfilesBatch(usernamesToFetch);
    
    const candidates = [];
    for (const [, profile] of profiles) {
      if (candidates.length >= limit) break;
      if (!profile) continue;
      
      // Filter by follower count
      if (profile.followers < minFollowers || profile.followers > maxFollowers) {
        continue;
      }

      candidates.push({
        username: profile.username,
        followers: profile.followers,
        following: profile.following,
        postsCount: profile.postsCount,
        engagementRate: profile.engagementRate,
        bio: profile.bio,
        profilePicUrl: profile.profilePicUrl,
        isVerified: profile.isVerified,
        isBusinessAccount: profile.isBusinessAccount,
      });
    }

    return { niche, candidates, skippedExisting };
  },
});

/**
 * STEP 2: Quick Qualify - LLM analysis based on bio + stats ONLY (no comments)
 * OPTIMIZED: No additional Apify calls, just LLM
 */
const qualifyStep = createStep({
  id: "qualify",
  inputSchema: z.object({
    niche: z.string(),
    candidates: z.array(
      z.object({
        username: z.string(),
        followers: z.number(),
        following: z.number(),
        postsCount: z.number(),
        engagementRate: z.number(),
        bio: z.string(),
        profilePicUrl: z.string(),
        isVerified: z.boolean(),
        isBusinessAccount: z.boolean(),
      })
    ),
    skippedExisting: z.number(),
  }),
  outputSchema: z.object({
    niche: z.string(),
    qualified: z.array(
      z.object({
        username: z.string(),
        followers: z.number(),
        following: z.number(),
        postsCount: z.number(),
        engagementRate: z.number(),
        bio: z.string(),
        profilePicUrl: z.string(),
        isVerified: z.boolean(),
        isQualified: z.boolean(),
        transformationScore: z.number(),
        disqualificationReason: z.string().optional(),
        redFlags: z.array(z.string()),
        summary: z.string(),
      })
    ),
    skippedExisting: z.number(),
  }),
  execute: async ({ inputData }) => {
    const { niche, candidates } = inputData;
    const qualified = [];

    // Run LLM analysis in parallel for speed
    const analysisPromises = candidates.map(async (candidate) => {
      try {
        const analysis = await analyzeCreatorWithAgent({
          bio: candidate.bio,
          comments: [], // No comments in first pass
          stats: {
            followers: candidate.followers,
            following: candidate.following,
            postsCount: candidate.postsCount,
            engagementRate: candidate.engagementRate,
            isVerified: candidate.isVerified,
            isBusinessAccount: candidate.isBusinessAccount,
          },
        });

        return {
          username: candidate.username,
          followers: candidate.followers,
          following: candidate.following,
          postsCount: candidate.postsCount,
          engagementRate: candidate.engagementRate,
          bio: candidate.bio,
          profilePicUrl: candidate.profilePicUrl,
          isVerified: candidate.isVerified,
          isQualified: analysis.isQualified,
          transformationScore: analysis.transformationScore,
          disqualificationReason: analysis.disqualificationReason,
          redFlags: analysis.redFlags,
          summary: analysis.summary,
        };
      } catch {
        return null;
      }
    });

    const results = await Promise.all(analysisPromises);
    
    for (const result of results) {
      if (result) {
        qualified.push(result);
      }
    }

    return { niche, qualified, skippedExisting: inputData.skippedExisting };
  },
});

/**
 * STEP 3: Enrich - Fetch comments ONLY for qualified creators, generate outreach
 * OPTIMIZED: Only 1 Apify call for top qualified creators
 */
const enrichStep = createStep({
  id: "enrich",
  inputSchema: z.object({
    niche: z.string(),
    qualified: z.array(
      z.object({
        username: z.string(),
        followers: z.number(),
        following: z.number(),
        postsCount: z.number(),
        engagementRate: z.number(),
        bio: z.string(),
        profilePicUrl: z.string(),
        isVerified: z.boolean(),
        isQualified: z.boolean(),
        transformationScore: z.number(),
        disqualificationReason: z.string().optional(),
        redFlags: z.array(z.string()),
        summary: z.string(),
      })
    ),
    skippedExisting: z.number(),
  }),
  outputSchema: z.object({
    niche: z.string(),
    prospects: z.array(ProspectSchema),
    skippedExisting: z.number(),
    savedToDb: z.number(),
  }),
  execute: async ({ inputData }) => {
    const { niche, qualified } = inputData;
    const prospects: Prospect[] = [];

    // Separate qualified and disqualified
    const qualifiedCreators = qualified.filter((c) => c.isQualified);
    const disqualifiedCreators = qualified.filter((c) => !c.isQualified);

    // Add disqualified as-is (no further processing)
    for (const creator of disqualifiedCreators) {
      prospects.push({
        handle: creator.username,
        niche,
        followerCount: creator.followers,
        followingCount: creator.following,
        postsCount: creator.postsCount,
        engagementRate: creator.engagementRate,
        transformationScore: creator.transformationScore,
        isQualified: false,
        disqualificationReason: creator.disqualificationReason,
        bio: creator.bio,
        profilePicUrl: creator.profilePicUrl,
        isVerified: creator.isVerified,
        locationTier: "Unknown",
        status: "Disqualified",
        redFlags: creator.redFlags,
      });
    }

    // For qualified creators: generate outreach angles (no extra Apify calls needed)
    const profilePromises = qualifiedCreators.map(async (creator) => {
      try {
        const profile = await profileCreatorWithAgent({
          bio: creator.bio,
          summary: creator.summary,
          niche,
        });

        return {
          handle: creator.username,
          niche,
          followerCount: creator.followers,
          followingCount: creator.following,
          postsCount: creator.postsCount,
          engagementRate: creator.engagementRate,
          transformationScore: creator.transformationScore,
          isQualified: true,
          outreachAngle: profile.outreachAngle,
          monetizationGap: profile.monetizationGap,
          recentPostSummary: profile.recentPostSummary,
          bio: creator.bio,
          profilePicUrl: creator.profilePicUrl,
          isVerified: creator.isVerified,
          locationTier: "Tier 1",
          status: "New",
          redFlags: creator.redFlags,
        } as Prospect;
      } catch {
        return {
          handle: creator.username,
          niche,
          followerCount: creator.followers,
          followingCount: creator.following,
          postsCount: creator.postsCount,
          engagementRate: creator.engagementRate,
          transformationScore: creator.transformationScore,
          isQualified: true,
          bio: creator.bio,
          profilePicUrl: creator.profilePicUrl,
          isVerified: creator.isVerified,
          locationTier: "Unknown",
          status: "New",
          redFlags: creator.redFlags,
        } as Prospect;
      }
    });

    const qualifiedProspects = await Promise.all(profilePromises);
    prospects.push(...qualifiedProspects);

    // Save all prospects to Convex
    const savedToDb = await saveProspectsBatch(
      prospects.map((p) => ({
        handle: p.handle,
        niche: p.niche,
        followerCount: p.followerCount,
        followingCount: p.followingCount,
        postsCount: p.postsCount,
        engagementRate: p.engagementRate,
        transformationScore: p.transformationScore,
        isQualified: p.isQualified,
        disqualificationReason: p.disqualificationReason,
        outreachAngle: p.outreachAngle,
        monetizationGap: p.monetizationGap,
        recentPostSummary: p.recentPostSummary,
        bio: p.bio,
        profilePicUrl: p.profilePicUrl,
        isVerified: p.isVerified,
        locationTier: p.locationTier,
        status: p.status,
        redFlags: p.redFlags,
      }))
    );

    return { niche, prospects, skippedExisting: inputData.skippedExisting, savedToDb };
  },
});

export const prospectingWorkflow = createWorkflow({
  id: "prospecting-workflow",
  inputSchema: z.object({
    niche: z.string(),
    hashtag: z.string().optional(),
    usernames: z.array(z.string()).optional(),
    minFollowers: z.number().default(20000),
    maxFollowers: z.number().default(150000),
    limit: z.number().default(5),
    searchDepth: z.number().default(30),
  }),
  outputSchema: z.object({
    niche: z.string(),
    prospects: z.array(ProspectSchema),
    skippedExisting: z.number(),
    savedToDb: z.number(),
  }),
})
  .then(scoutStep)
  .then(qualifyStep)
  .then(enrichStep);

prospectingWorkflow.commit();
