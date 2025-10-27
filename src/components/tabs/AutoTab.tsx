// src/components/tabs/AutoTab.tsx
import React, { useState, useMemo } from 'react';
import { Trash2, Check, X, ChevronDown } from 'lucide-react';
import { Employee } from '../../types';

interface AutoTabProps {
  employees: Employee[];
  userRole: string;
  targetOfficeCount: number;
  currentDate: Date;
  schedules: Record<string, Record<string, string>>;
  holidays: Record<string, boolean>;
  onApplyCustomDistribution: (
    config: {
      officeDays: number;
      targetPerDay: number;
      excludedEmployeeIds: number[];
      excludedDates: string[];
    },
    onComplete?: () => void
  ) => void;
  onClearAllSchedules: () => void;
}

interface DistributionConfig {
  officeDays: number | null;
  targetPerDay: number | null;
  excludedEmployeeIds: number[];
  excludedDates: string[];
}

const AutoTab: React.FC<AutoTabProps> = ({
  employees,
  userRole,
  targetOfficeCount,
  currentDate,
  schedules,
  holidays,
  onApplyCustomDistribution,
  onClearAllSchedules
}) => {
  const [distributionConfig, setDistributionConfig] = useState<DistributionConfig>({
    officeDays: null,
    targetPerDay: null,
    excludedEmployeeIds: [],
    excludedDates: []
  });

  const [showResumo, setShowResumo] = useState(false);
  const [isPersonListOpen, setIsPersonListOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isHolidayCalendarOpen, setIsHolidayCalendarOpen] = useState(false);

  if (userRole === 'employee') {
    return null;
  }

  // Função para converter data em string YYYY-MM-DD
  const dateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Função para gerar dias do mês
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  // Toggle feriado
  const toggleHoliday = (date: Date) => {
    const dateStr = dateToString(date);
    setDistributionConfig(prev => {
      const isHoliday = prev.excludedDates.includes(dateStr);
      return {
        ...prev,
        excludedDates: isHoliday
          ? prev.excludedDates.filter(d => d !== dateStr)
          : [...prev.excludedDates, dateStr]
      };
    });
  };

  // 1. Filtrar apenas pessoas disponíveis (variable)
  const availableEmployees = useMemo(() => {
    return employees.filter(emp => emp.type === 'variable');
  }, [employees]);

  // 1.5. Identificar "variable" com escala completa (todos os dias úteis preenchidos)
  const variableWithCompleteSchedule = useMemo(() => {
    // Obter todos os dias úteis do mês (excluindo fins de semana e feriados)
    const allWorkDays = getDaysInMonth(currentDate).filter(day => {
      if (!day) return false;
      const dateStr = dateToString(day);
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const isHoliday = holidays[dateStr];
      return !isWeekend && !isHoliday;
    });

    const workDaysCount = allWorkDays.length;

    // Verificar quais "variable" têm TODOS os dias úteis preenchidos no schedules
    return availableEmployees.filter(emp => {
      const empSchedule = schedules[emp.id];
      if (!empSchedule) return false;

      // Contar quantos dias úteis do mês atual têm status definido (office ou home)
      const filledWorkDaysCount = allWorkDays.filter(day => {
        const dateStr = dateToString(day);
        const status = empSchedule[dateStr];
        return status === 'office' || status === 'home';
      }).length;

      // Se tem TODOS os dias úteis preenchidos, auto-excluir
      return filledWorkDaysCount === workDaysCount;
    });
  }, [availableEmployees, currentDate, schedules, holidays]);

  // Auto-excluir "variable" com escala completa
  const autoExcludedIds = useMemo(() => {
    return variableWithCompleteSchedule.map(emp => emp.id);
  }, [variableWithCompleteSchedule]);

  // 2. Contar pessoas incluídas (não excluídas manualmente ou auto-excluídas)
  const includedCount = useMemo(() => {
    return availableEmployees.filter(
      emp => !distributionConfig.excludedEmployeeIds.includes(emp.id) &&
             !autoExcludedIds.includes(emp.id)
    ).length;
  }, [availableEmployees, distributionConfig.excludedEmployeeIds, autoExcludedIds]);

  // 3. Total registrado
  const totalRegistered = employees.length;

  // Toggle exclusão de pessoa
  const toggleExcludePerson = (employeeId: number) => {
    setDistributionConfig(prev => {
      const isExcluded = prev.excludedEmployeeIds.includes(employeeId);
      return {
        ...prev,
        excludedEmployeeIds: isExcluded
          ? prev.excludedEmployeeIds.filter(id => id !== employeeId)
          : [...prev.excludedEmployeeIds, employeeId]
      };
    });
  };

  // Verificar se botão Aplicar deve estar ativado
  const canApply = distributionConfig.officeDays !== null &&
                   distributionConfig.targetPerDay !== null &&
                   includedCount > 0;

  // Validar se a meta é possível
  const isValidMeta = distributionConfig.targetPerDay === null ||
                      distributionConfig.targetPerDay <= includedCount;

  const handleApply = () => {
    if (!canApply) return;
    setShowResumo(true);
  };

  const handleConfirm = async () => {
    setIsApplying(true);

    // Combinar exclusões manuais + auto-exclusões (variable com escala completa)
    const allExcludedIds = [
      ...distributionConfig.excludedEmployeeIds,
      ...autoExcludedIds
    ];

    // Chamar a função de distribuição com callback de conclusão
    onApplyCustomDistribution(
      {
        officeDays: distributionConfig.officeDays!,
        targetPerDay: distributionConfig.targetPerDay!,
        excludedEmployeeIds: allExcludedIds,
        excludedDates: distributionConfig.excludedDates
      },
      () => {
        // Callback chamado quando a distribuição termina
        setIsApplying(false);
        setShowResumo(false);
        setDistributionConfig({
          officeDays: null,
          targetPerDay: null,
          excludedEmployeeIds: [],
          excludedDates: []
        });
      }
    );
  };

  const handleCancel = () => {
    setShowResumo(false);
  };

  return (
    <div className="space-y-6">
      {/* ===== CARDS INFORMATIVOS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Registrado */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">👥 Pessoas Registradas</p>
              <p className="text-3xl font-bold text-blue-900">{totalRegistered}</p>
            </div>
            <div className="text-5xl opacity-20">👥</div>
          </div>
        </div>

        {/* Card 2: Disponíveis para Distribuição */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">📊 Disponíveis</p>
              <p className="text-3xl font-bold text-green-900">{includedCount}</p>
              <p className="text-xs text-green-700 mt-2">
                ({availableEmployees.length - includedCount} excluídas)
              </p>
            </div>
            <div className="text-5xl opacity-20">📊</div>
          </div>
        </div>

        {/* Card 3: Total de Cada Tipo */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm p-6 border border-purple-200">
          <div>
            <p className="text-sm font-medium text-purple-600 mb-3">📋 Composição</p>
            <div className="space-y-1 text-sm text-purple-800">
              <div>• Always Office: {employees.filter(e => e.type === 'always_office').length}</div>
              <div>• Always Home: {employees.filter(e => e.type === 'always_home').length}</div>
              <div>
                • Variable: {availableEmployees.length}
                {variableWithCompleteSchedule.length > 0 && (
                  <span className="text-xs text-purple-600 ml-1">
                    ({variableWithCompleteSchedule.length} excluído{variableWithCompleteSchedule.length > 1 ? 's' : ''} - escala completa)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SELEÇÃO DE PESSOAS (CASCATA) ===== */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Colapsável */}
        <button
          onClick={() => setIsPersonListOpen(!isPersonListOpen)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition border-b border-gray-200"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>🎯</span> Pessoas Disponíveis para Distribuição
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {includedCount} incluídas
            </span>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                isPersonListOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {/* Conteúdo Colapsável */}
        {isPersonListOpen && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto bg-white">
              {availableEmployees.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Nenhuma pessoa disponível para distribuição (sem people variável)
                </p>
              ) : (
                <div className="space-y-2">
                  {availableEmployees.map(emp => {
                    const isExcluded = distributionConfig.excludedEmployeeIds.includes(emp.id);
                    const isAutoExcluded = autoExcludedIds.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        className={`flex items-center justify-between p-3 rounded border transition ${
                          isAutoExcluded
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={isExcluded || isAutoExcluded ? 'text-gray-400 line-through' : 'text-gray-900'}>
                            {emp.name}
                          </span>
                          {isAutoExcluded && (
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                              escala completa
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleExcludePerson(emp.id)}
                          disabled={isAutoExcluded}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                            isAutoExcluded
                              ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                              : isExcluded
                                ? 'bg-red-100 border-red-500'
                                : 'bg-white border-green-500 hover:bg-green-50'
                          }`}
                          title={
                            isAutoExcluded
                              ? 'Auto-excluído (escala completa)'
                              : isExcluded
                                ? 'Incluir nesta pessoa'
                                : 'Excluir esta pessoa da distribuição'
                          }
                        >
                          {isExcluded && <X className="w-4 h-4 text-red-600" />}
                          {!isExcluded && !isAutoExcluded && <Check className="w-4 h-4 text-green-600 opacity-0 group-hover:opacity-100" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-600 mt-3 flex items-center gap-1">
              <span>💡</span> Clique no checkbox para excluir/incluir uma pessoa. Os cards acima são atualizados
              automaticamente.
            </p>
          </div>
        )}
      </div>

      {/* ===== CONFIGURAÇÃO DE DISTRIBUIÇÃO ===== */}
      {!showResumo ? (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>⚙️</span> Configurar Distribuição
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dias Presenciais */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Dias Presenciais por Pessoa
              </label>
              <select
                value={distributionConfig.officeDays || ''}
                onChange={(e) =>
                  setDistributionConfig(prev => ({
                    ...prev,
                    officeDays: e.target.value ? parseInt(e.target.value) : null
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione...</option>
                <option value="1">1 dia presencial</option>
                <option value="2">2 dias presenciais</option>
                <option value="3">3 dias presenciais</option>
                <option value="4">4 dias presenciais</option>
                <option value="5">5 dias presenciais</option>
              </select>
            </div>

            {/* Meta Presencial */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Meta Presencial (pessoas por dia)
              </label>
              <select
                value={distributionConfig.targetPerDay || ''}
                onChange={(e) =>
                  setDistributionConfig(prev => ({
                    ...prev,
                    targetPerDay: e.target.value ? parseInt(e.target.value) : null
                  }))
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                  isValidMeta
                    ? 'border-gray-300 focus:ring-blue-500'
                    : 'border-red-300 focus:ring-red-500'
                }`}
              >
                <option value="">Selecione...</option>
                {Array.from({ length: includedCount }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>
                    {num} pessoa{num > 1 ? 's' : ''} presencialmente
                  </option>
                ))}
              </select>
              {!isValidMeta && (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Meta não pode ser maior que {includedCount} (pessoas disponíveis)
                </p>
              )}
            </div>
          </div>

          {/* Mini-Calendário de Feriados */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Feriados (dias excluídos da distribuição)
            </label>

            {/* Botão para expandir/colapsar calendário */}
            <button
              onClick={() => setIsHolidayCalendarOpen(!isHolidayCalendarOpen)}
              className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  {distributionConfig.excludedDates.length === 0
                    ? 'Clique para marcar feriados'
                    : `${distributionConfig.excludedDates.length} feriado(s) marcado(s)`
                  }
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  isHolidayCalendarOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Calendário (exibido apenas quando aberto) */}
            {isHolidayCalendarOpen && (
              <div className="mt-3 bg-gray-50 rounded-lg p-4 border border-gray-300">
                <div className="text-xs text-gray-600 mb-3">
                  Clique nos dias para marcar/desmarcar como feriado. Feriados não contarão para a distribuição.
                </div>

                {/* Cabeçalho dias da semana */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-600 p-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grid de dias */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentDate).map((day, index) => {
                    if (!day) {
                      return <div key={index} className="p-2"></div>;
                    }

                    const dateStr = dateToString(day);
                    const isHoliday = distributionConfig.excludedDates.includes(dateStr);
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const isToday = new Date().toDateString() === day.toDateString();

                    return (
                      <button
                        key={index}
                        onClick={() => !isWeekend && toggleHoliday(day)}
                        disabled={isWeekend}
                        className={`
                          p-2 text-xs rounded transition-all
                          ${isWeekend
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isHoliday
                              ? 'bg-red-500 text-white font-semibold hover:bg-red-600 shadow'
                              : 'bg-white border border-gray-300 hover:bg-gray-100'
                          }
                          ${isToday && !isWeekend ? 'ring-2 ring-blue-400' : ''}
                        `}
                        title={
                          isWeekend
                            ? 'Fim de semana'
                            : isHoliday
                              ? 'Feriado - Clique para desmarcar'
                              : 'Dia útil - Clique para marcar como feriado'
                        }
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Contador de feriados */}
                {distributionConfig.excludedDates.length > 0 && (
                  <div className="mt-3 text-xs text-red-600 font-medium">
                    🔴 {distributionConfig.excludedDates.length} dia(s) marcado(s) como feriado
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Aviso */}
          {distributionConfig.officeDays && distributionConfig.targetPerDay && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              ℹ️ Será distribuído: {includedCount} pessoas × {distributionConfig.officeDays} dias presenciais
              = {(includedCount * distributionConfig.officeDays)} presenças no mês
              {distributionConfig.excludedDates.length > 0 && (
                <span> (excluindo {distributionConfig.excludedDates.length} feriado(s))</span>
              )}
            </div>
          )}

          {/* Botão Aplicar */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleApply}
              disabled={!canApply}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition ${
                canApply
                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Aplicar
            </button>
          </div>
        </div>
      ) : (
        /* ===== RESUMO E CONFIRMAÇÃO ===== */
        <div className="bg-white rounded-lg shadow-sm p-6 border border-green-200 bg-green-50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-900">
            <span>📋</span> Resumo da Distribuição
          </h3>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 bg-white rounded border border-green-200">
              <span className="text-gray-700">Dias presenciais por pessoa:</span>
              <span className="font-semibold text-green-700">{distributionConfig.officeDays} dias</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded border border-green-200">
              <span className="text-gray-700">Meta presencial por dia:</span>
              <span className="font-semibold text-green-700">{distributionConfig.targetPerDay} pessoas</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded border border-green-200">
              <span className="text-gray-700">Pessoas na distribuição:</span>
              <span className="font-semibold text-green-700">{includedCount} pessoas</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded border border-green-200">
              <span className="text-gray-700">Método:</span>
              <span className="font-semibold text-green-700">Equilibrado</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded border border-blue-200 text-sm text-gray-700 mb-6">
            <p className="mb-2 font-medium">Como será a distribuição:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Sempre presenciais (always_office): {employees.filter(e => e.type === 'always_office').length} pessoas</li>
              <li>Sempre home office (always_home): {employees.filter(e => e.type === 'always_home').length} pessoas</li>
              <li>
                Distribuição variable: {includedCount} pessoas, das quais {distributionConfig.targetPerDay}
                ficarão presenciais todos os dias
              </li>
              <li>Distribuição equilibrada para manter consistência</li>
            </ul>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-3 rounded-lg font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-6 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* ===== BOTÃO APAGAR COM DESTAQUE ===== */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onClearAllSchedules}
          className="px-8 py-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Trash2 className="w-5 h-5" />
          🗑️ Apagar Todas as Escalas
        </button>
      </div>

      {/* ===== OVERLAY DE LOADING FULL-SCREEN (BLOQUEIA TODA A INTERFACE) ===== */}
      {isApplying && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]"
          style={{
            cursor: 'wait',
            pointerEvents: 'all'
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.preventDefault()}
        >
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            {/* Spinner */}
            <div className="flex justify-center mb-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              </div>
            </div>

            {/* Texto */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">Distribuindo Escalas...</h3>
            <p className="text-sm text-gray-600 mb-6">
              Processando distribuição equilibrada e salvando no banco de dados.<br/>
              Por favor, aguarde...
            </p>

            {/* Linhas de progresso animadas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full bg-blue-600 animate-pulse" style={{ width: '100%' }}></div>
                </div>
                <span className="text-xs text-gray-500 font-medium">Calculando...</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full bg-green-600 animate-pulse" style={{ width: '100%' }}></div>
                </div>
                <span className="text-xs text-gray-500 font-medium">Salvando...</span>
              </div>
            </div>

            {/* Mensagem de dica */}
            <p className="text-xs text-gray-400 mt-6">
              Por favor aguarde, você será notificado quando a operação terminar...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoTab;
