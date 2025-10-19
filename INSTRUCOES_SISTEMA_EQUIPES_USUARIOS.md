# 📋 Sistema de Gestão de Equipes e Usuários

## ✨ Novidades Implementadas

Foi implementado um **sistema completo de gestão de equipes e usuários** com controle de permissões baseado em roles (papéis).

### Principais Mudanças:

1. **Novas Tabelas no Banco de Dados:**
   - `teams`: Gerenciamento de equipes
   - `user_profiles`: Perfis de usuários com roles e vinculação a equipes

2. **Novas Abas na Interface:**
   - **Equipes**: Criar, editar e excluir equipes
   - **Usuários**: Gerenciar perfis de usuários, definir roles e vincular a equipes

3. **Sistema de Roles (Papéis):**
   - **👑 Administrador**: Acesso total, pode criar gerentes e usuários comuns
   - **👨‍💼 Gerente**: Pode criar apenas usuários comuns
   - **👤 Colaborador**: Acesso básico (apenas visualização do calendário)

4. **Role Carregado do Banco:**
   - O papel do usuário agora vem do banco de dados (não mais um select manual)
   - Cada usuário possui um **nick** (apelido) exibido no sistema

---

## 🚀 Passo a Passo de Configuração

### 1️⃣ Executar o Script SQL no Supabase

Acesse o **SQL Editor** do Supabase e execute o arquivo:

```
supabase-teams-users.sql
```

Este script irá:
- Criar a tabela `teams` (equipes)
- Criar a tabela `user_profiles` (perfis de usuários)
- Adicionar a coluna `team_id` na tabela `employees`
- Configurar todas as políticas de Row Level Security (RLS)
- Criar funções auxiliares para verificação de permissões

### 2️⃣ Criar Organização e Primeiro Administrador

Após executar os scripts SQL anteriores, você precisa:
1. Criar uma organização
2. Criar seu perfil de administrador

**Execute o arquivo `SETUP_INICIAL_COMPLETO.sql` seguindo os passos:**

#### **Passo 1: Descobrir seu User ID**

No SQL Editor do Supabase, execute:

```sql
SELECT id as user_id, email
FROM auth.users
WHERE email = 'SEU_EMAIL@exemplo.com';  -- Substitua pelo seu email de login
```

**Anote o `user_id` que aparecer!**

#### **Passo 2: Criar sua Organização**

```sql
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
  uuid_generate_v4(),
  'Minha Organização',          -- Substitua pelo nome da sua empresa/organização
  'Organização principal',
  'SEU_USER_ID_DO_PASSO_1',    -- Substitua pelo user_id que você anotou
  '{}'::jsonb,
  NOW(),
  NOW()
)
RETURNING id, name, owner_id;
```

**Anote o `id` (organization_id) que aparecer!**

#### **Passo 3: Criar seu Perfil de Administrador**

```sql
INSERT INTO public.user_profiles (
  organization_id,
  user_email,
  nick,
  role,
  team_id,
  created_by
)
VALUES (
  'SEU_ORGANIZATION_ID_DO_PASSO_2',  -- Substitua pelo organization_id que você anotou
  'SEU_EMAIL@exemplo.com',           -- Seu email de login
  'Seu Nome',                        -- Nome/apelido que aparecerá no sistema
  'admin',
  NULL,
  'SEU_USER_ID_DO_PASSO_1'          -- Seu user_id do Passo 1
)
RETURNING id, nick, role, user_email;
```

#### **Exemplo Prático Completo:**

```sql
-- 1. Descobrir user_id
SELECT id, email FROM auth.users WHERE email = 'david@exemplo.com';
-- Resultado: 123e4567-e89b-12d3-a456-426614174000

-- 2. Criar organização
INSERT INTO public.organizations (id, name, description, owner_id, settings, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Empresa XYZ',
  'Nossa empresa',
  '123e4567-e89b-12d3-a456-426614174000',
  '{}'::jsonb,
  NOW(),
  NOW()
)
RETURNING id, name, owner_id;
-- Resultado: 987fcdeb-51a2-43f7-8d9e-123456789abc

-- 3. Criar perfil admin
INSERT INTO public.user_profiles (organization_id, user_email, nick, role, team_id, created_by)
VALUES (
  '987fcdeb-51a2-43f7-8d9e-123456789abc',
  'david@exemplo.com',
  'David',
  'admin',
  NULL,
  '123e4567-e89b-12d3-a456-426614174000'
)
RETURNING id, nick, role;
```

### 3️⃣ Acessar o Sistema

1. Faça login no sistema com seu email
2. Você verá seu **nick** e **papel** no canto superior direito
3. Agora você tem acesso às novas abas **Equipes** e **Usuários**

---

## 📚 Como Usar o Sistema

### Criar uma Equipe

1. Acesse a aba **Equipes**
2. Clique em **Nova Equipe**
3. Preencha:
   - Nome da equipe (obrigatório)
   - Descrição (opcional)
4. Clique em **Salvar**

### Criar um Usuário

1. Acesse a aba **Usuários**
2. Clique em **Novo Usuário**
3. Preencha:
   - **Email do Usuário**: Email que a pessoa usa para fazer login no Supabase
   - **Nick (Apelido)**: Nome que será exibido no sistema
   - **Papel no Sistema**:
     - Admin: Pode criar gerentes e usuários comuns
     - Gerente: Pode criar apenas usuários comuns
     - Colaborador: Acesso básico ao sistema
   - **Equipe**: Selecione uma equipe (opcional)
4. Clique em **Salvar**

**⚠️ IMPORTANTE:**
- O email deve corresponder a uma conta **já existente** no Supabase Auth
- O sistema apenas **vincula** o email a um nick e role
- O usuário já deve ter criado sua conta anteriormente

### Hierarquia de Permissões

```
👑 Administrador
   ├── Pode criar Gerentes
   ├── Pode criar Colaboradores
   ├── Pode editar/excluir qualquer perfil
   └── Acesso total ao sistema

👨‍💼 Gerente
   ├── Pode criar apenas Colaboradores
   ├── Pode editar/excluir apenas Colaboradores
   └── Não pode criar outros Gerentes

👤 Colaborador
   ├── Acesso apenas à visualização do calendário
   └── Não pode gerenciar pessoas, templates ou configurações
```

---

## 🔒 Segurança (RLS - Row Level Security)

O sistema implementa políticas de segurança no banco de dados:

### Tabela `teams`:
- **SELECT**: Todos podem visualizar equipes da organização
- **INSERT/UPDATE/DELETE**: Apenas admins e gerentes

### Tabela `user_profiles`:
- **SELECT**: Todos podem visualizar perfis da organização
- **INSERT**:
  - Admins podem criar qualquer role
  - Gerentes só podem criar employees
- **UPDATE/DELETE**:
  - Admins podem modificar qualquer perfil
  - Gerentes só podem modificar employees

---

## 🛠️ Estrutura das Novas Tabelas

### `teams`
```sql
id              UUID (PK)
organization_id UUID (FK -> organizations)
name            TEXT (unique por organização)
description     TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### `user_profiles`
```sql
id              UUID (PK)
organization_id UUID (FK -> organizations)
user_email      TEXT (unique por organização)
nick            TEXT (unique por organização)
role            TEXT ('admin', 'manager', 'employee')
team_id         UUID (FK -> teams, nullable)
created_by      UUID (FK -> auth.users)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

---

## 🔄 Migração de Dados Existentes

### Funcionários (Employees)

A tabela `employees` agora possui:
- Campo antigo: `team` (TEXT) - ainda existe
- Campo novo: `team_id` (UUID FK) - referência à tabela `teams`

**Recomendação**:
- Crie as equipes na nova aba **Equipes**
- Futuramente, vincule os funcionários existentes às equipes do banco

---

## 🧪 Testando o Sistema

### Fluxo de Teste Completo:

1. **Como Admin:**
   - Crie uma equipe chamada "Tecnologia"
   - Crie um usuário Gerente vinculado à equipe "Tecnologia"
   - Faça logout

2. **Como Gerente:**
   - Faça login com o email do gerente criado
   - Verifique que você vê "👨‍💼 Gerente" no canto superior direito
   - Tente criar um usuário Colaborador (deve funcionar)
   - Tente criar um usuário Gerente (deve falhar - gerentes não podem criar outros gerentes)

3. **Como Colaborador:**
   - Faça login com o email do colaborador
   - Verifique que você vê "👤 Colaborador" no canto superior direito
   - Verifique que as abas Equipes e Usuários não estão acessíveis
   - Verifique que você só pode ver o Calendário

---

## 📝 Notas Importantes

1. **Primeiro Admin**: O primeiro administrador **deve ser criado manualmente** no banco via SQL
2. **Contas Existentes**: O sistema só vincula emails a perfis. As contas devem existir no Supabase Auth
3. **Um Usuário, Uma Equipe**: Cada usuário pode estar em apenas uma equipe
4. **Role Global**: A role é global (não por equipe). Um usuário é admin/gerente/colaborador em toda a organização
5. **Nick Único**: O nick deve ser único dentro da organização
6. **Email Único**: Um email só pode ter um perfil por organização

---

## ❓ Solução de Problemas

### "Você não tem permissão para acessar..."
- Verifique se seu perfil foi criado corretamente na tabela `user_profiles`
- Verifique se o email do perfil corresponde ao email usado no login

### "Já existe um usuário com este email ou nick"
- Cada email e nick deve ser único dentro da organização
- Tente usar um nick ou email diferente

### "Organization not found"
- Verifique se você criou uma organização em `public.organizations`
- Cada usuário deve ter uma organização vinculada

### Não consigo criar gerentes como gerente
- **Correto!** Gerentes só podem criar colaboradores
- Apenas administradores podem criar outros gerentes

---

## 🎯 Próximos Passos Recomendados

1. ✅ Executar o SQL no Supabase
2. ✅ Criar o primeiro administrador
3. ✅ Fazer login e testar o sistema
4. ✅ Criar equipes
5. ✅ Criar perfis de usuários
6. ✅ Testar hierarquia de permissões
7. 🔄 Migrar funcionários existentes para usar equipes do banco (futuro)

---

**Documentação criada em:** 2025-01-19
**Sistema:** Gestão de Escalas de Teletrabalho v2.0
