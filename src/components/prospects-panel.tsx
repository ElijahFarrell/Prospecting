"use client";

import { useQuery } from "convex/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle, XCircle, Star, TrendingUp, ExternalLink, Sparkles, Zap } from "lucide-react";
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
    <div className={cn(
      "group relative p-3 rounded-xl transition-all duration-300",
      "border border-white/5 bg-white/[0.02]",
      "hover:bg-white/[0.05] hover:border-primary/30",
      prospect.isQualified && "ring-1 ring-emerald-500/20 bg-emerald-500/[0.02]"
    )}>
      {/* Gradient overlay for qualified */}
      {prospect.isQualified && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
      )}
      
      <div className="flex items-start gap-3 relative">
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white/10 group-hover:ring-primary/30 transition-all">
          {prospect.profilePicUrl ? (
            <AvatarImage src={prospect.profilePicUrl} alt={prospect.handle} />
          ) : null}
          <AvatarFallback className="text-xs font-bold bg-white/5">
            {prospect.handle.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5">
            <a
              href={`https://instagram.com/${prospect.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sm truncate hover:text-primary transition-colors"
            >
              @{prospect.handle}
            </a>
            {prospect.isVerified && (
              <Badge variant="secondary" className="h-4 px-1 text-[9px] shrink-0 bg-blue-500/20 text-blue-400 border-0">
                ✓
              </Badge>
            )}
            <a
              href={`https://instagram.com/${prospect.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 ml-auto text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
            <span className="font-mono">{formatFollowers(prospect.followerCount)}</span>
            <span className="text-white/20">•</span>
            <span className="font-mono">{prospect.engagementRate.toFixed(1)}%</span>
            {prospect.postsCount > 0 && (
              <>
                <span className="text-white/20">•</span>
                <span className="font-mono">{prospect.postsCount} posts</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge
              variant={prospect.isQualified ? "default" : "secondary"}
              className={cn(
                "h-5 text-[10px] font-semibold transition-all",
                prospect.isQualified 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30" 
                  : "bg-white/5 text-muted-foreground border-white/10"
              )}
            >
              {prospect.isQualified ? (
                <>
                  <CheckCircle className="h-2.5 w-2.5 mr-1" />
                  Qualified
                </>
              ) : (
                "Disqualified"
              )}
            </Badge>
            {prospect.transformationScore > 0 && (
              <Badge variant="outline" className="h-5 text-[10px] gap-0.5 border-primary/30 text-primary bg-primary/5">
                <Star className="h-2.5 w-2.5" />
                {prospect.transformationScore}
              </Badge>
            )}
          </div>

          {prospect.isQualified && onFindSimilar && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 mt-2 text-primary/70 hover:text-primary hover:bg-primary/10 transition-all"
              onClick={() => onFindSimilar(prospect.handle, prospect.niche)}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Find Similar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProspectsSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
          <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24 bg-white/5" />
            <Skeleton className="h-3 w-32 bg-white/5" />
            <Skeleton className="h-5 w-16 bg-white/5" />
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
  const allProspects = useQuery(api.prospects.getAllProspects, {});
  const qualifiedProspects = useQuery(api.prospects.getQualifiedProspects, {});

  const isLoading = allProspects === undefined;
  const qualified = (qualifiedProspects || []) as Prospect[];
  const all = (allProspects || []) as Prospect[];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center ring-1 ring-primary/30">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm">Prospects</h2>
            <p className="text-[10px] text-muted-foreground font-mono">
              {all.length} total • {qualified.length} qualified
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="qualified" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-3 mt-3 grid w-auto grid-cols-2 shrink-0 bg-white/5 p-1 rounded-lg">
          <TabsTrigger 
            value="qualified" 
            className="text-[11px] data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-md transition-all"
          >
            <CheckCircle className="h-3 w-3 mr-1.5" />
            Qualified ({qualified.length})
          </TabsTrigger>
          <TabsTrigger 
            value="all" 
            className="text-[11px] data-[state=active]:bg-white/10 data-[state=active]:text-foreground rounded-md transition-all"
          >
            <TrendingUp className="h-3 w-3 mr-1.5" />
            All ({all.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qualified" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full w-full">
            {isLoading ? (
              <ProspectsSkeleton />
            ) : qualified.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                  <XCircle className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No qualified prospects</p>
                <p className="text-[11px] mt-1 text-muted-foreground/70">Start searching to find creators</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
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
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No prospects yet</p>
                <p className="text-[11px] mt-1 text-muted-foreground/70">Start a search to populate this list</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
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
