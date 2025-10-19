-- =====================================================
-- ADICIONAR CAMPO user_email À TABELA employees
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Permite vincular employees aos user_profiles por email
-- =====================================================

-- Adicionar campo user_email à tabela employees
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'employees'
    AND column_name = 'user_email'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN user_email TEXT;

    -- Criar índice para melhor performance nas buscas
    CREATE INDEX IF NOT EXISTS idx_employees_user_email ON public.employees(user_email);

    RAISE NOTICE 'Campo user_email adicionado com sucesso!';
  ELSE
    RAISE NOTICE 'Campo user_email já existe.';
  END IF;
END $$;

-- =====================================================
-- ATUALIZAR CONSTRAINT PARA TORNAR name OPCIONAL
-- (Agora o nick vem de user_profiles)
-- =====================================================

-- Tornar name opcional (pode ser NULL se tivermos user_email)
ALTER TABLE public.employees ALTER COLUMN name DROP NOT NULL;

-- =====================================================
-- COMENTÁRIOS NA COLUNA (Documentação)
-- =====================================================

COMMENT ON COLUMN public.employees.user_email IS 'Email do usuário vinculado em user_profiles. Usado para buscar nick, equipe e role.';
COMMENT ON COLUMN public.employees.name IS 'Nome do funcionário (pode ser NULL se user_email estiver preenchido - neste caso, nick vem de user_profiles)';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se o campo foi adicionado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'employees'
AND column_name IN ('user_email', 'name')
ORDER BY column_name;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
