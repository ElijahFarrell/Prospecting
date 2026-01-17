import { NextResponse } from "next/server";
import { searchHashtag } from "@/services/apify";

export async function POST(req: Request) {
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
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

