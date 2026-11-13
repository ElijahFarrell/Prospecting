import { generateObject } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { CreatorAnalysisSchema, type CreatorAnalysis } from "@/types";

// Vercel AI Gateway reads AI_GATEWAY_API_KEY.
const gateway = createGateway();

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

const ANALYSIS_PROMPT = `You are an expert brand partnership analyst. Analyze this Instagram creator for potential brand collaboration.

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

ANALYSIS CRITERIA:

1. TRANSFORMATION CONTENT: Look for evidence of personal transformation, journey-based content, or educational/inspirational themes in the bio. Keywords: journey, transformation, results, before/after, coaching, tips, guide, helping.

2. ENGAGEMENT AUTHENTICITY: Analyze comments for:
   - Genuine engagement (thoughtful responses, questions, personal stories)
   - Bot indicators (generic praise, emoji-only, repetitive patterns)
   - Engagement pod behavior (same accounts commenting repeatedly)

3. RED FLAGS: Identify concerning patterns:
   - Follower/following ratio anomalies
   - Low engagement for follower count
   - Suspicious comment patterns
   - Empty or spam-like bio

4. INTENT SCORE (1-10):
   - 9-10: Highly qualified, authentic engagement, strong transformation narrative
   - 7-8: Good potential, mostly authentic, relevant content
   - 5-6: Mixed signals, needs more investigation
   - 3-4: Concerning patterns, low authenticity
   - 1-2: Clear red flags, likely fake engagement

Provide a thorough but concise analysis. Be critical and evidence-based.`;

function buildPrompt(input: AnalysisInput): string {
  return ANALYSIS_PROMPT.replace("{bio}", input.bio || "No bio available")
    .replace("{comments}", input.comments.slice(0, 15).join("\n") || "No comments available")
    .replace("{followers}", input.stats.followers.toLocaleString())
    .replace("{following}", input.stats.following.toLocaleString())
    .replace("{postsCount}", input.stats.postsCount.toString())
    .replace("{engagementRate}", input.stats.engagementRate.toFixed(2))
    .replace("{isVerified}", input.stats.isVerified ? "Yes" : "No")
    .replace("{isBusinessAccount}", input.stats.isBusinessAccount ? "Yes" : "No");
}

// Gateway models don't need the "vercel/" prefix - just provider/model
const GATEWAY_MODELS = {
  FAST: "google/gemini-3-flash",
  DEEP: "google/gemini-3-pro",
} as const;

export async function analyzeCreator(
  input: AnalysisInput,
  useDeepAnalysis = false
): Promise<CreatorAnalysis> {
  const model = useDeepAnalysis ? GATEWAY_MODELS.DEEP : GATEWAY_MODELS.FAST;
  const prompt = buildPrompt(input);

  const result = await generateObject({
    model: gateway(model),
    schema: CreatorAnalysisSchema,
    prompt,
  });

  return result.object;
}
