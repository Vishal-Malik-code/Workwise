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
import { useRegister } from "@/features/auth/useAuth";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      await registerUser.mutateAsync(values);
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

          <h1 className="mb-1 text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mb-8 text-sm text-muted">Set up a workspace for your team in under a minute.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" autoComplete="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            {formError && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {formError}
              </p>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Log in
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
              "radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--sidebar-accent) 35%, transparent), transparent 55%), radial-gradient(circle at 15% 85%, color-mix(in srgb, var(--accent) 40%, transparent), transparent 50%)",
          }}
        />
        <div className="relative">
          <span className="text-lg font-semibold tracking-tight text-sidebar-fg">Workwise</span>
        </div>
        <div className="relative max-w-sm space-y-6">
          <p className="text-2xl font-medium leading-snug text-sidebar-fg">
            Bring projects, tasks, and your team into one shared workspace.
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
