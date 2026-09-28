-- ============================================================
-- 044_deletion_requests.sql
--
-- Tabla pública para solicitudes de eliminación de datos
-- (ARCO — Ley N.o 19.628 / futura Ley 21.719).
--
-- Acceso:
--   INSERT  — service-role únicamente (no hay política anon).
--             La API route /api/eliminacion usa supabaseServiceRole()
--             para insertar, así que nunca llega auth.uid().
--   SELECT  — sólo service-role (administración interna).
-- No se expone ninguna fila al cliente navegador.
-- ============================================================

CREATE TABLE IF NOT EXISTS deletion_requests (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Datos que entrega el solicitante en el formulario.
  full_name     TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  phone         TEXT,
  id_type       TEXT        NOT NULL
    CHECK (id_type IN ('rut_cl', 'passport', 'other')),
  id_value      TEXT        NOT NULL,
  reason        TEXT        NOT NULL
    CHECK (reason IN ('arco_suppression', 'account_closure', 'meta_callback', 'other')),
  notes         TEXT,

  -- Seguimiento interno.
  status        TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_review', 'completed', 'rejected')),
  resolved_at   TIMESTAMPTZ,
  resolver_note TEXT,

  -- Metadatos de auditoría.
  ip_address    TEXT,                 -- registrada en la API, no en el cliente
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_email
  ON deletion_requests(email);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status_created
  ON deletion_requests(status, created_at DESC);

-- Actualiza updated_at automáticamente.
CREATE OR REPLACE FUNCTION touch_deletion_requests_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deletion_requests_updated_at ON deletion_requests;
CREATE TRIGGER trg_deletion_requests_updated_at
  BEFORE UPDATE ON deletion_requests
  FOR EACH ROW EXECUTE FUNCTION touch_deletion_requests_updated_at();

-- RLS habilitado; sin políticas de cliente → sólo service-role accede.
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;
