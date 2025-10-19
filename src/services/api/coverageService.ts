// src/services/api/coverageService.ts
import { Employee, TimeSlot, TeamCoverageGap } from '../../types';
import { CRITICAL_TIME_SLOTS, WORKING_HOURS } from '../../constants';
import { getFilteredEmployeesForDay } from '../../utils/filterUtils';

// Função para verificar se uma pessoa cobre uma janela horária
export const personCoversTimeSlot = (person: Employee, timeSlot: TimeSlot): boolean => {
  if (!person.workingHours) return false;
  const personHours = WORKING_HOURS[person.workingHours as keyof typeof WORKING_HOURS];
  if (!personHours) return false;
  
  return personHours.start <= timeSlot.start && personHours.end >= timeSlot.end;
};

// Função para obter janelas cobertas por uma pessoa
export const getPersonCoveredSlots = (person: Employee): TimeSlot[] => {
  return CRITICAL_TIME_SLOTS.filter(slot => personCoversTimeSlot(person, slot));
};

// Função para validar cobertura de uma equipe em um dia específico
export const validateTeamCoverage = (
  teamName: string,
  date: Date,
  employees: Employee[],
  getEmployeeStatus: (employeeId: number, date: Date) => string | null
): TeamCoverageGap => {
  const teamMembers = employees.filter(emp => emp.team === teamName);
  const presentMembers = teamMembers.filter(emp => getEmployeeStatus(emp.id, date) === 'office');
  
  const gaps: {
    slot: TimeSlot;
    hasPotentialCoverage: boolean;
    potentialCoverers: Employee[];
  }[] = [];
  
  CRITICAL_TIME_SLOTS.forEach(timeSlot => {
    const hasCoverage = presentMembers.some(person => personCoversTimeSlot(person, timeSlot));
    if (!hasCoverage) {
      // Verificar se a equipe tem pessoas que PODERIAM cobrir essa janela
      const canCover = teamMembers.some(person => personCoversTimeSlot(person, timeSlot));
      if (canCover) {
        gaps.push({
          slot: timeSlot,
          hasPotentialCoverage: true,
          potentialCoverers: teamMembers.filter(person => personCoversTimeSlot(person, timeSlot))
        });
      } else {
        gaps.push({
          slot: timeSlot,
          hasPotentialCoverage: false,
          potentialCoverers: []
        });
      }
    }
  });
  
  return {
    teamName,
    date,
    presentMembers,
    gaps,
    hasGaps: gaps.length > 0
  };
};

// Função para obter todos os gaps de cobertura do dia
export const getDailyCoverageGaps = (
  date: Date,
  teams: string[],
  employees: Employee[],
  getEmployeeStatus: (employeeId: number, date: Date) => string | null
): TeamCoverageGap[] => {
  return teams.map(team => validateTeamCoverage(team, date, employees, getEmployeeStatus));
};