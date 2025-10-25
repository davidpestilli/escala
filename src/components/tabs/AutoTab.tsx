// src/components/tabs/AutoTab.tsx
import React, { useState, useMemo } from 'react';
import { Trash2, Check, X, ChevronDown } from 'lucide-react';
import { Employee } from '../../types';

interface AutoTabProps {
  employees: Employee[];
  userRole: string;
  targetOfficeCount: number;
  onApplyCustomDistribution: (config: {
    officeDays: number;
    targetPerDay: number;
    excludedEmployeeIds: number[];
  }) => void;
  onClearAllSchedules: () => void;
}

interface DistributionConfig {
  officeDays: number | null;
  targetPerDay: number | null;
  excludedEmployeeIds: number[];
}

const AutoTab: React.FC<AutoTabProps> = ({
  employees,
  userRole,
  targetOfficeCount,
  onApplyCustomDistribution,
  onClearAllSchedules
}) => {
  const [distributionConfig, setDistributionConfig] = useState<DistributionConfig>({
    officeDays: null,
    targetPerDay: null,
    excludedEmployeeIds: []
  });

  const [showResumo, setShowResumo] = useState(false);
  const [isPersonListOpen, setIsPersonListOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  if (userRole === 'employee') {
    return null;
  }

  // 1. Filtrar apenas pessoas disponíveis (variable)
  const availableEmployees = useMemo(() => {
    return employees.filter(emp => emp.type === 'variable');
  }, [employees]);

  // 2. Contar pessoas incluídas (não excluídas)
  const includedCount = useMemo(() => {
    return availableEmployees.filter(
      emp => !distributionConfig.excludedEmployeeIds.includes(emp.id)
    ).length;
  }, [availableEmployees, distributionConfig.excludedEmployeeIds]);

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

    // Chamar a função de distribuição
    onApplyCustomDistribution({
      officeDays: distributionConfig.officeDays!,
      targetPerDay: distributionConfig.targetPerDay!,
      excludedEmployeeIds: distributionConfig.excludedEmployeeIds
    });

    // Aguardar um tempo para as operações de Supabase serem concluídas
    // (a função onApplyCustomDistribution é assíncrona mas não retorna Promise)
    setTimeout(() => {
      setIsApplying(false);
      setShowResumo(false);
      setDistributionConfig({
        officeDays: null,
        targetPerDay: null,
        excludedEmployeeIds: []
      });
    }, 2000);
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
              <div>• Variable: {availableEmployees.length}</div>
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
                    return (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between p-3 rounded border border-gray-200 hover:bg-gray-50 transition"
                      >
                        <span className={isExcluded ? 'text-gray-400 line-through' : 'text-gray-900'}>
                          {emp.name}
                        </span>
                        <button
                          onClick={() => toggleExcludePerson(emp.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                            isExcluded
                              ? 'bg-red-100 border-red-500'
                              : 'bg-white border-green-500 hover:bg-green-50'
                          }`}
                          title={isExcluded ? 'Incluir nesta pessoa' : 'Excluir esta pessoa da distribuição'}
                        >
                          {isExcluded && <X className="w-4 h-4 text-red-600" />}
                          {!isExcluded && <Check className="w-4 h-4 text-green-600 opacity-0 group-hover:opacity-100" />}
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

          {/* Aviso */}
          {distributionConfig.officeDays && distributionConfig.targetPerDay && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              ℹ️ Será distribuído: {includedCount} pessoas × {distributionConfig.officeDays} dias presenciais
              = {(includedCount * distributionConfig.officeDays)} presenças no mês
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

      {/* ===== MODAL DE LOADING ===== */}
      {isApplying && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-fade-in">
            {/* Spinner */}
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-blue-600 animate-spin"></div>
              </div>
            </div>

            {/* Texto */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Distribuindo Escalas...</h3>
            <p className="text-sm text-gray-600 mb-4">
              Processando distribuição equilibrada e salvando no banco de dados
            </p>

            {/* Linhas de progresso animadas */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full bg-blue-600 animate-pulse" style={{ width: '33%' }}></div>
                </div>
                <span className="text-xs text-gray-500">Calculando...</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-200 rounded overflow-hidden">
                  <div className="h-full bg-green-600 animate-pulse" style={{ width: '66%' }}></div>
                </div>
                <span className="text-xs text-gray-500">Salvando...</span>
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
