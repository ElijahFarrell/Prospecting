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
    variations: z.array(z.string()).length(2),
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
  niche: string;
  bio: string;
  outreachAngle: string;
  monetizationGap?: string;
  recentPostSummary?: string;
}

const MESSAGE_PROMPT = `# ROLE:

You are an expert Cold Outreach Copywriter specializing in Instagram DMs. Your goal is to craft high-converting opening messages that get read and replied to.

# THE STRATEGY (THE ETHOS):

You will generate scripts based on two distinct psychological approaches. You must understand the "Ethos" behind each before writing:

**Method A: The "Direct Value" Approach (Reciprocity)**

*   **The Ethos:** Radical transparency. We respect the prospect's intelligence by stating our intent immediately, but we lower resistance by asking *permission* to give value first.

*   **The Hook:** "I already did the work." By claiming you have already created a custom asset (video/audit) for them, you trigger a psychological debt (reciprocity) and curiosity.

*   **Key Elements:** Specificity (mention their niche), Permission Ask ("Can I send?"), and Tangible Outcome ($$$).

**Method B: The "Trojan Horse" Approach (Pattern Interrupt)**

*   **The Ethos:** Camouflage. High-value creators ignore long DMs. We must look like a potential *customer* or a regular fan to bypass the "Request" folder and get into the "Primary" inbox.

*   **The Hook:** Ambiguity. A short, vague question forces them to open the message to understand the context.

*   **Key Elements:** Brevity (<50 characters), Lowercase (casual), and Contextual (related to their story/bio).

---

# TASK:

I will provide you with a **Target Niche** and creator information. You will generate the following 3 outreach assets:

## 1. Method A Scripts (Direct Value)

Write 2 variations of the "Permission Ask" script.

*   **Must include:** A request to send a "4-minute video" or "custom audit" made specifically for them.
*   **Must include:** A specific revenue/growth promise relevant to their niche.
*   **Style:** Direct, transparent, respectful of their intelligence.

## 2. Method B Scripts (Trojan Horse)

Write 3 variations of the "Opener."

*   **Constraint:** Must be under 50 characters.
*   **Style:** Casual, looks like a potential client asking a question.
*   **The Pivot:** Write the *second* message for when they reply "Yes/Sure." This message must bridge the gap from the casual opener to offering the audit/video.

## 3. The "Value Asset" Description

Briefly describe what the "4-minute video" or "Audit" should actually contain for this specific niche so the offer sounds legitimate.

---

# INPUT:

**Target Niche:** {niche}

**Creator Bio:** {bio}

**Outreach Angle:** {outreachAngle}

**Monetization Gap:** {monetizationGap}

**Recent Post Summary:** {recentPostSummary}

---

# OUTPUT REQUIREMENTS:

1. **Method A Variations (2 scripts):**
   - Each should be 2-4 sentences
   - Include permission ask ("Can I send you...?")
   - Mention specific asset (video/audit)
   - Include revenue/growth promise
   - Reference their niche and specific details from bio

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
   - One for Method A context
   - One for Method B context
   - Should be specific to the niche
   - Make the offer sound legitimate and valuable
   - 2-3 sentences each

---

# CRITICAL RULES:

- Personalize every message with specific details from bio
- Method A: Be direct but respectful
- Method B: Keep openers vague and casual
- Never sound salesy or pushy
- Make the value asset sound legitimate and specific
- Reference their actual niche and content`;

function buildMessagePrompt(input: MessageGenerationInput): string {
  return MESSAGE_PROMPT
    .replace("{niche}", input.niche)
    .replace("{bio}", input.bio || "No bio available")
    .replace("{outreachAngle}", input.outreachAngle || "No specific angle identified")
    .replace("{monetizationGap}", input.monetizationGap || "No specific gap identified")
    .replace("{recentPostSummary}", input.recentPostSummary || "No recent post summary available");
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

