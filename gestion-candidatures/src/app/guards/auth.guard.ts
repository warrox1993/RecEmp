// src/app/guards/auth.guard.ts - VERSION AVEC DEBUG AMÉLIORÉ
import { Injectable, inject } from '@angular/core';
import {
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  console.log('🔧 AuthGuard: Vérification d\'accès pour:', state.url);

  const expectedRoles = route.data['roles'] as Array<string> | undefined;
  console.log('🔧 AuthGuard: Rôles requis:', expectedRoles);

  // Vérifier l'authentification
  const isAuth = authService.isAuthenticated();
  const currentUser = authService.currentUser();
  const token = authService.getToken();

  console.log('🔧 AuthGuard: État authentification:', {
    isAuthenticated: isAuth,
    hasUser: !!currentUser,
    hasToken: !!token,
    userEmail: currentUser?.email
  });

  if (!isAuth) {
    console.log('❌ AuthGuard: Utilisateur non authentifié, redirection vers /login');
    snackBar.open('Veuillez vous connecter pour accéder à cette page.', 'Fermer', { duration: 3000 });
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  // Si la route nécessite des rôles spécifiques
  if (expectedRoles && expectedRoles.length > 0) {
    const userRoles = authService.userRoles();
    console.log('🔧 AuthGuard: Vérification des rôles:', {
      expectedRoles,
      userRoles,
      hasRequiredRole: userRoles ? expectedRoles.some(role => userRoles.includes(role)) : false
    });

    if (!userRoles || !expectedRoles.some(role => userRoles.includes(role))) {
      console.log(`❌ AuthGuard: Accès refusé. Rôles requis: ${expectedRoles.join(', ')}, Rôles utilisateur: ${userRoles?.join(', ') || 'aucun'}`);
      snackBar.open('Vous n\'avez pas les droits nécessaires pour accéder à cette page.', 'Fermer', { duration: 5000 });
      return router.createUrlTree(['/']);
    }
  }

  console.log('✅ AuthGuard: Accès autorisé pour:', state.url);
  return true;
};
