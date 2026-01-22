"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Send,
  Copy,
  CheckCircle,
  Sparkles,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageVariations } from "@/services/message-generator";
import { openInstagramDMWithMessage } from "@/lib/instagram-deeplink";
import type { MessageStatus } from "@/types";

interface ProspectDMCardProps {
  prospect: {
    _id: Id<"prospects">;
    handle: string;
    niche: string;
    bio?: string;
    outreachAngle?: string;
    monetizationGap?: string;
    recentPostSummary?: string;
    followerCount?: number;
    engagementRate?: number;
    transformationScore?: number;
    postsCount?: number;
    messageVariations?: MessageVariations;
    selectedMessage?: {
      method: "A" | "B";
      variationIndex: number;
      text: string;
    };
    messageStatus?: MessageStatus;
    instagramUserId?: string;
    isQualified: boolean;
  };
  onStatusChange?: () => void;
}

export function ProspectDMCard({ prospect, onStatusChange }: ProspectDMCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Initialize state from prospect data
  const getInitialMessage = () => {
    if (prospect.selectedMessage?.text) {
      return prospect.selectedMessage.text;
    }
    if (prospect.messageVariations) {
      return prospect.messageVariations.methodA.variations[0] || "";
    }
    return "";
  };

  const [selectedMethod, setSelectedMethod] = useState<"A" | "B">(
    prospect.selectedMessage?.method || "A"
  );
  const [selectedVariation, setSelectedVariation] = useState<number>(
    prospect.selectedMessage?.variationIndex ?? 0
  );
  const [editedMessage, setEditedMessage] = useState<string>(getInitialMessage());
  const [isOpening, setIsOpening] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateMessages = useMutation(api.prospects.updateProspectMessages);

  const hasMessages = !!prospect.messageVariations;

  // Sync state when prospect data updates (fixes UI update issue)
  useEffect(() => {
    if (prospect.messageVariations) {
      const currentMessage = prospect.selectedMessage?.text || 
                            prospect.messageVariations.methodA.variations[0] || "";
      setEditedMessage(currentMessage);
      setSelectedMethod(prospect.selectedMessage?.method || "A");
      setSelectedVariation(prospect.selectedMessage?.variationIndex ?? 0);
    }
  }, [prospect.messageVariations, prospect.selectedMessage]);

  const handleGenerateMessages = async () => {
    if (!prospect.isQualified) {
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/messages/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handle: prospect.handle,
          niche: prospect.niche,
          bio: prospect.bio || "",
          outreachAngle: prospect.outreachAngle || "",
          monetizationGap: prospect.monetizationGap,
          recentPostSummary: prospect.recentPostSummary,
          followerCount: prospect.followerCount,
          engagementRate: prospect.engagementRate,
          transformationScore: prospect.transformationScore,
          postsCount: prospect.postsCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || "Failed to generate messages";
        throw new Error(errorMessage);
      }

      const variations: MessageVariations = await response.json();

      // Auto-select first variation of Method A
      const defaultMessage = variations.methodA.variations[0];
      setSelectedMethod("A");
      setSelectedVariation(0);
      setEditedMessage(defaultMessage);

      await updateMessages({
        id: prospect._id,
        messageVariations: variations,
        selectedMessage: {
          method: "A",
          variationIndex: 0,
          text: defaultMessage,
        },
        messageStatus: "pending",
      });

      onStatusChange?.();
    } catch (error) {
      console.error("Failed to generate messages:", error);
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : "Failed to generate messages. Please try again.";
      alert(errorMessage); // TODO: Replace with proper toast/notification component
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMethodChange = (method: "A" | "B") => {
    setSelectedMethod(method);
    if (prospect.messageVariations) {
      if (method === "A") {
        const message = prospect.messageVariations.methodA.variations[selectedVariation] || 
                       prospect.messageVariations.methodA.variations[0];
        setSelectedVariation(0);
        setEditedMessage(message);
      } else {
        const message = prospect.messageVariations.methodB.openers[selectedVariation] || 
                       prospect.messageVariations.methodB.openers[0];
        setSelectedVariation(0);
        setEditedMessage(message);
      }
    }
  };

  const handleVariationChange = (index: number) => {
    setSelectedVariation(index);
    if (prospect.messageVariations) {
      if (selectedMethod === "A") {
        const message = prospect.messageVariations.methodA.variations[index];
        setEditedMessage(message);
      } else {
        const message = prospect.messageVariations.methodB.openers[index];
        setEditedMessage(message);
      }
    }
  };

  const handleMessageEdit = (text: string) => {
    setEditedMessage(text);
    // Auto-save selected message
    if (prospect.messageVariations) {
      updateMessages({
        id: prospect._id,
        selectedMessage: {
          method: selectedMethod,
          variationIndex: selectedVariation,
          text,
        },
      }).catch(console.error);
    }
  };

  const handleOpenInstagram = async () => {
    if (!editedMessage.trim()) {
      return;
    }

    setIsOpening(true);
    try {
      await openInstagramDMWithMessage(
        prospect.instagramUserId,
        prospect.handle,
        editedMessage
      );
      
      // Mark as sent
      await updateMessages({
        id: prospect._id,
        selectedMessage: {
          method: selectedMethod,
          variationIndex: selectedVariation,
          text: editedMessage,
        },
        messageStatus: "sent",
      });
      
      onStatusChange?.();
    } catch (error) {
      console.error("Failed to open Instagram:", error);
    } finally {
      setIsOpening(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleMarkAsSent = async () => {
    await updateMessages({
      id: prospect._id,
      messageStatus: "sent",
    });
    onStatusChange?.();
  };

  if (!prospect.isQualified) {
    return (
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Messages are only available for qualified prospects</span>
        </div>
      </div>
    );
  }

  if (!hasMessages) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-sm text-muted-foreground mb-4">
            Generate personalized DM messages using AI-powered copywriting strategies.
          </p>
          <Button
            onClick={handleGenerateMessages}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Messages...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Messages
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const methodA = prospect.messageVariations!.methodA;
  const methodB = prospect.messageVariations!.methodB;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Status Badge */}
      {prospect.messageStatus && (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] sm:text-xs",
              prospect.messageStatus === "sent"
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : prospect.messageStatus === "drafted"
                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
            )}
          >
            {prospect.messageStatus === "sent" && <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />}
            {prospect.messageStatus === "sent"
              ? "Sent"
              : prospect.messageStatus === "drafted"
              ? "Drafted"
              : "Pending"}
          </Badge>
        </div>
      )}

      {/* Method Tabs */}
      <Tabs value={selectedMethod} onValueChange={(v) => handleMethodChange(v as "A" | "B")}>
        <TabsList className="grid w-full grid-cols-2 bg-white/5">
          <TabsTrigger value="A" className="text-[10px] sm:text-xs">
            <span className="hidden sm:inline">Method A: Direct Value</span>
            <span className="sm:hidden">Method A</span>
          </TabsTrigger>
          <TabsTrigger value="B" className="text-[10px] sm:text-xs">
            <span className="hidden sm:inline">Method B: Trojan Horse</span>
            <span className="sm:hidden">Method B</span>
          </TabsTrigger>
        </TabsList>

        {/* Method A Content */}
        <TabsContent value="A" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          {/* Variation Selection */}
          <div className="space-y-2">
            <label className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
              Select Variation (3 options)
            </label>
            <ScrollArea className="h-[120px] sm:h-[150px] md:h-[200px] pr-2 sm:pr-4">
              <div className="space-y-2">
                {methodA.variations.map((variation, index) => (
                  <button
                    key={index}
                    onClick={() => handleVariationChange(index)}
                    className={cn(
                      "w-full text-left p-2.5 sm:p-3 rounded-lg border text-xs sm:text-sm transition-all touch-manipulation",
                      selectedVariation === index && selectedMethod === "A"
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-white/5 border-white/10 hover:bg-white/10 active:bg-white/15"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          "mt-1 h-4 w-4 rounded-full border-2 flex-shrink-0",
                          selectedVariation === index && selectedMethod === "A"
                            ? "border-primary bg-primary/20"
                            : "border-white/30"
                        )}
                      >
                        {selectedVariation === index && selectedMethod === "A" && (
                          <div className="h-full w-full rounded-full bg-primary" />
                        )}
                      </div>
                      <span className="flex-1">{variation}</span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Editable Message */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
              Message (Editable)
            </label>
            <Textarea
              value={editedMessage}
              onChange={(e) => handleMessageEdit(e.target.value)}
              className="min-h-[80px] sm:min-h-[100px] bg-white/5 border-white/10 text-xs sm:text-sm"
              placeholder="Message will appear here..."
            />
          </div>

          {/* Value Asset Description */}
          <div className="p-2.5 sm:p-3 rounded-lg bg-white/5 border border-white/10">
            <h4 className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1.5 sm:mb-2">
              Value Asset
            </h4>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{methodA.valueAssetDescription}</p>
          </div>
        </TabsContent>

        {/* Method B Content */}
        <TabsContent value="B" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          {/* Opener Selection */}
          <div className="space-y-2">
            <label className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
              Select Opener (under 50 chars)
            </label>
            <ScrollArea className="h-[100px] sm:h-[120px] md:h-[150px] pr-2 sm:pr-4">
              <div className="space-y-2">
                {methodB.openers.map((opener, index) => (
                <button
                  key={index}
                  onClick={() => handleVariationChange(index)}
                  className={cn(
                    "w-full text-left p-2.5 sm:p-3 rounded-lg border text-xs sm:text-sm transition-all touch-manipulation",
                    selectedVariation === index && selectedMethod === "B"
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "bg-white/5 border-white/10 hover:bg-white/10 active:bg-white/15"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "mt-1 h-4 w-4 rounded-full border-2 flex-shrink-0",
                        selectedVariation === index && selectedMethod === "B"
                          ? "border-primary bg-primary/20"
                          : "border-white/30"
                      )}
                    >
                      {selectedVariation === index && selectedMethod === "B" && (
                        <div className="h-full w-full rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="flex-1 font-mono text-xs">{opener}</span>
                    <Badge variant="outline" className="text-[10px] border-white/20">
                      {opener.length} chars
                    </Badge>
                  </div>
                </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Editable Opener */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
              Opener (Editable)
            </label>
            <Textarea
              value={editedMessage}
              onChange={(e) => handleMessageEdit(e.target.value)}
              className="min-h-[50px] sm:min-h-[60px] bg-white/5 border-white/10 text-xs sm:text-sm font-mono"
              placeholder="Opener will appear here..."
              maxLength={50}
            />
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">
              {editedMessage.length}/50 characters
            </p>
          </div>

          {/* Pivot Message */}
          <div className="p-2.5 sm:p-3 rounded-lg bg-white/5 border border-white/10">
            <h4 className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1.5 sm:mb-2">
              Pivot Message (Send after they reply)
            </h4>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{methodB.pivotMessage}</p>
          </div>

          {/* Value Asset Description */}
          <div className="p-2.5 sm:p-3 rounded-lg bg-white/5 border border-white/10">
            <h4 className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1.5 sm:mb-2">
              Value Asset
            </h4>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{methodB.valueAssetDescription}</p>
          </div>
        </TabsContent>
      </Tabs>

      <Separator className="bg-white/10" />

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleOpenInstagram}
          disabled={!editedMessage.trim() || isOpening}
          className="w-full text-xs sm:text-sm h-9 sm:h-10"
        >
          {isOpening ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Opening Instagram...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Open in Instagram
            </>
          )}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={!editedMessage.trim()}
            className="flex-1 border-white/10 text-xs sm:text-sm h-8 sm:h-9"
          >
            {copied ? (
              <>
                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Copied!</span>
                <span className="sm:hidden">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Copy
              </>
            )}
          </Button>
          {prospect.messageStatus !== "sent" && (
            <Button
              variant="outline"
              onClick={handleMarkAsSent}
              className="flex-1 border-white/10 text-xs sm:text-sm h-8 sm:h-9"
            >
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Mark as Sent</span>
              <span className="sm:hidden">Sent</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

