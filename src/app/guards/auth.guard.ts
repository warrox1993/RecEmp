// src/app/guards/auth.guard.ts
import { Injectable, inject } from '@angular/core'; // inject pour une injection plus moderne
import {
  CanActivateFn, // Utiliser CanActivateFn pour les guards fonctionnels
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';
// Observable n'est plus nécessaire si on lit directement les signals
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

// Approche fonctionnelle pour le guard, plus moderne avec Angular 15+
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService); // Nouvelle manière d'injecter dans les guards fonctionnels
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const expectedRoles = route.data['roles'] as Array<string> | undefined;

  // Lire directement la valeur du signal isAuthenticated
  if (!authService.isAuthenticated()) {
    console.log('AuthGuard: Utilisateur non authentifié, redirection vers /login');
    snackBar.open('Veuillez vous connecter pour accéder à cette page.', 'Fermer', { duration: 3000 });
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  // Si la route nécessite des rôles spécifiques
  if (expectedRoles && expectedRoles.length > 0) {
    const userRoles = authService.userRoles(); // Lire directement la valeur du signal userRoles
    if (!userRoles || !expectedRoles.some(role => userRoles.includes(role))) {
      console.log(`AuthGuard: Accès refusé. Rôles requis: ${expectedRoles.join(', ')}, Rôles utilisateur: ${userRoles?.join(', ') || 'aucun'}`);
      snackBar.open('Vous n\'avez pas les droits nécessaires pour accéder à cette page.', 'Fermer', { duration: 5000 });
      return router.createUrlTree(['/']); // Ou une page '/access-denied'
    }
  }

  return true; // L'utilisateur est authentifié et a les rôles requis
};
