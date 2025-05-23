// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { CandidatureListComponent } from './components/candidature-list/candidature-list.component';
// import { LandingPageComponent } from './components/landing-page/landing-page.component'; // On va la remplacer par Home
import { HomeComponent } from './components/home/home.component'; // Importer notre nouvelle page d'accueil
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { authGuard } from './guards/auth.guard';
import { CandidatureDetailComponent } from './components/candidature-detail/candidature-detail.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ReminderListComponent } from './components/reminder-list/reminder-list.component';

// Importer les futurs composants
// import { ProfileComponent } from './components/profile/profile.component';
// import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
// import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
// import { EmailConfirmationComponent } from './components/auth/email-confirmation/email-confirmation.component';

export const routes: Routes = [
  // La route principale pointe maintenant vers HomeComponent
  { path: '', component: HomeComponent, title: 'Accueil - ProTrack CV' },

  // Si tu veux toujours accéder à l'ancienne LandingPage, tu peux lui donner un autre chemin,
  // par exemple : { path: 'old-landing', component: LandingPageComponent },
  // ou simplement la supprimer si elle n'est plus utile.

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
  {
    path: 'reminders',
    component: ReminderListComponent,
    canActivate: [authGuard],
    title: 'Mes Rappels - ProTrack CV'
  },

  // { path: 'profil', component: ProfileComponent, canActivate: [authGuard], title: 'Mon Profil - ProTrack CV' },

  { path: 'login', component: LoginComponent, title: 'Connexion - ProTrack CV' },
  { path: 'register', component: RegisterComponent, title: 'Inscription - ProTrack CV' },

  // { path: 'forgot-password', component: ForgotPasswordComponent, title: 'Mot de passe oublié - ProTrack CV' },
  // { path: 'reset-password/:token', component: ResetPasswordComponent, title: 'Réinitialiser mot de passe - ProTrack CV' },
  // { path: 'confirm-email/:token', component: EmailConfirmationComponent, title: 'Confirmation Email - ProTrack CV' },

  // Redirection pour toutes les autres routes non trouvées vers la page d'accueil
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
