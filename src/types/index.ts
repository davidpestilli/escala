// Core types
export type StatusType = 'office' | 'home' | 'vacation' | 'holiday';
export type EmployeeType = 'always_office' | 'always_home' | 'variable';
export type WorkingHours = '9-17' | '10-18' | '11-19';
export type UserRole = 'admin' | 'manager' | 'employee';
export type TargetOfficeMode = 'absolute' | 'minimum';
export type ReportPeriodMode = 'month' | 'custom';
export type ConfirmModalType = 'warning' | 'danger' | 'info';

// Employee interface
export interface Employee {
  id: number;
  name: string;
  type: EmployeeType;
  isManager: boolean;
  team: string;
  preferences: Record<string, string>;
  officeDays: number;
  workingHours: WorkingHours;
}

// Schedule and vacation types
export type Schedules = Record<number, Record<string, StatusType>>;
export type Vacations = Record<number, { start: string; end: string }>;
export type Holidays = Record<string, boolean>;
export type HolidayStaff = Record<string, number[]>;
export type WeekendShifts = Record<string, boolean>;
export type WeekendStaff = Record<string, number[]>;

// Filter interfaces
export interface Filters {
  employee: string;
  team: string;
  currentStatus: string;
}

export interface PersonFilters {
  name: string;
  type: string;
}

// Modal and form interfaces
export interface NewEmployee {
  name: string;
  type: EmployeeType;
  isManager: boolean;
  team: string;
  officeDays: number;
  workingHours: WorkingHours;
}

export interface VacationData {
  start: string;
  end: string;
}

export interface ConfirmModalData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  type: ConfirmModalType;
}

// Change history
export interface Change {
  id: number;
  timestamp: Date;
  action: string;
}

// Coverage analysis types
export interface CoverageGap {
  slot: {
    id: string;
    start: number;
    end: number;
    label: string;
  };
  hasPotentialCoverage: boolean;
  potentialCoverers: Employee[];
}

export interface TeamCoverage {
  teamName: string;
  date: Date;
  presentMembers: Employee[];
  gaps: CoverageGap[];
  hasGaps: boolean;
}

// Report types
export interface PersonalStats {
  name: string;
  office: number;
  home: number;
  vacation: number;
  holiday: number;
  validDays?: number;
  workDays?: number;
  presentialPercentage?: number;
  hasInsufficientData?: boolean;
}

export interface ReportData {
  personalStats: Record<number, PersonalStats>;
}

export interface AdvancedReportData {
  personalStats: Record<number, PersonalStats>;
  totalWorkdays: number;
  averages: {
    office: number;
    home: number;
    vacation: number;
    holiday: number;
  };
  isValidPeriod: boolean;
  periodStart?: Date;
  periodEnd?: Date;
}

// Template types
export interface Template {
  name: string;
  pattern: StatusType[];
  description?: string;
}

export interface TemplatePatterns {
  officeDays: number;
  homeDays: number;
}

// Time slot interface
export interface TimeSlot {
  id: string;
  start: number;
  end: number;
  label: string;
}

// Month data interface
export interface MonthData {
  date: Date;
  days: (Date | null)[];
  name: string;
}