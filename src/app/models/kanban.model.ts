// src/app/models/kanban.model.ts
import { Candidature } from './candidature.model';

export interface KanbanColumn {
  id: string;
  title: string;
  icon: string;
  color: string;
  candidatures: Candidature[];
  maxItems?: number;
  description?: string;
}

export interface KanbanStats {
  totalCandidatures: number;
  conversionRates: { [key: string]: number };
  averageTimePerStage: { [key: string]: number };
  progressToday: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  action: (candidature: Candidature) => void;
}

export const KANBAN_COLUMNS_CONFIG: Omit<KanbanColumn, 'candidatures'>[] = [
  {
    id: 'brouillon',
    title: 'Brouillons',
    icon: 'edit_note',
    color: '#9E9E9E',
    description: 'Candidatures en préparation',
    maxItems: 20
  },
  {
    id: 'envoyee',
    title: 'Envoyées',
    icon: 'send',
    color: '#2196F3',
    description: 'Candidatures envoyées, en attente de réponse'
  },
  {
    id: 'en-attente',
    title: 'En Attente',
    icon: 'hourglass_empty',
    color: '#FF9800',
    description: 'Réponse reçue, processus en cours'
  },
  {
    id: 'en-discussion',
    title: 'En Discussion',
    icon: 'forum',
    color: '#9C27B0',
    description: 'Entretiens et négociations'
  },
  {
    id: 'finalise',
    title: 'Finalisées',
    icon: 'check_circle',
    color: '#4CAF50',
    description: 'Processus terminé (accepté/refusé)'
  }
];

// Mapping entre les statuts de candidature et les colonnes Kanban
export const STATUS_TO_COLUMN_MAP: { [key: string]: string } = {
  'Brouillon': 'brouillon',
  'Envoyée': 'envoyee',
  'En attente': 'en-attente',
  'En discussion': 'en-discussion',
  'Refus': 'finalise',
  'Accepté': 'finalise'
};

export const COLUMN_TO_STATUS_MAP: { [key: string]: string[] } = {
  'brouillon': ['Brouillon'],
  'envoyee': ['Envoyée'],
  'en-attente': ['En attente'],
  'en-discussion': ['En discussion'],
  'finalise': ['Refus', 'Accepté']
};
