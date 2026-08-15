import Link from "next/link";
import { ArrowRight, ShieldCheck, KanbanSquare, MessagesSquare, Sparkles, Radio, History } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const BOARD_COLUMNS: { label: string; tasks: string[] }[] = [
  { label: "To do", tasks: ["Draft onboarding flow", "Audit RBAC roles"] },
  { label: "In progress", tasks: ["Kanban drag polish", "Pulse approval UI"] },
  { label: "Done", tasks: ["Realtime sync spike"] },
];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <nav className="mb-20 flex items-center justify-between border-b border-border pb-6">
        <span className="text-2xl font-bold uppercase tracking-tight">Workwise</span>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary">Get started</Button>
          </Link>
        </div>
      </nav>

      <section className="mb-24 grid gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="label-eyebrow mb-6 block">Project management, done properly</span>
          <h1 className="max-w-xl text-5xl font-bold uppercase leading-[1.02] tracking-tight sm:text-6xl">
            Coordinate your team&apos;s <span className="text-accent">work</span>
            <br />
            in one shared workspace.
          </h1>
          <p className="mt-6 max-w-md text-muted">
            Projects, tasks, and an approval-gated AI assistant together, so your team moves fast without losing
            control.
          </p>
          <div className="mt-9">
            <Link href="/register">
              <Button variant="primary" size="lg" className="group">
                Create your workspace
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>

        <div aria-hidden className="relative border border-border bg-background p-5">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <span className="label-eyebrow">Product launch</span>
            <div className="flex -space-x-2">
              {["MK", "RJ", "SP"].map((initials) => (
                <Avatar key={initials} className="h-6 w-6 border-2 border-background bg-surface">
                  <AvatarFallback className="text-[10px] text-foreground">{initials}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {BOARD_COLUMNS.map((col) => (
              <div key={col.label} className="border border-border p-2.5">
                <div className="mb-2 px-0.5">
                  <span className="label-eyebrow">{col.label}</span>
                </div>
                <div className="space-y-2">
                  {col.tasks.map((task) => (
                    <div key={task} className="border border-border bg-surface p-2 text-[11px] leading-snug text-foreground">
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mb-12 h-px w-full bg-border" />

      <section className="mb-8">
        <span className="label-eyebrow mb-3 block">System components</span>
        <h2 className="text-3xl font-bold uppercase tracking-tight">Everything your team needs to ship</h2>
      </section>

      <section className="mb-24 grid gap-px border border-border bg-border md:grid-cols-3">
        <div className="flex flex-col justify-between bg-accent p-6 text-accent-foreground md:col-span-2 md:row-span-2">
          <div>
            <PULSE_FEATURE.icon className="mb-4 size-7" />
            <h3 className="mb-2 text-lg font-bold uppercase tracking-tight">{PULSE_FEATURE.title}</h3>
            <p className="max-w-md text-sm text-accent-foreground/90">{PULSE_FEATURE.body}</p>
          </div>
          <span className="mt-6 w-fit border border-accent-foreground/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Human approval required
          </span>
        </div>

        {FEATURES.map((f) => (
          <div key={f.title} className="card-hover-lift bg-background p-6">
            <f.icon className="mb-3 size-5 text-accent" />
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide">{f.title}</h3>
            <p className="text-sm text-muted">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="flex flex-col items-center justify-between gap-4 border-t border-border py-8 text-xs uppercase tracking-wide text-muted sm:flex-row">
        <span className="font-semibold text-foreground">Workwise &copy; {new Date().getFullYear()}</span>
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
