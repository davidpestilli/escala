import React, { useState, useEffect } from 'react';
import { Calendar, Users, User, Home, Download, Filter, Plus, AlertTriangle, Settings, Copy, RotateCcw, FileText, Edit, X, HelpCircle, Trash2, Save, FolderOpen, Archive, Shield, LogOut } from 'lucide-react';
import { useTeams, useUserProfiles, useEmployees, useSchedules, clearAllVacationsFromOrg, clearAllHolidaysFromOrg, clearAllWeekendShiftsFromOrg } from '../hooks/useSupabaseData';
import { useAuth } from '../hooks/useAuth';
import TeamsTab from './tabs/TeamsTab';
import UsersTab from './tabs/UsersTab';
import AutoTab from './tabs/AutoTab';
import { AddEmployeeModal } from './modals/AddEmployeeModal';

const ScheduleApp = () => {
  // Hooks para autenticação
  const { user, signOut } = useAuth();

  // Hooks para equipes e perfis de usuário
  const { teams: dbTeams, addTeam, updateTeam, deleteTeam } = useTeams();
  const { userProfiles, currentUserProfile, addUserProfile, updateUserProfile, deleteUserProfile } = useUserProfiles();
  const { employees: dbEmployees, addEmployee: addEmployeeDb, updateEmployee: updateEmployeeDb, deleteEmployee: deleteEmployeeDb } = useEmployees();
  const { schedules: dbSchedules, setEmployeeStatus: setEmployeeStatusDb, clearAllSchedules: clearAllSchedulesDb, refresh: refreshSchedules } = useSchedules();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState([]);

  const [schedules, setSchedules] = useState({});
  const [vacations, setVacations] = useState({});
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [filtersSidebarExpanded, setFiltersSidebarExpanded] = useState(false);

  // Role agora vem do perfil do banco, com fallback para 'employee' se não houver perfil
  const userRole = currentUserProfile?.role || 'employee';
  const userNick = currentUserProfile?.nick || 'Usuário';
  
  // Estados para sistema de múltiplos salvamentos
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [savedSchedules, setSavedSchedules] = useState({
    slot1: null,
    slot2: null,
    slot3: null
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  
  const [filters, setFilters] = useState({ employee: '', team: 'VAZIO', currentStatus: '' });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [newEmployee, setNewEmployee] = useState({
    name: '', type: 'variable', isManager: false, team: '', officeDays: 3, workingHours: '9-17'
  });

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [editingPerson, setEditingPerson] = useState(null);
  const [expandedPersonId, setExpandedPersonId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activePersonTab, setActivePersonTab] = useState('dados');
  const [personFilters, setPersonFilters] = useState({ name: '', type: '', team: 'VAZIO' });
  const [showNickSuggestions, setShowNickSuggestions] = useState(false);
  const [showCalendarSuggestions, setShowCalendarSuggestions] = useState(false);
  const [showVacationForm, setShowVacationForm] = useState(false);
  const [vacationPersonId, setVacationPersonId] = useState(null);
  const [vacationData, setVacationData] = useState({ start: '', end: '' });
  const [changeHistory, setChangeHistory] = useState([]);
  const [holidays, setHolidays] = useState({});
  const [holidayStaff, setHolidayStaff] = useState({});
  const [weekendShifts, setWeekendShifts] = useState({});
  const [weekendStaff, setWeekendStaff] = useState({});
  const [targetOfficeCount, setTargetOfficeCount] = useState(6);
  const [targetOfficeMode, setTargetOfficeMode] = useState('absolute');
  const [showHelp, setShowHelp] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState('basico');
  
  // Estados para modal de template manual
  const [showManualTemplateModal, setShowManualTemplateModal] = useState(false);
  const [manualTemplateOption, setManualTemplateOption] = useState('blank');
  
  // Estados para relatórios avançados
  const [reportPeriodMode, setReportPeriodMode] = useState('month');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [selectedReportMonth, setSelectedReportMonth] = useState(currentDate);

  // Estados para modais de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    onConfirm: () => {},
    onCancel: () => {},
    type: 'warning'
  });

  const statusColors = {
    office: 'bg-green-500',
    home: 'bg-blue-500',
    vacation: 'bg-orange-500',
    holiday: 'bg-gray-500'
  };

  const statusLabels = {
    office: '🟢 Presencial',
    home: '🔵 Home Office',
    vacation: '🟠 Férias',
    holiday: '⚫ Plantão/Feriado'
  };

  const employeeTypes = {
    always_office: 'Sempre Presencial',
    always_home: 'Sempre Home Office',
    variable: 'Presença Variável'
  };

  const workingHours = {
    '9-17': { label: '9h às 17h', start: 9, end: 17 },
    '10-18': { label: '10h às 18h', start: 10, end: 18 },
    '11-19': { label: '11h às 19h', start: 11, end: 19 }
  };

  const templates = {
    '3x2': { name: '3 Presencial + 2 Home Office', pattern: ['office', 'office', 'office', 'home', 'home'] },
    '4x1': { name: '4 Presencial + 1 Home Office', pattern: ['office', 'office', 'office', 'office', 'home'] },
    '2x3': { name: '2 Presencial + 3 Home Office', pattern: ['office', 'office', 'home', 'home', 'home'] },
    'alternate': { name: 'Alternado', pattern: ['office', 'home', 'office', 'home', 'office'] },
    'manager_rotation': { name: 'Meta de Gestores (Mín. 2)', pattern: ['office', 'home'], description: 'Garante mínimo de 2 gestores presenciais por dia' },
    'manual': { name: '100% Manual', pattern: [], description: 'Controle total pelo usuário - clique no calendário para ajustar' }
  };

  const teams = [...new Set(employees.map(emp => emp.team).filter(team => team && team.trim() !== ''))];

  // Forçar colaboradores a ficar no calendário
  React.useEffect(() => {
    if (userRole === 'employee' && activeTab !== 'calendar') {
      setActiveTab('calendar');
    }
  }, [userRole, activeTab]);

  // Sincronizar employees do Supabase com estado local
  React.useEffect(() => {
    if (dbEmployees) {
      setEmployees(dbEmployees);
    }
  }, [dbEmployees]);

  // Sincronizar schedules do Supabase com estado local
  React.useEffect(() => {
    if (dbSchedules) {
      setSchedules(dbSchedules);
    }
  }, [dbSchedules]);

  // Funções para sistema de múltiplos salvamentos
  const saveScheduleToSlot = async (slotId, customName = '') => {
    setIsSaving(true);
    try {
      const scheduleData = {
        employees,
        schedules,
        vacations,
        holidays,
        holidayStaff,
        weekendShifts,
        weekendStaff,
        settings: {
          maxCapacity,
          targetOfficeCount,
          targetOfficeMode
        },
        metadata: {
          savedBy: userRole,
          savedAt: new Date().toISOString(),
          month: currentDate.getMonth(),
          year: currentDate.getFullYear(),
          customName: customName || `${monthNames[currentDate.getMonth()]}/${currentDate.getFullYear()}`,
          employeeCount: employees.length,
          description: customName ? `Escala personalizada: ${customName}` : `Escala de ${monthNames[currentDate.getMonth()]}/${currentDate.getFullYear()}`
        }
      };
      
      setSavedSchedules(prev => ({
        ...prev,
        [slotId]: scheduleData
      }));
      
      setLastSaved(new Date());
      
      const change = {
        id: Date.now(),
        timestamp: new Date(),
        action: `💾 Escala salva no Slot ${slotId.slice(-1)}: ${scheduleData.metadata.customName}`
      };
      setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
      
      showAlert(
        '✅ Escala Salva!',
        `A escala "${scheduleData.metadata.customName}" foi salva no Slot ${slotId.slice(-1)} com sucesso!`,
        'info'
      );
    } catch (error) {
      showAlert(
        '❌ Erro ao Salvar',
        'Ocorreu um erro ao salvar a escala. Tente novamente.',
        'danger'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const loadScheduleFromSlot = (slotId) => {
    const savedData = savedSchedules[slotId];
    
    if (!savedData) {
      showAlert(
        'ℹ️ Slot Vazio',
        `O Slot ${slotId.slice(-1)} está vazio.`,
        'info'
      );
      return;
    }
    
    showConfirm(
      '📂 Carregar Escala Salva',
      `Carregar a escala "${savedData.metadata.customName}"?\n\nSalva em: ${new Date(savedData.metadata.savedAt).toLocaleString()}\nPessoas: ${savedData.metadata.employeeCount}\n\n⚠️ Isso substituirá a escala atual!`,
      () => {
        setEmployees(savedData.employees || []);
        setSchedules(savedData.schedules || {});
        setVacations(savedData.vacations || {});
        setHolidays(savedData.holidays || {});
        setHolidayStaff(savedData.holidayStaff || {});
        setWeekendShifts(savedData.weekendShifts || {});
        setWeekendStaff(savedData.weekendStaff || {});
        
        if (savedData.settings) {
          setMaxCapacity(savedData.settings.maxCapacity || 10);
          setTargetOfficeCount(savedData.settings.targetOfficeCount || 6);
          setTargetOfficeMode(savedData.settings.targetOfficeMode || 'absolute');
        }
        
        const change = {
          id: Date.now(),
          timestamp: new Date(),
          action: `📂 Escala carregada do Slot ${slotId.slice(-1)}: ${savedData.metadata.customName}`
        };
        setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
        
        showAlert(
          '✅ Escala Carregada!',
          `Escala "${savedData.metadata.customName}" carregada com sucesso!`,
          'info'
        );
      },
      'warning'
    );
  };

  const deleteScheduleFromSlot = (slotId) => {
    const savedData = savedSchedules[slotId];
    
    if (!savedData) {
      showAlert(
        'ℹ️ Slot Vazio',
        `O Slot ${slotId.slice(-1)} já está vazio.`,
        'info'
      );
      return;
    }
    
    showConfirm(
      '🗑️ Excluir Escala Salva',
      `Tem certeza que deseja excluir a escala "${savedData.metadata.customName}" do Slot ${slotId.slice(-1)}?\n\nEsta ação não pode ser desfeita!`,
      () => {
        setSavedSchedules(prev => ({
          ...prev,
          [slotId]: null
        }));
        
        const change = {
          id: Date.now(),
          timestamp: new Date(),
          action: `🗑️ Escala excluída do Slot ${slotId.slice(-1)}: ${savedData.metadata.customName}`
        };
        setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
        
        showAlert(
          '✅ Escala Excluída!',
          `A escala foi removida do Slot ${slotId.slice(-1)} com sucesso!`,
          'info'
        );
      },
      'danger'
    );
  };

  // Funções para modais de confirmação
  const showConfirm = (title, message, onConfirm, type = 'warning') => {
    setConfirmModalData({
      title,
      message,
      confirmText: type === 'danger' ? 'Excluir' : 'Confirmar',
      cancelText: 'Cancelar',
      onConfirm: () => {
        onConfirm();
        setShowConfirmModal(false);
      },
      onCancel: () => setShowConfirmModal(false),
      type
    });
    setShowConfirmModal(true);
  };

  const showAlert = (title, message, type = 'info') => {
    setConfirmModalData({
      title,
      message,
      confirmText: 'OK',
      cancelText: '',
      onConfirm: () => setShowConfirmModal(false),
      onCancel: () => setShowConfirmModal(false),
      type
    });
    setShowConfirmModal(true);
  };

  const startNewSchedule = () => {
    showConfirm(
      '🔄 Iniciar Nova Escala',
      'ATENÇÃO: Esta ação irá:\n\n• Apagar TODAS as pessoas\n• Limpar TODAS as escalas\n• Remover equipes e histórico\n\nTem certeza?',
      () => {
        setEmployees([]);
        setSchedules({});
        setVacations({});
        setHolidays({});
        setHolidayStaff({});
        setWeekendShifts({});
        setWeekendStaff({});
        setChangeHistory([]);
        setSelectedPerson(null);
        setEditingPerson(null);
        setExpandedPersonId(null);
        setHasUnsavedChanges(false);
        setActivePersonTab('dados');
        setVacationPersonId(null);
        setFilters({ employee: '', team: 'VAZIO', currentStatus: '' });
        setPersonFilters({ name: '', type: '', team: 'VAZIO' });
        
        const change = {
          id: Date.now(),
          timestamp: new Date(),
          action: `🔄 NOVA ESCALA - Sistema completamente resetado`
        };
        setChangeHistory([change]);
        
        showAlert(
          '✅ Nova Escala Iniciada!',
          'Sistema completamente resetado\nTodas as pessoas foram removidas',
          'info'
        );
      },
      'danger'
    );
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const dateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getEmployeeStatus = (employeeId, date) => {
    const dateStr = dateToString(date);

    // Verificar feriados
    if (holidays[dateStr]) {
      if (holidayStaff[dateStr] && holidayStaff[dateStr].includes(employeeId)) {
        return 'holiday';
      }
      return 'holiday';
    }

    // Verificar plantões de fim de semana
    const dayOfWeek = date.getDay();
    if ((dayOfWeek === 0 || dayOfWeek === 6) && weekendShifts[dateStr]) {
      if (weekendStaff[dateStr] && weekendStaff[dateStr].includes(employeeId)) {
        return 'holiday';
      }
      return 'holiday';
    }

    // Verificar férias
    if (vacations[employeeId]) {
      const vacation = vacations[employeeId];
      const startDate = vacation.start;
      const endDate = vacation.end;

      if (dateStr >= startDate && dateStr <= endDate) {
        return 'vacation';
      }
    }

    // Retornar escala preenchida (se existir)
    if (schedules[employeeId] && schedules[employeeId][dateStr]) {
      return schedules[employeeId][dateStr];
    }

    // Fallback para status padrão por tipo de employee
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return null;

    switch (employee.type) {
      case 'always_office':
        return 'office';  // 🟢 Sempre presencial
      case 'always_home':
        return 'home';    // 🔵 Sempre home office
      case 'variable':
        // Se tem homeOfficeDays definido, usar essa informação
        if (employee.homeOfficeDays && employee.homeOfficeDays.includes(dateStr)) {
          return 'home';
        }
        // Se não tem homeOfficeDays para este dia, assumir presencial por padrão
        // (a menos que seja fim de semana)
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return null; // Fim de semana
        }
        // Se é dia útil e não está marcado como home em homeOfficeDays, é presencial
        if (employee.homeOfficeDays && employee.homeOfficeDays.length > 0) {
          return 'office';
        }
        // Se não tem nenhum homeOfficeDays definido, retorna null (sem escala)
        return null;
      default:
        return null;
    }
  };

  // Função auxiliar para determinar status automático de funcionários com Presença Variável
  const getVariableEmployeeAutoStatus = (employee, date) => {
    const dayOfWeek = date.getDay();

    // Ignora fins de semana
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return null;
    }

    const officeDays = employee.officeDays || 3; // Padrão: 3 dias presenciais
    const preferences = employee.preferences || {};

    // Mapeamento de dia da semana para chave de preferences
    const dayKeys = {
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday'
    };

    const dayKey = dayKeys[dayOfWeek];

    // Se o dia está marcado como preferência de home office
    if (preferences[dayKey] === 'home') {
      return 'home';
    }

    // NOVA LÓGICA: Contar quantos dias estão marcados como preferência de home
    const homePrefDays = Object.values(preferences).filter(v => v === 'home').length;

    // Se há preferências de home, os dias restantes DEVEM ser presenciais
    if (homePrefDays > 0) {
      // Se este dia NÃO está nas preferências de home, deve ser presencial
      // para garantir que atinja o número de dias presenciais
      const remainingOfficeDays = 5 - homePrefDays; // Dias disponíveis para presencial

      // Se os dias de home configurados deixam exatamente officeDays para presencial
      // então todos os dias não marcados como home devem ser presenciais
      if (remainingOfficeDays === officeDays) {
        return 'office';
      }
    }

    // Distribuição automática para dias sem preferência marcada
    // Conta quantos dias da semana já passaram para distribuir uniformemente
    const weekOfMonth = Math.floor((date.getDate() - 1) / 7);
    const workWeekDays = [1, 2, 3, 4, 5]; // Seg a Sex
    const dayIndex = workWeekDays.indexOf(dayOfWeek);

    if (dayIndex === -1) return null;

    // Identifica quais dias NÃO estão nas preferências de home
    const availableDays = workWeekDays.filter(d => preferences[dayKeys[d]] !== 'home');
    const availableCount = availableDays.length;

    // Se não há dias disponíveis suficientes, retorna home
    if (availableCount === 0) return 'home';

    // Distribui os dias presenciais entre os dias disponíveis
    const neededOfficeDays = Math.min(officeDays, availableCount);

    // Verifica se este dia está entre os dias disponíveis
    const positionInAvailable = availableDays.indexOf(dayOfWeek);

    if (positionInAvailable === -1) return 'home';

    // Distribui de forma rotativa baseada na semana
    const rotationOffset = weekOfMonth % availableCount;
    const rotatedAvailable = [...availableDays.slice(rotationOffset), ...availableDays.slice(0, rotationOffset)];

    // Verifica se este dia está entre os primeiros neededOfficeDays após rotação
    return rotatedAvailable.slice(0, neededOfficeDays).includes(dayOfWeek) ? 'office' : 'home';
  };

  const getOfficeCount = (date) => {
    const dateStr = dateToString(date);
    const dayOfWeek = date.getDay();
    
    if (holidays[dateStr]) {
      return holidayStaff[dateStr] ? holidayStaff[dateStr].length : 0;
    }
    
    if ((dayOfWeek === 0 || dayOfWeek === 6) && weekendShifts[dateStr]) {
      return weekendStaff[dateStr] ? weekendStaff[dateStr].length : 0;
    }
    
    return employees.filter(emp => getEmployeeStatus(emp.id, date) === 'office').length;
  };

  const setEmployeeStatus = (employeeId, date, status) => {
    const dateStr = dateToString(date);
    const employee = employees.find(emp => emp.id === employeeId);
    
    const change = {
      id: Date.now(),
      timestamp: new Date(),
      action: `Alterou ${employee.name} em ${date.toLocaleDateString()} para ${statusLabels[status]}`
    };
    setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
    
    setSchedules(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [dateStr]: status
      }
    }));
  };

  const toggleHoliday = (date) => {
    const dateStr = dateToString(date);
    
    setHolidays(prev => {
      const newHolidays = { ...prev };
      if (newHolidays[dateStr]) {
        delete newHolidays[dateStr];
        setHolidayStaff(prevStaff => {
          const newStaff = { ...prevStaff };
          delete newStaff[dateStr];
          return newStaff;
        });
        
        const change = {
          id: Date.now(),
          timestamp: new Date(),
          action: `Removeu feriado do dia ${date.toLocaleDateString()}`
        };
        setChangeHistory(prevHistory => [change, ...prevHistory.slice(0, 99)]);
      } else {
        newHolidays[dateStr] = true;
        
        const change = {
          id: Date.now(),
          timestamp: new Date(),
          action: `Marcou ${date.toLocaleDateString()} como feriado`
        };
        setChangeHistory(prevHistory => [change, ...prevHistory.slice(0, 99)]);
      }
      return newHolidays;
    });
  };

  const toggleHolidayStaff = (date, employeeId) => {
    const dateStr = dateToString(date);
    
    setHolidayStaff(prev => {
      const newStaff = { ...prev };
      if (!newStaff[dateStr]) {
        newStaff[dateStr] = [];
      }
      
      if (newStaff[dateStr].includes(employeeId)) {
        newStaff[dateStr] = newStaff[dateStr].filter(id => id !== employeeId);
        if (newStaff[dateStr].length === 0) {
          delete newStaff[dateStr];
        }
      } else {
        newStaff[dateStr].push(employeeId);
      }
      
      return newStaff;
    });
  };

  const toggleWeekendShift = (date) => {
    const dateStr = dateToString(date);
    
    setWeekendShifts(prev => {
      const newShifts = { ...prev };
      if (newShifts[dateStr]) {
        delete newShifts[dateStr];
        setWeekendStaff(prevStaff => {
          const newStaff = { ...prevStaff };
          delete newStaff[dateStr];
          return newStaff;
        });
        
        const change = {
          id: Date.now(),
          timestamp: new Date(),
          action: `Removeu plantão de fim de semana do dia ${date.toLocaleDateString()}`
        };
        setChangeHistory(prevHistory => [change, ...prevHistory.slice(0, 99)]);
      } else {
        newShifts[dateStr] = true;
        
        const change = {
          id: Date.now(),
          timestamp: new Date(),
          action: `Ativou plantão de fim de semana para ${date.toLocaleDateString()}`
        };
        setChangeHistory(prevHistory => [change, ...prevHistory.slice(0, 99)]);
      }
      return newShifts;
    });
  };

  const toggleWeekendStaff = (date, employeeId) => {
    const dateStr = dateToString(date);
    
    setWeekendStaff(prev => {
      const newStaff = { ...prev };
      if (!newStaff[dateStr]) {
        newStaff[dateStr] = [];
      }
      
      if (newStaff[dateStr].includes(employeeId)) {
        newStaff[dateStr] = newStaff[dateStr].filter(id => id !== employeeId);
        if (newStaff[dateStr].length === 0) {
          delete newStaff[dateStr];
        }
      } else {
        newStaff[dateStr].push(employeeId);
      }
      
      return newStaff;
    });
  };

  const applyTemplate = (templateKey, specificTeam = null, respectPreferences = false) => {
    const template = templates[templateKey];
    if (!template) return;

    if (templateKey === 'manual') {
      setShowManualTemplateModal(true);
      return;
    }

    console.log('=== DEBUG APPLY TEMPLATE ===');
    console.log('Total de employees:', employees.length);
    console.log('Employees:', employees);

    // Aplicar template a TODOS os funcionários
    const targetEmployees = employees.filter(emp =>
      !specificTeam || emp.team === specificTeam
    );

    console.log('Target employees (todos):', targetEmployees.length);
    console.log('Target employees:', targetEmployees);

    const affectedCount = targetEmployees.length;

    let confirmMessage = `Aplicar template "${template.name}"?\n\n`;
    confirmMessage += `📊 Pessoas afetadas:\n`;
    confirmMessage += `• ${affectedCount} funcionários (todas as escalas serão preenchidas)\n`;

    confirmMessage += `\n🎯 Meta: ${targetOfficeCount} pessoas presenciais por dia\n`;

    if (respectPreferences) {
      confirmMessage += `✅ Respeitando preferências individuais\n`;
    }

    confirmMessage += `\n⚠️ Todas as escalas serão preenchidas de acordo com o template!`;
    
    showConfirm(
      '📋 Aplicar Template',
      confirmMessage,
      () => {
        executeTemplateApplication(templateKey, targetEmployees, respectPreferences, template);
      },
      'warning'
    );
  };

  const executeTemplateApplication = (templateKey, targetEmployees, respectPreferences, template) => {
    const days = getDaysInMonth(currentDate).filter(day => day && day.getDay() >= 1 && day.getDay() <= 5);

    console.log('=== EXECUTE TEMPLATE APPLICATION ===');
    console.log('Template Key:', templateKey);
    console.log('Target Employees:', targetEmployees.length);
    console.log('Days to process:', days.length);

    if (templateKey === 'manager_rotation') {
      const allManagers = employees.filter(emp => emp.isManager);
      const fixedManagers = allManagers.filter(emp => emp.type === 'always_office');
      const variableManagers = allManagers.filter(emp => emp.type === 'variable');
      
      if (allManagers.length === 0) {
        showAlert(
          'Nenhum Gestor Encontrado',
          'Nenhum gestor encontrado no sistema.',
          'warning'
        );
        return;
      }
      
      if (variableManagers.length === 0) {
        showAlert(
          'Nenhum Gestor Variável',
          'Todos os gestores são fixos. Use o template apenas se houver gestores variáveis para distribuir.',
          'warning'
        );
        return;
      }
      
      const metaMinimaGestores = 2;
      const gestoresFixos = fixedManagers.length;
      const precisoDeVariaveis = Math.max(0, metaMinimaGestores - gestoresFixos);
      
      if (precisoDeVariaveis >= variableManagers.length) {
        variableManagers.forEach(manager => {
          days.forEach(day => {
            setEmployeeStatus(manager.id, day, 'office');
          });
        });
        
        showAlert(
          '⚠️ Todos os Gestores Variáveis Presenciais',
          `Meta: ${metaMinimaGestores} gestores mínimo\nFixos: ${gestoresFixos}\nVariáveis disponíveis: ${variableManagers.length}\n\nComo precisamos de ${precisoDeVariaveis} gestores variáveis por dia e só temos ${variableManagers.length}, todos ficam presenciais todos os dias.`,
          'info'
        );
      } else {
        days.forEach((day, dayIndex) => {
          const gestoresPresenciaisHoje = [];
          
          for (let i = 0; i < precisoDeVariaveis; i++) {
            const managerIndex = (dayIndex + i) % variableManagers.length;
            gestoresPresenciaisHoje.push(variableManagers[managerIndex]);
          }
          
          variableManagers.forEach(manager => {
            const status = gestoresPresenciaisHoje.includes(manager) ? 'office' : 'home';
            setEmployeeStatus(manager.id, day, status);
          });
        });
        
        showAlert(
          '✅ Distribuição de Gestores Aplicada',
          `Meta: ${metaMinimaGestores} gestores mínimo por dia\n• ${gestoresFixos} gestores sempre presenciais\n• ${precisoDeVariaveis} gestores variáveis por dia (revezando entre ${variableManagers.length})\n\n⚠️ Preferências individuais foram ignoradas para garantir a meta mínima.`,
          'info'
        );
      }
      
      const change = {
        id: Date.now(),
        timestamp: new Date(),
        action: `Aplicou template Gestores - Meta mínima: ${metaMinimaGestores} gestores presenciais por dia`
      };
      setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
      return;
    }

    // Nova lógica de distribuição equilibrada que respeita o targetOfficeCount
    const balancedApplyTemplate = () => {
      console.log('=== BALANCED APPLY TEMPLATE ===');
      console.log('Target per day:', targetOfficeCount);
      console.log('Target employees for balanced:', targetEmployees.length);

      const targetPerDay = targetOfficeCount;

      // SEPARAR FUNCIONÁRIOS POR TIPO
      const alwaysOfficeEmps = targetEmployees.filter(emp => emp.type === 'always_office');
      const alwaysHomeEmps = targetEmployees.filter(emp => emp.type === 'always_home');
      const variableEmps = targetEmployees.filter(emp => emp.type === 'variable');

      console.log(`\nFuncionários:`);
      console.log(`  Always Office: ${alwaysOfficeEmps.length}`);
      console.log(`  Always Home: ${alwaysHomeEmps.length}`);
      console.log(`  Variable: ${variableEmps.length}`);
      console.log(`  Meta presencial por dia: ${targetPerDay}`);
      console.log(`  Presenciais fixos (always_office): ${alwaysOfficeEmps.length}`);
      console.log(`  Presenciais a distribuir entre variable: ${Math.max(0, targetPerDay - alwaysOfficeEmps.length)}`);

      // Determinar quantos dias cada VARIABLE deve ir ao escritório
      const templatePatterns = {
        '4x1': { officeDays: 4 },
        '3x2': { officeDays: 3 },
        '2x3': { officeDays: 2 },
        'alternate': { officeDays: 2.5 }
      };

      const pattern = templatePatterns[templateKey] || { officeDays: 3 };

      // Atribuir número de dias de escritório para APENAS os variable
      const employeeDaysNeeded = variableEmps.map(emp => ({
        employee: emp,
        officeDaysNeeded: pattern.officeDays,
        daysAssigned: 0
      }));

      // Objeto para acumular todas as mudanças de escala
      const newSchedules = {};

      // Inicializar newSchedules para TODOS os funcionários
      targetEmployees.forEach(emp => {
        newSchedules[emp.id] = {};
      });

      // Para cada dia, aplicar regras corretas
      days.forEach((day, dayIndex) => {
        console.log(`\n=== Processing day ${day.toLocaleDateString()} ===`);

        const dateStr = dateToString(day);

        const neededVariable = Math.max(0, targetPerDay - alwaysOfficeEmps.length);

        console.log(`  Always office: ${alwaysOfficeEmps.length}, Need variable: ${neededVariable}`);

        // 1. MARCAR ALWAYS_OFFICE como "office" (nunca muda)
        alwaysOfficeEmps.forEach(emp => {
          newSchedules[emp.id][dateStr] = 'office';
        });

        // 2. MARCAR ALWAYS_HOME como "home" (nunca muda)
        alwaysHomeEmps.forEach(emp => {
          newSchedules[emp.id][dateStr] = 'home';
        });

        // 3. DISTRIBUIR VARIABLE equilibradamente
        if (variableEmps.length > 0) {
          // Ordenar variable por prioridade:
          // 1. Quem ainda precisa de mais dias no escritório
          // 2. Quem foi menos ao escritório até agora
          const sortedVariable = [...employeeDaysNeeded].sort((a, b) => {
            const aRemaining = a.officeDaysNeeded - a.daysAssigned;
            const bRemaining = b.officeDaysNeeded - b.daysAssigned;

            if (aRemaining !== bRemaining) {
              return bRemaining - aRemaining; // Quem precisa de mais dias primeiro
            }

            return a.daysAssigned - b.daysAssigned; // Quem foi menos vezes
          });

          // Selecionar os primeiros neededVariable para o escritório
          sortedVariable.forEach((empData, index) => {
            if (index < neededVariable) {
              newSchedules[empData.employee.id][dateStr] = 'office';
              empData.daysAssigned++;
              console.log(`  ${empData.employee.name}: OFFICE (${empData.daysAssigned}/${empData.officeDaysNeeded})`);
            } else {
              newSchedules[empData.employee.id][dateStr] = 'home';
              console.log(`  ${empData.employee.name}: HOME`);
            }
          });
        }

        // Verificar contagem final do dia
        const finalCount = alwaysOfficeEmps.length + neededVariable;
        console.log(`Final count for ${day.toLocaleDateString()}: ${finalCount} (target: ${targetPerDay})`);
      });

      console.log('\n=== Final assignment summary ===');
      alwaysOfficeEmps.forEach(emp => {
        console.log(`${emp.name}: ALWAYS OFFICE (fixo todos os dias)`);
      });
      alwaysHomeEmps.forEach(emp => {
        console.log(`${emp.name}: ALWAYS HOME (fixo todos os dias)`);
      });
      employeeDaysNeeded.forEach(empData => {
        console.log(`${empData.employee.name}: ${empData.daysAssigned} days assigned (target: ${empData.officeDaysNeeded})`);
      });

      // Aplicar TODAS as mudanças de uma vez só
      console.log('\n=== Applying all schedules at once ===');
      setSchedules(prev => {
        const updated = { ...prev };
        // Para funcionários variáveis, SUBSTITUIR completamente (não mesclar)
        Object.keys(newSchedules).forEach(empId => {
          updated[empId] = newSchedules[empId]; // SUBSTITUIÇÃO COMPLETA
        });
        console.log('Schedules updated!');
        console.log('New schedules:', updated);
        return updated;
      });

      // Salvar no Supabase
      console.log('\n=== Saving schedules to Supabase ===');
      const savePromises = [];
      Object.keys(newSchedules).forEach(empId => {
        Object.keys(newSchedules[empId]).forEach(dateStr => {
          const status = newSchedules[empId][dateStr];
          if (status) {
            savePromises.push(setEmployeeStatusDb(empId, dateStr, status));
          }
        });
      });

      Promise.all(savePromises).then(() => {
        console.log('All schedules saved to Supabase!');
        refreshSchedules(); // Recarregar do banco
      }).catch(error => {
        console.error('Error saving schedules to Supabase:', error);
      });
    };

    balancedApplyTemplate();
    
    const change = {
      id: Date.now(),
      timestamp: new Date(),
      action: `Aplicou template ${template.name}${respectPreferences ? ' respeitando preferências' : ''} - Meta absoluta: ${targetOfficeCount} pessoas presenciais`
    };
    setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
  };

  const executeManualTemplate = (option) => {
    const targetEmployees = employees.filter(emp => emp.type === 'variable');
    const days = getDaysInMonth(currentDate).filter(day => day && day.getDay() >= 1 && day.getDay() <= 5);
    
    targetEmployees.forEach(emp => {
      days.forEach(day => {
        const dateStr = dateToString(day);
        setSchedules(prev => ({
          ...prev,
          [emp.id]: {
            ...prev[emp.id],
            [dateStr]: null
          }
        }));
      });
    });
    
    if (option === 'all_office') {
      targetEmployees.forEach(emp => {
        days.forEach(day => {
          setEmployeeStatus(emp.id, day, 'office');
        });
      });
    } else if (option === 'all_home') {
      targetEmployees.forEach(emp => {
        days.forEach(day => {
          setEmployeeStatus(emp.id, day, 'home');
        });
      });
    } else if (option === 'distribute_50_50') {
      days.forEach(day => {
        const shuffledEmployees = [...targetEmployees].sort(() => Math.random() - 0.5);
        const halfCount = Math.floor(targetEmployees.length / 2);
        
        shuffledEmployees.forEach((emp, index) => {
          const status = index < halfCount ? 'office' : 'home';
          setEmployeeStatus(emp.id, day, status);
        });
      });
    }
    
    const optionLabels = {
      'blank': 'em branco - configuração limpa',
      'all_office': 'todas as pessoas como presencial',
      'all_home': 'todas as pessoas como home office',
      'distribute_50_50': 'distribuição 50/50 aleatória'
    };
    
    const change = {
      id: Date.now(),
      timestamp: new Date(),
      action: `Aplicou template Manual (${optionLabels[option]})`
    };
    setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
    
    setShowManualTemplateModal(false);
    setManualTemplateOption('blank');
    
    showAlert(
      '✅ Template Manual Aplicado!',
      `Configuração inicial: ${optionLabels[option]}\n\nAgora clique nos nomes no calendário para fazer ajustes conforme necessário.`,
      'info'
    );
  };

  // ===== APLICAR DISTRIBUIÇÃO CUSTOMIZADA (ABA AUTO) =====
  const applyCustomDistribution = (config: {
    officeDays: number;
    targetPerDay: number;
    excludedEmployeeIds: number[];
  }) => {
    console.log('=== APPLY CUSTOM DISTRIBUTION ===');
    console.log('Config:', config);
    console.log('All employees:', employees.length);

    const days = getDaysInMonth(currentDate).filter(day => day && day.getDay() >= 1 && day.getDay() <= 5);

    // Separar funcionários por tipo e condição
    const alwaysOfficeEmps = employees.filter(emp => emp.type === 'always_office');
    const alwaysHomeEmps = employees.filter(emp => emp.type === 'always_home');

    // Variable com escala manual definida (homeOfficeDays não vazio)
    const variableWithManualSchedule = employees.filter(
      emp => emp.type === 'variable' && emp.homeOfficeDays && emp.homeOfficeDays.length > 0
    );

    // Variable disponíveis para distribuição automática
    const availableForDistribution = employees.filter(
      emp =>
        emp.type === 'variable' &&
        !config.excludedEmployeeIds.includes(emp.id) &&
        (!emp.homeOfficeDays || emp.homeOfficeDays.length === 0) // Sem escala manual
    );

    console.log('Always Office:', alwaysOfficeEmps.length);
    console.log('Always Home:', alwaysHomeEmps.length);
    console.log('Variable with manual schedule:', variableWithManualSchedule.length);
    console.log('Available for distribution:', availableForDistribution.length);
    console.log('Office days per person:', config.officeDays);
    console.log('Target per day:', config.targetPerDay);

    // Preparar dados para rastrear atribuições
    const employeeDaysNeeded = availableForDistribution.map(emp => ({
      employee: emp,
      officeDaysNeeded: config.officeDays,
      daysAssigned: 0
    }));

    const newSchedules: any = {};

    // Inicializar escalas para TODOS
    employees.forEach(emp => {
      newSchedules[emp.id] = {};
    });

    // Processar cada dia
    days.forEach((day, dayIndex) => {
      const dateStr = dateToString(day);

      // PASSO 1: Aplicar always_office
      alwaysOfficeEmps.forEach(emp => {
        newSchedules[emp.id][dateStr] = 'office';
      });

      // PASSO 2: Aplicar always_home
      alwaysHomeEmps.forEach(emp => {
        newSchedules[emp.id][dateStr] = 'home';
      });

      // PASSO 3: Aplicar escalas manuais (variable com homeOfficeDays definido)
      let manualOfficeCount = 0;
      variableWithManualSchedule.forEach(emp => {
        if (emp.homeOfficeDays?.includes(dateStr)) {
          newSchedules[emp.id][dateStr] = 'home';
        } else {
          newSchedules[emp.id][dateStr] = 'office';
          manualOfficeCount++;
        }
      });

      // PASSO 4: Calcular vagas restantes
      const occupiedSlots = alwaysOfficeEmps.length + manualOfficeCount;
      const remainingSlots = Math.max(0, config.targetPerDay - occupiedSlots);

      console.log(`Day ${dateStr}: always_office=${alwaysOfficeEmps.length}, manualOffice=${manualOfficeCount}, target=${config.targetPerDay}, remaining=${remainingSlots}`);

      // PASSO 5: Distribuir apenas nas vagas restantes
      if (availableForDistribution.length > 0 && remainingSlots > 0) {
        // Ordenar por prioridade (quem ainda precisa mais dias presenciais)
        const sortedVariable = [...employeeDaysNeeded].sort((a, b) => {
          const aRemaining = a.officeDaysNeeded - a.daysAssigned;
          const bRemaining = b.officeDaysNeeded - b.daysAssigned;

          if (aRemaining !== bRemaining) {
            return bRemaining - aRemaining;
          }

          return a.daysAssigned - b.daysAssigned;
        });

        // Selecionar apenas até preencher as vagas restantes
        sortedVariable.forEach((empData, index) => {
          if (index < remainingSlots) {
            newSchedules[empData.employee.id][dateStr] = 'office';
            empData.daysAssigned++;
          } else {
            newSchedules[empData.employee.id][dateStr] = 'home';
          }
        });
      } else if (availableForDistribution.length > 0) {
        // Se não há vagas restantes, todos ficam em home
        availableForDistribution.forEach(emp => {
          newSchedules[emp.id][dateStr] = 'home';
        });
      }
    });

    console.log('New schedules prepared:', newSchedules);

    // Aplicar ao estado local
    setSchedules(prev => {
      const updated: any = { ...prev };
      Object.keys(newSchedules).forEach(empId => {
        updated[empId] = newSchedules[empId];
      });
      console.log('Schedules updated!');
      return updated;
    });

    // Atualizar homeOfficeDays no estado employees
    setEmployees(prev => prev.map(emp => {
      if (!availableForDistribution.find(e => e.id === emp.id)) {
        return emp; // Não alterar quem já tem escala manual
      }

      // Para quem foi distribuído automaticamente, preencher homeOfficeDays
      const homeDays = Object.keys(newSchedules[emp.id] || {}).filter(
        dateStr => newSchedules[emp.id][dateStr] === 'home'
      );

      return { ...emp, homeOfficeDays: homeDays };
    }));

    // Salvar no Supabase
    console.log('\n=== Saving schedules to Supabase ===');
    const savePromises = [];
    Object.keys(newSchedules).forEach(empId => {
      Object.keys(newSchedules[empId]).forEach(dateStr => {
        const status = newSchedules[empId][dateStr];
        if (status) {
          savePromises.push(setEmployeeStatusDb(empId, dateStr, status));
        }
      });
    });

    Promise.all(savePromises)
      .then(() => {
        console.log('All schedules saved to Supabase!');
        refreshSchedules();

        const change = {
          id: Date.now(),
          timestamp: new Date(),
          action: `✨ Aplicou distribuição customizada: ${config.officeDays} dias presenciais, meta de ${config.targetPerDay} pessoas/dia (${variableWithManualSchedule.length} com escala manual preservada)`
        };
        setChangeHistory(prev => [change, ...prev.slice(0, 99)]);

        showAlert(
          '✅ Distribuição Aplicada!',
          `Escalas foram distribuídas com sucesso:\n\n• Dias presenciais: ${config.officeDays}\n• Meta presencial: ${config.targetPerDay} pessoas/dia\n• Pessoas distribuídas: ${availableForDistribution.length}\n• Escalas manuais preservadas: ${variableWithManualSchedule.length}`,
          'success'
        );
      })
      .catch(error => {
        console.error('Error saving schedules to Supabase:', error);
        showAlert(
          '❌ Erro!',
          'Ocorreu um erro ao salvar as escalas.',
          'error'
        );
      });
  };

  const clearAllSchedules = () => {
    console.log('=== CLEAR ALL DATA ===');
    console.log('Total employees:', employees.length);

    showConfirm(
      '⚠️ Apagar TODOS os Dados de Escala',
      'Tem certeza que deseja apagar TODOS os dados?\n\nEsta ação irá remover:\n• Escalas (schedules)\n• Escalas manuais (homeOfficeDays dos cards)\n• Férias (vacations)\n• Feriados (holidays)\n• Plantões de fim de semana (weekend shifts)\n\nEsta ação NÃO pode ser desfeita!',
      () => {
        console.log('User confirmed - clearing all schedule data...');

        // Limpar states locais
        setSchedules({});
        setVacations({});
        setHolidays({});
        setHolidayStaff({});
        setWeekendShifts({});
        setWeekendStaff({});

        // Limpar homeOfficeDays de todos os employees
        setEmployees(prev => prev.map(emp => ({
          ...emp,
          homeOfficeDays: []
        })));

        // Limpar do Supabase em paralelo
        console.log('\n=== Clearing all data from Supabase ===');

        Promise.all([
          clearAllSchedulesDb(),
          clearAllVacationsFromOrg(user),
          clearAllHolidaysFromOrg(user),
          clearAllWeekendShiftsFromOrg(user)
        ])
          .then(() => {
            console.log('All data cleared from Supabase!');
            refreshSchedules(); // Recarregar do banco

            const change = {
              id: Date.now(),
              timestamp: new Date(),
              action: '🗑️ Apagou TODOS os dados de escala (escalas, escalas manuais, férias, feriados e plantões)'
            };
            setChangeHistory(prev => [change, ...prev.slice(0, 99)]);

            console.log('All data cleared successfully!');

            showAlert(
              '✅ Todos os Dados Apagados!',
              'Escalas, escalas manuais, férias, feriados e plantões foram removidos com sucesso.\n\nO calendário e os cards estão limpos e prontos para novos dados.',
              'info'
            );
          })
          .catch(error => {
            console.error('Error clearing data from Supabase:', error);
            showAlert(
              '❌ Erro ao Apagar!',
              'Ocorreu um erro ao apagar os dados do banco de dados.',
              'error'
            );
          });
      },
      'error'
    );
  };

  const copyPreviousWeek = () => {
    const days = getDaysInMonth(currentDate).filter(day => day);
    const weeks = [];
    
    let currentWeek = [];
    days.forEach(day => {
      if (day.getDay() === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    if (weeks.length < 2) {
      showAlert(
        'Insuficientes Semanas',
        'É necessário ter pelo menos 2 semanas no mês para usar esta função',
        'warning'
      );
      return;
    }
    
    const sourceWeek = weeks[0];
    const targetWeeks = weeks.slice(1);
    
    targetWeeks.forEach(targetWeek => {
      employees.forEach(emp => {
        if (emp.type !== 'variable') return;
        
        sourceWeek.forEach((sourceDay) => {
          const sourceDayOfWeek = sourceDay.getDay();
          if (sourceDayOfWeek === 0 || sourceDayOfWeek === 6) return;
          
          const targetDay = targetWeek.find(day => day && day.getDay() === sourceDayOfWeek);
          
          if (targetDay) {
            const sourceStatus = getEmployeeStatus(emp.id, sourceDay);
            if (sourceStatus && sourceStatus !== 'vacation') {
              setEmployeeStatus(emp.id, targetDay, sourceStatus);
            }
          }
        });
      });
    });
    
    showAlert('Padrão Copiado!', 'Padrão copiado com sucesso!', 'info');
  };

  const exportToExcel = () => {
    const allDays = getDaysInMonth(currentDate);
    const filteredEmployees = getFilteredEmployees();

    // Símbolos para status
    const statusSymbols = {
      'office': '🟢',
      'home': '🔵',
      'vacation': '🟠',
      'holiday': '⚫'
    };

    // Organizar dias em semanas (grade de calendário)
    const weeks = [];
    let currentWeek = [];

    allDays.forEach((day, index) => {
      if (day === null) {
        currentWeek.push(null);
      } else {
        currentWeek.push(day);
      }

      // Domingo é o último dia da semana
      if ((index + 1) % 7 === 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    let txtContent = '';

    // Título do arquivo
    txtContent += '═'.repeat(80) + '\n';
    txtContent += `    ESCALA DE TELETRABALHO - ${monthNames[currentDate.getMonth()].toUpperCase()} ${currentDate.getFullYear()}\n`;
    txtContent += '═'.repeat(80) + '\n\n';

    // Legenda
    txtContent += 'LEGENDA: 🟢 Presencial  🔵 Home Office  🟠 Férias  ⚫ Plantão/Feriado\n\n';
    txtContent += '─'.repeat(80) + '\n\n';

    // Para cada funcionário
    filteredEmployees.forEach((emp, empIndex) => {
      if (empIndex > 0) {
        txtContent += '\n' + '─'.repeat(80) + '\n\n';
      }

      // Nome e equipe do funcionário
      txtContent += `FUNCIONÁRIO: ${emp.name}\n`;
      txtContent += `EQUIPE: ${emp.team || 'Sem equipe'}\n\n`;

      // Cabeçalho dos dias da semana
      const weekDaysHeader = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
      txtContent += '    ';
      weekDaysHeader.forEach(day => {
        txtContent += day.padEnd(8);
      });
      txtContent += '\n';
      txtContent += '    ' + '─'.repeat(56) + '\n';

      // Imprimir cada semana
      weeks.forEach(week => {
        txtContent += '    ';
        week.forEach(day => {
          if (day === null) {
            txtContent += '        '; // Espaço vazio
          } else {
            const dayNum = day.getDate().toString().padStart(2, '0');
            const status = getEmployeeStatus(emp.id, day);
            const symbol = status ? statusSymbols[status] : '  ';
            txtContent += `${dayNum}${symbol}   `;
          }
        });
        txtContent += '\n';
      });

      txtContent += '\n';
    });

    txtContent += '═'.repeat(80) + '\n';

    // Resumo
    txtContent += '\nRESUMO:\n';
    txtContent += `  Total de funcionários: ${filteredEmployees.length}\n`;
    txtContent += `  Período: ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}\n`;
    txtContent += `  Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
    txtContent += '\n' + '═'.repeat(80) + '\n';

    // Download do arquivo
    const blob = new Blob([txtContent], { type: 'text/plain; charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escala_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const importEmployees = () => {
    if (!importText.trim()) return;
    
    const names = importText.trim().split('\n').filter(name => name.trim() !== '');
    const newEmployees = names.map((name, index) => ({
      id: Date.now() + index,
      name: name.trim(),
      type: 'variable',
      isManager: false,
      team: '',
      preferences: {},
      officeDays: 3,
      workingHours: '9-17'
    }));
    
    setEmployees(prev => [...prev, ...newEmployees]);
    
    const change = {
      id: Date.now(),
      timestamp: new Date(),
      action: `Importou ${newEmployees.length} pessoas em lote`
    };
    setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
    
    setImportText('');
    setShowImportModal(false);
    
    showAlert(
      '✅ Importação Concluída!',
      `${newEmployees.length} pessoas foram adicionadas com sucesso!\n\nTodas foram configuradas como "Presença Variável" (9h-17h) por padrão.`,
      'info'
    );
  };

  const addEmployee = async () => {
    if (newEmployee.name.trim()) {
      // Verificar se já existe um employee com o mesmo nome
      const existingEmployee = employees.find(
        emp => emp.name.toLowerCase() === newEmployee.name.toLowerCase()
      );

      if (existingEmployee) {
        alert(`Já existe uma escala configurada para "${newEmployee.name}". Não é possível criar duplicados.`);
        return;
      }

      try {
        // Salvar no Supabase
        const savedEmployee = await addEmployeeDb(newEmployee);

        if (savedEmployee) {
          // Atualizar estado local
          setEmployees(prev => [...prev, savedEmployee]);
          setNewEmployee({ name: '', type: 'variable', isManager: false, team: '', officeDays: 3, workingHours: '9-17' });
          setShowAddEmployee(false);

          setExpandedPersonId(savedEmployee.id);
          setEditingPerson(savedEmployee);
          setHasUnsavedChanges(false);
          setActivePersonTab('dados');
        }
      } catch (error) {
        console.error('Erro ao adicionar funcionário:', error);
        alert('Erro ao salvar funcionário. Por favor, tente novamente.');
      }
    }
  };

  const deletePerson = async (personId) => {
    try {
      // Deletar no Supabase
      await deleteEmployeeDb(personId);

      // Atualizar estado local
      setEmployees(prev => prev.filter(emp => emp.id !== personId));

      // Limpar estados relacionados
      if (expandedPersonId === personId) {
        setExpandedPersonId(null);
        setEditingPerson(null);
        setHasUnsavedChanges(false);
      }

      setSchedules(prev => {
        const newSchedules = { ...prev };
        delete newSchedules[personId];
        return newSchedules;
      });

      setVacations(prev => {
        const newVacations = { ...prev };
        delete newVacations[personId];
        return newVacations;
      });

      if (selectedPerson && selectedPerson.id === personId) {
        setSelectedPerson(null);
      }

      const person = employees.find(emp => emp.id === personId);
      const change = {
        id: Date.now(),
        timestamp: new Date(),
        action: `❌ Excluiu a pessoa ${person?.name || 'desconhecida'}`
      };
      setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      alert('Erro ao excluir funcionário. Por favor, tente novamente.');
    }
  };

  const updatePerson = async (personId, updates) => {
    try {
      // Salvar no Supabase
      await updateEmployeeDb(personId, updates);

      // Atualizar estado local
      setEmployees(prev => prev.map(emp =>
        emp.id === personId ? { ...emp, ...updates } : emp
      ));

      if (editingPerson && editingPerson.id === personId) {
        setEditingPerson(prev => ({ ...prev, ...updates }));
      }

      const change = {
        id: Date.now(),
        timestamp: new Date(),
        action: `Atualizou dados de ${updates.name}`
      };
      setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      alert('Erro ao salvar alterações. Por favor, tente novamente.');
    }
  };

  const setPersonVacation = (personId, start, end) => {
    const person = employees.find(emp => emp.id === personId);
    
    setVacations(prev => ({
      ...prev,
      [personId]: { start, end }
    }));
    
    const change = {
      id: Date.now(),
      timestamp: new Date(),
      action: `Definiu férias para ${person?.name} de ${new Date(start).toLocaleDateString()} a ${new Date(end).toLocaleDateString()}`
    };
    setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
    
    setShowVacationForm(false);
    setVacationPersonId(null);
    setVacationData({ start: '', end: '' });
  };

  const getCurrentStatus = (employeeId) => {
    const today = new Date();
    let checkDate = new Date(today);
    
    while (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return getEmployeeStatus(employeeId, checkDate);
  };

  const getFilteredEmployeesForDay = (day) => {
    return employees.filter(emp => {
      // Filtro por nickname
      if (filters.employee && !emp.name.toLowerCase().includes(filters.employee.toLowerCase())) {
        return false;
      }

      // Se há busca por nickname, ignora o filtro de equipe quando estiver como "VAZIO"
      const hasNicknameSearch = filters.employee && filters.employee.trim() !== '';

      if (filters.team) {
        if (filters.team === 'VAZIO' && !hasNicknameSearch) {
          return false; // Não mostrar nenhum card quando VAZIO estiver selecionado E não houver busca por nick
        }
        // Se há busca por nick, ignora o filtro VAZIO
        if (filters.team === 'VAZIO' && hasNicknameSearch) {
          // Continua com os outros filtros
        } else if (filters.team === 'SEM_EQUIPE') {
          if (emp.team && emp.team.trim() !== '') return false;
        } else if (filters.team !== 'VAZIO') {
          if (emp.team !== filters.team) return false;
        }
      }

      if (!filters.currentStatus) {
        return true;
      }

      const statusNesteDia = getEmployeeStatus(emp.id, day);
      return statusNesteDia === filters.currentStatus;
    });
  };

  const getFilteredEmployees = () => {
    return employees.filter(emp => {
      // Filtro por nickname
      if (filters.employee && !emp.name.toLowerCase().includes(filters.employee.toLowerCase())) {
        return false;
      }

      // Se há busca por nickname, ignora o filtro de equipe quando estiver como "VAZIO"
      // Isso permite que a busca por nick funcione independentemente do filtro de equipe
      const hasNicknameSearch = filters.employee && filters.employee.trim() !== '';

      if (filters.team) {
        if (filters.team === 'VAZIO' && !hasNicknameSearch) {
          return false; // Não mostrar nenhum card quando VAZIO estiver selecionado E não houver busca por nick
        }
        // Se há busca por nick, ignora o filtro VAZIO
        if (filters.team === 'VAZIO' && hasNicknameSearch) {
          // Continua com os outros filtros
        } else if (filters.team === 'SEM_EQUIPE') {
          return !emp.team || emp.team.trim() === '';
        } else if (filters.team !== 'VAZIO') {
          return emp.team === filters.team;
        }
      }

      if (filters.currentStatus) {
        const currentStatus = getCurrentStatus(emp.id);
        return currentStatus === filters.currentStatus;
      }
      return true;
    });
  };

  const getFilteredPeople = () => {
    return employees.filter(person => {
      // Filtro por nome/nick
      if (personFilters.name && !person.name.toLowerCase().includes(personFilters.name.toLowerCase())) {
        return false;
      }

      // Se há busca por nickname, ignora o filtro de equipe quando estiver como "VAZIO"
      const hasNicknameSearch = personFilters.name && personFilters.name.trim() !== '';

      // Filtro por equipe (usando team_id do user_profile)
      if (personFilters.team) {
        // Se VAZIO e NÃO há busca por nick, não mostrar nenhum card
        if (personFilters.team === 'VAZIO' && !hasNicknameSearch) {
          return false;
        }

        // Se há busca por nick, ignora o filtro VAZIO
        if (personFilters.team === 'VAZIO' && hasNicknameSearch) {
          // Continua com os outros filtros
          return true;
        }

        // Buscar o perfil do usuário para pegar o team_id
        const userProfile = userProfiles.find(profile =>
          profile.nick.toLowerCase() === person.name.toLowerCase() ||
          profile.user_email === person.name // Assumindo que vamos adicionar email depois
        );

        if (!userProfile || userProfile.team_id !== personFilters.team) {
          return false;
        }
      }

      return true;
    });
  };

  const getReportsData = () => {
    const days = getDaysInMonth(currentDate).filter(day => day);
    const personalStats = {};
    
    employees.forEach(emp => {
      let office = 0, home = 0, vacation = 0, holiday = 0;
      days.forEach(day => {
        const status = getEmployeeStatus(emp.id, day);
        if (status === 'office') office++;
        else if (status === 'home') home++;
        else if (status === 'vacation') vacation++;
        else if (status === 'holiday') holiday++;
      });
      
      personalStats[emp.id] = { name: emp.name, office, home, vacation, holiday };
    });
    
    return { personalStats };
  };

  const getWorkdaysInPeriod = (startDate, endDate) => {
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        days.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getAdvancedReportsData = () => {
    let startDate, endDate, days;
    
    if (reportPeriodMode === 'month') {
      const year = selectedReportMonth.getFullYear();
      const month = selectedReportMonth.getMonth();
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
      days = getWorkdaysInPeriod(startDate, endDate);
    } else {
      if (!reportStartDate || !reportEndDate) {
        return { personalStats: {}, totalWorkdays: 0, isValidPeriod: false };
      }
      startDate = new Date(reportStartDate);
      endDate = new Date(reportEndDate);
      days = getWorkdaysInPeriod(startDate, endDate);
    }
    
    const totalWorkdays = days.length;
    const personalStats = {};
    
    employees.forEach(emp => {
      let office = 0, home = 0, vacation = 0, holiday = 0, validDays = 0;
      
      days.forEach(day => {
        const status = getEmployeeStatus(emp.id, day);
        if (status === 'office') {
          office++;
          validDays++;
        } else if (status === 'home') {
          home++;
          validDays++;
        } else if (status === 'vacation') {
          vacation++;
        } else if (status === 'holiday') {
          holiday++;
        }
      });
      
      const hasInsufficientData = validDays < 3;
      const workDays = office + home;
      const presentialPercentage = workDays > 0 ? (office / workDays * 100) : 0;
      
      personalStats[emp.id] = { 
        name: emp.name, 
        office, 
        home, 
        vacation, 
        holiday,
        validDays,
        workDays,
        presentialPercentage,
        hasInsufficientData
      };
    });
    
    const totalEmployees = employees.length;
    const averages = {
      office: totalEmployees > 0 ? Object.values(personalStats).reduce((acc, stat) => acc + stat.office, 0) / totalEmployees : 0,
      home: totalEmployees > 0 ? Object.values(personalStats).reduce((acc, stat) => acc + stat.home, 0) / totalEmployees : 0,
      vacation: totalEmployees > 0 ? Object.values(personalStats).reduce((acc, stat) => acc + stat.vacation, 0) / totalEmployees : 0,
      holiday: totalEmployees > 0 ? Object.values(personalStats).reduce((acc, stat) => acc + stat.holiday, 0) / totalEmployees : 0
    };
    
    return { 
      personalStats, 
      totalWorkdays, 
      averages,
      isValidPeriod: true,
      periodStart: startDate,
      periodEnd: endDate
    };
  };

  const resetToCurrentMonth = () => {
    setReportPeriodMode('month');
    setSelectedReportMonth(new Date());
    setReportStartDate('');
    setReportEndDate('');
  };

  const getDisplayName = (fullName) => {
    const names = fullName.trim().split(' ').filter(name => name.length > 0);
    if (names.length === 1) {
      return names[0];
    } else if (names.length >= 2) {
      return `${names[0]} ${names[names.length - 1]}`;
    }
    return '';
  };

  const getSortedEmployees = (employeesList) => {
    return [...employeesList].sort((a, b) => {
      if (a.isManager && !b.isManager) return -1;
      if (!a.isManager && b.isManager) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const days = getDaysInMonth(currentDate);
  const filteredEmployees = getFilteredEmployees();
  const { personalStats } = getReportsData();
  const advancedReportData = getAdvancedReportsData();

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        .person-card-expanded {
          animation: expandCard 0.3s ease-out;
        }

        @keyframes expandCard {
          from {
            max-height: 0;
            opacity: 0;
          }
          to {
            max-height: 1000px;
            opacity: 1;
          }
        }

        .transition-all {
          transition: all 0.3s ease;
        }
      `}</style>

      <div className="w-full">
        {/* Header Superior - Moderno e Profissional */}
        <div className={`bg-gradient-to-r from-blue-600 to-indigo-700 shadow-xl px-6 py-4 mb-1 transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-20'}`}>
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-xl shadow-lg">
                <Calendar className="text-white w-8 h-8" />
              </div>
              <div>
                <h1 className="text-white text-3xl font-bold">
                  Sistema de Escalas
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  Gestão inteligente de teletrabalho
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-blue-500 flex items-center gap-2 rounded-lg px-4 py-3 shadow-md">
                <Shield className="text-white w-5 h-5" />
                <div className="text-sm">
                  <span className="text-white font-semibold">{userNick}</span>
                  <span className="text-blue-100 ml-2">
                    {userRole === 'admin' && '👑 Admin'}
                    {userRole === 'manager' && '👨‍💼 Gerente'}
                    {userRole === 'employee' && '👤 Colaborador'}
                  </span>
                </div>
              </div>

              <button
                onClick={signOut}
                className="bg-red-600 text-white flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-red-700 shadow-md font-semibold transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Vertical Retrátil */}
        <div
          className={`fixed left-0 top-0 h-full bg-white shadow-2xl border-r-2 border-gray-200 transition-all duration-300 ease-in-out z-40 ${
            sidebarExpanded ? 'w-64' : 'w-20'
          }`}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <div className="flex flex-col h-full pt-24">
            {/* Calendário */}
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center px-4 py-4 transition-all duration-200 ${
                activeTab === 'calendar'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-r-4 border-blue-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Calendário"
            >
              <Calendar className={`${sidebarExpanded ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} />
              <span className={`ml-4 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              }`}>
                Calendário
              </span>
            </button>

            {/* Escalas */}
            <button
              onClick={() => userRole !== 'employee' && setActiveTab('people')}
              disabled={userRole === 'employee'}
              className={`flex items-center px-4 py-4 transition-all duration-200 ${
                userRole === 'employee'
                  ? 'text-gray-400 opacity-50 cursor-not-allowed'
                  : activeTab === 'people'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-r-4 border-blue-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Escalas"
            >
              <Users className={`${sidebarExpanded ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} />
              <span className={`ml-4 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              }`}>
                Escalas
              </span>
            </button>

            {/* Auto */}
            <button
              onClick={() => userRole !== 'employee' && setActiveTab('auto')}
              disabled={userRole === 'employee'}
              className={`flex items-center px-4 py-4 transition-all duration-200 ${
                userRole === 'employee'
                  ? 'text-gray-400 opacity-50 cursor-not-allowed'
                  : activeTab === 'auto'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-r-4 border-blue-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Auto"
            >
              <RotateCcw className={`${sidebarExpanded ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} />
              <span className={`ml-4 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              }`}>
                Auto
              </span>
            </button>

            {/* Relatórios */}
            <button
              onClick={() => userRole !== 'employee' && setActiveTab('reports')}
              disabled={userRole === 'employee'}
              className={`flex items-center px-4 py-4 transition-all duration-200 ${
                userRole === 'employee'
                  ? 'text-gray-400 opacity-50 cursor-not-allowed'
                  : activeTab === 'reports'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-r-4 border-blue-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Relatórios"
            >
              <FileText className={`${sidebarExpanded ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} />
              <span className={`ml-4 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              }`}>
                Relatórios
              </span>
            </button>

            {/* Configurações */}
            <button
              onClick={() => userRole !== 'employee' && setActiveTab('settings')}
              disabled={userRole === 'employee'}
              className={`flex items-center px-4 py-4 transition-all duration-200 ${
                userRole === 'employee'
                  ? 'text-gray-400 opacity-50 cursor-not-allowed'
                  : activeTab === 'settings'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-r-4 border-blue-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Configurações"
            >
              <Settings className={`${sidebarExpanded ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} />
              <span className={`ml-4 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              }`}>
                Configurações
              </span>
            </button>

            {/* Equipes */}
            <button
              onClick={() => userRole !== 'employee' && setActiveTab('teams')}
              disabled={userRole === 'employee'}
              className={`flex items-center px-4 py-4 transition-all duration-200 ${
                userRole === 'employee'
                  ? 'text-gray-400 opacity-50 cursor-not-allowed'
                  : activeTab === 'teams'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-r-4 border-blue-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Equipes"
            >
              <Users className={`${sidebarExpanded ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} />
              <span className={`ml-4 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              }`}>
                Equipes
              </span>
            </button>

            {/* Usuários */}
            <button
              onClick={() => userRole !== 'employee' && setActiveTab('users')}
              disabled={userRole === 'employee'}
              className={`flex items-center px-4 py-4 transition-all duration-200 ${
                userRole === 'employee'
                  ? 'text-gray-400 opacity-50 cursor-not-allowed'
                  : activeTab === 'users'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-r-4 border-blue-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title="Usuários"
            >
              <Shield className={`${sidebarExpanded ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} />
              <span className={`ml-4 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              }`}>
                Usuários
              </span>
            </button>

            {/* Ajuda */}
            <div className="mt-auto mb-4">
              <button
                onClick={() => setShowHelp(true)}
                className="flex items-center px-4 py-4 text-gray-700 hover:bg-gray-100 transition-all duration-200 w-full"
                title="Ajuda e Legendas"
              >
                <HelpCircle className={`${sidebarExpanded ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} />
                <span className={`ml-4 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                  sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                }`}>
                  Ajuda
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal com Margem para Sidebar */}
        <div className={`transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-20'}`}>
          {/* Aviso para Colaboradores */}
          {userRole === 'employee' && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6 mx-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center border border-blue-400">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Modo Colaborador</h3>
                  <p className="text-sm text-blue-800">
                    Você tem acesso apenas à visualização do calendário. Para gerenciar pessoas, templates e configurações,
                    contate seu gestor ou administrador.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (() => {
            console.log('=== RENDERING CALENDAR ===');
            console.log('Current schedules state:', schedules);
            console.log('Total employees:', employees.length);
            return null;
          })()}

          {/* Calendar Tab - Layout com Calendário e Filtros Lado a Lado */}
          {activeTab === 'calendar' && (
            <div className="px-10 py-4 flex gap-4">
              {/* Container do Calendário - Esquerda */}
              <div className="flex-1">
                <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-300">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="px-3 py-2 text-gray-800 hover:bg-gray-100 rounded border border-gray-400 font-medium"
                >
                  ←
                </button>
                <h2 className="text-xl font-semibold text-gray-900">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 border border-green-800 font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Exportar
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    className="px-3 py-2 text-gray-800 hover:bg-gray-100 rounded border border-gray-400 font-medium"
                  >
                    →
                  </button>
                </div>
              </div>

              {employees.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma pessoa para exibir</h3>
                  <p className="text-gray-800">Vá para a aba "Pessoas" para adicionar funcionários ao sistema.</p>
                </div>
              )}

              {employees.length > 0 && (
                <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
                  <div className="grid grid-cols-7 gap-1">
                  {weekDays.map(day => (
                    <div key={day} className="p-3 text-center font-medium text-gray-900 bg-gray-200 border border-gray-400 shadow-sm">
                      {day}
                    </div>
                  ))}
                  
                  {days.map((day, index) => {
                    if (!day) {
                      return <div key={index} className="p-2 min-h-[200px]"></div>;
                    }
                    
                    const dayOfWeek = day.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const officeCount = getOfficeCount(day);
                    const isOverCapacity = officeCount > maxCapacity;
                    
                    if (isWeekend) {
                      return (
                        <div key={index} className="border border-gray-400 min-h-[200px] bg-gray-100 shadow-md">
                          <div className="p-2 text-center text-sm font-medium text-gray-700">
                            {day.getDate()}
                          </div>
                          
                          {weekendShifts[dateToString(day)] ? (
                            <div className="p-3">
                              <div className="text-center text-gray-700 text-sm mb-3 font-medium">Plantão</div>
                              <div className="text-sm font-medium text-gray-900 mb-2">⚫ Plantão</div>
                              <div className="space-y-1 min-h-[60px] bg-gray-100 p-2 rounded border border-gray-400">
                                {getSortedEmployees(getFilteredEmployeesForDay(day)).map(emp => {
                                  const isOnDuty = weekendStaff[dateToString(day)]?.includes(emp.id);
                                  if (!isOnDuty) return null;
                                  
                                  return (
                                    <div
                                      key={emp.id}
                                      className={`text-sm p-2 rounded transition-all cursor-pointer hover:opacity-80 hover:scale-105 border ${
                                        emp.isManager 
                                          ? 'bg-gray-200 text-gray-900 border-gray-600 font-semibold' 
                                          : 'bg-gray-100 text-gray-800 border-gray-500 font-medium'
                                      }`}
                                      onClick={() => toggleWeekendStaff(day, emp.id)}
                                      title={`${emp.name} ${emp.isManager ? '(Gestor)' : '(Colaborador)'} - Clique para remover do plantão`}
                                    >
                                      <div className="font-medium">
                                        {getDisplayName(emp.name)}
                                        <span className="ml-1 opacity-70">✕</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              {userRole !== 'employee' && (
                                <div className="mt-3 space-y-2">
                                  <select 
                                    className="w-full text-sm p-2 border border-gray-400 rounded"
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        toggleWeekendStaff(day, parseInt(e.target.value));
                                        e.target.value = '';
                                      }
                                    }}
                                  >
                                    <option value="">+ Adicionar ao plantão</option>
                                    {getSortedEmployees(getFilteredEmployeesForDay(day))
                                      .filter(emp => !weekendStaff[dateToString(day)]?.includes(emp.id))
                                      .map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                          {getDisplayName(emp.name)} {emp.isManager ? '(Gestor)' : ''}
                                        </option>
                                      ))
                                    }
                                  </select>
                                  <button
                                    onClick={() => toggleWeekendShift(day)}
                                    className="w-full text-sm p-2 bg-red-100 text-red-800 rounded hover:bg-red-200 border border-red-400 font-medium"
                                  >
                                    📅 Remover Plantão
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 text-center">
                              <div className="text-gray-600 text-sm mb-3">
                                Final de semana
                              </div>
                              {userRole !== 'employee' && (
                                <button
                                  onClick={() => toggleWeekendShift(day)}
                                  className="text-sm p-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 border border-blue-400 font-medium"
                                >
                                  📅 Ativar Plantão
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    return (
                      <div key={index} className="border border-gray-400 min-h-[200px] shadow-md">
                        <div className={`p-2 text-center text-sm font-medium relative border-b ${
                          holidays[dateToString(day)] 
                            ? 'bg-gray-500 text-white border-gray-700' 
                            : isOverCapacity 
                              ? 'bg-red-200 text-red-900 border-red-500' 
                              : 'bg-gray-100 text-gray-900 border-gray-300'
                        }`}>
                          <div className="flex items-center justify-center gap-1">
                            {day.getDate()}
                            {userRole !== 'employee' && (
                              <button
                                onClick={() => toggleHoliday(day)}
                                className={`p-1 rounded hover:bg-opacity-70 border ${
                                  holidays[dateToString(day)]
                                    ? 'text-white hover:bg-gray-600 border-gray-300'
                                    : 'text-gray-700 hover:bg-gray-200 border-gray-400'
                                }`}
                                title={holidays[dateToString(day)] ? 'Remover feriado' : 'Marcar como feriado'}
                              >
                                <Calendar className="w-3 h-3" />
                              </button>
                            )}
                            {isOverCapacity && !holidays[dateToString(day)] && (
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                            )}
                          </div>
                        </div>
                        
                        {holidays[dateToString(day)] ? (
                          <div className="p-3">
                            <div className="text-center text-gray-700 text-sm mb-3 font-medium">Feriado</div>
                            <div className="text-sm font-medium text-gray-900 mb-2">⚫ Plantão</div>
                            <div className="space-y-1 min-h-[60px] bg-gray-100 p-2 rounded border border-gray-400">
                              {getSortedEmployees(getFilteredEmployeesForDay(day)).map(emp => {
                                const isOnDuty = holidayStaff[dateToString(day)]?.includes(emp.id);
                                if (!isOnDuty) return null;
                                
                                return (
                                  <div
                                    key={emp.id}
                                    className={`text-sm p-2 rounded transition-all cursor-pointer hover:opacity-80 hover:scale-105 border ${
                                      emp.isManager 
                                        ? 'bg-gray-300 text-gray-900 border-blue-600 font-semibold shadow-sm' 
                                        : 'bg-gray-200 text-gray-800 border-blue-500 font-medium shadow-sm'
                                    }`}
                                    onClick={() => toggleHolidayStaff(day, emp.id)}
                                    title={`${emp.name} ${emp.isManager ? '(Gestor)' : '(Colaborador)'} - Clique para remover do plantão`}
                                  >
                                    <div className="font-medium">
                                      {getDisplayName(emp.name)}
                                      <span className="ml-1 opacity-70">✕</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {userRole !== 'employee' && (
                              <div className="mt-3">
                                <select 
                                  className="w-full text-sm p-2 border border-gray-400 rounded"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      toggleHolidayStaff(day, parseInt(e.target.value));
                                      e.target.value = '';
                                    }
                                  }}
                                >
                                  <option value="">+ Adicionar ao plantão</option>
                                  {getSortedEmployees(getFilteredEmployeesForDay(day))
                                    .filter(emp => !holidayStaff[dateToString(day)]?.includes(emp.id))
                                    .map(emp => (
                                      <option key={emp.id} value={emp.id}>
                                        {getDisplayName(emp.name)} {emp.isManager ? '(Gestor)' : ''}
                                      </option>
                                    ))
                                  }
                                </select>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="p-2">
                              <div className="text-sm font-medium text-gray-900 mb-2">🟢 Presencial</div>
                              <div className="space-y-1 min-h-[60px] bg-green-50 p-2 rounded border border-green-300">
                                {getSortedEmployees(getFilteredEmployeesForDay(day)).map(emp => {
                                  const status = getEmployeeStatus(emp.id, day);
                                  
                                  if (status !== 'office') return null;
                                  
                                  let borderClass = '';
                                  if (emp.type === 'always_office') {
                                    borderClass = 'border-l-4 border-l-green-700';
                                  } else if (emp.type === 'always_home') {
                                    borderClass = 'border-l-4 border-l-blue-700';
                                  }
                                  
                                  return (
                                    <div
                                      key={emp.id}
                                      className={`text-sm p-2 rounded transition-all border ${borderClass} ${
                                        userRole !== 'employee' && emp.type === 'variable'
                                          ? 'cursor-pointer hover:opacity-80 hover:scale-105' 
                                          : 'cursor-default'
                                      } ${
                                        emp.isManager 
                                          ? 'bg-green-200 text-green-900 border-green-600 font-semibold' 
                                          : 'bg-green-100 text-green-800 border-green-500 font-medium'
                                      }`}
                                      onClick={() => {
                                        if (userRole !== 'employee' && emp.type === 'variable') {
                                          setEmployeeStatus(emp.id, day, 'home');
                                        }
                                      }}
                                      title={`${emp.name} ${emp.isManager ? '(Gestor)' : '(Colaborador)'} ${
                                        emp.type === 'variable' ? '- Clique para alternar' : ''
                                      }`}
                                    >
                                      <div className="font-medium">
                                        {getDisplayName(emp.name)}
                                        {userRole !== 'employee' && emp.type === 'variable' && (
                                          <span className="ml-1 opacity-70">⇄</span>
                                        )}
                                      </div>
                                      <div className="text-xs opacity-80 mt-1">
                                        [{emp.workingHours || '9-17'}]
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            <div className="p-2">
                              <div className="text-sm font-medium text-gray-900 mb-2">🔵 Home Office</div>
                              <div className="space-y-1 min-h-[60px] bg-blue-50 p-2 rounded border border-blue-300">
                                {getSortedEmployees(getFilteredEmployeesForDay(day)).map(emp => {
                                  const status = getEmployeeStatus(emp.id, day);
                                  
                                  if (status !== 'home') return null;
                                  
                                  let borderClass = '';
                                  if (emp.type === 'always_office') {
                                    borderClass = 'border-l-4 border-l-green-700';
                                  } else if (emp.type === 'always_home') {
                                    borderClass = 'border-l-4 border-l-blue-700';
                                  }
                                  
                                  return (
                                    <div
                                      key={emp.id}
                                      className={`text-sm p-2 rounded transition-all border ${borderClass} ${
                                        userRole !== 'employee' && emp.type === 'variable'
                                          ? 'cursor-pointer hover:opacity-80 hover:scale-105' 
                                          : 'cursor-default'
                                      } ${
                                        emp.isManager 
                                          ? 'bg-blue-200 text-blue-900 border-blue-600 font-semibold' 
                                          : 'bg-blue-100 text-blue-800 border-blue-500 font-medium'
                                      }`}
                                      onClick={() => {
                                        if (userRole !== 'employee' && emp.type === 'variable') {
                                          setEmployeeStatus(emp.id, day, 'office');
                                        }
                                      }}
                                      title={`${emp.name} ${emp.isManager ? '(Gestor)' : '(Colaborador)'} ${
                                        emp.type === 'variable' ? '- Clique para alternar' : ''
                                      }`}
                                    >
                                      <div className="font-medium">
                                        {getDisplayName(emp.name)}
                                        {userRole !== 'employee' && emp.type === 'variable' && (
                                          <span className="ml-1 opacity-70">⇄</span>
                                        )}
                                      </div>
                                      <div className="text-xs opacity-80 mt-1">
                                        [{emp.workingHours || '9-17'}]
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Seção de Férias */}
                            <div className="p-2">
                              <div className="text-sm font-medium text-gray-900 mb-2">🟠 Férias</div>
                              <div className="space-y-1 min-h-[40px] bg-orange-50 p-2 rounded border border-orange-300">
                                {getSortedEmployees(getFilteredEmployeesForDay(day)).map(emp => {
                                  const status = getEmployeeStatus(emp.id, day);
                                  
                                  if (status !== 'vacation') return null;
                                  
                                  return (
                                    <div
                                      key={emp.id}
                                      className={`text-sm p-2 rounded transition-all cursor-default border ${
                                        emp.isManager 
                                          ? 'bg-orange-200 text-orange-900 border-orange-600 font-semibold' 
                                          : 'bg-orange-100 text-orange-800 border-orange-500 font-medium'
                                      }`}
                                      title={`${emp.name} ${emp.isManager ? '(Gestor)' : '(Colaborador)'} - De férias`}
                                    >
                                      <div className="font-medium">
                                        {getDisplayName(emp.name)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            <div className="p-1 text-sm text-center text-gray-900 border-t border-gray-300 font-medium">
                              {officeCount}/{maxCapacity} no escritório
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
                </div>
              </div>
              {/* Fim do Container do Calendário */}

              {/* Container de Filtros - Direita (Slide In/Out) */}
              <div
                className={`bg-white rounded-lg shadow-sm border border-gray-300 transition-all duration-500 ease-in-out overflow-hidden ${
                  filtersSidebarExpanded ? 'w-72' : 'w-16'
                }`}
                onMouseEnter={() => setFiltersSidebarExpanded(true)}
                onMouseLeave={() => setFiltersSidebarExpanded(false)}
              >
                <div className={`p-4 h-full transition-all duration-500 ${filtersSidebarExpanded ? '' : 'flex flex-col items-center justify-center gap-6'}`}>
                  {!filtersSidebarExpanded ? (
                    /* Ícones individuais quando recolhido - centralizados verticalmente */
                    <div className="transition-opacity duration-500">
                      {/* Ícone Nickname */}
                      <div className="relative mb-6">
                        <User className="w-6 h-6 text-gray-700" title="Filtro por Nickname" />
                        {filters.employee && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                        )}
                      </div>

                      {/* Ícone Equipe */}
                      <div className="relative mb-6">
                        <Users className="w-6 h-6 text-gray-700" title="Filtro por Equipe" />
                        {filters.team && filters.team !== '' && filters.team !== 'VAZIO' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                        )}
                      </div>

                      {/* Ícone Status */}
                      <div className="relative">
                        <Home className="w-6 h-6 text-gray-700" title="Filtro por Status" />
                        {filters.currentStatus && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Conteúdo expandido com título */
                    <div className="transition-opacity duration-500">
                      <div className="flex items-center gap-2 mb-6">
                        <Filter className="flex-shrink-0 w-5 h-5 text-gray-700" />
                        <h3 className="font-semibold text-gray-900">
                          Filtros
                        </h3>
                      </div>
                    </div>
                  )}

                  <div className={`space-y-4 transition-opacity duration-500 ${filtersSidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Nickname
                      </label>
                      <input
                        type="text"
                        placeholder="Buscar por nick..."
                        value={filters.employee}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFilters(prev => ({ ...prev, employee: value }));
                          setShowCalendarSuggestions(value.length > 0);
                        }}
                        onFocus={() => setShowCalendarSuggestions(filters.employee.length > 0)}
                        onBlur={() => setTimeout(() => setShowCalendarSuggestions(false), 200)}
                        className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-300 text-sm"
                      />

                      {/* Dropdown de sugestões */}
                      {showCalendarSuggestions && filters.employee.length > 0 && (
                        (() => {
                          const suggestions = employees.filter(emp =>
                            emp.name.toLowerCase().includes(filters.employee.toLowerCase())
                          );

                          return suggestions.length > 0 ? (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {suggestions.map(emp => (
                                <button
                                  key={emp.id}
                                  type="button"
                                  onClick={() => {
                                    setFilters(prev => ({ ...prev, employee: emp.name }));
                                    setShowCalendarSuggestions(false);
                                  }}
                                  className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-200 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{emp.name}</div>
                                  {emp.team && (
                                    <div className="text-xs text-gray-600">{emp.team}</div>
                                  )}
                                </button>
                              ))}
                            </div>
                          ) : null;
                        })()
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Equipe
                      </label>
                      <select
                        value={filters.team}
                        onChange={(e) => setFilters(prev => ({ ...prev, team: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-300 text-sm"
                      >
                        <option value="VAZIO">Nenhuma selecionada</option>
                        <option value="">Todas as equipes</option>
                        {teams.map(team => (
                          <option key={team} value={team}>{team}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Status Atual
                      </label>
                      <select
                        value={filters.currentStatus || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, currentStatus: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-300 text-sm"
                      >
                        <option value="">Todos os status</option>
                        <option value="office">🟢 Presencial</option>
                        <option value="home">🔵 Home Office</option>
                        <option value="vacation">🟠 Férias</option>
                        <option value="holiday">⚫ Plantão/Feriado</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              {/* Fim do Container de Filtros */}
            </div>
          )}

        {/* Templates Tab */}
        {/* Auto Tab - Nova Aba de Distribuição */}
        {activeTab === 'auto' && userRole !== 'employee' && (
          <div className="px-10 py-4">
            <AutoTab
            employees={employees}
            userRole={userRole}
            targetOfficeCount={targetOfficeCount}
            onApplyCustomDistribution={applyCustomDistribution}
            onClearAllSchedules={clearAllSchedules}
          />
          </div>
        )}

        {/* Escalas Tab */}
        {activeTab === 'people' && userRole !== 'employee' && (
          <div className="space-y-4 px-10 py-4">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Configuração de Escalas</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 border border-green-800 font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    Importar Lista
                  </button>
                  <button
                    onClick={() => setShowAddEmployee(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 border border-blue-800 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Configurar Escala
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar por Nick
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o nick do usuário..."
                    value={personFilters.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPersonFilters(prev => ({ ...prev, name: value }));
                      setShowNickSuggestions(value.length > 0);
                    }}
                    onFocus={() => setShowNickSuggestions(personFilters.name.length > 0)}
                    onBlur={() => setTimeout(() => setShowNickSuggestions(false), 200)}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg text-sm"
                  />

                  {/* Dropdown de sugestões */}
                  {showNickSuggestions && personFilters.name.length > 0 && (
                    (() => {
                      const suggestions = employees.filter(emp =>
                        emp.name.toLowerCase().includes(personFilters.name.toLowerCase())
                      );

                      return suggestions.length > 0 ? (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {suggestions.map(emp => (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => {
                                setPersonFilters(prev => ({ ...prev, name: emp.name }));
                                setShowNickSuggestions(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-200 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{emp.name}</div>
                              {emp.team && (
                                <div className="text-xs text-gray-600">{emp.team}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : null;
                    })()
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filtrar por Equipe
                  </label>
                  <select
                    value={personFilters.team || ''}
                    onChange={(e) => setPersonFilters(prev => ({ ...prev, team: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg text-sm"
                  >
                    <option value="VAZIO">Nenhuma selecionada</option>
                    <option value="">Todas as equipes</option>
                    {dbTeams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* People Grid */}
              <div className="border border-gray-400 rounded-lg p-4" style={{ maxHeight: '70vh', minHeight: '60vh' }}>
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
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 border border-green-800 font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        Importar Lista
                      </button>
                      <button
                        onClick={() => setShowAddEmployee(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 border border-blue-800 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Configurar Escala
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getSortedEmployees(getFilteredPeople()).map(person => {
                      const status = getCurrentStatus(person.id);
                      const statusIcon = {
                        'office': '🟢',
                        'home': '🔵', 
                        'vacation': '🟠',
                        'always_office': '🟢',
                        'always_home': '🔵',
                        'variable': '⚪'
                      };
                      const isExpanded = expandedPersonId === person.id;
                      const currentEditData = editingPerson || person;

                      return (
                        <div
                          key={person.id}
                          className={`transition-all duration-300 rounded-lg border ${
                            isExpanded 
                              ? 'border-blue-500 bg-blue-50 shadow-lg' 
                              : 'border-gray-400 bg-white hover:border-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {/* Card Header */}
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-lg">{statusIcon[status] || '⚪'}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-base truncate flex items-center gap-2 text-gray-900">
                                    {person.name}
                                    {person.isManager && (
                                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded border border-purple-400 font-medium">
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
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-400"
                                  title="Editar pessoa"
                                  disabled={userRole === 'employee'}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    showConfirm(
                                      '❌ Excluir Pessoa',
                                      `Tem certeza que deseja excluir ${person.name}?`,
                                      () => deletePerson(person.id),
                                      'danger'
                                    );
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-400"
                                  title="Excluir pessoa"
                                  disabled={userRole === 'employee'}
                                >
                                  <Trash2 className="w-4 h-4" />
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
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 border border-blue-800 font-medium"
                              >
                                📋 {isExpanded ? 'Fechar Detalhes' : 'Ver Detalhes'}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="border-t border-blue-300 bg-white person-card-expanded">
                              <div className="p-4">
                                {/* Header da expansão com abas */}
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex gap-4">
                                    <button
                                      onClick={() => setActivePersonTab('dados')}
                                      className={`pb-2 px-1 border-b-2 transition-colors font-medium ${
                                        activePersonTab === 'dados' 
                                          ? 'border-blue-600 text-blue-600' 
                                          : 'border-transparent text-gray-600 hover:text-gray-800'
                                      }`}
                                    >
                                      📋 Dados Básicos
                                    </button>
                                    <button
                                      onClick={() => setActivePersonTab('escala')}
                                      className={`pb-2 px-1 border-b-2 transition-colors font-medium ${
                                        activePersonTab === 'escala' 
                                          ? 'border-blue-600 text-blue-600' 
                                          : 'border-transparent text-gray-600 hover:text-gray-800'
                                      }`}
                                    >
                                      📅 Escala & Férias
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
                                            
                                            const change = {
                                              id: Date.now(),
                                              timestamp: new Date(),
                                              action: `Atualizou dados de ${editingPerson.name}`
                                            };
                                            setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
                                          }
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 border border-green-800 font-medium"
                                      >
                                        💾 Salvar
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Conteúdo das Abas */}
                                {activePersonTab === 'dados' && (
                                  <div className="space-y-4">
                                    {editingPerson && editingPerson.id === person.id ? (
                                      /* Modo Edição */
                                      <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                            <input
                                              type="text"
                                              value={currentEditData.name}
                                              onChange={(e) => {
                                                setEditingPerson(prev => ({ ...(prev || person), name: e.target.value }));
                                                setHasUnsavedChanges(true);
                                              }}
                                              className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Equipe</label>
                                            <input
                                              type="text"
                                              value={currentEditData.team || ''}
                                              onChange={(e) => {
                                                setEditingPerson(prev => ({ ...(prev || person), team: e.target.value }));
                                                setHasUnsavedChanges(true);
                                              }}
                                              className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
                                            />
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-1">Regime de Trabalho</label>
                                          <select
                                            value={currentEditData.type}
                                            onChange={(e) => {
                                              const newType = e.target.value;
                                              const oldType = currentEditData.type;

                                              // Se mudar de 'variable' para outro tipo E tiver homeOfficeDays, perguntar
                                              if (oldType === 'variable' && newType !== 'variable' &&
                                                  currentEditData.homeOfficeDays && currentEditData.homeOfficeDays.length > 0) {
                                                showConfirm(
                                                  '⚠️ Limpar Escala Manual?',
                                                  `Esta pessoa possui ${currentEditData.homeOfficeDays.length} dias de escala manual definidos.\n\nAo mudar para "${newType === 'always_office' ? 'Sempre Presencial' : 'Sempre Home Office'}", a escala manual será removida.\n\nDeseja continuar?`,
                                                  () => {
                                                    setEditingPerson(prev => ({
                                                      ...(prev || person),
                                                      type: newType,
                                                      homeOfficeDays: [] // Limpar escala manual
                                                    }));
                                                    setHasUnsavedChanges(true);
                                                  },
                                                  'warning'
                                                );
                                              } else {
                                                // Mudar tipo normalmente
                                                setEditingPerson(prev => ({ ...(prev || person), type: newType }));
                                                setHasUnsavedChanges(true);
                                              }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
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
                                              setEditingPerson(prev => ({ ...(prev || person), workingHours: e.target.value }));
                                              setHasUnsavedChanges(true);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
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
                                              setEditingPerson(prev => ({ ...(prev || person), isManager: e.target.checked }));
                                              setHasUnsavedChanges(true);
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          />
                                          <span className="text-sm">Gestor</span>
                                        </label>
                                      </>
                                    ) : (
                                      /* Modo Visualização */
                                      <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                                            <div className="text-sm text-gray-600">Regime de Trabalho</div>
                                            <div className="font-medium">{employeeTypes[person.type]}</div>
                                          </div>
                                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                                            <div className="text-sm text-gray-600">Horário de Trabalho</div>
                                            <div className="font-medium">{workingHours[person.workingHours || '9-17']?.label || 'Não definido'}</div>
                                          </div>
                                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                                            <div className="text-sm text-gray-600">Status Atual</div>
                                            <div className="font-medium">{statusLabels[status] || 'Não definido'}</div>
                                          </div>
                                        </div>
                                        
                                        <div className="pt-3">
                                          <button
                                            onClick={() => {
                                              setEditingPerson(person);
                                              setHasUnsavedChanges(false);
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border border-blue-800 font-medium"
                                            disabled={userRole === 'employee'}
                                          >
                                            ✏️ Editar Dados
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}

                                {activePersonTab === 'escala' && (
                                  <div className="space-y-4">
                                    {/* Seção de Férias */}
                                    {vacations[person.id] && (
                                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-300">
                                        <div className="text-sm text-gray-600 mb-1">🟠 Período de Férias Configurado</div>
                                        <div className="font-medium">
                                          {new Date(vacations[person.id].start).toLocaleDateString()} a {new Date(vacations[person.id].end).toLocaleDateString()}
                                        </div>
                                      </div>
                                    )}

                                    {/* Ações de Férias e Escala */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <button
                                        onClick={() => {
                                          setSelectedPerson(person);
                                          setVacationPersonId(person.id);
                                          setShowVacationForm(true);
                                        }}
                                        className="flex items-center gap-2 p-3 border border-orange-400 text-orange-700 rounded-lg hover:bg-orange-50 font-medium"
                                      >
                                        <Calendar className="w-4 h-4" />
                                        {vacations[person.id] ? 'Alterar Férias' : 'Definir Férias'}
                                      </button>
                                      
                                      {vacations[person.id] && (
                                        <button
                                          onClick={() => {
                                            showConfirm(
                                              'Remover Férias',
                                              'Tem certeza que deseja remover o período de férias?',
                                              () => {
                                                setVacations(prev => {
                                                  const newVacations = { ...prev };
                                                  delete newVacations[person.id];
                                                  return newVacations;
                                                });
                                                
                                                const change = {
                                                  id: Date.now(),
                                                  timestamp: new Date(),
                                                  action: `Removeu férias de ${person.name}`
                                                };
                                                setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
                                              },
                                              'warning'
                                            );
                                          }}
                                          className="flex items-center gap-2 p-3 border border-red-400 text-red-700 rounded-lg hover:bg-red-50 font-medium"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          Remover Férias
                                        </button>
                                      )}
                                      
                                      <button
                                        onClick={() => {
                                          showConfirm(
                                            'Limpar Configurações',
                                            `Tem certeza que deseja limpar TODAS as configurações manuais de ${person.name}?\n\nEla voltará a seguir apenas o regime: ${employeeTypes[person.type]}`,
                                            () => {
                                              const days = getDaysInMonth(currentDate).filter(day => day);
                                              days.forEach(day => {
                                                if (schedules[person.id]) {
                                                  const dateStr = dateToString(day);
                                                  setSchedules(prev => ({
                                                    ...prev,
                                                    [person.id]: {
                                                      ...prev[person.id],
                                                      [dateStr]: null
                                                    }
                                                  }));
                                                }
                                              });

                                              setSchedules(prev => {
                                                const newSchedules = { ...prev };
                                                delete newSchedules[person.id];
                                                return newSchedules;
                                              });

                                              // Limpar homeOfficeDays também
                                              setEmployees(prev => prev.map(emp =>
                                                emp.id === person.id ? { ...emp, homeOfficeDays: [] } : emp
                                              ));

                                              const change = {
                                                id: Date.now(),
                                                timestamp: new Date(),
                                                action: `Limpou TODAS as configurações manuais de ${person.name}`
                                              };
                                              setChangeHistory(prev => [change, ...prev.slice(0, 99)]);

                                              showAlert(
                                                '✅ Configurações Limpas',
                                                `Todas as configurações manuais de ${person.name} foram removidas!\n\nAgora ela seguirá apenas o regime de trabalho: ${employeeTypes[person.type]}`,
                                                'info'
                                              );
                                            },
                                            'warning'
                                          );
                                        }}
                                        className="flex items-center gap-2 p-3 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                        Limpar TODAS Configurações
                                      </button>
                                    </div>

                                    {/* Mini-Calendário de Escala Manual (apenas para type === 'variable') */}
                                    {person.type === 'variable' && (
                                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="text-sm font-medium text-blue-900">
                                            📅 Escala Manual do Mês ({monthNames[currentDate.getMonth()]} {currentDate.getFullYear()})
                                          </div>
                                          <div className="text-xs text-blue-700">
                                            Clique nos dias para marcar Home Office (🔵)
                                          </div>
                                        </div>

                                        {/* Mini-calendário */}
                                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                                          <div className="grid grid-cols-7 gap-1 mb-2">
                                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                              <div key={day} className="text-center text-xs font-medium text-gray-600 p-1">
                                                {day}
                                              </div>
                                            ))}
                                          </div>

                                          <div className="grid grid-cols-7 gap-1">
                                            {getDaysInMonth(currentDate).map((day, index) => {
                                              if (!day) {
                                                return <div key={index} className="p-2"></div>;
                                              }

                                              const dateStr = dateToString(day);
                                              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                              const isHomeOffice = person.homeOfficeDays?.includes(dateStr);
                                              const isToday = new Date().toDateString() === day.toDateString();

                                              return (
                                                <button
                                                  key={index}
                                                  onClick={() => {
                                                    if (isWeekend) return; // Não permitir clicar em fins de semana

                                                    const currentDays = person.homeOfficeDays || [];
                                                    const isCurrentlyHome = currentDays.includes(dateStr);
                                                    const newStatus = isCurrentlyHome ? 'office' : 'home';

                                                    // 1. Atualizar homeOfficeDays no employee
                                                    setEmployees(prev => prev.map(emp => {
                                                      if (emp.id !== person.id) return emp;

                                                      const newDays = isCurrentlyHome
                                                        ? currentDays.filter(d => d !== dateStr)
                                                        : [...currentDays, dateStr];

                                                      return { ...emp, homeOfficeDays: newDays };
                                                    }));

                                                    // 2. Atualizar schedules para que o Calendário veja
                                                    setSchedules(prev => ({
                                                      ...prev,
                                                      [person.id]: {
                                                        ...prev[person.id],
                                                        [dateStr]: newStatus
                                                      }
                                                    }));

                                                    // 3. Salvar no Supabase
                                                    setEmployeeStatusDb(person.id, day, newStatus);

                                                    // 4. Adicionar ao histórico de mudanças
                                                    const change = {
                                                      id: Date.now(),
                                                      timestamp: new Date(),
                                                      action: `Marcou ${person.name} em ${day.toLocaleDateString()} como ${newStatus === 'home' ? 'Home Office' : 'Presencial'} (escala manual)`
                                                    };
                                                    setChangeHistory(prev => [change, ...prev.slice(0, 99)]);

                                                    setHasUnsavedChanges(true);
                                                  }}
                                                  disabled={isWeekend}
                                                  className={`
                                                    p-2 text-xs rounded transition-all
                                                    ${isWeekend
                                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                      : isHomeOffice
                                                        ? 'bg-blue-500 text-white font-semibold hover:bg-blue-600 shadow'
                                                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                                                    }
                                                    ${isToday && !isWeekend ? 'ring-2 ring-yellow-400' : ''}
                                                  `}
                                                  title={
                                                    isWeekend
                                                      ? 'Fim de semana'
                                                      : isHomeOffice
                                                        ? 'Home Office - Clique para alternar'
                                                        : 'Presencial - Clique para marcar Home Office'
                                                  }
                                                >
                                                  <div>{day.getDate()}</div>
                                                  {!isWeekend && isHomeOffice && (
                                                    <div className="text-xs">🔵</div>
                                                  )}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* Legenda */}
                                        <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                                          <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                              <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                                              <span>Presencial</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                              <span>Home Office</span>
                                            </div>
                                          </div>
                                          <div className="text-blue-700 font-medium">
                                            {person.homeOfficeDays?.filter(dateStr => {
                                              const date = new Date(dateStr);
                                              return date.getMonth() === currentDate.getMonth() &&
                                                     date.getFullYear() === currentDate.getFullYear();
                                            }).length || 0} dias de home office marcados
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Mensagem para always_office e always_home */}
                                    {person.type !== 'variable' && (
                                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                                        <div className="text-sm text-gray-600 mb-2">📋 Regime de Trabalho Fixo</div>
                                        <div className="text-sm text-gray-700">
                                          Esta pessoa possui regime <strong>{employeeTypes[person.type]}</strong>.
                                          Para alterar, modifique o campo "Regime de Trabalho" na aba Dados Básicos.
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && userRole !== 'employee' && (
          <div className="space-y-4 px-10 py-4">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-300">
              <h3 className="font-semibold mb-4">📊 Configuração do Período de Análise</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modo de Análise</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="reportMode"
                        value="month"
                        checked={reportPeriodMode === 'month'}
                        onChange={(e) => setReportPeriodMode(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">📅 Mês Específico</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="reportMode"
                        value="custom"
                        checked={reportPeriodMode === 'custom'}
                        onChange={(e) => setReportPeriodMode(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">📆 Período Personalizado</span>
                    </label>
                  </div>
                </div>

                <div className="lg:col-span-1">
                  {reportPeriodMode === 'month' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mês/Ano</label>
                      <input
                        type="month"
                        value={`${selectedReportMonth.getFullYear()}-${String(selectedReportMonth.getMonth() + 1).padStart(2, '0')}`}
                        onChange={(e) => {
                          const [year, month] = e.target.value.split('-');
                          setSelectedReportMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
                        }}
                        className="w-full px-3 py-2 border border-gray-400 rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                        <input
                          type="date"
                          value={reportStartDate}
                          onChange={(e) => setReportStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-400 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
                        <input
                          type="date"
                          value={reportEndDate}
                          onChange={(e) => setReportEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-400 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-1 flex flex-col justify-end">
                  <button
                    onClick={resetToCurrentMonth}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-2 border border-blue-800 font-medium"
                  >
                    🔄 Mês Atual
                  </button>
                  {advancedReportData.isValidPeriod && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-300">
                      📊 <strong>{advancedReportData.totalWorkdays} dias úteis</strong> no período
                    </div>
                  )}
                </div>
              </div>

              {reportPeriodMode === 'custom' && (!reportStartDate || !reportEndDate) && (
                <div className="bg-yellow-50 border border-yellow-300 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span className="text-sm text-yellow-800">
                      Preencha as datas de início e fim.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {advancedReportData.isValidPeriod && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center border border-green-300">
                  <div className="text-2xl font-semibold text-green-600">
                    {advancedReportData.averages.office.toFixed(1)}
                  </div>
                  <div className="text-sm text-green-700 font-medium">Média Presencial</div>
                  <div className="text-xs text-gray-500">(dias/pessoa)</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-300">
                  <div className="text-2xl font-semibold text-blue-600">
                    {advancedReportData.averages.home.toFixed(1)}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">Média Home Office</div>
                  <div className="text-xs text-gray-500">(dias/pessoa)</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center border border-orange-300">
                  <div className="text-2xl font-semibold text-orange-600">
                    {advancedReportData.averages.vacation.toFixed(1)}
                  </div>
                  <div className="text-sm text-orange-700 font-medium">Média Férias</div>
                  <div className="text-xs text-gray-500">(dias/pessoa)</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-400">
                  <div className="text-2xl font-semibold text-gray-600">
                    {advancedReportData.averages.holiday.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">Média Plantão</div>
                  <div className="text-xs text-gray-500">(dias/pessoa)</div>
                </div>
              </div>
            )}

            {advancedReportData.isValidPeriod && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-300">
                <h3 className="font-semibold mb-4">Estatísticas Individuais por Pessoa</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-300">
                  <h4 className="font-medium text-gray-800 mb-2">ℹ️ Sobre os Cálculos:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div>• <strong>Dias úteis:</strong> segunda a sexta</div>
                    <div>• <strong>Percentual:</strong> exclui férias e feriados</div>
                    <div>• <strong>Dados insuficientes:</strong> menos de 3 dias válidos</div>
                    <div>• <strong>Médias:</strong> sobre total de pessoas</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {Object.values(advancedReportData.personalStats).map(stat => {
                    const presentialPercentage = stat.presentialPercentage;
                    const hasInsufficientData = stat.hasInsufficientData;
                    
                    let isHighDeviation = false, isLowPresence = false, isHighPresence = false;
                    
                    if (!hasInsufficientData) {
                      const validStats = Object.values(advancedReportData.personalStats).filter(s => !s.hasInsufficientData);
                      if (validStats.length > 1) {
                        const avgPresential = validStats.reduce((acc, s) => acc + s.presentialPercentage, 0) / validStats.length;
                        const deviation = Math.abs(presentialPercentage - avgPresential);
                        isHighDeviation = deviation > 25;
                        isLowPresence = presentialPercentage < 20;
                        isHighPresence = presentialPercentage > 80;
                      }
                    }
                    
                    return (
                      <div 
                        key={stat.name} 
                        className={`p-4 rounded-lg border transition-all ${
                          hasInsufficientData
                            ? 'border-gray-400 bg-gray-50'
                            : isHighDeviation 
                              ? 'border-red-400 bg-red-50' 
                              : isLowPresence || isHighPresence
                                ? 'border-yellow-400 bg-yellow-50'
                                : 'border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{getDisplayName(stat.name)}</h4>
                            <div className="text-xs text-gray-600">
                              {employees.find(emp => emp.name === stat.name)?.team || 'Sem equipe'}
                            </div>
                            {hasInsufficientData && (
                              <div className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded mt-1 border border-gray-400">
                                ⚠️ Poucos dados ({stat.validDays} dias)
                              </div>
                            )}
                          </div>
                          <div className="ml-2">
                            {hasInsufficientData ? (
                              <span className="text-gray-400 text-lg" title="Dados insuficientes">📊</span>
                            ) : (
                              <>
                                {isHighDeviation && <span className="text-red-600 text-lg" title="Grande discrepância">⚠️</span>}
                                {isLowPresence && <span className="text-blue-600 text-lg" title="Baixa presença">🏠</span>}
                                {isHighPresence && <span className="text-green-600 text-lg" title="Alta presença">🏢</span>}
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">🟢 Presencial:</span>
                            <span className="font-medium text-sm">{stat.office} dias</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">🔵 Home Office:</span>
                            <span className="font-medium text-sm">{stat.home} dias</span>
                          </div>
                          {stat.vacation > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">🟠 Férias:</span>
                              <span className="font-medium text-sm">{stat.vacation} dias</span>
                            </div>
                          )}
                          {stat.holiday > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">⚫ Plantão:</span>
                              <span className="font-medium text-sm">{stat.holiday} dias</span>
                            </div>
                          )}
                          
                          {!hasInsufficientData && stat.workDays > 0 && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Presencial</span>
                                <span className="font-medium">{presentialPercentage.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 border border-gray-400">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    presentialPercentage < 30 ? 'bg-blue-500' :
                                    presentialPercentage > 70 ? 'bg-green-500' : 'bg-yellow-500'
                                  }`}
                                  style={{ width: `${presentialPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          
                          {!hasInsufficientData && (
                            <>
                              {isHighDeviation && (
                                <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded border border-red-300">
                                  <strong>⚠️ Discrepância detectada</strong>
                                </div>
                              )}
                              {isLowPresence && !isHighDeviation && (
                                <div className="mt-2 text-xs text-blue-600 bg-blue-100 p-2 rounded border border-blue-300">
                                  <strong>🏠 Baixa presença</strong>
                                </div>
                              )}
                              {isHighPresence && !isHighDeviation && (
                                <div className="mt-2 text-xs text-green-600 bg-green-100 p-2 rounded border border-green-300">
                                  <strong>🏢 Alta presença</strong>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-300">
              <h3 className="font-semibold mb-4">Histórico de Alterações</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-400 rounded-lg p-4">
                {changeHistory.slice(0, 10).map(change => (
                  <div key={change.id} className="flex items-center justify-between p-3 bg-gray-50 rounded text-sm border border-gray-300">
                    <span>{change.action}</span>
                    <span className="text-gray-500">{change.timestamp.toLocaleString()}</span>
                  </div>
                ))}
                {changeHistory.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Nenhuma alteração registrada ainda
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && userRole !== 'employee' && (
          <div className="space-y-4 px-10 py-4">
            <div className="bg-red-50 border-2 border-red-300 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">🔄 Iniciar Nova Escala</h3>
                  <p className="text-sm text-red-700 mb-1">
                    <strong>⚠️ CUIDADO:</strong> Reset completo do sistema!
                  </p>
                  <p className="text-xs text-red-600">
                    Remove TODAS as pessoas e limpa todas as escalas.
                  </p>
                </div>
                <button
                  onClick={startNewSchedule}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium border border-red-800 transition-all hover:scale-105"
                  disabled={userRole === 'employee'}
                >
                  <RotateCcw className="w-5 h-5" />
                  Iniciar Nova Escala
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-300">
              <h3 className="font-semibold mb-4">Configurações do Sistema</h3>
              
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Sistema de Metas Atualizado</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>• <strong>Meta presencial:</strong> Sempre respeitada (prioridade absoluta)</div>
                      <div>• <strong>Capacidade máxima:</strong> Apenas indicador visual - não limita</div>
                      <div>• <strong>Superlotação:</strong> Fundo vermelho no calendário quando exceder</div>
                      <div>• <strong>Controle total:</strong> Você decide se aceita ou ajusta</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                <h4 className="font-medium mb-3">Capacidade e Metas</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidade Máxima do Escritório (Indicador Visual)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-gray-400 rounded-lg"
                      min="1"
                    />
                    <span className="text-sm text-gray-600">pessoas</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    📊 Apenas para alerta visual - não limita a meta presencial
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    ⚠️ Dias com mais pessoas ficam com fundo vermelho
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && userRole !== 'employee' && (
          <div className="px-10 py-4">
            <TeamsTab
              teams={dbTeams}
              onAddTeam={addTeam}
              onUpdateTeam={updateTeam}
              onDeleteTeam={deleteTeam}
              userRole={userRole}
            />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && userRole !== 'employee' && (
          <div className="px-10 py-4">
            <UsersTab
              users={userProfiles}
              teams={dbTeams}
              onAddUser={addUserProfile}
              onUpdateUser={updateUserProfile}
              onDeleteUser={deleteUserProfile}
            currentUserRole={userRole}
          />
          </div>
        )}

        {/* Modal de Salvamento */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl border border-gray-400">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-6 text-gray-900">💾 Salvar Escala em Slot</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(savedSchedules).map(([slotId, data]) => (
                    <div key={slotId} className={`p-6 rounded-lg border ${data ? 'border-green-400 bg-green-50' : 'border-gray-400 bg-gray-50'}`}>
                      <div className="text-center mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Slot {slotId.slice(-1)}</h4>
                        {data ? (
                          <div className="mt-3">
                            <div className="text-sm font-medium text-green-800">{data.metadata.customName}</div>
                            <div className="text-sm text-gray-700">
                              {data.metadata.employeeCount} pessoas
                            </div>
                            <div className="text-sm text-gray-600">
                              Salvo: {new Date(data.metadata.savedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">Vazio</div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          const customName = prompt('Nome personalizado para esta escala (opcional):') || `${monthNames[currentDate.getMonth()]}/${currentDate.getFullYear()}`;
                          saveScheduleToSlot(slotId, customName);
                          setShowSaveModal(false);
                        }}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 border border-green-800 font-medium"
                      >
                        {data ? '🔄 Sobrescrever' : '💾 Salvar Aqui'}
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 border border-gray-700 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Carregamento */}
        {showLoadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl border border-gray-400">
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-6 text-gray-900">📂 Carregar Escala de Slot</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(savedSchedules).map(([slotId, data]) => (
                    <div key={slotId} className={`p-6 rounded-lg border ${data ? 'border-blue-400 bg-blue-50' : 'border-gray-400 bg-gray-50'}`}>
                      <div className="text-center mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Slot {slotId.slice(-1)}</h4>
                        {data ? (
                          <div className="mt-3">
                            <div className="text-sm font-medium text-blue-800">{data.metadata.customName}</div>
                            <div className="text-sm text-gray-700">
                              {data.metadata.employeeCount} pessoas
                            </div>
                            <div className="text-sm text-gray-600">
                              Salvo: {new Date(data.metadata.savedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">Vazio</div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            loadScheduleFromSlot(slotId);
                            setShowLoadModal(false);
                          }}
                          disabled={!data}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 border border-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          📂 Carregar
                        </button>
                        {data && (
                          <button
                            onClick={() => {
                              deleteScheduleFromSlot(slotId);
                            }}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 border border-red-800 font-medium"
                          >
                            🗑️ Excluir
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowLoadModal(false)}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 border border-gray-700 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Configurar Escala */}
        <AddEmployeeModal
          showAddEmployee={showAddEmployee}
          newEmployee={newEmployee}
          setNewEmployee={setNewEmployee}
          setShowAddEmployee={setShowAddEmployee}
          onAddEmployee={addEmployee}
          userProfiles={userProfiles}
          teams={dbTeams}
        />

        {/* Modal de Importação */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-gray-400">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">📋 Importar Lista de Pessoas</h3>
                
                <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-300">
                  <div className="text-sm text-blue-800">
                    <strong>💡 Como usar:</strong>
                    <div className="mt-1 space-y-1">
                      <div>• Cole ou digite um nome por linha</div>
                      <div>• Todas as pessoas serão criadas como "Presença Variável"</div>
                      <div>• Horário padrão: 9h às 17h (você pode editar depois)</div>
                      <div>• Você pode editá-las individualmente depois</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Lista de Nomes (um por linha):
                  </label>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="João da Silva&#10;Maria Santos&#10;Pedro Oliveira&#10;Ana Costa"
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg h-40 resize-none"
                    rows={8}
                  />
                  <div className="text-xs text-gray-500">
                    {importText.trim() ? `${importText.trim().split('\n').filter(n => n.trim()).length} pessoas para importar` : 'Nenhuma pessoa para importar'}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={importEmployees}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 border border-green-800 font-medium"
                    disabled={!importText.trim()}
                  >
                    ✅ Importar Pessoas
                  </button>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportText('');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 border border-gray-500 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Férias */}
        {showVacationForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-400">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Definir Período de Férias</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                    <input
                      type="date"
                      value={vacationData.start}
                      onChange={(e) => setVacationData(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-400 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
                    <input
                      type="date"
                      value={vacationData.end}
                      onChange={(e) => setVacationData(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-400 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setPersonVacation(vacationPersonId, vacationData.start, vacationData.end)}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 border border-orange-800 font-medium"
                    disabled={!vacationData.start || !vacationData.end}
                  >
                    Definir Férias
                  </button>
                  <button
                    onClick={() => {
                      setShowVacationForm(false);
                      setVacationPersonId(null);
                      setVacationData({ start: '', end: '' });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 border border-gray-500 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Template Manual */}
        {showManualTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-gray-400">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">🎯 Configurar Template Manual</h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-700 font-medium mb-3">
                    Como você quer inicializar as pessoas no calendário?
                  </p>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="manualOption"
                        value="blank"
                        checked={manualTemplateOption === 'blank'}
                        onChange={(e) => setManualTemplateOption(e.target.value)}
                        className="mt-1 text-blue-600"
                      />
                      <div>
                        <div className="font-medium">⚫ Deixar em branco</div>
                        <div className="text-sm text-gray-600">
                          Pessoas não aparecem no calendário • Você define uma por uma do zero
                        </div>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="manualOption"
                        value="all_office"
                        checked={manualTemplateOption === 'all_office'}
                        onChange={(e) => setManualTemplateOption(e.target.value)}
                        className="mt-1 text-blue-600"
                      />
                      <div>
                        <div className="font-medium">🟢 Iniciar todas como Presencial</div>
                        <div className="text-sm text-gray-600">
                          Todas as pessoas aparecem no escritório • Clique nos nomes para mandar para home office
                        </div>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="manualOption"
                        value="all_home"
                        checked={manualTemplateOption === 'all_home'}
                        onChange={(e) => setManualTemplateOption(e.target.value)}
                        className="mt-1 text-blue-600"
                      />
                      <div>
                        <div className="font-medium">🔵 Iniciar todas como Home Office</div>
                        <div className="text-sm text-gray-600">
                          Todas as pessoas aparecem em casa • Clique nos nomes para trazer ao escritório
                        </div>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="manualOption"
                        value="distribute_50_50"
                        checked={manualTemplateOption === 'distribute_50_50'}
                        onChange={(e) => setManualTemplateOption(e.target.value)}
                        className="mt-1 text-blue-600"
                      />
                      <div>
                        <div className="font-medium">⚡ Distribuir automaticamente (50/50)</div>
                        <div className="text-sm text-gray-600">
                          Metade presencial, metade home office • Distribuição aleatória como ponto de partida
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg mb-6 border border-blue-300">
                  <div className="text-sm text-blue-800">
                    <strong>💡 Explicação:</strong>
                    <div className="mt-1">
                      O Template Manual limpa todas as configurações automáticas e te dá controle total. 
                      Escolha como quer que as pessoas apareçam inicialmente no calendário - depois é só 
                      clicar nos nomes para alternar entre presencial/home office conforme sua necessidade.
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => executeManualTemplate(manualTemplateOption)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border border-blue-800 font-medium"
                  >
                    Aplicar Template
                  </button>
                  <button
                    onClick={() => {
                      setShowManualTemplateModal(false);
                      setManualTemplateOption('blank');
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors border border-gray-500 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-400">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border ${
                    confirmModalData.type === 'danger' ? 'bg-red-100 text-red-600 border-red-400' :
                    confirmModalData.type === 'warning' ? 'bg-yellow-100 text-yellow-600 border-yellow-400' :
                    'bg-blue-100 text-blue-600 border-blue-400'
                  }`}>
                    {confirmModalData.type === 'danger' ? '⚠️' :
                     confirmModalData.type === 'warning' ? '❓' : 'ℹ️'}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {confirmModalData.title}
                  </h3>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 whitespace-pre-line">
                    {confirmModalData.message}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  {confirmModalData.cancelText && (
                    <button
                      onClick={confirmModalData.onCancel}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors border border-gray-500 font-medium"
                    >
                      {confirmModalData.cancelText}
                    </button>
                  )}
                  <button
                    onClick={confirmModalData.onConfirm}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium border ${
                      confirmModalData.type === 'danger' 
                        ? 'bg-red-600 text-white hover:bg-red-700 border-red-800' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-800'
                    }`}
                  >
                    {confirmModalData.confirmText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-400">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-xl font-semibold">📚 Ajuda e Legendas</h3>
                <button
                  onClick={() => {
                    setShowHelp(false);
                    setActiveHelpTab('basico');
                  }}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-1 px-6 pt-4 border-b bg-gray-50">
                <button
                  onClick={() => setActiveHelpTab('basico')}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors border ${
                    activeHelpTab === 'basico'
                      ? 'bg-white text-blue-600 border-blue-600 border-b-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-gray-400'
                  }`}
                >
                  🎯 Básico
                </button>
                <button
                  onClick={() => setActiveHelpTab('funcionalidades')}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors border ${
                    activeHelpTab === 'funcionalidades'
                      ? 'bg-white text-blue-600 border-blue-600 border-b-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-gray-400'
                  }`}
                >
                  ⚙️ Funcionalidades
                </button>
                <button
                  onClick={() => setActiveHelpTab('dicas')}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors border ${
                    activeHelpTab === 'dicas'
                      ? 'bg-white text-blue-600 border-blue-600 border-b-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border-gray-400'
                  }`}
                >
                  💡 Dicas
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {activeHelpTab === 'basico' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                      <h4 className="font-semibold text-blue-800 mb-3">👥 Perfis de Usuário</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">👑 Admin:</span>
                          <span>Controle total do sistema</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">👨‍💼 Gestor:</span>
                          <span>Gerencia escalas e equipes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">👤 Colaborador:</span>
                          <span>Visualização apenas</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                      <h4 className="font-semibold text-green-800 mb-3">🎨 Status e Cores</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-green-500 flex-shrink-0 border border-gray-600"></div>
                          <span>🟢 Presencial - Pessoa no escritório</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-blue-500 flex-shrink-0 border border-gray-600"></div>
                          <span>🔵 Home Office - Pessoa trabalhando de casa</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-orange-500 flex-shrink-0 border border-gray-600"></div>
                          <span>🟠 Férias - Pessoa de férias</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-gray-500 flex-shrink-0 border border-gray-600"></div>
                          <span>⚫ Plantão/Feriado - Pessoa trabalhando em dia especial</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
                      <h4 className="font-semibold text-purple-800 mb-3">👔 Regimes de Trabalho</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Sempre Presencial:</strong> 5 dias/semana no escritório</div>
                        <div><strong>Sempre Home Office:</strong> 0 dias presencial</div>
                        <div><strong>Presença Variável:</strong> 1-5 dias configuráveis</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeHelpTab === 'funcionalidades' && (
                  <div className="space-y-6">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
                      <h4 className="font-semibold text-yellow-800 mb-3">📋 Templates de Escala</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>3x2:</strong> 3 dias presencial + 2 dias home office por semana</div>
                        <div><strong>4x1:</strong> 4 dias presencial + 1 dia home office por semana</div>
                        <div><strong>2x3:</strong> 2 dias presencial + 3 dias home office por semana</div>
                        <div><strong>Alternado:</strong> Dias alternados entre presencial e home office</div>
                        <div><strong>Meta de Gestores:</strong> Garante mínimo de 2 gestores presenciais por dia</div>
                        <div><strong>100% Manual:</strong> Você controla tudo clicando nos nomes no calendário</div>
                      </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-300">
                      <h4 className="font-semibold text-indigo-800 mb-3">🔍 Sistema de Filtros</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Por Nome:</strong> Busca parcial no nome da pessoa</div>
                        <div><strong>Por Equipe:</strong> Filtra pessoas de equipes específicas</div>
                        <div><strong>Por Status Atual:</strong> Mostra apenas pessoas presenciais, home office, férias ou plantão</div>
                        <div><strong>Importação:</strong> Adicione várias pessoas de uma vez (um nome por linha)</div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                      <h4 className="font-semibold text-green-800 mb-3">💾 Sistema de Múltiplos Salvamentos</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>3 Slots:</strong> Salve até 3 escalas diferentes</div>
                        <div><strong>Nomes Personalizados:</strong> Dê nomes específicos para cada escala</div>
                        <div><strong>Carregamento Rápido:</strong> Troque entre escalas instantaneamente</div>
                        <div><strong>Informações Detalhadas:</strong> Veja data de salvamento e número de pessoas</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeHelpTab === 'dicas' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                      <h4 className="font-semibold text-gray-800 mb-3">📊 Indicadores</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 flex-shrink-0">✓</span>
                          <span>Meta atingida - número ideal de pessoas no escritório</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-orange-600 flex-shrink-0">↑</span>
                          <span>Poucas pessoas - abaixo da meta estabelecida</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600 flex-shrink-0">↓</span>
                          <span>Muitas pessoas - acima da meta estabelecida</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span>Capacidade excedida - limite físico ultrapassado</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                      <h4 className="font-semibold text-green-800 mb-3">⌨️ Atalhos Rápidos</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Clique nos nomes:</strong> Alterna entre presencial e home office (apenas pessoas variáveis)</div>
                        <div><strong>Ícone calendário:</strong> Marca/desmarca feriados nos dias úteis</div>
                        <div><strong>Ativar Plantão:</strong> Habilita plantão em fins de semana quando necessário</div>
                        <div><strong>Templates:</strong> Aplique padrões pré-definidos rapidamente</div>
                        <div><strong>Exportar:</strong> Baixa um arquivo CSV com a escala completa</div>
                      </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-300">
                      <h4 className="font-semibold text-amber-800 mb-3">🏆 Melhores Práticas</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>1. Salve Regularmente:</strong> Use os 3 slots para diferentes cenários</div>
                        <div><strong>2. Configure as pessoas:</strong> Defina equipes e preferências antes de aplicar templates</div>
                        <div><strong>3. Monitore relatórios:</strong> Acompanhe se as metas estão sendo cumpridas</div>
                        <div><strong>4. Planeje férias:</strong> Configure períodos de férias para planejamento adequado</div>
                        <div><strong>5. Use templates:</strong> Aplique padrões automatizados e ajuste conforme necessário</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
        {/* Fim do Conteúdo Principal */}
      </div>
    </div>
  );
};

export default ScheduleApp;