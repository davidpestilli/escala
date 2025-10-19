// src/services/api/templateService.ts
import { Employee, Template } from '../../types';
import { TEMPLATES } from '../../constants';
import { getDaysInMonth } from '../../utils/dateUtils';

export interface TemplateApplicationParams {
  templateKey: string;
  targetEmployees: Employee[];
  respectPreferences: boolean;
  currentDate: Date;
  targetOfficeCount: number;
  setEmployeeStatus: (employeeId: number, date: Date, status: string) => void;
}

export const executeTemplateApplication = ({
  templateKey,
  targetEmployees,
  respectPreferences,
  currentDate,
  targetOfficeCount,
  setEmployeeStatus
}: TemplateApplicationParams): void => {
  const template = TEMPLATES[templateKey as keyof typeof TEMPLATES];
  const days = getDaysInMonth(currentDate).filter(day => day && day.getDay() >= 1 && day.getDay() <= 5) as Date[];
  
  // Template de revezamento de gestores com meta mínima
  if (templateKey === 'manager_rotation') {
    // Implementação específica para gestores
    handleManagerRotationTemplate(targetEmployees, days, setEmployeeStatus);
    return;
  }

  // Templates inteligentes com balanceamento
  handleBalancedTemplate({
    templateKey,
    targetEmployees,
    respectPreferences,
    days,
    targetOfficeCount,
    setEmployeeStatus
  });
};

const handleManagerRotationTemplate = (
  allEmployees: Employee[],
  days: Date[],
  setEmployeeStatus: (employeeId: number, date: Date, status: string) => void
): void => {
  const allManagers = allEmployees.filter(emp => emp.isManager);
  const fixedManagers = allManagers.filter(emp => emp.type === 'always_office');
  const variableManagers = allManagers.filter(emp => emp.type === 'variable');
  
  if (allManagers.length === 0) {
    console.warn('Nenhum gestor encontrado no sistema.');
    return;
  }
  
  if (variableManagers.length === 0) {
    console.warn('Todos os gestores são fixos.');
    return;
  }
  
  const metaMinimaGestores = 2;
  const gestoresFixos = fixedManagers.length;
  const precisoDeVariaveis = Math.max(0, metaMinimaGestores - gestoresFixos);
  
  // Se precisar de mais gestores variáveis do que temos, todos ficam presenciais
  if (precisoDeVariaveis >= variableManagers.length) {
    variableManagers.forEach(manager => {
      days.forEach(day => {
        setEmployeeStatus(manager.id, day, 'office');
      });
    });
  } else {
    // Distribui os gestores variáveis garantindo a meta mínima
    days.forEach((day, dayIndex) => {
      // Determinar quais gestores variáveis ficam presenciais neste dia
      const gestoresPresenciaisHoje: Employee[] = [];
      
      // Distribuição rotativa garantindo a meta
      for (let i = 0; i < precisoDeVariaveis; i++) {
        const managerIndex = (dayIndex + i) % variableManagers.length;
        gestoresPresenciaisHoje.push(variableManagers[managerIndex]);
      }
      
      // Aplicar a distribuição
      variableManagers.forEach(manager => {
        const status = gestoresPresenciaisHoje.includes(manager) ? 'office' : 'home';
        setEmployeeStatus(manager.id, day, status);
      });
    });
  }
};

interface BalancedTemplateParams {
  templateKey: string;
  targetEmployees: Employee[];
  respectPreferences: boolean;
  days: Date[];
  targetOfficeCount: number;
  setEmployeeStatus: (employeeId: number, date: Date, status: string) => void;
}

const handleBalancedTemplate = ({
  templateKey,
  targetEmployees,
  respectPreferences,
  days,
  targetOfficeCount,
  setEmployeeStatus
}: BalancedTemplateParams): void => {
  const targetPerDay = targetOfficeCount;
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  
  // Agrupar dias por dia da semana
  const daysByWeekday: { [key: string]: Date[] } = {};
  weekdays.forEach(weekday => { daysByWeekday[weekday] = []; });
  
  days.forEach(day => {
    const weekdayIndex = day.getDay() - 1; // 0=monday, 4=friday
    if (weekdayIndex >= 0 && weekdayIndex < 5) {
      daysByWeekday[weekdays[weekdayIndex]].push(day);
    }
  });

  // Determinar padrão do template baseado na META ORGANIZACIONAL
  const templatePatterns = {
    '4x1': { officeDays: 4, homeDays: 1 },
    '3x2': { officeDays: 3, homeDays: 2 },
    '2x3': { officeDays: 2, homeDays: 3 },
    'alternate': { officeDays: 2.5, homeDays: 2.5 }
  };
  
  const pattern = templatePatterns[templateKey as keyof typeof templatePatterns] || { officeDays: 3, homeDays: 2 };
  
  // Distribuir pessoas normais baseado no template
  targetEmployees.forEach((emp, empIndex) => {
    let personOfficeDays: string[] = [];
    
    // Respeitar preferências se solicitado
    if (respectPreferences && emp.preferences) {
      const preferredHomeDays = Object.keys(emp.preferences).filter(day => emp.preferences[day] === 'home');
      const availableDays = weekdays.filter(day => !preferredHomeDays.includes(day));
      
      for (let i = 0; i < pattern.officeDays && personOfficeDays.length < pattern.officeDays; i++) {
        const dayIndex = (empIndex + i) % availableDays.length;
        if (availableDays[dayIndex]) {
          personOfficeDays.push(availableDays[dayIndex]);
        }
      }
      
      while (personOfficeDays.length < pattern.officeDays) {
        const dayIndex = (empIndex + personOfficeDays.length) % weekdays.length;
        if (!personOfficeDays.includes(weekdays[dayIndex])) {
          personOfficeDays.push(weekdays[dayIndex]);
        }
      }
    } else {
      // Distribuição baseada no template, rotacionando pessoas
      for (let i = 0; i < pattern.officeDays; i++) {
        const dayIndex = (empIndex + i) % weekdays.length;
        personOfficeDays.push(weekdays[dayIndex]);
      }
    }
    
    // Aplicar distribuição inicial
    weekdays.forEach(weekday => {
      const isOfficeDay = personOfficeDays.includes(weekday);
      const daysOfWeek = daysByWeekday[weekday];
      
      daysOfWeek.forEach(day => {
        const status = isOfficeDay ? 'office' : 'home';
        setEmployeeStatus(emp.id, day, status);
      });
    });
  });
};