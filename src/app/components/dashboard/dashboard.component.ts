// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider'; // Importer MatDividerModule
import { Subscription, Observable } from 'rxjs';

import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { DashboardService, DashboardSummaryData, ChartDataPoint } from '../../services/dashboard.service';
import { NotificationService } from '../../services/notification.service';
import { ManualReminderDialogComponent, ManualReminderData } from '../manual-reminder-dialog/manual-reminder-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CandidatureService } from '../../services/candidature.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    NgxChartsModule,
    MatDialogModule,
    MatDividerModule // Ajouter MatDividerModule ici
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // ... (reste du code du composant inchangé) ...
  pageTitle = 'Tableau de Bord - ProTrack CV';
  summaryData: DashboardSummaryData | null = null;
  isLoadingSummary = true;
  isLoadingStatutChart = true;
  isLoadingTypeChart = true;

  candidaturesParStatut: ChartDataPoint[] = [];
  candidaturesParType: ChartDataPoint[] = [];

  view: [number, number] = [700, 300];
  gradientPie = true;
  showLegendPie = true;
  showLabelsPie = true;
  isDoughnutPie = false;
  legendPositionPie: any = 'below';
  colorSchemePie: Color = { name: 'statuts', selectable: true, group: ScaleType.Ordinal, domain: ['#FFC107', '#2196F3', '#F44336', '#4CAF50', '#AAAAAA'] };
  showXAxisBar = true;
  showYAxisBar = true;
  gradientBar = false;
  showLegendBar = false;
  showXAxisLabelBar = true;
  xAxisLabelBar = 'Type de Contrat';
  showYAxisLabelBar = true;
  yAxisLabelBar = 'Nombre de Candidatures';
  colorSchemeBar: Color = { name: 'types', selectable: true, group: ScaleType.Ordinal, domain: ['#3F51B5', '#FF4081'] };

  private subscriptions: Subscription = new Subscription();

  constructor(
    private titleService: Title,
    private dashboardService: DashboardService,
    private router: Router,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private snackBar: MatSnackBar,
    private candidatureService: CandidatureService
  ) {
    effect(() => {
      this.candidatureService.candidatures();
      console.log('DashboardComponent effect: Détection de changement dans les candidatures, rechargement des données du dashboard.');
      this.loadDashboardData();
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle(this.pageTitle);
    this.updateChartViewSize();
    const resizeObs = new Observable<Event>(subscriber => {
      window.addEventListener('resize', event => subscriber.next(event));
      return () => window.removeEventListener('resize', event => subscriber.next(event));
    });
    this.subscriptions.add(resizeObs.subscribe(() => this.updateChartViewSize()));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  updateChartViewSize(): void {
    const chartWidth = Math.min(700, window.innerWidth - 80);
    this.view = [chartWidth, 300];
  }

  loadDashboardData(): void {
    this.isLoadingSummary = true;
    this.subscriptions.add(
      this.dashboardService.getDashboardSummary().subscribe(data => {
        this.summaryData = data;
        this.isLoadingSummary = false;
      })
    );
    this.isLoadingStatutChart = true;
    this.subscriptions.add(
      this.dashboardService.getCandidaturesParStatutChartData().subscribe(data => {
        this.candidaturesParStatut = data;
        this.isLoadingStatutChart = false;
      })
    );
    this.isLoadingTypeChart = true;
    this.subscriptions.add(
      this.dashboardService.getCandidaturesParTypeChartData().subscribe(data => {
        this.candidaturesParType = data;
        this.isLoadingTypeChart = false;
      })
    );
  }

  openManualReminderDialog(): void {
    const dialogRef = this.dialog.open(ManualReminderDialogComponent, {
      width: '450px',
      data: {}
    });
    dialogRef.afterClosed().subscribe((result: ManualReminderData | undefined) => {
      if (result) {
        const newReminder = this.notificationService.addManualReminder({
            title: result.title,
            description: result.description,
            reminderDate: result.reminderDate,
        });
        this.snackBar.open(`Rappel "${newReminder.title}" ajouté.`, 'OK', { duration: 3000 });
      }
    });
  }

  onChartSelect(event: any, chartType: 'statut' | 'type'): void {
    console.log(`Élément de graphique (${chartType}) sélectionné:`, event);
    if (event.name) {
      if (chartType === 'statut') {
        this.navigateToCandidaturesFiltered('reponse', event.name);
      } else if (chartType === 'type') {
        this.navigateToCandidaturesFiltered('type', event.name);
      }
    }
  }

  navigateToCandidaturesFiltered(filterType: 'reponse' | 'type' | 'rappel', filterValue: string): void {
    const queryParams: any = {};
    if (filterType === 'reponse') queryParams.reponse = filterValue;
    if (filterType === 'type') queryParams.type = filterValue;
    if (filterType === 'rappel' && filterValue === 'aujourdhui') queryParams.rappel = 'aujourdhui';
    this.router.navigate(['/candidatures'], { queryParams });
  }
}
