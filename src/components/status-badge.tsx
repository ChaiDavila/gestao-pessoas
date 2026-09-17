import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  tone: "success" | "warning" | "danger" | "neutral";
  children: React.ReactNode;
};

const TONE_CLASSES: Record<StatusBadgeProps["tone"], string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  neutral: "bg-muted text-muted-foreground",
};

const DOT_CLASSES: Record<StatusBadgeProps["tone"], string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-muted-foreground",
};

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASSES[tone])} />
      {children}
    </span>
  );
}
