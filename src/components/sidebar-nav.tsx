"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";
import { logout } from "@/app/login/actions";

type SidebarNavProps = {
  userEmail: string | null;
  papelLabel: string | null;
};

export function SidebarNav({ userEmail, papelLabel }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-[232px] md:flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white">
          <Image
            src="/coontrol-logo.png"
            alt="COONTROL"
            width={28}
            height={14}
          />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">COONTROL</p>
          <p className="text-xs text-sidebar-foreground/60 leading-tight">
            Gestão de Pessoas
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md border-l-[3px] px-2.5 py-2 text-sm transition-colors",
                active
                  ? "border-l-primary bg-primary/[.18] font-semibold text-white"
                  : "border-l-transparent text-white/80 hover:bg-white/[.07] hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {userEmail && (
        <div className="border-t border-sidebar-border px-3 py-4">
          <div className="px-2 text-xs">
            <p className="truncate text-sidebar-foreground/90">{userEmail}</p>
            {papelLabel && (
              <p className="text-sidebar-foreground/60">{papelLabel}</p>
            )}
          </div>
          <form action={logout} className="mt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/[.07] hover:text-white"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sair
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
