import React from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { 
  Employee, 
  StatusType, 
  Filters, 
  UserRole, 
  Holidays, 
  HolidayStaff,
  Schedules
} from '../../types';
import { dateToString } from '../../utils/dateUtils';
import { getFilteredEmployeesForDay } from '../../utils/filterUtils';
import { getSortedEmployees, getDisplayName } from '../../utils/displayUtils';

interface WeekDayProps {
  day: Date;
  employees: Employee[];
  holidays: Holidays;
  holidayStaff: HolidayStaff;
  schedules: Schedules;
  filters: Filters;
  userRole: UserRole;
  maxCapacity: number;
  officeCount: number;
  isOverCapacity: boolean;
  getEmployeeStatus: (employeeId: number, date: Date) => StatusType | null;
  setEmployeeStatus: (employeeId: number, date: Date, status: StatusType) => void;
  toggleHoliday: (date: Date) => void;
  toggleHolidayStaff: (date: Date, employeeId: number) => void;
}

export const WeekDay: React.FC<WeekDayProps> = ({
  day,
  employees,
  holidays,
  holidayStaff,
  schedules,
  filters,
  userRole,
  maxCapacity,
  officeCount,
  isOverCapacity,
  getEmployeeStatus,
  setEmployeeStatus,
  toggleHoliday,
  toggleHolidayStaff
}) => {
  const dateStr = dateToString(day);
  const filteredEmployees = getFilteredEmployeesForDay(employees, filters, day, getEmployeeStatus);

  return (
    <div className="border border-gray-200 min-h-[200px]">
      <div className={`p-1 text-center text-sm font-medium relative ${
        holidays[dateStr] 
          ? 'bg-gray-400 text-white' 
          : isOverCapacity 
            ? 'bg-red-100 text-red-800' 
            : 'bg-gray-50'
      }`}>
        <div className="flex items-center justify-center gap-1">
          {day.getDate()}
          {userRole !== 'employee' && (
            <button
              onClick={() => toggleHoliday(day)}
              className={`p-1 rounded hover:bg-opacity-70 ${
                holidays[dateStr]
                  ? 'text-white hover:bg-gray-600'
                  : 'text-gray-500 hover:bg-gray-200'
              }`}
              title={holidays[dateStr] ? 'Remover feriado' : 'Marcar como feriado'}
            >
              <Calendar className="w-3 h-3" />
            </button>
          )}
          {isOverCapacity && !holidays[dateStr] && (
            <AlertTriangle className="w-3 h-3 text-red-600" />
          )}
        </div>
      </div>
      
      {holidays[dateStr] ? (
        <HolidayContent
          day={day}
          employees={filteredEmployees}
          holidayStaff={holidayStaff}
          userRole={userRole}
          toggleHolidayStaff={toggleHolidayStaff}
        />
      ) : (
        <RegularDayContent
          day={day}
          employees={filteredEmployees}
          userRole={userRole}
          officeCount={officeCount}
          maxCapacity={maxCapacity}
          getEmployeeStatus={getEmployeeStatus}
          setEmployeeStatus={setEmployeeStatus}
        />
      )}
    </div>
  );
};

// Holiday content component
const HolidayContent: React.FC<{
  day: Date;
  employees: Employee[];
  holidayStaff: HolidayStaff;
  userRole: UserRole;
  toggleHolidayStaff: (date: Date, employeeId: number) => void;
}> = ({ day, employees, holidayStaff, userRole, toggleHolidayStaff }) => {
  const dateStr = dateToString(day);

  return (
    <div className="p-4">
      <div className="text-center text-gray-500 text-sm mb-3">Feriado</div>
      <div className="text-xs font-medium text-gray-600 mb-2">⚫ Plantão</div>
      <div className="space-y-1 min-h-[60px] bg-gray-50 p-2 rounded">
        {getSortedEmployees(employees).map(emp => {
          const isOnDuty = holidayStaff[dateStr]?.includes(emp.id);
          if (!isOnDuty) return null;
          
          return (
            <div
              key={emp.id}
              className={`text-xs p-2 rounded transition-all cursor-pointer hover:opacity-80 hover:scale-105 ${
                emp.isManager 
                  ? 'bg-gray-200 text-gray-900 border-2 border-blue-500 font-semibold shadow-sm' 
                  : 'bg-gray-100 text-gray-800 border-2 border-blue-400 font-medium shadow-sm'
              }`}
              onClick={() => toggleHolidayStaff(day, emp.id)}
              title={`${emp.name} ${emp.isManager ? '(Gestor)' : '(Colaborador)'} - Clique para remover do plantão`}
            >
              {getDisplayName(emp.name)}
              <span className="ml-1 text-xs opacity-60">✕</span>
            </div>
          );
        })}
      </div>
      
      {userRole !== 'employee' && (
        <div className="mt-3">
          <select 
            className="w-full text-xs p-2 border rounded"
            onChange={(e) => {
              if (e.target.value) {
                toggleHolidayStaff(day, parseInt(e.target.value));
                e.target.value = '';
              }
            }}
          >
            <option value="">+ Adicionar ao plantão</option>
            {getSortedEmployees(employees)
              .filter(emp => !holidayStaff[dateStr]?.includes(emp.id))
              .map(emp => (
                <option key={emp.id} value={emp.id}>
                  {getDisplayName(emp.name)} {emp.isManager ? '(Gestor)' : ''}
                </option>
              ))
            }
          </select>
        </div>
      )}
    </div>
  );
};

// Regular day content component
const RegularDayContent: React.FC<{
  day: Date;
  employees: Employee[];
  userRole: UserRole;
  officeCount: number;
  maxCapacity: number;
  getEmployeeStatus: (employeeId: number, date: Date) => StatusType | null;
  setEmployeeStatus: (employeeId: number, date: Date, status: StatusType) => void;
}> = ({ day, employees, userRole, officeCount, maxCapacity, getEmployeeStatus, setEmployeeStatus }) => {
  return (
    <>
      <div className="p-2">
        <div className="text-xs font-medium text-gray-600 mb-2">🟢 Presencial</div>
        <div className="space-y-1 min-h-[60px] bg-green-50 p-2 rounded">
          {getSortedEmployees(employees).map(emp => {
            const status = getEmployeeStatus(emp.id, day);
            
            if (status !== 'office') return null;
            
            // Definir borda lateral baseada no tipo
            let borderClass = '';
            if (emp.type === 'always_office') {
              borderClass = 'border-l-4 border-l-green-700';
            } else if (emp.type === 'always_home') {
              borderClass = 'border-l-4 border-l-blue-700';
            }
            
            return (
              <div
                key={emp.id}
                className={`text-xs p-2 rounded transition-all ${borderClass} ${
                  userRole !== 'employee' && emp.type === 'variable'
                    ? 'cursor-pointer hover:opacity-80 hover:scale-105' 
                    : 'cursor-default'
                } ${
                  emp.isManager 
                    ? 'bg-green-100 text-green-900 border-2 border-green-600 font-semibold' 
                    : 'bg-green-50 text-green-800 border-2 border-green-400 font-medium'
                }`}
                onClick={() => {
                  if (userRole !== 'employee' && emp.type === 'variable') {
                    setEmployeeStatus(emp.id, day, 'home');
                  }
                }}
                title={`${emp.name} ${emp.isManager ? '(Gestor)' : '(Colaborador)'} ${
                  emp.type === 'variable' ? '- Clique para alternar' : ''
                }`}
              >
                {getDisplayName(emp.name)}
                <span className="ml-1 text-xs opacity-75">
                  [{emp.workingHours || '9-17'}]
                </span>
                {userRole !== 'employee' && emp.type === 'variable' && (
                  <span className="ml-1 text-xs opacity-60">⇄</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="p-2">
        <div className="text-xs font-medium text-gray-600 mb-2">🔵 Home Office</div>
        <div className="space-y-1 min-h-[60px] bg-blue-50 p-2 rounded">
          {getSortedEmployees(employees).map(emp => {
            const status = getEmployeeStatus(emp.id, day);
            
            if (status !== 'home') return null;
            
            // Definir borda lateral baseada no tipo
            let borderClass = '';
            if (emp.type === 'always_office') {
              borderClass = 'border-l-4 border-l-green-700';
            } else if (emp.type === 'always_home') {
              borderClass = 'border-l-4 border-l-blue-700';
            }
            
            return (
              <div
                key={emp.id}
                className={`text-xs p-2 rounded transition-all ${borderClass} ${
                  userRole !== 'employee' && emp.type === 'variable'
                    ? 'cursor-pointer hover:opacity-80 hover:scale-105' 
                    : 'cursor-default'
                } ${
                  emp.isManager 
                    ? 'bg-blue-100 text-blue-900 border-2 border-blue-600 font-semibold' 
                    : 'bg-blue-50 text-blue-800 border-2 border-blue-400 font-medium'
                }`}
                onClick={() => {
                  if (userRole !== 'employee' && emp.type === 'variable') {
                    setEmployeeStatus(emp.id, day, 'office');
                  }
                }}
                title={`${emp.name} ${emp.isManager ? '(Gestor)' : '(Colaborador)'} ${
                  emp.type === 'variable' ? '- Clique para alternar' : ''
                }`}
              >
                {getDisplayName(emp.name)}
                <span className="ml-1 text-xs opacity-75">
                  [{emp.workingHours || '9-17'}]
                </span>
                {userRole !== 'employee' && emp.type === 'variable' && (
                  <span className="ml-1 text-xs opacity-60">⇄</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção de Férias */}
      <div className="p-2">
        <div className="text-xs font-medium text-gray-600 mb-2">🟠 Férias</div>
        <div className="space-y-1 min-h-[40px] bg-orange-50 p-2 rounded">
          {getSortedEmployees(employees).map(emp => {
            const status = getEmployeeStatus(emp.id, day);
            
            if (status !== 'vacation') return null;
            
            return (
              <div
                key={emp.id}
                className={`text-xs p-2 rounded transition-all cursor-default ${
                  emp.isManager 
                    ? 'bg-orange-100 text-orange-900 border-2 border-orange-600 font-semibold' 
                    : 'bg-orange-50 text-orange-800 border-2 border-orange-400 font-medium'
                }`}
                title={`${emp.name} ${emp.isManager ? '(Gestor)' : '(Colaborador)'} - De férias`}
              >
                {getDisplayName(emp.name)}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="p-1 text-xs text-center text-gray-600 border-t">
        {officeCount}/{maxCapacity} no escritório
      </div>
    </>
  );
};