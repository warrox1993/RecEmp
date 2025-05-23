import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
// Importe WritableSignal si tu veux être plus explicite sur le type
import { signal, WritableSignal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
// ... autres imports ...
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Tu auras besoin d'un type pour ton utilisateur, par exemple :
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  // Ajoute d'autres propriétés si nécessaire
}

describe('AppComponent', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  // Déclare des variables pour tes signaux ici
  let currentUserSignal: WritableSignal<User | null>;
  let isAuthenticatedSignal: WritableSignal<boolean>;
  let notificationsSignal: WritableSignal<any[]>; // Précise le type de tes notifications
  let unreadCountSignal: WritableSignal<number>;

  beforeEach(async () => {
    // Initialise tes signaux ici
    currentUserSignal = signal<User | null>(null);
    isAuthenticatedSignal = signal(false);
    notificationsSignal = signal([]);
    unreadCountSignal = signal(0);

    // Crée des mocks pour les services en utilisant les signaux
    mockAuthService = jasmine.createSpyObj('AuthService', ['logout'], {
      // Assigne les signaux aux propriétés du mock
      // TypeScript saura que ce sont des getters qui retournent la valeur actuelle du signal
      currentUser: currentUserSignal,
      isAuthenticated: isAuthenticatedSignal
    });

    mockNotificationService = jasmine.createSpyObj('NotificationService', ['markAsRead', 'markAllAsRead'], {
      notifications: notificationsSignal,
      unreadCount: unreadCountSignal
    });

    await TestBed.configureTestingModule({
      imports: [
        AppComponent, // Assure-toi qu'AppComponent est bien exporté et standalone, ou déclaré si non-standalone
        RouterTestingModule,
        CommonModule,
        BrowserAnimationsModule,
        MatToolbarModule,
        // ... autres modules Material
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'ProTrack CV' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('ProTrack CV');
  });

  it('should render title in toolbar', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const titleElement = compiled.querySelector('.app-title');
    expect(titleElement?.textContent).toContain('ProTrack CV');
  });

  it('should display login/register buttons when not authenticated', () => {
    // isAuthenticatedSignal est déjà à false par défaut
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const loginButton = compiled.querySelector('a[routerLink="/login"]');
    const registerButton = compiled.querySelector('a[routerLink="/register"]');
    expect(loginButton).toBeTruthy();
    expect(registerButton).toBeTruthy();
  });

  it('should display user menu when authenticated', () => {
    // Simuler un utilisateur connecté en utilisant .set() sur les signaux
    currentUserSignal.set({
      id: '1',
      firstName: 'Jean',
      lastName: 'Test',
      email: 'test@example.com'
    });
    isAuthenticatedSignal.set(true);

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges(); // Important pour que le composant réagisse aux changements des signaux
    const compiled = fixture.nativeElement as HTMLElement;

    const dashboardButton = compiled.querySelector('a[routerLink="/dashboard"]');
    const candidaturesButton = compiled.querySelector('a[routerLink="/candidatures"]');

    expect(dashboardButton).toBeTruthy();
    expect(candidaturesButton).toBeTruthy();
  });

  it('should call logout when logout button is clicked', () => {
    // Simuler un utilisateur connecté
    currentUserSignal.set({
      id: '1',
      firstName: 'Jean',
      lastName: 'Test',
      email: 'test@example.com'
    });
    isAuthenticatedSignal.set(true);

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    // Utilise un data-testid pour plus de robustesse si possible
    const logoutButton = fixture.nativeElement.querySelector('button:has(mat-icon:contains("logout"))');
    logoutButton?.click();

    expect(mockAuthService.logout).toHaveBeenCalled();
  });
});
