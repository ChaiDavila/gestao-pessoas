export function ChartCard({
  titulo,
  altura = 260,
  children,
}: {
  titulo: string;
  altura?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">{titulo}</p>
      <div style={{ height: altura }}>{children}</div>
    </div>
  );
}
