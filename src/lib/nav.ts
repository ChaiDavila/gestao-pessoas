import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  UserX,
  TrendingUp,
  GraduationCap,
  Stethoscope,
  HeartHandshake,
  PartyPopper,
  Settings,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/colaboradores", label: "Colaboradores", icon: Users },
  { href: "/desligamentos", label: "Desligamentos", icon: UserX },
  { href: "/evolucao-salarial", label: "Evolução Salarial", icon: TrendingUp },
  { href: "/treinamentos", label: "Treinamentos", icon: GraduationCap },
  { href: "/aso", label: "ASO", icon: Stethoscope },
  { href: "/perfil-familiar", label: "Perfil Familiar", icon: HeartHandshake },
  { href: "/aniversarios", label: "Aniversários", icon: PartyPopper },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];
