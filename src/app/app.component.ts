// src/app/app.component.ts
// VERSION FINALE CORRIGÉE AVEC LOGIQUE POUR LA PAGE D'ACCUEIL

import { Component, OnInit, Signal, OnDestroy } from '@angular/core';
import { Router, RouterModule, RouterOutlet, NavigationEnd, Event as RouterEvent } from '@angular/router'; // Ajout de Event et RouterEvent
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

// Imports Angular Material (s'assurer qu'ils sont bien dans imports de @Component)
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

// Services et Modèles
import { AuthService } from './services/auth.service'; // Assurez-vous que le chemin est correct
import { User } from './models/user.model'; // Assurez-vous que le chemin est correct
import { NotificationService } from './services/notification.service'; // Assurez-vous que le chemin est correct
import { AppNotification } from './models/notification.model'; // Assurez-vous que le chemin est correct

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule, // Nécessaire pour routerLink
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
export class AppComponent implements OnInit, OnDestroy {
  title = 'ProTrack CV';
  currentYear = new Date().getFullYear();

  // Signaux pour l'état de l'application
  currentUser!: Signal<User | null>;
  isAuthenticated!: Signal<boolean>;
  notifications!: Signal<AppNotification[]>;
  unreadNotificationsCount!: Signal<number>;

  // Propriété pour déterminer si la page actuelle est la page d'accueil
  isHomePage: boolean = false;
  private routerSubscription!: Subscription;

  // Informations de débogage
  debugInfo = {
    authServiceReady: false,
    notificationServiceReady: false,
    signalsInitialized: false,
    errorMessage: '',
    currentRoute: ''
  };

  constructor(
    public authService: AuthService, // Doit être public si utilisé dans le template
    public notificationService: NotificationService, // Doit être public si utilisé dans le template
    private router: Router
  ) {
    console.log('🔧 AppComponent constructor - Initialisation...');

    try {
      // Vérification de la disponibilité des services
      if (!authService) { throw new Error('AuthService non disponible ou non injecté.'); }
      this.debugInfo.authServiceReady = true;
      if (!notificationService) { throw new Error('NotificationService non disponible ou non injecté.'); }
      this.debugInfo.notificationServiceReady = true;

      // Initialisation des signaux
      // Ces signaux doivent être définis dans vos services AuthService et NotificationService
      this.currentUser = this.authService.currentUser;
      this.isAuthenticated = this.authService.isAuthenticated;
      this.notifications = this.notificationService.notifications;
      this.unreadNotificationsCount = this.notificationService.unreadCount;

      this.debugInfo.signalsInitialized = true;
      console.log('✅ AppComponent: Signals initialisés.');

    } catch (error: any) {
      console.error('❌ Erreur critique dans AppComponent constructor:', error);
      this.debugInfo.errorMessage = `Erreur constructor: ${error.message || error}`;
    }
    console.log('🔧 AppComponent constructor - Fin.');
    console.log('Initial Debug Info:', this.debugInfo);
  }

  ngOnInit(): void {
    console.log('🔧 AppComponent ngOnInit - Démarrage...');

    // Abonnement aux événements de navigation pour détecter la page d'accueil
    this.routerSubscription = this.router.events.pipe(
      filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // La page d'accueil est généralement la racine '/'
      // ou une route spécifique comme '/home' ou '/accueil'
      // Adaptez la condition si votre route d'accueil est différente.
      this.isHomePage = (event.urlAfterRedirects === '/' || event.urlAfterRedirects === '/home');
      this.debugInfo.currentRoute = event.urlAfterRedirects;
      console.log(`➡️ Navigation vers: ${event.urlAfterRedirects}, Page d'accueil détectée: ${this.isHomePage}`);
    });

    // Affichage de l'état initial des signaux (pour le débogage)
    try {
      console.log('👤 CurrentUser (initial):', this.currentUser ? this.currentUser() : 'Signal non initialisé');
      console.log('🔑 IsAuthenticated (initial):', this.isAuthenticated ? this.isAuthenticated() : 'Signal non initialisé');
      console.log('🔔 Notifications count (initial):', this.notifications ? (this.notifications().length) : 'Signal non initialisé');
      console.log('🔢 Unread notifications (initial):', this.unreadNotificationsCount ? this.unreadNotificationsCount() : 'Signal non initialisé');
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'accès initial aux signaux dans ngOnInit:', error);
      this.debugInfo.errorMessage += ` Erreur ngOnInit signals: ${error.message || error}`;
    }
    console.log('🔧 AppComponent ngOnInit - Fin.');
  }

  ngOnDestroy(): void {
    // Nettoyage de l'abonnement pour éviter les fuites de mémoire
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
      console.log('🗑️ AppComponent ngOnDestroy - Abonnement au routeur désinscrit.');
    }
  }

  // Méthode pour obtenir l'icône de notification basée sur son type
  getNotificationIcon(type: AppNotification['type']): string {
    switch (type) {
      case 'rappel': return 'event_note'; // Icône pour les rappels
      case 'info': return 'info_outline';   // Icône pour les informations
      case 'succes': return 'check_circle_outline'; // Icône pour les succès
      case 'erreur': return 'error_outline';    // Icône pour les erreurs
      default: return 'notifications'; // Icône par défaut
    }
  }

  // Gestion du clic sur une notification
  onNotificationClick(notification: AppNotification): void {
    console.log(`🖱️ Clic sur notification: ID=${notification.id}, Lue=${notification.isRead}`);
    try {
      if (!notification.isRead) {
        this.notificationService.markAsRead(notification.id);
      }
      if (notification.link) {
        this.router.navigateByUrl(notification.link);
        console.log(`🔗 Redirection vers: ${notification.link}`);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du clic sur la notification:', error);
      // Afficher une notification d'erreur à l'utilisateur si nécessaire
    }
  }

  // Marquer toutes les notifications comme lues
  markAllNotificationsAsRead(): void {
    console.log('📬 Marquage de toutes les notifications comme lues...');
    try {
      this.notificationService.markAllAsRead();
    } catch (error: any) {
      console.error('❌ Erreur lors du marquage de toutes les notifications comme lues:', error);
    }
  }

  // Gestion de la déconnexion de l'utilisateur
  logout(): void {
    console.log('🚪 Tentative de déconnexion...');
    try {
      this.authService.logout(); // Le service AuthService devrait gérer la redirection
      // this.router.navigate(['/login']); // Redirection explicite si non gérée par le service
      console.log('✅ Déconnexion réussie.');
    } catch (error: any) {
      console.error('❌ Erreur lors de la déconnexion:', error);
    }
  }
}
