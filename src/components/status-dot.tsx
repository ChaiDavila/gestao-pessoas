const CORES: Record<string, string> = {
  success: "bg-success text-success",
  warning: "bg-warning text-warning",
  danger: "bg-danger text-danger",
  neutral: "bg-muted-foreground text-muted-foreground",
};

export function StatusDot({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "neutral";
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
      <span className={`h-1.5 w-1.5 rounded-full ${CORES[tone].split(" ")[0]}`} />
      <span className={CORES[tone].split(" ")[1]}>{children}</span>
    </span>
  );
}
