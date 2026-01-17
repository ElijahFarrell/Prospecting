import { convexClient, isConvexConfigured } from "./convex-client";
import { api } from "../../convex/_generated/api";

/**
 * Check which handles already exist in the prospects database
 */
export async function checkExistingHandles(handles: string[]): Promise<string[]> {
  if (!isConvexConfigured || !convexClient) {
    return [];
  }
  try {
    return await convexClient.query(api.prospects.checkExistingHandles, { handles });
  } catch {
    return [];
  }
}

/**
 * Save prospects to the database
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
}>): Promise<number> {
  if (!isConvexConfigured || !convexClient) {
    return 0;
  }
  try {
    await convexClient.mutation(api.prospects.saveProspectsBatch, { prospects });
    return prospects.length;
  } catch {
    return 0;
  }
}

