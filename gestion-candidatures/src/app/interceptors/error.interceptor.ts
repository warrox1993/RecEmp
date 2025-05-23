// src/app/interceptors/error.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Une erreur est survenue';
        let userMessage = errorMessage; // Message affiché à l'utilisateur

        console.error('ErrorInterceptor: Erreur interceptée', error);

        if (error.error instanceof ErrorEvent) {
          // Erreur côté client ou réseau
          errorMessage = `Erreur réseau: ${error.error.message}`;
          userMessage = 'Problème de connexion. Vérifiez votre connexion internet.';
        } else {
          // Erreur retournée par le backend
          errorMessage = `Erreur ${error.status}: ${error.error?.message || error.statusText}`;

          switch (error.status) {
            case 0:
              userMessage = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
              break;

            case 400:
              userMessage = error.error?.message || 'Données invalides. Vérifiez votre saisie.';
              break;

            case 401:
              // Non autorisé - géré par AuthInterceptor
              userMessage = 'Session expirée ou accès non autorisé.';
              // Ne pas déconnecter ici, c'est géré par AuthInterceptor
              break;

            case 403:
              userMessage = 'Vous n\'avez pas les droits pour effectuer cette action.';
              // Optionnel : rediriger vers une page d'accès refusé
              // this.router.navigate(['/access-denied']);
              break;

            case 404:
              userMessage = 'Ressource introuvable.';
              break;

            case 409:
              userMessage = error.error?.message || 'Conflit de données. Cette action n\'est pas possible.';
              break;

            case 422:
              userMessage = error.error?.message || 'Données invalides. Vérifiez votre saisie.';
              break;

            case 429:
              userMessage = 'Trop de requêtes. Veuillez patienter avant de réessayer.';
              break;

            case 500:
              userMessage = 'Erreur serveur. Nos équipes sont prévenues.';
              this.logErrorToConsole(error);
              break;

            case 502:
            case 503:
            case 504:
              userMessage = 'Service temporairement indisponible. Réessayez dans quelques instants.';
              break;

            default:
              userMessage = error.error?.message || `Erreur inattendue (${error.status})`;
          }
        }

        // Afficher le message à l'utilisateur seulement pour certaines erreurs
        if (this.shouldShowErrorToUser(error)) {
          this.showErrorMessage(userMessage);
        }

        // Logger l'erreur complète en développement
        if (this.isDevelopment()) {
          console.error('Détails de l\'erreur:', {
            message: errorMessage,
            status: error.status,
            error: error.error,
            url: error.url
          });
        }

        // Retourner l'erreur pour que les composants puissent la gérer si nécessaire
        return throwError(() => ({
          message: userMessage,
          status: error.status,
          originalError: error
        }));
      })
    );
  }

  private shouldShowErrorToUser(error: HttpErrorResponse): boolean {
    // Ne pas afficher les erreurs 401 (gérées par AuthInterceptor)
    // Ne pas afficher les erreurs de validation (422) car elles sont gérées dans les formulaires
    const silentErrors = [401, 422];
    return !silentErrors.includes(error.status);
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar']
    });
  }

  private isDevelopment(): boolean {
    // À adapter selon votre configuration
    return !window.location.hostname.includes('prod');
  }

  private logErrorToConsole(error: HttpErrorResponse): void {
    console.group('🔴 Erreur Serveur');
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('URL:', error.url);
    console.error('Error Object:', error.error);
    console.groupEnd();
  }
}
