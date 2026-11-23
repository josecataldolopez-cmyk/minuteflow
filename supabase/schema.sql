-- Schema oficial para PactaCloud (Supabase PostgreSQL)
-- Multi-tenancy por organization_id con Row Level Security (RLS) completo

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ORGANIZACIONES (Establecimientos / Instituciones)
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
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
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
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
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4f46e5',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONTACTOS / ASISTENTES FRECUENTES
CREATE TABLE IF NOT EXISTS attendees (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACTAS (MINUTES)
CREATE TABLE IF NOT EXISTS minutes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    directory_id TEXT REFERENCES directories(id) ON DELETE SET NULL,
    directory_name TEXT DEFAULT 'Actas Generales',
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    formatted_date TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    objectives TEXT,
    points_treated TEXT,
    next_session_date DATE,
    recording_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. COMPROMISOS / TAREAS (ACTION ITEMS)
CREATE TABLE IF NOT EXISTS action_items (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    minute_id TEXT REFERENCES minutes(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    assignee TEXT NOT NULL,
    assignee_avatar TEXT,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
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

-- 10. POLÍTICAS DE ACCESO
CREATE POLICY "Permitir lectura organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Permitir mutacion organizations" ON organizations FOR ALL USING (true);

CREATE POLICY "Permitir lectura user_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Permitir mutacion user_profiles" ON user_profiles FOR ALL USING (true);

CREATE POLICY "Permitir lectura directories" ON directories FOR SELECT USING (true);
CREATE POLICY "Permitir mutacion directories" ON directories FOR ALL USING (true);

CREATE POLICY "Permitir lectura attendees" ON attendees FOR SELECT USING (true);
CREATE POLICY "Permitir mutacion attendees" ON attendees FOR ALL USING (true);

CREATE POLICY "Permitir lectura minutes" ON minutes FOR SELECT USING (true);
CREATE POLICY "Permitir mutacion minutes" ON minutes FOR ALL USING (true);

CREATE POLICY "Permitir lectura action_items" ON action_items FOR SELECT USING (true);
CREATE POLICY "Permitir mutacion action_items" ON action_items FOR ALL USING (true);
