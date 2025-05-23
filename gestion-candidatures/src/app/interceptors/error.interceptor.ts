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
import { AuthService } from '../services/auth.service'; // Assure-toi que le chemin est correct
import { Router } from '@angular/router'; // Pour la redirection

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = `Erreur Interceptée: ${error.message}`;
        console.error('ErrorInterceptor: Erreur brute', error);

        if (error.error instanceof ErrorEvent) {
          // Erreur côté client ou réseau
          errorMessage = `Erreur Client: ${error.error.message}`;
        } else {
          // Le backend a retourné un code d'erreur
          errorMessage = `Code ${error.status}: ${error.error?.message || error.statusText}`;

          switch (error.status) {
            case 401: // Non autorisé (souvent token invalide/expiré)
              console.log('ErrorInterceptor: Erreur 401 - Non autorisé. Déconnexion.');
              this.authService.logout(); // Déconnecter l'utilisateur
              // Optionnel: afficher un message à l'utilisateur
              // this.router.navigate(['/login'], { queryParams: { sessionExpired: true } });
              errorMessage = 'Votre session a expiré ou vous n\'êtes pas autorisé. Veuillez vous reconnecter.';
              break;
            case 403: // Interdit (l'utilisateur est authentifié mais n'a pas les droits)
              console.log('ErrorInterceptor: Erreur 403 - Accès interdit.');
              // Rediriger vers une page "accès interdit" ou la page d'accueil
              // this.router.navigate(['/forbidden']); // Si tu as une page dédiée
              errorMessage = 'Vous n\'avez pas les droits nécessaires pour accéder à cette ressource.';
              break;
            case 404: // Non trouvé
                errorMessage = 'La ressource demandée n\'a pas été trouvée.';
                break;
            case 500: // Erreur serveur interne
                errorMessage = 'Une erreur interne est survenue sur le serveur. Veuillez réessayer plus tard.';
                break;
            // Tu peux ajouter d'autres cas ici
          }
        }
        // Il est souvent préférable de laisser le composant qui a fait l'appel gérer l'affichage de l'erreur spécifique
        // Mais pour les erreurs critiques comme 401, une action globale est bien.
        // Retourner l'erreur pour qu'elle puisse être traitée par le souscripteur si besoin,
        // ou la transformer en une erreur plus "user-friendly".
        return throwError(() => new Error(errorMessage)); // Retourner une nouvelle erreur avec le message formaté
      })
    );
  }
}
