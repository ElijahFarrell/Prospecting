"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Sparkles, CheckCircle2, Loader2 } from "lucide-react";

interface ScoutProgressData {
  stage: "searching" | "discovered" | "fetching" | "analyzing" | "analyzed" | "complete";
  message: string;
  count?: number;
  current?: number;
  total?: number;
  creator?: {
    username: string;
    followers?: number;
    profilePicUrl?: string;
    intentScore?: number;
    isQualified?: boolean;
  };
  results?: {
    total: number;
    analyzed: number;
    qualified: number;
  };
}

interface ScoutProgressProps {
  data: ScoutProgressData;
}

export function ScoutProgress({ data }: ScoutProgressProps) {
  const progressPercent =
    data.current && data.total ? Math.round((data.current / data.total) * 100) : 0;

  return (
    <Card className="w-full border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {data.stage === "complete" ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          <CardTitle className="text-sm font-medium">{data.message}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(data.stage === "fetching" || data.stage === "analyzing") && data.total && (
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {data.current} of {data.total}
            </p>
          </div>
        )}

        {data.stage === "discovered" && data.count && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{data.count} creators found</span>
          </div>
        )}

        {data.stage === "analyzing" && data.creator && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Avatar className="h-10 w-10">
              {data.creator.profilePicUrl ? (
                <AvatarImage src={data.creator.profilePicUrl} alt={data.creator.username} />
              ) : null}
              <AvatarFallback>{data.creator.username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">@{data.creator.username}</p>
              {data.creator.followers && (
                <p className="text-xs text-muted-foreground">
                  {data.creator.followers.toLocaleString()} followers
                </p>
              )}
            </div>
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </div>
        )}

        {data.stage === "complete" && data.results && (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Search className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-semibold">{data.results.total}</p>
              <p className="text-xs text-muted-foreground">Discovered</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-lg font-semibold">{data.results.analyzed}</p>
              <p className="text-xs text-muted-foreground">Analyzed</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-semibold text-primary">{data.results.qualified}</p>
              <p className="text-xs text-muted-foreground">Qualified</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ScoutProgressSkeleton() {
  return (
    <Card className="w-full border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-2 w-full mb-2" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </CardContent>
    </Card>
  );
}

