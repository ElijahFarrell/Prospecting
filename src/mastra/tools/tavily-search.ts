import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { TAVILY_CONFIG } from "@/constants";
import { tavily } from "@tavily/core";

// Initialize Tavily client
const getTavilyClient = () => {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY environment variable is not set");
  }
  return tavily({ apiKey });
};

/**
 * Mastra tool for Tavily web search
 */
export const tavilySearchTool = createTool({
  id: "tavily-search",
  description:
    "Search the web for real-time information using Tavily's AI-optimized search engine. Use this to discover trending niches, research topics, or find current information. Returns relevant sources, snippets, and optional AI-generated answers.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
    searchDepth: z.enum(["basic", "advanced"]).optional().default(TAVILY_CONFIG.SEARCH_DEPTH.BASIC).describe("Search depth - advanced provides more comprehensive results"),
    maxResults: z.number().optional().default(TAVILY_CONFIG.DEFAULT_MAX_RESULTS).describe("Maximum number of results (1-10)"),
    topic: z.enum(["general", "news", "finance"]).optional().default(TAVILY_CONFIG.TOPIC.GENERAL).describe("Search topic category"),
    includeAnswer: z.boolean().optional().default(false).describe("Include AI-generated answer summary"),
    timeRange: z.enum(["year", "month", "week", "day"]).optional().describe("Time range for results"),
  }),
  outputSchema: z.object({
    query: z.string(),
    answer: z.string().optional(),
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        content: z.string(),
        score: z.number(),
      })
    ),
    responseTime: z.number(),
  }),
  execute: async ({ context }: { context: { query: string; searchDepth?: string; maxResults?: number; topic?: string; includeAnswer?: boolean; timeRange?: string } }) => {
    const { query, searchDepth, maxResults, topic, includeAnswer, timeRange } = context;

    const client = getTavilyClient();
    const result = await client.search(query, {
      searchDepth: searchDepth as "basic" | "advanced",
      maxResults: Math.min(maxResults || TAVILY_CONFIG.DEFAULT_MAX_RESULTS, 20),
      topic: topic as "general" | "news" | "finance",
      includeAnswer: includeAnswer || false,
      ...(timeRange && { timeRange: timeRange as "year" | "month" | "week" | "day" }),
    });

    return {
      query: result.query,
      answer: result.answer,
      results: result.results.map((r: { title: string; url: string; content: string; score: number }) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
      })),
      responseTime: result.responseTime,
    };
  },
});

/**
 * Mastra tool for Tavily content extraction (perfect for link-in-bio analysis)
 */
export const tavilyExtractTool = createTool({
  id: "tavily-extract",
  description:
    "Extract and analyze content from specific URLs. Use this to check a creator's link-in-bio, website, or landing page to see if they're already selling digital products. Perfect for overqualified detection.",
  inputSchema: z.object({
    urls: z.array(z.string().url()).describe("Array of URLs to extract content from"),
    extractDepth: z.enum(["basic", "advanced"]).optional().default(TAVILY_CONFIG.SEARCH_DEPTH.ADVANCED).describe("Extraction depth - advanced provides more detailed content"),
    format: z.enum(["markdown", "text"]).optional().default(TAVILY_CONFIG.FORMAT.TEXT).describe("Output format"),
    query: z.string().optional().describe("Optional query to rerank extracted content"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        url: z.string(),
        title: z.string().optional(),
        content: z.string(),
        contentLength: z.number(),
      })
    ),
  }),
  execute: async ({ context }: { context: { urls: string[]; extractDepth?: string; format?: string; query?: string } }) => {
    const { urls, extractDepth, format, query } = context;

    const client = getTavilyClient();
    const result = await client.extract(urls, {
      extractDepth: extractDepth as "basic" | "advanced",
      format: format as "markdown" | "text",
      ...(query && { query }),
    });

    return {
      results: result.results.map((r: { url: string; title?: string | null; rawContent?: string; content?: string }) => ({
        url: r.url,
        title: r.title || undefined,
        content: r.rawContent || r.content || "",
        contentLength: (r.rawContent || r.content || "").length,
      })),
    };
  },
});

