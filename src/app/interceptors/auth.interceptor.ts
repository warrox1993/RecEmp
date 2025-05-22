// src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service'; // Assure-toi que le chemin est correct

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const authToken = this.authService.getToken();
    // Cloner la requête pour y ajouter le header d'autorisation
    // Seulement si le token existe et que la requête n'est pas vers une API d'authentification
    // Tu devras peut-être affiner la condition pour exclure les URLs de login/register
    // Par exemple, en vérifiant si request.url.includes('/api/auth/')

    // Exemple d'URL de base pour ton API (à adapter)
    const backendApiUrl = 'http://localhost:8080/api/'; // Ou l'URL de ton API Spring Boot

    if (authToken && request.url.startsWith(backendApiUrl) && !request.url.includes('/auth/')) {
      // Si l'URL commence par l'URL de ton API et ne contient pas '/auth/' (pour login/register)
      const authReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });
      // console.log('AuthInterceptor: Ajout du token Bearer', authReq.headers.get('Authorization'));
      return next.handle(authReq);
    }

    // Pour les autres requêtes (ou si pas de token), on ne modifie rien
    return next.handle(request);
  }
}
