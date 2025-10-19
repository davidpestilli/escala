import React from 'react';
import { Edit, X } from 'lucide-react';
import { Employee, Vacations, Change } from '../../types';
import { employeeTypes, workingHours } from '../../constants';

interface PersonCardProps {
  person: Employee;
  status: string;
  statusIcon: Record<string, string>;
  isExpanded: boolean;
  currentEditData: Employee;
  editingPerson: Employee | null;
  hasUnsavedChanges: boolean;
  activePersonTab: string;
  vacations: Vacations;
  expandedPersonId: number | null;
  setExpandedPersonId: React.Dispatch<React.SetStateAction<number | null>>;
  setEditingPerson: React.Dispatch<React.SetStateAction<Employee | null>>;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  setActivePersonTab: React.Dispatch<React.SetStateAction<string>>;
  showConfirm: (title: string, message: string, onConfirm: () => void, type?: string) => void;
  updatePerson: (personId: number, updates: Partial<Employee>) => void;
}

export const PersonCard: React.FC<PersonCardProps> = ({
  person,
  status,
  statusIcon,
  isExpanded,
  currentEditData,
  editingPerson,
  hasUnsavedChanges,
  activePersonTab,
  vacations,
  expandedPersonId,
  setExpandedPersonId,
  setEditingPerson,
  setHasUnsavedChanges,
  setActivePersonTab,
  showConfirm,
  updatePerson
}) => {
  return (
    <div
      className={`transition-all duration-300 rounded-lg ${
        isExpanded 
          ? 'border-2 border-blue-500 bg-blue-50 shadow-lg' 
          : 'border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg">{statusIcon[status] || '⚪'}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-base truncate flex items-center gap-2">
                {person.name}
                {person.isManager && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    Gestor
                  </span>
                )}
              </div>
              {person.team && (
                <div className="text-sm text-gray-600 mt-1">{person.team}</div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setExpandedPersonId(person.id);
                setEditingPerson(person);
                setHasUnsavedChanges(false);
                setActivePersonTab('dados');
              }}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Editar pessoa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                showConfirm(
                  '❌ Excluir Pessoa',
                  `Tem certeza que deseja excluir ${person.name}?`,
                  () => {
                    // This would need to be passed as a prop or implemented in the parent
                    console.log('Delete person', person.id);
                  },
                  'danger'
                );
              }}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Excluir pessoa"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="mt-3">
          <button
            onClick={() => {
              if (isExpanded) {
                setExpandedPersonId(null);
                setEditingPerson(null);
                setHasUnsavedChanges(false);
              } else {
                setExpandedPersonId(person.id);
                setActivePersonTab('dados');
              }
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            📋 {isExpanded ? 'Fechar Detalhes' : 'Ver Detalhes'}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-blue-200 bg-white person-card-expanded">
          <div className="p-6">
            {/* Header da expansão com abas */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setActivePersonTab('dados')}
                  className={`pb-2 px-1 border-b-2 transition-colors ${
                    activePersonTab === 'dados' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📋 Dados Básicos
                </button>
                <button
                  onClick={() => setActivePersonTab('escala')}
                  className={`pb-2 px-1 border-b-2 transition-colors ${
                    activePersonTab === 'escala' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📅 Escala & Férias
                </button>
                <button
                  onClick={() => setActivePersonTab('cobertura')}
                  className={`pb-2 px-1 border-b-2 transition-colors ${
                    activePersonTab === 'cobertura' 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🕘 Cobertura Horária
                </button>
              </div>
              
              {hasUnsavedChanges && editingPerson && editingPerson.id === person.id && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-orange-600 font-medium">• Alterações não salvas</span>
                  <button
                    onClick={() => {
                      if (editingPerson) {
                        updatePerson(person.id, editingPerson);
                        setHasUnsavedChanges(false);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    💾 Salvar
                  </button>
                </div>
              )}
            </div>

            {/* Conteúdo das Abas */}
            {activePersonTab === 'dados' && (
              <PersonDataTab
                person={person}
                editingPerson={editingPerson}
                currentEditData={currentEditData}
                setEditingPerson={setEditingPerson}
                setHasUnsavedChanges={setHasUnsavedChanges}
              />
            )}

            {activePersonTab === 'escala' && (
              <PersonScheduleTab
                person={person}
                vacations={vacations}
              />
            )}

            {activePersonTab === 'cobertura' && (
              <PersonCoverageTab person={person} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Person Data Tab Component
const PersonDataTab: React.FC<{
  person: Employee;
  editingPerson: Employee | null;
  currentEditData: Employee;
  setEditingPerson: React.Dispatch<React.SetStateAction<Employee | null>>;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ person, editingPerson, currentEditData, setEditingPerson, setHasUnsavedChanges }) => {
  if (editingPerson && editingPerson.id === person.id) {
    // Modo Edição
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={currentEditData.name}
              onChange={(e) => {
                setEditingPerson(prev => ({ ...prev!, name: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipe</label>
            <input
              type="text"
              value={currentEditData.team || ''}
              onChange={(e) => {
                setEditingPerson(prev => ({ ...prev!, team: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Regime de Trabalho</label>
          <select
            value={currentEditData.type}
            onChange={(e) => {
              setEditingPerson(prev => ({ ...prev!, type: e.target.value as any }));
              setHasUnsavedChanges(true);
            }}
            className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="variable">Presença Variável</option>
            <option value="always_office">Sempre Presencial</option>
            <option value="always_home">Sempre Home Office</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horário de Trabalho</label>
          <select
            value={currentEditData.workingHours || '9-17'}
            onChange={(e) => {
              setEditingPerson(prev => ({ ...prev!, workingHours: e.target.value as any }));
              setHasUnsavedChanges(true);
            }}
            className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(workingHours).map(([key, hours]) => (
              <option key={key} value={key}>{hours.label}</option>
            ))}
          </select>
          <div className="text-xs text-gray-500 mt-1">
            Define as janelas horárias que você pode cobrir
          </div>
        </div>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={currentEditData.isManager || false}
            onChange={(e) => {
              setEditingPerson(prev => ({ ...prev!, isManager: e.target.checked }));
              setHasUnsavedChanges(true);
            }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm">Gestor</span>
        </label>

        {/* Variable employee preferences */}
        {currentEditData.type === 'variable' && (
          <div className="border-t pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dias presenciais por semana (orientativo)
              </label>
              <select
                value={currentEditData.officeDays || 3}
                onChange={(e) => {
                  setEditingPerson(prev => ({ ...prev!, officeDays: Number(e.target.value) }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3 py-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value={1}>1 dia</option>
                <option value={2}>2 dias</option>
                <option value={3}>3 dias</option>
                <option value={4}>4 dias</option>
                <option value={5}>5 dias</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dias Preferenciais em Home Office
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { key: 'monday', label: 'Segunda' },
                  { key: 'tuesday', label: 'Terça' },
                  { key: 'wednesday', label: 'Quarta' },
                  { key: 'thursday', label: 'Quinta' },
                  { key: 'friday', label: 'Sexta' }
                ].map(day => (
                  <label key={day.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(currentEditData.preferences || {})[day.key] === 'home'}
                      onChange={(e) => {
                        const newPreferences = { ...(currentEditData.preferences || {}) };
                        if (e.target.checked) {
                          newPreferences[day.key] = 'home';
                        } else {
                          delete newPreferences[day.key];
                        }
                        setEditingPerson(prev => ({ 
                          ...prev!, 
                          preferences: newPreferences 
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    // Modo Visualização
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Regime de Trabalho</div>
            <div className="font-medium">{employeeTypes[person.type]}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Horário de Trabalho</div>
            <div className="font-medium">{workingHours[person.workingHours || '9-17']?.label || 'Não definido'}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Dias Presencial (Orientativo)</div>
            <div className="font-medium">{person.officeDays || 0} dias/semana</div>
          </div>
        </div>
        
        <div className="pt-3">
          <button
            onClick={() => {
              setEditingPerson(person);
              setHasUnsavedChanges(false);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ✏️ Editar Dados
          </button>
        </div>
      </div>
    );
  }
};

// Person Schedule Tab Component
const PersonScheduleTab: React.FC<{
  person: Employee;
  vacations: Vacations;
}> = ({ person, vacations }) => {
  return (
    <div className="space-y-6">
      {vacations[person.id] && (
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">🟠 Período de Férias Configurado</div>
          <div className="font-medium">
            {new Date(vacations[person.id].start).toLocaleDateString()} a {new Date(vacations[person.id].end).toLocaleDateString()}
          </div>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">📋 Informações da Escala</div>
        <div className="text-sm text-gray-700">
          Para visualizar e editar a escala detalhada desta pessoa, 
          utilize o <strong>calendário principal</strong> na aba "Calendário".
          Lá você pode clicar nos nomes para alternar entre presencial e home office.
        </div>
      </div>
    </div>
  );
};

// Person Coverage Tab Component
const PersonCoverageTab: React.FC<{
  person: Employee;
}> = ({ person }) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">🕘 Cobertura de Horários</div>
        <div className="text-sm text-gray-700">
          Esta pessoa pode cobrir as janelas horárias baseado em seu horário de trabalho: {workingHours[person.workingHours || '9-17']?.label}
        </div>
      </div>
    </div>
  );
};