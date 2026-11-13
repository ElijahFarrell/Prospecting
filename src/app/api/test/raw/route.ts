import { NextResponse } from "next/server";
import { ApifyClient } from "apify-client";
import { APIFY_ACTORS } from "@/constants";
import { requireSignedIn } from "@/lib/api-auth";

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

// Friendly names from the test page. Unknown names are rejected so a caller
// cannot spend the Apify token on an arbitrary actor.
const ACTOR_IDS: Record<string, string> = {
  hashtag: APIFY_ACTORS.FAST_SCRAPER,
  profile: APIFY_ACTORS.PROFILE_SCRAPER,
  "profile-api": "apify/instagram-api-scraper",
  "profile-fast": APIFY_ACTORS.FAST_SCRAPER,
  comments: APIFY_ACTORS.COMMENT_SCRAPER,
  "comments-api": "apify/instagram-api-scraper",
};

export async function POST(req: Request) {
  const unauthorized = await requireSignedIn();
  if (unauthorized) return unauthorized;

  try {
    const { actor, input } = await req.json();
    
    if (!actor || !input || typeof actor !== "string") {
      return NextResponse.json(
        { error: "Actor and input are required" },
        { status: 400 }
      );
    }

    const actorId = ACTOR_IDS[actor];
    if (!actorId) {
      return NextResponse.json({ error: "Unknown actor" }, { status: 400 });
    }

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
    console.error("Raw Apify call failed:", error);
    return NextResponse.json(
      { success: false, error: "Request failed" },
      { status: 500 }
    );
  }
}

