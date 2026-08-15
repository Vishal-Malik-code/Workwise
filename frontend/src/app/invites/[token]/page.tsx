"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/features/auth/useAuth";
import { useAcceptInvite, useDeclineInvite } from "@/features/invites/useInvites";
import { Card } from "@/components/ui/card";
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
    return <div className="p-8 text-muted">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <Card>
          <h1 className="mb-3 text-lg font-semibold">You&apos;ve been invited to a Workwise workspace</h1>
          <p className="mb-4 text-sm text-muted">Log in or create an account with the invited email address to continue.</p>
          <div className="flex gap-2">
            <Link href={`/login?next=/invites/${token}`}>
              <Button>Log in</Button>
            </Link>
            <Link href={`/register?next=/invites/${token}`}>
              <Button variant="outline">Sign up</Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Card>
        <h1 className="mb-3 text-lg font-semibold">Workspace invite</h1>
        {done === "accepted" && <p className="text-sm text-emerald-400">Invite accepted — redirecting...</p>}
        {done === "declined" && <p className="text-sm text-muted">Invite declined.</p>}
        {!done && (
          <>
            <p className="mb-4 text-sm text-muted">Accept this invite to join the workspace, or decline it.</p>
            {error && <p className="mb-4 text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleAccept} disabled={accept.isPending}>
                {accept.isPending ? "Accepting..." : "Accept"}
              </Button>
              <Button variant="outline" onClick={handleDecline} disabled={decline.isPending}>
                Decline
              </Button>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}
