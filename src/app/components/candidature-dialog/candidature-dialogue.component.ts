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
  template: `
    <h2 mat-dialog-title>{{ data.candidature ? 'Modifier la candidature' : 'Ajouter une candidature' }}</h2>
    <div mat-dialog-content>
      <form [formGroup]="candidatureForm" class="candidature-form">
        <mat-form-field appearance="outline">
          <mat-label>Date de candidature</mat-label>
          <input matInput [matDatepicker]="pickerDateCandidature" formControlName="date">
          <mat-datepicker-toggle matIconSuffix [for]="pickerDateCandidature"></mat-datepicker-toggle>
          <mat-datepicker #pickerDateCandidature></mat-datepicker>
          <mat-error *ngIf="candidatureForm.get('date')?.hasError('required')">La date est requise.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="Job">Job</mat-option>
            <mat-option value="Stage">Stage</mat-option>
          </mat-select>
          <mat-error *ngIf="candidatureForm.get('type')?.hasError('required')">Le type est requis.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Classement</mat-label>
          <mat-select formControlName="ranking">
            <mat-option [value]="1">1 (Haute priorité)</mat-option>
            <mat-option [value]="2">2 (Moyenne priorité)</mat-option>
            <mat-option [value]="3">3 (Basse priorité)</mat-option>
          </mat-select>
          <mat-error *ngIf="candidatureForm.get('ranking')?.hasError('required')">Le classement est requis.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Entreprise</mat-label>
          <input matInput formControlName="entreprise" placeholder="Nom de l'entreprise">
          <mat-error *ngIf="candidatureForm.get('entreprise')?.hasError('required')">Le nom de l'entreprise est requis.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Poste</mat-label>
          <input matInput formControlName="poste" placeholder="Intitulé du poste">
          <mat-error *ngIf="candidatureForm.get('poste')?.hasError('required')">L'intitulé du poste est requis.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Ville</mat-label>
          <input matInput formControlName="ville" placeholder="Ville du poste">
          <mat-error *ngIf="candidatureForm.get('ville')?.hasError('required')">La ville est requise.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Région</mat-label>
          <input matInput formControlName="region" placeholder="Ex: Wallonie, Flandre, Île-de-France">
           <mat-error *ngIf="candidatureForm.get('region')?.hasError('required')">La région est requise.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Contact</mat-label>
          <input matInput formControlName="contact" placeholder="Email, nom, téléphone...">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Réponse</mat-label>
          <mat-select formControlName="reponse">
            <mat-option value="En attente">En attente</mat-option>
            <mat-option value="En discussion">En discussion</mat-option>
            <mat-option value="Refus">Refus</mat-option>
            <mat-option value="Accepté">Accepté</mat-option>
          </mat-select>
          <mat-error *ngIf="candidatureForm.get('reponse')?.hasError('required')">La réponse est requise.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Source</mat-label>
          <mat-select formControlName="source">
            <mat-option value="LinkedIn">LinkedIn</mat-option>
            <mat-option value="Internet">Site web de l'entreprise</mat-option>
            <mat-option value="Indeed">Indeed</mat-option>
            <mat-option value="Welcome!ToTheJungle">Welcome to the Jungle</mat-option>
            <mat-option value="Relation">Relation / Réseau</mat-option>
            <mat-option value="Autre">Autre</mat-option>
          </mat-select>
          <mat-error *ngIf="candidatureForm.get('source')?.hasError('required')">La source est requise.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Délai de rappel</mat-label>
          <mat-select formControlName="delaiRappel">
            <mat-option value="Aucun">Aucun rappel</mat-option>
            <mat-option value="1 semaine">Dans 1 semaine</mat-option>
            <mat-option value="2 semaines">Dans 2 semaines</mat-option>
            <mat-option value="1 mois">Dans 1 mois</mat-option>
            <mat-option value="Personnalisé">Date personnalisée</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline"
                        [class.disabled-field]="candidatureForm.get('delaiRappel')?.value !== 'Personnalisé'">
          <mat-label>Date de rappel</mat-label>
          <input matInput [matDatepicker]="pickerDateRappel" formControlName="dateRappel"
                 [min]="minDateForRappel"
                 [disabled]="candidatureForm.get('delaiRappel')?.value !== 'Personnalisé'">
          <mat-datepicker-toggle matIconSuffix [for]="pickerDateRappel"
                                 [disabled]="candidatureForm.get('delaiRappel')?.value !== 'Personnalisé'"></mat-datepicker-toggle>
          <mat-datepicker #pickerDateRappel [startAt]="minDateForRappel"></mat-datepicker>
           <mat-error *ngIf="candidatureForm.get('dateRappel')?.hasError('required') && candidatureForm.get('delaiRappel')?.value === 'Personnalisé'">
            Date de rappel requise pour un délai personnalisé.
          </mat-error>
           <mat-error *ngIf="candidatureForm.get('dateRappel')?.hasError('matDatepickerMin')">
            La date de rappel ne peut pas être antérieure à la date de candidature.
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width-field">
          <mat-label>Commentaires</mat-label>
          <textarea matInput formControlName="commentaires" rows="3" placeholder="Notes, suivi, prochaines étapes..."></textarea>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="candidatureForm.invalid">
        {{ data.candidature ? 'Mettre à jour' : 'Ajouter' }}
      </button>
    </div>
  `,
  styles: [`
    .candidature-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .full-width-field {
      grid-column: 1 / -1;
    }
    .disabled-field {
        opacity: 0.6;
    }
    .disabled-field input,
    .disabled-field mat-datepicker-toggle {
        pointer-events: none;
    }
    @media (max-width: 768px) {
      .candidature-form {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CandidatureDialogComponent implements OnInit, OnDestroy {
  candidatureForm: FormGroup;
  private subscriptions = new Subscription();
  public minDateForRappel: Date | null = null; // MODIFICATION: Ajout de la propriété

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
      region: [candidature?.region || '', Validators.required], // Modifié pour être requis par défaut comme dans le template
      contact: [candidature?.contact || ''],
      reponse: [candidature?.reponse || 'En attente', Validators.required],
      source: [candidature?.source || '', Validators.required],
      commentaires: [candidature?.commentaires || ''],
      delaiRappel: [candidature?.delaiRappel || '1 semaine'],
      dateRappel: [candidature ? this.parseDateFr(candidature.dateRappel) : null]
    });

    // MODIFICATION: Initialiser minDateForRappel basé sur la date de candidature existante ou la date par défaut
    const initialDateCandidature = this.candidatureForm.get('date')?.value;
    if (initialDateCandidature instanceof Date) {
      this.minDateForRappel = new Date(initialDateCandidature); // Crée une nouvelle instance pour éviter les mutations
    }
  }

  ngOnInit(): void {
    this.setupReminderLogic();
    this.setupMinDateForRappelLogic(); // MODIFICATION: Appel de la nouvelle logique

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

  // MODIFICATION: Nouvelle fonction pour gérer la logique de minDateForRappel
  private setupMinDateForRappelLogic(): void {
    const dateCandidatureCtrl = this.candidatureForm.get('date');
    if (dateCandidatureCtrl) {
      this.subscriptions.add(
        dateCandidatureCtrl.valueChanges.subscribe(newAppDate => {
          if (newAppDate instanceof Date) {
            this.minDateForRappel = new Date(newAppDate); // Crée une nouvelle instance
            // Si la date de rappel actuelle est antérieure à la nouvelle date de candidature,
            // et que le délai n'est pas "Aucun", il faut la réajuster ou la vider.
            const dateRappelCtrl = this.candidatureForm.get('dateRappel');
            const delaiRappelCtrl = this.candidatureForm.get('delaiRappel');
            if (dateRappelCtrl && dateRappelCtrl.value && dateRappelCtrl.value < this.minDateForRappel && delaiRappelCtrl?.value !== 'Aucun') {
              if (delaiRappelCtrl?.value === 'Personnalisé') {
                dateRappelCtrl.setValue(null); // Invalider si personnalisé et maintenant avant minDate
              } else if (delaiRappelCtrl?.value) {
                 // Recalculer pour les délais fixes
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
          // Si une date de rappel existante est avant minDateForRappel, la vider.
          if (this.minDateForRappel && dateRappelCtrl.value && dateRappelCtrl.value < this.minDateForRappel) {
            dateRappelCtrl.setValue(null, { emitEvent: false });
          }
          // Sinon, l'utilisateur choisira la date, ne rien pré-remplir ici sauf si une date existait déjà et est valide.
        } else { // Pour les délais fixes comme "1 semaine", etc.
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

    const rappelDate = new Date(baseDate); // Toujours partir de la baseDate
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
      // Année, Mois (0-indexé), Jour
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
          dateRappelFormatted = undefined; // Important pour que le service le gère correctement
      }

      const candidature: Candidature = {
        ...formValue,
        date: this.formatDateToFr(formValue.date) as string, // Assurer que la date est bien une string
        dateRappel: dateRappelFormatted,
      };

      this.dialogRef.close(candidature);
    } else {
      this.candidatureForm.markAllAsTouched(); // Afficher les erreurs si le formulaire est invalide
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
