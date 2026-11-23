-- Schema inicial para PactaCloud (Supabase PostgreSQL)
-- Multi-tenancy por organization_id con Row Level Security (RLS) preparado

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ORGANIZACIONES
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    tax_id TEXT,
    domain TEXT,
    drive_account TEXT,
    drive_webhook_url TEXT,
    logo_url TEXT,
    plan TEXT DEFAULT 'ENTERPRISE',
    primary_color TEXT DEFAULT '#4f46e5',
    secondary_color TEXT,
    slogan TEXT,
    header_text TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PERFILES DE USUARIO
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'Secretario de Directorio',
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DIRECTORIOS / COMITÉS
CREATE TABLE IF NOT EXISTS directories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4f46e5',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONTACTOS / ASISTENTES FRECUENTES
CREATE TABLE IF NOT EXISTS attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACTAS (MINUTES)
CREATE TABLE IF NOT EXISTS minutes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    directory_id UUID REFERENCES directories(id) ON DELETE SET NULL,
    directory_name TEXT DEFAULT 'Actas Generales',
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    formatted_date TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
    objectives TEXT,
    points_treated TEXT,
    next_session_date DATE,
    recording_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. COMPROMISOS / TAREAS (ACTION ITEMS)
CREATE TABLE IF NOT EXISTS action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    minute_id UUID REFERENCES minutes(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    assignee TEXT NOT NULL,
    assignee_avatar TEXT,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED')),
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_minutes_org ON minutes(organization_id);
CREATE INDEX IF NOT EXISTS idx_action_items_org ON action_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendees_org ON attendees(organization_id);
CREATE INDEX IF NOT EXISTS idx_directories_org ON directories(organization_id);

-- 9. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE directories ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- 10. POLÍTICAS DE ACCESO BÁSICAS (Permisivas para claves anónimas en desarrollo / multi-tenant estricto en producción)
CREATE POLICY "Permitir lectura para usuarios autenticados o anon" ON organizations FOR SELECT USING (true);
CREATE POLICY "Permitir insercion/actualizacion" ON organizations FOR ALL USING (true);

CREATE POLICY "Lectura de actas" ON minutes FOR SELECT USING (true);
CREATE POLICY "Escritura de actas" ON minutes FOR ALL USING (true);

CREATE POLICY "Lectura de compromisos" ON action_items FOR SELECT USING (true);
CREATE POLICY "Escritura de compromisos" ON action_items FOR ALL USING (true);
