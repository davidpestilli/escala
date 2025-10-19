// src/constants.ts
export const STATUS_COLORS = {
  office: 'bg-green-500',
  home: 'bg-blue-500',
  vacation: 'bg-orange-500',
  holiday: 'bg-gray-500'
};

export const STATUS_LABELS = {
  office: '🟢 Presencial',
  home: '🔵 Home Office',
  vacation: '🟠 Férias',
  holiday: '⚫ Plantão/Feriado'
};

export const EMPLOYEE_TYPES = {
  always_office: 'Sempre Presencial',
  always_home: 'Sempre Home Office',
  variable: 'Presença Variável'
};

export const WORKING_HOURS = {
  '9-17': { label: '9h às 17h', start: 9, end: 17 },
  '10-18': { label: '10h às 18h', start: 10, end: 18 },
  '11-19': { label: '11h às 19h', start: 11, end: 19 }
};

export const CRITICAL_TIME_SLOTS = [
  { id: '9-10', start: 9, end: 10, label: '9h-10h' },
  { id: '10-11', start: 10, end: 11, label: '10h-11h' },
  { id: '11-17', start: 11, end: 17, label: '11h-17h' },
  { id: '17-18', start: 17, end: 18, label: '17h-18h' },
  { id: '18-19', start: 18, end: 19, label: '18h-19h' }
];

export const TEMPLATES = {
  '3x2': { name: '3 Presencial + 2 Home Office', pattern: ['office', 'office', 'office', 'home', 'home'] },
  '4x1': { name: '4 Presencial + 1 Home Office', pattern: ['office', 'office', 'office', 'office', 'home'] },
  '2x3': { name: '2 Presencial + 3 Home Office', pattern: ['office', 'office', 'home', 'home', 'home'] },
  'alternate': { name: 'Alternado', pattern: ['office', 'home', 'office', 'home', 'office'] },
  'manager_rotation': { name: 'Meta de Gestores (Mín. 2)', pattern: ['office', 'home'], description: 'Garante mínimo de 2 gestores presenciais por dia' },
  'manual': { name: '100% Manual', pattern: [], description: 'Controle total pelo usuário - clique no calendário para ajustar' }
};

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];