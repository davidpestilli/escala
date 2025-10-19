import React, { useState } from 'react';
import { User, Edit2, Trash2, Plus, Mail, Shield } from 'lucide-react';
import UserProfileModal from '../modals/UserProfileModal';
import ConfirmModal from '../modals/ConfirmModal';

interface Team {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  user_email: string;
  nick: string;
  role: 'admin' | 'manager' | 'employee';
  team_id: string | null;
}

interface UsersTabProps {
  users: UserProfile[];
  teams: Team[];
  onAddUser: (user: Omit<UserProfile, 'id'>) => Promise<void>;
  onUpdateUser: (user: UserProfile) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  currentUserRole: 'admin' | 'manager' | 'employee';
}

export default function UsersTab({
  users,
  teams,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUserRole
}: UsersTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  const canManageUsers = currentUserRole === 'admin' || currentUserRole === 'manager';

  const handleEdit = (user: UserProfile) => {
    // Manager só pode editar employees
    if (currentUserRole === 'manager' && user.role !== 'employee') {
      return;
    }
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: UserProfile) => {
    // Manager só pode excluir employees
    if (currentUserRole === 'manager' && user.role !== 'employee') {
      return;
    }
    setDeletingUser(user);
  };

  const confirmDelete = async () => {
    if (deletingUser) {
      await onDeleteUser(deletingUser.id);
      setDeletingUser(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = async (user: Omit<UserProfile, 'id'> | UserProfile) => {
    if ('id' in user) {
      await onUpdateUser(user);
    } else {
      await onAddUser(user);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
            <Shield className="w-3 h-3" />
            Administrador
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            <Shield className="w-3 h-3" />
            Gerente
          </span>
        );
      case 'employee':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
            <User className="w-3 h-3" />
            Colaborador
          </span>
        );
      default:
        return null;
    }
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return 'Sem equipe';
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Equipe não encontrada';
  };

  const canEdit = (user: UserProfile) => {
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'manager' && user.role === 'employee') return true;
    return false;
  };

  const canDelete = (user: UserProfile) => {
    if (currentUserRole === 'admin') return true;
    if (currentUserRole === 'manager' && user.role === 'employee') return true;
    return false;
  };

  if (currentUserRole === 'employee') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Você não tem permissão para acessar a gestão de usuários.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h2>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie perfis de usuários e suas permissões
          </p>
        </div>
        {canManageUsers && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário cadastrado</h3>
          <p className="text-gray-600 mb-4">Crie o primeiro perfil de usuário para começar</p>
          {canManageUsers && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Usuário
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Papel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipe
                </th>
                {canManageUsers && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{user.nick}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {user.user_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getTeamName(user.team_id)}
                  </td>
                  {canManageUsers && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        {canEdit(user) && (
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete(user) && (
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserProfileModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        profile={editingUser}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        teams={teams}
        currentUserRole={currentUserRole}
      />

      <ConfirmModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={confirmDelete}
        title="Excluir Usuário"
        message={`Tem certeza que deseja excluir o usuário "${deletingUser?.nick}"?`}
        confirmText="Excluir"
        type="danger"
      />
    </div>
  );
}
