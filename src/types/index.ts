import { z } from "zod";

export const CreatorAnalysisSchema = z.object({
  isQualified: z.boolean(),
  intentScore: z.number().min(1).max(10),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  redFlags: z.array(z.string()),
  transformationDetected: z.boolean(),
  sentiment: z
    .object({
      positive: z.number(),
      negative: z.number(),
      neutral: z.number(),
    })
    .optional(),
});

export type CreatorAnalysis = z.infer<typeof CreatorAnalysisSchema>;

export const ProspectSchema = z.object({
  handle: z.string(),
  niche: z.string(),
  followerCount: z.number(),
  followingCount: z.number(),
  postsCount: z.number(),
  engagementRate: z.number(),
  transformationScore: z.number(),
  isQualified: z.boolean(),
  disqualificationReason: z.string().optional(),
  outreachAngle: z.string().optional(),
  monetizationGap: z.string().optional(),
  recentPostSummary: z.string().optional(),
  bio: z.string().optional(),
  profilePicUrl: z.string().optional(),
  isVerified: z.boolean(),
  locationTier: z.string(),
  status: z.string(),
  redFlags: z.array(z.string()).optional(),
});

export type Prospect = z.infer<typeof ProspectSchema>;

export interface WorkflowProgress {
  type: "workflow-progress";
  stage: "starting" | "searching" | "analyzing" | "profiling" | "complete";
  message: string;
  niche: string;
  hashtag?: string;
  qualified?: number;
  disqualified?: number;
}

export interface InstagramProfile {
  username: string;
  fullName: string;
  bio: string;
  followers: number;
  following: number;
  postsCount: number;
  profilePicUrl: string;
  isVerified: boolean;
  isBusinessAccount: boolean;
  engagementRate: number;
}

export interface InstagramPost {
  id: string;
  shortcode: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
  url: string;
}

export interface InstagramComment {
  id: string;
  text: string;
  ownerUsername: string;
  timestamp: string;
  likesCount: number;
}

export interface CreatorCandidate {
  profile: InstagramProfile;
  recentPosts: InstagramPost[];
  recentComments: InstagramComment[];
  analysis?: CreatorAnalysis;
}

export interface ScoutingRequest {
  hashtag: string;
  minFollowers: number;
  maxFollowers: number;
}

export interface ScoutingProgress {
  phase: "discovery" | "filtering" | "analysis" | "complete";
  discovered: number;
  filtered: number;
  analyzed: number;
  qualified: number;
}

export interface ScoutingResult {
  candidate: CreatorCandidate;
  progress: ScoutingProgress;
}

