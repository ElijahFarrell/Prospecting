import { ApifyClient } from "apify-client";
import { APIFY_ACTORS } from "@/constants";
import type { InstagramProfile, InstagramComment } from "@/types";

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

interface HashtagSearchResult {
  usernames: string[];
  posts: Array<{
    shortcode: string;
    ownerUsername: string;
    likesCount: number;
    commentsCount: number;
  }>;
}

export async function searchHashtag(hashtag: string, maxItems: number = 30): Promise<HashtagSearchResult> {
  const cleanHashtag = hashtag.replace("#", "").toLowerCase();
  const hashtagUrl = `https://www.instagram.com/explore/tags/${cleanHashtag}/`;

  const run = await client.actor(APIFY_ACTORS.FAST_SCRAPER).call({
    startUrls: [hashtagUrl],
    maxItems,
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  const usernames = new Set<string>();
  const posts: HashtagSearchResult["posts"] = [];

  for (const item of items) {
    const data = item as Record<string, unknown>;
    const owner = data.owner as Record<string, unknown> | undefined;
    const username = owner?.username as string;
    
    if (username) {
      usernames.add(username);
      posts.push({
        shortcode: (data.code as string) || "",
        ownerUsername: username,
        likesCount: (data.likeCount as number) || 0,
        commentsCount: (data.commentCount as number) || 0,
      });
    }
  }

  return {
    usernames: Array.from(usernames),
    posts,
  };
}

function parseProfileFromData(data: Record<string, unknown>, username: string): InstagramProfile {
  const followers = (data.followersCount as number) || (data.followerCount as number) || 0;
  const recentPosts = (data.latestPosts as Array<Record<string, unknown>>) || 
                      (data.posts as Array<Record<string, unknown>>) || [];
  
  // Posts count - try multiple field names
  const postsCount = (data.postsCount as number) || 
                     (data.mediaCount as number) || 
                     (data.postCount as number) ||
                     recentPosts.length || 0;
  
  const totalLikes = recentPosts.reduce(
    (sum, post) => sum + ((post.likesCount as number) || (post.likeCount as number) || 0),
    0
  );
  const totalComments = recentPosts.reduce(
    (sum, post) => sum + ((post.commentsCount as number) || (post.commentCount as number) || 0),
    0
  );
  const avgEngagement =
    recentPosts.length > 0
      ? ((totalLikes + totalComments) / recentPosts.length / Math.max(followers, 1)) * 100
      : 0;

  return {
    username: (data.username as string) || username,
    fullName: (data.fullName as string) || "",
    bio: (data.biography as string) || (data.bio as string) || "",
    followers,
    following: (data.followingCount as number) || (data.followingCount as number) || 0,
    postsCount,
    profilePicUrl: (data.profilePicUrl as string) || (data.profilePicURL as string) || "",
    isVerified: (data.verified as boolean) || (data.isVerified as boolean) || false,
    isBusinessAccount: (data.isBusinessAccount as boolean) || false,
    engagementRate: Math.round(avgEngagement * 100) / 100,
  };
}

export async function getProfile(username: string): Promise<InstagramProfile | null> {
  // Using dedicated Instagram Profile Scraper which returns postsCount
  const run = await client.actor(APIFY_ACTORS.PROFILE_SCRAPER).call({
    usernames: [username],
  });

  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  const data = items[0] as Record<string, unknown> | undefined;

  if (!data) return null;
  return parseProfileFromData(data, username);
}

/**
 * OPTIMIZED: Fetch multiple profiles in a SINGLE Apify call
 * Uses dedicated Instagram Profile Scraper which returns postsCount
 */
export async function getProfilesBatch(usernames: string[]): Promise<Map<string, InstagramProfile | null>> {
  const results = new Map<string, InstagramProfile | null>();
  
  if (usernames.length === 0) return results;

  try {
    const run = await client.actor(APIFY_ACTORS.PROFILE_SCRAPER).call({
      usernames: usernames,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    for (const item of items) {
      const data = item as Record<string, unknown>;
      const username = (data.username as string) || "";
      if (username) {
        results.set(username, parseProfileFromData(data, username));
      }
    }

    // Mark any missing usernames as null
    for (const username of usernames) {
      if (!results.has(username)) {
        results.set(username, null);
      }
    }
  } catch {
    // If batch fails, mark all as null
    for (const username of usernames) {
      results.set(username, null);
    }
  }

  return results;
}

/**
 * Get comments for a single post
 * Only call this for qualified creators (uses dedicated comment scraper)
 */
export async function getComments(postUrl: string): Promise<InstagramComment[]> {
  try {
    const run = await client.actor(APIFY_ACTORS.COMMENT_SCRAPER).call({
      directUrls: [postUrl],
      resultsLimit: 15,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    return items.map((item) => {
      const data = item as Record<string, unknown>;
      return {
        id: (data.id as string) || "",
        text: (data.text as string) || "",
        ownerUsername: (data.ownerUsername as string) || (data.username as string) || "",
        timestamp: (data.timestamp as string) || "",
        likesCount: (data.likesCount as number) || 0,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Get comments for multiple posts in batch
 */
export async function getCommentsBatch(postUrls: string[]): Promise<InstagramComment[]> {
  if (postUrls.length === 0) return [];

  try {
    const run = await client.actor(APIFY_ACTORS.COMMENT_SCRAPER).call({
      directUrls: postUrls,
      resultsLimit: 10,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    return items.map((item) => {
      const data = item as Record<string, unknown>;
      return {
        id: (data.id as string) || "",
        text: (data.text as string) || "",
        ownerUsername: (data.ownerUsername as string) || (data.username as string) || "",
        timestamp: (data.timestamp as string) || "",
        likesCount: (data.likesCount as number) || 0,
      };
    });
  } catch {
    return [];
  }
}

/**
 * DEPRECATED: Use getProfilesBatch instead for better performance
 */
export async function getCreatorData(username: string): Promise<{
  profile: InstagramProfile | null;
  comments: InstagramComment[];
}> {
  const profile = await getProfile(username);

  if (!profile) {
    return { profile: null, comments: [] };
  }

  // Skip comments in fast mode - use getCommentsBatch separately for qualified creators
  return { profile, comments: [] };
}

/**
 * Get suggested/similar accounts for a given username
 * Uses the Fast Scraper to fetch the profile page which may include suggested users
 */
export async function getSuggestedUsers(username: string): Promise<string[]> {
  try {
    // Try to get profile with edge_chained_sfs (suggested accounts)
    const profileUrl = `https://www.instagram.com/${username}/`;
    
    const run = await client.actor(APIFY_ACTORS.FAST_SCRAPER).call({
      startUrls: [profileUrl],
      maxItems: 1,
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const data = items[0] as Record<string, unknown> | undefined;
    
    if (!data) return [];
    
    // Try to extract suggested users from various possible fields
    const suggestedUsers: string[] = [];
    
    // Check for relatedProfiles field
    const relatedProfiles = data.relatedProfiles as Array<Record<string, unknown>> | undefined;
    if (relatedProfiles) {
      for (const profile of relatedProfiles) {
        const u = profile.username as string;
        if (u) suggestedUsers.push(u);
      }
    }
    
    // Check for edge_chained_sfs (Instagram's suggested follows structure)
    const edgeChainedSfs = data.edge_chained_sfs as Record<string, unknown> | undefined;
    if (edgeChainedSfs?.edges) {
      const edges = edgeChainedSfs.edges as Array<Record<string, unknown>>;
      for (const edge of edges) {
        const node = edge.node as Record<string, unknown>;
        const u = node?.username as string;
        if (u) suggestedUsers.push(u);
      }
    }
    
    // Check for suggestedUsers field
    const suggested = data.suggestedUsers as Array<Record<string, unknown>> | undefined;
    if (suggested) {
      for (const profile of suggested) {
        const u = profile.username as string;
        if (u) suggestedUsers.push(u);
      }
    }

    return suggestedUsers;
  } catch {
    return [];
  }
}

/**
 * Search for creators similar to a given username by searching related hashtags
 * This is a fallback when direct suggested users aren't available
 */
export async function findSimilarByHashtags(
  username: string, 
  niche: string,
  limit: number = 20
): Promise<string[]> {
  try {
    // Use the niche as a hashtag to find similar creators
    const nicheHashtag = niche.toLowerCase().replace(/\s+/g, "");
    const { usernames } = await searchHashtag(nicheHashtag, limit * 2);
    
    // Filter out the original username
    return usernames.filter((u) => u.toLowerCase() !== username.toLowerCase()).slice(0, limit);
  } catch {
    return [];
  }
}
