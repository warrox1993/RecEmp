export interface Candidature {
  id: number; // Identifiant unique de la candidature
  date: string; // Date de la candidature (format JJ/MM/AAAA)
  type: 'Job' | 'Stage'; // Type de candidature : Emploi ou Stage
  ranking: 1 | 2 | 3; // Classement/Priorité de la candidature (1, 2, ou 3)
  entreprise: string; // Nom de l'entreprise
  poste: string; // Intitulé du poste
  ville: string; // Ville où se situe le poste
  region?: string; // Région où se situe le poste
  contact: string; // Informations de contact (email, personne, etc.)
  reponse: 'Brouillon' | 'Envoyée' | 'En attente' | 'En discussion' | 'Refus' | 'Accepté'; // Statut étendu pour Kanban
  source: string; // Source de l'offre (LinkedIn, Site web, etc.)
  commentaires: string; // Commentaires additionnels
  delaiRappel?: 'Aucun' | '3 jours' | '1 semaine' | '2 semaines' | '1 mois' | 'Personnalisé'; // Délais étendus
  dateRappel?: string; // Date de rappel au format JJ/MM/AAAA
}

// Types dérivés pour faciliter le développement
export type CandidatureStatus = Candidature['reponse'];
export type CandidatureType = Candidature['type'];
export type CandidaturePriority = Candidature['ranking'];
export type CandidatureDelaiRappel = Candidature['delaiRappel'];

// Constantes utiles pour les formulaires et validations
export const CANDIDATURE_STATUSES: CandidatureStatus[] = [
  'Brouillon',
  'Envoyée',
  'En attente',
  'En discussion',
  'Refus',
  'Accepté'
];

export const CANDIDATURE_TYPES: CandidatureType[] = ['Job', 'Stage'];

export const CANDIDATURE_PRIORITIES: { value: CandidaturePriority; label: string }[] = [
  { value: 1, label: 'Haute priorité' },
  { value: 2, label: 'Moyenne priorité' },
  { value: 3, label: 'Basse priorité' }
];

export const CANDIDATURE_SOURCES = [
  'LinkedIn',
  'Indeed',
  'Internet',
  'Welcome!ToTheJungle',
  'Relation',
  'Autre'
];

export const DELAI_RAPPEL_OPTIONS: { value: CandidatureDelaiRappel; label: string }[] = [
  { value: 'Aucun', label: 'Aucun rappel' },
  { value: '3 jours', label: 'Dans 3 jours' },
  { value: '1 semaine', label: 'Dans 1 semaine' },
  { value: '2 semaines', label: 'Dans 2 semaines' },
  { value: '1 mois', label: 'Dans 1 mois' },
  { value: 'Personnalisé', label: 'Date personnalisée' }
];

// Interface pour les statistiques de candidatures
export interface CandidatureStats {
  total: number;
  parStatus: { [key in CandidatureStatus]: number };
  parType: { [key in CandidatureType]: number };
  parPriorite: { [key in CandidaturePriority]: number };
  rappelsUrgents: number;
  rappelsAujourdhui: number;
}

// Interface pour les filtres de candidatures
export interface CandidatureFilters {
  search?: string;
  status?: CandidatureStatus[];
  type?: CandidatureType[];
  priority?: CandidaturePriority[];
  source?: string[];
  dateFrom?: string;
  dateTo?: string;
  hasReminder?: boolean;
  isUrgent?: boolean;
}

// Interface pour l'export de données
export interface CandidatureExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeComments?: boolean;
  includeStats?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  filters?: CandidatureFilters;
}
