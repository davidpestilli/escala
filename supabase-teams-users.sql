-- =====================================================
-- SCRIPT DE ADIÇÃO: GESTÃO DE EQUIPES E USUÁRIOS
-- Sistema de Gestão de Escalas de Teletrabalho
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- APÓS executar o supabase-setup.sql
-- =====================================================

-- =====================================================
-- 1. TABELA: teams (Equipes)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Índices para teams
CREATE INDEX IF NOT EXISTS idx_teams_org ON public.teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_name ON public.teams(organization_id, name);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. TABELA: user_profiles (Perfis de Usuários)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  nick TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_email),
  UNIQUE(organization_id, nick)
);

-- Índices para user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_org ON public.user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(organization_id, user_email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_team ON public.user_profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_creator ON public.user_profiles(created_by);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. ADICIONAR team_id à tabela employees (migração)
-- =====================================================
-- Adiciona coluna team_id para substituir o campo TEXT 'team'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'employees'
    AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_employees_team_id ON public.employees(team_id);
  END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS: teams
-- =====================================================

DROP POLICY IF EXISTS "Users can view teams from their organizations" ON public.teams;
DROP POLICY IF EXISTS "Admins and managers can create teams" ON public.teams;
DROP POLICY IF EXISTS "Admins and managers can update teams" ON public.teams;
DROP POLICY IF EXISTS "Admins and managers can delete teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams based on their role" ON public.teams;
DROP POLICY IF EXISTS "Users can update teams based on their role" ON public.teams;
DROP POLICY IF EXISTS "Users can delete teams based on their role" ON public.teams;

-- SELECT: Todos os usuários autenticados podem ver equipes da organização
CREATE POLICY "Users can view teams from their organizations"
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- INSERT: Admins e managers podem criar equipes (usa função para evitar recursão)
CREATE POLICY "Users can create teams based on their role"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
    AND (
      -- Owner pode criar
      EXISTS (
        SELECT 1 FROM public.organizations
        WHERE id = organization_id
        AND owner_id = auth.uid()
      )
      OR
      -- Admin ou Manager podem criar
      public.get_user_role(organization_id) IN ('admin', 'manager')
    )
  );

-- UPDATE: Admins e managers podem atualizar equipes (usa função para evitar recursão)
CREATE POLICY "Users can update teams based on their role"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.organizations
        WHERE id = organization_id
        AND owner_id = auth.uid()
      )
      OR
      public.get_user_role(organization_id) IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- DELETE: Admins e managers podem excluir equipes (usa função para evitar recursão)
CREATE POLICY "Users can delete teams based on their role"
  ON public.teams FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.organizations
        WHERE id = organization_id
        AND owner_id = auth.uid()
      )
      OR
      public.get_user_role(organization_id) IN ('admin', 'manager')
    )
  );

-- =====================================================
-- FUNÇÃO AUXILIAR: Obter role do usuário (evita recursão)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_role(org_id UUID)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE user_email = auth.email()
  AND organization_id = org_id
  LIMIT 1;

  RETURN COALESCE(user_role, 'employee');
END;
$$;

-- =====================================================
-- POLÍTICAS RLS: user_profiles
-- =====================================================

DROP POLICY IF EXISTS "Users can view profiles from their organizations" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and managers can create user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and managers can update user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and managers can delete user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create profiles based on their role" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update profiles based on their role" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete profiles based on their role" ON public.user_profiles;

-- SELECT: Todos os usuários autenticados podem ver perfis da organização
CREATE POLICY "Users can view profiles from their organizations"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- INSERT: Com verificação de role usando função (evita recursão)
CREATE POLICY "Users can create profiles based on their role"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
    AND (
      -- Owner da organização pode criar qualquer role
      EXISTS (
        SELECT 1 FROM public.organizations
        WHERE id = organization_id
        AND owner_id = auth.uid()
      )
      OR
      -- Admin pode criar qualquer role
      public.get_user_role(organization_id) = 'admin'
      OR
      -- Manager só pode criar employee
      (
        public.get_user_role(organization_id) = 'manager'
        AND role = 'employee'
      )
    )
  );

-- UPDATE: Com verificação de role usando função (evita recursão)
CREATE POLICY "Users can update profiles based on their role"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
    AND (
      -- Owner pode atualizar qualquer perfil
      EXISTS (
        SELECT 1 FROM public.organizations
        WHERE id = organization_id
        AND owner_id = auth.uid()
      )
      OR
      -- Admin pode atualizar qualquer perfil
      public.get_user_role(organization_id) = 'admin'
      OR
      -- Manager só pode atualizar employee
      (
        public.get_user_role(organization_id) = 'manager'
        AND role = 'employee'
      )
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

-- DELETE: Com verificação de role usando função (evita recursão)
CREATE POLICY "Users can delete profiles based on their role"
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
    AND (
      -- Owner pode deletar qualquer perfil
      EXISTS (
        SELECT 1 FROM public.organizations
        WHERE id = organization_id
        AND owner_id = auth.uid()
      )
      OR
      -- Admin pode deletar qualquer perfil
      public.get_user_role(organization_id) = 'admin'
      OR
      -- Manager só pode deletar employee
      (
        public.get_user_role(organization_id) = 'manager'
        AND role = 'employee'
      )
    )
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON public.teams TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;

-- =====================================================
-- FUNÇÃO HELPER: Obter perfil do usuário logado
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_current_user_profile(org_id UUID)
RETURNS TABLE (
  id UUID,
  nick TEXT,
  role TEXT,
  team_id UUID
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.nick,
    up.role,
    up.team_id
  FROM public.user_profiles up
  WHERE up.user_email = auth.email()
  AND up.organization_id = org_id
  LIMIT 1;
END;
$$;

-- =====================================================
-- FUNÇÃO HELPER: Verificar se usuário pode criar role
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_create_role(org_id UUID, target_role TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Obter role do usuário atual
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE user_email = auth.email()
  AND organization_id = org_id;

  -- Se não encontrou perfil, retorna false
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Admin pode criar qualquer role
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Manager só pode criar employee
  IF user_role = 'manager' AND target_role = 'employee' THEN
    RETURN TRUE;
  END IF;

  -- Caso contrário, não pode
  RETURN FALSE;
END;
$$;

-- =====================================================
-- COMENTÁRIOS NAS TABELAS (Documentação)
-- =====================================================

COMMENT ON TABLE public.teams IS 'Equipes dentro de uma organização';
COMMENT ON TABLE public.user_profiles IS 'Perfis de usuários com nick, role e equipe';

COMMENT ON COLUMN public.user_profiles.user_email IS 'Email do usuário no Supabase Auth (não cria conta, apenas vincula)';
COMMENT ON COLUMN public.user_profiles.nick IS 'Apelido exibido no sistema';
COMMENT ON COLUMN public.user_profiles.role IS 'Papel: admin (total), manager (cria employees), employee (uso básico)';
COMMENT ON COLUMN public.user_profiles.created_by IS 'Quem criou este perfil (admin ou manager)';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
