import { Search, Globe, FileText, Users } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { WORKFLOW_DURATION_NOTICE } from "@/constants";

export interface ToolDisplayInfo {
  message: string;
  description?: string;
  icon: LucideIcon;
  durationNotice?: string;
  showSources?: boolean;
}

export const TOOL_DISPLAY_MAP: Record<string, ToolDisplayInfo> = {
  "start-niche-workflow": {
    message: "Searching Instagram for creators...",
    description: "Finding creators in your niche",
    icon: Search,
    durationNotice: WORKFLOW_DURATION_NOTICE,
  },
  "tavily-search": {
    message: "Getting most relevant information...",
    description: "Searching the web",
    icon: Globe,
    showSources: true,
  },
  "tavily-extract": {
    message: "Analyzing website content...",
    description: "Extracting content from link",
    icon: FileText,
  },
  "find-lookalikes": {
    message: "Finding similar creators...",
    description: "Discovering lookalike accounts",
    icon: Users,
  },
  "scout-creators": {
    message: "Scouting Instagram creators...",
    description: "Searching and filtering creators",
    icon: Search,
  },
};

/**
 * Converts camelCase to kebab-case
 * Example: "startNicheWorkflow" -> "start-niche-workflow"
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

export function getToolDisplayInfo(toolId: string): ToolDisplayInfo | null {
  // Try direct lookup first
  if (TOOL_DISPLAY_MAP[toolId]) {
    return TOOL_DISPLAY_MAP[toolId];
  }
  
  // Try kebab-case conversion (e.g., "startNicheWorkflow" -> "start-niche-workflow")
  const kebabCase = camelToKebab(toolId);
  if (TOOL_DISPLAY_MAP[kebabCase]) {
    return TOOL_DISPLAY_MAP[kebabCase];
  }
  
  return null;
}

