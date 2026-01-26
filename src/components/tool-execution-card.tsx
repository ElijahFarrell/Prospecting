"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, Search, Globe, FileText, Users, ExternalLink, Info, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ToolExecutionCardProps {
  toolId: string;
  state: "call" | "partial-call" | "result" | "error";
  message: string;
  description?: string;
  icon?: LucideIcon;
  durationNotice?: string;
  sources?: Array<{ title: string; url: string; content?: string }>;
  elapsedTime?: number;
}

const TOOL_ICON_MAP: Record<string, LucideIcon> = {
  "start-niche-workflow": Search,
  "tavily-search": Globe,
  "tavily-extract": FileText,
  "find-lookalikes": Users,
};

export function ToolExecutionCard({
  toolId,
  state,
  message,
  description,
  icon: Icon,
  durationNotice,
  sources,
  elapsedTime,
}: ToolExecutionCardProps) {
  const isActive = state === "call" || state === "partial-call";
  const isComplete = state === "result";
  const isError = state === "error";

  // Auto-collapse completed items that have content, but keep active/error items open
  const [isOpen, setIsOpen] = useState(!isComplete);

  const ToolIcon = Icon || TOOL_ICON_MAP[toolId] || Search;

  return (
    <Card
      className={cn(
        "w-full transition-all duration-300",
        isActive && "border-primary/30 bg-primary/5 shadow-[0_0_20px_hsla(var(--primary)/0.1)]",
        isComplete && "border-green-500/20 bg-green-500/5",
        isError && "border-red-500/20 bg-red-500/5"
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 pt-3 px-4 cursor-pointer hover:bg-white/5 transition-colors rounded-t-xl">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 font-display">
                {isActive && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {isComplete && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {isError && <CheckCircle2 className="h-4 w-4 text-red-500" />}
                {!isActive && !isComplete && !isError && <ToolIcon className="h-4 w-4 text-muted-foreground" />}
                <span className={cn(isActive && "text-primary", isComplete && "text-green-500", isError && "text-red-500")}>
                  {message}
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                {elapsedTime !== undefined && (
                  <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                    {(elapsedTime / 1000).toFixed(1)}s
                  </span>
                )}
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
              </div>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pb-3 px-4 space-y-3">
            {durationNotice && isActive && (
              <Badge
                variant="outline"
                className="w-full justify-start gap-2 border-primary/20 bg-primary/5 text-primary text-[10px] py-1.5 px-2"
              >
                <Info className="h-3 w-3" />
                <span>{durationNotice}</span>
              </Badge>
            )}

            {sources && sources.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Sources</p>
                <div className="space-y-1.5">
                  {sources.slice(0, 5).map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 p-2 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/30 transition-all group"
                    >
                      <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground group-hover:text-primary truncate">
                          {source.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {new URL(source.url).hostname}
                        </p>
                        {source.content && (
                          <p className="text-[10px] text-muted-foreground/70 mt-1 line-clamp-2">
                            {source.content}
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
