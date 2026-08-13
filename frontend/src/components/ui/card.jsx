import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn("rounded-xl border border-white/10 bg-white/[0.03] p-5", className)}
      {...props}
    >
      {children}
    </div>
  );
}
