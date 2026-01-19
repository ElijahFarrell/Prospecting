"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { ProspectsTable } from "@/components/prospects-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";

export default function ProspectsPage() {
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
              <CardDescription>Sign in to manage your prospects</CardDescription>
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
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-lg tracking-tight">Prospects</h1>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Manage your pipeline
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild className="border-white/10 hover:bg-white/5">
                <Link href="/">
                  <Sparkles className="h-4 w-4 mr-2" />
                  New Search
                </Link>
              </Button>
              <div className="h-8 w-[1px] bg-white/10 mx-1" />
              <UserButton afterSignOutUrl="/" />
            </div>
          </header>

          {/* Main content */}
          <div className="flex-1 p-6 overflow-hidden">
            <div className="max-w-7xl mx-auto h-full">
              <ProspectsTable />
            </div>
          </div>
        </div>
      </Authenticated>
    </>
  );
}

