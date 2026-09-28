import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Shared service-role client for server-side writes that have no
// `auth.uid()` — today that is the public /eliminacion form, which
// arrives from anonymous visitors (and Meta's data-deletion callbacks).
// Mirrors src/lib/ai/admin-client.ts: lazy singleton, never imported
// from client code, so the key stays out of the browser bundle.
let _serviceClient: SupabaseClient | null = null;

export function supabaseServiceRole(): SupabaseClient {
  if (!_serviceClient) {
    _serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _serviceClient;
}
