import React from 'react';
import { Calendar } from 'lucide-react';

interface Employee {
  id: number;
  name: string;
  type: 'always_office' | 'always_home' | 'variable';
  isManager: boolean;
  team: string;
  preferences: Record<string, string>;
  officeDays: number;
  workingHours: string;
}

interface WeekendDayProps {
  day: Date;
  weekendShifts: Record<string, boolean>;
  weekendStaff: Record<string, number[]>;
  employees: Employee[];
  userRole: string;
  onToggleWeekendShift: (date: Date) => void;
  onToggleWeekendStaff: (date: Date, employeeId: number) => void;
}

const dateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDisplayName = (fullName: string): string => {
  const names = fullName.trim().split(' ');
  return names.length >= 2 ? `${names[0]} ${names[1]}` : names[0] || '';
};

const getSortedEmployees = (employeesList: Employee[]): Employee[] => {
  return [...employeesList].sort((a, b) => {
    // Gestores sempre primeiro
    if (a.isManager && !b.isManager) return -1;
    if (!a.isManager && b.isManager) return 1;
    // Depois ordena por nome
    return a.name.localeCompare(b.name);
  });
};

const WeekendDay: React.FC<WeekendDayProps> = ({
  day,
  weekendShifts,
  weekendStaff,
  employees,
  userRole,
  onToggleWeekendShift,
  onToggleWeekendStaff
}) => {
  const dateStr = dateToString(day);

  return (
    <div className="border border-gray-200 min-h-[200px] bg-gray-50">
      <div className="p-1 text-center text-sm font-medium text-gray-400">
        {day.getDate()}
      </div>
      
      {weekendShifts[dateStr] ? (
        <div className="p-4">
          <div className="text-center text-gray-500 text-sm mb-3">Plantão</div>
          <div className="text-xs font-medium text-gray-600 mb-2">⚫ Plantão</div>
          <div className="space-y-1 min-h-[60px] bg-gray-50 p-2 rounded">
            {getSortedEmployees(employees).map(emp => {
              const isOnDuty = weekendStaff[dateStr]?.includes(emp.id);
              if (!isOnDuty) return null;
              
              return (
                <div
                  key={emp.id}
                  className={`text-xs p-2 rounded transition-all cursor-pointer hover:opacity-80 hover:scale-105 ${
                    emp.isManager 
                      ? 'bg-gray-100 text-gray-900 border-2 border-gray-600 font-semibold' 
                      : 'bg-gray-50 text-gray-800 border-2 border-gray-400 font-medium'
                  }`}
                  onClick={() => onToggleWeekendStaff(day, emp.id)}
                  title={`${emp.name} ${emp.isManager ? '(Gestor)' : '(Colaborador)'} - Clique para remover do plantão`}
                >
                  {getDisplayName(emp.name)}
                  <span className="ml-1 text-xs opacity-60">✕</span>
                </div>
              );
            })}
          </div>
          
          {userRole !== 'employee' && (
            <div className="mt-3 space-y-2">
              <select 
                className="w-full text-xs p-2 border rounded"
                onChange={(e) => {
                  if (e.target.value) {
                    onToggleWeekendStaff(day, parseInt(e.target.value));
                    e.target.value = '';
                  }
                }}
              >
                <option value="">+ Adicionar ao plantão</option>
                {getSortedEmployees(employees)
                  .filter(emp => !weekendStaff[dateStr]?.includes(emp.id))
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {getDisplayName(emp.name)} {emp.isManager ? '(Gestor)' : ''}
                    </option>
                  ))
                }
              </select>
              <button
                onClick={() => onToggleWeekendShift(day)}
                className="w-full text-xs p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                📅 Remover Plantão
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center">
          <div className="text-gray-400 text-xs mb-3">
            Final de semana
          </div>
          {userRole !== 'employee' && (
            <button
              onClick={() => onToggleWeekendShift(day)}
              className="text-xs p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              📅 Ativar Plantão
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WeekendDay;