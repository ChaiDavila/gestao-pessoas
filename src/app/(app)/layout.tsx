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
    <div className="flex h-screen w-full overflow-hidden">
      <SidebarNav
        escopoTelas={usuario?.escopoTelas ?? null}
        userEmail={usuario?.email ?? null}
        papelLabel={usuario?.papel ? PAPEL_LABEL[usuario.papel] : null}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {usuario && !usuario.papel && (
          <div className="border-b border-warning/30 bg-warning/10 px-6 py-2 text-sm text-warning">
            Seu usuário ainda não tem um papel atribuído em RH. Peça para um
            admin te cadastrar em Configurações.
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
