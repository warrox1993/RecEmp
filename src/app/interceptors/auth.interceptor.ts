// src/app/interceptors/auth.interceptor.ts
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

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Récupérer le token valide
    const authToken = this.authService.getToken();

    // URL de base de l'API (à adapter selon votre configuration)
    const backendApiUrl = 'http://localhost:8080/api/';

    // Cloner la requête et ajouter le token si nécessaire
    if (authToken && this.shouldAddToken(request.url, backendApiUrl)) {
      const authReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      return next.handle(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          // Si erreur 401, vérifier si le token a expiré
          if (error.status === 401) {
            console.log('AuthInterceptor: Erreur 401 détectée');
            const expirationTime = this.authService.getTokenExpirationTime();

            if (expirationTime === null || expirationTime <= 0) {
              console.log('AuthInterceptor: Token expiré, déconnexion');
              this.authService.logout();
              this.router.navigate(['/login'], {
                queryParams: { message: 'Votre session a expiré. Veuillez vous reconnecter.' }
              });
            }
          }
          return throwError(() => error);
        })
      );
    }

    // Pour les requêtes sans token ou qui ne nécessitent pas d'authentification
    return next.handle(request);
  }

  private shouldAddToken(url: string, backendApiUrl: string): boolean {
    // Ne pas ajouter de token pour les endpoints d'authentification
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password'];

    // Vérifier si l'URL est pour notre API
    if (!url.startsWith(backendApiUrl)) {
      return false;
    }

    // Vérifier si c'est un endpoint d'authentification
    const isAuthEndpoint = authEndpoints.some(endpoint => url.includes(endpoint));
    return !isAuthEndpoint;
  }
}
