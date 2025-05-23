// src/app/app.component.ts - MISE À JOUR AVEC SUPPORT KANBAN
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
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';

import { AuthService } from './services/auth.service';
import { User } from './models/user.model';
import { NotificationService } from './services/notification.service';
import { AppNotification } from './models/notification.model';
import { CandidatureDialogComponent } from './components/candidature-dialog/candidature-dialogue.component';

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
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ProTrack CV';
  currentYear = new Date().getFullYear();

  // Accès direct aux signals des services
  currentUser!: Signal<User | null>;
  isAuthenticated!: Signal<boolean>;
  notifications!: Signal<AppNotification[]>;
  unreadNotificationsCount!: Signal<number>;

  constructor(
    public authService: AuthService,
    public notificationService: NotificationService,
    private router: Router,
    private dialog: MatDialog
  ) {
    console.log('🔧 AppComponent constructor - début');

    try {
      this.currentUser = authService.currentUser;
      this.isAuthenticated = authService.isAuthenticated;
      this.notifications = notificationService.notifications;
      this.unreadNotificationsCount = notificationService.unreadCount;

      console.log('✅ AppComponent: Tous les signals initialisés');
    } catch (error) {
      console.error('❌ Erreur dans AppComponent constructor:', error);
    }

    console.log('🔧 AppComponent constructor - fin');
  }

  ngOnInit(): void {
    console.log('🔧 AppComponent ngOnInit');
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
  }

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  // Nouvelle méthode pour ouvrir rapidement le dialog d'ajout de candidature
  openQuickAddDialog(): void {
    const dialogRef = this.dialog.open(CandidatureDialogComponent, {
      width: 'clamp(300px, 90vw, 800px)',
      maxWidth: '95vw',
      data: { candidature: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Le service gère déjà l'ajout, pas besoin de logique supplémentaire ici
        console.log('✅ Nouvelle candidature ajoutée depuis le menu rapide');

        // Optionnel: rediriger vers la vue Kanban pour voir le résultat
        this.router.navigate(['/kanban']);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
