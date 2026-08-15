"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname, useParams } from "next/navigation";
import { useAuth, useLogout } from "@/features/auth/useAuth";
import { useWorkspaces } from "@/features/workspaces/useWorkspaces";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "", label: "Overview" },
  { href: "/projects", label: "Projects" },
  { href: "/members", label: "Members" },
  { href: "/invites", label: "Invites" },
  { href: "/labels", label: "Labels" },
  { href: "/activity", label: "Activity" },
  { href: "/settings", label: "Settings" },
];

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { workspaceId } = useParams<{ workspaceId?: string }>();
  const { user } = useAuth();
  const logout = useLogout();
  const { data: workspaces } = useWorkspaces();

  const base = workspaceId ? `/dashboard/${workspaceId}` : undefined;

  async function handleLogout() {
    await logout.mutateAsync();
    router.replace("/login");
  }

  function handleWorkspaceChange(nextWorkspaceId: string) {
    router.push(`/dashboard/${nextWorkspaceId}`);
    onClose();
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 xl:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17rem] shrink-0 flex-col border-r bg-sidebar-bg text-sidebar-fg transition-transform duration-200 ease-out xl:sticky xl:top-0 xl:h-screen xl:translate-x-0",
          "border-sidebar-border",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/dashboard" className="text-lg font-semibold text-sidebar-fg">
            Workwise
          </Link>
        </div>

        <div className="px-5 pb-4">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-sidebar-fg/60">
            Workspace
          </label>
          <select
            className="w-full rounded-lg border border-sidebar-border bg-sidebar-bg px-3 py-2 text-sm text-sidebar-fg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent"
            value={workspaceId ?? ""}
            onChange={(event) => handleWorkspaceChange(event.target.value)}
          >
            {!workspaceId && (
              <option value="" disabled>
                Select a workspace
              </option>
            )}
            {(workspaces ?? []).map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {base
            ? NAV_ITEMS.map((item) => {
                const href = `${base}${item.href}`;
                const active = pathname === href || (item.href === "" && pathname === base);
                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm font-medium text-sidebar-fg/70 transition-colors hover:bg-white/5 hover:text-sidebar-fg",
                      active && "bg-white/10 text-sidebar-fg",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })
            : null}
        </nav>

        <div className="border-t border-sidebar-border px-5 py-4">
          <div className="mb-3 flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{user ? initials(user.name) : "?"}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm text-sidebar-fg">{user?.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-fg/80 hover:bg-white/5 hover:text-sidebar-fg"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
