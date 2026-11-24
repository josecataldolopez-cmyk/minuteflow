-- Refuerzo de seguridad multi-tenant: aplicar después de
-- 20261124_unify_schema_and_enforce_rls.sql.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'reader')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.organization_invites TO authenticated;

-- Sólo administradores del tenant pueden consultar sus invitaciones. La
-- generación de códigos debe hacerse en una función administrativa server-side.
DROP POLICY IF EXISTS "invites_select_admin" ON public.organization_invites;
CREATE POLICY "invites_select_admin" ON public.organization_invites
  FOR SELECT TO authenticated
  USING (organization_id = public.get_current_user_org_id() AND public.is_org_admin());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  invite public.organization_invites%ROWTYPE;
  invite_code TEXT;
  user_name TEXT;
BEGIN
  -- El trigger existente también se ejecuta al actualizar auth.users. En ese
  -- caso sólo se reflejan campos no autorizadores; no se consume otra
  -- invitación ni se permite cambiar tenant/rol.
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.profiles
    SET email = new.email,
        full_name = COALESCE(NULLIF(new.raw_user_meta_data->>'full_name', ''), full_name),
        avatar_url = COALESCE(new.raw_user_meta_data->>'avatar_url', avatar_url),
        updated_at = NOW()
    WHERE id = new.id;
    RETURN new;
  END IF;

  -- No se aceptan organization_id ni role desde el navegador: son atributos de
  -- autorización. Sólo una invitación de un solo uso puede asignarlos.
  invite_code := NULLIF(new.raw_user_meta_data->>'invite_code', '');
  IF invite_code IS NULL THEN
    RAISE EXCEPTION 'Se requiere un código de invitación válido para crear una cuenta institucional';
  END IF;

  SELECT * INTO invite
  FROM public.organization_invites
  WHERE token_hash = encode(digest(invite_code, 'sha256'), 'hex')
    AND accepted_at IS NULL
    AND expires_at > NOW()
    AND (email IS NULL OR lower(email) = lower(new.email))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El código de invitación no es válido, expiró o ya fue utilizado';
  END IF;

  user_name := COALESCE(
    NULLIF(new.raw_user_meta_data->>'full_name', ''),
    split_part(new.email, '@', 1)
  );

  INSERT INTO public.profiles (id, organization_id, email, full_name, role, avatar_url)
  VALUES (new.id, invite.organization_id, new.email, user_name, invite.role,
          new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();

  UPDATE public.organization_invites SET accepted_at = NOW() WHERE id = invite.id;
  RETURN new;
END;
$$;

-- Una política RLS no restringe columnas. Se revocan explícitamente los campos
-- de autorización y se permite al usuario actualizar sólo su presentación.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND organization_id = public.get_current_user_org_id()
    AND role = public.get_current_user_role()
  );

-- Evita que el cliente consulte o altere invitaciones ajenas mediante grants
-- heredados del esquema público.
REVOKE INSERT, UPDATE, DELETE ON public.organization_invites FROM authenticated, anon;

-- Emite un código de alta de un solo uso. El código sin hash se devuelve una
-- única vez al administrador y nunca se almacena en la base de datos.
CREATE OR REPLACE FUNCTION public.create_organization_invite(
  invitee_email TEXT DEFAULT NULL,
  invitee_role TEXT DEFAULT 'editor',
  expires_in_days INTEGER DEFAULT 7
)
RETURNS TABLE (id UUID, invitation_code TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  raw_code TEXT;
  created_id UUID;
  created_expiry TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_org_admin() THEN
    RAISE EXCEPTION 'No tienes permisos para crear invitaciones';
  END IF;
  IF invitee_role NOT IN ('admin', 'editor', 'reader') THEN
    RAISE EXCEPTION 'Rol de invitación inválido';
  END IF;
  IF expires_in_days < 1 OR expires_in_days > 30 THEN
    RAISE EXCEPTION 'La vigencia debe ser entre 1 y 30 días';
  END IF;

  raw_code := encode(gen_random_bytes(24), 'hex');
  created_expiry := NOW() + make_interval(days => expires_in_days);
  INSERT INTO public.organization_invites (organization_id, email, role, token_hash, expires_at)
  VALUES (
    public.get_current_user_org_id(),
    NULLIF(lower(trim(invitee_email)), ''),
    invitee_role,
    encode(digest(raw_code, 'sha256'), 'hex'),
    created_expiry
  )
  RETURNING organization_invites.id INTO created_id;

  RETURN QUERY SELECT created_id, raw_code, created_expiry;
END;
$$;

REVOKE ALL ON FUNCTION public.create_organization_invite(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_organization_invite(TEXT, TEXT, INTEGER) TO authenticated;
