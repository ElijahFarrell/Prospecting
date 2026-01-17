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
import { MessageSquare, Plus, Trash2, Edit2 } from "lucide-react";
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
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
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
        "group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors border-b border-border/50",
        isActive 
          ? "border-l-2 border-l-primary bg-transparent" 
          : "border-l-2 border-l-transparent hover:border-l-muted-foreground/50"
      )}
      onClick={onSelect}
    >
      <MessageSquare className={cn(
        "h-4 w-4 shrink-0",
        isActive ? "text-primary" : "text-muted-foreground"
      )} />

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
            className="h-6 text-sm"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <p className="text-sm font-medium truncate">{thread.title}</p>
            <p className="text-xs text-muted-foreground">{formatDate(thread.updatedAt)}</p>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
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
          className="h-6 w-6 text-destructive hover:text-destructive"
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
    <div className="space-y-2 p-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-2 p-2">
          <Skeleton className="h-4 w-4 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-16" />
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

  // Convex hooks - always called unconditionally
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
    <div className={cn("flex flex-col h-full border-r bg-background", className)}>
      <div className="p-4 border-b">
        <Button onClick={onNewThread} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <ThreadsSkeleton />
        ) : threadList.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-xs mt-1">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="divide-y-0">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversation?</DialogTitle>
            <DialogDescription>
              This will permanently delete this conversation and all its messages. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
