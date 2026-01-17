import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getSuggestedUsers, findSimilarByHashtags } from "@/services/apify";
import { prospectingWorkflow } from "../workflows/prospecting";

const ProspectOutputSchema = z.object({
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

export const findLookalikesTool = createTool({
  id: "find-lookalikes",
  description:
    "Find creators similar to a qualified prospect. Use this after finding a good match to discover more creators with similar audiences and content styles.",
  inputSchema: z.object({
    sourceUsername: z.string().describe("The Instagram username of the qualified creator to find lookalikes for"),
    niche: z.string().describe("The niche category (e.g., 'fitness', 'finance', 'business')"),
    minFollowers: z.number().optional().default(20000).describe("Minimum follower count"),
    maxFollowers: z.number().optional().default(150000).describe("Maximum follower count"),
    targetQualified: z.number().optional().default(3).describe("Target number of qualified creators to find"),
  }),
  outputSchema: z.object({
    sourceUsername: z.string(),
    niche: z.string(),
    similarFound: z.number(),
    qualified: z.number(),
    disqualified: z.number(),
    prospects: z.array(ProspectOutputSchema),
  }),
  execute: async ({ context, writer }) => {
    const { sourceUsername, niche, minFollowers = 20000, maxFollowers = 150000, targetQualified = 3 } = context;

    await writer?.custom({
      type: "workflow-progress",
      stage: "starting",
      message: `Finding creators similar to @${sourceUsername}...`,
      niche,
    });

    // Try to get Instagram's suggested users first
    let similarUsernames = await getSuggestedUsers(sourceUsername);
    
    await writer?.custom({
      type: "workflow-progress",
      stage: "searching",
      message: similarUsernames.length > 0 
        ? `Found ${similarUsernames.length} suggested accounts from Instagram`
        : `No direct suggestions, searching ${niche} hashtag...`,
      niche,
    });

    // If no suggestions, fall back to hashtag-based search
    if (similarUsernames.length === 0) {
      similarUsernames = await findSimilarByHashtags(sourceUsername, niche, targetQualified * 5);
    }

    if (similarUsernames.length === 0) {
      return {
        sourceUsername,
        niche,
        similarFound: 0,
        qualified: 0,
        disqualified: 0,
        prospects: [],
      };
    }

    await writer?.custom({
      type: "workflow-progress",
      stage: "analyzing",
      message: `Analyzing ${similarUsernames.length} similar creators...`,
      niche,
    });

    // Over-fetch to increase chances of hitting qualified target
    const fetchLimit = Math.max(targetQualified * 5, 10);

    // Run the prospecting workflow with the discovered usernames
    const run = await prospectingWorkflow.createRunAsync();
    
    const result = await run.start({
      inputData: {
        niche,
        usernames: similarUsernames.slice(0, fetchLimit),
        minFollowers,
        maxFollowers,
        limit: fetchLimit,
        searchDepth: 30, // Not used when usernames are provided directly
      },
    });

    if (result.status !== "success") {
      throw new Error(`Workflow failed: ${result.status}`);
    }

    const workflowResult = result.result as { 
      niche: string; 
      prospects: z.infer<typeof ProspectOutputSchema>[];
      skippedExisting: number;
      savedToDb: number;
    };
    const { prospects } = workflowResult;

    // Separate and sort qualified prospects
    const qualifiedProspects = prospects
      .filter((p) => p.isQualified)
      .sort((a, b) => b.transformationScore - a.transformationScore)
      .slice(0, targetQualified);
    
    const disqualifiedProspects = prospects.filter((p) => !p.isQualified);

    await writer?.custom({
      type: "workflow-progress",
      stage: "complete",
      message: `Found ${qualifiedProspects.length} qualified creators similar to @${sourceUsername}`,
      niche,
      qualified: qualifiedProspects.length,
      disqualified: disqualifiedProspects.length,
    });

    return {
      sourceUsername,
      niche,
      similarFound: similarUsernames.length,
      qualified: qualifiedProspects.length,
      disqualified: disqualifiedProspects.length,
      prospects: [...qualifiedProspects, ...disqualifiedProspects],
    };
  },
});

