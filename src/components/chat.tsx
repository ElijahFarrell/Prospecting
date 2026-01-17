"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { Send, Loader2, User, Bot, Sparkles, Settings2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScoutProgress } from "./scout-progress";
import { CreatorCard } from "./creator-card";
import type { CreatorResult } from "@/mastra/tools";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const PROGRESS_STAGES = [
  { message: "Understanding your request...", duration: 3000 },
  { message: "Searching Instagram for creators...", duration: 8000 },
  { message: "Discovered creators, fetching profiles...", duration: 15000 },
  { message: "Analyzing creator engagement...", duration: 20000 },
  { message: "Evaluating authenticity signals...", duration: 25000 },
  { message: "Scoring creators for brand fit...", duration: 30000 },
  { message: "Finalizing analysis...", duration: 60000 },
];

// Check if any message has a completed tool result
function hasCompletedToolResult(messages: Array<{ parts?: Array<{ type?: string; state?: string; output?: unknown }> }>) {
  for (const message of messages) {
    if (!message.parts) continue;
    for (const part of message.parts) {
      if (
        (part.type === "tool-invocation" || part.type?.startsWith("tool-")) &&
        (part as { state?: string }).state === "result"
      ) {
        return true;
      }
    }
  }
  return false;
}

interface ChatProps {
  onCreatorsFound?: (creators: CreatorResult[]) => void;
  threadId?: Id<"threads">;
  onThreadCreated?: (threadId: Id<"threads">) => void;
}

const SEARCH_DEPTH_OPTIONS = [
  { value: 10, label: "Quick (10 posts)" },
  { value: 30, label: "Standard (30 posts)" },
  { value: 50, label: "Deep (50 posts)" },
  { value: 100, label: "Exhaustive (100 posts)" },
];

export function Chat({ onCreatorsFound, threadId, onThreadCreated }: ChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [progressStage, setProgressStage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [searchDepth, setSearchDepth] = useState(30);
  const [creatorLimit, setCreatorLimit] = useState(5);
  const [configOpen, setConfigOpen] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<Id<"threads"> | null>(
    threadId ?? null
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);

  // Convex mutations and queries
  const createThread = useMutation(api.chats.createThread);
  const addMessage = useMutation(api.chats.addMessage);
  const storedMessages = useQuery(
    api.chats.getMessages,
    currentThreadId ? { threadId: currentThreadId } : "skip"
  );

  // Store a ref to the current thread ID so we can use it in onFinish
  const currentThreadIdRef = useRef(currentThreadId);
  currentThreadIdRef.current = currentThreadId;

  // useChat hook must be called before any effects that depend on setMessages
  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: async ({ message }) => {
      startTimeRef.current = null;
      setProgressStage(0);
      setElapsedTime(0);

      // Save assistant message to Convex (use ref to get current value)
      const textContent = message.parts
        ?.filter((p) => p.type === "text")
        .map((p) => (p as { text: string }).text)
        .join("\n");
      
      const threadIdForSave = currentThreadIdRef.current;
      if (textContent && threadIdForSave) {
        try {
          await addMessage({
            threadId: threadIdForSave,
            role: "assistant",
            content: textContent,
            parts: message.parts,
          });
        } catch (error) {
          console.error("Failed to save assistant message:", error);
        }
      }
      
      const toolParts = message.parts?.filter(
        (p) => p.type === "tool-invocation" || p.type?.startsWith("tool-")
      );
      if (toolParts) {
        for (const part of toolParts) {
          const output = (part as { output?: unknown }).output as {
            creators?: CreatorResult[];
          };
          if (output?.creators && onCreatorsFound) {
            onCreatorsFound(output.creators);
          }
        }
      }
    },
  });

  // Update currentThreadId when prop changes and clear messages for new chats
  useEffect(() => {
    const newThreadId = threadId ?? null;
    setCurrentThreadId(newThreadId);
    
    // If switching to a new chat (no thread), clear messages immediately
    if (!newThreadId) {
      setMessages([]);
    }
  }, [threadId, setMessages]);

  // Load stored messages when thread changes
  useEffect(() => {
    if (storedMessages && storedMessages.length > 0) {
      // Convert stored messages to useChat format
      const loadedMessages = storedMessages.map((msg, idx) => ({
        id: msg._id || `stored-${idx}`,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        parts: msg.parts || [{ type: "text", text: msg.content }],
      }));
      setMessages(loadedMessages as never);
    } else if (currentThreadId && storedMessages?.length === 0) {
      // Clear messages for new thread
      setMessages([]);
    }
  }, [storedMessages, currentThreadId, setMessages]);

  const isLoading = status === "streaming" || status === "submitted";

  // Progress timer
  useEffect(() => {
    if (!isLoading) {
      startTimeRef.current = null;
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const timer = setInterval(() => {
      if (!startTimeRef.current) return;
      
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedTime(elapsed);
      
      // Find the right stage based on elapsed time
      let newStage = 0;
      for (let i = 0; i < PROGRESS_STAGES.length; i++) {
        if (elapsed >= PROGRESS_STAGES[i].duration) {
          newStage = i + 1;
        }
      }
      setProgressStage(Math.min(newStage, PROGRESS_STAGES.length - 1));
    }, 500);

    return () => clearInterval(timer);
  }, [isLoading]);

  // Autoscroll to bottom on new messages or when loading state changes
  useEffect(() => {
    if (scrollRef.current) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const text = inputValue;
    setInputValue("");

    // Create thread if none exists
    let threadToUse = currentThreadId;
    if (!threadToUse) {
      try {
        const newThreadId = await createThread({
          title: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
        });
        threadToUse = newThreadId;
        setCurrentThreadId(newThreadId);
        onThreadCreated?.(newThreadId);
      } catch (error) {
        console.error("Failed to create thread:", error);
      }
    }

    // Save user message to Convex
    if (threadToUse) {
      try {
        await addMessage({
          threadId: threadToUse,
          role: "user",
          content: text,
          parts: [{ type: "text", text }],
        });
      } catch (error) {
        console.error("Failed to save user message:", error);
      }
    }

    await sendMessage({ text });
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Welcome to Creator Scout</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Tell me what kind of creators you're looking for. Try something like:
                  </p>
                  <div className="mt-4 space-y-2 text-sm">
                    <button
                      onClick={() =>
                        setInputValue("Find fitness creators with 10k-50k followers")
                      }
                      className="block w-full rounded-lg bg-muted px-3 py-2 hover:bg-muted/80 transition-colors"
                    >
                      "Find fitness creators with 10k-50k followers"
                    </button>
                    <button
                      onClick={() =>
                        setInputValue("Look for sustainable fashion influencers")
                      }
                      className="block w-full rounded-lg bg-muted px-3 py-2 hover:bg-muted/80 transition-colors"
                    >
                      "Look for sustainable fashion influencers"
                    </button>
                    <button
                      onClick={() =>
                        setInputValue("Search for personal finance content creators")
                      }
                      className="block w-full rounded-lg bg-muted px-3 py-2 hover:bg-muted/80 transition-colors"
                    >
                      "Search for personal finance content creators"
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {messages.map((message) => {
            // Check if this message has any visible content
            const hasTextContent = message.parts?.some(
              (p) => p.type === "text" && p.text?.trim()
            );
            const hasToolContent = message.parts?.some(
              (p) => p.type === "tool-invocation" || p.type?.startsWith("tool-")
            );
            
            // Skip rendering empty assistant messages (no text, no tool results)
            if (message.role === "assistant" && !hasTextContent && !hasToolContent) {
              return null;
            }

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "max-w-[85%] space-y-3",
                    message.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  {message.parts?.map((part, i) => {
                    // Only render text parts that have actual content
                    if (part.type === "text" && part.text?.trim()) {
                      return (
                        <div
                          key={i}
                          className={cn(
                            "rounded-2xl px-4 py-2.5",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {message.role === "user" ? (
                            <p className="text-sm whitespace-pre-wrap">{part.text}</p>
                          ) : (
                            <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-table:my-2 prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-th:bg-muted-foreground/10 prose-tr:border-muted-foreground/20">
                              <ReactMarkdown>{part.text}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (part.type === "tool-invocation" || part.type?.startsWith("tool-")) {
                      const toolPart = part as {
                        toolName?: string;
                        state?: string;
                        args?: { hashtag?: string };
                        output?: {
                          creators?: CreatorResult[];
                          totalDiscovered?: number;
                          qualified?: number;
                        };
                      };

                      // Don't show tool call states - let the global loading indicator handle it
                      if (toolPart.state === "call" || toolPart.state === "partial-call") {
                        return null;
                      }

                      if (toolPart.state === "result" && toolPart.output?.creators) {
                        return (
                          <div key={i} className="space-y-3">
                            <ScoutProgress
                              data={{
                                stage: "complete",
                                message: "Scouting complete!",
                                results: {
                                  total: toolPart.output.totalDiscovered || 0,
                                  analyzed: toolPart.output.creators.length,
                                  qualified: toolPart.output.qualified || 0,
                                },
                              }}
                            />
                            <div className="grid gap-3">
                              {toolPart.output.creators.slice(0, 3).map((creator) => (
                                <CreatorCard key={creator.username} creator={creator} />
                              ))}
                            </div>
                          </div>
                        );
                      }

                      return null;
                    }

                    if (part.type === "data-tool-agent") {
                      const toolData = part as { data?: { status?: string; text?: string } };
                      return (
                        <div key={i} className="rounded-lg bg-muted/50 p-3 text-sm">
                          <p className="text-muted-foreground">
                            {toolData.data?.text || "Processing..."}
                          </p>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-secondary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}

          {isLoading && !hasCompletedToolResult(messages) && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="flex-1 max-w-md border-dashed">
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">
                      {PROGRESS_STAGES[progressStage]?.message || "Processing..."}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pb-3 px-4 space-y-2">
                  <Progress 
                    value={Math.min((progressStage + 1) / PROGRESS_STAGES.length * 100, 95)} 
                    className="h-1.5" 
                  />
                  <p className="text-xs text-muted-foreground">
                    {Math.floor(elapsedTime / 1000)}s elapsed • This may take a few minutes
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Search Config */}
          <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
                <span className="flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5" />
                  Search Settings
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {SEARCH_DEPTH_OPTIONS.find(o => o.value === searchDepth)?.label.split(" ")[0]}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {creatorLimit} creators
                  </Badge>
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <Card className="border-dashed">
                <CardHeader className="pb-3 pt-4 px-4">
                  <CardTitle className="text-sm">Search Configuration</CardTitle>
                  <CardDescription className="text-xs">
                    Adjust how many creators to search and analyze
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Search Depth</label>
                    <div className="grid grid-cols-4 gap-2">
                      {SEARCH_DEPTH_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={searchDepth === option.value ? "default" : "outline"}
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => setSearchDepth(option.value)}
                        >
                          {option.value}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      More posts = more creators found, but slower search
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Creators to Analyze</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[3, 5, 10, 15, 20].map((num) => (
                        <Button
                          key={num}
                          type="button"
                          variant={creatorLimit === num ? "default" : "outline"}
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => setCreatorLimit(num)}
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      How many creators to analyze per niche
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Message Input */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe the creators you're looking for..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
