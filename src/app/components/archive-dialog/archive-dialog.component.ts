// src/app/components/archive-dialog/archive-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { Candidature } from '../../models/candidature.model';

export interface ArchiveDialogData {
  candidatures: Candidature[];
  action: 'archive' | 'delete' | 'export';
}

export interface ArchiveDialogResult {
  action: 'archive' | 'delete' | 'export';
  filters: {
    olderThanDays?: number;
    status?: string[];
    type?: string[];
    includeComments?: boolean;
  };
  confirmed: boolean;
}

@Component({
  selector: 'app-archive-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule, // Nécessaire pour ngModel
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSliderModule, // Nécessaire pour mat-slider
    MatSelectModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>{{ getDialogTitle() }}</h2>

    <mat-dialog-content class="dialog-content">
      <form [formGroup]="archiveForm">
        <!-- Sélection de l'âge des candidatures -->
        <div class="filter-section" *ngIf="data.action === 'archive' || data.action === 'delete'">
          <h4>Critères de sélection</h4>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Candidatures plus anciennes que (jours)</mat-label>
            <input matInput
                   type="number"
                   formControlName="olderThanDays"
                   min="0"
                   max="365"
                   placeholder="30">
            <mat-hint>Candidatures créées il y a plus de X jours</mat-hint>
          </mat-form-field>

          <!-- Alternative avec slider si vous préférez -->
          <div class="slider-section">
            <label class="slider-label">Nombre de jours : {{ sliderValue }}</label>
            <mat-slider
              class="full-width-slider"
              [min]="0"
              [max]="365"
              [step]="1"
              [(ngModel)]="sliderValue"
              [ngModelOptions]="{standalone: true}">
            </mat-slider>
          </div>
        </div>

        <!-- Filtres par statut -->
        <div class="filter-section">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Statuts à inclure</mat-label>
            <mat-select formControlName="statusFilter" multiple>
              <mat-option value="Brouillon">Brouillon</mat-option>
              <mat-option value="Envoyée">Envoyée</mat-option>
              <mat-option value="En attente">En attente</mat-option>
              <mat-option value="En discussion">En discussion</mat-option>
              <mat-option value="Refus">Refus</mat-option>
              <mat-option value="Accepté">Accepté</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Filtres par type -->
        <div class="filter-section">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Types à inclure</mat-label>
            <mat-select formControlName="typeFilter" multiple>
              <mat-option value="Job">Job</mat-option>
              <mat-option value="Stage">Stage</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Options d'export -->
        <div class="filter-section" *ngIf="data.action === 'export'">
          <mat-checkbox formControlName="includeComments">
            Inclure les commentaires dans l'export
          </mat-checkbox>
        </div>

        <!-- Aperçu des candidatures sélectionnées -->
        <div class="preview-section">
          <h4>Aperçu</h4>
          <p class="preview-text">
            {{ getPreviewText() }}
          </p>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button
              [color]="getButtonColor()"
              (click)="onConfirm()"
              [disabled]="!canConfirm()">
        {{ getConfirmButtonText() }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 400px;
      max-width: 500px;
    }

    .filter-section {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e0e0e0;

      &:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      h4 {
        margin: 0 0 12px 0;
        color: var(--mdc-theme-primary, #3f51b5);
        font-size: 1.1em;
        font-weight: 500;
      }
    }

    .full-width {
      width: 100%;
    }

    .slider-section {
      margin-top: 16px;
    }

    .slider-label {
      display: block;
      margin-bottom: 8px;
      font-size: 0.9em;
      color: #666;
      font-weight: 500;
    }

    .full-width-slider {
      width: 100%;
    }

    .preview-section {
      background-color: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      margin-top: 16px;

      h4 {
        margin: 0 0 8px 0;
        font-size: 1em;
        color: #333;
      }

      .preview-text {
        margin: 0;
        font-size: 0.9em;
        color: #555;
        font-style: italic;
      }
    }

    .dialog-actions {
      padding: 16px 24px;
      gap: 8px;
    }

    // Styles pour les hints et erreurs
    .mat-mdc-form-field-hint,
    .mat-mdc-form-field-error {
      font-size: 0.8em;
    }

    // Responsive
    @media (max-width: 600px) {
      .dialog-content {
        min-width: 300px;
        max-width: calc(100vw - 64px);
      }
    }
  `]
})
export class ArchiveDialogComponent implements OnInit {
  archiveForm!: FormGroup;
  private _sliderValue: number = 30;

  get sliderValue(): number {
    return this._sliderValue;
  }

  set sliderValue(value: number) {
    this._sliderValue = value;
    // Mettre à jour le formulaire quand le slider change
    if (this.archiveForm) {
      this.archiveForm.patchValue({ olderThanDays: value }, { emitEvent: false });
    }
  }

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ArchiveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ArchiveDialogData
  ) {}

  ngOnInit(): void {
    this.archiveForm = this.fb.group({
      olderThanDays: [30, [Validators.min(0), Validators.max(365)]],
      statusFilter: [[]],
      typeFilter: [[]],
      includeComments: [true]
    });

    // Synchroniser le slider avec le champ de saisie
    this.archiveForm.get('olderThanDays')?.valueChanges.subscribe(value => {
      if (value !== null && value !== undefined && value !== this._sliderValue) {
        this._sliderValue = Math.max(0, Math.min(365, value));
      }
    });
  }

  getDialogTitle(): string {
    switch (this.data.action) {
      case 'archive':
        return 'Archiver les candidatures';
      case 'delete':
        return 'Supprimer les candidatures';
      case 'export':
        return 'Exporter les candidatures';
      default:
        return 'Action sur les candidatures';
    }
  }

  getConfirmButtonText(): string {
    switch (this.data.action) {
      case 'archive':
        return 'Archiver';
      case 'delete':
        return 'Supprimer';
      case 'export':
        return 'Exporter';
      default:
        return 'Confirmer';
    }
  }

  getButtonColor(): string {
    switch (this.data.action) {
      case 'delete':
        return 'warn';
      case 'archive':
      case 'export':
        return 'primary';
      default:
        return 'primary';
    }
  }

  getPreviewText(): string {
    const formValue = this.archiveForm.value;
    let filteredCandidatures = this.data.candidatures;

    // Filtrer par âge
    if (formValue.olderThanDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - formValue.olderThanDays);

      filteredCandidatures = filteredCandidatures.filter(c => {
        const candidatureDate = this.parseDateFr(c.date);
        return candidatureDate && candidatureDate < cutoffDate;
      });
    }

    // Filtrer par statut
    if (formValue.statusFilter && formValue.statusFilter.length > 0) {
      filteredCandidatures = filteredCandidatures.filter(c =>
        formValue.statusFilter.includes(c.reponse)
      );
    }

    // Filtrer par type
    if (formValue.typeFilter && formValue.typeFilter.length > 0) {
      filteredCandidatures = filteredCandidatures.filter(c =>
        formValue.typeFilter.includes(c.type)
      );
    }

    const count = filteredCandidatures.length;
    const action = this.data.action === 'archive' ? 'archivées' :
                   this.data.action === 'delete' ? 'supprimées' : 'exportées';

    return `${count} candidature(s) seront ${action} selon les critères sélectionnés.`;
  }

  canConfirm(): boolean {
    return this.archiveForm.valid;
  }

  onConfirm(): void {
    if (this.archiveForm.valid) {
      const result: ArchiveDialogResult = {
        action: this.data.action,
        filters: {
          olderThanDays: this.archiveForm.value.olderThanDays,
          status: this.archiveForm.value.statusFilter,
          type: this.archiveForm.value.typeFilter,
          includeComments: this.archiveForm.value.includeComments
        },
        confirmed: true
      };

      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close({
      action: this.data.action,
      filters: {},
      confirmed: false
    });
  }

  private parseDateFr(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  }
}
