// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { CandidatureListComponent } from './components/candidature-list/candidature-list.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { authGuard } from './guards/auth.guard';
import { CandidatureDetailComponent } from './components/candidature-detail/candidature-detail.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ReminderListComponent } from './components/reminder-list/reminder-list.component'; // Importer ReminderListComponent

// Importer les futurs composants
// import { ProfileComponent } from './components/profile/profile.component';
// import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
// import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
// import { EmailConfirmationComponent } from './components/auth/email-confirmation/email-confirmation.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent, title: 'Accueil - ProTrack CV' },

  {
    path: 'candidatures',
    component: CandidatureListComponent,
    canActivate: [authGuard],
    title: 'Mes Candidatures - ProTrack CV'
  },
  {
    path: 'candidatures/:id',
    component: CandidatureDetailComponent,
    canActivate: [authGuard],
    title: 'Détail Candidature - ProTrack CV'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    title: 'Tableau de Bord - ProTrack CV'
  },
  // Nouvelle route pour la liste des rappels
  {
    path: 'reminders',
    component: ReminderListComponent,
    canActivate: [authGuard], // Protéger aussi cette route
    title: 'Mes Rappels - ProTrack CV'
  },

  // { path: 'profil', component: ProfileComponent, canActivate: [authGuard], title: 'Mon Profil - ProTrack CV' },

  { path: 'login', component: LoginComponent, title: 'Connexion - ProTrack CV' },
  { path: 'register', component: RegisterComponent, title: 'Inscription - ProTrack CV' },

  // { path: 'forgot-password', component: ForgotPasswordComponent, title: 'Mot de passe oublié - ProTrack CV' },
  // { path: 'reset-password/:token', component: ResetPasswordComponent, title: 'Réinitialiser mot de passe - ProTrack CV' },
  // { path: 'confirm-email/:token', component: EmailConfirmationComponent, title: 'Confirmation Email - ProTrack CV' },

  { path: '**', redirectTo: '', pathMatch: 'full' }
];
