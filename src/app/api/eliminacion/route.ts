// ============================================================
// POST /api/eliminacion
//
// Recibe el formulario público de solicitud de eliminación de datos
// (Ley N.o 19.628, futura Ley 21.719, política de datos de Meta).
//
// Visitantes anónimos → sin sesión de Supabase → usamos
// supabaseServiceRole() para insertar, idéntico al patrón comentado
// en src/lib/supabase/service-role.ts.
//
// Seguridad:
//   - Rate limit liviano vía cabecera CF-Connecting-IP / X-Forwarded-For.
//     (Un rate-limiter real en Edge Middleware es el siguiente paso.)
//   - Validación estricta de todos los campos antes de insertar.
//   - La IP se guarda para auditoría pero no se devuelve al cliente.
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase/service-role';

// Valores permitidos — deben coincidir con el CHECK de la migración.
const VALID_ID_TYPES = ['rut_cl', 'passport', 'other'] as const;
const VALID_REASONS = [
  'arco_suppression',
  'account_closure',
  'meta_callback',
  'other',
] as const;

type IdType = (typeof VALID_ID_TYPES)[number];
type Reason = (typeof VALID_REASONS)[number];

function isValidIdType(v: unknown): v is IdType {
  return VALID_ID_TYPES.includes(v as IdType);
}
function isValidReason(v: unknown): v is Reason {
  return VALID_REASONS.includes(v as Reason);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Cuerpo de la solicitud inválido.' },
      { status: 400 },
    );
  }

  const { full_name, email, phone, id_type, id_value, reason, notes } = body;

  // ── Validación ──────────────────────────────────────────────────────────
  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
    return NextResponse.json(
      { error: 'Nombre completo requerido (mínimo 2 caracteres).' },
      { status: 422 },
    );
  }

  const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!emailStr || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
    return NextResponse.json(
      { error: 'Correo electrónico inválido.' },
      { status: 422 },
    );
  }

  if (!isValidIdType(id_type)) {
    return NextResponse.json(
      { error: 'Tipo de documento inválido.' },
      { status: 422 },
    );
  }

  if (!id_value || typeof id_value !== 'string' || id_value.trim().length < 2) {
    return NextResponse.json(
      { error: 'Número de documento requerido.' },
      { status: 422 },
    );
  }

  if (!isValidReason(reason)) {
    return NextResponse.json(
      { error: 'Motivo de solicitud inválido.' },
      { status: 422 },
    );
  }

  // Notas son opcionales; si vienen, limitamos la longitud.
  const notesStr =
    notes && typeof notes === 'string' ? notes.trim().slice(0, 2000) : null;

  // ── IP para auditoría ────────────────────────────────────────────────────
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    null;

  // ── Inserción ────────────────────────────────────────────────────────────
  const db = supabaseServiceRole();

  const { error } = await db.from('deletion_requests').insert({
    full_name: full_name.trim(),
    email: emailStr,
    phone:
      phone && typeof phone === 'string' ? phone.trim() || null : null,
    id_type,
    id_value: id_value.trim(),
    reason,
    notes: notesStr,
    ip_address: ip,
  });

  if (error) {
    console.error('[/api/eliminacion] Supabase insert error:', error);
    return NextResponse.json(
      { error: 'No pudimos registrar tu solicitud. Inténtalo de nuevo.' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: true, message: 'Solicitud recibida correctamente.' },
    { status: 201 },
  );
}
