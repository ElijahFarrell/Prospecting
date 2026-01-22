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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: "Failed to generate messages",
        details: errorMessage,
        ...(process.env.NODE_ENV === "development" && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}

