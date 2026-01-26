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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScoutProgress } from "./scout-progress";
import { CreatorCard } from "./creator-card";
import { ToolExecutionCard } from "./tool-execution-card";
import { getToolDisplayInfo } from "@/lib/tool-display-map";
import { SEARCH_DEPTH_OPTIONS, CREATOR_LIMIT_OPTIONS } from "@/constants";
import type { CreatorResult } from "@/mastra/tools";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

function hasCompletedToolResult(messages: Array<{ parts?: Array<{ type?: string; toolInvocation?: { state?: string } }> }>) {
  for (const message of messages) {
    if (!message.parts) continue;
    for (const part of message.parts) {
      if (
        part.type === "tool-invocation" &&
        (part as { toolInvocation?: { state?: string } }).toolInvocation?.state === "result"
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

interface ActiveTool {
  toolId: string;
  toolCallId: string;
  state: "call" | "partial-call" | "result" | "error";
  startTime: number;
  displayInfo: ReturnType<typeof getToolDisplayInfo>;
  output?: unknown;
}

export function Chat({ onCreatorsFound, threadId, onThreadCreated }: ChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [searchDepth, setSearchDepth] = useState(30);
  const [creatorLimit, setCreatorLimit] = useState(5);
  const [configOpen, setConfigOpen] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<Id<"threads"> | null>(
    threadId ?? null
  );
  const [activeTools, setActiveTools] = useState<Map<string, ActiveTool>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);

  const createThread = useMutation(api.chats.createThread);
  const addMessage = useMutation(api.chats.addMessage);
  const storedMessages = useQuery(
    api.chats.getMessages,
    currentThreadId ? { threadId: currentThreadId } : "skip"
  );

  const currentThreadIdRef = useRef(currentThreadId);
  currentThreadIdRef.current = currentThreadId;

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onFinish: async ({ message }) => {
      console.log("🏁 onFinish called with message:", {
        role: message.role,
        partsCount: message.parts?.length || 0,
        parts: message.parts?.map((p: { type?: string }) => ({ type: p.type })),
      });
      startTimeRef.current = null;
      setElapsedTime(0);

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
        (p) => p.type?.startsWith("tool-") || p.type === "tool-invocation"
      );
      console.log("🔧 Tool parts in onFinish:", toolParts?.length || 0);
      if (toolParts) {
        for (const part of toolParts) {
          console.log("🔍 Processing tool part:", JSON.stringify(part, null, 2));
          
          // Handle "tool-{toolName}" format
          if (part.type?.startsWith("tool-")) {
            const toolPart = part as {
              type: string;
              result?: unknown;
              output?: unknown;
            };
            const output = (toolPart.result || toolPart.output) as {
              creators?: CreatorResult[];
            };
            if (output?.creators && onCreatorsFound) {
              onCreatorsFound(output.creators);
            }
          } else if (part.type === "tool-invocation") {
            // Handle legacy tool-invocation format
            const toolPart = part as {
              toolInvocation?: {
                result?: unknown;
              };
            };
            const output = toolPart.toolInvocation?.result as {
              creators?: CreatorResult[];
            };
            if (output?.creators && onCreatorsFound) {
              onCreatorsFound(output.creators);
            }
          }
        }
      }
    },
  });

  useEffect(() => {
    const newThreadId = threadId ?? null;
    setCurrentThreadId(newThreadId);
    if (!newThreadId) {
      setMessages([]);
    }
  }, [threadId, setMessages]);

  useEffect(() => {
    if (storedMessages && storedMessages.length > 0) {
      const loadedMessages = storedMessages.map((msg: { _id?: string; role: string; content: string; parts?: unknown }, idx: number) => ({
        id: msg._id || `stored-${idx}`,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        parts: msg.parts || [{ type: "text", text: msg.content }],
      }));
      setMessages(loadedMessages as never);
    } else if (currentThreadId && storedMessages?.length === 0) {
      setMessages([]);
    }
  }, [storedMessages, currentThreadId, setMessages]);

  const isLoading = status === "streaming" || status === "submitted" || activeTools.size > 0;
  
  // DEBUG: Log loading state
  useEffect(() => {
    console.log("⏳ Loading state:", {
      status,
      isLoading,
      activeToolsCount: activeTools.size,
      messagesCount: messages.length,
    });
  }, [status, isLoading, activeTools.size, messages.length]);

  // Track active tools from messages
  useEffect(() => {
    const tools = new Map<string, ActiveTool>();
    
    for (const message of messages) {
      if (!message.parts) continue;
      
      // DEBUG: Log all message parts to see structure
      console.log("🔍 Message parts:", JSON.stringify(message.parts, null, 2));
      
      for (const part of message.parts) {
        // DEBUG: Log each part type
        console.log("📦 Part type:", part.type, "Part:", JSON.stringify(part, null, 2));
        
        // AI SDK format: tool parts have type "tool-{toolName}" (e.g., "tool-startNicheWorkflow")
        if (part.type?.startsWith("tool-")) {
          console.log("✅ Found tool part:", part.type);
          const toolPart = part as {
            type: string;
            toolCallId?: string;
            state?: "input-streaming" | "input-available" | "call" | "partial-call" | "result" | "error" | "output-available";
            input?: unknown;
            result?: unknown;
            output?: unknown;
          };
          
          // Extract tool name from type (e.g., "tool-startNicheWorkflow" -> "startNicheWorkflow")
          const toolId = toolPart.type.replace("tool-", "") || "unknown";
          const toolCallId = toolPart.toolCallId || toolId;
          
          // Map AI SDK states to our internal states
          // Priority: explicit states first, then fallback to result presence check
          let state: ActiveTool["state"] = "call";
          if (toolPart.state === "result" || toolPart.state === "output-available") {
            state = "result";
          } else if (toolPart.state === "error") {
            state = "error";
          } else if (toolPart.state === "input-streaming" || toolPart.state === "partial-call") {
            state = "partial-call";
          } else if (toolPart.state === "input-available" || toolPart.state === "call") {
            state = "call";
          } else if (toolPart.result !== undefined) {
            // Fallback: if state is undefined but we have a result, the tool is complete
            state = "result";
          }
          
          const displayInfo = getToolDisplayInfo(toolId);
          const output = toolPart.result || toolPart.output;
          
          console.log("🛠️ Tool info:", {
            toolId,
            toolCallId,
            state: toolPart.state,
            mappedState: state,
            hasDisplayInfo: !!displayInfo,
          });
          
          // Use toolCallId as key to handle multiple calls of same tool
          const key = toolCallId;
          
          // Skip completed tools entirely - they'll be shown inline in messages
          if (state === "result" || state === "error") {
            console.log("⏭️ Skipping completed tool:", key, state);
            continue;
          }
          
          if (displayInfo) {
            const existingTool = tools.get(key);
            // Only add/update active (non-completed) tools
            tools.set(key, {
              toolId,
              toolCallId,
              state,
              startTime: existingTool?.startTime || Date.now(),
              displayInfo,
              output,
            });
            console.log("➕ Added/updated tool:", key, state);
          } else {
            console.log("❌ No display info for tool:", toolId);
          }
        } else if (part.type === "tool-invocation") {
          // Handle legacy tool-invocation format (nested structure)
          console.log("✅ Found tool-invocation part (legacy format)!");
          const toolPart = part as {
            toolInvocation?: {
              toolCallId?: string;
              toolName?: string;
              state?: "partial-call" | "call" | "result";
              result?: unknown;
            };
          };
          
          const invocation = toolPart.toolInvocation;
          if (!invocation) {
            console.log("⚠️ No toolInvocation found in part");
            continue;
          }
          
          const toolId = invocation.toolName || "unknown";
          // Check explicit state, or fallback to "result" if we have a result but no state
          let state: ActiveTool["state"];
          if (invocation.state === "result") {
            state = "result";
          } else if (invocation.result !== undefined && !invocation.state) {
            // If we have a result but state is undefined, treat as complete
            state = "result";
          } else {
            state = (invocation.state || "call") as ActiveTool["state"];
          }
          const toolCallId = invocation.toolCallId || toolId;
          const displayInfo = getToolDisplayInfo(toolId);
          const key = toolCallId;
          
          // Skip completed tools entirely - they'll be shown inline in messages
          if (state === "result" || state === "error") {
            console.log("⏭️ Skipping completed tool (legacy):", key, state);
            continue;
          }
          
          if (displayInfo) {
            const existingTool = tools.get(key);
            // Only add/update active (non-completed) tools
            tools.set(key, {
              toolId,
              toolCallId,
              state,
              startTime: existingTool?.startTime || Date.now(),
              displayInfo,
              output: invocation.result,
            });
          }
        }
      }
    }
    
    console.log("🎯 Final active tools:", Array.from(tools.keys()));
    setActiveTools(tools);
  }, [messages]);
  
  // DEBUG: Log messages changes
  useEffect(() => {
    console.log("📬 Messages updated:", {
      count: messages.length,
      lastMessage: messages[messages.length - 1] ? {
        role: messages[messages.length - 1].role,
        partsCount: messages[messages.length - 1].parts?.length || 0,
        parts: messages[messages.length - 1].parts?.map((p: { type?: string }) => p.type),
      } : null,
    });
  }, [messages]);

  // Update elapsed time for active tools
  useEffect(() => {
    if (!isLoading && activeTools.size === 0) {
      startTimeRef.current = null;
      setElapsedTime(0);
      return;
    }
    
    if (isLoading && !startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
    
    const timer = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        setElapsedTime(elapsed);
      }
    }, 500);
    
    return () => clearInterval(timer);
  }, [isLoading, activeTools.size]);

  useEffect(() => {
    if (scrollRef.current) {
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
    <div className="flex h-full flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02] shrink-0 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center ring-1 ring-primary/30 shadow-[0_0_15px_hsla(var(--primary)/0.3)]">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm tracking-wide">Orchestrator Agent</h2>
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Online</span>
            </div>
          </div>
        </div>
        
        <Collapsible open={configOpen} onOpenChange={setConfigOpen} className="relative">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="justify-between gap-4 border border-white/5 bg-white/5 hover:bg-white/10 hover:text-primary transition-all duration-300">
              <span className="flex items-center gap-2 text-xs font-medium">
                <Settings2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Config</span>
              </span>
              <div className="flex gap-1.5">
                <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-muted-foreground px-1.5">{searchDepth}</Badge>
                <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-muted-foreground px-1.5">{creatorLimit}</Badge>
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="absolute right-0 top-full mt-2 w-[280px] p-4 border border-white/10 rounded-xl bg-card/95 backdrop-blur-xl z-50 shadow-2xl animate-in slide-in-from-top-2 zoom-in-95">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Search Depth</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {SEARCH_DEPTH_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant={searchDepth === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSearchDepth(option.value)}
                      className={cn(
                        "text-[10px] h-7 font-medium transition-all",
                        searchDepth === option.value 
                          ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsla(var(--primary)/0.4)]" 
                          : "border-white/10 bg-transparent hover:bg-white/5 hover:border-primary/50"
                      )}
                    >
                      {option.value}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Creator Limit</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {CREATOR_LIMIT_OPTIONS.map((num) => (
                    <Button
                      key={num}
                      variant={creatorLimit === num ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCreatorLimit(num)}
                      className={cn(
                        "text-[10px] h-7 font-medium transition-all",
                        creatorLimit === num 
                          ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsla(var(--primary)/0.4)]" 
                          : "border-white/10 bg-transparent hover:bg-white/5 hover:border-primary/50"
                      )}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 sm:p-6" ref={scrollRef}>
        <div className="space-y-6 max-w-3xl mx-auto pb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-in zoom-in-95 fade-in duration-700">
              <div className="mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 p-5 border border-primary/20 shadow-[0_0_40px_hsla(var(--primary)/0.15)] relative">
                <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                <Sparkles className="h-10 w-10 text-primary relative z-10" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground">
                Shiloh Prospecting
              </h3>
              <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
                Tell me what creators you're looking for. I'll coordinate AI agents to scout, analyze, and qualify prospects.
              </p>
              <div className="mt-8 grid gap-2 w-full max-w-sm">
                {[
                  "Find fitness creators with 10k-50k followers",
                  "Search for personal finance influencers",
                  "Look for sustainable fashion creators"
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInputValue(prompt)}
                    className="w-full text-left p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/30 transition-all duration-300 text-sm text-muted-foreground hover:text-foreground group"
                  >
                    <span className="opacity-50 group-hover:opacity-100 transition-opacity">"{prompt}"</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const hasTextContent = message.parts?.some(
              (p) => p.type === "text" && p.text?.trim()
            );
            
            // Check if message has any completed tool content (not active)
            const hasCompletedToolContent = message.parts?.some((p) => {
              if (p.type?.startsWith("tool-")) {
                const toolCallId = (p as { toolCallId?: string }).toolCallId;
                // Tool is completed if it's NOT in activeTools
                return toolCallId && !activeTools.has(toolCallId);
              }
              if (p.type === "tool-invocation") {
                const invocation = (p as { toolInvocation?: { toolCallId?: string } }).toolInvocation;
                const toolCallId = invocation?.toolCallId;
                return toolCallId && !activeTools.has(toolCallId);
              }
              return false;
            });
            
            // Skip messages that only have active tool content (no text, no completed tools)
            // These are handled by the active tools section
            if (message.role === "assistant" && !hasTextContent && !hasCompletedToolContent) {
              return null;
            }

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-in slide-in-from-bottom-2 duration-300",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0 mt-1 ring-1 ring-white/10">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">AI</AvatarFallback>
                  </Avatar>
                )}

                <div className={cn("flex flex-col gap-1 max-w-[85%]", message.role === "user" ? "items-end" : "items-start")}>
                  {message.parts?.map((part, i) => {
                    if (part.type === "text" && part.text?.trim()) {
                      return (
                        <div
                          key={i}
                          className={cn(
                            "px-4 py-3 shadow-lg",
                            message.role === "user"
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                              : "bg-white/[0.03] border border-white/5 rounded-2xl rounded-bl-md"
                          )}
                        >
                          {message.role === "user" ? (
                            <p className="text-sm font-medium leading-relaxed">{part.text}</p>
                          ) : (
                            <div className="prose prose-sm prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-strong:text-primary prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10">
                              <ReactMarkdown 
                                components={{
                                  table: ({node, ...props}) => (
                                    <div className="overflow-x-auto my-4 rounded-lg border border-white/10 bg-black/20">
                                      <table className="w-full text-left text-xs" {...props} />
                                    </div>
                                  ),
                                  thead: ({node, ...props}) => <thead className="bg-white/5 text-muted-foreground uppercase tracking-wider text-[10px]" {...props} />,
                                  th: ({node, ...props}) => <th className="px-3 py-2 font-semibold border-b border-white/10" {...props} />,
                                  td: ({node, ...props}) => <td className="px-3 py-2 border-b border-white/5" {...props} />,
                                }}
                              >
                                {part.text}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Handle "tool-{toolName}" format (e.g., "tool-startNicheWorkflow")
                    if (part.type?.startsWith("tool-")) {
                      const toolPart = part as {
                        type: string;
                        toolCallId?: string;
                        state?: "input-streaming" | "input-available" | "call" | "partial-call" | "result" | "error" | "output-available";
                        result?: {
                          creators?: CreatorResult[];
                          totalDiscovered?: number;
                          qualified?: number;
                          results?: Array<{ title: string; url: string; content?: string }>;
                          query?: string;
                        };
                        output?: unknown;
                      };

                      // Extract tool name from type (e.g., "tool-startNicheWorkflow" -> "startNicheWorkflow")
                      const toolId = toolPart.type.replace("tool-", "") || "unknown";
                      const toolCallId = toolPart.toolCallId || toolId;
                      const displayInfo = getToolDisplayInfo(toolId);
                      const state = toolPart.state;
                      const output = toolPart.result || toolPart.output;
                      
                      // If this tool is still active, don't render it here - the active tools section handles it
                      if (activeTools.has(toolCallId)) {
                        return null;
                      }
                      
                      // Also skip by state as a fallback
                      if (state === "call" || state === "partial-call" || state === "input-streaming" || state === "input-available") {
                        return null;
                      }

                      // Show completed tool results
                      if (state === "result" || state === "output-available" || (state === undefined && output !== undefined)) {
                        // Handle workflow results (creators)
                        if (output && typeof output === "object" && "creators" in output) {
                          const creatorsOutput = output as {
                            creators?: CreatorResult[];
                            totalDiscovered?: number;
                            qualified?: number;
                          };
                          if (creatorsOutput.creators) {
                            return (
                              <div key={i} className="mt-3 space-y-3 w-full">
                                <ScoutProgress
                                  data={{
                                    stage: "complete",
                                    message: "Scouting complete!",
                                    results: {
                                      total: creatorsOutput.totalDiscovered || 0,
                                      analyzed: creatorsOutput.creators.length,
                                      qualified: creatorsOutput.qualified || 0,
                                    },
                                  }}
                                />
                                <div className="grid gap-2">
                                  {creatorsOutput.creators.slice(0, 3).map((creator) => (
                                    <CreatorCard key={creator.username} creator={creator} />
                                  ))}
                                </div>
                                {creatorsOutput.creators.length > 3 && (
                                  <p className="text-xs text-center text-muted-foreground">
                                    + {creatorsOutput.creators.length - 3} more in sidebar
                                  </p>
                                )}
                              </div>
                            );
                          }
                        }
                        
                        // Handle Tavily search results (sources)
                        if (displayInfo?.showSources && output && typeof output === "object" && "results" in output) {
                          const searchOutput = output as {
                            results?: Array<{ title: string; url: string; content?: string }>;
                          };
                          if (searchOutput.results) {
                            return (
                              <ToolExecutionCard
                                key={i}
                                toolId={toolId}
                                state="result"
                                message={displayInfo.message}
                                description={displayInfo.description}
                                icon={displayInfo.icon}
                                sources={searchOutput.results}
                                elapsedTime={elapsedTime}
                              />
                            );
                          }
                        }
                        
                        // Show completion for other tools
                        if (displayInfo) {
                          return (
                            <ToolExecutionCard
                              key={i}
                              toolId={toolId}
                              state="result"
                              message={displayInfo.message}
                              description={displayInfo.description}
                              icon={displayInfo.icon}
                              elapsedTime={elapsedTime}
                            />
                          );
                        }
                      }
                      return null;
                    }
                    
                    // Handle legacy "tool-invocation" format
                    if (part.type === "tool-invocation") {
                      const toolPart = part as {
                        toolInvocation?: {
                          toolName?: string;
                          toolCallId?: string;
                          state?: "partial-call" | "call" | "result" | "output-available";
                          result?: {
                            creators?: CreatorResult[];
                            totalDiscovered?: number;
                            qualified?: number;
                            results?: Array<{ title: string; url: string; content?: string }>;
                            query?: string;
                          };
                        };
                      };

                      const invocation = toolPart.toolInvocation;
                      if (!invocation) return null;

                      const toolId = invocation.toolName || "unknown";
                      const displayInfo = getToolDisplayInfo(toolId);
                      const state = invocation.state;
                      
                      // Don't show active tools here - they're shown in the active tools section
                      if (state === "call" || state === "partial-call") {
                        return null;
                      }

                      // Show completed tool results
                      if (state === "result" || state === "output-available" || (state === undefined && invocation.result !== undefined)) {
                        // Handle workflow results (creators)
                        if (invocation.result?.creators) {
                          return (
                            <div key={i} className="mt-3 space-y-3 w-full">
                              <ScoutProgress
                                data={{
                                  stage: "complete",
                                  message: "Scouting complete!",
                                  results: {
                                    total: invocation.result.totalDiscovered || 0,
                                    analyzed: invocation.result.creators.length,
                                    qualified: invocation.result.qualified || 0,
                                  },
                                }}
                              />
                              <div className="grid gap-2">
                                {invocation.result.creators.slice(0, 3).map((creator) => (
                                  <CreatorCard key={creator.username} creator={creator} />
                                ))}
                              </div>
                              {invocation.result.creators.length > 3 && (
                                <p className="text-xs text-center text-muted-foreground">
                                  + {invocation.result.creators.length - 3} more in sidebar
                                </p>
                              )}
                            </div>
                          );
                        }
                        
                        // Handle Tavily search results (sources)
                        if (displayInfo?.showSources && invocation.result?.results) {
                          return (
                            <ToolExecutionCard
                              key={i}
                              toolId={toolId}
                              state="result"
                              message={displayInfo.message}
                              description={displayInfo.description}
                              icon={displayInfo.icon}
                              sources={invocation.result.results}
                              elapsedTime={elapsedTime}
                            />
                          );
                        }
                        
                        // Show completion for other tools
                        if (displayInfo) {
                          return (
                            <ToolExecutionCard
                              key={i}
                              toolId={toolId}
                              state="result"
                              message={displayInfo.message}
                              description={displayInfo.description}
                              icon={displayInfo.icon}
                              elapsedTime={elapsedTime}
                            />
                          );
                        }
                      }
                      
                      return null;
                    }
                    return null;
                  })}
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8 shrink-0 mt-1 ring-1 ring-white/10">
                    <AvatarFallback className="bg-white/10 text-xs font-medium">ME</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}

          {isLoading && activeTools.size === 0 && !hasCompletedToolResult(messages) && (
            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Avatar className="h-8 w-8 shrink-0 mt-1 ring-1 ring-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">AI</AvatarFallback>
              </Avatar>
              <Card className="flex-1 max-w-sm border-primary/20 bg-primary/5 shadow-[0_0_20px_hsla(var(--primary)/0.1)]">
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary font-display">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Understanding your request...
                    </CardTitle>
                    <span className="text-[10px] font-mono text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                      {(elapsedTime / 1000).toFixed(1)}s
                    </span>
                  </div>
                </CardHeader>
              </Card>
            </div>
          )}
          
          {/* Show active tools */}
          {isLoading && activeTools.size > 0 && (
            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Avatar className="h-8 w-8 shrink-0 mt-1 ring-1 ring-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">AI</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2 max-w-2xl">
                {Array.from(activeTools.entries()).map(([toolCallId, tool]) => {
                  const toolElapsed = Date.now() - tool.startTime;
                  const sources = tool.output && typeof tool.output === "object" && "results" in tool.output
                    ? (tool.output.results as Array<{ title: string; url: string; content?: string }>)
                    : undefined;
                  
                  return (
                    <ToolExecutionCard
                      key={toolCallId}
                      toolId={tool.toolId}
                      state={tool.state}
                      message={tool.displayInfo?.message || "Processing..."}
                      description={tool.displayInfo?.description}
                      icon={tool.displayInfo?.icon}
                      durationNotice={tool.displayInfo?.durationNotice}
                      sources={sources}
                      elapsedTime={toolElapsed}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 sm:p-6 bg-gradient-to-t from-background via-background to-transparent">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe your ideal creator..."
            className="flex-1 bg-card/80 border-white/10 focus-visible:ring-primary/30 h-12 rounded-xl px-4 text-sm shadow-xl backdrop-blur-sm relative z-10 placeholder:text-muted-foreground/50"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !inputValue.trim()}
            className="h-12 w-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_hsla(var(--primary)/0.3)] transition-all hover:scale-105 active:scale-95 relative z-10"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
