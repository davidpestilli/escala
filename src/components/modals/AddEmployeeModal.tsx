import React, { useState, useEffect } from 'react';
import { workingHours } from '../../constants/index.ts';

const AddEmployeeModal = ({
  showAddEmployee,
  newEmployee,
  setNewEmployee,
  setShowAddEmployee,
  onAddEmployee,
  userProfiles = [],
  teams = []
}) => {
  const [nickInput, setNickInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Resetar ao abrir/fechar
  useEffect(() => {
    if (showAddEmployee) {
      setNickInput('');
      setSelectedProfile(null);
      setShowSuggestions(false);
    }
  }, [showAddEmployee]);

  // Buscar sugestões de nicks
  const suggestions = userProfiles.filter(profile =>
    profile.nick.toLowerCase().includes(nickInput.toLowerCase()) && nickInput.length > 0
  );

  const handleNickChange = (e) => {
    const value = e.target.value;
    setNickInput(value);
    setShowSuggestions(value.length > 0);

    // Limpar seleção se o usuário mudar o input
    if (selectedProfile && value !== selectedProfile.nick) {
      setSelectedProfile(null);
      setNewEmployee(prev => ({ ...prev, name: value, team: '' }));
    }
  };

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
    setNickInput(profile.nick);
    setShowSuggestions(false);

    // Buscar nome da equipe
    const team = teams.find(t => t.id === profile.team_id);
    const teamName = team ? team.name : '';

    // Auto-preencher dados
    setNewEmployee(prev => ({
      ...prev,
      name: profile.nick,
      team: teamName,
      isManager: profile.role === 'manager' || profile.role === 'admin'
    }));
  };

  if (!showAddEmployee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Configurar Escala</h3>
          <div className="space-y-3">
            {/* Campo Nick com Autocomplete */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nick do Usuário *
              </label>
              <input
                type="text"
                placeholder="Digite o nick..."
                value={nickInput}
                onChange={handleNickChange}
                onFocus={() => setShowSuggestions(nickInput.length > 0)}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg"
              />

              {/* Sugestões de autocomplete */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.map(profile => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => handleSelectProfile(profile)}
                      className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{profile.nick}</div>
                      <div className="text-xs text-gray-600">{profile.user_email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Campo Equipe (auto-preenchido) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipe
              </label>
              <input
                type="text"
                placeholder="Equipe (preenchido automaticamente)"
                value={newEmployee.team}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
            </div>

            {/* Regime de Trabalho */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Regime de Trabalho *
              </label>
              <select
                value={newEmployee.type}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg"
              >
                <option value="variable">Presença Variável</option>
                <option value="always_office">Sempre Presencial</option>
                <option value="always_home">Sempre Home Office</option>
              </select>
            </div>

            {/* Horário de Trabalho */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horário de Trabalho *
              </label>
              <select
                value={newEmployee.workingHours}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, workingHours: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg"
              >
                {Object.entries(workingHours).map(([key, hours]) => (
                  <option key={key} value={key}>{hours.label}</option>
                ))}
              </select>
            </div>

            {/* Campos específicos para Presença Variável */}
            {newEmployee.type === 'variable' && (
              <>
                {/* Dias Presenciais por Semana */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dias Presenciais por Semana *
                  </label>
                  <select
                    value={newEmployee.officeDays || 3}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, officeDays: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg"
                  >
                    <option value="1">1 dia/semana</option>
                    <option value="2">2 dias/semana</option>
                    <option value="3">3 dias/semana</option>
                    <option value="4">4 dias/semana</option>
                    <option value="5">5 dias/semana</option>
                  </select>
                </div>

                {/* Dias Preferenciais em Home Office */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dias Preferenciais em Home Office
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'monday', label: 'Segunda-feira' },
                      { key: 'tuesday', label: 'Terça-feira' },
                      { key: 'wednesday', label: 'Quarta-feira' },
                      { key: 'thursday', label: 'Quinta-feira' },
                      { key: 'friday', label: 'Sexta-feira' }
                    ].map(day => (
                      <label key={day.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(newEmployee.preferences || {})[day.key] === 'home'}
                          onChange={(e) => {
                            const newPreferences = { ...(newEmployee.preferences || {}) };
                            if (e.target.checked) {
                              newPreferences[day.key] = 'home';
                            } else {
                              delete newPreferences[day.key];
                            }
                            setNewEmployee(prev => ({ ...prev, preferences: newPreferences }));
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowAddEmployee(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              onClick={onAddEmployee}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={!selectedProfile}
            >
              Salvar Detalhes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { AddEmployeeModal };
