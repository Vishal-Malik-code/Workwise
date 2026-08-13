import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-indigo-500 text-white hover:bg-indigo-400",
  secondary: "bg-white/10 text-white hover:bg-white/20",
  ghost: "bg-transparent text-white/80 hover:bg-white/10",
  danger: "bg-red-500/90 text-white hover:bg-red-500",
};

export function Button({ variant = "primary", className, children, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
