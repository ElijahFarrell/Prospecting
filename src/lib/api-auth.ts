import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Second check for routes that spend Apify or AI Gateway credits.
 * Middleware already calls auth.protect(); this still rejects a request
 * that reaches the handler without a Clerk user.
 */
export async function requireSignedIn(): Promise<NextResponse | null> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
