// src/app/models/candidature.model.ts

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
  reponse: 'En attente' | 'En discussion' | 'Refus' | 'Accepté'; // Statut de la réponse
  source: string; // Source de l'offre (LinkedIn, Site web, etc.)
  commentaires: string; // Commentaires additionnels
  delaiRappel?: 'Aucun' | '1 semaine' | '2 semaines' | '1 mois' | 'Personnalisé';
  dateRappel?: string;
}
