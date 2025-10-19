# 🚀 Início Rápido - Setup Completo

## Ordem de Execução dos Scripts SQL

Execute os scripts **NESTA ORDEM** no SQL Editor do Supabase:

### 1️⃣ **supabase-setup.sql** (Já existe)
Cria todas as tabelas base do sistema (organizations, employees, schedules, etc.)

### 2️⃣ **supabase-teams-users.sql** (Novo - ATUALIZADO)
Cria as tabelas de equipes e perfis de usuários + RLS
⚠️ **IMPORTANTE:** Este arquivo já contém a correção para recursão infinita

### 3️⃣ **SETUP_INICIAL_COMPLETO.sql** (Novo)
Cria sua organização e seu perfil de administrador

### 🔧 **FIX_RLS_RECURSION.sql** (Opcional)
**Use apenas se você executou a versão antiga** do `supabase-teams-users.sql` e está com erro de recursão infinita.
Se você está configurando agora, **pule este arquivo** (a correção já está no arquivo principal).

---

## 📝 Checklist de Setup

- [ ] 1. Executar `supabase-setup.sql`
- [ ] 2. Executar `supabase-teams-users.sql`
- [ ] 3. Descobrir meu `user_id`:
  ```sql
  SELECT id, email FROM auth.users WHERE email = 'MEU_EMAIL@exemplo.com';
  ```
- [ ] 4. Criar organização (anotar o `organization_id` retornado):
  ```sql
  INSERT INTO public.organizations (id, name, description, owner_id, settings, created_at, updated_at)
  VALUES (
    uuid_generate_v4(),
    'Nome da Minha Empresa',
    'Descrição',
    'MEU_USER_ID',
    '{}'::jsonb,
    NOW(),
    NOW()
  )
  RETURNING id, name;
  ```
- [ ] 5. Criar meu perfil admin:
  ```sql
  INSERT INTO public.user_profiles (organization_id, user_email, nick, role, team_id, created_by)
  VALUES (
    'MEU_ORGANIZATION_ID',
    'MEU_EMAIL@exemplo.com',
    'Meu Nome',
    'admin',
    NULL,
    'MEU_USER_ID'
  )
  RETURNING id, nick, role;
  ```
- [ ] 6. Fazer login no sistema
- [ ] 7. Verificar se vejo meu nome e "👑 Admin" no canto superior direito
- [ ] 8. Acessar aba **Equipes** e criar primeira equipe
- [ ] 9. Acessar aba **Usuários** e criar primeiro usuário

---

## ⚡ Script Completo (Copie e Cole - Substitua os Valores)

```sql
-- PASSO 1: Descobrir seu user_id (EXECUTE PRIMEIRO)
SELECT id as user_id, email
FROM auth.users
WHERE email = 'SEU_EMAIL@exemplo.com';

-- ANOTE O user_id!

-- PASSO 2: Criar organização (SUBSTITUA SEU_USER_ID)
INSERT INTO public.organizations (id, name, description, owner_id, settings, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'Minha Empresa',
  'Organização principal',
  'SEU_USER_ID_AQUI',
  '{}'::jsonb,
  NOW(),
  NOW()
)
RETURNING id as organization_id, name;

-- ANOTE O organization_id!

-- PASSO 3: Criar perfil admin (SUBSTITUA ORGANIZATION_ID E USER_ID)
INSERT INTO public.user_profiles (organization_id, user_email, nick, role, team_id, created_by)
VALUES (
  'SEU_ORGANIZATION_ID_AQUI',
  'SEU_EMAIL@exemplo.com',
  'Seu Nome',
  'admin',
  NULL,
  'SEU_USER_ID_AQUI'
)
RETURNING id, nick, role, user_email;

-- PRONTO! Agora faça login no sistema.
```

---

## 🔍 Verificação Rápida

Execute para verificar se está tudo OK:

```sql
-- Minha organização
SELECT * FROM public.organizations WHERE owner_id = 'MEU_USER_ID';

-- Meu perfil
SELECT * FROM public.user_profiles WHERE user_email = 'MEU_EMAIL@exemplo.com';
```

---

## ❓ Perguntas Frequentes

**P: Preciso criar uma conta no Supabase Auth antes?**
R: Sim! Você precisa ter feito login pelo menos uma vez no sistema para que seu email exista em `auth.users`.

**P: Posso ter mais de uma organização?**
R: Tecnicamente sim, mas o sistema atual foi projetado para uma organização por usuário.

**P: Como adiciono outros usuários?**
R: Após criar sua conta admin, use a aba "Usuários" no sistema para adicionar outros usuários.

**P: O que é o "nick"?**
R: É o apelido/nome que aparecerá no sistema. Pode ser diferente do seu email.

---

## 🆘 Problemas Comuns

### "auth.users não tem registros"
→ Você precisa fazer login no sistema pelo menos uma vez

### "violates foreign key constraint"
→ Certifique-se de que o `user_id` existe em `auth.users`

### "duplicate key value violates unique constraint"
→ Já existe uma organização ou perfil com esses dados. Verifique as tabelas.

---

**Pronto!** Após seguir estes passos, você terá o sistema completamente configurado e pronto para uso. 🎉
