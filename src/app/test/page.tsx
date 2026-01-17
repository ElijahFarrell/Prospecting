"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Play, Copy, Check, AlertCircle, Clock, Hash, User, MessageSquare, Code } from "lucide-react";
import Link from "next/link";

interface TestResult {
  success: boolean;
  duration?: string;
  error?: string;
  result?: unknown;
  rawItems?: unknown[];
  itemCount?: number;
  actorId?: string;
}

function JsonViewer({ data, title }: { data: unknown; title?: string }) {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      {title && <p className="text-sm font-medium mb-2 text-muted-foreground">{title}</p>}
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 z-10"
        onClick={copyToClipboard}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <ScrollArea className="h-[400px] rounded-md border bg-muted/30">
        <pre className="p-4 text-xs font-mono overflow-x-auto">
          {jsonString}
        </pre>
      </ScrollArea>
    </div>
  );
}

function TestCard({
  title,
  description,
  icon: Icon,
  children,
  result,
  loading,
  onTest,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  result: TestResult | null;
  loading: boolean;
  onTest: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {result && (
            <div className="flex items-center gap-2">
              {result.success ? (
                <Badge variant="default" className="bg-green-600">Success</Badge>
              ) : (
                <Badge variant="destructive">Failed</Badge>
              )}
              {result.duration && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {result.duration}
                </Badge>
              )}
            </div>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-2">
            {children}
          </div>
          <Button onClick={onTest} disabled={loading} className="shrink-0">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Test
              </>
            )}
          </Button>
        </div>

        {result?.error ? (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="text-sm">{result.error}</p>
          </div>
        ) : null}

        {result?.success && result.result ? (
          <JsonViewer data={result.result} title="Parsed Result" />
        ) : null}

        {result?.success && result.rawItems ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Raw items: {result.itemCount} • Actor: <code className="text-xs bg-muted px-1 rounded">{result.actorId}</code>
            </p>
            <JsonViewer data={result.rawItems} title="Raw Apify Response" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function TestPage() {
  // Hashtag test state
  const [hashtag, setHashtag] = useState("fitness");
  const [hashtagResult, setHashtagResult] = useState<TestResult | null>(null);
  const [hashtagLoading, setHashtagLoading] = useState(false);

  // Profile test state
  const [username, setUsername] = useState("cristiano");
  const [profileResult, setProfileResult] = useState<TestResult | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Batch profile test state
  const [usernames, setUsernames] = useState("cristiano, leomessi");
  const [batchResult, setBatchResult] = useState<TestResult | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // Comments test state
  const [postUrl, setPostUrl] = useState("https://www.instagram.com/p/CfevKEjjO3W/");
  const [commentsResult, setCommentsResult] = useState<TestResult | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Raw test state
  const [rawActor, setRawActor] = useState("profile");
  const [rawInput, setRawInput] = useState('{"usernames": ["apifytech"]}');
  const [rawResult, setRawResult] = useState<TestResult | null>(null);
  const [rawLoading, setRawLoading] = useState(false);

  const testHashtag = async () => {
    setHashtagLoading(true);
    setHashtagResult(null);
    try {
      const res = await fetch("/api/test/hashtag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hashtag }),
      });
      const data = await res.json();
      setHashtagResult(data);
    } catch (error) {
      setHashtagResult({ success: false, error: String(error) });
    }
    setHashtagLoading(false);
  };

  const testProfile = async () => {
    setProfileLoading(true);
    setProfileResult(null);
    try {
      const res = await fetch("/api/test/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      setProfileResult(data);
    } catch (error) {
      setProfileResult({ success: false, error: String(error) });
    }
    setProfileLoading(false);
  };

  const testBatch = async () => {
    setBatchLoading(true);
    setBatchResult(null);
    try {
      const usernameList = usernames.split(",").map((u) => u.trim()).filter(Boolean);
      const res = await fetch("/api/test/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: usernameList }),
      });
      const data = await res.json();
      setBatchResult(data);
    } catch (error) {
      setBatchResult({ success: false, error: String(error) });
    }
    setBatchLoading(false);
  };

  const testComments = async () => {
    setCommentsLoading(true);
    setCommentsResult(null);
    try {
      const res = await fetch("/api/test/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postUrl }),
      });
      const data = await res.json();
      setCommentsResult(data);
    } catch (error) {
      setCommentsResult({ success: false, error: String(error) });
    }
    setCommentsLoading(false);
  };

  const testRaw = async () => {
    setRawLoading(true);
    setRawResult(null);
    try {
      const input = JSON.parse(rawInput);
      const res = await fetch("/api/test/raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: rawActor, input }),
      });
      const data = await res.json();
      setRawResult(data);
    } catch (error) {
      setRawResult({ success: false, error: String(error) });
    }
    setRawLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">API Test Console</h1>
            <p className="text-sm text-muted-foreground">Test Apify actors and view raw responses</p>
          </div>
          <div className="flex gap-2">
            <Link href="/">
              <Button variant="outline" size="sm">Back to App</Button>
            </Link>
            <Link href="/debug">
              <Button variant="outline" size="sm">Debug Logs</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="parsed" className="space-y-6">
          <TabsList>
            <TabsTrigger value="parsed">Parsed APIs</TabsTrigger>
            <TabsTrigger value="raw">Raw Actor Calls</TabsTrigger>
          </TabsList>

          <TabsContent value="parsed" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Hashtag Search */}
              <TestCard
                title="Hashtag Search"
                description="Search Instagram by hashtag using apidojo/instagram-scraper-api"
                icon={Hash}
                result={hashtagResult}
                loading={hashtagLoading}
                onTest={testHashtag}
              >
                <label className="text-sm font-medium">Hashtag</label>
                <Input
                  value={hashtag}
                  onChange={(e) => setHashtag(e.target.value)}
                  placeholder="fitness"
                />
              </TestCard>

              {/* Single Profile */}
              <TestCard
                title="Profile Scraper"
                description="Get profile details using apify/instagram-profile-scraper"
                icon={User}
                result={profileResult}
                loading={profileLoading}
                onTest={testProfile}
              >
                <label className="text-sm font-medium">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="apifytech"
                />
              </TestCard>

              {/* Batch Profiles */}
              <TestCard
                title="Batch Profiles"
                description="Fetch multiple profiles in one call"
                icon={User}
                result={batchResult}
                loading={batchLoading}
                onTest={testBatch}
              >
                <label className="text-sm font-medium">Usernames (comma separated)</label>
                <Input
                  value={usernames}
                  onChange={(e) => setUsernames(e.target.value)}
                  placeholder="user1, user2, user3"
                />
              </TestCard>

              {/* Comments */}
              <TestCard
                title="Comment Scraper"
                description="Get comments from a post using apify/instagram-comment-scraper"
                icon={MessageSquare}
                result={commentsResult}
                loading={commentsLoading}
                onTest={testComments}
              >
                <label className="text-sm font-medium">Post URL</label>
                <Input
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="https://www.instagram.com/p/..."
                />
              </TestCard>
            </div>
          </TabsContent>

          <TabsContent value="raw" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">Raw Actor Call</CardTitle>
                </div>
                <CardDescription>
                  Make a raw call to any Apify actor and see the exact response
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Actor</label>
                    <select
                      value={rawActor}
                      onChange={(e) => {
                        setRawActor(e.target.value);
                        // Update default input based on actor
                        if (e.target.value === "hashtag") {
                          setRawInput('{"startUrls": ["https://www.instagram.com/explore/tags/fitness/"], "maxItems": 5}');
                        } else if (e.target.value === "profile") {
                          setRawInput('{"usernames": ["cristiano"]}');
                        } else if (e.target.value === "profile-api") {
                          setRawInput('{"directUrls": ["https://www.instagram.com/cristiano/"], "resultsType": "details"}');
                        } else if (e.target.value === "profile-fast") {
                          setRawInput('{"startUrls": ["https://www.instagram.com/cristiano/"], "maxItems": 1}');
                        } else if (e.target.value === "comments") {
                          setRawInput('{"directUrls": ["https://www.instagram.com/p/DExvLvKILGC/"], "resultsLimit": 5}');
                        } else if (e.target.value === "comments-api") {
                          setRawInput('{"directUrls": ["https://www.instagram.com/p/DExvLvKILGC/"], "resultsType": "comments", "resultsLimit": 5}');
                        }
                      }}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="hashtag">Hashtag (apidojo/instagram-scraper-api)</option>
                      <option value="profile">Profile (apify/instagram-profile-scraper)</option>
                      <option value="profile-api">Profile via API Scraper (apify/instagram-api-scraper)</option>
                      <option value="profile-fast">Profile via Fast Scraper (apidojo/instagram-scraper-api)</option>
                      <option value="comments">Comments (apify/instagram-comment-scraper)</option>
                      <option value="comments-api">Comments via API Scraper (apify/instagram-api-scraper)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Input JSON</label>
                    <textarea
                      value={rawInput}
                      onChange={(e) => setRawInput(e.target.value)}
                      className="w-full h-24 rounded-md border bg-background px-3 py-2 text-sm font-mono"
                      placeholder='{"usernames": ["apifytech"]}'
                    />
                  </div>
                </div>

                <Button onClick={testRaw} disabled={rawLoading}>
                  {rawLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Execute Raw Call
                </Button>

                {rawResult?.error && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="text-sm">{rawResult.error}</p>
                  </div>
                )}

                {rawResult?.success && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-600">Success</Badge>
                      {rawResult.duration && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {rawResult.duration}
                        </Badge>
                      )}
                      <Badge variant="outline">{rawResult.itemCount} items</Badge>
                    </div>
                    <JsonViewer data={rawResult.rawItems} title="Raw Apify Response" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Reference */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actor Reference</CardTitle>
                <CardDescription>Quick reference for actor input schemas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Hashtag Scraper</h4>
                    <code className="text-xs bg-muted p-2 rounded block">
                      apidojo/instagram-scraper-api
                    </code>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  "startUrls": ["url"],
  "maxItems": 30
}`}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Profile Scraper</h4>
                    <code className="text-xs bg-muted p-2 rounded block">
                      apify/instagram-profile-scraper
                    </code>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  "usernames": ["user1"]
}`}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Comment Scraper</h4>
                    <code className="text-xs bg-muted p-2 rounded block">
                      apify/instagram-comment-scraper
                    </code>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  "directUrls": ["url"],
  "resultsLimit": 15
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

