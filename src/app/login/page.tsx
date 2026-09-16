import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-sidebar">
          <Image
            src="/coontrol-logo.png"
            alt="COONTROL"
            width={36}
            height={18}
          />
        </div>
        <h1 className="text-lg font-semibold text-foreground">COONTROL RH</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O login com Supabase Auth entra aqui na etapa de login, depois do banco de dados estar pronto.
        </p>
      </div>
    </div>
  );
}
