import { Employee, NewEmployee, Change } from '../../types';

// Adicionar funcionário
export const addEmployee = (
  newEmployee: NewEmployee,
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>,
  setExpandedPersonId: React.Dispatch<React.SetStateAction<number | null>>,
  setEditingPerson: React.Dispatch<React.SetStateAction<Employee | null>>,
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>,
  setActivePersonTab: React.Dispatch<React.SetStateAction<string>>
): Employee => {
  const newPerson: Employee = {
    id: Date.now(),
    ...newEmployee,
    preferences: {}
  };
  
  setEmployees(prev => [...prev, newPerson]);
  
  // Expandir automaticamente a nova pessoa em modo de edição
  setExpandedPersonId(newPerson.id);
  setEditingPerson(newPerson);
  setHasUnsavedChanges(false);
  setActivePersonTab('dados');
  
  return newPerson;
};

// Atualizar pessoa
export const updatePerson = (
  personId: number,
  updates: Partial<Employee>,
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>,
  editingPerson: Employee | null,
  setEditingPerson: React.Dispatch<React.SetStateAction<Employee | null>>,
  setChangeHistory: React.Dispatch<React.SetStateAction<Change[]>>
): void => {
  setEmployees(prev => prev.map(emp => 
    emp.id === personId ? { ...emp, ...updates } : emp
  ));
  
  // Atualizar também o estado de editingPerson se for a mesma pessoa
  if (editingPerson && editingPerson.id === personId) {
    setEditingPerson(prev => ({ ...prev!, ...updates }));
  }
  
  // Registrar no histórico
  const change: Change = {
    id: Date.now(),
    timestamp: new Date(),
    action: `Atualizou dados de ${updates.name || 'pessoa'}`
  };
  setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
};

// Importar funcionários em lote
export const importEmployees = (
  importText: string,
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>,
  setChangeHistory: React.Dispatch<React.SetStateAction<Change[]>>
): Employee[] => {
  if (!importText.trim()) return [];
  
  const names = importText.trim().split('\n').filter(name => name.trim() !== '');
  const newEmployees: Employee[] = names.map((name, index) => ({
    id: Date.now() + index,
    name: name.trim(),
    type: 'variable',
    isManager: false,
    team: '',
    preferences: {},
    officeDays: 3,
    workingHours: '9-17'
  }));
  
  setEmployees(prev => [...prev, ...newEmployees]);
  
  const change: Change = {
    id: Date.now(),
    timestamp: new Date(),
    action: `Importou ${newEmployees.length} pessoas em lote`
  };
  setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
  
  return newEmployees;
};