import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the user ID, preferring explicitly passed userId over auth context.
 * This allows server-side workflows to pass userId directly while
 * client-side calls can rely on authentication.
 */
async function resolveUserId(
  ctx: QueryCtx | MutationCtx, 
  explicitUserId?: string
): Promise<string | null> {
  // If userId is explicitly provided (from server-side workflow), use it
  if (explicitUserId) {
    return explicitUserId;
  }
  // Otherwise try to get it from auth context (client-side calls)
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

/**
 * Get user ID, throwing if neither explicit nor authenticated
 */
async function requireUserId(
  ctx: QueryCtx | MutationCtx,
  explicitUserId?: string
): Promise<string> {
  const userId = await resolveUserId(ctx, explicitUserId);
  if (!userId) {
    throw new Error("User ID required: provide userId or authenticate");
  }
  return userId;
}

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
    userId: v.optional(v.string()), // Allow explicit userId from server-side
  },
  handler: async (ctx, args) => {
    const { userId: explicitUserId, ...prospectData } = args;
    const userId = await requireUserId(ctx, explicitUserId);
    const now = Date.now();
    
    // Check for existing prospect belonging to this user
    const existing = await ctx.db
      .query("prospects")
      .withIndex("by_user_handle", (q) => q.eq("userId", userId).eq("handle", prospectData.handle))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...prospectData,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("prospects", {
      ...prospectData,
      userId,
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
    userId: v.optional(v.string()), // Allow explicit userId from server-side
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx, args.userId);
    const now = Date.now();
    const ids = [];

    for (const prospect of args.prospects) {
      // Check for existing prospect belonging to this user
      const existing = await ctx.db
        .query("prospects")
        .withIndex("by_user_handle", (q) => q.eq("userId", userId).eq("handle", prospect.handle))
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
          userId,
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
  args: { 
    niche: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await resolveUserId(ctx, args.userId);
    if (!userId) return [];
    
    return await ctx.db
      .query("prospects")
      .withIndex("by_user_niche", (q) => q.eq("userId", userId).eq("niche", args.niche))
      .collect();
  },
});

export const getQualifiedProspects = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await resolveUserId(ctx, args.userId);
    if (!userId) return [];
    
    return await ctx.db
      .query("prospects")
      .withIndex("by_user_qualified", (q) => q.eq("userId", userId).eq("isQualified", true))
      .collect();
  },
});

export const getAllProspects = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await resolveUserId(ctx, args.userId);
    if (!userId) return [];
    
    return await ctx.db
      .query("prospects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getProspectsByHandles = query({
  args: { 
    handles: v.array(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await resolveUserId(ctx, args.userId);
    if (!userId) return [];
    
    const results = [];
    for (const handle of args.handles) {
      const prospect = await ctx.db
        .query("prospects")
        .withIndex("by_user_handle", (q) => q.eq("userId", userId).eq("handle", handle))
        .first();
      if (prospect) {
        results.push(prospect);
      }
    }
    return results;
  },
});

export const checkExistingHandles = query({
  args: { 
    handles: v.array(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await resolveUserId(ctx, args.userId);
    if (!userId) return [];
    
    const existingHandles: string[] = [];
    for (const handle of args.handles) {
      const prospect = await ctx.db
        .query("prospects")
        .withIndex("by_user_handle", (q) => q.eq("userId", userId).eq("handle", handle))
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
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx, args.userId);
    
    const prospect = await ctx.db
      .query("prospects")
      .withIndex("by_user_handle", (q) => q.eq("userId", userId).eq("handle", args.handle))
      .first();

    if (prospect) {
      await ctx.db.patch(prospect._id, {
        status: args.status,
        updatedAt: Date.now(),
      });
    }
  },
});

export const updateProspect = mutation({
  args: {
    id: v.id("prospects"),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    lastContactedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject;

    const prospect = await ctx.db.get(args.id);
    if (!prospect || prospect.userId !== userId) {
      throw new Error("Prospect not found or unauthorized");
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.status !== undefined) updates.status = args.status;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.lastContactedAt !== undefined) updates.lastContactedAt = args.lastContactedAt;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const deleteProspect = mutation({
  args: {
    id: v.id("prospects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const userId = identity.subject;

    const prospect = await ctx.db.get(args.id);
    if (!prospect || prospect.userId !== userId) {
      throw new Error("Prospect not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

export const getProspectById = query({
  args: {
    id: v.id("prospects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject;

    const prospect = await ctx.db.get(args.id);
    if (!prospect || prospect.userId !== userId) {
      return null;
    }

    return prospect;
  },
});

export const getProspectsByStatus = query({
  args: {
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;

    return await ctx.db
      .query("prospects")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", args.status))
      .collect();
  },
});
