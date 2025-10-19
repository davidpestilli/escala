import { useState, useEffect } from 'react';
import { 
  Employee, 
  NewEmployee,
  VacationData,
  Filters,
  PersonFilters,
  Schedules,
  Vacations,
  Holidays,
  HolidayStaff,
  WeekendShifts,
  WeekendStaff,
  Change,
  UserRole,
  TargetOfficeMode,
  ReportPeriodMode
} from '../types';

export const useAppState = () => {
  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedules>({});
  const [vacations, setVacations] = useState<Vacations>({});
  const [holidays, setHolidays] = useState<Holidays>({});
  const [holidayStaff, setHolidayStaff] = useState<HolidayStaff>({});
  const [weekendShifts, setWeekendShifts] = useState<WeekendShifts>({});
  const [weekendStaff, setWeekendStaff] = useState<WeekendStaff>({});
  const [changeHistory, setChangeHistory] = useState<Change[]>([]);

  // UI states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('calendar');
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [selectedPerson, setSelectedPerson] = useState<Employee | null>(null);
  const [editingPerson, setEditingPerson] = useState<Employee | null>(null);
  const [expandedPersonId, setExpandedPersonId] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activePersonTab, setActivePersonTab] = useState('dados');

  // Filter states
  const [filters, setFilters] = useState<Filters>({ employee: '', team: '', currentStatus: '' });
  const [personFilters, setPersonFilters] = useState<PersonFilters>({ name: '', type: '' });

  // Modal states
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showVacationForm, setShowVacationForm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showManualTemplateModal, setShowManualTemplateModal] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState('basico');
  const [manualTemplateOption, setManualTemplateOption] = useState('blank');

  // Form states
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    name: '', 
    type: 'variable', 
    isManager: false, 
    team: '', 
    officeDays: 3, 
    workingHours: '9-17'
  });
  const [vacationPersonId, setVacationPersonId] = useState<number | null>(null);
  const [vacationData, setVacationData] = useState<VacationData>({ start: '', end: '' });
  const [importText, setImportText] = useState('');

  // Settings states
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [targetOfficeCount, setTargetOfficeCount] = useState(6);
  const [targetOfficeMode, setTargetOfficeMode] = useState<TargetOfficeMode>('absolute');

  // Report states
  const [reportPeriodMode, setReportPeriodMode] = useState<ReportPeriodMode>('month');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [selectedReportMonth, setSelectedReportMonth] = useState(new Date());

  // Force employee users to stay on calendar
  useEffect(() => {
    if (userRole === 'employee' && activeTab !== 'calendar') {
      setActiveTab('calendar');
    }
  }, [userRole, activeTab]);

  return {
    // Data states
    employees, setEmployees,
    schedules, setSchedules,
    vacations, setVacations,
    holidays, setHolidays,
    holidayStaff, setHolidayStaff,
    weekendShifts, setWeekendShifts,
    weekendStaff, setWeekendStaff,
    changeHistory, setChangeHistory,

    // UI states
    currentDate, setCurrentDate,
    activeTab, setActiveTab,
    userRole, setUserRole,
    selectedPerson, setSelectedPerson,
    editingPerson, setEditingPerson,
    expandedPersonId, setExpandedPersonId,
    hasUnsavedChanges, setHasUnsavedChanges,
    activePersonTab, setActivePersonTab,

    // Filter states
    filters, setFilters,
    personFilters, setPersonFilters,

    // Modal states
    showAddEmployee, setShowAddEmployee,
    showImportModal, setShowImportModal,
    showVacationForm, setShowVacationForm,
    showHelp, setShowHelp,
    showManualTemplateModal, setShowManualTemplateModal,
    activeHelpTab, setActiveHelpTab,
    manualTemplateOption, setManualTemplateOption,

    // Form states
    newEmployee, setNewEmployee,
    vacationPersonId, setVacationPersonId,
    vacationData, setVacationData,
    importText, setImportText,

    // Settings states
    maxCapacity, setMaxCapacity,
    targetOfficeCount, setTargetOfficeCount,
    targetOfficeMode, setTargetOfficeMode,

    // Report states
    reportPeriodMode, setReportPeriodMode,
    reportStartDate, setReportStartDate,
    reportEndDate, setReportEndDate,
    selectedReportMonth, setSelectedReportMonth
  };
};