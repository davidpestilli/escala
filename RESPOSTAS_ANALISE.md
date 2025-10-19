# 📋 Análise do Código - Respostas às Perguntas

## 1️⃣ Criação de Equipes

**RESPOSTA:** ❌ **NÃO há funcionalidade dedicada para criar equipes.**

### Como funciona atualmente:

As equipes são criadas **automaticamente** ao adicionar funcionários:

- **Localização:** `src/components/modals/AddEmployeeModal.tsx` (linha 26-31)
- Ao adicionar uma pessoa, há um campo de texto livre chamado "Equipe"
- O usuário digita o nome da equipe manualmente
- Se a equipe não existir, ela é criada automaticamente
- As equipes são extraídas dinamicamente da lista de funcionários:

```typescript
// src/components/ScheduleApp.tsx linha 109
const teams = [...new Set(employees.map(emp => emp.team).filter(team => team && team.trim() !== ''))];
```

### Problema:
- Não há validação
- Não há lista pré-definida de equipes
- Erros de digitação criam equipes duplicadas (ex: "TI", "T.I.", "ti")
- Não há gerenciamento central de equipes

---

## 2️⃣ Exclusão de Equipes

**RESPOSTA:** ❌ **NÃO há funcionalidade para excluir equipes.**

### Por que não existe:

As equipes não são entidades independentes no banco de dados. Elas são apenas campos de texto (`team: string`) dentro do registro de cada funcionário.

### Como "excluir" uma equipe atualmente:

1. Seria necessário **excluir todos os funcionários** dessa equipe, OU
2. **Editar cada funcionário** individualmente mudando o campo "equipe"

### Evidência no código:

- Não há função `deleteTeam()` em nenhum arquivo
- Não há botão de exclusão de equipes
- A única menção a "remover equipes" está em um aviso de limpeza total:

```typescript
// src/components/ScheduleApp.tsx linha 294
'ATENÇÃO: Esta ação irá:\n\n• Apagar TODAS as pessoas\n• Limpar TODAS as escalas\n• Remover equipes e histórico\n\nTem certeza?'
```

Isso é parte da funcionalidade de **reset total** do sistema, não exclusão seletiva.

---

## 3️⃣ Exclusão de Usuários (Funcionários)

**RESPOSTA:** ✅ **SIM, existe funcionalidade para excluir usuários.**

### Localização no código:

**Interface:**
- `src/components/ScheduleApp.tsx` (linha 2134-2137)
- `src/components/tabs/PersonCard.tsx` (linha 87-93)

**Backend:**
- `src/hooks/useSupabaseData.ts` (linha 123-139)

### Como funciona:

1. Há um botão com ícone de lixeira (🗑️ `Trash2`)
2. Ao clicar, abre modal de confirmação:
   - **Título:** "❌ Excluir Pessoa"
   - **Mensagem:** "Tem certeza que deseja excluir [Nome]?"
3. Após confirmação, o funcionário é removido:

```typescript
setEmployees(prev => prev.filter(emp => emp.id !== person.id));
```

### Restrições:

- **Colaboradores** (`userRole === 'employee'`) **NÃO podem excluir** (botão desabilitado)
- Apenas **Administradores** e **Gestores** podem excluir

---

## 4️⃣ Select de Perfil (Administrador/Gestor/Colaborador)

### 4.1. Diferenças entre Administrador e Gestor

**RESPOSTA:** ❌ **NO CÓDIGO ATUAL, NÃO HÁ DIFERENÇA entre Administrador e Gestor.**

### Evidência:

Analisando todo o código, **as únicas verificações de `userRole` são:**

```typescript
// 1. Forçar colaborador a ficar no calendário
if (userRole === 'employee' && activeTab !== 'calendar') {
  setActiveTab('calendar');
}

// 2. Esconder aba de pessoas para colaboradores
if (userRole === 'employee') {
  return null;
}

// 3. Desabilitar botão de exclusão para colaboradores
disabled={userRole === 'employee'}
```

**Conclusão:** O sistema diferencia apenas:
- **Colaborador** (restrito) VS
- **Administrador/Gestor** (mesmas permissões)

### 4.2. Como se atribui funções

**RESPOSTA:** ⚠️ **Há CONFUSÃO no sistema - existem DOIS conceitos diferentes:**

#### **Conceito 1: "Gestor" como ROLE do usuário**
- É o select no canto superior direito
- Valores: `admin`, `manager`, `employee`
- **Localização:** `src/components/ScheduleApp.tsx` linha 1257-1264
- **Como funciona:** Seletor manual, qualquer um pode mudar
- **Problema:** Não há persistência, reseta ao recarregar

```typescript
const [userRole, setUserRole] = useState('admin'); // Sempre inicia como admin
```

#### **Conceito 2: "Gestor" como CHECKBOX ao cadastrar funcionário**
- É o checkbox `isManager` ao adicionar pessoa
- **Localização:** `src/components/modals/AddEmployeeModal.tsx` linha 52-58
- **Como funciona:** Checkbox marcado = pessoa é gestor
- **Propósito:** Usado para templates de rotação de gestores

```typescript
<input
  type="checkbox"
  checked={newEmployee.isManager}
  onChange={(e) => setNewEmployee(prev => ({ ...prev, isManager: e.target.checked }))}
/>
<span className="text-sm">Gestor</span>
```

### ⚠️ **ATENÇÃO - PROBLEMA GRAVE:**

Estes dois conceitos **NÃO estão conectados!**

- O **userRole** (select) é sobre quem **usa o sistema**
- O **isManager** (checkbox) é sobre qual **funcionário é gestor da equipe**

**Exemplo confuso:**
- Um **colaborador** (`userRole='employee'`) poderia estar marcado como **gestor** (`isManager=true`) de uma equipe
- Um **administrador** (`userRole='admin'`) poderia NÃO ser gestor de nenhuma equipe

### 4.3. Sempre que um usuário entrar vai ver aquele select?

**RESPOSTA:** ✅ **SIM, o select SEMPRE aparece.**

### Detalhes:

**Localização:** `src/components/ScheduleApp.tsx` linha 1254-1265

```typescript
{/* Seletor de Perfil */}
<div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 border border-gray-400">
  <div className="text-sm text-gray-800">👤</div>
  <select
    value={userRole}
    onChange={(e) => setUserRole(e.target.value)}
    className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 focus:outline-none cursor-pointer"
  >
    <option value="admin">👑 Administrador</option>
    <option value="manager">👨‍💼 Gestor</option>
    <option value="employee">👤 Colaborador</option>
  </select>
</div>
```

### Problemas com isso:

1. **Não há autenticação real** - qualquer um pode selecionar qualquer papel
2. **Sempre inicia como "Administrador"** - mesmo que o usuário seja colaborador
3. **Não persiste** - ao recarregar a página, volta para "Administrador"
4. **Não valida** - não verifica se o usuário logado realmente tem aquela permissão

### Como DEVERIA funcionar (recomendação):

1. O papel do usuário deveria vir do **Supabase** ao fazer login
2. Deveria ser **somente leitura** (não editável pelo usuário)
3. Deveria estar vinculado ao **email/conta** do usuário
4. Precisaria de uma tabela `user_roles` no banco de dados

---

## 📊 Resumo das Descobertas

| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| **Criar equipes** | ❌ Não existe | Equipes são criadas automaticamente ao digitar nome |
| **Excluir equipes** | ❌ Não existe | Não há gerenciamento de equipes como entidade |
| **Excluir funcionários** | ✅ Existe | Funciona, mas bloqueado para colaboradores |
| **Diferença Admin/Gestor** | ❌ Não existe | Ambos têm mesmas permissões no código |
| **Atribuição de funções** | ⚠️ Confuso | Dois conceitos diferentes não conectados |
| **Select sempre visível** | ✅ Sim | Sempre aparece, qualquer um pode mudar |

---

## 🚨 Problemas Identificados

### 1. **Gestão de Equipes Inexistente**
- Equipes não são gerenciadas
- Risco de inconsistências por erros de digitação
- Impossível renomear ou excluir equipes

### 2. **Sistema de Papéis Falho**
- Não há autenticação real de papéis
- Qualquer usuário pode se promover a Admin
- Não persiste entre sessões
- Dois conceitos confusos de "gestor"

### 3. **Segurança Comprometida**
- O `userRole` é apenas cosmético
- Não há validação no backend
- Colaborador pode virar Admin mudando o select

---

## 💡 Recomendações

### Curto Prazo (Correções Mínimas):

1. **Remover o select de papel** da interface
2. **Fixar como Admin** para todos (já que não há diferença)
3. **Documentar** que isManager é para rotação, não para acesso

### Médio Prazo (Melhorias):

1. **Criar gerenciamento de equipes:**
   - Lista de equipes no banco
   - CRUD de equipes
   - Dropdown ao invés de texto livre

2. **Implementar autenticação de papéis:**
   - Vincular papel ao usuário no Supabase
   - Tabela `user_roles`
   - Validação no backend (RLS)

3. **Separar conceitos:**
   - `userRole` = Papel no sistema (Admin/Gestor/Colaborador)
   - `isManager` = Função na equipe (Gestor de equipe)

---

**Análise realizada em:** 2025-01-18
**Arquivos analisados:** 26 arquivos TypeScript/TSX
