import { NextResponse } from "next/server";
import { searchHashtag } from "@/services/apify";
import { requireSignedIn } from "@/lib/api-auth";

export async function POST(req: Request) {
  const unauthorized = await requireSignedIn();
  if (unauthorized) return unauthorized;

  try {
    const { hashtag } = await req.json();
    
    if (!hashtag) {
      return NextResponse.json({ error: "Hashtag is required" }, { status: 400 });
    }

    const startTime = Date.now();
    const result = await searchHashtag(hashtag);
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      result,
    });
  } catch (error) {
    console.error("Hashtag test failed:", error);
    return NextResponse.json(
      { success: false, error: "Request failed" },
      { status: 500 }
    );
  }
}

