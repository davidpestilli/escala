import React, { useState } from 'react';
import { Users, Edit2, Trash2, Plus } from 'lucide-react';
import TeamModal from '../modals/TeamModal';
import ConfirmModal from '../modals/ConfirmModal';

interface Team {
  id: string;
  name: string;
  description: string;
}

interface TeamsTabProps {
  teams: Team[];
  onAddTeam: (team: Omit<Team, 'id'>) => Promise<void>;
  onUpdateTeam: (team: Team) => Promise<void>;
  onDeleteTeam: (teamId: string) => Promise<void>;
  userRole: 'admin' | 'manager' | 'employee';
}

export default function TeamsTab({ teams, onAddTeam, onUpdateTeam, onDeleteTeam, userRole }: TeamsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  const canManageTeams = userRole === 'admin' || userRole === 'manager';

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleDelete = (team: Team) => {
    setDeletingTeam(team);
  };

  const confirmDelete = async () => {
    if (deletingTeam) {
      await onDeleteTeam(deletingTeam.id);
      setDeletingTeam(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
  };

  const handleSave = async (team: Omit<Team, 'id'> | Team) => {
    if ('id' in team) {
      await onUpdateTeam(team);
    } else {
      await onAddTeam(team);
    }
  };

  if (userRole === 'employee') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Você não tem permissão para acessar a gestão de equipes.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Equipes</h2>
          <p className="text-gray-600 text-sm mt-1">Crie e gerencie equipes da organização</p>
        </div>
        {canManageTeams && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Equipe
          </button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma equipe cadastrada</h3>
          <p className="text-gray-600 mb-4">Crie sua primeira equipe para começar</p>
          {canManageTeams && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Equipe
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <div
              key={team.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{team.name}</h3>
                </div>
                {canManageTeams && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(team)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(team)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {team.description && (
                <p className="text-sm text-gray-600">{team.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <TeamModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        team={editingTeam}
        title={editingTeam ? 'Editar Equipe' : 'Nova Equipe'}
      />

      <ConfirmModal
        isOpen={!!deletingTeam}
        onClose={() => setDeletingTeam(null)}
        onConfirm={confirmDelete}
        title="Excluir Equipe"
        message={`Tem certeza que deseja excluir a equipe "${deletingTeam?.name}"?`}
        confirmText="Excluir"
        type="danger"
      />
    </div>
  );
}
