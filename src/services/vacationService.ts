import { Employee, Vacations, Change } from '../types';

// Definir período de férias para uma pessoa
export const setPersonVacation = (
  personId: number,
  start: string,
  end: string,
  employees: Employee[],
  setVacations: React.Dispatch<React.SetStateAction<Vacations>>,
  setChangeHistory: React.Dispatch<React.SetStateAction<Change[]>>
): void => {
  const person = employees.find(emp => emp.id === personId);
  
  setVacations(prev => ({
    ...prev,
    [personId]: { start, end }
  }));
  
  // Registrar no histórico
  const change: Change = {
    id: Date.now(),
    timestamp: new Date(),
    action: `Definiu férias para ${person?.name} de ${new Date(start).toLocaleDateString()} a ${new Date(end).toLocaleDateString()}`
  };
  setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
};

// Obter status de uma pessoa (incluindo se está de férias)
export const getPersonStatus = (
  personId: number,
  employees: Employee[],
  vacations: Vacations
): string => {
  const person = employees.find(emp => emp.id === personId);
  if (!person) return 'unknown';
  
  if (vacations[personId]) {
    const vacation = vacations[personId];
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Comparar strings de datas para garantir que inclua o último dia
    if (todayStr >= vacation.start && todayStr <= vacation.end) {
      return 'vacation';
    }
  }
  
  // Para esta função, vamos retornar o tipo da pessoa se não estiver de férias
  return person.type;
};