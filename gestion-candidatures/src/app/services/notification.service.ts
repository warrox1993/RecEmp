// src/app/services/notification.service.ts - VERSION SIMPLIFIÉE
import { Injectable, signal, computed, WritableSignal, Signal } from '@angular/core';
import { AppNotification } from '../models/notification.model';
import { Reminder } from '../models/reminder.model';

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

  constructor() {
    console.log('🔧 NotificationService constructor - version simplifiée');
    this.loadRemindersFromStorage();
    this.initializeWithDefaultNotifications();
  }

  private loadRemindersFromStorage(): void {
    try {
      const storedReminders = localStorage.getItem(this.REMINDERS_STORAGE_KEY);
      if (storedReminders) {
        const parsedReminders = JSON.parse(storedReminders) as Reminder[];
        this._reminders.set(parsedReminders.map(r => ({
          ...r,
          reminderDate: new Date(r.reminderDate),
          createdAt: new Date(r.createdAt)
        })));
        console.log('✅ Rappels chargés depuis localStorage:', parsedReminders.length);
      } else {
        console.log('🔧 Aucun rappel en localStorage, initialisation vide');
        this._reminders.set([]);
      }
    } catch (e) {
      console.error('❌ Erreur lors du chargement des rappels:', e);
      this._reminders.set([]);
    }
  }

  private saveRemindersToStorage(): void {
    try {
      localStorage.setItem(this.REMINDERS_STORAGE_KEY, JSON.stringify(this._reminders()));
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des rappels:', error);
    }
  }

  private initializeWithDefaultNotifications(): void {
    // Ajouter quelques notifications par défaut pour tester
    const defaultNotifications: AppNotification[] = [
      {
        id: 'welcome',
        type: 'info',
        title: 'Bienvenue sur ProTrack CV !',
        message: 'Votre outil de suivi de candidatures est prêt.',
        date: new Date(),
        isRead: false
      }
    ];

    this._notifications.set(defaultNotifications);
  }

  // Méthodes essentielles
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

  addManualReminder(data: { title: string; description?: string; reminderDate: Date }): Reminder {
    const newReminder: Reminder = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      reminderDate: data.reminderDate,
      type: 'manuel',
      isCompleted: false,
      createdAt: new Date(),
      notificationGenerated: false
    };

    this._reminders.update(reminders => [...reminders, newReminder]);
    this.saveRemindersToStorage();

    console.log('✅ Rappel manuel ajouté:', newReminder.title);
    return newReminder;
  }

  completeReminder(reminderId: string, completed: boolean = true): void {
    this._reminders.update(reminders =>
      reminders.map(r =>
        r.id === reminderId ? { ...r, isCompleted: completed } : r
      )
    );
    this.saveRemindersToStorage();
    console.log('✅ Rappel marqué comme complété:', reminderId);
  }

  deleteReminder(reminderId: string): void {
    this._reminders.update(reminders =>
      reminders.filter(r => r.id !== reminderId)
    );
    this.saveRemindersToStorage();
    console.log('✅ Rappel supprimé:', reminderId);
  }

  addSystemNotification(notificationData: {
    type: AppNotification['type'];
    title: string;
    message: string;
    link?: string;
    candidatureId?: number;
  }): AppNotification {
    const newNotification: AppNotification = {
      id: Date.now().toString(),
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      date: new Date(),
      isRead: false,
      link: notificationData.link,
      candidatureId: notificationData.candidatureId
    };

    this._notifications.update(notifications => [newNotification, ...notifications]);
    console.log('✅ Notification système ajoutée:', newNotification.title);
    return newNotification;
  }

  removeNotification(notificationId: string): void {
    this._notifications.update(notifications =>
      notifications.filter(n => n.id !== notificationId)
    );
  }

  refreshNotifications(): void {
    console.log('🔧 Rafraîchissement des notifications...');
    // Pour l'instant, on ne fait qu'un log
    // Cette méthode pourrait être étendue pour synchroniser avec un serveur
  }
}
