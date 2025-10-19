import { 
  Employee, 
  StatusType, 
  ReportData, 
  AdvancedReportData, 
  PersonalStats 
} from '../../types';
import { getDaysInMonth, getWorkdaysInPeriod } from '../../utils/dateUtils';

// Gerar dados de relatório básico
export const getReportsData = (
  currentDate: Date,
  employees: Employee[],
  getEmployeeStatus: (employeeId: number, date: Date) => StatusType | null
): ReportData => {
  const days = getDaysInMonth(currentDate).filter(day => day);
  const personalStats: Record<number, PersonalStats> = {};
  
  employees.forEach(emp => {
    let office = 0, home = 0, vacation = 0, holiday = 0;
    days.forEach(day => {
      const status = getEmployeeStatus(emp.id, day);
      if (status === 'office') office++;
      else if (status === 'home') home++;
      else if (status === 'vacation') vacation++;
      else if (status === 'holiday') holiday++;
    });
    
    personalStats[emp.id] = { name: emp.name, office, home, vacation, holiday };
  });
  
  return { personalStats };
};

// Gerar dados de relatório avançado
export const getAdvancedReportsData = (
  reportPeriodMode: 'month' | 'custom',
  selectedReportMonth: Date,
  reportStartDate: string,
  reportEndDate: string,
  employees: Employee[],
  getEmployeeStatus: (employeeId: number, date: Date) => StatusType | null
): AdvancedReportData => {
  let startDate: Date, endDate: Date, days: Date[];
  
  if (reportPeriodMode === 'month') {
    // Usar mês selecionado
    const year = selectedReportMonth.getFullYear();
    const month = selectedReportMonth.getMonth();
    startDate = new Date(year, month, 1);
    endDate = new Date(year, month + 1, 0);
    days = getWorkdaysInPeriod(startDate, endDate);
  } else {
    // Usar período personalizado
    if (!reportStartDate || !reportEndDate) {
      return { 
        personalStats: {}, 
        totalWorkdays: 0, 
        averages: { office: 0, home: 0, vacation: 0, holiday: 0 },
        isValidPeriod: false 
      };
    }
    startDate = new Date(reportStartDate);
    endDate = new Date(reportEndDate);
    days = getWorkdaysInPeriod(startDate, endDate);
  }
  
  const totalWorkdays = days.length;
  const personalStats: Record<number, PersonalStats> = {};
  
  employees.forEach(emp => {
    let office = 0, home = 0, vacation = 0, holiday = 0, validDays = 0;
    
    days.forEach(day => {
      const status = getEmployeeStatus(emp.id, day);
      if (status === 'office') {
        office++;
        validDays++;
      } else if (status === 'home') {
        home++;
        validDays++;
      } else if (status === 'vacation') {
        vacation++;
      } else if (status === 'holiday') {
        holiday++;
      }
      // Se status é null, não conta como dia válido
    });
    
    const hasInsufficientData = validDays < 3;
    const workDays = office + home; // Dias efetivamente trabalhados
    const presentialPercentage = workDays > 0 ? (office / workDays * 100) : 0;
    
    personalStats[emp.id] = { 
      name: emp.name, 
      office, 
      home, 
      vacation, 
      holiday,
      validDays,
      workDays,
      presentialPercentage,
      hasInsufficientData
    };
  });
  
  // Calcular médias
  const totalEmployees = employees.length;
  const averages = {
    office: totalEmployees > 0 ? Object.values(personalStats).reduce((acc, stat) => acc + stat.office, 0) / totalEmployees : 0,
    home: totalEmployees > 0 ? Object.values(personalStats).reduce((acc, stat) => acc + stat.home, 0) / totalEmployees : 0,
    vacation: totalEmployees > 0 ? Object.values(personalStats).reduce((acc, stat) => acc + stat.vacation, 0) / totalEmployees : 0,
    holiday: totalEmployees > 0 ? Object.values(personalStats).reduce((acc, stat) => acc + stat.holiday, 0) / totalEmployees : 0
  };
  
  return { 
    personalStats, 
    totalWorkdays, 
    averages,
    isValidPeriod: true,
    periodStart: startDate,
    periodEnd: endDate
  };
};