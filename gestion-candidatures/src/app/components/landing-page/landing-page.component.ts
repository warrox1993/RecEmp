// src/app/components/landing-page/landing-page.component.ts - VERSION AVEC IDENTIFIANTS
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="landing-container">
      <mat-card class="landing-card">
        <mat-card-header>
          <mat-card-title class="landing-title">🚀 {{ appName }} - Application Ready!</mat-card-title>
          <mat-card-subtitle class="landing-subtitle">Votre application de suivi de candidatures</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content class="landing-content">
          <p><strong>✅ L'application fonctionne parfaitement !</strong></p>

          <div class="credentials-section">
            <h3>🔐 Identifiants de connexion :</h3>
            <div class="credential-item">
              <strong>👑 Admin :</strong><br>
              Email: <code>admin&#64;protrack.com</code><br>
              Mot de passe: <code>admin123</code>
            </div>
            <div class="credential-item">
              <strong>👤 Utilisateur :</strong><br>
              Email: <code>user&#64;protrack.com</code><br>
              Mot de passe: <code>user123</code>
            </div>
            <div class="credential-item">
              <strong>🧪 Test :</strong><br>
              Email: <code>test&#64;example.com</code><br>
              Mot de passe: <code>password</code>
            </div>
          </div>

          <p><strong>Status :</strong> {{ navigationStatus }}</p>
        </mat-card-content>
        <mat-card-actions class="landing-actions">
          <button mat-raised-button color="primary" (click)="navigateToLogin()">
            <mat-icon>login</mat-icon>
            Connexion
          </button>
          <button mat-stroked-button color="primary" (click)="navigateToRegister()">
            <mat-icon>person_add</mat-icon>
            Inscription
          </button>
        </mat-card-actions>
        <mat-card-content>
          <div class="quick-links">
            <h3>🔗 Liens directs :</h3>
            <p><a href="/login" target="_blank">→ Page de connexion</a></p>
            <p><a href="/register" target="_blank">→ Page d'inscription</a></p>
            <p><a href="/dashboard" target="_blank">→ Dashboard (nécessite connexion)</a></p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .landing-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 128px);
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .landing-card {
      max-width: 600px;
      width: 100%;
      text-align: center;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    .landing-title {
      font-size: 2em;
      margin-bottom: 8px;
      color: #3f51b5;
    }
    .landing-subtitle {
      font-size: 1.1em;
      color: #555;
      margin-bottom: 20px;
    }
    .landing-content p {
      font-size: 1em;
      line-height: 1.6;
      margin-bottom: 16px;
      color: #333;
    }
    .credentials-section {
      background-color: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
      text-align: left;
    }
    .credentials-section h3 {
      margin-top: 0;
      color: #3f51b5;
      text-align: center;
    }
    .credential-item {
      background-color: white;
      padding: 12px;
      margin: 8px 0;
      border-radius: 6px;
      border-left: 4px solid #3f51b5;
    }
    .credential-item code {
      background-color: #e3f2fd;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      color: #1565c0;
    }
    .landing-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      padding: 16px 0;
    }
    .landing-actions button {
      padding: 12px 24px;
      font-size: 1em;
    }
    .landing-actions mat-icon {
      margin-right: 8px;
    }
    .quick-links {
      background-color: #f0f0f0;
      padding: 16px;
      border-radius: 8px;
      text-align: left;
    }
    .quick-links h3 {
      margin-top: 0;
      color: #333;
      text-align: center;
    }
    .quick-links a {
      color: #3f51b5;
      text-decoration: none;
      font-weight: 500;
    }
    .quick-links a:hover {
      text-decoration: underline;
    }
  `]
})
export class LandingPageComponent {
  appName = 'ProTrack CV';
  navigationStatus = 'Prêt pour la navigation !';

  constructor(private router: Router) {}

  navigateToLogin(): void {
    try {
      console.log('🔧 Navigation vers /login...');
      this.navigationStatus = 'Navigation vers la connexion...';
      this.router.navigate(['/login']);
      console.log('✅ Navigation vers /login réussie');
    } catch (error) {
      console.error('❌ Erreur navigation /login:', error);
      this.navigationStatus = '❌ Erreur navigation';
    }
  }

  navigateToRegister(): void {
    try {
      console.log('🔧 Navigation vers /register...');
      this.navigationStatus = 'Navigation vers l\'inscription...';
      this.router.navigate(['/register']);
      console.log('✅ Navigation vers /register réussie');
    } catch (error) {
      console.error('❌ Erreur navigation /register:', error);
      this.navigationStatus = '❌ Erreur navigation';
    }
  }
}
