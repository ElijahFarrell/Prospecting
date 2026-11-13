import { NextRequest, NextResponse } from "next/server";
import { generateDMMessageVariations } from "@/services/message-generator";
import { requireSignedIn } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const unauthorized = await requireSignedIn();
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const { 
      handle,
      niche, 
      bio, 
      outreachAngle, 
      monetizationGap, 
      recentPostSummary,
      followerCount,
      engagementRate,
      transformationScore,
      postsCount
    } = body;

    if (!niche || !bio) {
      return NextResponse.json(
        { error: "niche and bio are required" },
        { status: 400 }
      );
    }

    const variations = await generateDMMessageVariations({
      handle: handle || "",
      niche,
      bio,
      outreachAngle: outreachAngle || "",
      monetizationGap,
      recentPostSummary,
      followerCount,
      engagementRate,
      transformationScore,
      postsCount,
    });

    return NextResponse.json(variations);
  } catch (error) {
    console.error("Error generating messages:", error);
    return NextResponse.json(
      { error: "Failed to generate messages" },
      { status: 500 }
    );
  }
}

