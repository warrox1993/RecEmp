// src/app/services/notification.service.ts - VERSION CORRIGÉE
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
  private readonly NOTIFICATIONS_STORAGE_KEY = 'protrack_cv_notifications';
  private initialized = false;

  constructor(private candidatureService: CandidatureService) {
    console.log('🔧 NotificationService constructor - début');

    // Initialisation simple sans effect problématique
    this.initializeService();

    console.log('🔧 NotificationService constructor - fin');
  }

  private initializeService(): void {
    if (this.initialized) return;
    this.initialized = true;

    console.log('🔧 NotificationService: Initialisation...');

    try {
      this.loadFromStorage();
      this.generateSampleNotifications(); // Ajouter quelques notifications de test
      console.log('✅ NotificationService initialized successfully');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation NotificationService:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      // Charger les reminders
      const storedReminders = localStorage.getItem(this.REMINDERS_STORAGE_KEY);
      if (storedReminders) {
        const parsedReminders = JSON.parse(storedReminders) as Reminder[];
        this._reminders.set(parsedReminders.map(r => ({
          ...r,
          reminderDate: new Date(r.reminderDate),
          createdAt: new Date(r.createdAt)
        })));
        console.log('✅ Rappels chargés:', parsedReminders.length);
      }

      // Charger les notifications
      const storedNotifications = localStorage.getItem(this.NOTIFICATIONS_STORAGE_KEY);
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications) as AppNotification[];
        this._notifications.set(parsedNotifications.map(n => ({
          ...n,
          date: new Date(n.date)
        })));
        console.log('✅ Notifications chargées:', parsedNotifications.length);
      }
    } catch (e) {
      console.error('❌ Erreur lors du chargement depuis le stockage:', e);
      this._reminders.set([]);
      this._notifications.set([]);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.REMINDERS_STORAGE_KEY, JSON.stringify(this._reminders()));
      localStorage.setItem(this.NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this._notifications()));
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    }
  }

  private generateSampleNotifications(): void {
    // Génerer quelques notifications de test si aucune n'existe
    if (this._notifications().length === 0) {
      const sampleNotifications: AppNotification[] = [
        {
          id: 'notif-1',
          type: 'info',
          title: 'Bienvenue dans ProTrack CV !',
          message: 'Votre application de suivi de candidatures est prête à l\'emploi.',
          date: new Date(),
          isRead: false
        },
        {
          id: 'notif-2',
          type: 'rappel',
          title: 'Rappel de relance',
          message: 'N\'oubliez pas de relancer vos candidatures en attente.',
          date: new Date(Date.now() - 1000 * 60 * 30), // Il y a 30 minutes
          isRead: false
        }
      ];
      this._notifications.set(sampleNotifications);
      this.saveToStorage();
    }
  }

  // Méthodes publiques essentielles
  markAsRead(notificationId: string): void {
    this._notifications.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    this.saveToStorage();
  }

  markAllAsRead(): void {
    this._notifications.update(notifications =>
      notifications.map(n => ({ ...n, isRead: true }))
    );
    this.saveToStorage();
  }

  addManualReminder(data: { title: string; description: string; reminderDate: Date }): Reminder {
    const newReminder: Reminder = {
      id: `reminder-${Date.now()}`,
      title: data.title,
      description: data.description,
      reminderDate: data.reminderDate,
      type: 'manuel',
      isCompleted: false,
      createdAt: new Date(),
      notificationGenerated: false
    };

    this._reminders.update(reminders => [...reminders, newReminder]);
    this.saveToStorage();

    // Ajouter une notification
    this.addSystemNotification({
      type: 'rappel',
      title: 'Nouveau rappel créé',
      message: `Rappel "${data.title}" programmé pour le ${data.reminderDate.toLocaleDateString('fr-FR')}`
    });

    return newReminder;
  }

  completeReminder(reminderId: string, completed: boolean = true): void {
    this._reminders.update(reminders =>
      reminders.map(r =>
        r.id === reminderId ? { ...r, isCompleted: completed } : r
      )
    );
    this.saveToStorage();
  }

  deleteReminder(reminderId: string): void {
    this._reminders.update(reminders =>
      reminders.filter(r => r.id !== reminderId)
    );
    this.saveToStorage();
  }

  addSystemNotification(notificationData: {
    type: AppNotification['type'];
    title: string;
    message: string;
    link?: string;
    candidatureId?: number;
  }): AppNotification {
    const newNotification: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      date: new Date(),
      isRead: false,
      link: notificationData.link,
      candidatureId: notificationData.candidatureId
    };

    this._notifications.update(notifications => [newNotification, ...notifications]);
    this.saveToStorage();
    return newNotification;
  }

  removeNotification(notificationId: string): void {
    this._notifications.update(notifications =>
      notifications.filter(n => n.id !== notificationId)
    );
    this.saveToStorage();
  }

  refreshNotifications(): void {
    console.log('🔧 Actualisation des notifications...');
    // Pour l'instant, on ne fait que recharger depuis le stockage
    this.loadFromStorage();
  }
}
