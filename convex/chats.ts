import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createThread = mutation({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("threads", {
      title: args.title || "New Chat",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateThreadTitle = mutation({
  args: {
    threadId: v.id("threads"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.threadId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

export const deleteThread = mutation({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    // Delete all messages in thread
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    // Delete the thread
    await ctx.db.delete(args.threadId);
  },
});

export const getThreads = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("threads")
      .withIndex("by_updated")
      .order("desc")
      .collect();
  },
});

export const getThread = query({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.threadId);
  },
});

export const addMessage = mutation({
  args: {
    threadId: v.id("threads"),
    role: v.string(),
    content: v.string(),
    parts: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Update thread's updatedAt
    await ctx.db.patch(args.threadId, {
      updatedAt: now,
    });
    
    return await ctx.db.insert("messages", {
      threadId: args.threadId,
      role: args.role,
      content: args.content,
      parts: args.parts,
      createdAt: now,
    });
  },
});

export const getMessages = query({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();
  },
});

export const getRecentThreads = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const threads = await ctx.db
      .query("threads")
      .withIndex("by_updated")
      .order("desc")
      .take(args.limit || 20);
    
    return threads;
  },
});

