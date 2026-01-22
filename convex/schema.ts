import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  prospects: defineTable({
    userId: v.optional(v.string()), // Clerk user ID for data isolation (optional for legacy data)
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
    // Status for tracking outreach pipeline
    status: v.string(), // "New" | "Qualified" | "Outreached" | "In Discussion" | "Closed"
    redFlags: v.optional(v.array(v.string())),
    // User notes for tracking
    notes: v.optional(v.string()),
    lastContactedAt: v.optional(v.number()),
    // DM Message fields
    messageVariations: v.optional(
      v.object({
        methodA: v.object({
          variations: v.array(v.string()),
          valueAssetDescription: v.string(),
        }),
        methodB: v.object({
          openers: v.array(v.string()),
          pivotMessage: v.string(),
          valueAssetDescription: v.string(),
        }),
      })
    ),
    selectedMessage: v.optional(
      v.object({
        method: v.union(v.literal("A"), v.literal("B")),
        variationIndex: v.number(),
        text: v.string(),
      })
    ),
    messageGeneratedAt: v.optional(v.number()),
    messageStatus: v.optional(v.union(v.literal("pending"), v.literal("sent"), v.literal("drafted"))),
    instagramUserId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_niche", ["userId", "niche"])
    .index("by_user_qualified", ["userId", "isQualified"])
    .index("by_user_handle", ["userId", "handle"])
    .index("by_user_status", ["userId", "status"])
    .index("by_niche", ["niche"])
    .index("by_status", ["status"])
    .index("by_qualified", ["isQualified"])
    .index("by_handle", ["handle"]),

  threads: defineTable({
    userId: v.optional(v.string()), // Clerk user ID for data isolation (optional for legacy data)
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_updated", ["updatedAt"]),

  messages: defineTable({
    threadId: v.id("threads"),
    role: v.string(),
    content: v.string(),
    parts: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_thread", ["threadId", "createdAt"]),

  // User settings for configurable agent prompts and preferences
  settings: defineTable({
    userId: v.string(),
    // Agent prompt customization
    orchestratorPrompt: v.optional(v.string()),
    scoutPrompt: v.optional(v.string()),
    analystPrompt: v.optional(v.string()),
    profilerPrompt: v.optional(v.string()),
    // Default search parameters
    defaultMinFollowers: v.optional(v.number()),
    defaultMaxFollowers: v.optional(v.number()),
    defaultSearchDepth: v.optional(v.number()),
    defaultTargetQualified: v.optional(v.number()),
    // Preferences
    preferredNiches: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
