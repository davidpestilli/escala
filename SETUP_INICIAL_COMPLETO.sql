-- =====================================================
-- SETUP INICIAL COMPLETO
-- Sistema de Gestão de Escalas de Teletrabalho
-- =====================================================
-- Execute este script APÓS ter executado:
-- 1. supabase-setup.sql
-- 2. supabase-teams-users.sql
-- =====================================================

-- =====================================================
-- PASSO 1: Descobrir seu User ID
-- =====================================================
-- Execute esta query primeiro para descobrir seu user_id:

SELECT
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';  -- SUBSTITUA pelo seu email de login

-- ANOTE O user_id que aparecer!

-- =====================================================
-- PASSO 2: Criar a Organização
-- =====================================================
-- Substitua 'SEU_USER_ID_AQUI' pelo ID que você anotou acima

INSERT INTO public.organizations (
  id,
  name,
  description,
  owner_id,
  settings,
  created_at,
  updated_at
)
VALUES (
  uuid_generate_v4(),                    -- Gera um ID único automaticamente
  'Minha Organização',                    -- SUBSTITUA pelo nome da sua organização
  'Organização principal do sistema',     -- Descrição (opcional)
  'SEU_USER_ID_AQUI',                    -- SUBSTITUA pelo user_id do Passo 1
  '{}'::jsonb,                           -- Configurações vazias (padrão)
  NOW(),
  NOW()
)
RETURNING id, name, owner_id;            -- Mostra o ID da organização criada

-- ANOTE O id (organization_id) que aparecer!

-- =====================================================
-- PASSO 3: Criar seu Perfil de Administrador
-- =====================================================
-- Substitua os valores conforme indicado:

INSERT INTO public.user_profiles (
  organization_id,
  user_email,
  nick,
  role,
  team_id,
  created_by
)
VALUES (
  'SEU_ORGANIZATION_ID_AQUI',     -- SUBSTITUA pelo organization_id do Passo 2
  'SEU_EMAIL_AQUI@exemplo.com',   -- SUBSTITUA pelo seu email (mesmo do Passo 1)
  'Seu Nome ou Apelido',          -- SUBSTITUA pelo nome que quer ver no sistema
  'admin',                        -- Papel: admin (não mude isso)
  NULL,                           -- Sem equipe por enquanto (pode alterar depois)
  'SEU_USER_ID_AQUI'             -- SUBSTITUA pelo user_id do Passo 1
)
RETURNING id, nick, role, user_email;  -- Mostra o perfil criado

-- =====================================================
-- PASSO 4 (OPCIONAL): Criar uma Equipe Inicial
-- =====================================================

INSERT INTO public.teams (
  organization_id,
  name,
  description
)
VALUES (
  'SEU_ORGANIZATION_ID_AQUI',     -- SUBSTITUA pelo organization_id do Passo 2
  'Equipe Principal',              -- Nome da equipe
  'Equipe principal da organização' -- Descrição
)
RETURNING id, name;                -- Mostra o ID da equipe criada

-- =====================================================
-- VERIFICAÇÃO: Conferir se tudo foi criado
-- =====================================================

-- Verificar organização criada:
SELECT id, name, owner_id
FROM public.organizations
WHERE owner_id = 'SEU_USER_ID_AQUI';

-- Verificar perfil criado:
SELECT id, nick, role, user_email, team_id
FROM public.user_profiles
WHERE user_email = 'SEU_EMAIL_AQUI@exemplo.com';

-- Verificar equipes criadas:
SELECT id, name, description
FROM public.teams
WHERE organization_id = 'SEU_ORGANIZATION_ID_AQUI';

-- =====================================================
-- EXEMPLO COMPLETO COM VALORES FICTÍCIOS
-- =====================================================
-- Aqui está um exemplo completo para você copiar e substituir os valores:

/*
-- PASSO 1: Descobrir user_id
SELECT id as user_id, email FROM auth.users WHERE email = 'david@exemplo.com';
-- Resultado: user_id = '123e4567-e89b-12d3-a456-426614174000'

-- PASSO 2: Criar organização
INSERT INTO public.organizations (id, name, description, owner_id, settings, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Empresa XYZ',
  'Nossa organização principal',
  '123e4567-e89b-12d3-a456-426614174000',
  '{}'::jsonb,
  NOW(),
  NOW()
)
RETURNING id, name, owner_id;
-- Resultado: organization_id = '987fcdeb-51a2-43f7-8d9e-123456789abc'

-- PASSO 3: Criar perfil admin
INSERT INTO public.user_profiles (organization_id, user_email, nick, role, team_id, created_by)
VALUES (
  '987fcdeb-51a2-43f7-8d9e-123456789abc',
  'david@exemplo.com',
  'David',
  'admin',
  NULL,
  '123e4567-e89b-12d3-a456-426614174000'
)
RETURNING id, nick, role, user_email;

-- PASSO 4: Criar equipe (opcional)
INSERT INTO public.teams (organization_id, name, description)
VALUES (
  '987fcdeb-51a2-43f7-8d9e-123456789abc',
  'Tecnologia',
  'Equipe de TI'
)
RETURNING id, name;
*/

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
