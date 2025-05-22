// src/app/components/date-picker-dialog/date-picker-dialog.component.ts
// Composant pour la boîte de dialogue de sélection de date

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-date-picker-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDatepickerModule,
    MatButtonModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' } // Locale pour le calendrier
  ],
  template: `
    <h2 mat-dialog-title>Choisir une nouvelle date</h2>
    <div mat-dialog-content>
      <mat-calendar [(selected)]="selectedDate"></mat-calendar>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="primary" (click)="onSave()">Sélectionner</button>
    </div>
  `
})
export class DatePickerDialogComponent {
  selectedDate: Date;

  constructor(
    public dialogRef: MatDialogRef<DatePickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { date: Date }
  ) {
    this.selectedDate = data.date ? new Date(data.date) : new Date(); // Initialiser avec la date fournie ou la date actuelle
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.selectedDate);
  }
}
