import { NextRequest, NextResponse } from "next/server";
import { generateDMMessageVariations } from "@/services/message-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { niche, bio, outreachAngle, monetizationGap, recentPostSummary } = body;

    if (!niche || !bio) {
      return NextResponse.json(
        { error: "niche and bio are required" },
        { status: 400 }
      );
    }

    const variations = await generateDMMessageVariations({
      niche,
      bio,
      outreachAngle: outreachAngle || "",
      monetizationGap,
      recentPostSummary,
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

