import { Employee } from '../types';

// Obter nome para exibição (primeiro e segundo nome)
export const getDisplayName = (fullName: string): string => {
  const names = fullName.trim().split(' ');
  return names.length >= 2 ? `${names[0]} ${names[1]}` : names[0] || '';
};

// Ordenar funcionários (gestores primeiro, depois por nome)
export const getSortedEmployees = (employeesList: Employee[]): Employee[] => {
  return [...employeesList].sort((a, b) => {
    // Gestores sempre primeiro
    if (a.isManager && !b.isManager) return -1;
    if (!a.isManager && b.isManager) return 1;
    // Depois ordena por nome
    return a.name.localeCompare(b.name);
  });
};