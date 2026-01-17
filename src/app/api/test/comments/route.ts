import { NextResponse } from "next/server";
import { getComments } from "@/services/apify";

export async function POST(req: Request) {
  try {
    const { postUrl } = await req.json();
    
    if (!postUrl) {
      return NextResponse.json({ error: "Post URL is required" }, { status: 400 });
    }

    const startTime = Date.now();
    const result = await getComments(postUrl);
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

