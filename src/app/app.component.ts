// src/app/app.component.ts
import { Component, OnInit, Signal } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router'; // RouterModule pour routerLink
import { CommonModule, DatePipe } from '@angular/common'; // CommonModule pour *ngIf, async

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
    RouterModule, // Pour routerLink dans le template
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatListModule,
    MatDividerModule,
    DatePipe // Si utilisé dans le template de app.component (pour les dates de notif)
  ],
  templateUrl: './app.component.html', // Utiliser le fichier HTML externe
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ProTrack CV';
  currentYear = new Date().getFullYear();

  // Accès direct aux signals des services
  currentUser: Signal<User | null>;
  isAuthenticated: Signal<boolean>;
  notifications: Signal<AppNotification[]>;
  unreadNotificationsCount: Signal<number>;

  constructor(
    public authService: AuthService, // Rendre public pour accès direct dans le template
    public notificationService: NotificationService, // Rendre public
    private router: Router
  ) {
    this.currentUser = authService.currentUser;
    this.isAuthenticated = authService.isAuthenticated;
    this.notifications = notificationService.notifications;
    this.unreadNotificationsCount = notificationService.unreadCount;
  }

  ngOnInit(): void {
    // Logique d'initialisation si nécessaire
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
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id);
    }
    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
    // Pour fermer le menu après un clic, si mat-menu ne le fait pas automatiquement
    // Tu pourrais avoir besoin d'un @ViewChild sur le menu et appeler close()
  }

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  logout(): void {
    this.authService.logout();
  }
}
