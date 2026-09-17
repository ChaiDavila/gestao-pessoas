import { ModalFicha } from "../../[id]/modal-ficha";
import { FichaColaboradorContent } from "../../[id]/ficha-content";

export default async function ColaboradorModalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ modo?: string }>;
}) {
  const { id } = await params;
  const { modo } = await searchParams;

  return (
    <ModalFicha>
      <FichaColaboradorContent
        id={id}
        modoInicial={modo === "editar" ? "editar" : "ver"}
      />
    </ModalFicha>
  );
}
