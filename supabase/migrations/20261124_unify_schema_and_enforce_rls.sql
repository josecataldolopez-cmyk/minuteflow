-- ========================================================================
-- PACTACLOUD: MIGRACIÓN OFICIAL UNIFICADA Y RLS ESTRICTO MULTI-TENANT
-- ========================================================================

-- 1. TABLA PROFILES VINCULADA A AUTH.USERS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('superadmin', 'admin', 'editor', 'reader')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas de branding y personalización en organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#4f46e5',
  ADD COLUMN IF NOT EXISTS secondary_color TEXT,
  ADD COLUMN IF NOT EXISTS slogan TEXT,
  ADD COLUMN IF NOT EXISTS header_text TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. FUNCIONES AUXILIARES DE SEGURIDAD (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_current_user_org_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
$$;

-- 3. TRIGGER AUTOMÁTICO AL REGISTRARSE UN USUARIO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_org TEXT;
  user_name TEXT;
BEGIN
  default_org := COALESCE(new.raw_user_meta_data->>'organization_id', 'org-redq');
  
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = default_org) THEN
    SELECT id INTO default_org FROM public.organizations LIMIT 1;
  END IF;

  user_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  INSERT INTO public.profiles (id, organization_id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    default_org,
    new.email,
    user_name,
    COALESCE(new.raw_user_meta_data->>'role', 'editor'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. ELIMINAR POLÍTICAS INSEGURAS ABIERTAS PREVIAS
DROP POLICY IF EXISTS "Permitir insercion/actualizacion" ON public.organizations;
DROP POLICY IF EXISTS "Permitir lectura para usuarios autenticados o anon" ON public.organizations;
DROP POLICY IF EXISTS "Permitir lectura organizations" ON public.organizations;
DROP POLICY IF EXISTS "Permitir mutacion organizations" ON public.organizations;

DROP POLICY IF EXISTS "Permitir mutacion user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Permitir lectura user_profiles" ON public.user_profiles;

DROP POLICY IF EXISTS "Permitir mutacion directories" ON public.directories;
DROP POLICY IF EXISTS "Permitir lectura directories" ON public.directories;

DROP POLICY IF EXISTS "Permitir mutacion attendees" ON public.attendees;
DROP POLICY IF EXISTS "Permitir lectura attendees" ON public.attendees;

DROP POLICY IF EXISTS "Escritura de actas" ON public.minutes;
DROP POLICY IF EXISTS "Lectura de actas" ON public.minutes;
DROP POLICY IF EXISTS "Permitir mutacion minutes" ON public.minutes;
DROP POLICY IF EXISTS "Permitir lectura minutes" ON public.minutes;

DROP POLICY IF EXISTS "Escritura de compromisos" ON public.action_items;
DROP POLICY IF EXISTS "Lectura de compromisos" ON public.action_items;
DROP POLICY IF EXISTS "Permitir mutacion action_items" ON public.action_items;
DROP POLICY IF EXISTS "Permitir lectura action_items" ON public.action_items;

-- 5. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS ESTRICTAS MULTI-TENANT

-- ORGANIZACIONES:
CREATE POLICY "org_select_own" ON public.organizations
  FOR SELECT TO authenticated
  USING (id = public.get_current_user_org_id());

CREATE POLICY "org_update_admin" ON public.organizations
  FOR UPDATE TO authenticated
  USING (id = public.get_current_user_org_id() AND public.is_org_admin())
  WITH CHECK (id = public.get_current_user_org_id() AND public.is_org_admin());

-- PERFILES:
CREATE POLICY "profiles_select_org" ON public.profiles
  FOR SELECT TO authenticated
  USING (organization_id = public.get_current_user_org_id());

CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- CARPETAS (DIRECTORIES):
CREATE POLICY "directories_select" ON public.directories
  FOR SELECT TO authenticated
  USING (organization_id = public.get_current_user_org_id());

CREATE POLICY "directories_insert" ON public.directories
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_current_user_org_id());

CREATE POLICY "directories_update" ON public.directories
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_current_user_org_id())
  WITH CHECK (organization_id = public.get_current_user_org_id());

CREATE POLICY "directories_delete" ON public.directories
  FOR DELETE TO authenticated
  USING (organization_id = public.get_current_user_org_id() AND public.is_org_admin());

-- ASISTENTES (ATTENDEES):
CREATE POLICY "attendees_select" ON public.attendees
  FOR SELECT TO authenticated
  USING (organization_id = public.get_current_user_org_id());

CREATE POLICY "attendees_insert" ON public.attendees
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_current_user_org_id());

CREATE POLICY "attendees_update" ON public.attendees
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_current_user_org_id())
  WITH CHECK (organization_id = public.get_current_user_org_id());

CREATE POLICY "attendees_delete" ON public.attendees
  FOR DELETE TO authenticated
  USING (organization_id = public.get_current_user_org_id());

-- ACTAS (MINUTES):
CREATE POLICY "minutes_select" ON public.minutes
  FOR SELECT TO authenticated
  USING (organization_id = public.get_current_user_org_id());

CREATE POLICY "minutes_insert" ON public.minutes
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_current_user_org_id());

CREATE POLICY "minutes_update" ON public.minutes
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_current_user_org_id())
  WITH CHECK (organization_id = public.get_current_user_org_id());

CREATE POLICY "minutes_delete" ON public.minutes
  FOR DELETE TO authenticated
  USING (organization_id = public.get_current_user_org_id());

-- COMPROMISOS (ACTION_ITEMS):
CREATE POLICY "action_items_select" ON public.action_items
  FOR SELECT TO authenticated
  USING (organization_id = public.get_current_user_org_id());

CREATE POLICY "action_items_insert" ON public.action_items
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_current_user_org_id());

CREATE POLICY "action_items_update" ON public.action_items
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_current_user_org_id())
  WITH CHECK (organization_id = public.get_current_user_org_id());

CREATE POLICY "action_items_delete" ON public.action_items
  FOR DELETE TO authenticated
  USING (organization_id = public.get_current_user_org_id());
