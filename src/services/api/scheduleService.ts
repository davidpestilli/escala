// src/services/api/scheduleService.ts
import { Employee } from '../../types';
import { dateToString } from '../../utils/dateUtils';
import { STATUS_LABELS } from '../../constants';

export interface ScheduleData {
  [employeeId: string]: {
    [dateStr: string]: string;
  };
}

export interface VacationData {
  [employeeId: string]: {
    start: string;
    end: string;
  };
}

export interface HolidayData {
  [dateStr: string]: boolean;
}

export interface StaffData {
  [dateStr: string]: number[];
}

export const getEmployeeStatus = (
  employeeId: number,
  date: Date,
  employees: Employee[],
  schedules: ScheduleData,
  vacations: VacationData,
  holidays: HolidayData,
  holidayStaff: StaffData,
  weekendShifts: HolidayData,
  weekendStaff: StaffData
): string | null => {
  const dateStr = dateToString(date);
  
  // Verificar se é feriado primeiro
  if (holidays[dateStr]) {
    // Se tem plantão neste feriado, verificar se a pessoa está escalada
    if (holidayStaff[dateStr] && holidayStaff[dateStr].includes(employeeId)) {
      return 'holiday'; // Pessoa está em plantão de feriado
    }
    return 'holiday';
  }
  
  // Verificar se é plantão de fim de semana
  const dayOfWeek = date.getDay();
  if ((dayOfWeek === 0 || dayOfWeek === 6) && weekendShifts[dateStr]) {
    // Se tem plantão neste fim de semana, verificar se a pessoa está escalada
    if (weekendStaff[dateStr] && weekendStaff[dateStr].includes(employeeId)) {
      return 'holiday'; // Pessoa está em plantão de fim de semana (usa mesma cor)
    }
    return 'holiday'; // Fim de semana com plantão ativo
  }
  
  // Verificar férias - corrigindo para incluir a data de fim
  if (vacations[employeeId]) {
    const vacation = vacations[employeeId];
    const startDate = vacation.start;
    const endDate = vacation.end;
    
    // Comparar strings de datas para garantir que inclua o último dia
    if (dateStr >= startDate && dateStr <= endDate) {
      return 'vacation';
    }
  }
  
  // Verificar escala manual configurada (incluindo escalas especiais) - TEM PRIORIDADE
  if (schedules[employeeId] && schedules[employeeId][dateStr]) {
    return schedules[employeeId][dateStr];
  }
  
  // Verificar tipo de funcionário (padrão)
  const employee = employees.find(emp => emp.id === employeeId);
  if (!employee) return null;
  
  // DEBUG: Verificar explicitamente os tipos
  switch (employee.type) {
    case 'always_office':
      return 'office';  // 🟢 Sempre presencial
    case 'always_home':
      return 'home';    // 🔵 Sempre home office
    case 'variable':
      return null;      // ⚪ Depende da escala manual ou especial
    default:
      return null;
  }
};

export const getOfficeCount = (
  date: Date,
  employees: Employee[],
  schedules: ScheduleData,
  vacations: VacationData,
  holidays: HolidayData,
  holidayStaff: StaffData,
  weekendShifts: HolidayData,
  weekendStaff: StaffData
): number => {
  const dateStr = dateToString(date);
  const dayOfWeek = date.getDay();
  
  // Se é feriado, conta apenas quem está em plantão
  if (holidays[dateStr]) {
    return holidayStaff[dateStr] ? holidayStaff[dateStr].length : 0;
  }
  
  // Se é plantão de fim de semana, conta apenas quem está em plantão
  if ((dayOfWeek === 0 || dayOfWeek === 6) && weekendShifts[dateStr]) {
    return weekendStaff[dateStr] ? weekendStaff[dateStr].length : 0;
  }
  
  return employees.filter(emp => 
    getEmployeeStatus(emp.id, date, employees, schedules, vacations, holidays, holidayStaff, weekendShifts, weekendStaff) === 'office'
  ).length;
};

export const setEmployeeStatus = (
  employeeId: number,
  date: Date,
  status: string,
  employees: Employee[],
  schedules: ScheduleData,
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleData>>,
  setChangeHistory: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const dateStr = dateToString(date);
  const employee = employees.find(emp => emp.id === employeeId);
  
  const change = {
    id: Date.now(),
    timestamp: new Date(),
    action: `Alterou ${employee?.name} em ${date.toLocaleDateString()} para ${STATUS_LABELS[status as keyof typeof STATUS_LABELS]}`
  };
  setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
  
  setSchedules(prev => ({
    ...prev,
    [employeeId]: {
      ...prev[employeeId],
      [dateStr]: status
    }
  }));
};