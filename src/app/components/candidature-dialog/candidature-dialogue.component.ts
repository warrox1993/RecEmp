// src/app/components/candidature-dialog/candidature-dialogue.component.ts
// Composant pour la boîte de dialogue d'ajout/modification d'une candidature

import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Candidature } from '../../models/candidature.model';

@Component({
  selector: 'app-candidature-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatButtonModule, MatNativeDateModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' }
  ],
  // MODIFIÉ ICI : Utilisation de fichiers externes pour le template et les styles
  templateUrl: './candidature-dialogue.component.html',
  styleUrls: ['./candidature-dialogue.component.scss']
})
export class CandidatureDialogComponent implements OnInit, OnDestroy {
  candidatureForm: FormGroup;
  private subscriptions = new Subscription();
  public minDateForRappel: Date | null = null;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CandidatureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { candidature: Candidature | null }
  ) {
    const candidature = data.candidature;
    this.candidatureForm = this.fb.group({
      id: [candidature?.id || null],
      date: [candidature ? this.parseDateFr(candidature.date) : new Date(), Validators.required],
      type: [candidature?.type || 'Job', Validators.required],
      ranking: [candidature?.ranking || 1, Validators.required],
      entreprise: [candidature?.entreprise || '', Validators.required],
      poste: [candidature?.poste || '', Validators.required],
      ville: [candidature?.ville || '', Validators.required],
      region: [candidature?.region || '', Validators.required],
      contact: [candidature?.contact || ''],
      reponse: [candidature?.reponse || 'En attente', Validators.required],
      source: [candidature?.source || '', Validators.required],
      commentaires: [candidature?.commentaires || ''],
      delaiRappel: [candidature?.delaiRappel || '1 semaine'],
      dateRappel: [candidature ? this.parseDateFr(candidature.dateRappel) : null]
    });

    const initialDateCandidature = this.candidatureForm.get('date')?.value;
    if (initialDateCandidature instanceof Date) {
      this.minDateForRappel = new Date(initialDateCandidature);
    }
  }

  ngOnInit(): void {
    this.setupReminderLogic();
    this.setupMinDateForRappelLogic();

    const dateCandidatureCtrl = this.candidatureForm.get('date');
    const delaiRappelCtrl = this.candidatureForm.get('delaiRappel');
    const dateRappelCtrl = this.candidatureForm.get('dateRappel');

    if (!this.data.candidature && dateCandidatureCtrl && delaiRappelCtrl && dateRappelCtrl) {
        const initialDelai = delaiRappelCtrl.value;
        if (initialDelai !== 'Personnalisé' && initialDelai !== 'Aucun' && dateCandidatureCtrl.value) {
            const initialDateRappel = this.calculateDateRappel(dateCandidatureCtrl.value, initialDelai);
            dateRappelCtrl.setValue(initialDateRappel, { emitEvent: false });
        }
    }
    if (delaiRappelCtrl) {
        this.updateDateRappelValidation(delaiRappelCtrl.value);
    }
  }

  private setupMinDateForRappelLogic(): void {
    const dateCandidatureCtrl = this.candidatureForm.get('date');
    if (dateCandidatureCtrl) {
      this.subscriptions.add(
        dateCandidatureCtrl.valueChanges.subscribe(newAppDate => {
          if (newAppDate instanceof Date) {
            this.minDateForRappel = new Date(newAppDate);
            const dateRappelCtrl = this.candidatureForm.get('dateRappel');
            const delaiRappelCtrl = this.candidatureForm.get('delaiRappel');
            if (dateRappelCtrl && dateRappelCtrl.value && dateRappelCtrl.value < this.minDateForRappel && delaiRappelCtrl?.value !== 'Aucun') {
              if (delaiRappelCtrl?.value === 'Personnalisé') {
                dateRappelCtrl.setValue(null);
              } else if (delaiRappelCtrl?.value) {
                const newCalculatedDateRappel = this.calculateDateRappel(newAppDate, delaiRappelCtrl.value);
                dateRappelCtrl.setValue(newCalculatedDateRappel, { emitEvent: false });
              }
            }
          } else {
            this.minDateForRappel = null;
          }
        })
      );
    }
  }

  private setupReminderLogic(): void {
    const dateCandidatureCtrl = this.candidatureForm.get('date');
    const delaiRappelCtrl = this.candidatureForm.get('delaiRappel');
    const dateRappelCtrl = this.candidatureForm.get('dateRappel');

    if (!dateCandidatureCtrl || !delaiRappelCtrl || !dateRappelCtrl) return;

    this.subscriptions.add(
      dateCandidatureCtrl.valueChanges.subscribe(dateCandidatureValue => {
        const delaiRappelValue = delaiRappelCtrl.value;
        if (dateCandidatureValue instanceof Date && delaiRappelValue !== 'Personnalisé' && delaiRappelValue !== 'Aucun') {
          const newDateRappel = this.calculateDateRappel(dateCandidatureValue, delaiRappelValue);
          dateRappelCtrl.setValue(newDateRappel, { emitEvent: false });
        }
      })
    );

    this.subscriptions.add(
      delaiRappelCtrl.valueChanges.subscribe(delai => {
        const dateCandidatureValue = dateCandidatureCtrl.value;
        this.updateDateRappelValidation(delai);

        if (delai === 'Aucun') {
          dateRappelCtrl.setValue(null, { emitEvent: false });
        } else if (delai === 'Personnalisé') {
          if (this.minDateForRappel && dateRappelCtrl.value && dateRappelCtrl.value < this.minDateForRappel) {
            dateRappelCtrl.setValue(null, { emitEvent: false });
          }
        } else {
          if (dateCandidatureValue instanceof Date) {
            const newDateRappel = this.calculateDateRappel(dateCandidatureValue, delai);
            dateRappelCtrl.setValue(newDateRappel, { emitEvent: false });
          } else {
            dateRappelCtrl.setValue(null, { emitEvent: false });
          }
        }
      })
    );
  }

  private updateDateRappelValidation(delai: Candidature['delaiRappel']): void {
    const dateRappelCtrl = this.candidatureForm.get('dateRappel');
    if (!dateRappelCtrl) return;

    if (delai === 'Personnalisé') {
      dateRappelCtrl.setValidators(Validators.required);
    } else {
      dateRappelCtrl.clearValidators();
    }
    dateRappelCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private calculateDateRappel(baseDate: Date, delai: Candidature['delaiRappel']): Date | null {
    if (!delai || delai === 'Aucun' || delai === 'Personnalisé' || !baseDate) return null;

    const rappelDate = new Date(baseDate);
    switch (delai) {
        case '1 semaine':
            rappelDate.setDate(rappelDate.getDate() + 7);
            break;
        case '2 semaines':
            rappelDate.setDate(rappelDate.getDate() + 14);
            break;
        case '1 mois':
            rappelDate.setMonth(rappelDate.getMonth() + 1);
            break;
        default:
            return null;
    }
    return rappelDate;
  }

  private parseDateFr(dateStr: string | undefined | null): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  }

  private formatDateToFr(date: Date | undefined | null): string | undefined {
    if (!date) return undefined;
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.candidatureForm.valid) {
      const formValue = this.candidatureForm.getRawValue();
      let dateRappelFormatted = this.formatDateToFr(formValue.dateRappel);
      if (formValue.delaiRappel === 'Aucun') {
          dateRappelFormatted = undefined;
      }
      const candidature: Candidature = {
        ...formValue,
        date: this.formatDateToFr(formValue.date) as string,
        dateRappel: dateRappelFormatted,
      };
      this.dialogRef.close(candidature);
    } else {
      this.candidatureForm.markAllAsTouched();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
