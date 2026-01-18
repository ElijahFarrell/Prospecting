// IMPORTANT: Set CLERK_JWT_ISSUER_DOMAIN in Convex Dashboard > Settings > Environment Variables
// The domain should be your Clerk issuer URL, e.g., "https://your-app.clerk.accounts.dev"
// You can find it in Clerk Dashboard > API Keys

const domain = `***REMOVED***`;

if (!domain) {
  console.warn(
    "CLERK_JWT_ISSUER_DOMAIN not set. Add it to Convex Dashboard > Settings > Environment Variables"
  );
}

export default {
  providers: domain
    ? [
        {
          domain,
          applicationID: "convex",
        },
      ]
    : [],
};

