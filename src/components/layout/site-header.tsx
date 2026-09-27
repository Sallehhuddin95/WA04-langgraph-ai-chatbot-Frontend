"use client";

import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { useLogout, useMe } from "@/features/auth";

export function SiteHeader(): React.JSX.Element {
  const { user, isLoading, isAuthenticated } = useMe();
  const { logout, isPending } = useLogout();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex h-14 w-full items-center justify-between px-4">
        <Link
          href="/chat"
          className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Singularity
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          {isAuthenticated && user !== null ? (
            <>
              <span className="max-w-[220px] truncate text-[13px] text-slate-500 dark:text-slate-400">
                {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={isPending}
                onClick={() => {
                  void logout();
                }}
              >
                <LogOut aria-hidden="true" /> {isPending ? "Logging out." : "Log out"}
              </Button>
            </>
          ) : !isLoading ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">
                <LogIn aria-hidden="true" /> Sign in
              </Link>
            </Button>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
