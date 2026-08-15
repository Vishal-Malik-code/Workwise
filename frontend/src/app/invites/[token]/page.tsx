"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth/useAuth";
import { useAcceptInvite, useDeclineInvite } from "@/features/invites/useInvites";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";

export default function InviteTokenPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const accept = useAcceptInvite();
  const decline = useDeclineInvite();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);

  async function handleAccept() {
    setError(null);
    try {
      const result = await accept.mutateAsync(token);
      setDone("accepted");
      setTimeout(() => router.push(`/dashboard/${result.workspaceId}`), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not accept invite");
    }
  }

  async function handleDecline() {
    setError(null);
    try {
      await decline.mutateAsync(token);
      setDone("declined");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not decline invite");
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="label-eyebrow">Loading...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <Link href="/" className="mb-12 inline-block text-lg font-bold uppercase tracking-tight">
          Workwise
        </Link>
        <p className="label-eyebrow mb-2">Workspace invite</p>
        <h1 className="mb-3 text-3xl font-bold uppercase leading-none tracking-tight">You&apos;ve been invited</h1>
        <p className="mb-9 text-sm text-muted">
          Log in or create an account with the invited email address to continue.
        </p>
        <div className="flex gap-2">
          <Link href={`/login?next=/invites/${token}`}>
            <Button className="w-full">Log in</Button>
          </Link>
          <Link href={`/register?next=/invites/${token}`}>
            <Button variant="outline" className="w-full">
              Sign up
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Link href="/" className="mb-12 inline-block text-lg font-bold uppercase tracking-tight">
        Workwise
      </Link>
      <p className="label-eyebrow mb-2">Workspace invite</p>
      <h1 className="mb-3 text-3xl font-bold uppercase leading-none tracking-tight">Join workspace</h1>

      {done === "accepted" && (
        <p className="border border-border bg-surface px-3 py-2 text-sm text-foreground">
          Invite accepted — redirecting...
        </p>
      )}
      {done === "declined" && (
        <p className="border border-border bg-surface px-3 py-2 text-sm text-muted">Invite declined.</p>
      )}
      {!done && (
        <>
          <p className="mb-9 text-sm text-muted">Accept this invite to join the workspace, or decline it.</p>
          {error && (
            <p className="mb-4 border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleAccept} disabled={accept.isPending} className="w-full">
              {accept.isPending ? "Accepting..." : "Accept"}
            </Button>
            <Button variant="outline" onClick={handleDecline} disabled={decline.isPending} className="w-full">
              Decline
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
