"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { CreatorCard } from "./creator-card";
import type { CreatorResult } from "@/mastra/tools";

interface CreatorsPanelProps {
  creators: CreatorResult[];
}

type SortOption = "score" | "followers" | "engagement";
type FilterOption = "all" | "qualified" | "transformation";

export function CreatorsPanel({ creators }: CreatorsPanelProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("score");
  const [filter, setFilter] = useState<FilterOption>("all");

  const filteredCreators = creators
    .filter((c) => {
      if (search && !c.username.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (filter === "qualified" && !c.isQualified) return false;
      if (filter === "transformation" && !c.transformationDetected) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "score") return b.intentScore - a.intentScore;
      if (sort === "followers") return b.followers - a.followers;
      if (sort === "engagement") return b.engagementRate - a.engagementRate;
      return 0;
    });

  const qualifiedCount = creators.filter((c) => c.isQualified).length;
  const transformationCount = creators.filter((c) => c.transformationDetected).length;

  if (creators.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No creators yet</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Start a conversation to discover and analyze Instagram creators for your brand.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Discovered Creators</h2>
            <p className="text-sm text-muted-foreground">
              {creators.length} creator{creators.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {qualifiedCount} Qualified
            </Badge>
            <Badge variant="outline" className="gap-1">
              {transformationCount} Transformation
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search creators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
            <SelectTrigger className="w-[140px]">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="transformation">Transformation</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Intent Score</SelectItem>
              <SelectItem value="followers">Followers</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="grid gap-4">
          {filteredCreators.map((creator) => (
            <CreatorCard key={creator.username} creator={creator} />
          ))}
          {filteredCreators.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No creators match your filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
