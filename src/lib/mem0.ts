import MemoryClient from "mem0ai";

// Initialize Mem0 client
const mem0ApiKey = process.env.MEM0_API_KEY;

let memoryClient: MemoryClient | null = null;

if (mem0ApiKey) {
  memoryClient = new MemoryClient({ apiKey: mem0ApiKey });
}

export const isMem0Configured = !!mem0ApiKey;

// Default user ID for prospecting sessions (can be extended for multi-user)
const DEFAULT_USER_ID = "prospecting-agent";

export interface Memory {
  id: string;
  memory: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

/**
 * Add a new memory about prospecting learnings
 * Mem0 expects messages in chat format, so we wrap the content
 */
export async function addMemory(
  content: string,
  metadata?: Record<string, unknown>
): Promise<Memory | null> {
  if (!memoryClient) {
    console.warn("Mem0 not configured - skipping memory storage");
    return null;
  }

  try {
    // Mem0 expects an array of messages in chat format
    const messages = [
      { role: "user" as const, content: `Remember this learning: ${content}` },
      { role: "assistant" as const, content: `I've noted: ${content}` },
    ];
    
    const result = await memoryClient.add(messages, {
      user_id: DEFAULT_USER_ID,
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
 */
export async function searchMemories(
  query: string,
  limit: number = 5
): Promise<Memory[]> {
  if (!memoryClient) {
    return [];
  }

  try {
    const results = await memoryClient.search(query, {
      user_id: DEFAULT_USER_ID,
      limit,
    });
    return (results as unknown as { results?: Memory[] })?.results || [];
  } catch (error) {
    console.error("Failed to search memories:", error);
    return [];
  }
}

/**
 * Get all stored memories for the prospecting agent
 */
export async function getAllMemories(): Promise<Memory[]> {
  if (!memoryClient) {
    return [];
  }

  try {
    const results = await memoryClient.getAll({
      user_id: DEFAULT_USER_ID,
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
LEARNED FROM PREVIOUS SESSIONS:
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

