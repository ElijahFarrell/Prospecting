import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { prospectingWorkflow } from "../workflows/prospecting";
import { addMemory, extractLearningsFromResults, isMem0Configured } from "@/lib/mem0";

const NICHE_HASHTAG_MAP: Record<string, string[]> = {
  fitness: ["fitnessmotivation", "fitnessjourney", "personaltrainer", "weightloss"],
  finance: ["personalfinance", "financialfreedom", "investing", "wealthbuilding"],
  business: ["entrepreneur", "onlinebusiness", "businesscoach", "sidehustle"],
  productivity: ["productivity", "timemanagement", "goalsetting", "selfimprovement"],
  kingdom: ["faithpreneur", "christianentrepreneur", "kingdombusiness"],
  health: ["healthcoach", "holistichealth", "wellnessjourney", "mentalhealth"],
  relationships: ["datingcoach", "relationshipadvice", "marriagecoach"],
};

function getHashtagsForNiche(niche: string): string[] {
  const normalizedNiche = niche.toLowerCase().trim();
  
  for (const [key, hashtags] of Object.entries(NICHE_HASHTAG_MAP)) {
    if (normalizedNiche.includes(key)) {
      return hashtags;
    }
  }
  
  return [normalizedNiche.replace(/\s+/g, "")];
}

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

export const startNicheWorkflowTool = createTool({
  id: "start-niche-workflow",
  description:
    "Start a prospecting workflow for a specific niche. This will search Instagram, analyze creators, and profile qualified leads. Returns prospects with outreach angles.",
  inputSchema: z.object({
    niche: z.string().describe("The niche to search (e.g., 'fitness', 'finance', 'business')"),
    minFollowers: z.number().optional().default(20000).describe("Minimum follower count"),
    maxFollowers: z.number().optional().default(150000).describe("Maximum follower count"),
    targetQualified: z.number().optional().default(3).describe("Target number of qualified creators to find (will over-fetch to hit this target)"),
    searchDepth: z.number().optional().default(30).describe("How many posts to scan from hashtag search (10=quick, 30=standard, 50=deep, 100=exhaustive)"),
  }),
  outputSchema: z.object({
    niche: z.string(),
    totalSearched: z.number(),
    qualified: z.number(),
    disqualified: z.number(),
    skippedExisting: z.number(),
    savedToDb: z.number(),
    prospects: z.array(ProspectOutputSchema),
  }),
  execute: async ({ context, runtimeContext, writer }) => {
    const { niche, minFollowers = 20000, maxFollowers = 150000, targetQualified = 3, searchDepth = 30 } = context;
    
    // Get userId from runtime context for Convex data isolation
    const userId = runtimeContext?.get("userId") as string | undefined;
    
    // Over-fetch: analyze 5x the target to increase chances of hitting qualified count
    const fetchLimit = Math.max(targetQualified * 5, 10);
    
    await writer?.custom({
      type: "workflow-progress",
      stage: "starting",
      message: `Starting prospecting workflow for ${niche} (targeting ${targetQualified} qualified)...`,
      niche,
    });

    const hashtags = getHashtagsForNiche(niche);

    await writer?.custom({
      type: "workflow-progress",
      stage: "searching",
      message: `Searching ${hashtags.length} hashtag${hashtags.length > 1 ? 's' : ''} (${hashtags.map(h => `#${h}`).join(', ')}) for ${niche} creators (analyzing up to ${fetchLimit})...`,
      niche,
      hashtag: hashtags[0], // Keep for backward compatibility
    });

    const run = await prospectingWorkflow.createRunAsync();
    
    const result = await run.start({
      inputData: {
        niche,
        hashtags, // Pass all hashtags for batch search
        minFollowers,
        maxFollowers,
        limit: fetchLimit,
        searchDepth,
        userId, // Pass userId for Convex data isolation
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
    const { prospects, skippedExisting, savedToDb } = workflowResult;
    
    // Separate qualified and disqualified
    const qualifiedProspects = prospects.filter((p) => p.isQualified);
    const disqualifiedProspects = prospects.filter((p) => !p.isQualified);
    
    // Sort by transformation score and take only top `targetQualified`
    const topQualified = qualifiedProspects
      .sort((a, b) => b.transformationScore - a.transformationScore)
      .slice(0, targetQualified);

    await writer?.custom({
      type: "workflow-progress",
      stage: "complete",
      message: `Found ${topQualified.length} qualified creators in ${niche} (analyzed ${prospects.length}${skippedExisting > 0 ? `, skipped ${skippedExisting} existing` : ""})`,
      niche,
      qualified: topQualified.length,
      disqualified: disqualifiedProspects.length,
    });

    // Return top qualified + all disqualified for context
    const returnProspects = [...topQualified, ...disqualifiedProspects];

    // Save learnings to Mem0 if configured and we have a userId
    if (isMem0Configured && topQualified.length > 0 && userId) {
      const learning = extractLearningsFromResults(
        niche,
        topQualified.length,
        disqualifiedProspects.length,
        topQualified.map((p) => `@${p.handle}`),
        topQualified.length > 0 
          ? `Average transformation score: ${(topQualified.reduce((sum, p) => sum + p.transformationScore, 0) / topQualified.length).toFixed(1)}/10`
          : undefined
      );
      
      // Fire and forget - don't block on memory storage (now per-user)
      addMemory(learning, userId, { niche, qualified: topQualified.length }).catch(() => {});
    }

    return {
      niche,
      totalSearched: prospects.length,
      qualified: topQualified.length,
      disqualified: disqualifiedProspects.length,
      skippedExisting,
      savedToDb,
      prospects: returnProspects,
    };
  },
});

