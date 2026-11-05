-- ========================================================================
-- MINUTEFLOW: ESQUEMA DE BASE DE DATOS MULTI-TENANT (POSTGRESQL / SUPABASE)
-- Plataforma de Gestión de Actas, Compromisos y Directorio Corporativo
-- Aislamiento estricto por Establecimiento / Organización con RLS
-- ========================================================================

-- 1. EXTENSIONES DE SEGURIDAD
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA DE ESTABLECIMIENTOS / ORGANIZACIONES (TENANTS)
-- Cada empresa, colegio o institución tiene su propia fila aislada.
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL, -- ej. 'REDQ', 'CSANIGNACIO'
    tax_id TEXT, -- RUT, NIT o CUIT corporativo
    domain TEXT, -- ej. 'redq.cl', 'colegio.cl'
    plan TEXT DEFAULT 'Enterprise',
    logo_url TEXT,
    -- Configuración privada de Google Drive de este establecimiento:
    drive_account TEXT DEFAULT 'admin@empresa.com',
    drive_webhook_url TEXT, -- URL de Google Apps Script exclusivo del establecimiento
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE PERFILES DE USUARIO (CON ASOCIACIÓN DE ESTABLECIMIENTO Y ROL)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('superadmin', 'admin', 'editor', 'reader')),
    department TEXT DEFAULT 'Dirección General',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE CARPETAS / DIRECTORIOS POR ESTABLECIMIENTO
CREATE TABLE IF NOT EXISTS public.directories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'folder',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

-- 5. TABLA DE ASISTENTES Y DIRECTORIO INSTITUCIONAL
CREATE TABLE IF NOT EXISTS public.attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    role TEXT,
    email TEXT,
    avatar_url TEXT,
    is_custom BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA DE ACTAS DE REUNIÓN (MINUTES)
CREATE TABLE IF NOT EXISTS public.minutes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    directory_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TEXT NOT NULL DEFAULT '10:00',
    formatted_date TEXT,
    status TEXT NOT NULL DEFAULT 'Borrador' CHECK (status IN ('Borrador', 'Aprobada', 'Pendiente de firma', 'Finalizada', 'Draft', 'Approved', 'Pending Sig', 'Finished')),
    objectives TEXT,
    points_treated TEXT,
    next_session_date DATE,
    recording_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA INTERMEDIA: ASISTENTES POR ACTA
CREATE TABLE IF NOT EXISTS public.minute_attendees (
    minute_id UUID REFERENCES public.minutes(id) ON DELETE CASCADE,
    attendee_id UUID REFERENCES public.attendees(id) ON DELETE CASCADE,
    attended BOOLEAN DEFAULT TRUE,
    signature_url TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (minute_id, attendee_id)
);

-- 8. TABLA DE TAREAS Y COMPROMISOS (ACTION ITEMS)
CREATE TABLE IF NOT EXISTS public.action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    minute_id UUID REFERENCES public.minutes(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    due_label TEXT,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    assigned_to_id UUID REFERENCES public.attendees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================================
-- FUNCIONES AUXILIARES DE SEGURIDAD (SECURITY DEFINER)
-- ========================================================================

-- Obtener la organización del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_current_user_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Obtener el rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Verificar si el usuario es Admin o SuperAdmin
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

-- ========================================================================
-- ACTIVACIÓN Y POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- Ningún usuario puede ver, crear, modificar ni borrar datos de otra organización.
-- ========================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minute_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- 1. Políticas de Organizaciones
-- Los usuarios normales solo leen los datos de su propia organización.
CREATE POLICY "Users can view their own organization"
    ON public.organizations FOR SELECT
    USING (id = public.get_current_user_org_id());

-- Solo los Administradores de la organización pueden actualizar su URL de Drive y datos
CREATE POLICY "Admins can update their organization settings"
    ON public.organizations FOR UPDATE
    USING (id = public.get_current_user_org_id() AND public.is_org_admin())
    WITH CHECK (id = public.get_current_user_org_id() AND public.is_org_admin());

-- 2. Políticas de Perfiles
CREATE POLICY "Users can view profiles within their organization"
    ON public.profiles FOR SELECT
    USING (organization_id = public.get_current_user_org_id());

CREATE POLICY "Users can update their own personal profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid() AND organization_id = public.get_current_user_org_id());

CREATE POLICY "Admins can manage profiles of their organization"
    ON public.profiles FOR ALL
    USING (organization_id = public.get_current_user_org_id() AND public.is_org_admin());

-- 3. Políticas de Carpetas (Directories)
CREATE POLICY "Users can view directories of their organization"
    ON public.directories FOR SELECT
    USING (organization_id = public.get_current_user_org_id());

CREATE POLICY "Admins and Editors can manage directories of their organization"
    ON public.directories FOR ALL
    USING (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
    )
    WITH CHECK (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
    );

-- 4. Políticas de Directorio de Miembros (Attendees)
CREATE POLICY "Users can view attendees of their organization"
    ON public.attendees FOR SELECT
    USING (organization_id = public.get_current_user_org_id());

CREATE POLICY "Admins and Editors can manage attendees"
    ON public.attendees FOR ALL
    USING (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
    )
    WITH CHECK (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
    );

-- 5. Políticas de Actas de Reunión (Minutes)
-- Lectura: Todos los miembros activos de la organización pueden leer las actas de su organización.
CREATE POLICY "Users can view minutes of their organization"
    ON public.minutes FOR SELECT
    USING (organization_id = public.get_current_user_org_id());

-- Escritura / Modificación: Solo Admins y Editores. (Lectores quedan bloqueados).
CREATE POLICY "Admins and Editors can insert and update minutes"
    ON public.minutes FOR ALL
    USING (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
    )
    WITH CHECK (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
    );

-- 6. Políticas de Asistentes por Acta
CREATE POLICY "Users can view minute attendees"
    ON public.minute_attendees FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.minutes m 
        WHERE m.id = minute_attendees.minute_id 
        AND m.organization_id = public.get_current_user_org_id()
    ));

CREATE POLICY "Admins and Editors can manage minute attendees"
    ON public.minute_attendees FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.minutes m 
        WHERE m.id = minute_attendees.minute_id 
        AND m.organization_id = public.get_current_user_org_id()
        AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
    ));

-- 7. Políticas de Compromisos (Action Items)
CREATE POLICY "Users can view action items of their organization"
    ON public.action_items FOR SELECT
    USING (organization_id = public.get_current_user_org_id());

CREATE POLICY "Admins and Editors can create and edit action items"
    ON public.action_items FOR ALL
    USING (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
    )
    WITH CHECK (
        organization_id = public.get_current_user_org_id() 
        AND public.get_current_user_role() IN ('superadmin', 'admin', 'editor')
    );

-- Los usuarios con rol Lector pueden marcar sus tareas asignadas como completadas
CREATE POLICY "Readers can toggle their own action items"
    ON public.action_items FOR UPDATE
    USING (
        organization_id = public.get_current_user_org_id()
        AND (
            assigned_to_id IN (
                SELECT id FROM public.attendees WHERE email = (SELECT email FROM public.profiles WHERE id = auth.uid())
            )
        )
    )
    WITH CHECK (
        organization_id = public.get_current_user_org_id()
    );

-- ========================================================================
-- TRIGGERS DE SEGURIDAD (PREVENCIÓN DE MANIPULACIÓN DE ORGANIZACIÓN)
-- Impide que cualquier actualización intente alterar el organization_id
-- ========================================================================

CREATE OR REPLACE FUNCTION public.prevent_org_tampering()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.organization_id <> OLD.organization_id THEN
        RAISE EXCEPTION 'Violación de seguridad: No está permitido transferir registros entre organizaciones.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_minutes_org
    BEFORE UPDATE ON public.minutes
    FOR EACH ROW EXECUTE FUNCTION public.prevent_org_tampering();

CREATE TRIGGER trg_protect_action_items_org
    BEFORE UPDATE ON public.action_items
    FOR EACH ROW EXECUTE FUNCTION public.prevent_org_tampering();

CREATE TRIGGER trg_protect_directories_org
    BEFORE UPDATE ON public.directories
    FOR EACH ROW EXECUTE FUNCTION public.prevent_org_tampering();

CREATE TRIGGER trg_protect_attendees_org
    BEFORE UPDATE ON public.attendees
    FOR EACH ROW EXECUTE FUNCTION public.prevent_org_tampering();

-- Índices de alto rendimiento por organización
CREATE INDEX IF NOT EXISTS idx_minutes_org_date ON public.minutes(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_action_items_org_due ON public.action_items(organization_id, due_date, completed);
CREATE INDEX IF NOT EXISTS idx_directories_org ON public.directories(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendees_org ON public.attendees(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
