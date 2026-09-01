-- ========================================================================
-- MINUTEFLOW: ESQUEMA DE BASE DE DATOS POSTGRESQL / SUPABASE
-- Plataforma de Gestión de Actas, Compromisos y Directorio Corporativo
-- ========================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES DE USUARIO
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'Ejecutivo',
    department TEXT DEFAULT 'Dirección General',
    avatar_url TEXT,
    plan TEXT DEFAULT 'Enterprise',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE CARPETAS / DIRECTORIOS
CREATE TABLE IF NOT EXISTS public.directories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'folder',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE ASISTENTES Y DIRECTORIO DE CONTACTOS
CREATE TABLE IF NOT EXISTS public.attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    email TEXT,
    avatar_url TEXT,
    is_custom BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE ACTAS DE REUNIÓN (MINUTES)
CREATE TABLE IF NOT EXISTS public.minutes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    directory_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TEXT NOT NULL DEFAULT '10:00',
    formatted_date TEXT,
    status TEXT NOT NULL DEFAULT 'Borrador', -- 'Borrador', 'Aprobada', 'Pendiente de firma', 'Finalizada'
    objectives TEXT,
    points_treated TEXT,
    next_session_date DATE,
    recording_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA INTERMEDIA: ASISTENTES POR ACTA
CREATE TABLE IF NOT EXISTS public.minute_attendees (
    minute_id UUID REFERENCES public.minutes(id) ON DELETE CASCADE,
    attendee_id UUID REFERENCES public.attendees(id) ON DELETE CASCADE,
    attended BOOLEAN DEFAULT TRUE,
    signature_url TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (minute_id, attendee_id)
);

-- 7. TABLA DE TAREAS Y COMPROMISOS (ACTION ITEMS)
CREATE TABLE IF NOT EXISTS public.action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    minute_id UUID REFERENCES public.minutes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    due_label TEXT,
    priority TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High'
    assigned_to_id UUID REFERENCES public.attendees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. POLÍTICAS DE SEGURIDAD POR FILA (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minute_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- Políticas para que cada usuario solo acceda a sus propios datos
CREATE POLICY "Users can view and manage their own profile" 
    ON public.profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own directories" 
    ON public.directories FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own attendees" 
    ON public.attendees FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own minutes" 
    ON public.minutes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own action items" 
    ON public.action_items FOR ALL USING (auth.uid() = user_id);

-- Índices de optimización para búsquedas y filtros rápidos
CREATE INDEX IF NOT EXISTS idx_minutes_user_date ON public.minutes(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_action_items_due_date ON public.action_items(due_date, completed);
CREATE INDEX IF NOT EXISTS idx_attendees_user ON public.attendees(user_id);
