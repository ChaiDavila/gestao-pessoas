import { createClient } from "@supabase/supabase-js";

// Cliente admin (service_role): bypassa RLS, só usado em rotinas server-side que
// precisam da Auth Admin API (criar usuário, listar usuários). Nunca expor ao browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
