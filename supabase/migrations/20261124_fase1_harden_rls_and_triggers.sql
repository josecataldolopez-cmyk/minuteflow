-- ============================================================================
-- PactaCloud Fase 1: Endurecimiento de RLS, RBAC, Triggers Anti-Tampering
-- y search_path seguro en funciones SECURITY DEFINER.
-- ============================================================================

-- 1. Funciones auxiliares con search_path vacío y verificación explícita
CREATE OR REPLACE FUNCTION public.get_current_user_org_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
$$;

REVOKE ALL ON FUNCTION public.get_current_user_org_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_user_org_id() TO authenticated;

REVOKE ALL ON FUNCTION public.get_current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;

REVOKE ALL ON FUNCTION public.is_org_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_admin() TO authenticated;

-- 2. Trigger anti-tampering de organización (impide mover registros entre tenants)
CREATE OR REPLACE FUNCTION public.prevent_org_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
    RAISE EXCEPTION 'Operación denegada: no está permitido transferir registros entre organizaciones.';
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Trigger anti-tampering en profiles (impide auto-promoción de rol o cambio de tenant)
CREATE OR REPLACE FUNCTION public.prevent_profile_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'Operación denegada: no puedes cambiar tu organización.';
    END IF;
    IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_org_admin() THEN
      RAISE EXCEPTION 'Operación denegada: no tienes permisos para modificar tu rol.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Trigger automático de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Adjuntar triggers anti-tampering
DROP TRIGGER IF EXISTS trg_prevent_org_tampering_directories ON public.directories;
CREATE TRIGGER trg_prevent_org_tampering_directories
  BEFORE UPDATE ON public.directories
  FOR EACH ROW EXECUTE FUNCTION public.prevent_org_tampering();

DROP TRIGGER IF EXISTS trg_prevent_org_tampering_attendees ON public.attendees;
CREATE TRIGGER trg_prevent_org_tampering_attendees
  BEFORE UPDATE ON public.attendees
  FOR EACH ROW EXECUTE FUNCTION public.prevent_org_tampering();

DROP TRIGGER IF EXISTS trg_prevent_org_tampering_minutes ON public.minutes;
CREATE TRIGGER trg_prevent_org_tampering_minutes
  BEFORE UPDATE ON public.minutes
  FOR EACH ROW EXECUTE FUNCTION public.prevent_org_tampering();

DROP TRIGGER IF EXISTS trg_prevent_org_tampering_action_items ON public.action_items;
CREATE TRIGGER trg_prevent_org_tampering_action_items
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW EXECUTE FUNCTION public.prevent_org_tampering();

DROP TRIGGER IF EXISTS trg_prevent_profile_tampering ON public.profiles;
CREATE TRIGGER trg_prevent_profile_tampering
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_tampering();

-- Adjuntar triggers updated_at en tablas con columna updated_at
DROP TRIGGER IF EXISTS trg_updated_at_organizations ON public.organizations;
CREATE TRIGGER trg_updated_at_organizations
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_updated_at_profiles ON public.profiles;
CREATE TRIGGER trg_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_updated_at_minutes ON public.minutes;
CREATE TRIGGER trg_updated_at_minutes
  BEFORE UPDATE ON public.minutes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_updated_at_action_items ON public.action_items;
CREATE TRIGGER trg_updated_at_action_items
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Endurecimiento RBAC en políticas RLS (los lectores no pueden mutar/borrar)
-- Directories
DROP POLICY IF EXISTS "directories_insert" ON public.directories;
CREATE POLICY "directories_insert" ON public.directories
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_current_user_org_id()
    AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
  );

DROP POLICY IF EXISTS "directories_update" ON public.directories;
CREATE POLICY "directories_update" ON public.directories
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_current_user_org_id()
    AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
  )
  WITH CHECK (
    organization_id = public.get_current_user_org_id()
    AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
  );

-- Attendees
DROP POLICY IF EXISTS "attendees_insert" ON public.attendees;
CREATE POLICY "attendees_insert" ON public.attendees
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_current_user_org_id()
    AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
  );

DROP POLICY IF EXISTS "attendees_update" ON public.attendees;
CREATE POLICY "attendees_update" ON public.attendees
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_current_user_org_id()
    AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
  )
  WITH CHECK (
    organization_id = public.get_current_user_org_id()
    AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
  );

DROP POLICY IF EXISTS "attendees_delete" ON public.attendees;
CREATE POLICY "attendees_delete" ON public.attendees
  FOR DELETE TO authenticated
  USING (
    organization_id = public.get_current_user_org_id()
    AND public.is_org_admin()
  );

-- Minutes
DROP POLICY IF EXISTS "minutes_insert" ON public.minutes;
CREATE POLICY "minutes_insert" ON public.minutes
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_current_user_org_id()
    AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
  );

DROP POLICY IF EXISTS "minutes_update" ON public.minutes;
CREATE POLICY "minutes_update" ON public.minutes
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_current_user_org_id()
    AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
  )
  WITH CHECK (
    organization_id = public.get_current_user_org_id()
    AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
  );

DROP POLICY IF EXISTS "minutes_delete" ON public.minutes;
CREATE POLICY "minutes_delete" ON public.minutes
  FOR DELETE TO authenticated
  USING (
    organization_id = public.get_current_user_org_id()
    AND public.is_org_admin()
  );

-- Action Items
DROP POLICY IF EXISTS "action_items_insert" ON public.action_items;
CREATE POLICY "action_items_insert" ON public.action_items
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_current_user_org_id()
    AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
  );

DROP POLICY IF EXISTS "action_items_update" ON public.action_items;
CREATE POLICY "action_items_update" ON public.action_items
  FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_current_user_org_id()
    AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
  )
  WITH CHECK (
    organization_id = public.get_current_user_org_id()
    AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
  );

DROP POLICY IF EXISTS "action_items_delete" ON public.action_items;
CREATE POLICY "action_items_delete" ON public.action_items
  FOR DELETE TO authenticated
  USING (
    organization_id = public.get_current_user_org_id()
    AND public.is_org_admin()
  );
