-- ============================================================================
-- PactaCloud Fase 3: Índices Compuestos para Escalabilidad B2B
-- Acelera consultas filtradas por tenant (organization_id) en PostgreSQL.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_minutes_org_date
  ON public.minutes (organization_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_action_items_org_status
  ON public.action_items (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_action_items_minute_id
  ON public.action_items (minute_id);

CREATE INDEX IF NOT EXISTS idx_attendees_org
  ON public.attendees (organization_id);

CREATE INDEX IF NOT EXISTS idx_directories_org
  ON public.directories (organization_id);

CREATE INDEX IF NOT EXISTS idx_profiles_org
  ON public.profiles (organization_id);
