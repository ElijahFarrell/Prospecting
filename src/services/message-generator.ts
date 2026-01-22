import { generateObject } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { z } from "zod";

const gateway = createGateway();

// Gateway models don't need the "vercel/" prefix - just provider/model
const GATEWAY_MODELS = {
  FAST: "google/gemini-3-flash",
  DEEP: "google/gemini-3-pro",
} as const;

const MessageVariationsSchema = z.object({
  methodA: z.object({
    variations: z.array(z.string()).length(3), // Updated to 3 variations
    valueAssetDescription: z.string(),
  }),
  methodB: z.object({
    openers: z.array(z.string()).length(3),
    pivotMessage: z.string(),
    valueAssetDescription: z.string(),
  }),
});

export type MessageVariations = z.infer<typeof MessageVariationsSchema>;

interface MessageGenerationInput {
  handle: string;
  niche: string;
  bio: string;
  outreachAngle: string;
  monetizationGap?: string;
  recentPostSummary?: string;
  followerCount?: number;
  engagementRate?: number;
  transformationScore?: number;
  postsCount?: number;
}

const MESSAGE_PROMPT = `# ROLE:

You are a specialist in "Direct Value" Outreach Strategy. Your sole focus is crafting high-conversion "Permission-Based" DM scripts that leverage the psychology of reciprocity and hyper-personalization.

# THE STRATEGY (THE ETHOS):

You will generate scripts based on two distinct psychological approaches. You must understand the "Ethos" behind each before writing:

**Method A: The "Direct Value" Approach (Reciprocity) - DEEP DIVE**

You are not writing "cold sales pitches." You are writing "delivery notifications."

The core philosophy of Method A is **The Pre-Work Bluff**.

1. **Hyper-Personalization:** Never say "for your niche." Always say "for YOU," "for YOUR profile," or "for YOUR business." The prospect must believe this asset cannot be sent to anyone else.

2. **Reciprocity:** We must imply that we have *already* invested time into the prospect before asking for anything. This creates a psychological debt.

3. **Permission-Based:** We never send a link uninvited. We ask for *permission* to send a free asset. This lowers resistance.

4. **The "Result" Focus:** The DM does NOT list their mistakes. It only promises a positive outcome (Revenue, Growth, Clarity). The "mistakes" are revealed inside the video, not the text.

**THE FORMULA:**

Every script you generate must follow this structure:

1. **Personal Greeting:** (Hey [Name])

2. **The "I Made This" Hook:** State clearly that you have *already created* a specific asset **specifically for them**.

3. **The Benefit:** What problem does this asset solve? (Revenue, Time, Clarity).

4. **The Permission Ask:** A simple Yes/No question asking if you can send it over.

**EXAMPLES OF HIGH-QUALITY SCRIPTS:**

*Study these examples to understand the tone:*

*   **Example 1 (The "Revenue" Angle):**

    "Hey [Name], big fan of your content. I actually just recorded a quick 2-min video breakdown **specifically for you** on how you could add an extra $5k/mo to **your current setup** without posting more. I have it ready to go—mind if I send it over?"

*   **Example 2 (The "Launch" Angle):**

    "Hey [Name]. I made a 4-minute video specifically for you on how you can launch your own online program using your **[Specific Skill]** skills and how you can make 5 figures per month revenue from it. Can I send it over?"

*   **Example 3 (The "Roadmap" Angle):**

    "Hey [Name], love the recent reel. I actually mapped out a quick 'Monetization Roadmap' **specifically for your account** that I think would work really well for **your audience size**. Recorded a 2-min loom walking through it. Cool if I drop it here?"

**Method B: The "Trojan Horse" Approach (Pattern Interrupt)**

*   **The Ethos:** Camouflage. High-value creators ignore long DMs. We must look like a potential *customer* or a regular fan to bypass the "Request" folder and get into the "Primary" inbox.

*   **The Hook:** Ambiguity. A short, vague question forces them to open the message to understand the context.

*   **Key Elements:** Brevity (<50 characters), Lowercase (casual), and Contextual (related to their story/bio).

---

# TASK:

I will provide you with Instagram creator information. You will generate:

## 1. Method A Scripts (Direct Value)

Generate **3 Distinct Script Variations** using the formula above.

*   **Variation 1:** Focus on Revenue Potential (Personalized to them).
*   **Variation 2:** Focus on "Leveraging their Skill" (Launch style).
*   **Variation 3:** Focus on "Efficiency/Systems" (Roadmap style).

Each script must:
- Follow the 4-part formula (Greeting, Hook, Benefit, Permission Ask)
- Use hyper-personalization ("for YOU", "for YOUR profile", "for YOUR business")
- Imply pre-work has been done ("I made", "I recorded", "I mapped out")
- Focus on positive outcomes (Revenue, Growth, Clarity) - NOT their mistakes
- Ask for permission to send

## 2. Method B Scripts (Trojan Horse)

Write 3 variations of the "Opener."

*   **Constraint:** Must be under 50 characters.
*   **Style:** Casual, looks like a potential client asking a question.
*   **The Pivot:** Write the *second* message for when they reply "Yes/Sure." This message must bridge the gap from the casual opener to offering the audit/video.

## 3. The Asset Definition

For Method A: Describe exactly what the "2-Minute Video" should contain for this specific target so I know what to record. (e.g., "Review their Link-in-Bio," "Critique their pinned posts," "Analyze their content strategy," etc.)

For Method B: Describe what the audit/video should contain in the context of the pivot message.

---

# INPUT:

**Creator Handle:** @{handle}

**Target Niche:** {niche}

**Creator Bio:** {bio}

**Outreach Angle:** {outreachAngle}

**Monetization Gap:** {monetizationGap}

**Recent Post Summary:** {recentPostSummary}

**Creator Stats:**
- Followers: {followerCount}
- Engagement Rate: {engagementRate}%
- Transformation Score: {transformationScore}/10
- Posts Count: {postsCount}

---

# OUTPUT REQUIREMENTS:

1. **Method A Variations (3 scripts):**
   - Variation 1: Revenue Potential angle
   - Variation 2: Leveraging their Skill (Launch) angle
   - Variation 3: Efficiency/Systems (Roadmap) angle
   - Each should be 2-4 sentences
   - Must follow the 4-part formula
   - Use "for YOU" language, not "for your niche"
   - Focus on positive outcomes, not mistakes

2. **Method B Openers (3 scripts):**
   - Each must be under 50 characters
   - Casual, lowercase style
   - Vague question that relates to their bio/story
   - Should look like a potential customer inquiry

3. **Method B Pivot Message (1 script):**
   - Sent after they reply "Yes/Sure" to opener
   - Bridges from casual opener to value offer
   - 2-3 sentences
   - Introduces the audit/video offer naturally

4. **Value Asset Description (2 descriptions):**
   - One for Method A: Specific description of what the 2-minute video should contain
   - One for Method B: Description for the pivot message context
   - Should be specific and actionable
   - 2-3 sentences each

---

# CRITICAL RULES:

- Personalize every message with specific details from bio, stats, and content
- Method A: Use "for YOU" language, imply pre-work done, focus on positive outcomes
- Method B: Keep openers vague and casual
- Never sound salesy or pushy
- Never list their mistakes in the DM - only promise positive outcomes
- Make the value asset sound legitimate and specific
- Reference their actual handle, niche, follower count, and content`;

function buildMessagePrompt(input: MessageGenerationInput): string {
  return MESSAGE_PROMPT
    .replace("{handle}", input.handle)
    .replace("{niche}", input.niche)
    .replace("{bio}", input.bio || "No bio available")
    .replace("{outreachAngle}", input.outreachAngle || "No specific angle identified")
    .replace("{monetizationGap}", input.monetizationGap || "No specific gap identified")
    .replace("{recentPostSummary}", input.recentPostSummary || "No recent post summary available")
    .replace("{followerCount}", input.followerCount ? input.followerCount.toLocaleString() : "N/A")
    .replace("{engagementRate}", input.engagementRate ? input.engagementRate.toFixed(1) : "N/A")
    .replace("{transformationScore}", input.transformationScore ? input.transformationScore.toString() : "N/A")
    .replace("{postsCount}", input.postsCount ? input.postsCount.toString() : "N/A");
}

export async function generateDMMessageVariations(
  input: MessageGenerationInput
): Promise<MessageVariations> {
  const prompt = buildMessagePrompt(input);

  const result = await generateObject({
    model: gateway(GATEWAY_MODELS.DEEP), // Use Pro model for better copywriting
    schema: MessageVariationsSchema,
    prompt,
  });

  // Validate Method B openers are under 50 characters
  const validated = {
    ...result.object,
    methodB: {
      ...result.object.methodB,
      openers: result.object.methodB.openers.map((opener) => {
        if (opener.length > 50) {
          // Truncate if over limit (shouldn't happen with good prompt, but safety check)
          return opener.substring(0, 47) + "...";
        }
        return opener;
      }),
    },
  };

  return validated;
}

