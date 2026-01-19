"use client";

import { useState, useCallback } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { Chat } from "@/components/chat";
import { ProspectsPanel } from "@/components/prospects-panel";
import { ChatHistory } from "@/components/chat-history";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, Sparkles, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, TestTube2, Loader2, Users, Settings } from "lucide-react";
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
    <>
      {/* Loading state */}
      <AuthLoading>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AuthLoading>

      {/* Unauthenticated - Show sign in */}
      <Unauthenticated>
        <div className="flex h-screen items-center justify-center bg-background">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl">Shiloh Prospecting</CardTitle>
              <CardDescription>
                AI-powered creator prospecting by Shiloh AI
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SignInButton mode="modal">
                <Button size="lg">Sign In to Continue</Button>
              </SignInButton>
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>

      {/* Authenticated - Show main app */}
      <Authenticated>
        <div className="flex h-screen flex-col bg-background text-foreground">
          {/* Header */}
          <header className="glass flex items-center justify-between px-6 py-4 shrink-0 z-50">
            <div className="flex items-center gap-4">
              {/* Left panel toggle - Desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex hover:bg-white/5"
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              >
                {leftPanelOpen ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeft className="h-5 w-5" />
                )}
              </Button>

              {/* Left panel toggle - Mobile */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <PanelLeft className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 border-r-white/10 bg-background/95 backdrop-blur-xl">
                  <ChatHistory
                    activeThreadId={activeThreadId ?? undefined}
                    onSelectThread={handleSelectThread}
                    onNewThread={handleNewThread}
                  />
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-lg tracking-tight">Shiloh Prospecting</h1>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">by Shiloh AI</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {creators.length > 0 && (
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  {creators.length} creator{creators.length !== 1 ? "s" : ""} found
                </span>
              )}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
                <Button variant="ghost" size="sm" asChild className="h-8 hover:bg-white/5 hover:text-primary">
                  <Link href="/prospects">
                    <Users className="h-4 w-4 mr-2" />
                    Prospects
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="h-8 hover:bg-white/5 hover:text-primary">
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="h-8 hover:bg-white/5 hover:text-primary">
                  <Link href="/test">
                    <TestTube2 className="h-4 w-4 mr-2" />
                    Test
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="h-8 hover:bg-white/5 hover:text-primary">
                  <Link href="/debug">
                    <Bug className="h-4 w-4 mr-2" />
                    Debug
                  </Link>
                </Button>
              </div>

              <div className="h-8 w-[1px] bg-white/10 mx-1" />

              {/* User menu */}
              <UserButton afterSignOutUrl="/" />

              {/* Right panel toggle - Desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex hover:bg-white/5"
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
              >
                {rightPanelOpen ? (
                  <PanelRightClose className="h-5 w-5" />
                ) : (
                  <PanelRight className="h-5 w-5" />
                )}
              </Button>

              {/* Right panel toggle - Mobile */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <PanelRight className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 p-0 border-l-white/10 bg-background/95 backdrop-blur-xl">
                  <ProspectsPanel />
                </SheetContent>
              </Sheet>
            </div>
          </header>

          {/* Main content - Dashboard Grid Layout */}
          <div className="flex flex-1 gap-4 p-4 overflow-hidden relative z-0">
            {/* Left sidebar - Chat History */}
            {leftPanelOpen && (
              <div className="hidden md:flex w-72 shrink-0 glass-card rounded-2xl overflow-hidden flex-col animate-in slide-in-from-left-4 fade-in duration-500">
                <ChatHistory
                  activeThreadId={activeThreadId ?? undefined}
                  onSelectThread={handleSelectThread}
                  onNewThread={handleNewThread}
                />
              </div>
            )}

            {/* Center - Chat */}
            <div className="flex-1 flex flex-col min-w-0 glass-card rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-500 delay-75">
              <Chat 
                onCreatorsFound={handleCreatorsFound} 
                threadId={activeThreadId ?? undefined}
                onThreadCreated={handleThreadCreated}
              />
            </div>

            {/* Right sidebar - Prospects */}
            {rightPanelOpen && (
              <div className="hidden md:flex w-80 shrink-0 glass-card rounded-2xl overflow-hidden flex-col animate-in slide-in-from-right-4 fade-in duration-500 delay-150">
                <ProspectsPanel />
              </div>
            )}
          </div>
        </div>
      </Authenticated>
    </>
  );
}
