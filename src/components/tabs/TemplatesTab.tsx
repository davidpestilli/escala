// src/components/tabs/TemplatesTab.tsx
import React from 'react';
import { Copy, RotateCcw, Users, Edit } from 'lucide-react';
import { TEMPLATES, STATUS_COLORS, STATUS_LABELS } from '../../constants';
import { Employee } from '../../types';

interface TemplatesTabProps {
  applyTemplate: (templateKey: string, specificTeam?: string | null, respectPreferences?: boolean) => void;
  copyPreviousWeek: () => void;
  userRole: string;
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({
  applyTemplate,
  copyPreviousWeek,
  userRole
}) => {
  if (userRole === 'employee') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold mb-4">Templates de Escala</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Aplicar Template</h4>
            <div className="space-y-3 border rounded-lg p-4">
              {Object.entries(TEMPLATES).map(([key, template]) => (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{template.name}</h5>
                    <div className="flex gap-2">
                      <button
                        onClick={() => applyTemplate(key, null, false)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        title="Aplicar template substituindo todas as configurações"
                      >
                        Aplicar
                      </button>
                      {key !== 'manager_rotation' && key !== 'manual' && (
                        <button
                          onClick={() => applyTemplate(key, null, true)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          title="Aplicar template respeitando preferências individuais"
                        >
                          + Preferências
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {key === 'manager_rotation' ? (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-purple-600">Gestores</span>
                      </div>
                    ) : key === 'manual' ? (
                      <div className="flex items-center gap-1">
                        <Edit className="w-4 h-4 text-gray-600" />
                        <span className="text-xs text-gray-600">Controle Manual</span>
                      </div>
                    ) : (
                      template.pattern.map((status, index) => (
                        <div
                          key={index}
                          className={`w-4 h-4 rounded ${STATUS_COLORS[status as keyof typeof STATUS_COLORS]}`}
                          title={STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                        ></div>
                      ))
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {key === 'manager_rotation' 
                      ? 'Mínimo de 2 gestores presenciais por dia'
                      : key === 'manual'
                        ? 'Configuração manual no calendário'
                      : `Seg - Sex: ${template.pattern.join(' → ')}`
                    }
                  </div>
                  {template.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {template.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Ações Rápidas</h4>
            <div className="space-y-3 border rounded-lg p-4">
              <button
                onClick={copyPreviousWeek}
                className="w-full flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
              >
                <Copy className="w-4 h-4" />
                Replicar 1ª Semana
              </button>
              <button
                onClick={() => applyTemplate('4x1')}
                className="w-full flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200"
              >
                <RotateCcw className="w-4 h-4" />
                Aplicar 4x1
              </button>
              <button
                onClick={() => applyTemplate('manager_rotation')}
                className="w-full flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
              >
                <Users className="w-4 h-4" />
                Meta de Gestores
              </button>
              <button
                onClick={() => applyTemplate('manual')}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              >
                <Edit className="w-4 h-4" />
                Modo Manual
              </button>
            </div>

            {/* Informações sobre Templates */}
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">ℹ️ Como funcionam os Templates</h5>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• <strong>Aplicar:</strong> Substitui todas as configurações existentes</div>
                <div>• <strong>+ Preferências:</strong> Respeita dias preferidos de home office</div>
                <div>• <strong>Meta de Gestores:</strong> Garante mínimo de gestores presenciais</div>
                <div>• <strong>Modo Manual:</strong> Te dá controle total via calendário</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesTab;