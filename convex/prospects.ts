import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveProspect = mutation({
  args: {
    handle: v.string(),
    niche: v.string(),
    followerCount: v.number(),
    followingCount: v.number(),
    postsCount: v.number(),
    engagementRate: v.number(),
    transformationScore: v.number(),
    isQualified: v.boolean(),
    disqualificationReason: v.optional(v.string()),
    outreachAngle: v.optional(v.string()),
    monetizationGap: v.optional(v.string()),
    recentPostSummary: v.optional(v.string()),
    bio: v.optional(v.string()),
    profilePicUrl: v.optional(v.string()),
    isVerified: v.boolean(),
    locationTier: v.string(),
    status: v.string(),
    redFlags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const existing = await ctx.db
      .query("prospects")
      .filter((q) => q.eq(q.field("handle"), args.handle))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("prospects", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const saveProspectsBatch = mutation({
  args: {
    prospects: v.array(
      v.object({
        handle: v.string(),
        niche: v.string(),
        followerCount: v.number(),
        followingCount: v.number(),
        postsCount: v.number(),
        engagementRate: v.number(),
        transformationScore: v.number(),
        isQualified: v.boolean(),
        disqualificationReason: v.optional(v.string()),
        outreachAngle: v.optional(v.string()),
        monetizationGap: v.optional(v.string()),
        recentPostSummary: v.optional(v.string()),
        bio: v.optional(v.string()),
        profilePicUrl: v.optional(v.string()),
        isVerified: v.boolean(),
        locationTier: v.string(),
        status: v.string(),
        redFlags: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids = [];

    for (const prospect of args.prospects) {
      const existing = await ctx.db
        .query("prospects")
        .filter((q) => q.eq(q.field("handle"), prospect.handle))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...prospect,
          updatedAt: now,
        });
        ids.push(existing._id);
      } else {
        const id = await ctx.db.insert("prospects", {
          ...prospect,
          createdAt: now,
          updatedAt: now,
        });
        ids.push(id);
      }
    }

    return ids;
  },
});

export const getProspectsByNiche = query({
  args: { niche: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("prospects")
      .withIndex("by_niche", (q) => q.eq("niche", args.niche))
      .collect();
  },
});

export const getQualifiedProspects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("prospects")
      .withIndex("by_qualified", (q) => q.eq("isQualified", true))
      .collect();
  },
});

export const getAllProspects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("prospects").collect();
  },
});

export const getProspectsByHandles = query({
  args: { handles: v.array(v.string()) },
  handler: async (ctx, args) => {
    const results = [];
    for (const handle of args.handles) {
      const prospect = await ctx.db
        .query("prospects")
        .withIndex("by_handle", (q) => q.eq("handle", handle))
        .first();
      if (prospect) {
        results.push(prospect);
      }
    }
    return results;
  },
});

export const checkExistingHandles = query({
  args: { handles: v.array(v.string()) },
  handler: async (ctx, args) => {
    const existingHandles: string[] = [];
    for (const handle of args.handles) {
      const prospect = await ctx.db
        .query("prospects")
        .withIndex("by_handle", (q) => q.eq("handle", handle))
        .first();
      if (prospect) {
        existingHandles.push(handle);
      }
    }
    return existingHandles;
  },
});

export const updateProspectStatus = mutation({
  args: {
    handle: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const prospect = await ctx.db
      .query("prospects")
      .filter((q) => q.eq(q.field("handle"), args.handle))
      .first();

    if (prospect) {
      await ctx.db.patch(prospect._id, {
        status: args.status,
        updatedAt: Date.now(),
      });
    }
  },
});

