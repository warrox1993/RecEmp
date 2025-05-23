// src/app/app.routes.ts - MISE À JOUR AVEC KANBAN
import { Routes } from '@angular/router';
import { CandidatureListComponent } from './components/candidature-list/candidature-list.component';
import { KanbanBoardComponent } from './components/kanban-board/kanban-board.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { authGuard } from './guards/auth.guard';
import { CandidatureDetailComponent } from './components/candidature-detail/candidature-detail.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ReminderListComponent } from './components/reminder-list/reminder-list.component';

export const routes: Routes = [
  // Page d'accueil
  { path: '', component: HomeComponent, title: 'Accueil - ProTrack CV' },

  // Gestion des candidatures - 2 vues disponibles
  {
    path: 'candidatures',
    component: CandidatureListComponent,
    canActivate: [authGuard],
    title: 'Mes Candidatures - ProTrack CV'
  },
  {
    path: 'kanban',
    component: KanbanBoardComponent,
    canActivate: [authGuard],
    title: 'Kanban Board - ProTrack CV'
  },
  {
    path: 'candidatures/:id',
    component: CandidatureDetailComponent,
    canActivate: [authGuard],
    title: 'Détail Candidature - ProTrack CV'
  },

  // Dashboard et rappels
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    title: 'Tableau de Bord - ProTrack CV'
  },
  {
    path: 'reminders',
    component: ReminderListComponent,
    canActivate: [authGuard],
    title: 'Mes Rappels - ProTrack CV'
  },

  // Authentification
  { path: 'login', component: LoginComponent, title: 'Connexion - ProTrack CV' },
  { path: 'register', component: RegisterComponent, title: 'Inscription - ProTrack CV' },

  // Futures fonctionnalités (commentées pour l'instant)
  // { path: 'profil', component: ProfileComponent, canActivate: [authGuard], title: 'Mon Profil - ProTrack CV' },
  // { path: 'forgot-password', component: ForgotPasswordComponent, title: 'Mot de passe oublié - ProTrack CV' },
  // { path: 'reset-password/:token', component: ResetPasswordComponent, title: 'Réinitialiser mot de passe - ProTrack CV' },
  // { path: 'confirm-email/:token', component: EmailConfirmationComponent, title: 'Confirmation Email - ProTrack CV' },

  // Redirection pour toutes les autres routes non trouvées vers la page d'accueil
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
