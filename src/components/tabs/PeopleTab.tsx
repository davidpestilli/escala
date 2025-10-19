import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { employeeTypes } from '../../constants/index.ts';
import { getFilteredPeople } from '../../utils/filterUtils.ts';
import { getSortedEmployees } from '../../utils/displayUtils.ts';

const PeopleTab = ({
  // Data
  employees,
  vacations,
  
  // UI State
  personFilters,
  setPersonFilters,
  userRole,
  targetOfficeCount,
  setTargetOfficeCount,
  targetOfficeMode,
  setTargetOfficeMode,
  
  // Modal controls
  setShowImportModal,
  setShowAddEmployee,
  
  // Functions
  showConfirm,
  updatePerson
}) => {
  const filteredPeople = getFilteredPeople(employees, personFilters);

  if (userRole === 'employee') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Gerenciar Pessoas</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 font-medium">Meta presencial:</span>
                <input
                  type="number"
                  value={targetOfficeCount}
                  onChange={(e) => setTargetOfficeCount(Number(e.target.value))}
                  className="w-16 px-2 py-1 border rounded text-center font-medium"
                  min="0"
                />
                <span className="text-sm text-gray-700">pessoas</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FileText className="w-4 h-4" />
              Importar Lista
            </button>
            <button
              onClick={() => setShowAddEmployee(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Adicionar Nova Pessoa
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar por nome
            </label>
            <input
              type="text"
              placeholder="Buscar..."
              value={personFilters.name}
              onChange={(e) => setPersonFilters(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={personFilters.type}
              onChange={(e) => setPersonFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Todos</option>
              <option value="manager">Gestores</option>
              <option value="employee">Colaboradores</option>
            </select>
          </div>
        </div>

        {/* People List */}
        <div className="border rounded-lg p-4" style={{ maxHeight: '70vh', minHeight: '60vh' }}>
          {employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma pessoa cadastrada</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Comece adicionando pessoas individualmente ou importe uma lista completa de uma só vez.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <FileText className="w-4 h-4" />
                  Importar Lista
                </button>
                <button
                  onClick={() => setShowAddEmployee(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Pessoa
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {getSortedEmployees(filteredPeople).map(person => (
                <div
                  key={person.id}
                  className="border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 rounded-lg"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-lg">👤</span>
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
                          <div className="text-sm text-gray-500 mt-1">
                            {employeeTypes[person.type]}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { PeopleTab };