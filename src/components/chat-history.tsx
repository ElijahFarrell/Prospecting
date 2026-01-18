"use client";

import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MessageSquare, Plus, Trash2, Edit2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface Thread {
  _id: Id<"threads">;
  title: string;
  createdAt: number;
  updatedAt: number;
}

interface ChatHistoryProps {
  className?: string;
  activeThreadId?: Id<"threads">;
  onSelectThread: (threadId: Id<"threads"> | null) => void;
  onNewThread: () => void;
}

interface ThreadItemProps {
  thread: Thread;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

function ThreadItem({
  thread,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: ThreadItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== thread.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-200",
        isActive 
          ? "bg-primary/10" 
          : "hover:bg-white/[0.03]"
      )}
      onClick={onSelect}
    >
      {/* Active indicator */}
      <div className={cn(
        "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r transition-all",
        isActive ? "bg-primary" : "bg-transparent group-hover:bg-white/20"
      )} />
      
      <div className={cn(
        "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
        isActive ? "bg-primary/20" : "bg-white/5"
      )}>
        <MessageSquare className={cn(
          "h-3.5 w-3.5",
          isActive ? "text-primary" : "text-muted-foreground"
        )} />
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setIsEditing(false);
            }}
            className="h-6 text-xs bg-white/5 border-white/10"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <p className={cn(
              "text-xs font-medium truncate transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
            )}>
              {thread.title}
            </p>
            <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
              <Clock className="h-2.5 w-2.5" />
              {formatDate(thread.updatedAt)}
            </p>
          </>
        )}
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-white/10 hover:text-foreground text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-rose-500/20 hover:text-rose-400 text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function ThreadsSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5">
          <Skeleton className="h-7 w-7 rounded-lg bg-white/5" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-full bg-white/5" />
            <Skeleton className="h-2 w-16 bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatHistory({
  className,
  activeThreadId,
  onSelectThread,
  onNewThread,
}: ChatHistoryProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<Id<"threads"> | null>(null);

  const threads = useQuery(api.chats.getThreads);
  const updateTitle = useMutation(api.chats.updateThreadTitle);
  const deleteThread = useMutation(api.chats.deleteThread);

  const isLoading = threads === undefined;
  const threadList = (threads || []) as Thread[];

  const handleRename = (threadId: Id<"threads">, title: string) => {
    updateTitle({ threadId, title });
  };

  const handleDelete = () => {
    if (threadToDelete && deleteThread) {
      deleteThread({ threadId: threadToDelete });
      if (activeThreadId === threadToDelete) {
        onSelectThread(null);
      }
    }
    setDeleteDialogOpen(false);
    setThreadToDelete(null);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-3 border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
        <Button 
          onClick={onNewThread} 
          className="w-full h-9 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 shadow-[0_0_10px_hsla(var(--primary)/0.15)]" 
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <ThreadsSkeleton />
        ) : threadList.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mx-auto w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">No conversations</p>
            <p className="text-[10px] mt-1 text-muted-foreground/70">Start a chat to begin</p>
          </div>
        ) : (
          <div className="py-1">
            {threadList.map((thread) => (
              <ThreadItem
                key={thread._id}
                thread={thread}
                isActive={activeThreadId === thread._id}
                onSelect={() => onSelectThread(thread._id)}
                onRename={(title) => handleRename(thread._id, title)}
                onDelete={() => {
                  setThreadToDelete(thread._id);
                  setDeleteDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="font-display">Delete conversation?</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              This will permanently delete this conversation and all its messages. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className="border-white/10 bg-white/5 hover:bg-white/10"
            >
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
    </div>
  );
}
