// src/app/services/auth.service.ts
import { Injectable, signal, computed, WritableSignal, Signal } from '@angular/core'; // Importer signal et computed
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
  // private apiUrl = 'http://localhost:8080/api/auth'; // Pour plus tard

  // Utilisation d'un WritableSignal pour l'état de l'utilisateur actuel
  private _currentUser: WritableSignal<User | null> = signal<User | null>(this.getInitialUserFromStorage());
  // Signal public en lecture seule pour l'utilisateur actuel
  public readonly currentUser: Signal<User | null> = this._currentUser.asReadonly();

  // Signal calculé pour savoir si l'utilisateur est authentifié
  public readonly isAuthenticated: Signal<boolean> = computed(() => !!this._currentUser() && !!this.getToken());

  // Signal calculé pour les rôles de l'utilisateur
  public readonly userRoles: Signal<string[] | undefined> = computed(() => this._currentUser()?.roles);


  private readonly TOKEN_KEY = 'protrack_cv_auth_token';
  private readonly USER_KEY = 'protrack_cv_user_info';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Optionnel: logguer les changements d'état de l'utilisateur pour le debug
    // effect(() => {
    //   console.log('AuthService: currentUser Signal changed:', this._currentUser());
    // });
  }

  private getInitialUserFromStorage(): User | null {
    const token = localStorage.getItem(this.TOKEN_KEY); // Utiliser localStorage directement ici
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

  login(credentials: LoginCredentials): Observable<User | null> {
    console.log(`AuthService: Tentative de connexion pour ${credentials.email}`);
    // La logique de l'appel HTTP (même simulée) reste un Observable
    // return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
    //   tap(response => {
    //     if (response && response.token) {
    //       this.setSession(response.token, response.user);
    //     }
    //   }),
    //   map(response => response.user || null),
    //   catchError(this.handleError)
    // );

    // Simulation actuelle
    if (credentials.email === 'test@example.com' && credentials.password === 'password') {
      const mockUser: User = { id: '1', firstName: 'Jean', lastName: 'Test', email: 'test@example.com', roles: ['USER', 'ADMIN'] }; // Ajout du rôle ADMIN pour test
      const mockToken = 'mock_jwt_token_string_12345';
      this.setSession(mockToken, mockUser);
      return of(mockUser).pipe(delay(500)); // Simuler une petite latence
    } else {
      return throwError(() => new Error('Identifiants de simulation incorrects')).pipe(delay(500));
    }
  }

  register(payload: RegisterPayload): Observable<any> {
    console.log(`AuthService: Tentative d'inscription pour ${payload.email}`);
    // La logique de l'appel HTTP reste un Observable
    // return this.http.post(`${this.apiUrl}/register`, payload).pipe(
    //   tap(response => console.log('Inscription réussie', response)),
    //   catchError(this.handleError)
    // );

    // Simulation actuelle
    if (payload.email.includes('exist')) {
        return throwError(() => new Error('Cet email est déjà utilisé.')).pipe(delay(500));
    }
    const mockUser: User = { id: String(Date.now()), firstName: payload.firstName, lastName: payload.lastName, email: payload.email, roles: ['USER'] };
    console.log('Inscription simulée réussie pour:', mockUser);
    return of({ message: 'Inscription réussie ! Veuillez vous connecter ou confirmer votre email.', user: mockUser }).pipe(delay(500));
  }

  logout(): void {
    console.log('AuthService: Déconnexion');
    this.clearUserSession();
    this.router.navigate(['/login']);
  }

  // getToken reste utile pour l'intercepteur et la vérification d'isAuthenticated
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setSession(token: string, user?: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    if (user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this._currentUser.set(user); // Mettre à jour le signal
    } else {
      // Si pas d'objet user, on pourrait essayer de décoder le token pour des infos basiques (non fait ici)
      // ou mettre le signal à null si l'objet user est indispensable.
      localStorage.removeItem(this.USER_KEY); // S'assurer que user info est clean
      this._currentUser.set(null);
    }
  }

  private clearUserSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.set(null); // Mettre à jour le signal
  }

  // Le handleError reste pertinent pour les Observables des appels HTTP
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue !';
    // ... (logique de handleError inchangée pour l'instant)
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur : ${error.error.message}`;
    } else {
      errorMessage = `Code d'erreur ${error.status}: ${error.message || error.error?.message || error.statusText}`;
      if (error.status === 401) {
        console.error('Erreur 401: Non autorisé. Le token est peut-être invalide ou expiré.');
        // La déconnexion est maintenant gérée par l'intercepteur d'erreur si on le souhaite,
        // ou on peut la forcer ici aussi si l'appel vient du login/refresh token.
        // this.logout(); // Attention aux boucles si le login/refresh lui-même fait 401.
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
