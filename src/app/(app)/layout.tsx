import { SidebarNav } from "@/components/sidebar-nav";
import { getUsuarioAtual } from "@/lib/auth";

const PAPEL_LABEL: Record<string, string> = {
  leitor: "Leitor",
  operador: "Operador",
  gestor: "Gestor",
  admin: "Admin",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioAtual();

  return (
    <div className="flex min-h-screen w-full">
      <SidebarNav
        userEmail={usuario?.email ?? null}
        papelLabel={usuario?.papel ? PAPEL_LABEL[usuario.papel] : null}
      />
      <div className="flex-1 flex flex-col">
        {usuario && !usuario.papel && (
          <div className="border-b border-warning/30 bg-warning/10 px-6 py-2 text-sm text-warning">
            Seu usuário ainda não tem um papel atribuído em RH. Peça para um
            admin te cadastrar em Configurações.
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
