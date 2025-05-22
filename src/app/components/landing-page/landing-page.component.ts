// src/app/components/landing-page/landing-page.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Pour la navigation
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'; // Importer MatIconModule pour les icônes SVG

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule // Ajouter MatIconModule ici
  ],
  template: `
    <div class="landing-container">
      <mat-card class="landing-card">
        <mat-card-header>
          <mat-card-title class="landing-title">Bienvenue sur {{ appName }} !</mat-card-title>
          <mat-card-subtitle class="landing-subtitle">Votre outil de suivi de candidatures nouvelle génération.</mat-card-subtitle>
        </mat-card-header>
        <img mat-card-image src="https://placehold.co/600x300/3f51b5/ffffff?text=Suivi+Candidatures" alt="Image d'accueil pour le suivi de candidatures" class="landing-image">
        <mat-card-content class="landing-content">
          <p>
            Organisez vos recherches d'emploi, suivez l'avancement de vos candidatures,
            ne manquez plus aucun rappel et analysez vos performances pour décrocher le job de vos rêves !
          </p>
        </mat-card-content>
        <mat-card-actions class="landing-actions">
          <button mat-raised-button color="primary" (click)="navigateToLogin()">Connexion</button>
          <button mat-stroked-button color="primary" (click)="navigateToRegister()">Inscription</button>
        </mat-card-actions>

        <mat-card-footer class="landing-footer">
          <h3 class="share-title">Partagez {{ appName }} !</h3>
          <div class="social-share-buttons">
            <a [href]="getShareLink('facebook')" target="_blank" rel="noopener noreferrer" aria-label="Partager sur Facebook" mat-icon-button class="social-icon-button facebook">
              <svg viewBox="0 0 24 24"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 12 2.04Z"/></svg>
            </a>
            <a [href]="getShareLink('twitter')" target="_blank" rel="noopener noreferrer" aria-label="Partager sur X (Twitter)" mat-icon-button class="social-icon-button twitter">
              <svg viewBox="0 0 24 24"><path d="M22.46,6C21.69,6.35 20.86,6.58 20,6.69C20.88,6.16 21.56,5.32 21.88,4.31C21.05,4.81 20.13,5.16 19.16,5.36C18.37,4.5 17.26,4 16,4C13.65,4 11.73,5.92 11.73,8.29C11.73,8.63 11.77,8.96 11.84,9.27C8.28,9.09 5.11,7.38 3,4.79C2.63,5.42 2.42,6.16 2.42,6.94C2.42,8.43 3.17,9.75 4.33,10.5C3.62,10.48 2.96,10.3 2.38,10C2.38,10 2.38,10 2.38,10.03C2.38,12.11 3.86,13.85 5.82,14.24C5.46,14.34 5.08,14.39 4.69,14.39C4.42,14.39 4.15,14.36 3.89,14.31C4.43,16 6,17.26 7.89,17.29C6.43,18.45 4.58,19.13 2.56,19.13C2.22,19.13 1.88,19.11 1.54,19.07C3.44,20.29 5.7,21 8.12,21C16,21 20.33,14.46 20.33,8.79C20.33,8.6 20.33,8.42 20.32,8.23C21.16,7.63 21.88,6.87 22.46,6Z"/></svg>
            </a>
            <a [href]="getShareLink('linkedin')" target="_blank" rel="noopener noreferrer" aria-label="Partager sur LinkedIn" mat-icon-button class="social-icon-button linkedin">
              <svg viewBox="0 0 24 24"><path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19M18.5 18.5V13.2A3.26 3.26 0 0 0 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17A1.4 1.4 0 0 1 15.71 13.57V18.5H18.5M6.88 8.56A1.68 1.68 0 0 0 8.56 6.88C8.56 5.95 7.81 5.19 6.88 5.19A1.69 1.69 0 0 0 5.19 6.88C5.19 7.81 5.95 8.56 6.88 8.56M8.27 18.5V10.13H5.5V18.5H8.27Z"/></svg>
            </a>
             <a [href]="getShareLink('email')" target="_blank" rel="noopener noreferrer" aria-label="Partager par Email" mat-icon-button class="social-icon-button email">
              <mat-icon>email</mat-icon>
            </a>
          </div>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .landing-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 128px); // Hauteur de la vue moins header et footer approx.
      padding: 20px;
      background: #f4f6f8; // Un fond léger
    }
    .landing-card {
      max-width: 600px;
      width: 100%;
      text-align: center;
    }
    .landing-title {
      font-size: 2em;
      margin-bottom: 8px;
    }
    .landing-subtitle {
      font-size: 1.1em;
      color: #555;
      margin-bottom: 20px;
    }
    .landing-image {
      margin-bottom: 20px;
      border-radius: 4px; // Coins arrondis pour l'image
      object-fit: cover; // S'assurer que l'image de placeholder couvre bien
      max-height: 300px; // Limiter la hauteur de l'image
    }
    .landing-content p {
      font-size: 1em;
      line-height: 1.6;
      margin-bottom: 24px;
      color: #333;
    }
    .landing-actions {
      display: flex;
      justify-content: center;
      gap: 16px; /* Espace entre les boutons */
      padding: 16px 0; /* Espace vertical pour les actions */
    }
    .landing-actions button {
      padding: 10px 20px;
      font-size: 1em;
    }

    .landing-footer {
      border-top: 1px solid #eee;
      padding-top: 20px;
      margin-top: 20px;
    }

    .share-title {
      font-size: 1.1em;
      color: #444;
      margin-bottom: 12px;
    }

    .social-share-buttons {
      display: flex;
      justify-content: center;
      gap: 10px;
    }

    .social-icon-button svg {
      width: 24px;
      height: 24px;
      fill: #757575; /* Couleur par défaut pour les icônes SVG */
    }
    .social-icon-button.email mat-icon { /* Spécifique pour mat-icon */
        color: #757575;
    }


    .social-icon-button:hover svg,
    .social-icon-button.email:hover mat-icon {
      fill: var(--mdc-theme-primary, #3f51b5); /* Couleur au survol */
      color: var(--mdc-theme-primary, #3f51b5); /* Pour mat-icon */
    }

    /* Responsive adjustments */
    @media (max-width: 600px) {
      .landing-title {
        font-size: 1.5em;
      }
      .landing-subtitle {
        font-size: 1em;
      }
      .landing-actions {
        flex-direction: column;
      }
      .landing-actions button {
        width: 100%;
      }
      .social-share-buttons {
        gap: 8px;
      }
      .social-icon-button svg {
        width: 20px;
        height: 20px;
      }
    }
  `]
})
export class LandingPageComponent {
  appName = 'ProTrack CV';
  appUrl = encodeURIComponent(window.location.origin); // URL de base de l'application
  shareText = encodeURIComponent(`Découvrez ${this.appName}, un outil génial pour suivre ses candidatures !`);

  constructor(private router: Router) {}

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  getShareLink(platform: 'facebook' | 'twitter' | 'linkedin' | 'email'): string {
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${this.appUrl}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${this.appUrl}&text=${this.shareText}`;
      case 'linkedin':
        return `https://www.linkedin.com/shareArticle?mini=true&url=${this.appUrl}&title=${encodeURIComponent(this.appName)}&summary=${this.shareText}`;
      case 'email':
        return `mailto:?subject=${encodeURIComponent(`Découvrez ${this.appName}`)}&body=${this.shareText}%0A${this.appUrl}`;
      default:
        return '#';
    }
  }
}
