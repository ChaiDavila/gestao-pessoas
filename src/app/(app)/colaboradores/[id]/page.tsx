import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { exigirAcessoTela } from "@/lib/auth";
import { FichaColaboradorContent } from "./ficha-content";

export default async function ColaboradorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modo?: string }>;
}) {
  await exigirAcessoTela("colaboradores");
  const { id } = await params;
  const { modo } = await searchParams;

  return (
    <div className="space-y-4">
      <Link
        href="/colaboradores"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Colaboradores
      </Link>
      <FichaColaboradorContent
        id={id}
        modoInicial={modo === "editar" ? "editar" : "ver"}
      />
    </div>
  );
}
