// src/app/components/archive-dialog/archive-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { Candidature } from '../../models/candidature.model';

interface ArchiveDialogData {
  candidature: Candidature;
}

interface ArchiveResult {
  isSuccess: boolean;
  successType?: string;
  failureReason?: string;
  userFeedback?: string;
  satisfaction?: number;
  archiveReason: 'auto' | 'manual';
  recommendActions?: string[];
}

@Component({
  selector: 'app-archive-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatSliderModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="archive-dialog">
      <h2 mat-dialog-title>
        <mat-icon [color]="isSuccess ? 'primary' : 'warn'">
          {{ isSuccess ? 'check_circle' : 'info' }}
        </mat-icon>
        Archiver la candidature - {{ data.candidature.entreprise }}
      </h2>

      <mat-dialog-content class="dialog-content">
        <form [formGroup]="archiveForm" class="archive-form">

          <!-- Résultat de la candidature -->
          <mat-card class="result-section">
            <mat-card-header>
              <mat-card-title>Résultat de la candidature</mat-card-title>
              <mat-card-subtitle>
                Comment cette candidature s'est-elle terminée ?
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <mat-radio-group formControlName="isSuccess" class="result-radio-group">
                <mat-radio-button [value]="true" class="success-option">
                  <div class="radio-content">
                    <mat-icon color="primary">celebration</mat-icon>
                    <div>
                      <strong>Succès</strong>
                      <p>Candidature acceptée ou objectif atteint</p>
                    </div>
                  </div>
                </mat-radio-button>

                <mat-radio-button [value]="false" class="failure-option">
                  <div class="radio-content">
                    <mat-icon color="warn">info</mat-icon>
                    <div>
                      <strong>Non retenue</strong>
                      <p>Candidature refusée ou sans suite</p>
                    </div>
                  </div>
                </mat-radio-button>
              </mat-radio-group>
            </mat-card-content>
          </mat-card>

          <!-- Section Succès -->
          <mat-card *ngIf="isSuccess" class="success-details">
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="primary">star</mat-icon>
                Félicitations ! Détails du succès
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Type de succès</mat-label>
                <mat-select formControlName="successType">
                  <mat-option value="job_accepted">
                    <mat-icon>work</mat-icon>
                    Emploi accepté
                  </mat-option>
                  <mat-option value="internship_completed">
                    <mat-icon>school</mat-icon>
                    Stage obtenu/terminé
                  </mat-option>
                  <mat-option value="better_offer">
                    <mat-icon>trending_up</mat-icon>
                    Meilleure offre reçue
                  </mat-option>
                  <mat-option value="other_success">
                    <mat-icon>check_circle</mat-icon>
                    Autre succès
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <div class="satisfaction-section">
                <label class="satisfaction-label">
                  <mat-icon>sentiment_satisfied</mat-icon>
                  Satisfaction globale: {{ satisfaction }}/5
                </label>
                <mat-slider
                  class="satisfaction-slider"
                  [min]="1"
                  [max]="5"
                  [step]="1"
                  [discrete]="true"
                  [showTickMarks]="true"
                  [(ngModel)]="satisfaction"
                  [ngModelOptions]="{standalone: true}">
                </mat-slider>
                <div class="satisfaction-labels">
                  <span>Décevant</span>
                  <span>Excellent</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Section Échec -->
          <mat-card *ngIf="!isSuccess" class="failure-details">
            <mat-card-header>
              <mat-card-title>
                <mat-icon color="warn">analytics</mat-icon>
                Analyse de l'échec
              </mat-card-title>
              <mat-card-subtitle>
                Comprendre les raisons aide à améliorer les futures candidatures
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Raison principale</mat-label>
                <mat-select formControlName="failureReason">
                  <mat-option value="no_response">
                    <mat-icon>schedule</mat-icon>
                    Aucune réponse reçue
                  </mat-option>
                  <mat-option value="skills_mismatch">
                    <mat-icon>build</mat-icon>
                    Compétences inadéquates
                  </mat-option>
                  <mat-option value="salary_too_low">
                    <mat-icon>attach_money</mat-icon>
                    Salaire proposé insuffisant
                  </mat-option>
                  <mat-option value="company_culture">
                    <mat-icon>groups</mat-icon>
                    Culture d'entreprise non compatible
                  </mat-option>
                  <mat-option value="location">
                    <mat-icon>location_on</mat-icon>
                    Problème de localisation
                  </mat-option>
                  <mat-option value="other_failure">
                    <mat-icon>help_outline</mat-icon>
                    Autre raison
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Recommandations basées sur la raison -->
              <div *ngIf="getRecommendations().length > 0" class="recommendations">
                <h4>
                  <mat-icon color="primary">lightbulb</mat-icon>
                  Recommandations pour améliorer
                </h4>
                <mat-chip-set>
                  <mat-chip
                    *ngFor="let recommendation of getRecommendations()"
                    class="recommendation-chip">
                    {{ recommendation }}
                  </mat-chip>
                </mat-chip-set>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Commentaires libres -->
          <mat-card class="feedback-section">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>comment</mat-icon>
                Retour d'expérience (optionnel)
              </mat-card-title>
              <mat-card-subtitle>
                Vos impressions, enseignements tirés, conseils pour plus tard...
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Commentaires</mat-label>
                <textarea
                  matInput
                  formControlName="userFeedback"
                  rows="4"
                  placeholder="Ex: Processus de recrutement très professionnel, équipe sympathique, mais poste finalement moins technique qu'espéré...">
                </textarea>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <!-- Statistiques de durée -->
          <div class="duration-stats">
            <mat-icon color="primary">schedule</mat-icon>
            <span>Durée du processus: {{ calculateDuration() }} jours</span>
          </div>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button (click)="onCancel()" type="button">
          <mat-icon>close</mat-icon>
          Annuler
        </button>

        <button
          mat-raised-button
          color="primary"
          (click)="onArchive()"
          [disabled]="archiveForm.invalid"
          type="button">
          <mat-icon>archive</mat-icon>
          Archiver la candidature
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .archive-dialog {
      min-width: 600px;
      max-width: 800px;
    }

    .dialog-content {
      padding: 0 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .archive-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .result-section {
      border-left: 4px solid var(--mdc-theme-primary, #3f51b5);
    }

    .result-radio-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }

    .radio-content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      transition: all 0.3s ease;
    }

    .success-option .radio-content {
      background-color: rgba(76, 175, 80, 0.05);
    }

    .failure-option .radio-content {
      background-color: rgba(255, 152, 0, 0.05);
    }

    .radio-content:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .radio-content div {
      flex: 1;
    }

    .radio-content strong {
      font-weight: 600;
      font-size: 1.1em;
    }

    .radio-content p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 0.9em;
    }

    .success-details {
      border-left: 4px solid #4caf50;
      background: linear-gradient(90deg, rgba(76, 175, 80, 0.02) 0%, transparent 100%);
    }

    .failure-details {
      border-left: 4px solid #ff9800;
      background: linear-gradient(90deg, rgba(255, 152, 0, 0.02) 0%, transparent 100%);
    }

    .satisfaction-section {
      margin-top: 20px;
    }

    .satisfaction-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .satisfaction-slider {
      width: 100%;
      margin: 20px 0;
    }

    .satisfaction-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.8em;
      color: #666;
      margin-top: 8px;
    }

    .recommendations {
      margin-top: 20px;
      padding: 16px;
      background-color: rgba(33, 150, 243, 0.05);
      border-radius: 8px;
      border-left: 4px solid #2196f3;
    }

    .recommendations h4 {
      margin: 0 0 12px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1em;
      font-weight: 600;
    }

    .recommendation-chip {
      background-color: rgba(33, 150, 243, 0.1) !important;
      color: #1976d2 !important;
      margin: 4px !important;
    }

    .feedback-section {
      border-left: 4px solid #9c27b0;
    }

    .duration-stats {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
      font-weight: 500;
      color: #555;
    }

    .full-width {
      width: 100%;
    }

    .dialog-actions {
      padding: 16px 24px !important;
    }

    .mat-mdc-card-header .mat-mdc-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mat-mdc-option .mat-icon {
      margin-right: 8px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    @media (max-width: 768px) {
      .archive-dialog {
        min-width: auto;
        width: 95vw;
      }

      .dialog-content {
        padding: 0 16px;
        max-height: 60vh;
      }

      .radio-content {
        padding: 8px;
      }

      .satisfaction-slider {
        margin: 12px 0;
      }
    }
  `]
})
export class ArchiveDialogComponent implements OnInit {
  archiveForm: FormGroup;
  satisfaction = 3;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ArchiveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ArchiveDialogData
  ) {
    this.archiveForm = this.fb.group({
      isSuccess: [data.candidature.reponse === 'Accepté', Validators.required],
      successType: [''],
      failureReason: [''],
      userFeedback: ['']
    });
  }

  ngOnInit(): void {
    // Écouter les changements du type de résultat
    this.archiveForm.get('isSuccess')?.valueChanges.subscribe(isSuccess => {
      if (isSuccess) {
        this.archiveForm.get('successType')?.setValidators([Validators.required]);
        this.archiveForm.get('failureReason')?.clearValidators();
        this.archiveForm.get('failureReason')?.setValue('');
      } else {
        this.archiveForm.get('failureReason')?.setValidators([Validators.required]);
        this.archiveForm.get('successType')?.clearValidators();
        this.archiveForm.get('successType')?.setValue('');
      }

      this.archiveForm.get('successType')?.updateValueAndValidity();
      this.archiveForm.get('failureReason')?.updateValueAndValidity();
    });

    // Initialiser les validateurs selon le statut actuel
    const isSuccess = this.data.candidature.reponse === 'Accepté';
    if (isSuccess) {
      this.archiveForm.get('successType')?.setValidators([Validators.required]);
      this.archiveForm.get('successType')?.setValue('job_accepted');
    } else {
      this.archiveForm.get('failureReason')?.setValidators([Validators.required]);
      this.archiveForm.get('failureReason')?.setValue('no_response');
    }

    this.archiveForm.updateValueAndValidity();
  }

  get isSuccess(): boolean {
    return this.archiveForm.get('isSuccess')?.value === true;
  }

  calculateDuration(): number {
    const candidatureDate = this.parseDateFr(this.data.candidature.date);
    if (!candidatureDate) return 0;

    const today = new Date();
    const diffTime = Math.abs(today.getTime() - candidatureDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getRecommendations(): string[] {
    const failureReason = this.archiveForm.get('failureReason')?.value;

    const recommendationsMap: { [key: string]: string[] } = {
      'no_response': [
        'Améliorer le sujet de vos emails',
        'Personnaliser davantage vos candidatures',
        'Relancer après 1-2 semaines',
        'Rechercher des contacts directs sur LinkedIn'
      ],
      'skills_mismatch': [
        'Analyser précisément les compétences demandées',
        'Former aux compétences manquantes',
        'Cibler des postes plus adaptés à votre profil',
        'Valoriser vos compétences transférables'
      ],
      'salary_too_low': [
        'Rechercher le salaire moyen du marché',
        'Négocier les avantages en nature',
        'Cibler des entreprises avec des budgets plus élevés',
        'Valoriser votre expérience et résultats'
      ],
      'company_culture': [
        'Mieux rechercher l\'entreprise avant candidature',
        'Poser des questions sur la culture en entretien',
        'Utiliser Glassdoor pour des avis employés',
        'Définir vos critères de culture d\'entreprise'
      ],
      'location': [
        'Considérer le télétravail partiel/total',
        'Évaluer les coûts de transport',
        'Rechercher dans votre zone géographique',
        'Négocier un package de mobilité'
      ],
      'other_failure': [
        'Demander un feedback détaillé',
        'Analyser votre approche générale',
        'Adapter votre stratégie de candidature'
      ]
    };

    return recommendationsMap[failureReason] || [];
  }

  private parseDateFr(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onArchive(): void {
    if (this.archiveForm.valid) {
      const formValue = this.archiveForm.value;

      const result: ArchiveResult = {
        isSuccess: formValue.isSuccess,
        successType: formValue.isSuccess ? formValue.successType : undefined,
        failureReason: !formValue.isSuccess ? formValue.failureReason : undefined,
        userFeedback: formValue.userFeedback || undefined,
        satisfaction: formValue.isSuccess ? this.satisfaction : undefined,
        archiveReason: 'manual',
        recommendActions: !formValue.isSuccess ? this.getRecommendations() : undefined
      };

      this.dialogRef.close(result);
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.archiveForm.markAllAsTouched();
    }
  }
}
