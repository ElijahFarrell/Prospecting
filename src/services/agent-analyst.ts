import { generateObject } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { z } from "zod";

const gateway = createGateway();
const GATEWAY_MODEL = "google/gemini-3-pro";

const AnalysisResultSchema = z.object({
  isQualified: z.boolean(),
  isEnglish: z.boolean(),
  transformationScore: z.number().min(1).max(10),
  disqualificationReason: z.string().optional(),
  redFlags: z.array(z.string()),
  summary: z.string(),
});

const ProfileResultSchema = z.object({
  outreachAngle: z.string(),
  monetizationGap: z.string(),
  recentPostSummary: z.string(),
});

interface AnalysisInput {
  bio: string;
  comments: string[];
  stats: {
    followers: number;
    following: number;
    postsCount: number;
    engagementRate: number;
    isVerified: boolean;
    isBusinessAccount: boolean;
  };
}

interface ProfileInput {
  bio: string;
  summary: string;
  niche: string;
}

const ANALYST_PROMPT = `You are the Analyst. Vet this Instagram creator for brand partnerships.

CRITICAL: ENGLISH LANGUAGE CHECK (First Priority)
- Is the bio written primarily in English?
- Set isEnglish = false if bio is in Spanish, Portuguese, Korean, Arabic, or any non-English language.
- If not English, automatically disqualify with reason "Non-English content".

ANALYSIS FRAMEWORK - The 3 Pillars:

1. TRANSFORMATION (40% weight)
   - Does their bio mention a personal journey, results, or teaching?
   - Keywords: "helping", "journey", "transformation", "results", "before/after", "coaching", "tips"
   - Score 1-10 based on transformation evidence

2. AUDIENCE AUTHENTICITY (35% weight)
   - Comment quality: Are comments thoughtful or generic ("🔥", "nice")?
   - Engagement patterns: Real conversations vs. engagement pod behavior
   - Follower/following ratio (suspicious if following > followers * 0.8)

3. DEMOGRAPHICS & FIT (25% weight)
   - Niche alignment with health, wealth, or relationships
   - Tier 1 English-speaking countries preferred (USA, UK, Canada, Australia)

DISQUALIFICATION CRITERIA (Instant Fail):
- NON-ENGLISH content (bio or posts not in English)
- Follower count outside 20,000-150,000 range
- Engagement rate below 1% or above 15% (fake engagement)
- No transformation/educational content visible
- Clear bot/fake follower patterns

CREATOR DATA:
Bio: {bio}

Recent Comments:
{comments}

Statistics:
- Followers: {followers}
- Following: {following}
- Posts: {postsCount}
- Engagement Rate: {engagementRate}%
- Verified: {isVerified}
- Business Account: {isBusinessAccount}

Be critical. Reject borderline cases.`;

const PROFILER_PROMPT = `You are the Profiler. Create a personalized outreach strategy for this qualified creator.

CREATOR INFO:
Niche: {niche}
Bio: {bio}
Analysis Summary: {summary}

OBJECTIVES:

1. MONETIZATION GAP - Look for:
   - No link in bio (opportunity: "help you monetize")
   - Free content only (opportunity: "turn expertise into products")
   - No digital products (opportunity: "info product strategy")

2. OUTREACH ANGLE - Create a personalized hook:
   "[Specific observation about their content] + [Gap identified] + [Specific value proposition]"

3. RECENT POST SUMMARY - Brief summary showing genuine interest

Be specific. Generic outreach gets ignored.`;

function buildAnalystPrompt(input: AnalysisInput): string {
  return ANALYST_PROMPT
    .replace("{bio}", input.bio || "No bio available")
    .replace("{comments}", input.comments.slice(0, 15).join("\n") || "No comments available")
    .replace("{followers}", input.stats.followers.toLocaleString())
    .replace("{following}", input.stats.following.toLocaleString())
    .replace("{postsCount}", input.stats.postsCount.toString())
    .replace("{engagementRate}", input.stats.engagementRate.toFixed(2))
    .replace("{isVerified}", input.stats.isVerified ? "Yes" : "No")
    .replace("{isBusinessAccount}", input.stats.isBusinessAccount ? "Yes" : "No");
}

function buildProfilerPrompt(input: ProfileInput): string {
  return PROFILER_PROMPT
    .replace("{niche}", input.niche)
    .replace("{bio}", input.bio || "No bio available")
    .replace("{summary}", input.summary);
}

export async function analyzeCreatorWithAgent(
  input: AnalysisInput
): Promise<z.infer<typeof AnalysisResultSchema>> {
  const prompt = buildAnalystPrompt(input);

  const result = await generateObject({
    model: gateway(GATEWAY_MODEL),
    schema: AnalysisResultSchema,
    prompt,
  });

  return result.object;
}

export async function profileCreatorWithAgent(
  input: ProfileInput
): Promise<z.infer<typeof ProfileResultSchema>> {
  const prompt = buildProfilerPrompt(input);

  const result = await generateObject({
    model: gateway(GATEWAY_MODEL),
    schema: ProfileResultSchema,
    prompt,
  });

  return result.object;
}

