// src/app/components/confirm-dialog/confirm-dialog.component.ts
// Composant pour une boîte de dialogue de confirmation générique

import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common'; // Nécessaire pour *ngIf ou d'autres directives structurelles
import { MatDialogModule } from '@angular/material/dialog'; // MAT_DIALOG_DATA et MatDialogRef sont souvent ici

// Interface pour les données passées au dialogue de confirmation
export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  color?: 'primary' | 'accent' | 'warn'; // Option pour la couleur du bouton de confirmation
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule // Assurez-vous que MatDialogModule est importé si vous utilisez des éléments de dialogue Material spécifiques au template
  ],
  template: `
    <h2 mat-dialog-title [style.color]="data.color ? getThemeColor(data.color) : null">{{ data.title }}</h2>
    <div mat-dialog-content>
      <p>{{ data.message }}</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onDismiss()">{{ data.cancelText || 'Annuler' }}</button>
      <button mat-raised-button [color]="data.color || 'primary'" (click)="onConfirm()">{{ data.confirmText || 'Confirmer' }}</button>
    </div>
  `,
  styles: [`
    /* Optionnel: Ajoutez des styles si nécessaire */
    h2 {
      margin-bottom: 20px; /* Espace sous le titre */
    }
    p {
      line-height: 1.6; /* Meilleure lisibilité pour le message */
    }
  `]
})
export class ConfirmDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    // L'utilisateur a cliqué sur "Confirmer"
    this.dialogRef.close(true);
  }

  onDismiss(): void {
    // L'utilisateur a cliqué sur "Annuler" ou a fermé le dialogue
    this.dialogRef.close(false);
  }

  // Fonction pour obtenir la couleur du thème Material (si vous utilisez des variables CSS)
  // Sinon, vous pouvez directement utiliser les valeurs de couleur Material
  getThemeColor(color: 'primary' | 'accent' | 'warn'): string | null {
    switch (color) {
      case 'primary':
        return 'var(--mdc-theme-primary, #3f51b5)'; // Valeur par défaut si la variable CSS n'est pas définie
      case 'accent':
        return 'var(--mdc-theme-secondary, #ff4081)'; // Ou var(--mdc-theme-accent)
      case 'warn':
        return 'var(--mdc-theme-error, #f44336)'; // Ou var(--mdc-theme-warn)
      default:
        return null;
    }
  }
}
