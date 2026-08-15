"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { ApiError } from "@/lib/api-client";
import { titleCase } from "@/lib/format";
import { useAuth } from "@/features/auth/useAuth";
import { useMembers } from "@/features/members/useMembers";
import { useAskPulse, useAssistantStatus, useDecideProposal, useProposals } from "./useAssistant";

const ACTION_LABEL: Record<string, string> = {
  CREATE_TASK: "Create task",
  UPDATE_TASK: "Update task",
  ADD_COMMENT: "Add comment",
};

const MESSAGE_LIMIT = 2000;

const STARTER_PROMPTS = [
  "What's overdue in this project?",
  "Summarize recent activity",
  "Create a task for...",
  "What should I prioritize today?",
];

export function PulsePanel({ workspaceId }: { workspaceId: string }) {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);

  const { data: enabled, isLoading: statusLoading } = useAssistantStatus(workspaceId);
  const { data: proposals } = useProposals(workspaceId, "PENDING");
  const { user } = useAuth();
  const { data: members } = useMembers(workspaceId);
  const ask = useAskPulse(workspaceId);
  const decide = useDecideProposal(workspaceId);

  const currentMember = members?.find((m) => m.userId === user?.id);
  const isViewer = currentMember?.role === "VIEWER";

  const overLimit = message.length > MESSAGE_LIMIT;

  function submitMessage() {
    if (!message.trim() || overLimit) return;
    ask.mutate(message, {
      onSuccess: (data) => {
        setReply(data.reply);
        setMessage("");
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "Pulse couldn't process that request.");
      },
    });
  }

  function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    submitMessage();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  }

  function handleDecide(proposalId: string, approve: boolean) {
    decide.mutate(
      { proposalId, approve },
      {
        onSuccess: () => toast.success(approve ? "Proposal approved" : "Proposal rejected"),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't process that proposal."),
      },
    );
  }

  if (statusLoading) {
    return null;
  }

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pulse</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">Pulse is currently unavailable.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pulse</CardTitle>
      </CardHeader>
      <CardContent>
        {isViewer && (
          <p className="mb-3 rounded-lg bg-white/5 p-2 text-xs text-muted">
            You can ask Pulse questions, but only managers and above can approve or reject proposals.
          </p>
        )}

        {!reply && (!proposals || proposals.length === 0) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setMessage(prompt)}
                className="rounded-full border border-border bg-white/5 px-3 py-1 text-xs text-foreground/80 transition-colors hover:bg-white/10"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleAsk} className="mb-4 flex flex-col gap-2">
          <Textarea
            placeholder="Ask Pulse to draft a task, summarize a project, or add a comment..."
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_LIMIT + 50))}
            onKeyDown={handleKeyDown}
            rows={3}
          />
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs ${overLimit ? "text-red-400" : "text-muted"}`}>
              {message.length}/{MESSAGE_LIMIT}
            </span>
            <LoadingButton type="submit" loading={ask.isPending} disabled={overLimit || !message.trim()}>
              Ask
            </LoadingButton>
          </div>
        </form>

        {reply && <p className="mb-4 rounded-lg bg-white/5 p-3 text-sm text-foreground/80">{reply}</p>}

        {proposals && proposals.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted">Pending proposals — review before they take effect</p>
            {proposals.map((p) => (
              <div key={p.id} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant="accent">{ACTION_LABEL[p.action] ?? titleCase(p.action)}</Badge>
                  <span className="text-xs text-muted">expires {new Date(p.expiresAt).toLocaleTimeString()}</span>
                </div>
                <p className="mb-2 text-sm text-foreground">{p.summary}</p>
                <pre className="mb-3 overflow-x-auto rounded-md bg-black/30 p-2 text-xs text-muted">
                  {JSON.stringify(p.payload, null, 2)}
                </pre>
                {!isViewer && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={decide.isPending}
                      onClick={() => handleDecide(p.id, true)}
                    >
                      Approve
                    </Button>
                    <Button variant="danger" size="sm" disabled={decide.isPending} onClick={() => handleDecide(p.id, false)}>
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
