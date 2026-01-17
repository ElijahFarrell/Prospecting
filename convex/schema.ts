import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  prospects: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_niche", ["niche"])
    .index("by_status", ["status"])
    .index("by_qualified", ["isQualified"])
    .index("by_handle", ["handle"]),

  threads: defineTable({
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_updated", ["updatedAt"]),

  messages: defineTable({
    threadId: v.id("threads"),
    role: v.string(),
    content: v.string(),
    parts: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_thread", ["threadId", "createdAt"]),
});
