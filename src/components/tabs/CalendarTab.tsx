import React from 'react';
import { Calendar, Users, Filter, AlertTriangle, Edit } from 'lucide-react';

// Imports corrigidos com caminhos absolutos a partir de src/
import { statusColors, statusLabels, monthNames, weekDays } from '../../constants/index.ts';
import { getDaysInMonth } from '../../utils/dateUtils.ts';
import { getFilteredEmployeesForDay, getUniqueTeams } from '../../utils/filterUtils.ts';
import { getSortedEmployees, getDisplayName } from '../../utils/displayUtils.ts';
import { 
  getEmployeeStatus, 
  getOfficeCount, 
  setEmployeeStatus 
} from '../../services/api/scheduleService.ts';
import { 
  getDailyCoverageGaps 
} from '../../services/api/coverageService.ts';
import { 
  toggleHoliday, 
  toggleHolidayStaff, 
  toggleWeekendShift, 
  toggleWeekendStaff 
} from '../../services/api/holidayService.ts';

const CalendarTab = ({
  // Data props
  employees,
  schedules,
  vacations,
  holidays,
  holidayStaff,
  weekendShifts,
  weekendStaff,
  
  // UI props
  currentDate,
  setCurrentDate,
  filters,
  setFilters,
  userRole,
  maxCapacity,
  
  // State setters
  setSchedules,
  setHolidays,
  setHolidayStaff,
  setWeekendShifts,
  setWeekendStaff,
  setChangeHistory
}) => {
  const days = getDaysInMonth(currentDate);
  const teams = getUniqueTeams(employees);

  // Helper functions with bound parameters
  const getEmployeeStatusBound = (employeeId, date) => {
    return getEmployeeStatus(
      employeeId, date, employees, schedules, vacations, holidays, 
      holidayStaff, weekendShifts, weekendStaff
    );
  };

  const getOfficeCountBound = (date) => {
    return getOfficeCount(
      date, employees, schedules, vacations, holidays, 
      holidayStaff, weekendShifts, weekendStaff
    );
  };

  const setEmployeeStatusBound = (employeeId, date, status) => {
    setEmployeeStatus(employeeId, date, status, employees, setSchedules, setChangeHistory);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1 max-h-[80vh] overflow-y-auto">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colaborador
              </label>
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={filters.employee}
                onChange={(e) => setFilters(prev => ({ ...prev, employee: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipe
              </label>
              <select
                value={filters.team}
                onChange={(e) => setFilters(prev => ({ ...prev, team: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Todas as equipes</option>
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
                <option value="SEM_EQUIPE">Sem equipe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Atual
              </label>
              <select
                value={filters.currentStatus || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, currentStatus: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Todos os status</option>
                <option value="office">🟢 Presencial</option>
                <option value="home">🔵 Home Office</option>
                <option value="vacation">🟠 Férias</option>
                <option value="holiday">⚫ Plantão/Feriado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow-sm p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>

          <div className="flex gap-6 mb-4 text-sm">
            <div className="flex gap-4">
              {Object.entries(statusLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded ${statusColors[key]}`}></div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
              <Edit className="w-4 h-4" />
              <span className="text-xs font-medium">💡 Clique nos nomes para alternar</span>
            </div>
            {filters.currentStatus && (
              <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-medium">
                  🔍 Filtro ativo: {statusLabels[filters.currentStatus]}
                </span>
              </div>
            )}
          </div>

          {/* Alertas de Cobertura */}
          {teams.length > 0 && (
            <div className="mb-4">
              {(() => {
                const daysToCheck = getDaysInMonth(currentDate)
                  .filter(day => day && day.getDay() >= 1 && day.getDay() <= 5)
                  .slice(0, 7);
                
                const allGaps = daysToCheck.flatMap(day => {
                  const dailyGaps = getDailyCoverageGaps(day, employees, getEmployeeStatusBound);
                  return dailyGaps.filter(teamGaps => teamGaps.hasGaps);
                });

                if (allGaps.length === 0) {
                  return (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <span className="text-green-600">✅</span>
                        <span className="text-sm font-medium">
                          Cobertura OK - Todas as equipes têm cobertura em todas as janelas horárias
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium">
                        ⚠️ Gaps de Cobertura Detectados
                      </span>
                    </div>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {allGaps.slice(0, 5).map((teamGaps, index) => (
                        <div key={index} className="text-xs text-red-700">
                          <strong>{teamGaps.teamName}</strong> em {teamGaps.date.toLocaleDateString()}:
                          {teamGaps.gaps.map(gap => gap.slot.label).join(', ')}
                          {teamGaps.gaps.some(gap => gap.hasPotentialCoverage) && (
                            <span className="text-red-600"> (pessoas disponíveis)</span>
                          )}
                        </div>
                      ))}
                      {allGaps.length > 5 && (
                        <div className="text-xs text-red-600">
                          ... e mais {allGaps.length - 5} problemas
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {employees.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma pessoa para exibir</h3>
              <p className="text-gray-600">Vá para a aba "Pessoas" para adicionar funcionários ao sistema.</p>
            </div>
          )}

          {employees.length > 0 && (
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(day => (
                <div key={day} className="p-2 text-center font-medium text-gray-700 bg-gray-100">
                  {day}
                </div>
              ))}
              
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="p-2 min-h-[200px]"></div>;
                }
                
                const dayOfWeek = day.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const officeCount = getOfficeCountBound(day);
                const isOverCapacity = officeCount > maxCapacity;
                
                return (
                  <div key={index} className="border border-gray-200 min-h-[200px]">
                    <div className="p-1 text-center text-sm font-medium">
                      {day.getDate()}
                    </div>
                    <div className="p-2 text-center text-gray-500">
                      {isWeekend ? 'Fim de semana' : 'Dia útil'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { CalendarTab };