// src/app/services/archive.service.ts
import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { Candidature } from '../models/candidature.model';
import { CandidatureService } from './candidature.service';
import { NotificationService } from './notification.service';

export interface ArchivedCandidature extends Candidature {
  archivedAt: Date;
  archiveReason: 'auto' | 'manual';
  successType?: 'job_accepted' | 'internship_completed' | 'better_offer' | 'other_success';
  failureReason?: 'no_response' | 'skills_mismatch' | 'salary_too_low' | 'company_culture' | 'location' | 'other_failure';
  userFeedback?: string;
  satisfaction?: 1 | 2 | 3 | 4 | 5; // 1-5 étoiles
  duration?: number; // Durée du processus en jours
}

export interface ArchiveStats {
  total: number;
  successes: number;
  failures: number;
  successRate: number;
  averageDuration: number;
  topFailureReasons: { reason: string; count: number }[];
  topSuccessTypes: { type: string; count: number }[];
  monthlyTrends: { month: string; successes: number; failures: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class ArchiveService {
  private readonly ARCHIVE_STORAGE_KEY = 'protrack_cv_archives';
  private readonly AUTO_ARCHIVE_DAYS = 30; // Archiver après 30 jours

  private _archivedCandidatures: WritableSignal<ArchivedCandidature[]> = signal([]);
  public readonly archivedCandidatures = this._archivedCandidatures.asReadonly();

  public readonly archiveStats = computed(() => this.calculateArchiveStats());

  // Paramètres d'archivage
  private _autoArchiveEnabled: WritableSignal<boolean> = signal(true);
  private _archiveDaysThreshold: WritableSignal<number> = signal(30);

  public readonly autoArchiveEnabled = this._autoArchiveEnabled.asReadonly();
  public readonly archiveDaysThreshold = this._archiveDaysThreshold.asReadonly();

  constructor(
    private candidatureService: CandidatureService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {
    this.loadArchivedData();
    this.startAutoArchiveScheduler();
  }

  private loadArchivedData(): void {
    try {
      const stored = localStorage.getItem(this.ARCHIVE_STORAGE_KEY);
      if (stored) {
        const archived = JSON.parse(stored) as ArchivedCandidature[];
        this._archivedCandidatures.set(archived.map(a => ({
          ...a,
          archivedAt: new Date(a.archivedAt)
        })));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des archives:', error);
    }
  }

  private saveArchivedData(): void {
    try {
      localStorage.setItem(this.ARCHIVE_STORAGE_KEY, JSON.stringify(this._archivedCandidatures()));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des archives:', error);
    }
  }

  private startAutoArchiveScheduler(): void {
    // Vérifier toutes les 6 heures
    setInterval(() => {
      if (this._autoArchiveEnabled()) {
        this.checkForAutoArchive();
      }
    }, 6 * 60 * 60 * 1000);

    // Vérification initiale
    setTimeout(() => {
      if (this._autoArchiveEnabled()) {
        this.checkForAutoArchive();
      }
    }, 5000);
  }

  private async checkForAutoArchive(): Promise<void> {
    const candidatures = this.candidatureService.getAllCandidatures();
    const candidatesToArchive = candidatures.filter(c =>
      (c.reponse === 'Refus' || c.reponse === 'Accepté') &&
      this.shouldAutoArchive(c)
    );

    if (candidatesToArchive.length > 0) {
      // Proposer l'archivage automatique
      this.notificationService.addSystemNotification({
        type: 'info',
        title: `${candidatesToArchive.length} candidature(s) prête(s) à archiver`,
        message: 'Certaines candidatures finalisées peuvent être archivées automatiquement.',
        link: '/candidatures'
      });

      // Auto-archiver après un délai si configuré
      for (const candidature of candidatesToArchive) {
        await this.proposeArchiveCandidature(candidature);
      }
    }
  }

  private shouldAutoArchive(candidature: Candidature): boolean {
    if (candidature.reponse !== 'Refus' && candidature.reponse !== 'Accepté') {
      return false;
    }

    const candidatureDate = this.parseDateFr(candidature.date);
    if (!candidatureDate) return false;

    const daysSince = Math.floor((Date.now() - candidatureDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= this._archiveDaysThreshold();
  }

  async proposeArchiveCandidature(candidature: Candidature): Promise<boolean> {
    return new Promise((resolve) => {
      // Importer et ouvrir le dialogue d'archivage
      import('../components/archive-dialog/archive-dialog.component').then(({ ArchiveDialogComponent }) => {
        const dialogRef = this.dialog.open(ArchiveDialogComponent, {
          width: '600px',
          data: { candidature }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.archiveCandidature(candidature, result);
            resolve(true);
          } else {
            resolve(false);
          }
        });
      });
    });
  }

  archiveCandidature(candidature: Candidature, archiveData: {
    isSuccess: boolean;
    successType?: string;
    failureReason?: string;
    userFeedback?: string;
    satisfaction?: number;
    archiveReason: 'auto' | 'manual';
  }): void {
    const candidatureDate = this.parseDateFr(candidature.date);
    const duration = candidatureDate ?
      Math.floor((Date.now() - candidatureDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const archivedCandidature: ArchivedCandidature = {
      ...candidature,
      archivedAt: new Date(),
      archiveReason: archiveData.archiveReason,
      successType: archiveData.isSuccess ? archiveData.successType as any : undefined,
      failureReason: !archiveData.isSuccess ? archiveData.failureReason as any : undefined,
      userFeedback: archiveData.userFeedback,
      satisfaction: archiveData.satisfaction as any,
      duration
    };

    // Ajouter aux archives
    this._archivedCandidatures.update(archives => [...archives, archivedCandidature]);

    // Supprimer de la liste active
    this.candidatureService.deleteCandidature(candidature.id);

    // Sauvegarder
    this.saveArchivedData();

    // Notification de succès
    this.notificationService.addSystemNotification({
      type: 'succes',
      title: 'Candidature archivée',
      message: `${candidature.entreprise} a été archivée avec succès.`
    });

    console.log('✅ Candidature archivée:', archivedCandidature);
  }

  restoreCandidature(archivedId: number): void {
    const archived = this._archivedCandidatures().find(a => a.id === archivedId);
    if (!archived) return;

    // Retirer des archives
    this._archivedCandidatures.update(archives =>
      archives.filter(a => a.id !== archivedId)
    );

    // Restaurer en candidature active
    const { archivedAt, archiveReason, successType, failureReason, userFeedback, satisfaction, duration, ...candidature } = archived;
    this.candidatureService.addCandidature(candidature);

    // Sauvegarder
    this.saveArchivedData();

    this.notificationService.addSystemNotification({
      type: 'info',
      title: 'Candidature restaurée',
      message: `${candidature.entreprise} a été restaurée dans votre liste active.`
    });
  }

  deleteArchivedCandidature(archivedId: number): void {
    this._archivedCandidatures.update(archives =>
      archives.filter(a => a.id !== archivedId)
    );
    this.saveArchivedData();
  }

  private calculateArchiveStats(): ArchiveStats {
    const archives = this._archivedCandidatures();
    const total = archives.length;
    const successes = archives.filter(a => a.reponse === 'Accepté').length;
    const failures = archives.filter(a => a.reponse === 'Refus').length;

    const successRate = total > 0 ? Math.round((successes / total) * 100) : 0;
    const averageDuration = total > 0 ?
      Math.round(archives.reduce((sum, a) => sum + (a.duration || 0), 0) / total) : 0;

    // Top failure reasons
    const failureReasons: { [key: string]: number } = {};
    archives.filter(a => a.failureReason).forEach(a => {
      const reason = a.failureReason!;
      failureReasons[reason] = (failureReasons[reason] || 0) + 1;
    });
    const topFailureReasons = Object.entries(failureReasons)
      .map(([reason, count]) => ({ reason: this.translateFailureReason(reason), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top success types
    const successTypes: { [key: string]: number } = {};
    archives.filter(a => a.successType).forEach(a => {
      const type = a.successType!;
      successTypes[type] = (successTypes[type] || 0) + 1;
    });
    const topSuccessTypes = Object.entries(successTypes)
      .map(([type, count]) => ({ type: this.translateSuccessType(type), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Monthly trends (derniers 6 mois)
    const monthlyTrends = this.calculateMonthlyTrends(archives);

    return {
      total,
      successes,
      failures,
      successRate,
      averageDuration,
      topFailureReasons,
      topSuccessTypes,
      monthlyTrends
    };
  }

  private calculateMonthlyTrends(archives: ArchivedCandidature[]): { month: string; successes: number; failures: number }[] {
    const trends: { [key: string]: { successes: number; failures: number } } = {};

    archives.forEach(archive => {
      const month = archive.archivedAt.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });
      if (!trends[month]) {
        trends[month] = { successes: 0, failures: 0 };
      }

      if (archive.reponse === 'Accepté') {
        trends[month].successes++;
      } else if (archive.reponse === 'Refus') {
        trends[month].failures++;
      }
    });

    return Object.entries(trends)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Derniers 6 mois
  }

  private translateFailureReason(reason: string): string {
    const translations: { [key: string]: string } = {
      'no_response': 'Aucune réponse',
      'skills_mismatch': 'Compétences inadéquates',
      'salary_too_low': 'Salaire insuffisant',
      'company_culture': 'Culture d\'entreprise',
      'location': 'Localisation',
      'other_failure': 'Autre raison'
    };
    return translations[reason] || reason;
  }

  private translateSuccessType(type: string): string {
    const translations: { [key: string]: string } = {
      'job_accepted': 'Emploi accepté',
      'internship_completed': 'Stage terminé',
      'better_offer': 'Meilleure offre',
      'other_success': 'Autre succès'
    };
    return translations[type] || type;
  }

  private parseDateFr(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  }

  // Configuration
  setAutoArchiveEnabled(enabled: boolean): void {
    this._autoArchiveEnabled.set(enabled);
    localStorage.setItem('protrack_auto_archive_enabled', JSON.stringify(enabled));
  }

  setArchiveDaysThreshold(days: number): void {
    this._archiveDaysThreshold.set(days);
    localStorage.setItem('protrack_archive_days_threshold', JSON.stringify(days));
  }

  // Export des archives
  exportArchives(): string {
    const archives = this._archivedCandidatures();
    if (archives.length === 0) return "Aucune archive à exporter.";

    const headers = [
      'ID', 'Entreprise', 'Poste', 'Type', 'Ville', 'Statut', 'Date Candidature',
      'Date Archivage', 'Durée (jours)', 'Satisfaction', 'Raison', 'Commentaires'
    ];

    const csvContent = [
      headers.join(','),
      ...archives.map(a => [
        a.id,
        `"${a.entreprise}"`,
        `"${a.poste}"`,
        a.type,
        `"${a.ville}"`,
        a.reponse,
        a.date,
        a.archivedAt.toLocaleDateString('fr-FR'),
        a.duration || 0,
        a.satisfaction || '',
        `"${a.successType || a.failureReason || ''}"`,
        `"${a.userFeedback || ''}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  }
}
