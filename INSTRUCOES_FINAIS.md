# 📋 Instruções Finais - Sistema de Gestão de Escalas

## ✅ O que foi feito

1. **✅ Scripts SQL criados** - Arquivo `supabase-setup.sql` pronto para executar no Supabase
2. **✅ Integração Supabase Auth** - Mock removido, usando cliente real
3. **✅ Variáveis de ambiente** - Arquivo `.env` verificado e configurado
4. **✅ Repositório Git** - Inicializado e conectado ao GitHub
5. **✅ GitHub Actions** - Workflow de deploy automático configurado
6. **✅ Vite Config** - Base path configurado para `/escala/`
7. **✅ Primeiro commit** - Código enviado para: https://github.com/davidpestilli/escala.git

---

## 🚀 Próximos Passos (VOCÊ PRECISA FAZER)

### 1️⃣ Executar o Script SQL no Supabase

1. Acesse: https://rdkvvigjmowtvhxqlrnp.supabase.co
2. Vá em **SQL Editor** (menu lateral)
3. Clique em **New Query**
4. Abra o arquivo `supabase-setup.sql`
5. Copie TODO o conteúdo
6. Cole no editor do Supabase
7. Clique em **Run** ou pressione `Ctrl + Enter`
8. Aguarde a execução (deve dizer "Success")

✅ Isso criará 7 tabelas:
- `organizations`
- `employees`
- `schedules`
- `vacations`
- `holidays`
- `weekend_shifts`
- `system_settings`

---

### 2️⃣ Configurar Autenticação no Supabase

1. No painel do Supabase, vá em **Authentication** > **Providers**
2. Certifique-se que **Email** está habilitado
3. Em **Authentication** > **Email Templates**, configure os templates de email
4. Em **Authentication** > **URL Configuration**:
   - **Site URL**: `https://davidpestilli.github.io/escala/`
   - **Redirect URLs**: Adicione:
     - `https://davidpestilli.github.io/escala/`
     - `http://localhost:5173/` (para desenvolvimento local)

---

### 3️⃣ Configurar Secrets no GitHub

1. Acesse: https://github.com/davidpestilli/escala/settings/secrets/actions
2. Clique em **New repository secret**
3. Adicione os seguintes secrets:

**Secret 1:**
- Name: `VITE_SUPABASE_URL`
- Value: `https://rdkvvigjmowtvhxqlrnp.supabase.co`

**Secret 2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJka3Z2aWdqbW93dHZoeHFscm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNjkwODQsImV4cCI6MjA1Nzc0NTA4NH0.pFn1faGoWsapclNIjVhnD8A754DMiY7dZL9Ig0lDMQ4`

---

### 4️⃣ Habilitar GitHub Pages

1. Acesse: https://github.com/davidpestilli/escala/settings/pages
2. Em **Source**, selecione: **GitHub Actions**
3. Salve

---

### 5️⃣ Disparar o Deploy

**Opção A - Automático:**
- O deploy já deve ter sido disparado pelo push inicial
- Vá em: https://github.com/davidpestilli/escala/actions
- Verifique se o workflow "Deploy to GitHub Pages" está rodando

**Opção B - Manual (se necessário):**
1. Acesse: https://github.com/davidpestilli/escala/actions
2. Clique em "Deploy to GitHub Pages" (workflow)
3. Clique em **Run workflow** > **Run workflow**

---

### 6️⃣ Testar a Aplicação

Após o deploy concluir (leva 2-3 minutos):

1. Acesse: **https://davidpestilli.github.io/escala/**
2. Clique em "Cadastrar-se"
3. Use um email real e crie uma senha
4. Verifique seu email para confirmar o cadastro
5. Faça login
6. Comece a usar o sistema!

---

## 🧪 Testar Localmente (Desenvolvimento)

```bash
# Instalar dependências (se não instalou ainda)
npm install

# Rodar em modo desenvolvimento
npm run dev

# Abrir no navegador
# http://localhost:5173
```

---

## 📊 Estrutura das Tabelas Criadas

### `organizations`
- Armazena informações da organização de cada usuário
- Cada usuário tem sua própria organização

### `employees`
- Funcionários da organização
- Tipos: `always_office`, `always_home`, `variable`
- Horários: `9-17`, `10-18`, `11-19`

### `schedules`
- Escalas diárias de cada funcionário
- Status: `office`, `home`, `vacation`, `holiday`

### `vacations`
- Períodos de férias dos funcionários

### `holidays`
- Feriados e funcionários de piquete

### `weekend_shifts`
- Turnos de fim de semana

### `system_settings`
- Configurações do sistema

---

## 🔒 Segurança

✅ **Row Level Security (RLS)** está habilitado em todas as tabelas

- Cada usuário só vê seus próprios dados
- Isolamento completo entre organizações
- Políticas permissivas para CRUD completo dos próprios dados

---

## 🐛 Resolução de Problemas

### Problema: Deploy falhou no GitHub Actions

**Solução:**
1. Verifique se os secrets foram configurados corretamente
2. Vá em Actions > clique no workflow que falhou
3. Leia os logs para identificar o erro

### Problema: Não consigo fazer login

**Solução:**
1. Verifique se executou o script SQL no Supabase
2. Confirme que o email foi verificado (check seu email)
3. Verifique se as variáveis de ambiente estão corretas

### Problema: Página em branco após deploy

**Solução:**
1. Abra o Console do navegador (F12)
2. Verifique se há erros relacionados ao Supabase
3. Confirme que o base path no `vite.config.ts` está correto: `/escala/`

---

## 📚 Documentação Útil

- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **GitHub Pages**: https://docs.github.com/en/pages
- **GitHub Actions**: https://docs.github.com/en/actions
- **Vite**: https://vitejs.dev/

---

## ✅ Checklist Final

Antes de considerar tudo pronto, verifique:

- [ ] Script SQL executado no Supabase
- [ ] Tabelas criadas corretamente (7 tabelas)
- [ ] Email authentication habilitado no Supabase
- [ ] URLs de redirect configuradas
- [ ] Secrets adicionados no GitHub
- [ ] GitHub Pages habilitado
- [ ] Deploy concluído com sucesso
- [ ] Aplicação acessível em https://davidpestilli.github.io/escala/
- [ ] Cadastro e login funcionando
- [ ] Dados sendo salvos no Supabase

---

## 🎉 Pronto!

Após completar todos os passos acima, seu sistema estará:
- ✅ Publicado no GitHub Pages
- ✅ Conectado ao Supabase
- ✅ Com autenticação funcionando
- ✅ Com deploy automático configurado

Qualquer push para a branch `main` vai disparar um novo deploy automaticamente!

---

**Desenvolvido com [Claude Code](https://claude.com/claude-code)**
