import { convexClient, isConvexConfigured } from "./convex-client";
import { api } from "../../convex/_generated/api";

/**
 * Check which handles already exist in the prospects database
 * @param handles - Array of handles to check
 * @param userId - Optional user ID for data isolation
 */
export async function checkExistingHandles(handles: string[], userId?: string): Promise<string[]> {
  if (!isConvexConfigured || !convexClient) {
    return [];
  }
  try {
    return await convexClient.query(api.prospects.checkExistingHandles, { handles, userId });
  } catch {
    return [];
  }
}

/**
 * Save prospects to the database
 * @param prospects - Array of prospect data to save
 * @param userId - Optional user ID for data isolation
 */
export async function saveProspectsBatch(prospects: Array<{
  handle: string;
  niche: string;
  followerCount: number;
  followingCount: number;
  postsCount: number;
  engagementRate: number;
  transformationScore: number;
  isQualified: boolean;
  disqualificationReason?: string;
  outreachAngle?: string;
  monetizationGap?: string;
  recentPostSummary?: string;
  bio?: string;
  profilePicUrl?: string;
  isVerified: boolean;
  locationTier: string;
  status: string;
  redFlags?: string[];
}>, userId?: string): Promise<number> {
  if (!isConvexConfigured || !convexClient) {
    return 0;
  }
  try {
    await convexClient.mutation(api.prospects.saveProspectsBatch, { prospects, userId });
    return prospects.length;
  } catch (error) {
    console.error("Failed to save prospects batch:", error);
    return 0;
  }
}

