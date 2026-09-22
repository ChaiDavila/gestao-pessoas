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

// Ids estáveis de tela, usados em core.usuarios_areas.escopo_telas para restringir
// navegação por usuário. "configuracoes" não entra no escopo — continua controlada só
// pelo papel (admin vê a aba Usuários; qualquer papel vê os catálogos), como já era.
export type TelaId =
  | "dashboard"
  | "colaboradores"
  | "desligamentos"
  | "evolucao-salarial"
  | "treinamentos"
  | "aso"
  | "perfil-familiar"
  | "aniversarios"
  | "configuracoes";

export type NavItem = {
  id: TelaId;
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "colaboradores", href: "/colaboradores", label: "Colaboradores", icon: Users },
  { id: "desligamentos", href: "/desligamentos", label: "Desligamentos", icon: UserX },
  { id: "evolucao-salarial", href: "/evolucao-salarial", label: "Evolução Salarial", icon: TrendingUp },
  { id: "treinamentos", href: "/treinamentos", label: "Treinamentos", icon: GraduationCap },
  { id: "aso", href: "/aso", label: "ASO", icon: Stethoscope },
  { id: "perfil-familiar", href: "/perfil-familiar", label: "Perfil Familiar", icon: HeartHandshake },
  { id: "aniversarios", href: "/aniversarios", label: "Aniversários", icon: PartyPopper },
  { id: "configuracoes", href: "/configuracoes", label: "Configurações", icon: Settings },
];

// Telas selecionáveis no escopo de um usuário (todas menos Configurações, que não é
// restringível por escopo).
export const TELAS_ESCOPO: NavItem[] = NAV_ITEMS.filter((i) => i.id !== "configuracoes");
