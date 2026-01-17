"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Trash2,
  Search,
  Info,
  AlertTriangle,
  XCircle,
  Bug,
  Clock,
  Code,
  Activity,
  Zap,
  Database,
  Bot,
  RefreshCw,
} from "lucide-react";
import { debugStore, type LogEntry } from "@/lib/debug-store";

type FilterLevel = "all" | "info" | "warn" | "error" | "debug";
type FilterCategory = "all" | "api" | "tool" | "agent" | "apify" | "analysis";

function getLevelIcon(level: string) {
  switch (level) {
    case "info":
      return <Info className="h-4 w-4 text-blue-500" />;
    case "warn":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "debug":
      return <Bug className="h-4 w-4 text-gray-500" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

function getLevelBadgeVariant(level: string) {
  switch (level) {
    case "info":
      return "default";
    case "warn":
      return "warning";
    case "error":
      return "destructive";
    case "debug":
      return "secondary";
    default:
      return "outline";
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "api":
      return <Zap className="h-3 w-3" />;
    case "tool":
      return <Code className="h-3 w-3" />;
    case "agent":
      return <Bot className="h-3 w-3" />;
    case "apify":
      return <Database className="h-3 w-3" />;
    case "analysis":
      return <Activity className="h-3 w-3" />;
    default:
      return <Code className="h-3 w-3" />;
  }
}

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
}

function LogEntryCard({ entry }: { entry: LogEntry }) {
  return (
    <Card className="border-l-4" style={{
      borderLeftColor: entry.level === "error" ? "hsl(var(--destructive))" :
        entry.level === "warn" ? "hsl(var(--warning, 38 92% 50%))" :
        entry.level === "info" ? "hsl(var(--primary))" : "hsl(var(--muted))"
    }}>
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {getLevelIcon(entry.level)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getLevelBadgeVariant(entry.level) as "default" | "secondary" | "destructive" | "outline"}>
                  {entry.level.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  {getCategoryIcon(entry.category)}
                  {entry.category}
                </Badge>
                {entry.duration !== undefined && (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {entry.duration}ms
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-sm">{entry.message}</p>
              {entry.data !== undefined && entry.data !== null ? (
                <Accordion type="single" collapsible className="w-full mt-2">
                  <AccordionItem value="data" className="border-none">
                    <AccordionTrigger className="text-xs py-1 hover:no-underline">
                      View Data
                    </AccordionTrigger>
                    <AccordionContent>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(entry.data, null, 2)}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : null}
            </div>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatTimestamp(entry.timestamp)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCard({ title, value, icon, description }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DebugPage() {
  const logs = useSyncExternalStore(
    debugStore.subscribe.bind(debugStore),
    () => debugStore.getLogs(),
    () => []
  );

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<FilterLevel>("all");
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const filteredLogs = logs.filter((log) => {
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (levelFilter !== "all" && log.level !== levelFilter) {
      return false;
    }
    if (categoryFilter !== "all" && log.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  const stats = {
    total: logs.length,
    errors: logs.filter((l) => l.level === "error").length,
    warnings: logs.filter((l) => l.level === "warn").length,
    avgDuration: logs
      .filter((l) => l.duration !== undefined)
      .reduce((acc, l) => acc + (l.duration || 0), 0) /
      (logs.filter((l) => l.duration !== undefined).length || 1),
  };

  // Simulate some logs for demo
  useEffect(() => {
    if (logs.length === 0) {
      debugStore.info("system", "Debug page loaded");
      debugStore.debug("system", "Ready to capture logs from API calls");
    }
  }, [logs.length]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">Debug Console</h1>
            <p className="text-xs text-muted-foreground">
              Monitor API calls, tool executions, and agent activity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Live" : "Paused"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => debugStore.clear()}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden p-4">
        <Tabs defaultValue="logs" className="h-full flex flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="flex-1 overflow-hidden mt-4">
            <div className="h-full flex flex-col gap-4">
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={levelFilter}
                  onValueChange={(v) => setLevelFilter(v as FilterLevel)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={categoryFilter}
                  onValueChange={(v) => setCategoryFilter(v as FilterCategory)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="apify">Apify</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-4">
                  {filteredLogs.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center">
                        <Bug className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No logs to display. Start using the app to see activity here.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredLogs.map((log) => <LogEntryCard key={log.id} entry={log} />)
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="flex-1 overflow-hidden mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Logs"
                value={stats.total}
                icon={<Activity className="h-4 w-4 text-muted-foreground" />}
                description="All captured events"
              />
              <StatsCard
                title="Errors"
                value={stats.errors}
                icon={<XCircle className="h-4 w-4 text-red-500" />}
                description="Failed operations"
              />
              <StatsCard
                title="Warnings"
                value={stats.warnings}
                icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
                description="Potential issues"
              />
              <StatsCard
                title="Avg Duration"
                value={`${Math.round(stats.avgDuration)}ms`}
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                description="Timed operations"
              />
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Log Distribution by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-5">
                  {["api", "tool", "agent", "apify", "analysis"].map((cat) => {
                    const count = logs.filter((l) => l.category === cat).length;
                    const percent = logs.length > 0 ? (count / logs.length) * 100 : 0;
                    return (
                      <div key={cat} className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          {getCategoryIcon(cat)}
                          <span className="text-sm font-medium capitalize">{cat}</span>
                        </div>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground">
                          {percent.toFixed(1)}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

