import { NextResponse } from "next/server";
import { getComments } from "@/services/apify";
import { requireSignedIn } from "@/lib/api-auth";

export async function POST(req: Request) {
  const unauthorized = await requireSignedIn();
  if (unauthorized) return unauthorized;

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
    console.error("Comments test failed:", error);
    return NextResponse.json(
      { success: false, error: "Request failed" },
      { status: 500 }
    );
  }
}

