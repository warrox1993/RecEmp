// src/app/models/notification.model.ts

export interface AppNotification {
  id: string; // Identifiant unique de la notification
  type: 'rappel' | 'info' | 'succes' | 'erreur'; // Type de notification
  title: string; // Titre court
  message: string; // Message détaillé
  date: Date; // Date de la notification
  isRead: boolean;
  link?: string; // Lien optionnel (ex: vers une candidature spécifique)
  candidatureId?: number; // ID de la candidature associée, si applicable
}
