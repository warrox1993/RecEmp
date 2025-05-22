// src/app/services/notification.service.ts
import { Injectable, signal, computed, WritableSignal, Signal, effect } from '@angular/core';
import { AppNotification } from '../models/notification.model';
import { Reminder } from '../models/reminder.model';
import { CandidatureService } from './candidature.service';
import { Candidature } from '../models/candidature.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private _notifications: WritableSignal<AppNotification[]> = signal<AppNotification[]>([]);
  public readonly notifications: Signal<AppNotification[]> = this._notifications.asReadonly();
  public readonly unreadCount: Signal<number> = computed(() =>
    this._notifications().filter(n => !n.isRead).length
  );

  private _reminders: WritableSignal<Reminder[]> = signal<Reminder[]>([]);
  public readonly reminders: Signal<Reminder[]> = this._reminders.asReadonly();

  private readonly REMINDERS_STORAGE_KEY = 'protrack_cv_reminders';

  constructor(private candidatureService: CandidatureService) {
    this.loadRemindersFromStorage();

    effect(() => {
      const currentCandidatures = this.candidatureService.candidatures(); // Lire le signal des candidatures
      console.log('NotificationService Effect: candidatures() a changé ou _reminders() a changé.');
      // Mettre à jour les rappels basés sur les candidatures actuelles
      // Cela va potentiellement modifier _reminders, ce qui pourrait redéclencher l'effet si mal géré,
      // mais ici updateCandidatureReminders compare et ne modifie que si nécessaire.
      this.updateCandidatureReminders(currentCandidatures);

      // Générer des notifications à partir de la liste de rappels mise à jour
      // Cela modifie _notifications et potentiellement _reminders (notificationGenerated)
      this.generateNotificationsFromReminders();

      // Sauvegarder les rappels (qui ont pu être modifiés par generateNotificationsFromReminders)
      this.saveRemindersToStorage();
    }, { allowSignalWrites: true });

    // La souscription à candidatures$ est supprimée, l'effect s'en charge.
    // this.candidatureService.candidatures$.subscribe(candidatures => {
    //   console.log('NotificationService: Changement de candidatures détecté, mise à jour des rappels.');
    //   this.updateCandidatureReminders(candidatures);
    // });
  }


  private loadRemindersFromStorage(): void {
    const storedReminders = localStorage.getItem(this.REMINDERS_STORAGE_KEY);
    if (storedReminders) {
      try {
        const parsedReminders = JSON.parse(storedReminders) as Reminder[];
        this._reminders.set(parsedReminders.map(r => ({
          ...r,
          reminderDate: new Date(r.reminderDate),
          createdAt: new Date(r.createdAt)
        })));
      } catch (e) {
        this._reminders.set([]);
      }
    } else {
      this.updateCandidatureReminders(this.candidatureService.candidatures()); // Utiliser le signal
    }
  }

  private saveRemindersToStorage(): void {
    localStorage.setItem(this.REMINDERS_STORAGE_KEY, JSON.stringify(this._reminders()));
  }

  private updateCandidatureReminders(candidatures: Candidature[]): void {
    const existingReminders = this._reminders(); // Lire une seule fois au début
    const manualReminders = existingReminders.filter(r => r.type === 'manuel');
    const newCandidatureReminders: Reminder[] = [];

    candidatures.forEach(c => {
      if (c.dateRappel && (c.reponse === 'En attente' || c.reponse === 'En discussion')) {
        const reminderDate = this.parseDateFr(c.dateRappel);
        if (reminderDate) {
          const existingCandReminder = existingReminders.find(
            r => r.type === 'candidature' && r.relatedCandidatureId === c.id
          );
          if (existingCandReminder) {
            if (new Date(existingCandReminder.reminderDate).getTime() !== reminderDate.getTime()) {
              newCandidatureReminders.push({
                ...existingCandReminder,
                reminderDate: reminderDate,
                title: `Rappel: ${c.entreprise} - ${c.poste}`,
                notificationGenerated: false
              });
            } else {
              newCandidatureReminders.push(existingCandReminder);
            }
          } else {
            newCandidatureReminders.push({
              id: `cand-${c.id}-${reminderDate.getTime()}`,
              title: `Rappel: ${c.entreprise} - ${c.poste}`,
              reminderDate: reminderDate,
              type: 'candidature',
              relatedCandidatureId: c.id,
              isCompleted: false,
              createdAt: new Date(),
              notificationGenerated: false
            });
          }
        }
      }
    });
    // Comparer avant de setter pour éviter boucle d'effet si rien n'a changé
    const finalReminders = [...manualReminders, ...newCandidatureReminders].sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime());
    if (JSON.stringify(finalReminders) !== JSON.stringify(existingReminders.sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime()))) {
        this._reminders.set(finalReminders);
    }
  }

  private generateNotificationsFromReminders(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let newNotificationsWereAdded = false;

    this._reminders.update(reminders => {
      return reminders.map(reminder => {
        if (!reminder.isCompleted && !reminder.notificationGenerated && new Date(reminder.reminderDate) <= today) {
          const notification: AppNotification = {
            id: `notif-${reminder.id}-${Date.now()}`,
            type: 'rappel', title: reminder.title,
            message: reminder.description || `N'oubliez pas ce rappel prévu pour aujourd'hui.`,
            date: new Date(), isRead: false,
            link: reminder.type === 'candidature' && reminder.relatedCandidatureId ? `/candidatures/${reminder.relatedCandidatureId}` : undefined,
            candidatureId: reminder.relatedCandidatureId
          };
          this._notifications.update(currentNotifs =>
            [notification, ...currentNotifs].sort((a, b) => b.date.getTime() - a.date.getTime())
          );
          newNotificationsWereAdded = true;
          return { ...reminder, notificationGenerated: true };
        }
        return reminder;
      });
    });
    if (newNotificationsWereAdded) {
        console.log('De nouvelles notifications ont été générées à partir des rappels.');
    }
  }

  addManualReminder(data: Omit<Reminder, 'id' | 'type' | 'isCompleted' | 'createdAt' | 'notificationGenerated'>): Reminder {
    const newReminder: Reminder = {
      ...data,
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      type: 'manuel', isCompleted: false, createdAt: new Date(), notificationGenerated: false
    };
    this._reminders.update(currentReminders =>
      [...currentReminders, newReminder].sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime())
    );
    return newReminder;
  }

  completeReminder(reminderId: string, completed: boolean = true): void {
    this._reminders.update(reminders =>
      reminders.map(r =>
        r.id === reminderId ? { ...r, isCompleted: completed, notificationGenerated: completed } : r
      )
    );
  }

  deleteReminder(reminderId: string): void {
     this._reminders.update(reminders =>
      reminders.filter(r => r.id !== reminderId)
    );
  }

  markAsRead(notificationId: string): void {
    this._notifications.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  }

  markAllAsRead(): void {
    this._notifications.update(notifications =>
      notifications.map(n => ({ ...n, isRead: true }))
    );
  }

  addSystemNotification(notificationData: Omit<AppNotification, 'id' | 'date' | 'isRead'>): AppNotification {
    const newNotification: AppNotification = {
      ...notificationData,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      date: new Date(), isRead: false,
    };
    this._notifications.update(currentNotifications =>
      [newNotification, ...currentNotifications].sort((a, b) => b.date.getTime() - a.date.getTime())
    );
    return newNotification;
  }

  removeNotification(notificationId: string): void {
    this._notifications.update(notifications =>
      notifications.filter(n => n.id !== notificationId)
    );
  }

  refreshNotifications(): void {
    // L'effect s'en charge déjà si les candidatures changent.
    // On pourrait forcer une re-vérification ici si besoin.
    console.log('NotificationService: refreshNotifications() appelé. L\'effect devrait gérer la mise à jour.');
     this.updateCandidatureReminders(this.candidatureService.candidatures()); // Forcer la mise à jour des rappels
    // generateNotificationsFromReminders sera appelé par l'effect si _reminders change.
  }

  private parseDateFr(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      date.setHours(0,0,0,0);
      return date;
    }
    return null;
  }
}
