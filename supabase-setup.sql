-- =====================================================
-- SCRIPT DE CONFIGURAÇÃO DO SUPABASE
-- Sistema de Gestão de Escalas de Teletrabalho
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Habilitar extensão UUID (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA: organizations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para organizations
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_created ON public.organizations(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. TABELA: employees
-- =====================================================
CREATE TABLE IF NOT EXISTS public.employees (
  id INTEGER PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  employee_type TEXT NOT NULL CHECK (employee_type IN ('always_office', 'always_home', 'variable')),
  is_manager BOOLEAN DEFAULT FALSE,
  team TEXT,
  office_days INTEGER DEFAULT 0,
  working_hours TEXT NOT NULL DEFAULT '9-17' CHECK (working_hours IN ('9-17', '10-18', '11-19')),
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para employees
CREATE INDEX IF NOT EXISTS idx_employees_org ON public.employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_team ON public.employees(organization_id, team);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON public.employees(organization_id, is_manager) WHERE is_manager = TRUE;
CREATE INDEX IF NOT EXISTS idx_employees_type ON public.employees(organization_id, employee_type);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. TABELA: schedules
-- =====================================================
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('office', 'home', 'vacation', 'holiday')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, employee_id, date)
);

-- Índices para schedules
CREATE INDEX IF NOT EXISTS idx_schedules_org ON public.schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_schedules_employee ON public.schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_schedules_employee_date ON public.schedules(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON public.schedules(organization_id, status);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_schedules_updated_at ON public.schedules;
CREATE TRIGGER update_schedules_updated_at
    BEFORE UPDATE ON public.schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. TABELA: vacations
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vacations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Índices para vacations
CREATE INDEX IF NOT EXISTS idx_vacations_org ON public.vacations(organization_id);
CREATE INDEX IF NOT EXISTS idx_vacations_employee ON public.vacations(employee_id);
CREATE INDEX IF NOT EXISTS idx_vacations_dates ON public.vacations(organization_id, start_date, end_date);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_vacations_updated_at ON public.vacations;
CREATE TRIGGER update_vacations_updated_at
    BEFORE UPDATE ON public.vacations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. TABELA: holidays
-- =====================================================
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  staff_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, date)
);

-- Índices para holidays
CREATE INDEX IF NOT EXISTS idx_holidays_org ON public.holidays(organization_id);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON public.holidays(organization_id, date);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_holidays_updated_at ON public.holidays;
CREATE TRIGGER update_holidays_updated_at
    BEFORE UPDATE ON public.holidays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. TABELA: weekend_shifts (para turnos de fim de semana)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.weekend_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  staff_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, date)
);

-- Índices para weekend_shifts
CREATE INDEX IF NOT EXISTS idx_weekend_shifts_org ON public.weekend_shifts(organization_id);
CREATE INDEX IF NOT EXISTS idx_weekend_shifts_date ON public.weekend_shifts(organization_id, date);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_weekend_shifts_updated_at ON public.weekend_shifts;
CREATE TRIGGER update_weekend_shifts_updated_at
    BEFORE UPDATE ON public.weekend_shifts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. TABELA: system_settings (configurações do sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, key)
);

-- Índices para system_settings
CREATE INDEX IF NOT EXISTS idx_system_settings_org ON public.system_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(organization_id, key);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekend_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS: organizations
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can update their own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can delete their own organizations" ON public.organizations;

CREATE POLICY "Users can view their own organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own organizations"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own organizations"
  ON public.organizations FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =====================================================
-- POLÍTICAS RLS: employees
-- =====================================================

DROP POLICY IF EXISTS "Users can view employees from their organizations" ON public.employees;
DROP POLICY IF EXISTS "Users can insert employees in their organizations" ON public.employees;
DROP POLICY IF EXISTS "Users can update employees in their organizations" ON public.employees;
DROP POLICY IF EXISTS "Users can delete employees from their organizations" ON public.employees;

CREATE POLICY "Users can view employees from their organizations"
  ON public.employees FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert employees in their organizations"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update employees in their organizations"
  ON public.employees FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete employees from their organizations"
  ON public.employees FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS: schedules
-- =====================================================

DROP POLICY IF EXISTS "Users can view schedules from their organizations" ON public.schedules;
DROP POLICY IF EXISTS "Users can insert schedules in their organizations" ON public.schedules;
DROP POLICY IF EXISTS "Users can update schedules in their organizations" ON public.schedules;
DROP POLICY IF EXISTS "Users can delete schedules from their organizations" ON public.schedules;

CREATE POLICY "Users can view schedules from their organizations"
  ON public.schedules FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert schedules in their organizations"
  ON public.schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update schedules in their organizations"
  ON public.schedules FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete schedules from their organizations"
  ON public.schedules FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS: vacations
-- =====================================================

DROP POLICY IF EXISTS "Users can view vacations from their organizations" ON public.vacations;
DROP POLICY IF EXISTS "Users can insert vacations in their organizations" ON public.vacations;
DROP POLICY IF EXISTS "Users can update vacations in their organizations" ON public.vacations;
DROP POLICY IF EXISTS "Users can delete vacations from their organizations" ON public.vacations;

CREATE POLICY "Users can view vacations from their organizations"
  ON public.vacations FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vacations in their organizations"
  ON public.vacations FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vacations in their organizations"
  ON public.vacations FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vacations from their organizations"
  ON public.vacations FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS: holidays
-- =====================================================

DROP POLICY IF EXISTS "Users can view holidays from their organizations" ON public.holidays;
DROP POLICY IF EXISTS "Users can insert holidays in their organizations" ON public.holidays;
DROP POLICY IF EXISTS "Users can update holidays in their organizations" ON public.holidays;
DROP POLICY IF EXISTS "Users can delete holidays from their organizations" ON public.holidays;

CREATE POLICY "Users can view holidays from their organizations"
  ON public.holidays FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert holidays in their organizations"
  ON public.holidays FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update holidays in their organizations"
  ON public.holidays FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete holidays from their organizations"
  ON public.holidays FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS: weekend_shifts
-- =====================================================

DROP POLICY IF EXISTS "Users can view weekend_shifts from their organizations" ON public.weekend_shifts;
DROP POLICY IF EXISTS "Users can insert weekend_shifts in their organizations" ON public.weekend_shifts;
DROP POLICY IF EXISTS "Users can update weekend_shifts in their organizations" ON public.weekend_shifts;
DROP POLICY IF EXISTS "Users can delete weekend_shifts from their organizations" ON public.weekend_shifts;

CREATE POLICY "Users can view weekend_shifts from their organizations"
  ON public.weekend_shifts FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert weekend_shifts in their organizations"
  ON public.weekend_shifts FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update weekend_shifts in their organizations"
  ON public.weekend_shifts FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete weekend_shifts from their organizations"
  ON public.weekend_shifts FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS RLS: system_settings
-- =====================================================

DROP POLICY IF EXISTS "Users can view settings from their organizations" ON public.system_settings;
DROP POLICY IF EXISTS "Users can insert settings in their organizations" ON public.system_settings;
DROP POLICY IF EXISTS "Users can update settings in their organizations" ON public.system_settings;
DROP POLICY IF EXISTS "Users can delete settings from their organizations" ON public.system_settings;

CREATE POLICY "Users can view settings from their organizations"
  ON public.system_settings FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert settings in their organizations"
  ON public.system_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update settings in their organizations"
  ON public.system_settings FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete settings from their organizations"
  ON public.system_settings FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- GRANT PERMISSIONS (Permissões permissivas)
-- =====================================================

GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.schedules TO authenticated;
GRANT ALL ON public.vacations TO authenticated;
GRANT ALL ON public.holidays TO authenticated;
GRANT ALL ON public.weekend_shifts TO authenticated;
GRANT ALL ON public.system_settings TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
