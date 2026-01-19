"use client";

import { useState, useEffect } from "react";
import { Authenticated, Unauthenticated, AuthLoading, useQuery, useMutation } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Loader2,
  ArrowLeft,
  Settings,
  Save,
  RotateCcw,
  Bot,
  Sliders,
  Check,
} from "lucide-react";
import Link from "next/link";

// Default agent prompts (for reference/reset)
const DEFAULT_PROMPTS = {
  orchestrator: `You are the Head of Prospecting Operations. Your goal is to help brands find high-value Instagram creators for partnerships with an Infoproduct Growth Agency (IPGA).

YOUR ROLE:
You manage a team of sub-agents that do the actual prospecting:
- The Scout (searches Instagram and filters by follower count)
- The Analyst (evaluates creators on transformation, authenticity, demographics)
- The Profiler (creates personalized outreach strategies)

CRITICAL RULES:
- Only find ENGLISH-speaking creators
- Be conversational and helpful
- If request is vague, ask clarifying questions`,
  scout: `You are Shiloh Scout, an AI assistant that helps brands find Instagram creators for partnerships.

Your capabilities:
- Search Instagram by hashtag to discover creators
- Filter creators by follower count
- Analyze creators for authenticity, engagement quality, and brand fit`,
  analyst: `You are the Analyst. Your role is to vet Instagram creators for brand partnerships.

ANALYSIS FRAMEWORK - The 3 Pillars:
1. TRANSFORMATION (40% weight)
2. AUDIENCE AUTHENTICITY (35% weight)
3. DEMOGRAPHICS & FIT (25% weight)`,
  profiler: `You are the Profiler. Your role is to create personalized outreach strategies for qualified creators.

Focus on:
- Identifying monetization gaps
- Crafting personalized hooks
- Suggesting partnership angles`,
};

const DEFAULT_PARAMS = {
  minFollowers: 20000,
  maxFollowers: 150000,
  searchDepth: 30,
  targetQualified: 3,
};

function SettingsContent() {
  const settings = useQuery(api.settings.getSettings);
  const saveSettings = useMutation(api.settings.saveSettings);
  const resetSettings = useMutation(api.settings.resetSettings);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [orchestratorPrompt, setOrchestratorPrompt] = useState("");
  const [scoutPrompt, setScoutPrompt] = useState("");
  const [analystPrompt, setAnalystPrompt] = useState("");
  const [profilerPrompt, setProfilerPrompt] = useState("");
  const [minFollowers, setMinFollowers] = useState(DEFAULT_PARAMS.minFollowers);
  const [maxFollowers, setMaxFollowers] = useState(DEFAULT_PARAMS.maxFollowers);
  const [searchDepth, setSearchDepth] = useState(DEFAULT_PARAMS.searchDepth);
  const [targetQualified, setTargetQualified] = useState(DEFAULT_PARAMS.targetQualified);

  // Load settings when they arrive
  useEffect(() => {
    if (settings) {
      setOrchestratorPrompt(settings.orchestratorPrompt || "");
      setScoutPrompt(settings.scoutPrompt || "");
      setAnalystPrompt(settings.analystPrompt || "");
      setProfilerPrompt(settings.profilerPrompt || "");
      setMinFollowers(settings.defaultMinFollowers || DEFAULT_PARAMS.minFollowers);
      setMaxFollowers(settings.defaultMaxFollowers || DEFAULT_PARAMS.maxFollowers);
      setSearchDepth(settings.defaultSearchDepth || DEFAULT_PARAMS.searchDepth);
      setTargetQualified(settings.defaultTargetQualified || DEFAULT_PARAMS.targetQualified);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings({
        orchestratorPrompt: orchestratorPrompt || undefined,
        scoutPrompt: scoutPrompt || undefined,
        analystPrompt: analystPrompt || undefined,
        profilerPrompt: profilerPrompt || undefined,
        defaultMinFollowers: minFollowers,
        defaultMaxFollowers: maxFollowers,
        defaultSearchDepth: searchDepth,
        defaultTargetQualified: targetQualified,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    await resetSettings();
    setOrchestratorPrompt("");
    setScoutPrompt("");
    setAnalystPrompt("");
    setProfilerPrompt("");
    setMinFollowers(DEFAULT_PARAMS.minFollowers);
    setMaxFollowers(DEFAULT_PARAMS.maxFollowers);
    setSearchDepth(DEFAULT_PARAMS.searchDepth);
    setTargetQualified(DEFAULT_PARAMS.targetQualified);
  };

  const isLoading = settings === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/5 p-1 rounded-lg">
          <TabsTrigger
            value="agents"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-md"
          >
            <Bot className="h-4 w-4 mr-2" />
            Agent Prompts
          </TabsTrigger>
          <TabsTrigger
            value="defaults"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-md"
          >
            <Sliders className="h-4 w-4 mr-2" />
            Default Parameters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="mt-6 space-y-6">
          <Card className="border-white/10 bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                  Orchestrator
                </Badge>
                System Prompt
              </CardTitle>
              <CardDescription>
                The main agent that coordinates prospecting workflows. Leave empty to use defaults.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={orchestratorPrompt}
                onChange={(e) => setOrchestratorPrompt(e.target.value)}
                placeholder={DEFAULT_PROMPTS.orchestrator}
                className="min-h-[200px] bg-white/5 border-white/10 font-mono text-xs"
              />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Scout
                </Badge>
                System Prompt
              </CardTitle>
              <CardDescription>
                Searches Instagram and filters creators by follower count.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={scoutPrompt}
                onChange={(e) => setScoutPrompt(e.target.value)}
                placeholder={DEFAULT_PROMPTS.scout}
                className="min-h-[150px] bg-white/5 border-white/10 font-mono text-xs"
              />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Analyst
                </Badge>
                System Prompt
              </CardTitle>
              <CardDescription>
                Evaluates creators for transformation, authenticity, and demographics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={analystPrompt}
                onChange={(e) => setAnalystPrompt(e.target.value)}
                placeholder={DEFAULT_PROMPTS.analyst}
                className="min-h-[150px] bg-white/5 border-white/10 font-mono text-xs"
              />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Profiler
                </Badge>
                System Prompt
              </CardTitle>
              <CardDescription>
                Creates personalized outreach strategies for qualified creators.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={profilerPrompt}
                onChange={(e) => setProfilerPrompt(e.target.value)}
                placeholder={DEFAULT_PROMPTS.profiler}
                className="min-h-[150px] bg-white/5 border-white/10 font-mono text-xs"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaults" className="mt-6">
          <Card className="border-white/10 bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-lg font-display">Search Parameters</CardTitle>
              <CardDescription>
                Default values used when starting a new prospecting search.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Followers</label>
                  <Input
                    type="number"
                    value={minFollowers}
                    onChange={(e) => setMinFollowers(parseInt(e.target.value) || 0)}
                    className="bg-white/5 border-white/10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum follower count for creators
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Followers</label>
                  <Input
                    type="number"
                    value={maxFollowers}
                    onChange={(e) => setMaxFollowers(parseInt(e.target.value) || 0)}
                    className="bg-white/5 border-white/10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum follower count for creators
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Depth</label>
                  <Input
                    type="number"
                    value={searchDepth}
                    onChange={(e) => setSearchDepth(parseInt(e.target.value) || 0)}
                    className="bg-white/5 border-white/10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of posts to scan (10=quick, 30=standard, 50=deep)
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Qualified</label>
                  <Input
                    type="number"
                    value={targetQualified}
                    onChange={(e) => setTargetQualified(parseInt(e.target.value) || 0)}
                    className="bg-white/5 border-white/10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Target number of qualified creators per search
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator className="bg-white/10" />

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleReset}
          className="border-white/10 hover:bg-white/5"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <AuthLoading>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AuthLoading>

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
              <CardDescription>Sign in to access settings</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SignInButton mode="modal">
                <Button size="lg">Sign In to Continue</Button>
              </SignInButton>
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>

      <Authenticated>
        <div className="flex h-screen flex-col bg-background text-foreground">
          {/* Header */}
          <header className="glass flex items-center justify-between px-6 py-4 shrink-0 z-50">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="hover:bg-white/5">
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                  <Settings className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-lg tracking-tight">Settings</h1>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Customize your experience
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/" />
            </div>
          </header>

          {/* Main content */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <SettingsContent />
            </div>
          </div>
        </div>
      </Authenticated>
    </>
  );
}

