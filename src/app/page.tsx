"use client";

import { useState, useCallback } from "react";
import { Chat } from "@/components/chat";
import { ProspectsPanel } from "@/components/prospects-panel";
import { ChatHistory } from "@/components/chat-history";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bug, Sparkles, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, TestTube2 } from "lucide-react";
import Link from "next/link";
import type { CreatorResult } from "@/mastra/tools";
import type { Id } from "../../convex/_generated/dataModel";

export default function HomePage() {
  const [creators, setCreators] = useState<CreatorResult[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<Id<"threads"> | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const handleCreatorsFound = (newCreators: CreatorResult[]) => {
    setCreators((prev) => {
      const existing = new Set(prev.map((c) => c.username));
      const unique = newCreators.filter((c) => !existing.has(c.username));
      return [...prev, ...unique];
    });
  };

  const handleSelectThread = useCallback((threadId: Id<"threads"> | null) => {
    setActiveThreadId(threadId);
  }, []);

  const handleNewThread = useCallback(() => {
    setActiveThreadId(null);
  }, []);

  const handleThreadCreated = useCallback((threadId: Id<"threads">) => {
    setActiveThreadId(threadId);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Left panel toggle - Desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          >
            {leftPanelOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Left panel toggle - Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <PanelLeft className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <ChatHistory
                activeThreadId={activeThreadId ?? undefined}
                onSelectThread={handleSelectThread}
                onNewThread={handleNewThread}
              />
            </SheetContent>
          </Sheet>

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold">Creator Scout</h1>
            <p className="text-xs text-muted-foreground">AI-powered creator discovery</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {creators.length > 0 && (
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {creators.length} creator{creators.length !== 1 ? "s" : ""} found
            </span>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/test">
              <TestTube2 className="h-4 w-4 mr-2" />
              Test
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/debug">
              <Bug className="h-4 w-4 mr-2" />
              Debug
            </Link>
          </Button>

          {/* Right panel toggle - Desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
          >
            {rightPanelOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRight className="h-4 w-4" />
            )}
          </Button>

          {/* Right panel toggle - Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <PanelRight className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <ProspectsPanel />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Chat History */}
        {leftPanelOpen && (
          <div className="hidden md:flex w-64 shrink-0">
            <ChatHistory
              activeThreadId={activeThreadId ?? undefined}
              onSelectThread={handleSelectThread}
              onNewThread={handleNewThread}
            />
          </div>
        )}

        {/* Center - Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <Chat 
            onCreatorsFound={handleCreatorsFound} 
            threadId={activeThreadId ?? undefined}
            onThreadCreated={handleThreadCreated}
          />
        </div>

        {/* Right sidebar - Prospects */}
        {rightPanelOpen && (
          <div className="hidden md:flex w-72 shrink-0">
            <ProspectsPanel />
          </div>
        )}
      </div>
    </div>
  );
}
