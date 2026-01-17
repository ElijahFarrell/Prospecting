import { ConvexHttpClient } from "convex/browser";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Create client only if URL is available, otherwise create a stub
export const convexClient = convexUrl 
  ? new ConvexHttpClient(convexUrl)
  : (null as unknown as ConvexHttpClient);

export const isConvexConfigured = !!convexUrl;

