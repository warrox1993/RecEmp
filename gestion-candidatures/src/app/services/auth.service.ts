// src/app/services/auth.service.ts - VERSION AVEC IDENTIFIANTS VALIDES
import { Injectable, signal, computed, WritableSignal, Signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, map, delay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, LoginCredentials, RegisterPayload } from '../models/user.model';

interface AuthResponse {
  token: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _currentUser: WritableSignal<User | null> = signal<User | null>(null);
  public readonly currentUser: Signal<User | null> = this._currentUser.asReadonly();

  public readonly isAuthenticated: Signal<boolean> = computed(() => !!this._currentUser() && !!this.getToken());
  public readonly userRoles: Signal<string[] | undefined> = computed(() => this._currentUser()?.roles);

  private readonly TOKEN_KEY = 'protrack_cv_auth_token';
  private readonly USER_KEY = 'protrack_cv_user_info';
  private initialized = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    console.log('🔧 AuthService constructor - début');
    this.initializeFromStorage();
    console.log('🔧 AuthService constructor - fin');
  }

  private initializeFromStorage(): void {
    if (this.initialized) return;
    this.initialized = true;

    try {
      console.log('🔧 AuthService: Chargement depuis localStorage...');
      const initialUser = this.getInitialUserFromStorage();
      this._currentUser.set(initialUser);
      console.log('✅ AuthService: Utilisateur initial chargé:', initialUser ? initialUser.email : 'aucun');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation AuthService:', error);
      this._currentUser.set(null);
    }
  }

  private getInitialUserFromStorage(): User | null {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const storedUser = localStorage.getItem(this.USER_KEY);

      if (token && storedUser) {
        console.log('🔧 AuthService: Token et utilisateur trouvés dans localStorage');
        const user = JSON.parse(storedUser) as User;
        console.log('🔧 AuthService: Utilisateur parsé:', user.email);
        return user;
      } else {
        console.log('🔧 AuthService: Aucun token ou utilisateur en localStorage');
        return null;
      }
    } catch (e) {
      console.error("❌ Erreur lors du parsing de l'utilisateur stocké:", e);
      this.clearUserSession();
      return null;
    }
  }

  login(credentials: LoginCredentials): Observable<User | null> {
    console.log(`AuthService: Tentative de connexion pour ${credentials.email}`);

    // CORRECTION: Identifiants qui passent la validation du formulaire
    if (credentials.email === 'admin@protrack.com' && credentials.password === 'admin123') {
      const adminUser: User = {
        id: '1',
        firstName: 'Admin',
        lastName: 'Administrator',
        email: 'admin@protrack.com',
        roles: ['USER', 'ADMIN']
      };
      const mockToken = 'admin_jwt_token_12345';

      this.setSession(mockToken, adminUser);
      console.log('✅ Connexion admin réussie !');
      return of(adminUser).pipe(delay(500));
    }
    // Compte utilisateur simple
    else if (credentials.email === 'user@protrack.com' && credentials.password === 'user123') {
      const userUser: User = {
        id: '3',
        firstName: 'Utilisateur',
        lastName: 'Standard',
        email: 'user@protrack.com',
        roles: ['USER']
      };
      const mockToken = 'user_jwt_token_12345';

      this.setSession(mockToken, userUser);
      console.log('✅ Connexion utilisateur réussie !');
      return of(userUser).pipe(delay(500));
    }
    // Ancien compte de test (toujours disponible)
    else if (credentials.email === 'test@example.com' && credentials.password === 'password') {
      const mockUser: User = {
        id: '2',
        firstName: 'Jean',
        lastName: 'Test',
        email: 'test@example.com',
        roles: ['USER']
      };
      const mockToken = 'test_jwt_token_12345';

      this.setSession(mockToken, mockUser);
      console.log('✅ Connexion test réussie !');
      return of(mockUser).pipe(delay(500));
    }
    else {
      console.log('❌ Identifiants incorrects pour:', credentials.email);
      return throwError(() => new Error('Identifiants incorrects. Essayez admin@protrack.com/admin123 ou user@protrack.com/user123')).pipe(delay(500));
    }
  }

  register(payload: RegisterPayload): Observable<any> {
    console.log(`AuthService: Tentative d'inscription pour ${payload.email}`);

    if (payload.email.includes('exist')) {
      return throwError(() => new Error('Cet email est déjà utilisé.')).pipe(delay(500));
    }

    const mockUser: User = {
      id: String(Date.now()),
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      roles: ['USER']
    };

    console.log('Inscription simulée réussie pour:', mockUser);
    return of({
      message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
      user: mockUser
    }).pipe(delay(500));
  }

  logout(): void {
    console.log('AuthService: Déconnexion');
    this.clearUserSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  private setSession(token: string, user?: User): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      if (user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this._currentUser.set(user);
        console.log('✅ Session utilisateur définie pour:', user.email);
      } else {
        localStorage.removeItem(this.USER_KEY);
        this._currentUser.set(null);
        console.log('🔧 Session utilisateur vidée');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la définition de la session:', error);
    }
  }

  private clearUserSession(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      this._currentUser.set(null);
      console.log('🔧 Session utilisateur nettoyée');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage de la session:', error);
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue !';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur : ${error.error.message}`;
    } else {
      errorMessage = `Code d'erreur ${error.status}: ${error.message || error.error?.message || error.statusText}`;
      if (error.status === 401) {
        console.error('Erreur 401: Non autorisé. Le token est peut-être invalide ou expiré.');
      }
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
