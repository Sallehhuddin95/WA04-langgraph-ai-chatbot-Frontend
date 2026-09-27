"use client";

import Link from "next/link";
import { LogIn, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMe } from "@/features/auth";

export function LandingActions(): React.JSX.Element {
  const { isLoading, isAuthenticated } = useMe();
  const showSignIn = isLoading || !isAuthenticated;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild size="lg">
        <Link href="/chat">
          <MessageSquare aria-hidden="true" /> Start chatting
        </Link>
      </Button>
      {showSignIn ? (
        <Button asChild variant="outline" size="lg">
          <Link href="/login">
            <LogIn aria-hidden="true" /> Sign in
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
