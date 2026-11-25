-- ============================================================================
-- PactaCloud: Onboarding Autoservicio de Nuevas Instituciones (Multi-Tenant)
-- Permite que un usuario nuevo (Google OAuth o Email sin invitación) cree su
-- propia institución desde cero sin ver datos de otros establecimientos.
-- ============================================================================

-- 1. Permitir organization_id NULL temporalmente mientras el usuario nuevo
--    completa el formulario de creación de su institución.
ALTER TABLE public.profiles ALTER COLUMN organization_id DROP NOT NULL;

-- 2. Actualizar prevent_profile_tampering para permitir asignar organization_id
--    únicamente la primera vez (cuando OLD.organization_id IS NULL), bloqueando
--    cualquier cambio de tenant posterior.
CREATE OR REPLACE FUNCTION public.prevent_profile_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    IF OLD.organization_id IS NOT NULL AND NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'Operación denegada: no puedes cambiar tu organización.';
    END IF;
    IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_org_admin() THEN
      RAISE EXCEPTION 'Operación denegada: no tienes permisos para modificar tu rol.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Actualizar handle_new_user():
--    - Si trae invite_code válido: lo une a esa organización con el rol invitado.
--    - Si NO trae invite_code (ej. nuevo usuario Google OAuth o registro directo):
--      crea su perfil con organization_id = NULL para que complete el onboarding.
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
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.profiles
    SET email = new.email,
        full_name = COALESCE(NULLIF(new.raw_user_meta_data->>'full_name', ''), full_name),
        avatar_url = COALESCE(new.raw_user_meta_data->>'avatar_url', avatar_url),
        updated_at = NOW()
    WHERE id = new.id;
    RETURN new;
  END IF;

  user_name := COALESCE(
    NULLIF(new.raw_user_meta_data->>'full_name', ''),
    NULLIF(new.raw_user_meta_data->>'name', ''),
    split_part(new.email, '@', 1)
  );

  invite_code := NULLIF(trim(COALESCE(new.raw_user_meta_data->>'invite_code', '')), '');

  IF invite_code IS NOT NULL THEN
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
  END IF;

  -- Usuario nuevo sin invitación: entra en modo onboarding (organization_id = NULL)
  INSERT INTO public.profiles (id, organization_id, email, full_name, role, avatar_url)
  VALUES (new.id, NULL, new.email, user_name, 'admin', new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = NOW();

  RETURN new;
END;
$$;

-- 4. RPC segura para que un usuario autenticado sin organización cree su propia institución
CREATE OR REPLACE FUNCTION public.create_my_organization(
  p_name TEXT,
  p_code TEXT,
  p_tax_id TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_slogan TEXT DEFAULT NULL,
  p_primary_color TEXT DEFAULT '#4f46e5'
)
RETURNS public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_existing_org TEXT;
  v_new_org_id TEXT;
  v_clean_name TEXT;
  v_clean_code TEXT;
  v_created_org public.organizations%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para crear una institución.';
  END IF;

  SELECT organization_id INTO v_existing_org
  FROM public.profiles
  WHERE id = v_uid
  FOR UPDATE;

  IF v_existing_org IS NOT NULL THEN
    RAISE EXCEPTION 'Tu cuenta ya pertenece a una institución.';
  END IF;

  v_clean_name := NULLIF(trim(COALESCE(p_name, '')), '');
  IF v_clean_name IS NULL THEN
    RAISE EXCEPTION 'El nombre de la institución es obligatorio.';
  END IF;

  v_clean_code := COALESCE(NULLIF(upper(trim(COALESCE(p_code, ''))), ''), upper(left(v_clean_name, 4)));
  v_new_org_id := 'org-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);

  INSERT INTO public.organizations (
    id, name, code, tax_id, address, slogan, primary_color, plan
  ) VALUES (
    v_new_org_id,
    v_clean_name,
    v_clean_code,
    NULLIF(trim(COALESCE(p_tax_id, '')), ''),
    NULLIF(trim(COALESCE(p_address, '')), ''),
    NULLIF(trim(COALESCE(p_slogan, '')), ''),
    COALESCE(NULLIF(trim(COALESCE(p_primary_color, '')), ''), '#4f46e5'),
    'ENTERPRISE'
  )
  RETURNING * INTO v_created_org;

  -- Vincular perfil como administrador de su nueva institución
  UPDATE public.profiles
  SET organization_id = v_new_org_id,
      role = 'admin',
      updated_at = NOW()
  WHERE id = v_uid;

  -- Crear carpeta inicial vacía "Actas Generales"
  INSERT INTO public.directories (id, organization_id, name, color)
  VALUES ('dir-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8), v_new_org_id, 'Actas Generales', '#4f46e5');

  RETURN v_created_org;
END;
$$;

REVOKE ALL ON FUNCTION public.create_my_organization(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_my_organization(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
