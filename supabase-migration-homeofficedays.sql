-- =====================================================
-- MIGRAÇÃO: Adicionar coluna home_office_days
-- Sistema de Gestão de Escalas de Teletrabalho
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Adicionar coluna home_office_days na tabela employees
-- Esta coluna armazena os dias de home office definidos manualmente
-- Formato: array de datas em texto ['2025-01-06', '2025-01-08', ...]

ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS home_office_days TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Criar índice para melhorar performance em queries que filtram por home_office_days
CREATE INDEX IF NOT EXISTS idx_employees_home_office_days
ON public.employees USING GIN (home_office_days);

-- Comentário explicativo na coluna
COMMENT ON COLUMN public.employees.home_office_days IS
'Array de datas (formato YYYY-MM-DD) em que o funcionário está em home office (escala manual)';

-- =====================================================
-- VERIFICAÇÃO (opcional - para conferir se funcionou)
-- =====================================================
-- Você pode executar esta query para verificar se a coluna foi criada:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'employees' AND column_name = 'home_office_days';
