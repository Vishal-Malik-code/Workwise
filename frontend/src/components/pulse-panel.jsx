"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function PulsePanel({ workspaceId }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState(null);

  const { data: proposals } = useQuery({
    queryKey: ["workspaces", workspaceId, "pulse", "proposals"],
    queryFn: () => api.listProposals(workspaceId),
    select: (data) => data.proposals.filter((p) => p.status === "PENDING"),
    enabled: !!workspaceId,
    refetchInterval: 10_000,
  });

  const ask = useMutation({
    mutationFn: () => api.askPulse(workspaceId, message),
    onSuccess: (data) => {
      setReply(data.reply);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "pulse", "proposals"] });
    },
  });

  const decide = useMutation({
    mutationFn: ({ proposalId, approve }) => api.decideProposal(workspaceId, proposalId, approve),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "pulse", "proposals"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId] });
    },
  });

  function handleAsk(e) {
    e.preventDefault();
    if (!message.trim()) return;
    ask.mutate();
  }

  return (
    <Card>
      <h3 className="mb-3 font-semibold">Pulse</h3>
      <form onSubmit={handleAsk} className="mb-4 flex gap-2">
        <Input
          placeholder="Ask Pulse to draft a task..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button type="submit" disabled={ask.isPending}>
          {ask.isPending ? "..." : "Ask"}
        </Button>
      </form>
      {reply && <p className="mb-4 rounded-lg bg-white/5 p-3 text-sm text-white/70">{reply}</p>}

      {proposals?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-white/40">Pending proposals</p>
          {proposals.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
              <p className="text-sm">{p.summary}</p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => decide.mutate({ proposalId: p.id, approve: true })}>
                  Approve
                </Button>
                <Button variant="danger" onClick={() => decide.mutate({ proposalId: p.id, approve: false })}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
