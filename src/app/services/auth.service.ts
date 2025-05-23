// src/app/services/auth.service.ts
import { Injectable, signal, computed, WritableSignal, Signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, map, delay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, LoginCredentials, RegisterPayload } from '../models/user.model';

interface AuthResponse {
  token: string;
  expiresIn?: number; // Durée de vie du token en secondes
  user?: User;
}

interface StoredToken {
  token: string;
  expiresAt: number; // Timestamp d'expiration
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // private apiUrl = 'http://localhost:8080/api/auth'; // Pour plus tard

  // Utilisation d'un WritableSignal pour l'état de l'utilisateur actuel
  private _currentUser: WritableSignal<User | null> = signal<User | null>(this.getInitialUserFromStorage());
  // Signal public en lecture seule pour l'utilisateur actuel
  public readonly currentUser: Signal<User | null> = this._currentUser.asReadonly();

  // Signal calculé pour savoir si l'utilisateur est authentifié
  public readonly isAuthenticated: Signal<boolean> = computed(() => {
    const user = this._currentUser();
    const token = this.getValidToken();
    return !!user && !!token;
  });

  // Signal calculé pour les rôles de l'utilisateur
  public readonly userRoles: Signal<string[] | undefined> = computed(() => this._currentUser()?.roles);

  private readonly TOKEN_KEY = 'protrack_cv_auth_token';
  private readonly USER_KEY = 'protrack_cv_user_info';
  private readonly DEFAULT_TOKEN_DURATION = 3600 * 24; // 24 heures en secondes

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Vérifier périodiquement l'expiration du token
    this.startTokenExpirationCheck();
  }

  private getInitialUserFromStorage(): User | null {
    const token = this.getValidToken();
    const storedUser = localStorage.getItem(this.USER_KEY);

    if (token && storedUser) {
      try {
        return JSON.parse(storedUser) as User;
      } catch (e) {
        console.error("Error parsing stored user", e);
        this.clearUserSession();
        return null;
      }
    }
    return null;
  }

  private startTokenExpirationCheck(): void {
    // Vérifier toutes les minutes si le token a expiré
    setInterval(() => {
      if (this.isTokenExpired()) {
        console.log('Token expiré, déconnexion automatique');
        this.logout();
      }
    }, 60000); // 60 secondes
  }

  login(credentials: LoginCredentials): Observable<User | null> {
    console.log(`AuthService: Tentative de connexion pour ${credentials.email}`);

    // Simulation actuelle avec gestion de l'expiration
    if (credentials.email === 'test@example.com' && credentials.password === 'password') {
      const mockUser: User = {
        id: '1',
        firstName: 'Jean',
        lastName: 'Test',
        email: 'test@example.com',
        roles: ['USER', 'ADMIN']
      };
      const mockToken = 'mock_jwt_token_' + Date.now();
      const expiresIn = this.DEFAULT_TOKEN_DURATION;

      this.setSession(mockToken, expiresIn, mockUser);
      return of(mockUser).pipe(delay(500));
    } else {
      return throwError(() => new Error('Identifiants incorrects')).pipe(delay(500));
    }

    // Code pour l'API réelle (à décommenter plus tard)
    /*
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          const expiresIn = response.expiresIn || this.DEFAULT_TOKEN_DURATION;
          this.setSession(response.token, expiresIn, response.user);
        }
      }),
      map(response => response.user || null),
      catchError(this.handleError.bind(this))
    );
    */
  }

  register(payload: RegisterPayload): Observable<any> {
    console.log(`AuthService: Tentative d'inscription pour ${payload.email}`);

    // Simulation actuelle
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
      message: 'Inscription réussie ! Veuillez vous connecter.',
      user: mockUser
    }).pipe(delay(500));

    // Code pour l'API réelle (à décommenter plus tard)
    /*
    return this.http.post(`${this.apiUrl}/register`, payload).pipe(
      tap(response => console.log('Inscription réussie', response)),
      catchError(this.handleError.bind(this))
    );
    */
  }

  logout(): void {
    console.log('AuthService: Déconnexion');
    this.clearUserSession();
    this.router.navigate(['/login']);
  }

  // Récupérer le token seulement s'il est valide
  getToken(): string | null {
    return this.getValidToken();
  }

  private getValidToken(): string | null {
    const storedTokenStr = localStorage.getItem(this.TOKEN_KEY);
    if (!storedTokenStr) return null;

    try {
      const storedToken: StoredToken = JSON.parse(storedTokenStr);
      const now = Date.now();

      if (storedToken.expiresAt > now) {
        return storedToken.token;
      } else {
        console.log('Token expiré, suppression');
        this.clearUserSession();
        return null;
      }
    } catch (e) {
      console.error('Erreur lors de la lecture du token', e);
      this.clearUserSession();
      return null;
    }
  }

  private isTokenExpired(): boolean {
    const token = this.getValidToken();
    return !token;
  }

  private setSession(token: string, expiresIn: number, user?: User): void {
    const expiresAt = Date.now() + (expiresIn * 1000); // Convertir en millisecondes
    const storedToken: StoredToken = {
      token,
      expiresAt
    };

    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(storedToken));

    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this._currentUser.set(user);
    } else {
      localStorage.removeItem(this.USER_KEY);
      this._currentUser.set(null);
    }

    console.log(`Session créée, expiration dans ${expiresIn} secondes`);
  }

  private clearUserSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.set(null);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue !';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur : ${error.error.message}`;
    } else {
      errorMessage = `Code d'erreur ${error.status}: ${error.message || error.error?.message || error.statusText}`;

      if (error.status === 401) {
        console.error('Erreur 401: Non autorisé.');
        // La déconnexion est gérée par l'intercepteur d'erreur
      }
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // Méthode pour rafraîchir le token (pour une implémentation future)
  refreshToken(): Observable<any> {
    // À implémenter avec l'API réelle
    return throwError(() => new Error('Refresh token non implémenté'));
  }

  // Méthode pour obtenir le temps restant avant expiration (en secondes)
  getTokenExpirationTime(): number | null {
    const storedTokenStr = localStorage.getItem(this.TOKEN_KEY);
    if (!storedTokenStr) return null;

    try {
      const storedToken: StoredToken = JSON.parse(storedTokenStr);
      const now = Date.now();
      const remaining = Math.max(0, storedToken.expiresAt - now) / 1000;
      return Math.floor(remaining);
    } catch (e) {
      return null;
    }
  }
}
