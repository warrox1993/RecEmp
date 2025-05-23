// src/app/components/manual-reminder-dialog/manual-reminder-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatNativeDateModule } from '@angular/material/core'; // Nécessaire pour MatDatepicker

export interface ManualReminderData {
  title: string;
  description: string;
  reminderDate: Date;
}

@Component({
  selector: 'app-manual-reminder-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatNativeDateModule // Assurez-vous qu'il est importé
  ],
  templateUrl: './manual-reminder-dialog.component.html',
  styleUrls: ['./manual-reminder-dialog.component.scss']
})
export class ManualReminderDialogComponent implements OnInit {
  reminderForm!: FormGroup;
  minDate: Date;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ManualReminderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any // Peut être utilisé pour passer des données initiales si besoin
  ) {
    this.minDate = new Date(); // Empêche de sélectionner une date passée pour le rappel
  }

  ngOnInit(): void {
    this.reminderForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      reminderDate: [null, Validators.required]
    });
  }

  get title() { return this.reminderForm.get('title'); }
  get description() { return this.reminderForm.get('description'); }
  get reminderDate() { return this.reminderForm.get('reminderDate'); }

  onSave(): void {
    if (this.reminderForm.valid) {
      this.dialogRef.close(this.reminderForm.value as ManualReminderData);
    } else {
      this.reminderForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
