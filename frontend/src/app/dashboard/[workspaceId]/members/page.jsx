"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useMembers } from "@/hooks/useWorkspaces";
import { api, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function MembersPage() {
  const { workspaceId } = useParams();
  const { data: members, isLoading } = useMembers(workspaceId);
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);

  async function handleInvite(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.addMember(workspaceId, { email, role: "MEMBER" });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "members"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add member");
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Members</h1>

      <form onSubmit={handleInvite} className="mb-8 flex gap-2">
        <Input
          type="email"
          placeholder="Invite by email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit">Add member</Button>
      </form>
      {error && <p className="mb-4 text-xs text-red-400">{error}</p>}

      {isLoading ? (
        <p className="text-white/50">Loading...</p>
      ) : (
        <div className="space-y-2">
          {members?.map((m) => (
            <Card key={m.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-white/40">{m.email}</p>
              </div>
              <span className="text-xs uppercase tracking-wide text-white/50">{m.role}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
