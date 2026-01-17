import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";
import { APIFY_ACTORS } from "@/constants";

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { actor, input } = await req.json();
    
    if (!actor || !input) {
      return NextResponse.json(
        { error: "Actor and input are required" },
        { status: 400 }
      );
    }

    // Map friendly names to actor IDs
    const actorMap: Record<string, string> = {
      "hashtag": APIFY_ACTORS.FAST_SCRAPER,
      "profile": APIFY_ACTORS.PROFILE_SCRAPER,
      "profile-api": "apify/instagram-api-scraper",
      "profile-fast": APIFY_ACTORS.FAST_SCRAPER,
      "comments": APIFY_ACTORS.COMMENT_SCRAPER,
      "comments-api": "apify/instagram-api-scraper",
    };

    const actorId = actorMap[actor] || actor;

    const startTime = Date.now();
    const run = await client.actor(actorId).call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      actorId,
      input,
      itemCount: items.length,
      rawItems: items,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

