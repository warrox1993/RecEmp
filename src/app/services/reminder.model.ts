// src/app/models/reminder.model.ts

export interface Reminder {
  id: string; // Identifiant unique du rappel
  title: string; // Titre du rappel (ex: "Relancer Odoo", "Préparer entretien Tech")
  description?: string; // Description optionnelle plus détaillée
  reminderDate: Date; // Date et heure à laquelle le rappel doit se déclencher
  type: 'candidature' | 'manuel'; // Type de rappel
  relatedCandidatureId?: number; // ID de la candidature si type 'candidature'
  isCompleted: boolean; // Si le rappel a été traité/complété
  createdAt: Date; // Date de création du rappel
  notificationGenerated?: boolean; // Pour éviter de générer plusieurs fois la même notification (pour la simulation)
}
