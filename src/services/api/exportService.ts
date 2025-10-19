// src/services/api/exportService.ts
import { Employee } from '../../types';
import { STATUS_LABELS } from '../../constants';
import { getDaysInMonth } from '../../utils/dateUtils';

export const exportToExcel = (
  currentDate: Date,
  filteredEmployees: Employee[],
  getEmployeeStatus: (employeeId: number, date: Date) => string | null
): void => {
  const days = getDaysInMonth(currentDate).filter(day => day !== null) as Date[];
  let csvContent = 'Nome,Equipe,';
  
  days.forEach(day => {
    csvContent += `${day.getDate()}/${day.getMonth() + 1},`;
  });
  csvContent += '\n';
  
  filteredEmployees.forEach(emp => {
    csvContent += `${emp.name},${emp.team || 'Sem equipe'},`;
    days.forEach(day => {
      const status = getEmployeeStatus(emp.id, day);
      const statusText = status ? STATUS_LABELS[status as keyof typeof STATUS_LABELS] : '';
      csvContent += `${statusText},`;
    });
    csvContent += '\n';
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `escala_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};