import { 
  Holidays, 
  HolidayStaff, 
  WeekendShifts, 
  WeekendStaff, 
  Change 
} from '../../types';
import { dateToString } from '../../utils/dateUtils';

// Toggle feriado
export const toggleHoliday = (
  date: Date,
  setHolidays: React.Dispatch<React.SetStateAction<Holidays>>,
  setHolidayStaff: React.Dispatch<React.SetStateAction<HolidayStaff>>,
  setChangeHistory: React.Dispatch<React.SetStateAction<Change[]>>
): void => {
  const dateStr = dateToString(date);
  
  setHolidays(prev => {
    const newHolidays = { ...prev };
    if (newHolidays[dateStr]) {
      delete newHolidays[dateStr];
      // Remove também o plantão quando remove o feriado
      setHolidayStaff(prevStaff => {
        const newStaff = { ...prevStaff };
        delete newStaff[dateStr];
        return newStaff;
      });
      
      const change: Change = {
        id: Date.now(),
        timestamp: new Date(),
        action: `Removeu feriado do dia ${date.toLocaleDateString()}`
      };
      setChangeHistory(prevHistory => [change, ...prevHistory.slice(0, 99)]);
    } else {
      newHolidays[dateStr] = true;
      
      const change: Change = {
        id: Date.now(),
        timestamp: new Date(),
        action: `Marcou ${date.toLocaleDateString()} como feriado`
      };
      setChangeHistory(prevHistory => [change, ...prevHistory.slice(0, 99)]);
    }
    return newHolidays;
  });
};

// Toggle plantão de feriado
export const toggleHolidayStaff = (
  date: Date,
  employeeId: number,
  setHolidayStaff: React.Dispatch<React.SetStateAction<HolidayStaff>>
): void => {
  const dateStr = dateToString(date);
  
  setHolidayStaff(prev => {
    const newStaff = { ...prev };
    if (!newStaff[dateStr]) {
      newStaff[dateStr] = [];
    }
    
    if (newStaff[dateStr].includes(employeeId)) {
      // Remove da escala de plantão
      newStaff[dateStr] = newStaff[dateStr].filter(id => id !== employeeId);
      if (newStaff[dateStr].length === 0) {
        delete newStaff[dateStr];
      }
    } else {
      // Adiciona à escala de plantão
      newStaff[dateStr].push(employeeId);
    }
    
    return newStaff;
  });
};

// Toggle plantão de fim de semana
export const toggleWeekendShift = (
  date: Date,
  setWeekendShifts: React.Dispatch<React.SetStateAction<WeekendShifts>>,
  setWeekendStaff: React.Dispatch<React.SetStateAction<WeekendStaff>>,
  setChangeHistory: React.Dispatch<React.SetStateAction<Change[]>>
): void => {
  const dateStr = dateToString(date);
  
  setWeekendShifts(prev => {
    const newShifts = { ...prev };
    if (newShifts[dateStr]) {
      delete newShifts[dateStr];
      // Remove também o staff quando remove o plantão
      setWeekendStaff(prevStaff => {
        const newStaff = { ...prevStaff };
        delete newStaff[dateStr];
        return newStaff;
      });
      
      const change: Change = {
        id: Date.now(),
        timestamp: new Date(),
        action: `Removeu plantão de fim de semana do dia ${date.toLocaleDateString()}`
      };
      setChangeHistory(prevHistory => [change, ...prevHistory.slice(0, 99)]);
    } else {
      newShifts[dateStr] = true;
      
      const change: Change = {
        id: Date.now(),
        timestamp: new Date(),
        action: `Ativou plantão de fim de semana para ${date.toLocaleDateString()}`
      };
      setChangeHistory(prevHistory => [change, ...prevHistory.slice(0, 99)]);
    }
    return newShifts;
  });
};

// Toggle staff de fim de semana
export const toggleWeekendStaff = (
  date: Date,
  employeeId: number,
  setWeekendStaff: React.Dispatch<React.SetStateAction<WeekendStaff>>
): void => {
  const dateStr = dateToString(date);
  
  setWeekendStaff(prev => {
    const newStaff = { ...prev };
    if (!newStaff[dateStr]) {
      newStaff[dateStr] = [];
    }
    
    if (newStaff[dateStr].includes(employeeId)) {
      // Remove da escala de plantão
      newStaff[dateStr] = newStaff[dateStr].filter(id => id !== employeeId);
      if (newStaff[dateStr].length === 0) {
        delete newStaff[dateStr];
      }
    } else {
      // Adiciona à escala de plantão
      newStaff[dateStr].push(employeeId);
    }
    
    return newStaff;
  });
};