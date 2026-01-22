"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  Trash2,
  MessageSquare,
  CheckCircle,
  XCircle,
  Star,
  Search,
  SlidersHorizontal,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProspectDMCard } from "./prospect-dm-card";

const STATUS_OPTIONS = [
  { value: "New", label: "New", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "Qualified", label: "Qualified", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "Outreached", label: "Outreached", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "In Discussion", label: "In Discussion", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "Closed", label: "Closed", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
];

interface Prospect {
  _id: Id<"prospects">;
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
  monetizationGap?: string;
  recentPostSummary?: string;
  bio?: string;
  profilePicUrl?: string;
  isVerified: boolean;
  status: string;
  notes?: string;
  lastContactedAt?: number;
  messageVariations?: {
    methodA: {
      variations: string[];
      valueAssetDescription: string;
    };
    methodB: {
      openers: string[];
      pivotMessage: string;
      valueAssetDescription: string;
    };
  };
  selectedMessage?: {
    method: "A" | "B";
    variationIndex: number;
    text: string;
  };
  messageStatus?: "pending" | "sent" | "drafted";
  instagramUserId?: string;
  createdAt: number;
  updatedAt: number;
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  return (
    <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
      {statusConfig.label}
    </Badge>
  );
}

function ProspectRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  );
}

export function ProspectsTable() {
  const prospects = useQuery(api.prospects.getAllProspects, {});
  const updateProspect = useMutation(api.prospects.updateProspect);
  const deleteProspect = useMutation(api.prospects.deleteProspect);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [qualifiedFilter, setQualifiedFilter] = useState<string>("all");
  const [editingNotes, setEditingNotes] = useState<Id<"prospects"> | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [prospectToDelete, setProspectToDelete] = useState<Prospect | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [dmCardKey, setDmCardKey] = useState(0); // Force re-render when prospect changes

  const isLoading = prospects === undefined;
  const allProspects = (prospects || []) as Prospect[];

  // Filter prospects
  const filteredProspects = allProspects.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.niche.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesQualified =
      qualifiedFilter === "all" ||
      (qualifiedFilter === "qualified" && p.isQualified) ||
      (qualifiedFilter === "disqualified" && !p.isQualified);
    return matchesSearch && matchesStatus && matchesQualified;
  });

  const handleStatusChange = async (id: Id<"prospects">, newStatus: string) => {
    await updateProspect({ id, status: newStatus });
  };

  const handleSaveNotes = async (id: Id<"prospects">) => {
    await updateProspect({ id, notes: notesValue });
    setEditingNotes(null);
  };

  const handleMarkContacted = async (id: Id<"prospects">) => {
    await updateProspect({ id, lastContactedAt: Date.now() });
  };

  const handleDelete = async () => {
    if (prospectToDelete) {
      await deleteProspect({ id: prospectToDelete._id });
      setDeleteDialogOpen(false);
      setProspectToDelete(null);
    }
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by handle or niche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={qualifiedFilter} onValueChange={setQualifiedFilter}>
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10">
              <SelectValue placeholder="Qualified" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="disqualified">Disqualified</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground ml-auto">
          {filteredProspects.length} prospect{filteredProspects.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead className="text-xs uppercase tracking-wider">Creator</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Followers</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Score</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Notes</TableHead>
                <TableHead className="text-xs uppercase tracking-wider w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <ProspectRowSkeleton key={i} />)
              ) : filteredProspects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No prospects found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProspects.map((prospect) => (
                  <TableRow key={prospect._id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-white/10">
                          {prospect.profilePicUrl && (
                            <AvatarImage src={prospect.profilePicUrl} alt={prospect.handle} />
                          )}
                          <AvatarFallback className="bg-white/5 text-xs">
                            {prospect.handle.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`https://instagram.com/${prospect.handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium hover:text-primary transition-colors"
                            >
                              @{prospect.handle}
                            </a>
                            {prospect.isVerified && (
                              <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-blue-500/20 text-blue-400 border-0">
                                ✓
                              </Badge>
                            )}
                            <a
                              href={`https://instagram.com/${prospect.handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{prospect.niche}</span>
                            <span>•</span>
                            <span>{prospect.engagementRate.toFixed(1)}% eng</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatFollowers(prospect.followerCount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {prospect.isQualified ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-400" />
                        )}
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-primary" />
                          <span className="text-sm font-medium">{prospect.transformationScore}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={prospect.status}
                        onValueChange={(value) => handleStatusChange(prospect._id, value)}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs bg-transparent border-white/10">
                          <SelectValue>
                            <StatusBadge status={prospect.status} />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {editingNotes === prospect._id ? (
                        <div className="flex gap-2">
                          <Textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            className="h-16 text-xs bg-white/5 border-white/10"
                            placeholder="Add notes..."
                          />
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => handleSaveNotes(prospect._id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setEditingNotes(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingNotes(prospect._id);
                            setNotesValue(prospect.notes || "");
                          }}
                          className="text-left text-xs text-muted-foreground hover:text-foreground transition-colors max-w-[200px] truncate"
                        >
                          {prospect.notes || "Add notes..."}
                        </button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-white/5"
                          onClick={() => {
                            setSelectedProspect(prospect);
                            setDetailDialogOpen(true);
                            setDmCardKey((k) => k + 1);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        {prospect.isQualified && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/20 hover:text-primary"
                            onClick={() => {
                              setSelectedProspect(prospect);
                              setDetailDialogOpen(true);
                              setDmCardKey((k) => k + 1);
                            }}
                            title="Open DM Messages"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-rose-500/20 hover:text-rose-400"
                          onClick={() => {
                            setProspectToDelete(prospect);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="font-display">Delete Prospect?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete @{prospectToDelete?.handle}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="border-white/10">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedProspect && (
            <>
              <DialogHeader className="shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-white/10">
                    {selectedProspect.profilePicUrl && (
                      <AvatarImage src={selectedProspect.profilePicUrl} alt={selectedProspect.handle} />
                    )}
                    <AvatarFallback className="bg-white/5">
                      {selectedProspect.handle.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="font-display">@{selectedProspect.handle}</DialogTitle>
                    <DialogDescription>{selectedProspect.niche}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-lg font-bold">{formatFollowers(selectedProspect.followerCount)}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-lg font-bold">{selectedProspect.engagementRate.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Engagement</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-lg font-bold">{selectedProspect.transformationScore}/10</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                  </div>
                  {selectedProspect.bio && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Bio</h4>
                      <p className="text-sm">{selectedProspect.bio}</p>
                    </div>
                  )}
                  {selectedProspect.outreachAngle && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Outreach Angle</h4>
                      <p className="text-sm text-primary">{selectedProspect.outreachAngle}</p>
                    </div>
                  )}
                  {selectedProspect.disqualificationReason && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Disqualification Reason</h4>
                      <p className="text-sm text-rose-400">{selectedProspect.disqualificationReason}</p>
                    </div>
                  )}
                  {selectedProspect.lastContactedAt && (
                    <div className="text-xs text-muted-foreground">
                      Last contacted: {formatDate(selectedProspect.lastContactedAt)}
                    </div>
                  )}

                  {/* DM Message Section */}
                  {selectedProspect.isQualified && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">DM Message</h4>
                      <ProspectDMCard
                        key={dmCardKey}
                        prospect={{
                          ...selectedProspect,
                          followerCount: selectedProspect.followerCount,
                          engagementRate: selectedProspect.engagementRate,
                          transformationScore: selectedProspect.transformationScore,
                          postsCount: selectedProspect.postsCount,
                        }}
                        onStatusChange={() => {
                          // Find the updated prospect from the reactive query
                          // Use setTimeout to ensure Convex query has updated
                          setTimeout(() => {
                            if (selectedProspect && prospects) {
                              const updatedProspect = prospects.find(
                                (p) => p._id === selectedProspect._id
                              );
                              if (updatedProspect) {
                                setSelectedProspect(updatedProspect);
                                setDmCardKey((k) => k + 1);
                              }
                            }
                          }, 100);
                        }}
                      />
                    </div>
                  )}
                </div>
              </ScrollArea>
              <DialogFooter className="gap-2 shrink-0 border-t border-white/10 pt-4 mt-4">
                <Button
                  variant="outline"
                  className="border-white/10"
                  onClick={() => handleMarkContacted(selectedProspect._id)}
                >
                  Mark as Contacted
                </Button>
                <Button asChild>
                  <a
                    href={`https://instagram.com/${selectedProspect.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Profile
                  </a>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

