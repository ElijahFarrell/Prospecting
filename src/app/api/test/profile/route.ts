import { NextResponse } from "next/server";
import { getProfile, getProfilesBatch } from "@/services/apify";
import { requireSignedIn } from "@/lib/api-auth";

export async function POST(req: Request) {
  const unauthorized = await requireSignedIn();
  if (unauthorized) return unauthorized;

  try {
    const { username, usernames } = await req.json();
    
    const startTime = Date.now();
    
    let result;
    if (usernames && Array.isArray(usernames)) {
      // Batch mode
      const profiles = await getProfilesBatch(usernames);
      result = Object.fromEntries(profiles);
    } else if (username) {
      // Single mode
      result = await getProfile(username);
    } else {
      return NextResponse.json(
        { error: "Username or usernames array is required" },
        { status: 400 }
      );
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      result,
    });
  } catch (error) {
    console.error("Profile test failed:", error);
    return NextResponse.json(
      { success: false, error: "Request failed" },
      { status: 500 }
    );
  }
}

