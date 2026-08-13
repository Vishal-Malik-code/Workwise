"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-white/50">Loading...</div>;
  }

  if (!isAuthenticated) {
    router.replace("/login");
    return null;
  }

  async function handleLogout() {
    await api.logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Link href="/dashboard" className="font-semibold">Workwise</Link>
        <div className="flex items-center gap-3 text-sm text-white/60">
          <span>{user?.name}</span>
          <Button variant="ghost" onClick={handleLogout}>Log out</Button>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
