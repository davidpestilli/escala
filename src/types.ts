// src/types.ts
export interface Employee {
  id: number;
  name: string;
  type: 'always_office' | 'always_home' | 'variable';
  isManager: boolean;
  team: string;
  preferences: Record<string, string>;
  officeDays: number;
  workingHours: string;
}

export interface Filters {
  employee: string;
  team: string;
  currentStatus: string;
}

export interface PersonFilters {
  name: string;
  type: string;
}

export interface VacationData {
  start: string;
  end: string;
}

export interface ChangeHistoryItem {
  id: number;
  timestamp: Date;
  action: string;
}

export interface ConfirmModalData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  type: 'warning' | 'danger' | 'info';
}

export interface TimeSlot {
  id: string;
  start: number;
  end: number;
  label: string;
}

export interface WorkingHours {
  label: string;
  start: number;
  end: number;
}

export interface Template {
  name: string;
  pattern: string[];
  description?: string;
}

export interface TeamCoverageGap {
  teamName: string;
  date: Date;
  presentMembers: Employee[];
  gaps: {
    slot: TimeSlot;
    hasPotentialCoverage: boolean;
    potentialCoverers: Employee[];
  }[];
  hasGaps: boolean;
}

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
  personalStats: Record<string, PersonalStats>;
  totalWorkdays?: number;
  averages?: {
    office: number;
    home: number;
    vacation: number;
    holiday: number;
  };
  isValidPeriod?: boolean;
  periodStart?: Date;
  periodEnd?: Date;
}