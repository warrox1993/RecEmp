// src/app/components/candidature-list/candidature-list.component.ts
import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, ElementRef, effect, WritableSignal, signal, computed, Signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription, take } from 'rxjs';

import { Candidature } from '../../models/candidature.model';
import { CandidatureService } from '../../services/candidature.service';
import { CandidatureDialogComponent } from '../candidature-dialog/candidature-dialogue.component';
import { DatePickerDialogComponent } from '../date-picker-dialog/date-picker-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

interface TopStatItem {
  nom: string;
  nombre: number;
  pourcentage: number;
}

interface StatistiquesCandidatures {
  total: number;
  typeStats: {
    job: number;
    stage: number;
    jobPercent: number;
    stagePercent: number;
  };
  reponseStats: {
    enAttente: number;
    enDiscussion: number;
    refus: number;
    accepte: number;
    enAttentePercent: number;
    enDiscussionPercent: number;
    refusPercent: number;
    acceptePercent: number;
  };
  sourceStatsTop: TopStatItem[];
  regionStatsTop: TopStatItem[];
}


export class MatPaginatorIntlFr extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Éléments par page :';
  override nextPageLabel = 'Page suivante';
  override previousPageLabel = 'Page précédente';
  override firstPageLabel = 'Première page';
  override lastPageLabel = 'Dernière page';
  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) { return `0 sur ${length}`; }
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} sur ${length}`;
  };
}

@Component({
  selector: 'app-candidature-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatTableModule, MatSortModule, MatPaginatorModule,
    MatInputModule, MatButtonModule, MatIconModule, MatTooltipModule, MatDialogModule,
    MatSelectModule, MatDatepickerModule, MatChipsModule, MatCardModule, MatMenuModule,
    MatTabsModule, MatProgressBarModule, MatNativeDateModule, MatDividerModule, MatSnackBarModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: MatPaginatorIntl, useClass: MatPaginatorIntlFr },
    DatePipe
  ],
  templateUrl: './candidature-list.component.html',
  styleUrls: ['./candidature-list.component.scss']
})
export class CandidatureListComponent implements OnInit, AfterViewInit, OnDestroy {
  colonnesAffichees: string[] = ['id', 'date', 'type', 'ranking', 'entreprise', 'poste', 'ville', 'region', 'contact', 'reponse', 'source', 'dateRappel', 'commentaires', 'actions'];
  dataSource: MatTableDataSource<Candidature>;
  private queryParamsSubscription!: Subscription;

  filtreType: string = '';
  filtreReponse: string = '';
  filtreDate: Date | null = null;
  valeurFiltreGlobal: string = '';
  filtreRappelAujourdhui = false;

  afficherStats: WritableSignal<boolean> = signal(false);
  statistiques: StatistiquesCandidatures | null = null;

  readonly filtresActifs: Signal<boolean>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('inputRecherche') inputRecherche!: ElementRef<HTMLInputElement>;

  private today = new Date();

  constructor(
    private candidatureService: CandidatureService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private dateAdapter: DateAdapter<Date>,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.dataSource = new MatTableDataSource<Candidature>([]);
    this.dateAdapter.setLocale('fr-FR');
    this.today.setHours(0, 0, 0, 0);

    this.filtresActifs = computed(() =>
      !!(this.valeurFiltreGlobal || this.filtreType || this.filtreReponse || this.filtreDate || this.filtreRappelAujourdhui)
    );

    // MODIFICATION: L'effect appelle directement appliquerFiltres
    effect(() => {
      const candidaturesData = this.candidatureService.candidatures();
      this.dataSource.data = candidaturesData;
      if (this.afficherStats()) {
        this.calculerStatistiques();
      }
      this.appliquerFiltres(); // Appel direct
    });
  }

  ngOnInit(): void {
    this.queryParamsSubscription = this.activatedRoute.queryParamMap.pipe(take(1)).subscribe(params => {
      const typeParam = params.get('type');
      const reponseParam = params.get('reponse');
      const rappelParam = params.get('rappel');

      if (typeParam) this.filtreType = typeParam;
      if (reponseParam) this.filtreReponse = reponseParam;
      if (rappelParam === 'aujourdhui') this.filtreRappelAujourdhui = true;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    // MODIFICATION: Définir filterPredicate une fois pour toutes ici
    this.dataSource.filterPredicate = this.creerFiltreCombine();
    // L'effect appellera appliquerFiltres après le chargement initial des données.
    // Si les données sont déjà dans le signal, l'effect aura déjà tourné.
    // Pour s'assurer que les filtres (potentiellement lus des queryParams) sont appliqués avec
    // le prédicat fraîchement défini, on peut faire un appel ici.
    // Cependant, l'effect devrait le couvrir. A tester pour voir si cet appel est nécessaire.
    // this.appliquerFiltres();
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }

  voirDetailsCandidature(candidature: Candidature): void {
    this.router.navigate(['/candidatures', candidature.id]);
  }

  appliquerFiltreGlobal(event: Event, effacer: boolean = false): void {
    const inputElement = (event.target as HTMLInputElement);
    if (effacer && this.inputRecherche?.nativeElement) {
      this.inputRecherche.nativeElement.value = '';
    }
    this.valeurFiltreGlobal = inputElement.value.trim().toLowerCase();
    this.appliquerFiltres();
  }

  reinitialiserRechercheGlobal(): void {
    if (this.inputRecherche?.nativeElement) this.inputRecherche.nativeElement.value = '';
    this.valeurFiltreGlobal = '';
    this.appliquerFiltres();
  }

  // MODIFICATION: Simplification, plus de vérification de filterPredicate ici
  appliquerFiltres(): void {
    this.dataSource.filter = JSON.stringify({
        global: this.valeurFiltreGlobal,
        type: this.filtreType,
        reponse: this.filtreReponse,
        date: this.filtreDate ? this.formatDatePourComparaison(this.filtreDate) : '',
        rappelAujourdhui: this.filtreRappelAujourdhui
    });
    if (this.dataSource.paginator) { this.dataSource.paginator.firstPage(); }
  }

  creerFiltreCombine(): (data: Candidature, filter: string) => boolean {
    return (data: Candidature, filter: string): boolean => {
      const criteres = JSON.parse(filter);
      let matchRappelAujourdhui = true;
      if (criteres.rappelAujourdhui) {
        matchRappelAujourdhui = this.getStatutRappel(data) === 'aujourdhui';
      }
      const rechercheGlobale = criteres.global?.toLowerCase() || '';
      const matchGlobal = (
        data.entreprise.toLowerCase().includes(rechercheGlobale) ||
        data.poste.toLowerCase().includes(rechercheGlobale) ||
        data.ville.toLowerCase().includes(rechercheGlobale) ||
        (data.region && data.region.toLowerCase().includes(rechercheGlobale)) ||
        data.source.toLowerCase().includes(rechercheGlobale) ||
        data.commentaires.toLowerCase().includes(rechercheGlobale) ||
        data.contact.toLowerCase().includes(rechercheGlobale)
      );
      const matchType = !criteres.type || data.type === criteres.type;
      const matchReponse = !criteres.reponse || data.reponse === criteres.reponse;
      const matchDate = !criteres.date || data.date === criteres.date;
      return matchGlobal && matchType && matchReponse && matchDate && matchRappelAujourdhui;
    };
  }

  private formatDatePourComparaison(date: Date): string {
    if (!date) return '';
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  reinitialiserTousLesFiltres(): void {
    if (this.inputRecherche?.nativeElement) this.inputRecherche.nativeElement.value = '';
    this.valeurFiltreGlobal = '';
    this.filtreType = '';
    this.filtreReponse = '';
    this.filtreDate = null;
    this.filtreRappelAujourdhui = false;
    this.appliquerFiltres();
    this.afficherMessage('Filtres réinitialisés.');
    this.router.navigate([], { relativeTo: this.activatedRoute, queryParams: {}, queryParamsHandling: '' });
  }

  ouvrirDialogAjout(): void {
    const dialogRef = this.dialog.open(CandidatureDialogComponent, {
      width: 'clamp(300px, 90vw, 800px)', maxWidth: '95vw', data: { candidature: null }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) { this.candidatureService.addCandidature(result); this.afficherMessage('Candidature ajoutée !', 'success-snackbar'); }
    });
  }

  ouvrirDialogModification(candidature: Candidature, event: MouseEvent): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(CandidatureDialogComponent, {
      width: 'clamp(300px, 90vw, 800px)', maxWidth: '95vw', data: { candidature: { ...candidature } }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) { this.candidatureService.updateCandidature(result); this.afficherMessage('Candidature mise à jour.', 'success-snackbar'); }
    });
  }

  supprimerCandidature(candidature: Candidature, event: MouseEvent): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '380px', data: { title: 'Confirmer suppression', message: `Supprimer la candidature pour ${candidature.entreprise} ?`, confirmText: 'Supprimer', cancelText: 'Annuler', color: 'warn' }
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) { this.candidatureService.deleteCandidature(candidature.id); this.afficherMessage('Candidature supprimée.', 'warn-snackbar'); }
    });
  }

  ouvrirDialogDate(candidature: Candidature, event: MouseEvent): void {
    event.stopPropagation();
    const dateActuelle = this.parseDateFr(candidature.date);
    if (!dateActuelle) { this.afficherMessage("Format de date invalide.", "warn-snackbar"); return; }
    const dialogRef = this.dialog.open(DatePickerDialogComponent, { width: '350px', data: { date: dateActuelle } });
    dialogRef.afterClosed().subscribe(nouvelleDate => {
      if (nouvelleDate instanceof Date) {
        const dateFormatee = this.formatDatePourComparaison(nouvelleDate);
        this.candidatureService.updateDate(candidature.id, dateFormatee);
        this.afficherMessage('Date de candidature mise à jour.');
      }
    });
  }

  ouvrirDialogModificationRappel(candidature: Candidature, event: MouseEvent): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(CandidatureDialogComponent, {
      width: 'clamp(300px, 90vw, 800px)', maxWidth: '95vw', data: { candidature: { ...candidature } }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) { this.candidatureService.updateCandidature(result); this.afficherMessage('Rappel de candidature mis à jour.', 'success-snackbar'); }
    });
  }

  basculerTypeCandidature(candidature: Candidature, event: MouseEvent): void {
    event.stopPropagation();
    this.candidatureService.toggleType(candidature.id);
    const updatedCandidature = this.candidatureService.candidatures().find(c => c.id === candidature.id);
    this.afficherMessage(`Type changé en "${updatedCandidature?.type}" pour ${candidature.entreprise}.`);
  }

  getClasseReponse(reponse: string): string {
    switch (reponse) {
      case 'Refus': return 'refus'; case 'En attente': return 'en-attente';
      case 'En discussion': return 'en-discussion'; case 'Accepté': return 'accepte';
      default: return '';
    }
  }

  getStatutRappel(candidature: Candidature): 'urgent' | 'aujourdhui' | 'prochainement' | 'aucun' {
    if (!candidature.dateRappel || (candidature.reponse !== 'En attente' && candidature.reponse !== 'En discussion')) return 'aucun';
    const dateRappel = this.parseDateFr(candidature.dateRappel);
    if (!dateRappel) return 'aucun';
    dateRappel.setHours(0,0,0,0);
    const todayMidnight = new Date(this.today);
    if (dateRappel < todayMidnight) return 'urgent';
    if (dateRappel.getTime() === todayMidnight.getTime()) return 'aujourdhui';
    return 'aucun';
  }

  private parseDateFr(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    return null;
  }

  exporterEnCSV(): void {
    const contenuCSV = this.candidatureService.exportToCSV();
    if (contenuCSV === "Aucune donnée à exporter.") { this.afficherMessage(contenuCSV, 'warn-snackbar'); return; }
    const blob = new Blob(["\uFEFF" + contenuCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.setAttribute('href', url);
    lien.setAttribute('download', `export_candidatures_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(lien); lien.click(); document.body.removeChild(lien);
    URL.revokeObjectURL(url);
    this.afficherMessage('Données exportées en CSV.', 'success-snackbar');
  }

  basculerAffichageStats(): void {
    this.afficherStats.update(current => !current);
  }

  calculerStatistiques(): void {
    const candidatures = this.candidatureService.candidatures();
    const total = candidatures.length;
    if (total === 0) {
      this.statistiques = { total: 0, typeStats: { job: 0, stage: 0, jobPercent: 0, stagePercent: 0 }, reponseStats: { enAttente: 0, enDiscussion: 0, refus: 0, accepte: 0, enAttentePercent: 0, enDiscussionPercent: 0, refusPercent: 0, acceptePercent: 0 }, sourceStatsTop: [], regionStatsTop: [] };
      return;
    }
    const compterEtPourcent = (compte: number) => ({ nombre: compte, pourcentage: total > 0 ? Math.round((compte / total) * 100) : 0 });

    const typeStats = {
      job: compterEtPourcent(candidatures.filter(c => c.type === 'Job').length).nombre,
      stage: compterEtPourcent(candidatures.filter(c => c.type === 'Stage').length).nombre,
      jobPercent: compterEtPourcent(candidatures.filter(c => c.type === 'Job').length).pourcentage,
      stagePercent: compterEtPourcent(candidatures.filter(c => c.type === 'Stage').length).pourcentage,
    };
    const reponseStats = {
        enAttente: compterEtPourcent(candidatures.filter(c => c.reponse === 'En attente').length).nombre,
        enDiscussion: compterEtPourcent(candidatures.filter(c => c.reponse === 'En discussion').length).nombre,
        refus: compterEtPourcent(candidatures.filter(c => c.reponse === 'Refus').length).nombre,
        accepte: compterEtPourcent(candidatures.filter(c => c.reponse === 'Accepté').length).nombre,
        enAttentePercent: compterEtPourcent(candidatures.filter(c => c.reponse === 'En attente').length).pourcentage,
        enDiscussionPercent: compterEtPourcent(candidatures.filter(c => c.reponse === 'En discussion').length).pourcentage,
        refusPercent: compterEtPourcent(candidatures.filter(c => c.reponse === 'Refus').length).pourcentage,
        acceptePercent: compterEtPourcent(candidatures.filter(c => c.reponse === 'Accepté').length).pourcentage,
    };
    const countsBySource: { [key: string]: number } = {};
    candidatures.forEach(c => { countsBySource[c.source] = (countsBySource[c.source] || 0) + 1; });
    const sourceStatsTop: TopStatItem[] = Object.entries(countsBySource)
        .map(([nom, nombre]) => ({ nom, ...compterEtPourcent(nombre) }))
        .sort((a,b) => b.nombre - a.nombre).slice(0,4);

    const countsByRegion: { [key: string]: number } = {};
    candidatures.forEach(c => {
        const region = c.region || 'Non spécifiée';
        countsByRegion[region] = (countsByRegion[region] || 0) + 1;
    });
    const regionStatsTop: TopStatItem[] = Object.entries(countsByRegion)
        .map(([nom, nombre]) => ({ nom, ...compterEtPourcent(nombre) }))
        .sort((a,b) => b.nombre - a.nombre).slice(0,5);

    this.statistiques = { total, typeStats, reponseStats, sourceStatsTop, regionStatsTop };
  }

  private afficherMessage(message: string, panelClass: string = 'info-snackbar'): void {
    this.snackBar.open(message, 'Fermer', { duration: 3500, horizontalPosition: 'center', verticalPosition: 'bottom', panelClass: [panelClass, 'custom-snackbar'] });
  }
}
