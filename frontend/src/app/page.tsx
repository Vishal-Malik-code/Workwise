import Link from "next/link";
import { ArrowRight, ShieldCheck, KanbanSquare, MessagesSquare, Sparkles, Radio, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Workspaces & RBAC",
    body: "Every workspace has five roles, from Owner down to Viewer, so you decide exactly who can do what.",
  },
  {
    icon: KanbanSquare,
    title: "Projects & tasks",
    body: "Break work into projects and tasks, assign owners, and track status on a shared Kanban board.",
  },
  {
    icon: MessagesSquare,
    title: "Comments & labels",
    body: "Discuss work in context and organize tasks with color-coded labels.",
  },
  {
    icon: Radio,
    title: "Realtime sync",
    body: "Every board update reaches the whole team instantly over a live connection.",
  },
  {
    icon: History,
    title: "Full audit trail",
    body: "Every mutation is logged so you can see exactly who changed what, and when.",
  },
];

const PULSE_FEATURE = {
  icon: Sparkles,
  title: "Pulse, the AI assistant",
  body: "Ask Pulse to draft tasks in plain language. It proposes the change, then a teammate reviews and approves it before anything is written to the board.",
};

const BOARD_COLUMNS: { label: string; tone: "muted" | "accent" | "success"; tasks: string[] }[] = [
  { label: "To do", tone: "muted", tasks: ["Draft onboarding flow", "Audit RBAC roles"] },
  { label: "In progress", tone: "accent", tasks: ["Kanban drag polish", "Pulse approval UI"] },
  { label: "Done", tone: "success", tasks: ["Realtime sync spike"] },
];

const TONE_DOT: Record<string, string> = {
  muted: "bg-muted",
  accent: "bg-accent",
  success: "bg-emerald-600",
};

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <nav className="mb-16 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">Workwise</span>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary">Get started</Button>
          </Link>
        </div>
      </nav>

      <section className="mb-28 grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Badge variant="outline" className="mb-5 border-accent/40 text-accent">
            Project management, done properly
          </Badge>
          <h1 className="max-w-xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            Coordinate your team&apos;s work in one shared workspace.
          </h1>
          <p className="mt-5 max-w-md text-muted">
            Projects, tasks, and an approval-gated AI assistant together, so your team moves fast without losing
            control.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button variant="primary" size="lg" className="group">
                Create your workspace
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>

        <div
          aria-hidden
          className="relative rounded-2xl border border-border bg-white/60 p-5 shadow-[0_20px_60px_-25px_rgb(0_0_0/0.35)]"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground/80">Product launch</span>
            <div className="flex -space-x-2">
              {["MK", "RJ", "SP"].map((initials) => (
                <Avatar key={initials} className="h-6 w-6 border-2 border-background bg-accent/20">
                  <AvatarFallback className="text-[10px] text-accent">{initials}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {BOARD_COLUMNS.map((col) => (
              <div key={col.label} className="rounded-xl bg-background/80 p-2.5">
                <div className="mb-2 flex items-center gap-1.5 px-0.5">
                  <span className={`size-1.5 rounded-full ${TONE_DOT[col.tone]}`} />
                  <span className="text-[11px] font-medium text-muted">{col.label}</span>
                </div>
                <div className="space-y-2">
                  {col.tasks.map((task) => (
                    <div
                      key={task}
                      className="rounded-lg border border-border bg-white/70 p-2 text-[11px] leading-snug text-foreground/80 shadow-sm"
                    >
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">Everything your team needs to ship</h2>
      </section>

      <section className="mb-24 grid gap-4 md:grid-cols-3">
        <Card className="card-hover-lift md:col-span-2 md:row-span-2 flex flex-col justify-between bg-accent/[0.06]">
          <div>
            <PULSE_FEATURE.icon className="mb-4 size-7 text-accent" />
            <h3 className="mb-2 text-lg font-semibold">{PULSE_FEATURE.title}</h3>
            <p className="max-w-md text-sm text-muted">{PULSE_FEATURE.body}</p>
          </div>
          <Badge variant="accent" className="mt-6 w-fit bg-accent/15 text-accent">
            Human approval required
          </Badge>
        </Card>

        {FEATURES.map((f) => (
          <Card key={f.title} className="card-hover-lift">
            <f.icon className="mb-3 size-5 text-accent" />
            <h3 className="mb-2 font-semibold">{f.title}</h3>
            <p className="text-sm text-muted">{f.body}</p>
          </Card>
        ))}
      </section>

      <footer className="flex flex-col items-center justify-between gap-4 border-t border-border py-8 text-sm text-muted sm:flex-row">
        <span className="font-medium text-foreground/80">Workwise</span>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-foreground">
            Log in
          </Link>
          <Link href="/register" className="hover:text-foreground">
            Get started
          </Link>
        </div>
      </footer>
    </main>
  );
}
