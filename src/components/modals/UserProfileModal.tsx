import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Omit<UserProfile, 'id'> | UserProfile) => Promise<void>;
  profile?: UserProfile | null;
  title: string;
  teams: Team[];
  currentUserRole: 'admin' | 'manager' | 'employee';
}

export default function UserProfileModal({
  isOpen,
  onClose,
  onSave,
  profile,
  title,
  teams,
  currentUserRole
}: UserProfileModalProps) {
  const [formData, setFormData] = useState({
    user_email: '',
    nick: '',
    role: 'employee' as 'admin' | 'manager' | 'employee',
    team_id: '' as string
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        user_email: profile.user_email,
        nick: profile.nick,
        role: profile.role,
        team_id: profile.team_id || ''
      });
    } else {
      setFormData({
        user_email: '',
        nick: '',
        role: 'employee',
        team_id: ''
      });
    }
    setError('');
  }, [profile, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.user_email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!formData.nick.trim()) {
      setError('Nick é obrigatório');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.user_email)) {
      setError('Email inválido');
      return;
    }

    // Validar se manager está tentando criar admin ou manager
    if (currentUserRole === 'manager' && formData.role !== 'employee') {
      setError('Gerentes só podem criar usuários comuns');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const dataToSave = {
        ...formData,
        team_id: formData.team_id || null
      };

      if (profile) {
        await onSave({ ...profile, ...dataToSave });
      } else {
        await onSave(dataToSave);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar perfil de usuário');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // Opções de role baseadas no papel do usuário atual
  const roleOptions = currentUserRole === 'admin'
    ? [
        { value: 'admin', label: '👑 Administrador', description: 'Acesso total, pode criar gerentes' },
        { value: 'manager', label: '👨‍💼 Gerente', description: 'Pode criar usuários comuns' },
        { value: 'employee', label: '👤 Colaborador', description: 'Acesso básico ao sistema' }
      ]
    : [
        { value: 'employee', label: '👤 Colaborador', description: 'Acesso básico ao sistema' }
      ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email do Usuário *
              </label>
              <input
                type="email"
                value={formData.user_email}
                onChange={(e) => setFormData(prev => ({ ...prev, user_email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="usuario@exemplo.com"
                disabled={isSaving || !!profile}
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                Email que o usuário usa para fazer login no sistema
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nick (Apelido) *
              </label>
              <input
                type="text"
                value={formData.nick}
                onChange={(e) => setFormData(prev => ({ ...prev, nick: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: João Silva"
                disabled={isSaving}
              />
              <p className="mt-1 text-xs text-gray-500">
                Nome que será exibido no sistema
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Papel no Sistema *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSaving}
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {roleOptions.find(o => o.value === formData.role)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipe
              </label>
              <select
                value={formData.team_id}
                onChange={(e) => setFormData(prev => ({ ...prev, team_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSaving}
              >
                <option value="">Sem equipe</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
