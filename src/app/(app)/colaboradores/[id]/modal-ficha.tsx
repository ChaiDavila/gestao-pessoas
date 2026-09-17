"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function ModalFicha({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <Dialog
      open
      onOpenChange={(open: boolean) => {
        if (!open) router.back();
      }}
    >
      <DialogContent
        showCloseButton
        className="max-h-[85vh] max-w-4xl overflow-y-auto sm:max-w-4xl"
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
