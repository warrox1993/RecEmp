    // src/app/app.config.ts
    import { ApplicationConfig, importProvidersFrom } from '@angular/core';
    import { provideRouter } from '@angular/router';
    import { provideAnimations } from '@angular/platform-browser/animations';
    import { routes } from './app.routes';
    import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
    import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
    import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
    import { MatSnackBarModule } from '@angular/material/snack-bar'; // Importer MatSnackBarModule

    // Importer les intercepteurs
    import { AuthInterceptor } from './interceptors/auth.interceptor';
    import { ErrorInterceptor } from './interceptors/error.interceptor';

    export const appConfig: ApplicationConfig = {
      providers: [
        provideRouter(routes),
        provideAnimations(), // Nécessaire pour MatSnackBar aussi
        importProvidersFrom(
          MatNativeDateModule,
          MatSnackBarModule // Fournir MatSnackBarModule globalement
        ),
        { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
        { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } },

        provideHttpClient(withInterceptorsFromDi()),

        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true }
      ]
    };
