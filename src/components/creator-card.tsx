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

interface CreatorCardProps {
  creator: CreatorResult;
}

function getScoreColor(score: number): string {
  if (score >= 7) return "text-green-600 dark:text-green-400";
  if (score >= 5) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBg(score: number): string {
  if (score >= 7) return "bg-green-100 dark:bg-green-900/30";
  if (score >= 5) return "bg-yellow-100 dark:bg-yellow-900/30";
  return "bg-red-100 dark:bg-red-900/30";
}

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-background">
              {creator.profilePicUrl ? (
                <AvatarImage src={creator.profilePicUrl} alt={creator.username} />
              ) : null}
              <AvatarFallback className="text-lg">
                {creator.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://instagram.com/${creator.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:underline"
                >
                  @{creator.username}
                </a>
                {creator.isVerified && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <BadgeCheck className="h-4 w-4 text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent>Verified Account</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${getScoreBg(
                creator.intentScore
              )}`}
            >
              <Sparkles className={`h-4 w-4 ${getScoreColor(creator.intentScore)}`} />
              <span className={`text-lg font-bold ${getScoreColor(creator.intentScore)}`}>
                {creator.intentScore}
              </span>
              <span className="text-xs text-muted-foreground">/10</span>
            </div>
            {creator.isQualified ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Qualified
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" />
                Not Qualified
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {creator.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">{creator.bio}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {creator.transformationDetected && (
            <Badge variant="outline" className="border-green-500 text-green-600">
              <Sparkles className="h-3 w-3 mr-1" />
              Transformation Content
            </Badge>
          )}
          {creator.redFlags.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {creator.redFlags.length} Red Flag{creator.redFlags.length > 1 ? "s" : ""}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <ul className="list-disc list-inside text-sm">
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
          <AccordionItem value="summary" className="border-none">
            <AccordionTrigger className="text-sm py-2 hover:no-underline">
              View Analysis
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground">{creator.summary}</p>
                {creator.redFlags.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-yellow-600">Red Flags:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {creator.redFlags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <AlertTriangle className="h-3 w-3 mt-0.5 text-yellow-500" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button variant="outline" size="sm" className="w-full" asChild>
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
