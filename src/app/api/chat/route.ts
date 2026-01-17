import { mastra } from "@/mastra";
import { createUIMessageStreamResponse, type UIMessageChunk, type UIDataTypes } from "ai";
import { toAISdkFormat } from "@mastra/ai-sdk";
import { searchMemories, formatMemoriesForContext, isMem0Configured } from "@/lib/mem0";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get the latest user message to search for relevant memories
  const lastUserMessage = messages
    .filter((m: { role: string }) => m.role === "user")
    .pop();
  
  let memoryContext = "";
  
  // Search for relevant memories if Mem0 is configured
  if (isMem0Configured && lastUserMessage) {
    try {
      const userText = lastUserMessage.content || 
        lastUserMessage.parts?.find((p: { type: string }) => p.type === "text")?.text || "";
      
      if (userText) {
        const relevantMemories = await searchMemories(userText, 5);
        memoryContext = formatMemoriesForContext(relevantMemories);
      }
    } catch (error) {
      console.error("Failed to retrieve memories:", error);
    }
  }

  // Inject memory context as a system message if we have memories
  const messagesWithContext = memoryContext
    ? [
        {
          role: "system",
          content: memoryContext,
        },
        ...messages,
      ]
    : messages;

  const agent = mastra.getAgent("orchestratorAgent");
  const stream = await agent.stream(messagesWithContext);

  const aiSdkStream = toAISdkFormat(stream, { from: "agent" }) as unknown as ReadableStream<UIMessageChunk<unknown, UIDataTypes>>;

  return createUIMessageStreamResponse({
    stream: aiSdkStream,
  });
}
