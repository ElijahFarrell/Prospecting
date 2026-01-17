"use client";

import { useQuery } from "convex/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle, XCircle, Star, TrendingUp, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";

interface Prospect {
  _id: string;
  handle: string;
  niche: string;
  followerCount: number;
  followingCount: number;
  postsCount: number;
  engagementRate: number;
  transformationScore: number;
  isQualified: boolean;
  disqualificationReason?: string;
  outreachAngle?: string;
  bio?: string;
  profilePicUrl?: string;
  isVerified: boolean;
  status: string;
}

interface ProspectItemProps {
  prospect: Prospect;
  onFindSimilar?: (handle: string, niche: string) => void;
}

function ProspectItem({ prospect, onFindSimilar }: ProspectItemProps) {
  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
      <Avatar className="h-9 w-9 shrink-0">
        {prospect.profilePicUrl ? (
          <AvatarImage src={prospect.profilePicUrl} alt={prospect.handle} />
        ) : null}
        <AvatarFallback className="text-xs">
          {prospect.handle.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-1.5">
          <a
            href={`https://instagram.com/${prospect.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm truncate hover:underline text-foreground"
          >
            @{prospect.handle}
          </a>
          {prospect.isVerified && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] shrink-0">
              ✓
            </Badge>
          )}
          <a
            href={`https://instagram.com/${prospect.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
          <span>{formatFollowers(prospect.followerCount)}</span>
          <span>•</span>
          <span>{prospect.engagementRate.toFixed(1)}%</span>
        </div>

        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          <Badge
            variant={prospect.isQualified ? "default" : "secondary"}
            className={cn(
              "h-5 text-[10px]",
              prospect.isQualified ? "bg-green-600 hover:bg-green-700" : ""
            )}
          >
            {prospect.isQualified ? "Qualified" : "Disqualified"}
          </Badge>
          {prospect.transformationScore > 0 && (
            <Badge variant="outline" className="h-5 text-[10px] gap-0.5">
              <Star className="h-2.5 w-2.5" />
              {prospect.transformationScore}
            </Badge>
          )}
        </div>

        {prospect.isQualified && onFindSimilar && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2 mt-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => onFindSimilar(prospect.handle, prospect.niche)}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Find Similar
          </Button>
        )}
      </div>
    </div>
  );
}

function ProspectsSkeleton() {
  return (
    <div className="space-y-3 p-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ProspectsPanelProps {
  className?: string;
  onFindSimilar?: (handle: string, niche: string) => void;
}

export function ProspectsPanel({ className, onFindSimilar }: ProspectsPanelProps) {
  // Convex hooks - always called unconditionally
  const allProspects = useQuery(api.prospects.getAllProspects);
  const qualifiedProspects = useQuery(api.prospects.getQualifiedProspects);

  const isLoading = allProspects === undefined;
  const qualified = (qualifiedProspects || []) as Prospect[];
  const all = (allProspects || []) as Prospect[];

  return (
    <div className={cn("flex flex-col h-full border-l bg-background", className)}>
      <div className="p-4 border-b">
        <h2 className="font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Prospects
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {all.length} total • {qualified.length} qualified
        </p>
      </div>

      <Tabs defaultValue="qualified" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-2 grid w-auto grid-cols-2 shrink-0">
          <TabsTrigger value="qualified" className="text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Qualified ({qualified.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            All ({all.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qualified" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full w-full">
            {isLoading ? (
              <ProspectsSkeleton />
            ) : qualified.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No qualified prospects yet</p>
                <p className="text-xs mt-1">Start searching to find creators</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {qualified.map((prospect) => (
                  <ProspectItem 
                    key={prospect._id} 
                    prospect={prospect} 
                    onFindSimilar={onFindSimilar}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="all" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full w-full">
            {isLoading ? (
              <ProspectsSkeleton />
            ) : all.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No prospects yet</p>
                <p className="text-xs mt-1">Start a search to populate this list</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {all.map((prospect) => (
                  <ProspectItem 
                    key={prospect._id} 
                    prospect={prospect} 
                    onFindSimilar={prospect.isQualified ? onFindSimilar : undefined}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
