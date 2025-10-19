import React, { useState } from 'react';
import { Calendar, Users, Download, Filter, Plus, AlertTriangle, Settings, Copy, RotateCcw, FileText, Edit, X, HelpCircle, Trash2, Save, FolderOpen, Archive } from 'lucide-react';

const ScheduleApp = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  
  const [schedules, setSchedules] = useState({});
  const [vacations, setVacations] = useState({});
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [userRole, setUserRole] = useState('admin');
  
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
  
  const [filters, setFilters] = useState({ employee: '', team: '', currentStatus: '' });
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
  const [personFilters, setPersonFilters] = useState({ name: '', type: '' });
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
        setFilters({ employee: '', team: '', currentStatus: '' });
        setPersonFilters({ name: '', type: '' });
        
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
    
    if (holidays[dateStr]) {
      if (holidayStaff[dateStr] && holidayStaff[dateStr].includes(employeeId)) {
        return 'holiday';
      }
      return 'holiday';
    }
    
    const dayOfWeek = date.getDay();
    if ((dayOfWeek === 0 || dayOfWeek === 6) && weekendShifts[dateStr]) {
      if (weekendStaff[dateStr] && weekendStaff[dateStr].includes(employeeId)) {
        return 'holiday';
      }
      return 'holiday';
    }
    
    if (vacations[employeeId]) {
      const vacation = vacations[employeeId];
      const startDate = vacation.start;
      const endDate = vacation.end;
      
      if (dateStr >= startDate && dateStr <= endDate) {
        return 'vacation';
      }
    }
    
    if (schedules[employeeId] && schedules[employeeId][dateStr]) {
      return schedules[employeeId][dateStr];
    }
    
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return null;
    
    switch (employee.type) {
      case 'always_office':
        return 'office';
      case 'always_home':
        return 'home';
      case 'variable':
        return null;
      default:
        return null;
    }
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
    
    const targetEmployees = employees.filter(emp => 
      emp.type === 'variable' && 
      (!specificTeam || emp.team === specificTeam)
    );
    
    const affectedCount = targetEmployees.length;
    const alwaysFixedCount = employees.filter(emp => emp.type === 'always_office' || emp.type === 'always_home').length;
    
    let confirmMessage = `Aplicar template "${template.name}"?\n\n`;
    confirmMessage += `📊 Pessoas afetadas:\n`;
    confirmMessage += `• ${affectedCount} pessoas variáveis (serão reconfiguradas)\n`;
    
    if (alwaysFixedCount > 0) {
      confirmMessage += `• ${alwaysFixedCount} sempre fixas (preservadas)\n`;
    }
    
    confirmMessage += `\n🎯 Meta: ${targetOfficeCount} pessoas presenciais por dia\n`;
    
    if (respectPreferences) {
      confirmMessage += `✅ Respeitando preferências individuais\n`;
    }
    
    confirmMessage += `\n⚠️ Configurações manuais existentes serão sobrescritas!`;
    
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

    // Templates inteligentes com balanceamento
    const balancedApplyTemplate = () => {
      const targetPerDay = targetOfficeCount;
      const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      
      const daysByWeekday = {};
      weekdays.forEach(weekday => { daysByWeekday[weekday] = []; });
      
      days.forEach(day => {
        const weekdayIndex = day.getDay() - 1;
        if (weekdayIndex >= 0 && weekdayIndex < 5) {
          daysByWeekday[weekdays[weekdayIndex]].push(day);
        }
      });

      const templatePatterns = {
        '4x1': { officeDays: 4, homeDays: 1 },
        '3x2': { officeDays: 3, homeDays: 2 },
        '2x3': { officeDays: 2, homeDays: 3 },
        'alternate': { officeDays: 2.5, homeDays: 2.5 }
      };
      
      const pattern = templatePatterns[templateKey] || { officeDays: 3, homeDays: 2 };
      
      targetEmployees.forEach((emp, empIndex) => {
        let personOfficeDays = [];
        
        if (respectPreferences && emp.preferences) {
          const preferredHomeDays = Object.keys(emp.preferences).filter(day => emp.preferences[day] === 'home');
          const availableDays = weekdays.filter(day => !preferredHomeDays.includes(day));
          
          for (let i = 0; i < pattern.officeDays && personOfficeDays.length < pattern.officeDays; i++) {
            const dayIndex = (empIndex + i) % availableDays.length;
            if (availableDays[dayIndex]) {
              personOfficeDays.push(availableDays[dayIndex]);
            }
          }
          
          while (personOfficeDays.length < pattern.officeDays) {
            const dayIndex = (empIndex + personOfficeDays.length) % weekdays.length;
            if (!personOfficeDays.includes(weekdays[dayIndex])) {
              personOfficeDays.push(weekdays[dayIndex]);
            }
          }
        } else {
          for (let i = 0; i < pattern.officeDays; i++) {
            const dayIndex = (empIndex + i) % weekdays.length;
            personOfficeDays.push(weekdays[dayIndex]);
          }
        }
        
        weekdays.forEach(weekday => {
          const isOfficeDay = personOfficeDays.includes(weekday);
          const daysOfWeek = daysByWeekday[weekday];
          
          daysOfWeek.forEach(day => {
            const status = isOfficeDay ? 'office' : 'home';
            setEmployeeStatus(emp.id, day, status);
          });
        });
      });

      days.forEach(day => {
        const alwaysOfficeCount = employees.filter(emp => 
          emp.type === 'always_office' && getEmployeeStatus(emp.id, day) === 'office'
        ).length;
        
        const variableInOffice = targetEmployees.filter(emp => 
          getEmployeeStatus(emp.id, day) === 'office'
        ).length;
        
        const currentOfficeTotal = alwaysOfficeCount + variableInOffice;
        const neededVariable = Math.max(0, targetPerDay - alwaysOfficeCount);
        const difference = neededVariable - variableInOffice;
        
        if (difference > 0) {
          const homeEmployees = targetEmployees
            .filter(emp => getEmployeeStatus(emp.id, day) === 'home')
            .sort((a, b) => {
              const aDays = a.officeDays || 3;
              const bDays = b.officeDays || 3;
              return bDays - aDays;
            });
          
          for (let i = 0; i < Math.min(difference, homeEmployees.length); i++) {
            setEmployeeStatus(homeEmployees[i].id, day, 'office');
          }
        } else if (difference < 0) {
          const officeEmployees = targetEmployees
            .filter(emp => getEmployeeStatus(emp.id, day) === 'office')
            .sort((a, b) => {
              const aDays = a.officeDays || 3;
              const bDays = b.officeDays || 3;
              return aDays - bDays;
            });
          
          for (let i = 0; i < Math.min(-difference, officeEmployees.length); i++) {
            setEmployeeStatus(officeEmployees[i].id, day, 'home');
          }
        }
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
    const days = getDaysInMonth(currentDate).filter(day => day !== null);
    let csvContent = 'Nome,Equipe,';
    
    days.forEach(day => {
      csvContent += `${day.getDate()}/${day.getMonth() + 1},`;
    });
    csvContent += '\n';
    
    const filteredEmployees = getFilteredEmployees();
    
    filteredEmployees.forEach(emp => {
      csvContent += `${emp.name},${emp.team || 'Sem equipe'},`;
      days.forEach(day => {
        const status = getEmployeeStatus(emp.id, day);
        const statusText = status ? statusLabels[status] : '';
        csvContent += `${statusText},`;
      });
      csvContent += '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escala_${currentDate.getMonth() + 1}_${currentDate.getFullYear()}.csv`;
    a.click();
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

  const addEmployee = () => {
    if (newEmployee.name.trim()) {
      const newPerson = {
        id: Date.now(),
        ...newEmployee,
        preferences: {}
      };
      setEmployees(prev => [...prev, newPerson]);
      setNewEmployee({ name: '', type: 'variable', isManager: false, team: '', officeDays: 3, workingHours: '9-17' });
      setShowAddEmployee(false);
      
      setExpandedPersonId(newPerson.id);
      setEditingPerson(newPerson);
      setHasUnsavedChanges(false);
      setActivePersonTab('dados');
    }
  };

  const updatePerson = (personId, updates) => {
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
      if (filters.employee && !emp.name.toLowerCase().includes(filters.employee.toLowerCase())) {
        return false;
      }
      if (filters.team) {
        if (filters.team === 'SEM_EQUIPE') {
          if (emp.team && emp.team.trim() !== '') return false;
        } else {
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
      if (filters.employee && !emp.name.toLowerCase().includes(filters.employee.toLowerCase())) {
        return false;
      }
      if (filters.team) {
        if (filters.team === 'SEM_EQUIPE') {
          return !emp.team || emp.team.trim() === '';
        } else {
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
      if (personFilters.name && !person.name.toLowerCase().includes(personFilters.name.toLowerCase())) {
        return false;
      }
      if (personFilters.type) {
        if (personFilters.type === 'manager' && !person.isManager) return false;
        if (personFilters.type === 'employee' && person.isManager) return false;
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
    <div className="min-h-screen bg-gray-50 p-4">
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
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Escalas de Trabalho</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Seletor de Perfil */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 border border-gray-400">
                <div className="text-sm text-gray-800">👤</div>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="border-0 bg-transparent text-sm font-medium text-gray-900 focus:ring-0 focus:outline-none cursor-pointer"
                >
                  <option value="admin">👑 Administrador</option>
                  <option value="manager">👨‍💼 Gestor</option>
                  <option value="employee">👤 Colaborador</option>
                </select>
              </div>
              
              <button
                onClick={() => setShowHelp(true)}
                className="flex items-center gap-2 p-2 text-gray-800 hover:bg-gray-100 rounded-lg border border-gray-400 hover:border-gray-500"
                title="Ajuda e Legendas"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 border border-green-800 font-medium"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b border-gray-300">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`pb-2 px-1 border-b-2 font-medium transition-all ${
                activeTab === 'calendar' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-800 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Calendário
            </button>
            <button
              onClick={() => userRole !== 'employee' && setActiveTab('people')}
              disabled={userRole === 'employee'}
              className={`pb-2 px-1 border-b-2 font-medium transition-all ${
                userRole === 'employee' 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : activeTab === 'people' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-800 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Pessoas
            </button>
            <button
              onClick={() => userRole !== 'employee' && setActiveTab('templates')}
              disabled={userRole === 'employee'}
              className={`pb-2 px-1 border-b-2 font-medium transition-all ${
                userRole === 'employee' 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : activeTab === 'templates' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-800 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Templates
            </button>
            <button
              onClick={() => userRole !== 'employee' && setActiveTab('reports')}
              disabled={userRole === 'employee'}
              className={`pb-2 px-1 border-b-2 font-medium transition-all ${
                userRole === 'employee' 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : activeTab === 'reports' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-800 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Relatórios
            </button>
            <button
              onClick={() => userRole !== 'employee' && setActiveTab('settings')}
              disabled={userRole === 'employee'}
              className={`pb-2 px-1 border-b-2 font-medium transition-all ${
                userRole === 'employee' 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : activeTab === 'settings' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-800 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Configurações
            </button>
          </div>
        </div>

        {/* Aviso para Colaboradores */}
        {userRole === 'employee' && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
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
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            {/* Filtros e Controles de Salvamento */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-300">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                <Filter className="w-5 h-5" />
                Filtros e Gerenciamento
              </h3>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Colaborador
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar por nome..."
                    value={filters.employee}
                    onChange={(e) => setFilters(prev => ({ ...prev, employee: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-300 text-sm"
                  />
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
                    <option value="">Todas as equipes</option>
                    {teams.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                    <option value="SEM_EQUIPE">Sem equipe</option>
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
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowLoadModal(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm border border-blue-800"
                    disabled={userRole === 'employee'}
                  >
                    <FolderOpen className="w-4 h-4 inline mr-1" />
                    Carregar
                  </button>
                  {lastSaved && (
                    <div className="text-xs text-green-800 bg-green-100 px-2 py-1 rounded border border-green-300 text-center">
                      ✅ Último save: {lastSaved.toLocaleTimeString()}
                    </div>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    disabled={userRole === 'employee' || isSaving}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm border border-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Archive className="w-4 h-4 inline mr-1" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 inline mr-1" />
                        Salvar Escala
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Calendar */}
            <div className="bg-white rounded-lg shadow-sm p-6 max-h-[80vh] overflow-y-auto border border-gray-300">
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
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="px-3 py-2 text-gray-800 hover:bg-gray-100 rounded border border-gray-400 font-medium"
                >
                  →
                </button>
              </div>

              <div className="flex gap-6 mb-4 text-sm flex-wrap">
                <div className="flex gap-4">
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border border-gray-600 ${statusColors[key]}`}></div>
                      <span className="font-medium text-gray-900">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-indigo-800 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-300">
                  <Edit className="w-4 h-4" />
                  <span className="text-sm font-medium">💡 Clique nos nomes para alternar</span>
                </div>
                {filters.currentStatus && (
                  <div className="flex items-center gap-2 text-orange-800 bg-orange-50 px-3 py-1 rounded-lg border border-orange-300">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      🔍 Filtro ativo: {statusLabels[filters.currentStatus]}
                    </span>
                  </div>
                )}
              </div>

              {employees.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma pessoa para exibir</h3>
                  <p className="text-gray-800">Vá para a aba "Pessoas" para adicionar funcionários ao sistema.</p>
                </div>
              )}

              {employees.length > 0 && (
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
              )}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && userRole !== 'employee' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-300">
              <h3 className="font-semibold mb-4 text-gray-900">Templates de Escala</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Aplicar Template</h4>
                  <div className="space-y-3 border border-gray-400 rounded-lg p-4">
                    {Object.entries(templates).map(([key, template]) => (
                      <div key={key} className="border border-gray-300 rounded-lg p-4 shadow-md bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{template.name}</h5>
                          <div className="flex gap-2">
                            <button
                              onClick={() => applyTemplate(key, null, false)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 border border-blue-800 font-medium"
                              title="Aplicar template substituindo todas as configurações"
                            >
                              Aplicar
                            </button>
                            {key !== 'manager_rotation' && key !== 'manual' && (
                              <button
                                onClick={() => applyTemplate(key, null, true)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 border border-green-800 font-medium"
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
                              <span className="text-sm text-purple-600 font-medium">Gestores</span>
                            </div>
                          ) : key === 'manual' ? (
                            <div className="flex items-center gap-1">
                              <Edit className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-600 font-medium">Controle Manual</span>
                            </div>
                          ) : (
                            template.pattern.map((status, index) => (
                              <div
                                key={index}
                                className={`w-4 h-4 rounded border border-gray-600 ${statusColors[status]}`}
                                title={statusLabels[status]}
                              ></div>
                            ))
                          )}
                        </div>
                        <div className="text-sm text-gray-800 mt-1">
                          {key === 'manager_rotation' 
                            ? 'Mínimo de 2 gestores presenciais por dia'
                            : key === 'manual'
                              ? 'Configuração manual no calendário'
                            : `Seg - Sex: ${template.pattern.join(' → ')}`
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3 text-gray-900">Ações Rápidas</h4>
                  <div className="space-y-3 border border-gray-400 rounded-lg p-4">
                    <button
                      onClick={copyPreviousWeek}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 border border-blue-400 font-medium"
                    >
                      <Copy className="w-4 h-4" />
                      Replicar 1ª Semana
                    </button>
                    <button
                      onClick={() => applyTemplate('4x1')}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 border border-green-400 font-medium"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Aplicar 4x1
                    </button>
                    <button
                      onClick={() => applyTemplate('manager_rotation')}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-800 rounded hover:bg-purple-200 border border-purple-400 font-medium"
                    >
                      <Users className="w-4 h-4" />
                      Meta de Gestores
                    </button>
                    <button
                      onClick={() => applyTemplate('manual')}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 border border-gray-400 font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Modo Manual
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* People Tab */}
        {activeTab === 'people' && userRole !== 'employee' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Gerenciar Pessoas</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-4 bg-blue-50 p-3 rounded-lg border border-blue-300">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 font-medium">Meta presencial:</span>
                      <input
                        type="number"
                        value={targetOfficeCount}
                        onChange={(e) => setTargetOfficeCount(Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-400 rounded text-center font-medium"
                        min="0"
                      />
                      <span className="text-sm text-gray-900">pessoas</span>
                    </div>
                    
                    <div className="flex items-center gap-3 border-l border-blue-400 pl-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="targetMode"
                          value="absolute"
                          checked={targetOfficeMode === 'absolute'}
                          onChange={(e) => setTargetOfficeMode(e.target.value)}
                          className="text-blue-600"
                        />
                        <span className="text-sm font-medium text-blue-900">🎯 Absoluta</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="targetMode"
                          value="minimum"
                          checked={targetOfficeMode === 'minimum'}
                          onChange={(e) => setTargetOfficeMode(e.target.value)}
                          className="text-blue-600"
                        />
                        <span className="text-sm font-medium text-blue-900">📊 Mínima</span>
                      </label>
                    </div>
                  </div>
                  
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
                    Adicionar Nova Pessoa
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar por nome
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={personFilters.name}
                    onChange={(e) => setPersonFilters(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={personFilters.type}
                    onChange={(e) => setPersonFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="manager">Gestores</option>
                    <option value="employee">Colaboradores</option>
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
                        Adicionar Pessoa
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
                                      () => {
                                        setEmployees(prev => prev.filter(emp => emp.id !== person.id));
                                        
                                        if (expandedPersonId === person.id) {
                                          setExpandedPersonId(null);
                                          setEditingPerson(null);
                                          setHasUnsavedChanges(false);
                                        }
                                        
                                        setSchedules(prev => {
                                          const newSchedules = { ...prev };
                                          delete newSchedules[person.id];
                                          return newSchedules;
                                        });
                                        
                                        setVacations(prev => {
                                          const newVacations = { ...prev };
                                          delete newVacations[person.id];
                                          return newVacations;
                                        });
                                        
                                        if (selectedPerson && selectedPerson.id === person.id) {
                                          setSelectedPerson(null);
                                        }
                                        
                                        const change = {
                                          id: Date.now(),
                                          timestamp: new Date(),
                                          action: `❌ Excluiu a pessoa ${person.name}`
                                        };
                                        setChangeHistory(prev => [change, ...prev.slice(0, 99)]);
                                      },
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
                                              setEditingPerson(prev => ({ ...(prev || person), type: e.target.value }));
                                              setHasUnsavedChanges(true);
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

                                        {/* Configurações para Presença Variável */}
                                        {currentEditData.type === 'variable' && (
                                          <div className="border-t border-gray-300 pt-4 space-y-4">
                                            <div>
                                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Dias presenciais por semana (orientativo)
                                              </label>
                                              <select
                                                value={currentEditData.officeDays || 3}
                                                onChange={(e) => {
                                                  setEditingPerson(prev => ({ ...(prev || person), officeDays: Number(e.target.value) }));
                                                  setHasUnsavedChanges(true);
                                                }}
                                                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
                                              >
                                                <option value={1}>1 dia</option>
                                                <option value={2}>2 dias</option>
                                                <option value={3}>3 dias</option>
                                                <option value={4}>4 dias</option>
                                                <option value={5}>5 dias</option>
                                              </select>
                                              <div className="text-xs text-gray-500 mt-1">
                                                💡 Orientativo apenas
                                              </div>
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
                                                          ...(prev || person), 
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
                                              <div className="text-xs text-gray-500 mt-2">
                                                Preferências de dias para home office
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      /* Modo Visualização */
                                      <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                          <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                                            <div className="text-sm text-gray-600">Dias Presencial (Orientativo)</div>
                                            <div className="font-medium">{person.officeDays || 0} dias/semana</div>
                                            <div className="text-xs text-gray-500 mt-1">Orientativo</div>
                                          </div>
                                        </div>
                                        
                                        {person.type === 'variable' && person.preferences && Object.keys(person.preferences).length > 0 && (
                                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-300">
                                            <div className="text-sm text-gray-600 mb-2">Preferências de Home Office</div>
                                            <div className="flex flex-wrap gap-2">
                                              {Object.keys(person.preferences).map(day => (
                                                <span key={day} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-400">
                                                  {day === 'monday' ? 'Segunda' : day === 'tuesday' ? 'Terça' : day === 'wednesday' ? 'Quarta' : day === 'thursday' ? 'Quinta' : 'Sexta'}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
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

                                    {/* Informações Adicionais */}
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                                      <div className="text-sm text-gray-600 mb-2">📋 Informações da Escala</div>
                                      <div className="text-sm text-gray-700">
                                        Para visualizar e editar a escala detalhada desta pessoa, 
                                        utilize o <strong>calendário principal</strong> na aba "Calendário".
                                        Lá você pode clicar nos nomes para alternar entre presencial e home office.
                                      </div>
                                    </div>
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
          <div className="space-y-6">
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
          <div className="space-y-6">
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

        {/* Modal de Adicionar Funcionário */}
        {showAddEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-400">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Adicionar Nova Pessoa</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Equipe"
                    value={newEmployee.team}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, team: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg"
                  />
                  <select
                    value={newEmployee.type}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg"
                  >
                    <option value="variable">Presença Variável</option>
                    <option value="always_office">Sempre Presencial</option>
                    <option value="always_home">Sempre Home Office</option>
                  </select>
                  <select
                    value={newEmployee.workingHours}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, workingHours: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-400 rounded-lg"
                  >
                    {Object.entries(workingHours).map(([key, hours]) => (
                      <option key={key} value={key}>{hours.label}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newEmployee.isManager}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, isManager: e.target.checked }))}
                    />
                    <span className="text-sm">Gestor</span>
                  </label>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={addEmployee}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 border border-blue-800 font-medium"
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => setShowAddEmployee(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 border border-gray-500 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
};

export default ScheduleApp;