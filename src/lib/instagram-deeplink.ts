/**
 * Generate Instagram DM deep link
 * Format: https://instagram.com/direct/t/{user_id}
 * 
 * Note: Instagram user ID is required. If not available, falls back to username-based link.
 */
export function generateInstagramDMLink(userId?: string, username?: string): string {
  if (userId) {
    return `https://instagram.com/direct/t/${userId}`;
  }
  
  // Fallback to username-based link (may not work reliably for DMs)
  if (username) {
    return `https://instagram.com/${username}`;
  }
  
  throw new Error("Either userId or username must be provided");
}

/**
 * Open Instagram DM and copy message to clipboard
 * 
 * @param userId - Instagram user ID (preferred)
 * @param username - Instagram username (fallback)
 * @param message - Message text to copy to clipboard
 */
export async function openInstagramDMWithMessage(
  userId: string | undefined,
  username: string | undefined,
  message: string
): Promise<void> {
  // Copy message to clipboard
  try {
    await navigator.clipboard.writeText(message);
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    throw new Error("Failed to copy message to clipboard. Please copy manually.");
  }

  // Open Instagram DM
  const link = generateInstagramDMLink(userId, username);
  window.open(link, "_blank");
}

