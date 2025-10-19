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
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      
      const formattedEmployees = data?.map(emp => ({
        id: emp.id,
        name: emp.name,
        type: emp.type,
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
      const { data, error } = await supabase
        .from('employees')
        .insert({
          name: employee.name,
          type: employee.type,
          is_manager: employee.isManager,
          team: employee.team,
          preferences: employee.preferences,
          office_days: employee.officeDays,
          working_hours: employee.workingHours,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      const newEmployee = {
        id: data.id,
        name: data.name,
        type: data.type,
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
      const { data, error } = await supabase
        .from('employees')
        .update({
          name: updates.name,
          type: updates.type,
          is_manager: updates.isManager,
          team: updates.team,
          preferences: updates.preferences,
          office_days: updates.officeDays,
          working_hours: updates.workingHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setEmployees(prev => prev.map(emp => 
        emp.id === id ? {
          id: data.id,
          name: data.name,
          type: data.type,
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
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

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
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id);

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
      const { error } = await supabase
        .from('schedules')
        .upsert({
          employee_id: employeeId,
          date: date,
          status: status,
          user_id: user.id
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

  useEffect(() => {
    loadSchedules();
  }, [user]);

  return {
    schedules,
    loading,
    setEmployeeStatus,
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
      const { data, error } = await supabase
        .from('vacations')
        .select('*')
        .eq('user_id', user.id);

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
      const { error } = await supabase
        .from('vacations')
        .upsert({
          employee_id: employeeId,
          start_date: start,
          end_date: end,
          user_id: user.id
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
      const { error } = await supabase
        .from('vacations')
        .delete()
        .eq('employee_id', employeeId)
        .eq('user_id', user.id);

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
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          maxCapacity: data.max_capacity,
          targetOfficeCount: data.target_office_count,
          targetOfficeMode: data.target_office_mode
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
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          max_capacity: newSettings.maxCapacity,
          target_office_count: newSettings.targetOfficeCount,
          target_office_mode: newSettings.targetOfficeMode,
          user_id: user.id
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