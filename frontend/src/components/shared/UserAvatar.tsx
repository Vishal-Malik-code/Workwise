import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  className?: string;
}

export function UserAvatar({ name, email, src, className }: UserAvatarProps) {
  const label = name?.trim() || email?.trim() || "?";
  return (
    <Avatar className={cn(className)}>
      {src && <AvatarImage src={src} alt={label} />}
      <AvatarFallback>{initials(label)}</AvatarFallback>
    </Avatar>
  );
}
