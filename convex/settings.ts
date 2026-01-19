import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    const settings = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return settings;
  },
});

export const saveSettings = mutation({
  args: {
    orchestratorPrompt: v.optional(v.string()),
    scoutPrompt: v.optional(v.string()),
    analystPrompt: v.optional(v.string()),
    profilerPrompt: v.optional(v.string()),
    defaultMinFollowers: v.optional(v.number()),
    defaultMaxFollowers: v.optional(v.number()),
    defaultSearchDepth: v.optional(v.number()),
    defaultTargetQualified: v.optional(v.number()),
    preferredNiches: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject;

    const now = Date.now();
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("settings", {
      userId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAgentPrompt = mutation({
  args: {
    agent: v.union(
      v.literal("orchestrator"),
      v.literal("scout"),
      v.literal("analyst"),
      v.literal("profiler")
    ),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject;

    const now = Date.now();
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const promptField = `${args.agent}Prompt` as 
      | "orchestratorPrompt" 
      | "scoutPrompt" 
      | "analystPrompt" 
      | "profilerPrompt";

    if (existing) {
      await ctx.db.patch(existing._id, {
        [promptField]: args.prompt,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("settings", {
      userId,
      [promptField]: args.prompt,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateDefaultParams = mutation({
  args: {
    defaultMinFollowers: v.optional(v.number()),
    defaultMaxFollowers: v.optional(v.number()),
    defaultSearchDepth: v.optional(v.number()),
    defaultTargetQualified: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject;

    const now = Date.now();
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("settings", {
      userId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const resetSettings = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject;

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

