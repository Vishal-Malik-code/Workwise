import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    title: "Workspaces & RBAC",
    body: "Every workspace has five roles, from Owner down to Viewer, so you decide exactly who can do what.",
  },
  {
    title: "Projects & tasks",
    body: "Break work into projects and tasks, assign owners, and track status on a shared board.",
  },
  {
    title: "Pulse, the AI assistant",
    body: "Ask Pulse to draft tasks in plain language. It proposes the change — a teammate approves it before anything is written.",
  },
  {
    title: "Realtime sync",
    body: "Every board update reaches the whole team instantly over a live connection.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <nav className="mb-20 flex items-center justify-between">
        <span className="text-lg font-semibold">Workwise</span>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary">Get started</Button>
          </Link>
        </div>
      </nav>

      <section className="mb-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Coordinate your team&apos;s work in one shared workspace.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-white/60">
          Workwise brings projects, tasks, and an approval-gated AI assistant together, so your team moves fast without losing control over what actually gets written.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register">
            <Button variant="primary" className="px-6 py-3 text-base">Create your workspace</Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <h3 className="mb-2 font-semibold">{f.title}</h3>
            <p className="text-sm text-white/60">{f.body}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
