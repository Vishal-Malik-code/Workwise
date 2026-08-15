"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, KanbanSquare, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import { useDemoLogin, useLogin } from "@/features/auth/useAuth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const login = useLogin();
  const demoLogin = useDemoLogin();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await login.mutateAsync(values);
      router.push("/dashboard");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function handleDemo() {
    setFormError(null);
    try {
      await demoLogin.mutateAsync();
      router.push("/dashboard");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-block text-lg font-semibold tracking-tight">
            Workwise
          </Link>

          <h1 className="mb-1 text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mb-8 text-sm text-muted">Log in to pick up where your team left off.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            {formError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {formError}
              </p>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            disabled={demoLogin.isPending}
            onClick={handleDemo}
          >
            {demoLogin.isPending && <Loader2 className="size-4 animate-spin" />}
            Try the guest demo
          </Button>

          <p className="mt-6 text-center text-sm text-muted">
            No account?{" "}
            <Link href="/register" className="font-medium text-accent hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-sidebar-bg lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(circle at 20% 15%, color-mix(in srgb, var(--sidebar-accent) 35%, transparent), transparent 55%), radial-gradient(circle at 80% 80%, color-mix(in srgb, var(--accent) 40%, transparent), transparent 50%)",
          }}
        />
        <div className="relative">
          <span className="text-lg font-semibold tracking-tight text-sidebar-fg">Workwise</span>
        </div>
        <div className="relative max-w-sm space-y-6">
          <p className="text-2xl font-medium leading-snug text-sidebar-fg">
            Every task tracked, every change approved, every teammate in sync.
          </p>
          <div className="flex flex-col gap-3 text-sm text-sidebar-fg/80">
            <div className="flex items-center gap-2">
              <KanbanSquare className="size-4 text-sidebar-accent" />
              Shared Kanban boards across every project
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-sidebar-accent" />
              Pulse drafts, your team approves
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-sidebar-accent" />
              Role-based access on every workspace
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
