import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { searchHashtag, getCreatorData } from "@/services/apify";
import { analyzeCreator } from "@/services/ai-analyst";
import { FOLLOWER_RANGE } from "@/constants";

const CreatorResultSchema = z.object({
  username: z.string(),
  followers: z.number(),
  engagementRate: z.number(),
  bio: z.string(),
  profilePicUrl: z.string(),
  isVerified: z.boolean(),
  isQualified: z.boolean(),
  intentScore: z.number(),
  summary: z.string(),
  redFlags: z.array(z.string()),
  transformationDetected: z.boolean(),
});

export type CreatorResult = z.infer<typeof CreatorResultSchema>;

export const scoutCreatorsTool = createTool({
  id: "scout-creators",
  description:
    "Search Instagram for creators by hashtag, filter by follower count, and analyze them for brand partnership potential. Returns qualified creators with AI-powered analysis.",
  inputSchema: z.object({
    hashtag: z.string().describe("The hashtag to search (without #)"),
    minFollowers: z
      .number()
      .optional()
      .default(FOLLOWER_RANGE.MIN)
      .describe("Minimum follower count"),
    maxFollowers: z
      .number()
      .optional()
      .default(FOLLOWER_RANGE.MAX)
      .describe("Maximum follower count"),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe("Maximum number of creators to analyze"),
  }),
  outputSchema: z.object({
    hashtag: z.string(),
    totalDiscovered: z.number(),
    totalFiltered: z.number(),
    totalAnalyzed: z.number(),
    qualified: z.number(),
    creators: z.array(CreatorResultSchema),
  }),
  execute: async ({ context, writer }) => {
    const { hashtag, minFollowers, maxFollowers, limit } = context;
    const min = minFollowers ?? FOLLOWER_RANGE.MIN;
    const max = maxFollowers ?? FOLLOWER_RANGE.MAX;
    const maxAnalyze = limit ?? 5;

    await writer?.custom({
      type: "scout-progress",
      stage: "searching",
      message: `Searching #${hashtag}...`,
    });

    const { usernames } = await searchHashtag(hashtag);

    await writer?.custom({
      type: "scout-progress",
      stage: "discovered",
      message: `Found ${usernames.length} creators`,
      count: usernames.length,
    });

    const creators: CreatorResult[] = [];
    let analyzed = 0;
    let filtered = 0;

    for (const username of usernames) {
      if (analyzed >= maxAnalyze) break;

      await writer?.custom({
        type: "scout-progress",
        stage: "fetching",
        message: `Fetching @${username}...`,
        current: analyzed + 1,
        total: Math.min(usernames.length, maxAnalyze),
      });

      try {
        const { profile, comments } = await getCreatorData(username);
        if (!profile) continue;

        if (profile.followers < min || profile.followers > max) {
          filtered++;
          continue;
        }

        await writer?.custom({
          type: "scout-progress",
          stage: "analyzing",
          message: `Analyzing @${username}...`,
          current: analyzed + 1,
          total: Math.min(usernames.length, maxAnalyze),
          creator: {
            username: profile.username,
            followers: profile.followers,
            profilePicUrl: profile.profilePicUrl,
          },
        });

        const analysis = await analyzeCreator({
          bio: profile.bio,
          comments: comments.map((c) => c.text),
          stats: {
            followers: profile.followers,
            following: profile.following,
            postsCount: profile.postsCount,
            engagementRate: profile.engagementRate,
            isVerified: profile.isVerified,
            isBusinessAccount: profile.isBusinessAccount,
          },
        });

        const result: CreatorResult = {
          username: profile.username,
          followers: profile.followers,
          engagementRate: profile.engagementRate,
          bio: profile.bio,
          profilePicUrl: profile.profilePicUrl,
          isVerified: profile.isVerified,
          isQualified: analysis.isQualified,
          intentScore: analysis.intentScore,
          summary: analysis.summary,
          redFlags: analysis.redFlags,
          transformationDetected: analysis.transformationDetected,
        };

        creators.push(result);
        analyzed++;

        await writer?.custom({
          type: "scout-progress",
          stage: "analyzed",
          message: `Analyzed @${username}`,
          creator: result,
        });
      } catch {
        continue;
      }
    }

    await writer?.custom({
      type: "scout-progress",
      stage: "complete",
      message: `Scouting complete`,
      results: {
        total: usernames.length,
        analyzed,
        qualified: creators.filter((c) => c.isQualified).length,
      },
    });

    return {
      hashtag,
      totalDiscovered: usernames.length,
      totalFiltered: filtered,
      totalAnalyzed: analyzed,
      qualified: creators.filter((c) => c.isQualified).length,
      creators: creators.sort((a, b) => b.intentScore - a.intentScore),
    };
  },
});

