// src/app/components/reminder-list/reminder-list.component.ts
import { Component, OnInit, Signal, computed, signal, WritableSignal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';

import { Reminder } from '../../models/reminder.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-reminder-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatListModule, MatIconModule, MatButtonModule,
    MatCheckboxModule, MatDividerModule, MatCardModule, MatTooltipModule,
    MatProgressSpinnerModule, DatePipe
  ],
  templateUrl: './reminder-list.component.html',
  styleUrls: ['./reminder-list.component.scss']
})
export class ReminderListComponent implements OnInit {
  pageTitle = 'Mes Rappels - ProTrack CV';

  allReminders: Signal<Reminder[]>;
  pendingReminders: Signal<Reminder[]>;
  completedReminders: Signal<Reminder[]>;
  showCompleted: WritableSignal<boolean> = signal(false);
  isRefreshing: WritableSignal<boolean> = signal(false);

  today: Date = new Date();

  // Compteurs pour l'accessibilité
  pendingCount: Signal<number>;
  completedCount: Signal<number>;

  constructor(
    private titleService: Title,
    public notificationService: NotificationService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.allReminders = this.notificationService.reminders;
    this.today.setHours(0, 0, 0, 0);

    this.pendingReminders = computed(() =>
      this.allReminders()
        .filter(r => !r.isCompleted)
        .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime())
    );

    this.completedReminders = computed(() =>
      this.allReminders()
        .filter(r => r.isCompleted)
        .sort((a, b) => b.reminderDate.getTime() - a.reminderDate.getTime())
    );

    // Compteurs pour les messages ARIA
    this.pendingCount = computed(() => this.pendingReminders().length);
    this.completedCount = computed(() => this.completedReminders().length);
  }

  ngOnInit(): void {
    this.titleService.setTitle(this.pageTitle);
    this.refreshRemindersAndNotifications();
  }

  isReminderOverdue(reminder: Reminder): boolean {
    return reminder.reminderDate.getTime() < this.today.getTime() && !reminder.isCompleted;
  }

  refreshRemindersAndNotifications(): void {
    this.isRefreshing.set(true);

    // Annoncer le début du rafraîchissement pour les lecteurs d'écran
    this.announceToScreenReader('Rafraîchissement des rappels en cours...');

    this.notificationService.refreshNotifications();

    setTimeout(() => {
      this.isRefreshing.set(false);
      const message = 'Liste des rappels mise à jour.';
      this.snackBar.open(message, 'OK', { duration: 2000 });
      this.announceToScreenReader(message);
    }, 700);
  }

  toggleReminderCompletion(reminder: Reminder, event: MouseEvent): void {
    event.stopPropagation();
    const newStatus = !reminder.isCompleted;
    this.notificationService.completeReminder(reminder.id, newStatus);

    const message = `Rappel "${reminder.title}" marqué comme ${newStatus ? 'complété' : 'non complété'}.`;
    this.snackBar.open(message, 'OK', { duration: 2500 });
    this.announceToScreenReader(message);
  }

  deleteManualReminder(reminder: Reminder, event: MouseEvent): void {
    event.stopPropagation();

    if (reminder.type !== 'manuel') return;

    const dialogData: ConfirmDialogData = {
      title: 'Supprimer le rappel',
      message: `Êtes-vous sûr de vouloir supprimer le rappel "${reminder.title}" ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      color: 'warn'
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.notificationService.deleteReminder(reminder.id);
        const message = `Rappel "${reminder.title}" supprimé.`;
        this.snackBar.open(message, 'OK', { duration: 2500 });
        this.announceToScreenReader(message);
      }
    });
  }

  navigateToCandidature(candidatureId?: number): void {
    if (candidatureId) {
      this.router.navigate(['/candidatures', candidatureId]);
    }
  }

  getReminderIcon(type: Reminder['type']): string {
    return type === 'candidature' ? 'work_outline' : 'alarm';
  }

  getReminderTypeLabel(type: Reminder['type']): string {
    return type === 'candidature' ? 'Rappel de candidature' : 'Rappel manuel';
  }

  toggleShowCompleted(): void {
    const newValue = !this.showCompleted();
    this.showCompleted.set(newValue);

    const message = newValue
      ? 'Affichage des rappels complétés activé'
      : 'Affichage des rappels complétés désactivé';
    this.announceToScreenReader(message);
  }

  // Méthode pour les annonces aux lecteurs d'écran
  private announceToScreenReader(message: string): void {
    // Créer un élément temporaire pour l'annonce ARIA
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Retirer l'élément après un court délai
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Méthode pour formater la date de manière accessible
  getAccessibleDateString(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('fr-FR', options);
  }

  // TrackBy pour optimiser les performances
  trackByReminder(index: number, reminder: Reminder): string {
    return reminder.id;
  }
}
