"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useLogout } from "@/features/auth/useAuth";
import { NotificationsPanel } from "@/features/notifications/NotificationsPanel";
import { AppSidebar } from "@/components/app-shell/AppSidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const logout = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return <div className="p-8 text-muted">Loading...</div>;
  }

  if (!isAuthenticated) {
    router.replace("/login");
    return null;
  }

  async function handleLogout() {
    await logout.mutateAsync();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen xl:grid xl:grid-cols-[17rem_1fr]">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center border border-border text-foreground xl:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <span className="sr-only">Open navigation</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>
            <Link href="/dashboard" className="font-bold uppercase tracking-wide xl:hidden">
              Workwise
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted">
            <NotificationsPanel />
            <Avatar>
              <AvatarFallback>{user ? initials(user.name) : "?"}</AvatarFallback>
            </Avatar>
            <span className="text-foreground">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} disabled={logout.isPending}>
              Log out
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
