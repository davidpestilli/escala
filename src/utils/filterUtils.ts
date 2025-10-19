// src/utils/filterUtils.ts
import { Employee, Filters, PersonFilters } from '../types';

export const getFilteredEmployees = (
  employees: Employee[], 
  filters: Filters,
  getCurrentStatus: (employeeId: number) => string | null
): Employee[] => {
  return employees.filter(emp => {
    if (filters.employee && !emp.name.toLowerCase().includes(filters.employee.toLowerCase())) {
      return false;
    }
    if (filters.team) {
      if (filters.team === 'SEM_EQUIPE') {
        return !emp.team || emp.team.trim() === '';
      } else {
        return emp.team === filters.team;
      }
    }
    if (filters.currentStatus) {
      const currentStatus = getCurrentStatus(emp.id);
      return currentStatus === filters.currentStatus;
    }
    return true;
  });
};

export const getFilteredEmployeesForDay = (
  employees: Employee[], 
  filters: Filters,
  day: Date,
  getEmployeeStatus: (employeeId: number, date: Date) => string | null
): Employee[] => {
  return employees.filter(emp => {
    // Primeiro aplica os filtros básicos (nome, equipe)
    if (filters.employee && !emp.name.toLowerCase().includes(filters.employee.toLowerCase())) {
      return false;
    }
    if (filters.team) {
      if (filters.team === 'SEM_EQUIPE') {
        if (emp.team && emp.team.trim() !== '') return false;
      } else {
        if (emp.team !== filters.team) return false;
      }
    }
    
    // Se não há filtro de status atual, mostra todos (que passaram nos filtros básicos)
    if (!filters.currentStatus) {
      return true;
    }
    
    // Se há filtro de status atual, verifica o status da pessoa NESTE DIA específico
    const statusNesteDia = getEmployeeStatus(emp.id, day);
    return statusNesteDia === filters.currentStatus;
  });
};

export const getFilteredPeople = (employees: Employee[], personFilters: PersonFilters): Employee[] => {
  return employees.filter(person => {
    if (personFilters.name && !person.name.toLowerCase().includes(personFilters.name.toLowerCase())) {
      return false;
    }
    if (personFilters.type) {
      if (personFilters.type === 'manager' && !person.isManager) return false;
      if (personFilters.type === 'employee' && person.isManager) return false;
    }
    return true;
  });
};

export const getSortedEmployees = (employeesList: Employee[]): Employee[] => {
  return [...employeesList].sort((a, b) => {
    // Gestores sempre primeiro
    if (a.isManager && !b.isManager) return -1;
    if (!a.isManager && b.isManager) return 1;
    // Depois ordena por nome
    return a.name.localeCompare(b.name);
  });
};

export const getDisplayName = (fullName: string): string => {
  const names = fullName.trim().split(' ');
  return names.length >= 2 ? `${names[0]} ${names[1]}` : names[0] || '';
};