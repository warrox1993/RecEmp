// src/app/components/candidature-detail/candidature-detail.component.ts
import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { Candidature } from '../../models/candidature.model';
import { CandidatureService } from '../../services/candidature.service';
import { CandidatureDialogComponent } from '../candidature-dialog/candidature-dialogue.component';

// Assurer que les types correspondent bien à l'interface
export interface HistoriqueItem {
  id: string | number;
  date: string;
  type: 'Email envoyé' | 'Appel téléphonique' | 'Entretien RH' | 'Entretien technique' | 'Note' | 'Autre';
  description: string;
  candidatureId: number;
}

@Component({
  selector: 'app-candidature-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatListModule, MatDividerModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, DatePipe, MatTooltipModule
  ],
  templateUrl: './candidature-detail.component.html',
  styleUrls: ['./candidature-detail.component.scss']
})
export class CandidatureDetailComponent implements OnInit, OnDestroy {
  candidature: Candidature | null = null;
  historique: HistoriqueItem[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  private routeSub!: Subscription;
  private basePageTitle = 'Détail Candidature - ProTrack CV';
  historiqueForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private candidatureService: CandidatureService,
    private titleService: Title,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    effect(() => {
      const idParam = this.route.snapshot.paramMap.get('id');
      if (idParam) {
        const id = +idParam;
        this.loadCandidatureDetails(id);
      }
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle(this.basePageTitle);
    this.routeSub = this.route.paramMap.subscribe(params => {
        const idParam = params.get('id');
        if (idParam) {
            const id = +idParam;
            if (!this.candidature || this.candidature.id !== id) {
                 this.loadCandidatureDetails(id);
            }
        } else {
            this.isLoading = false;
            this.errorMessage = 'ID de candidature manquant dans l\'URL.';
            this.titleService.setTitle(`Erreur ID | ProTrack CV`);
        }
    });

    this.historiqueForm = this.fb.group({
      type: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  loadCandidatureDetails(id: number): void {
    this.isLoading = true;
    this.errorMessage = null;
    const fetchedCandidature = this.candidatureService.getCandidatureById(id);

    if (fetchedCandidature) {
      this.candidature = fetchedCandidature;
      this.titleService.setTitle(`Détail: ${this.candidature.entreprise} - ${this.candidature.poste} | ProTrack CV`);
      this.loadSimulatedHistorique(this.candidature.id);
    } else {
      this.errorMessage = 'Candidature non trouvée.';
      this.titleService.setTitle(`Candidature non trouvée | ProTrack CV`);
      this.candidature = null;
    }
    this.isLoading = false;
  }

  private loadSimulatedHistorique(candidatureId: number): void {
    // MODIFICATION: S'assurer que les types correspondent à l'interface HistoriqueItem
    this.historique = [
      { id: 1, candidatureId: candidatureId, date: '20/05/2025', type: 'Email envoyé', description: 'CV et lettre de motivation envoyés pour le poste de Développeur Frontend.' },
      { id: 2, candidatureId: candidatureId, date: '22/05/2025', type: 'Note', description: 'L\'entreprise semble très innovante. Vérifier leur page Glassdoor.' },
      { id: 3, candidatureId: candidatureId, date: '25/05/2025', type: 'Entretien RH', description: 'Premier entretien téléphonique avec Mme. Dupont. Bon feeling général, questions sur mes motivations et expériences passées. Prochaine étape : test technique.' },
      { id: 4, candidatureId: candidatureId, date: '28/05/2025', type: 'Entretien technique', description: 'Test technique en ligne. Durée 2h. Questions sur JavaScript avancé et un algorithme.' },
      { id: 5, candidatureId: candidatureId, date: '02/06/2025', type: 'Appel téléphonique', description: 'Appel de M. Martin pour débriefer le test technique et planifier un entretien avec le manager.' },
    ].filter(item => item.candidatureId === candidatureId || candidatureId % 2 === item.id % 2) as HistoriqueItem[]; // Assertion de type si nécessaire, mais les valeurs doivent correspondre
  }

  getItemIcon(type: HistoriqueItem['type']): string {
    switch (type) {
      case 'Email envoyé': return 'email';
      case 'Appel téléphonique': return 'phone';
      case 'Entretien RH': return 'supervisor_account';
      case 'Entretien technique': return 'code';
      case 'Note': return 'note';
      case 'Autre': return 'help_outline';
      default: return 'event_note';
    }
  }

  addHistoriqueItem(): void {
    if (this.historiqueForm.valid && this.candidature) {
      const newItem: HistoriqueItem = {
        id: Date.now(),
        candidatureId: this.candidature.id,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        type: this.historiqueForm.value.type, // Le select devrait fournir une valeur correcte
        description: this.historiqueForm.value.description
      };
      this.historique.unshift(newItem);
      this.historiqueForm.reset();
      Object.keys(this.historiqueForm.controls).forEach(key => {
        this.historiqueForm.get(key)?.setErrors(null) ;
      });
    } else {
      this.historiqueForm.markAllAsTouched();
    }
  }

  editCandidature(): void {
    if (this.candidature) {
      const dialogRef = this.dialog.open(CandidatureDialogComponent, {
        width: 'clamp(300px, 90vw, 800px)', maxWidth: '95vw',
        data: { candidature: { ...this.candidature } }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.candidatureService.updateCandidature(result);
          if (this.candidature && this.candidature.id === result.id) {
            this.candidature = result;
            this.titleService.setTitle(`Détail: ${result.entreprise} - ${result.poste} | ProTrack CV`);
          }
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/candidatures']);
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }
}
