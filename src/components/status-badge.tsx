import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  tone: "success" | "warning" | "danger" | "neutral";
  children: React.ReactNode;
};

const TONE_CLASSES: Record<StatusBadgeProps["tone"], string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-muted text-muted-foreground",
};

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  );
}
