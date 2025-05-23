// src/app/app.config.ts - VERSION DÉFINITIVE AVEC SUPPORT KANBAN COMPLET
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Importer les intercepteurs
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ======= ROUTING & NAVIGATION =======
    provideRouter(routes),

    // ======= ANIMATIONS (CRUCIAL POUR LE KANBAN) =======
    // Nécessaire pour :
    // - Animations de glisser-déposer du Kanban
    // - Transitions des cartes
    // - Feedback visuel des actions
    // - Animations Material Design
    provideAnimations(),

    // ======= MODULES ANGULAR MATERIAL =======
    importProvidersFrom(
      MatNativeDateModule,    // Support des datepickers français
      MatSnackBarModule       // Notifications globales (succès, erreurs, feedback Kanban)
    ),

    // ======= LOCALISATION FRANÇAISE =======
    // Configuration pour dates, heures, formats français
    // Utilisé dans : Kanban, formulaires, rapports
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },

    // ======= CONFIGURATION UI/UX =======
    // Apparence cohérente des formulaires dans toute l'app
    // Inclus : Kanban, dialogs, filtres
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'outline',    // Style moderne outline
        floatLabel: 'auto'       // Labels flottants intelligents
      }
    },

    // ======= HTTP & API =======
    // Configuration HTTP avec intercepteurs
    // Prêt pour futures intégrations API (LinkedIn, calendriers, etc.)
    provideHttpClient(withInterceptorsFromDi()),

    // ======= INTERCEPTEURS RÉSEAU =======
    // Gestion automatique de l'auth et des erreurs
    // Ordre important : Auth en premier, puis Error handling
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
  ]
};
