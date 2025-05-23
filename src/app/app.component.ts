// src/app/app.component.ts - VERSION DEBUG
import { Component, OnInit, Signal } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

// Imports Angular Material nécessaires pour le template app.component.html
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from './services/auth.service';
import { User } from './models/user.model';
import { NotificationService } from './services/notification.service';
import { AppNotification } from './models/notification.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatListModule,
    MatDividerModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ProTrack CV';
  currentYear = new Date().getFullYear();

  // Signaux pour déboguer
  currentUser!: Signal<User | null>;
  isAuthenticated!: Signal<boolean>;
  notifications!: Signal<AppNotification[]>;
  unreadNotificationsCount!: Signal<number>;

  // État de debug
  debugInfo = {
    authServiceReady: false,
    notificationServiceReady: false,
    signalsInitialized: false,
    errorMessage: ''
  };

  constructor(
    public authService: AuthService,
    public notificationService: NotificationService,
    private router: Router
  ) {
    console.log('🔧 AppComponent constructor - début');

    try {
      // Vérifier que les services sont prêts
      if (!authService) {
        throw new Error('AuthService non disponible');
      }
      if (!notificationService) {
        throw new Error('NotificationService non disponible');
      }

      this.debugInfo.authServiceReady = true;
      this.debugInfo.notificationServiceReady = true;

      // Initialiser les signaux avec gestion d'erreur
      try {
        this.currentUser = authService.currentUser;
        this.isAuthenticated = authService.isAuthenticated;
        this.notifications = notificationService.notifications;
        this.unreadNotificationsCount = notificationService.unreadCount;

        this.debugInfo.signalsInitialized = true;
        console.log('✅ AppComponent: Tous les signals initialisés');
      } catch (signalError) {
        console.error('❌ Erreur lors de l\'initialisation des signals:', signalError);
        this.debugInfo.errorMessage = `Erreur signals: ${signalError}`;
      }

    } catch (error) {
      console.error('❌ Erreur dans AppComponent constructor:', error);
      this.debugInfo.errorMessage = `Erreur constructor: ${error}`;
    }

    console.log('🔧 AppComponent constructor - fin');
    console.log('Debug Info:', this.debugInfo);
  }

  ngOnInit(): void {
    console.log('🔧 AppComponent ngOnInit');

    // Test des signaux
    try {
      console.log('Test currentUser:', this.currentUser?.());
      console.log('Test isAuthenticated:', this.isAuthenticated?.());
      console.log('Test notifications count:', this.notifications?.()?.length || 0);
      console.log('Test unread count:', this.unreadNotificationsCount?.());
    } catch (error) {
      console.error('❌ Erreur lors du test des signaux:', error);
    }
  }

  getNotificationIcon(type: AppNotification['type']): string {
    switch (type) {
      case 'rappel': return 'event_note';
      case 'info': return 'info_outline';
      case 'succes': return 'check_circle_outline';
      case 'erreur': return 'error_outline';
      default: return 'notifications';
    }
  }

  onNotificationClick(notification: AppNotification): void {
    try {
      if (!notification.isRead) {
        this.notificationService.markAsRead(notification.id);
      }
      if (notification.link) {
        this.router.navigateByUrl(notification.link);
      }
    } catch (error) {
      console.error('❌ Erreur lors du clic sur notification:', error);
    }
  }

  markAllNotificationsAsRead(): void {
    try {
      this.notificationService.markAllAsRead();
    } catch (error) {
      console.error('❌ Erreur lors du marquage des notifications:', error);
    }
  }

  logout(): void {
    try {
      this.authService.logout();
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
    }
  }
}
