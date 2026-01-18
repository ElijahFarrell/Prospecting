"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Users,
  TrendingUp,
  Sparkles,
  BadgeCheck,
} from "lucide-react";
import type { CreatorResult } from "@/mastra/tools";
import { cn } from "@/lib/utils";

interface CreatorCardProps {
  creator: CreatorResult;
}

function getScoreColor(score: number): string {
  if (score >= 7) return "text-emerald-400";
  if (score >= 5) return "text-amber-400";
  return "text-rose-400";
}

function getScoreGlow(score: number): string {
  if (score >= 7) return "shadow-[0_0_15px_rgba(16,185,129,0.3)]";
  if (score >= 5) return "shadow-[0_0_15px_rgba(245,158,11,0.3)]";
  return "shadow-[0_0_15px_rgba(244,63,94,0.3)]";
}

function getScoreBg(score: number): string {
  if (score >= 7) return "bg-emerald-500/20 border-emerald-500/30";
  if (score >= 5) return "bg-amber-500/20 border-amber-500/30";
  return "bg-rose-500/20 border-rose-500/30";
}

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 group",
      "border-white/10 bg-white/[0.02] backdrop-blur-sm",
      "hover:border-primary/30 hover:bg-white/[0.04]",
      creator.isQualified && "ring-1 ring-emerald-500/20"
    )}>
      {/* Qualified gradient overlay */}
      {creator.isQualified && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
      )}
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-white/10 group-hover:ring-primary/30 transition-all">
              {creator.profilePicUrl ? (
                <AvatarImage src={creator.profilePicUrl} alt={creator.username} />
              ) : null}
              <AvatarFallback className="text-lg font-bold bg-white/5">
                {creator.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://instagram.com/${creator.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display font-bold hover:text-primary transition-colors"
                >
                  @{creator.username}
                </a>
                {creator.isVerified && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <BadgeCheck className="h-4 w-4 text-blue-400" />
                      </TooltipTrigger>
                      <TooltipContent>Verified Account</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono mt-0.5">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {creator.followers.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {creator.engagementRate.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Score Badge */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all",
                getScoreBg(creator.intentScore),
                getScoreGlow(creator.intentScore)
              )}
            >
              <Sparkles className={cn("h-4 w-4", getScoreColor(creator.intentScore))} />
              <span className={cn("text-xl font-display font-bold", getScoreColor(creator.intentScore))}>
                {creator.intentScore}
              </span>
              <span className="text-[10px] text-muted-foreground">/10</span>
            </div>
            
            {/* Status Badge */}
            {creator.isQualified ? (
              <Badge variant="default" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Qualified
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-white/5 text-muted-foreground border-white/10">
                <XCircle className="h-3 w-3 mr-1" />
                Not Qualified
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        {creator.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{creator.bio}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {creator.transformationDetected && (
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
              <Sparkles className="h-3 w-3 mr-1" />
              Transformation Content
            </Badge>
          )}
          {creator.redFlags.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/5">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {creator.redFlags.length} Red Flag{creator.redFlags.length > 1 ? "s" : ""}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-card border-white/10">
                  <ul className="list-disc list-inside text-xs space-y-1">
                    {creator.redFlags.map((flag, i) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="summary" className="border-white/5">
            <AccordionTrigger className="text-xs py-2 hover:no-underline hover:text-primary transition-colors">
              View Analysis
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground leading-relaxed">{creator.summary}</p>
                {creator.redFlags.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Red Flags</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {creator.redFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="h-3 w-3 mt-0.5 text-amber-500 shrink-0" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full border-white/10 bg-white/5 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all" 
          asChild
        >
          <a
            href={`https://instagram.com/${creator.username}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Profile
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
