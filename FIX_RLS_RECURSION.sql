-- =====================================================
-- FIX: Correção de Recursão Infinita nas Políticas RLS
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- REMOVER POLÍTICAS ANTIGAS COM RECURSÃO
-- =====================================================

DROP POLICY IF EXISTS "Admins and managers can create user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and managers can update user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and managers can delete user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins and managers can create teams" ON public.teams;
DROP POLICY IF EXISTS "Admins and managers can update teams" ON public.teams;
DROP POLICY IF EXISTS "Admins and managers can delete teams" ON public.teams;

-- =====================================================
-- CRIAR FUNÇÃO AUXILIAR PARA OBTER ROLE DO USUÁRIO
-- =====================================================
-- Esta função usa SECURITY DEFINER para evitar recursão

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
-- NOVA POLÍTICA: INSERT em user_profiles
-- =====================================================

CREATE POLICY "Users can create profiles based on their role"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
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

-- =====================================================
-- NOVA POLÍTICA: UPDATE em user_profiles
-- =====================================================

CREATE POLICY "Users can update profiles based on their role"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
    AND (
      -- Owner da organização pode atualizar qualquer perfil
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
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- NOVA POLÍTICA: DELETE em user_profiles
-- =====================================================

CREATE POLICY "Users can delete profiles based on their role"
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
    AND (
      -- Owner da organização pode deletar qualquer perfil
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
-- NOVA POLÍTICA: INSERT em teams
-- =====================================================

CREATE POLICY "Users can create teams based on their role"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
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

-- =====================================================
-- NOVA POLÍTICA: UPDATE em teams
-- =====================================================

CREATE POLICY "Users can update teams based on their role"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
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
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- NOVA POLÍTICA: DELETE em teams
-- =====================================================

CREATE POLICY "Users can delete teams based on their role"
  ON public.teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = organization_id
      AND owner_id = auth.uid()
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
-- VERIFICAÇÃO: Testar a função
-- =====================================================

-- Teste: Ver qual é seu role
SELECT public.get_user_role('SEU_ORGANIZATION_ID_AQUI');

-- Teste: Ver todos os perfis (deve funcionar sem recursão)
SELECT * FROM public.user_profiles;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- IMPORTANTE: Após executar este script, tente novamente criar o gerente
