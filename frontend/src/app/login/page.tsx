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
          <Link href="/" className="mb-12 inline-block text-lg font-bold uppercase tracking-tight">
            Workwise
          </Link>

          <h1 className="mb-2 text-4xl font-bold uppercase leading-none tracking-tight">Sign in.</h1>
          <p className="mb-9 text-sm text-muted">Log in to pick up where your team left off.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              <p className="border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {formError}
              </p>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? "Logging in..." : "Authenticate"}
            </Button>
          </form>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="label-eyebrow">Or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" disabled={demoLogin.isPending} onClick={handleDemo}>
            {demoLogin.isPending && <Loader2 className="size-4 animate-spin" />}
            Try the guest demo
          </Button>

          <p className="mt-7 text-center text-xs uppercase tracking-wide text-muted">
            No account?{" "}
            <Link href="/register" className="font-semibold text-accent hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="relative">
          <span className="text-lg font-bold uppercase tracking-tight text-background">Workwise</span>
        </div>
        <div className="relative max-w-sm space-y-8">
          <p className="text-3xl font-bold uppercase leading-[1.05] tracking-tight text-background">
            Every task tracked.
            <br />
            Every change <span className="text-accent">approved</span>.
            <br />
            Every teammate in sync.
          </p>
          <div className="flex flex-col gap-3 border-t border-background/20 pt-6 text-xs uppercase tracking-wide text-background/70">
            <div className="flex items-center gap-2">
              <KanbanSquare className="size-4 text-accent" />
              Shared Kanban boards across every project
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" />
              Pulse drafts, your team approves
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-accent" />
              Role-based access on every workspace
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
