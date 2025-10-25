import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './useAuth';

// Hook para gerenciar funcionários
export const useEmployees = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadEmployees = async () => {
    if (!user) return;

    try {
      // Buscar organização do usuário
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!orgData) {
        setEmployees([]);
        setLoading(false);
        return;
      }

      // Buscar employees da organização
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('organization_id', orgData.id)
        .order('name');

      if (error) throw error;

      const formattedEmployees = data?.map(emp => ({
        id: emp.id,
        name: emp.name,
        type: emp.employee_type,
        isManager: emp.is_manager,
        team: emp.team || '',
        preferences: emp.preferences || {},
        officeDays: emp.office_days,
        workingHours: emp.working_hours
      })) || [];

      setEmployees(formattedEmployees);
    } catch (error) {
      // Silenciar erro
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employee: any) => {
    if (!user) return;

    try {
      // Buscar organização do usuário
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!orgData) throw new Error('Organization not found');

      // Buscar o maior ID existente na organização
      const { data: maxIdData } = await supabase
        .from('employees')
        .select('id')
        .eq('organization_id', orgData.id)
        .order('id', { ascending: false })
        .limit(1)
        .single();

      // Gerar próximo ID (maior ID + 1, ou 1 se não houver nenhum)
      const nextId = maxIdData ? maxIdData.id + 1 : 1;

      const { data, error } = await supabase
        .from('employees')
        .insert({
          id: nextId,
          organization_id: orgData.id,
          name: employee.name,
          employee_type: employee.type,
          is_manager: employee.isManager,
          team: employee.team,
          preferences: employee.preferences || {},
          office_days: employee.officeDays,
          working_hours: employee.workingHours
        })
        .select()
        .single();

      if (error) throw error;

      const newEmployee = {
        id: data.id,
        name: data.name,
        type: data.employee_type,
        isManager: data.is_manager,
        team: data.team || '',
        preferences: data.preferences || {},
        officeDays: data.office_days,
        workingHours: data.working_hours
      };

      setEmployees(prev => [...prev, newEmployee]);
      return newEmployee;
    } catch (error) {
      // Silenciar erro
      throw error;
    }
  };

  const updateEmployee = async (id: string, updates: any) => {
    if (!user) return;

    try {
      // Buscar organização do usuário
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!orgData) throw new Error('Organization not found');

      const { data, error } = await supabase
        .from('employees')
        .update({
          name: updates.name,
          employee_type: updates.type,
          is_manager: updates.isManager,
          team: updates.team,
          preferences: updates.preferences,
          office_days: updates.officeDays,
          working_hours: updates.workingHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('organization_id', orgData.id)
        .select()
        .single();

      if (error) throw error;

      setEmployees(prev => prev.map(emp =>
        emp.id === id ? {
          id: data.id,
          name: data.name,
          type: data.employee_type,
          isManager: data.is_manager,
          team: data.team || '',
          preferences: data.preferences || {},
          officeDays: data.office_days,
          workingHours: data.working_hours
        } : emp
      ));
    } catch (error) {
      // Silenciar erro
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!user) return;

    try {
      // Buscar organização do usuário
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!orgData) throw new Error('Organization not found');

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
        .eq('organization_id', orgData.id);

      if (error) throw error;

      setEmployees(prev => prev.filter(emp => emp.id !== id));
    } catch (error) {
      // Silenciar erro
      throw error;
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [user]);

  return {
    employees,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    refresh: loadEmployees
  };
};

// Hook para gerenciar escalas
export const useSchedules = () => {
  const [schedules, setSchedules] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadSchedules = async () => {
    if (!user) return;

    try {
      // Buscar organização do usuário
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!orgData) {
        setSchedules({});
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('organization_id', orgData.id);

      if (error) throw error;

      const formattedSchedules: Record<string, Record<string, string>> = {};
      data?.forEach(schedule => {
        if (!formattedSchedules[schedule.employee_id]) {
          formattedSchedules[schedule.employee_id] = {};
        }
        formattedSchedules[schedule.employee_id][schedule.date] = schedule.status;
      });

      setSchedules(formattedSchedules);
    } catch (error) {
      // Silenciar erro
    } finally {
      setLoading(false);
    }
  };

  const setEmployeeStatus = async (employeeId: string, date: string, status: string) => {
    if (!user) return;

    try {
      // Buscar organização do usuário
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!orgData) throw new Error('Organization not found');

      const { error } = await supabase
        .from('schedules')
        .upsert({
          organization_id: orgData.id,
          employee_id: employeeId,
          date: date,
          status: status
        });

      if (error) throw error;

      setSchedules(prev => ({
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          [date]: status
        }
      }));
    } catch (error) {
      // Silenciar erro
      throw error;
    }
  };

  const clearAllSchedules = async () => {
    if (!user) return;

    try {
      // Buscar organização do usuário
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!orgData) throw new Error('Organization not found');

      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('organization_id', orgData.id);

      if (error) throw error;

      setSchedules({});
    } catch (error) {
      // Silenciar erro
      throw error;
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [user]);

  return {
    schedules,
    loading,
    setEmployeeStatus,
    clearAllSchedules,
    refresh: loadSchedules
  };
};

// Hook para gerenciar férias
export const useVacations = () => {
  const [vacations, setVacations] = useState<Record<string, { start: string; end: string }>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadVacations = async () => {
    if (!user) return;

    try {
      // Buscar organização do usuário
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!orgData) {
        setVacations({});
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('vacations')
        .select('*')
        .eq('organization_id', orgData.id);

      if (error) throw error;

      const formattedVacations: Record<string, { start: string; end: string }> = {};
      data?.forEach(vacation => {
        formattedVacations[vacation.employee_id] = {
          start: vacation.start_date,
          end: vacation.end_date
        };
      });

      setVacations(formattedVacations);
    } catch (error) {
      // Silenciar erro
    } finally {
      setLoading(false);
    }
  };

  const setPersonVacation = async (employeeId: string, start: string, end: string) => {
    if (!user) return;

    try {
      // Buscar organização do usuário
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!orgData) throw new Error('Organization not found');

      const { error } = await supabase
        .from('vacations')
        .upsert({
          organization_id: orgData.id,
          employee_id: employeeId,
          start_date: start,
          end_date: end
        });

      if (error) throw error;

      setVacations(prev => ({
        ...prev,
        [employeeId]: { start, end }
      }));
    } catch (error) {
      // Silenciar erro
      throw error;
    }
  };

  const removeVacation = async (employeeId: string) => {
    if (!user) return;

    try {
      // Buscar organização do usuário
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!orgData) throw new Error('Organization not found');

      const { error } = await supabase
        .from('vacations')
        .delete()
        .eq('employee_id', employeeId)
        .eq('organization_id', orgData.id);

      if (error) throw error;

      setVacations(prev => {
        const newVacations = { ...prev };
        delete newVacations[employeeId];
        return newVacations;
      });
    } catch (error) {
      // Silenciar erro
      throw error;
    }
  };

  useEffect(() => {
    loadVacations();
  }, [user]);

  return {
    vacations,
    loading,
    setPersonVacation,
    removeVacation,
    refresh: loadVacations
  };
};

// Hook para gerenciar configurações do sistema
export const useSystemSettings = () => {
  const [settings, setSettings] = useState({
    maxCapacity: 10,
    targetOfficeCount: 6,
    targetOfficeMode: 'absolute'
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadSettings = async () => {
    if (!user) return;

    try {
      // Buscar organização do usuário
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!orgData) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('organization_id', orgData.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          maxCapacity: data.value?.maxCapacity || 10,
          targetOfficeCount: data.value?.targetOfficeCount || 6,
          targetOfficeMode: data.value?.targetOfficeMode || 'absolute'
        });
      }
    } catch (error) {
      // Silenciar erro
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: any) => {
    if (!user) return;

    try {
      // Buscar organização do usuário
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!orgData) throw new Error('Organization not found');

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          organization_id: orgData.id,
          key: 'app_settings',
          value: {
            maxCapacity: newSettings.maxCapacity,
            targetOfficeCount: newSettings.targetOfficeCount,
            targetOfficeMode: newSettings.targetOfficeMode
          }
        });

      if (error) throw error;

      setSettings(newSettings);
    } catch (error) {
      // Silenciar erro
      throw error;
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user]);

  return {
    settings,
    loading,
    updateSettings,
    refresh: loadSettings
  };
};

// Hook para gerenciar equipes
export const useTeams = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadTeams = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) throw error;

      setTeams(data || []);
    } catch (error) {
      // Silenciar erro
    } finally {
      setLoading(false);
    }
  };

  const addTeam = async (team: { name: string; description: string }) => {
    if (!user) return;

    try {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!orgData) throw new Error('Organization not found');

      const { data, error } = await supabase
        .from('teams')
        .insert({
          organization_id: orgData.id,
          name: team.name,
          description: team.description
        })
        .select()
        .single();

      if (error) throw error;

      setTeams(prev => [...prev, data]);
      return data;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Já existe uma equipe com este nome');
      }
      throw error;
    }
  };

  const updateTeam = async (team: { id: string; name: string; description: string }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .update({
          name: team.name,
          description: team.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', team.id)
        .select()
        .single();

      if (error) throw error;

      setTeams(prev => prev.map(t => t.id === team.id ? data : t));
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Já existe uma equipe com este nome');
      }
      throw error;
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      setTeams(prev => prev.filter(t => t.id !== teamId));
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    loadTeams();
  }, [user]);

  return {
    teams,
    loading,
    addTeam,
    updateTeam,
    deleteTeam,
    refresh: loadTeams
  };
};

// Hook para gerenciar perfis de usuários
export const useUserProfiles = () => {
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadUserProfiles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('nick');

      if (error) throw error;

      setUserProfiles(data || []);

      // Carregar perfil do usuário atual
      const currentProfile = data?.find((p: any) => p.user_email === user.email);
      setCurrentUserProfile(currentProfile || null);
    } catch (error) {
      // Silenciar erro
    } finally {
      setLoading(false);
    }
  };

  const addUserProfile = async (profile: {
    user_email: string;
    nick: string;
    role: 'admin' | 'manager' | 'employee';
    team_id: string | null;
  }) => {
    if (!user) return;

    try {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!orgData) throw new Error('Organization not found');

      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          organization_id: orgData.id,
          user_email: profile.user_email,
          nick: profile.nick,
          role: profile.role,
          team_id: profile.team_id,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setUserProfiles(prev => [...prev, data]);
      return data;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Já existe um usuário com este email ou nick');
      }
      throw error;
    }
  };

  const updateUserProfile = async (profile: {
    id: string;
    nick: string;
    role: 'admin' | 'manager' | 'employee';
    team_id: string | null;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          nick: profile.nick,
          role: profile.role,
          team_id: profile.team_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfiles(prev => prev.map(p => p.id === profile.id ? data : p));

      // Atualizar perfil atual se for o mesmo usuário
      if (data.user_email === user.email) {
        setCurrentUserProfile(data);
      }
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Já existe um usuário com este nick');
      }
      throw error;
    }
  };

  const deleteUserProfile = async (profileId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      setUserProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    loadUserProfiles();
  }, [user]);

  return {
    userProfiles,
    currentUserProfile,
    loading,
    addUserProfile,
    updateUserProfile,
    deleteUserProfile,
    refresh: loadUserProfiles
  };
};