// src/app/components/reminder-list/reminder-list.component.ts
import { Component, OnInit, Signal, computed, signal } from '@angular/core'; // Ajout de signal
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
  showCompleted = signal(false);
  isRefreshing = signal(false);

  today: Date = new Date(); // today est déjà normalisé dans le constructeur

  constructor(
    private titleService: Title,
    public notificationService: NotificationService,
    private router: Router,
    private snackBar: MatSnackBar
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
  }

  ngOnInit(): void {
    this.titleService.setTitle(this.pageTitle);
    this.refreshRemindersAndNotifications();
  }

  // NOUVELLE MÉTHODE pour vérifier si un rappel est en retard
  isReminderOverdue(reminder: Reminder): boolean {
    // reminder.reminderDate est déjà un objet Date grâce au NotificationService
    return reminder.reminderDate.getTime() < this.today.getTime() && !reminder.isCompleted;
  }

  refreshRemindersAndNotifications(): void {
    this.isRefreshing.set(true);
    this.notificationService.refreshNotifications();
    setTimeout(() => {
      this.isRefreshing.set(false);
      this.snackBar.open('Liste des rappels et notifications mise à jour.', 'OK', { duration: 2000 });
    }, 700);
  }

  toggleReminderCompletion(reminder: Reminder, event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.completeReminder(reminder.id, !reminder.isCompleted);
    this.snackBar.open(
      `Rappel "${reminder.title}" marqué comme ${!reminder.isCompleted ? 'complété' : 'non complété'}.`,
      'OK', { duration: 2500 }
    );
  }

  deleteManualReminder(reminder: Reminder, event: MouseEvent): void {
    event.stopPropagation();
    if (reminder.type === 'manuel') {
      if (confirm(`Êtes-vous sûr de vouloir supprimer le rappel manuel "${reminder.title}" ?`)) {
        this.notificationService.deleteReminder(reminder.id);
        this.snackBar.open(`Rappel manuel "${reminder.title}" supprimé.`, 'OK', { duration: 2500 });
      }
    }
  }

  navigateToCandidature(candidatureId?: number): void {
    if (candidatureId) {
      this.router.navigate(['/candidatures', candidatureId]);
    }
  }

  getReminderIcon(type: Reminder['type']): string {
    return type === 'candidature' ? 'work_outline' : 'alarm';
  }

  toggleShowCompleted(): void {
    this.showCompleted.set(!this.showCompleted());
  }
}
