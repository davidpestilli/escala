// src/utils/dateUtils.ts
import { MONTH_NAMES } from '../constants';

// Função auxiliar para converter Date para string sem problemas de fuso horário
export const dateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }
  
  return days;
};

export const getNext4MonthsFromCurrent = () => {
  const today = new Date();
  const months = [];
  for (let i = 0; i < 4; i++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days: (Date | null)[] = [];
    for (let j = 0; j < firstDay; j++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    months.push({
      date: monthDate,
      days: days,
      name: `${MONTH_NAMES[month]} ${year}`
    });
  }
  return months;
};

// Função para obter dias úteis em um período
export const getWorkdaysInPeriod = (startDate: Date, endDate: Date): Date[] => {
  const days: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Segunda a sexta
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return days;
};

export const isWeekend = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

export const isWeekday = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek >= 1 && dayOfWeek <= 5;
};