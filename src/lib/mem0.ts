import MemoryClient from "mem0ai";

// Initialize Mem0 client
const mem0ApiKey = process.env.MEM0_API_KEY;

let memoryClient: MemoryClient | null = null;

if (mem0ApiKey) {
  memoryClient = new MemoryClient({ apiKey: mem0ApiKey });
}

export const isMem0Configured = !!mem0ApiKey;

export interface Memory {
  id: string;
  memory: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

/**
 * Add a new memory about prospecting learnings
 * Each memory is tied to a specific user for multi-tenancy
 */
export async function addMemory(
  content: string,
  userId: string,
  metadata?: Record<string, unknown>
): Promise<Memory | null> {
  if (!memoryClient) {
    console.warn("Mem0 not configured - skipping memory storage");
    return null;
  }

  if (!userId) {
    console.warn("No userId provided - skipping memory storage");
    return null;
  }

  try {
    // Mem0 expects an array of messages in chat format
    const messages = [
      { role: "user" as const, content: `Remember this learning: ${content}` },
      { role: "assistant" as const, content: `I've noted: ${content}` },
    ];
    
    const result = await memoryClient.add(messages, {
      user_id: userId,
      metadata: {
        ...metadata,
        source: "prospecting-engine",
        timestamp: new Date().toISOString(),
      },
    });
    return result as unknown as Memory;
  } catch (error) {
    console.error("Failed to add memory:", error);
    return null;
  }
}

/**
 * Search for relevant memories based on a query
 * Results are scoped to the specific user
 */
export async function searchMemories(
  query: string,
  userId: string,
  limit: number = 5
): Promise<Memory[]> {
  if (!memoryClient) {
    return [];
  }

  if (!userId) {
    return [];
  }

  try {
    const results = await memoryClient.search(query, {
      user_id: userId,
      limit,
    });
    return (results as unknown as { results?: Memory[] })?.results || [];
  } catch (error) {
    console.error("Failed to search memories:", error);
    return [];
  }
}

/**
 * Get all stored memories for a specific user
 */
export async function getAllMemories(userId: string): Promise<Memory[]> {
  if (!memoryClient) {
    return [];
  }

  if (!userId) {
    return [];
  }

  try {
    const results = await memoryClient.getAll({
      user_id: userId,
    });
    return (results as unknown as { results?: Memory[] })?.results || [];
  } catch (error) {
    console.error("Failed to get all memories:", error);
    return [];
  }
}

/**
 * Format memories for inclusion in LLM context
 */
export function formatMemoriesForContext(memories: Memory[]): string {
  if (memories.length === 0) {
    return "";
  }

  const formatted = memories
    .map((m, i) => `${i + 1}. ${m.memory}`)
    .join("\n");

  return `
LEARNED FROM YOUR PREVIOUS SESSIONS:
${formatted}

Use these learnings to improve your recommendations.
`;
}

/**
 * Extract learnings from a prospecting result to store as memory
 */
export function extractLearningsFromResults(
  niche: string,
  qualified: number,
  disqualified: number,
  topCreatorHandles: string[],
  insights?: string
): string {
  const parts = [
    `In ${niche} niche: found ${qualified} qualified creators out of ${qualified + disqualified} analyzed.`,
  ];

  if (topCreatorHandles.length > 0) {
    parts.push(`Top matches: ${topCreatorHandles.slice(0, 3).join(", ")}.`);
  }

  if (insights) {
    parts.push(insights);
  }

  return parts.join(" ");
}
