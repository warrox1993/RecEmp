// src/app/components/kanban-board/kanban-board.component.ts

import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

import { Candidature } from '../../models/candidature.model';
import { KanbanColumn, KanbanStats, QuickAction, KANBAN_COLUMNS_CONFIG, STATUS_TO_COLUMN_MAP, COLUMN_TO_STATUS_MAP } from '../../models/kanban.model';
import { CandidatureService } from '../../services/candidature.service';
import { NotificationService } from '../../services/notification.service';
import { CandidatureCardComponent } from '../candidature-card/candidature-card.component';
import { CandidatureDialogComponent } from '../candidature-dialog/candidature-dialogue.component';


@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatMenuModule,
    MatSnackBarModule,
    MatChipsModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    CandidatureCardComponent
  ],
  template: `
    <div class="kanban-container">
      <!-- Header avec stats et actions -->
      <div class="kanban-header">
        <div class="header-info">
          <h1>
            <mat-icon>view_kanban</mat-icon>
            Pipeline des Candidatures
          </h1>
          <div class="stats-chips">
            <mat-chip-set>
              <mat-chip class="total-chip">
                <mat-icon>work_outline</mat-icon>
                {{ stats().totalCandidatures }} candidatures
              </mat-chip>
              <mat-chip class="progress-chip" *ngIf="stats().progressToday > 0">
                <mat-icon>trending_up</mat-icon>
                +{{ stats().progressToday }} aujourd'hui
              </mat-chip>
              <mat-chip class="urgent-chip" *ngIf="urgentCandidatures().length > 0">
                <mat-icon>priority_high</mat-icon>
                {{ urgentCandidatures().length }} urgent{{ urgentCandidatures().length > 1 ? 's' : '' }}
              </mat-chip>
            </mat-chip-set>
          </div>
        </div>

        <div class="header-actions">
          <!-- Filtres rapides -->
          <mat-form-field appearance="outline" class="quick-filter">
            <mat-label>Filtre rapide</mat-label>
            <mat-select [(value)]="quickFilter" (selectionChange)="applyQuickFilter()">
              <mat-option value="">Tout voir</mat-option>
              <mat-option value="urgent">Urgent uniquement</mat-option>
              <mat-option value="high-priority">Haute priorité</mat-option>
              <mat-option value="overdue">En retard</mat-option>
              <mat-option value="recent">Récent (7j)</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-raised-button color="primary" (click)="addNewCandidature()">
            <mat-icon>add</mat-icon>
            Nouvelle candidature
          </button>

          <button mat-stroked-button (click)="toggleView()">
            <mat-icon>view_list</mat-icon>
            Vue liste
          </button>

          <button mat-icon-button [matMenuTriggerFor]="moreActionsMenu" matTooltip="Plus d'actions">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #moreActionsMenu="matMenu">
            <button mat-menu-item (click)="exportData()">
              <mat-icon>download</mat-icon>
              <span>Exporter CSV</span>
            </button>
            <button mat-menu-item (click)="refreshData()">
              <mat-icon>refresh</mat-icon>
              <span>Actualiser</span>
            </button>
            <button mat-menu-item (click)="showStats()">
              <mat-icon>analytics</mat-icon>
              <span>Statistiques</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="runAutomation()">
              <mat-icon>auto_fix_high</mat-icon>
              <span>Automatisation</span>
            </button>
            <button mat-menu-item (click)="cleanupOldData()">
              <mat-icon>cleaning_services</mat-icon>
              <span>Nettoyer anciennes données</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Indicateur de performance amélioré -->
      <div class="performance-indicator" *ngIf="conversionRate() > 0">
        <div class="performance-header">
          <span class="performance-label">Performance globale</span>
          <span class="performance-value">{{ conversionRate() }}% de succès</span>
        </div>
        <mat-progress-bar mode="determinate" [value]="conversionRate()" [color]="getPerformanceColor()"></mat-progress-bar>
        <div class="performance-details">
          <span>{{ stats().accepte }} accepté{{ stats().accepte > 1 ? 's' : '' }} sur {{ stats().total }}</span>
          <span>Temps moyen: {{ averageTimeInPipeline() }}j</span>
        </div>
      </div>

      <!-- Alertes et notifications -->
      <div class="kanban-alerts" *ngIf="hasActiveAlerts()">
        <mat-card class="alert-card">
          <div class="alert-content">
            <mat-icon class="alert-icon">notification_important</mat-icon>
            <div class="alert-text">
              <strong>{{ getAlertCount() }} action{{ getAlertCount() > 1 ? 's' : '' }} requise{{ getAlertCount() > 1 ? 's' : '' }}</strong>
              <p>{{ getAlertMessage() }}</p>
            </div>
            <button mat-button color="primary" (click)="handleAlerts()">Traiter</button>
          </div>
        </mat-card>
      </div>

      <!-- Colonnes Kanban -->
      <div class="kanban-board"
           cdkDropListGroup
           [@slideIn]="columns().length"
           [class.loading]="isLoading()">

        <div *ngFor="let column of filteredColumns(); trackBy: trackByColumn"
             class="kanban-column"
             [style.--column-color]="column.color"
             [class.limit-warning]="isNearLimit(column)"
             [class.limit-exceeded]="isLimitExceeded(column)">

          <!-- En-tête de colonne amélioré -->
          <div class="column-header">
            <div class="column-info">
              <div class="column-title-section">
                <mat-icon [style.color]="column.color">{{ column.icon }}</mat-icon>
                <h3>{{ column.title }}</h3>
                <span class="column-count"
                      [class.warning]="isNearLimit(column)"
                      [class.error]="isLimitExceeded(column)">
                  {{ column.candidatures.length }}
                  <span *ngIf="column.maxItems">/{{ column.maxItems }}</span>
                </span>
              </div>
              <p class="column-description">{{ column.description }}</p>

              <!-- Métriques de colonne -->
              <div class="column-metrics" *ngIf="getColumnMetrics(column.id) as metrics">
                <div class="metric-item" *ngIf="metrics.avgDays > 0">
                  <mat-icon>schedule</mat-icon>
                  <span>{{ metrics.avgDays }}j moy.</span>
                </div>
                <div class="metric-item" *ngIf="metrics.conversionRate > 0">
                  <mat-icon>trending_up</mat-icon>
                  <span>{{ metrics.conversionRate }}% conv.</span>
                </div>
              </div>
            </div>

            <!-- Indicateurs de colonne -->
            <div class="column-indicators">
              <div class="limit-indicator"
                   *ngIf="isNearLimit(column)"
                   [matTooltip]="getLimitTooltip(column)">
                <mat-icon [color]="isLimitExceeded(column) ? 'warn' : 'accent'">
                  {{ isLimitExceeded(column) ? 'error' : 'warning' }}
                </mat-icon>
              </div>
              <button mat-icon-button
                      class="column-menu-btn"
                      [matMenuTriggerFor]="columnMenu"
                      matTooltip="Actions de colonne">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #columnMenu="matMenu">
                <button mat-menu-item (click)="addCandidatureToColumn(column.id)">
                  <mat-icon>add</mat-icon>
                  <span>Ajouter ici</span>
                </button>
                <button mat-menu-item (click)="sortColumn(column.id, 'priority')">
                  <mat-icon>sort</mat-icon>
                  <span>Trier par priorité</span>
                </button>
                <button mat-menu-item (click)="sortColumn(column.id, 'date')">
                  <mat-icon>event</mat-icon>
                  <span>Trier par date</span>
                </button>
                <mat-divider></mat-divider>
                <button mat-menu-item (click)="bulkActionColumn(column.id, 'set-reminder')">
                  <mat-icon>alarm_add</mat-icon>
                  <span>Rappel pour toutes</span>
                </button>
                <button mat-menu-item (click)="bulkActionColumn(column.id, 'mark-priority')">
                  <mat-icon>priority_high</mat-icon>
                  <span>Marquer prioritaires</span>
                </button>
              </mat-menu>
            </div>
          </div>

          <!-- Zone de drop avec feedback amélioré -->
          <div class="column-content"
               cdkDropList
               [cdkDropListData]="column.candidatures"
               [id]="column.id"
               (cdkDropListDropped)="drop($event)"
               [cdkDropListEnterPredicate]="canDrop">

            <!-- Message si vide avec suggestions -->
            <div *ngIf="column.candidatures.length === 0" class="empty-column">
              <mat-icon [style.color]="column.color">{{ column.icon }}</mat-icon>
              <p>{{ getEmptyColumnMessage(column.id) }}</p>
              <button mat-stroked-button
                      *ngIf="canAddToColumn(column.id)"
                      (click)="addCandidatureToColumn(column.id)"
                      class="add-first-btn"
                      [style.border-color]="column.color"
                      [style.color]="column.color">
                <mat-icon>add</mat-icon>
                {{ getAddButtonText(column.id) }}
              </button>

              <!-- Suggestions d'automation -->
              <div class="automation-suggestion" *ngIf="getAutomationSuggestion(column.id) as suggestion">
                <button mat-button (click)="applyAutomationSuggestion(suggestion)">
                  <mat-icon>auto_fix_high</mat-icon>
                  {{ suggestion.text }}
                </button>
              </div>
            </div>

            <!-- Cartes des candidatures -->
            <div *ngFor="let candidature of column.candidatures; trackBy: trackByCandidature"
                 cdkDrag
                 [cdkDragData]="candidature"
                 class="drag-item"
                 [class.overdue]="isOverdue(candidature)"
                 [class.urgent]="isUrgent(candidature)"
                 (cdkDragStarted)="onDragStart(candidature)"
                 (cdkDragEnded)="onDragEnd()">

              <app-candidature-card
                [candidature]="candidature"
                [quickActions]="getContextualQuickActions(candidature, column.id)"
                [isDragging]="draggingCandidature() === candidature"
                (edit)="editCandidature($event)"
                (viewDetails)="viewCandidatureDetails($event)"
                (quickAction)="executeQuickAction($event)">
              </app-candidature-card>
            </div>
          </div>

          <!-- Footer avec actions rapides et stats -->
          <div class="column-footer">
            <div class="column-footer-stats" *ngIf="column.candidatures.length > 0">
              <span class="stat-item">
                <mat-icon>schedule</mat-icon>
                {{ getOldestInColumn(column.id) }}j max
              </span>
              <span class="stat-item" *ngIf="getUrgentInColumn(column.id) > 0">
                <mat-icon>priority_high</mat-icon>
                {{ getUrgentInColumn(column.id) }} urgent{{ getUrgentInColumn(column.id) > 1 ? 's' : '' }}
              </span>
            </div>

            <button mat-button
                    *ngIf="canAddToColumn(column.id)"
                    (click)="addCandidatureToColumn(column.id)"
                    class="add-to-column-btn">
              <mat-icon>add</mat-icon>
              Ajouter ici
            </button>
          </div>
        </div>
      </div>

      <!-- Messages de feedback améliorés -->
      <div *ngIf="successMessage()"
           class="success-overlay"
           [@fadeInOut]>
        <div class="success-content">
          <mat-icon>{{ getSuccessIcon() }}</mat-icon>
          <span>{{ successMessage() }}</span>
        </div>
      </div>

      <!-- Indicateur d'automatisation active -->
      <div *ngIf="automationRunning()" class="automation-indicator">
        <mat-card>
          <div class="automation-content">
            <mat-spinner diameter="20"></mat-spinner>
            <span>Automatisation en cours...</span>
            <button mat-button (click)="cancelAutomation()">Annuler</button>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styleUrls: ['./kanban-board.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        query('.kanban-column', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger(100, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
      ])
    ])
  ]
})
export class KanbanBoardComponent implements OnInit, OnDestroy {
  columns = signal<KanbanColumn[]>([]);
  filteredColumns = signal<KanbanColumn[]>([]);
  isLoading = signal(false);
  draggingCandidature = signal<Candidature | null>(null);
  successMessage = signal<string>('');
  automationRunning = signal(false);
  quickFilter = '';

  stats = computed(() => this.calculateStats());
  conversionRate = computed(() => this.calculateConversionRate());
  urgentCandidatures = computed(() => this.getUrgentCandidatures());

  // Quick Actions contextuelles améliorées
  quickActions: QuickAction[] = [
    {
      id: 'priority-high',
      label: 'Marquer prioritaire',
      icon: 'priority_high',
      color: '#f44336',
      action: (candidature: Candidature) => this.setHighPriority(candidature)
    },
    {
      id: 'reminder-week',
      label: 'Rappel dans 1 semaine',
      icon: 'event_upcoming',
      color: '#ff9800',
      action: (candidature: Candidature) => this.setReminderInWeek(candidature)
    },
    {
      id: 'mark-sent',
      label: 'Marquer comme envoyée',
      icon: 'send',
      color: '#2196f3',
      action: (candidature: Candidature) => this.markAsSent(candidature)
    },
    {
      id: 'schedule-interview',
      label: 'Programmer entretien',
      icon: 'event_available',
      color: '#9c27b0',
      action: (candidature: Candidature) => this.scheduleInterview(candidature)
    },
    {
      id: 'add-note',
      label: 'Ajouter une note',
      icon: 'note_add',
      color: '#607d8b',
      action: (candidature: Candidature) => this.addNote(candidature)
    }
  ];

  private successTimeout?: number;
  private automationInterval?: number;

  constructor(
    private candidatureService: CandidatureService,
    private notificationService: NotificationService,
    private router: Router,
    private titleService: Title,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // Effect pour synchroniser les données
    effect(() => {
      const candidatures = this.candidatureService.candidatures();
      this.updateColumns(candidatures);
      this.runPeriodicAutomation();
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('Kanban Board - ProTrack CV');
    this.loadData();
    this.startAutomationTimer();
  }

  ngOnDestroy(): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
    if (this.automationInterval) {
      clearInterval(this.automationInterval);
    }
  }

  private loadData(): void {
    this.isLoading.set(true);
    setTimeout(() => {
      const candidatures = this.candidatureService.getAllCandidatures();
      this.updateColumns(candidatures);
      this.isLoading.set(false);
    }, 300);
  }

  private updateColumns(candidatures: Candidature[]): void {
    const newColumns: KanbanColumn[] = KANBAN_COLUMNS_CONFIG.map(config => ({
      ...config,
      candidatures: candidatures.filter(c => {
        const columnId = STATUS_TO_COLUMN_MAP[c.reponse] || 'brouillon';
        return columnId === config.id;
      })
    }));

    this.columns.set(newColumns);
    this.applyQuickFilter();
  }

  // === NOUVELLES FONCTIONNALITÉS AUTOMATISATION ===

  private startAutomationTimer(): void {
    // Exécuter l'automatisation toutes les 5 minutes
    this.automationInterval = window.setInterval(() => {
      this.runPeriodicAutomation();
    }, 5 * 60 * 1000);
  }

  private runPeriodicAutomation(): void {
    const candidates = this.candidatureService.getAllCandidatures();
    let actionsCount = 0;

    candidates.forEach(candidature => {
      // Auto-générer des rappels pour les candidatures anciennes
      if (this.shouldCreateAutoReminder(candidature)) {
        this.createAutoReminder(candidature);
        actionsCount++;
      }

      // Auto-suggérer des actions
      if (this.shouldSuggestAction(candidature)) {
        this.createActionSuggestion(candidature);
        actionsCount++;
      }
    });

    if (actionsCount > 0) {
      this.showSuccessMessage(`${actionsCount} action(s) automatique(s) effectuée(s)`);
    }
  }

  private shouldCreateAutoReminder(candidature: Candidature): boolean {
    if (candidature.dateRappel) return false; // Déjà un rappel
    if (candidature.reponse === 'Refus' || candidature.reponse === 'Accepté') return false;

    const candidatureDate = this.parseDateFr(candidature.date);
    if (!candidatureDate) return false;

    const daysSince = Math.floor((Date.now() - candidatureDate.getTime()) / (1000 * 60 * 60 * 24));

    // Créer un rappel automatique après 7 jours pour les envoyées
    if (candidature.reponse === 'Envoyée' && daysSince >= 7) return true;

    // Créer un rappel après 14 jours pour les en discussion
    if (candidature.reponse === 'En discussion' && daysSince >= 14) return true;

    return false;
  }

  private createAutoReminder(candidature: Candidature): void {
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 3); // Rappel dans 3 jours

    candidature.dateRappel = this.formatDateToFr(reminderDate);
    candidature.delaiRappel = '3 jours';

    this.candidatureService.updateCandidature(candidature);

    this.notificationService.addSystemNotification({
      type: 'rappel',
      title: 'Rappel automatique créé',
      message: `Un rappel a été créé pour ${candidature.entreprise} - ${candidature.poste}`,
      candidatureId: candidature.id
    });
  }

  private shouldSuggestAction(candidature: Candidature): boolean {
    const candidatureDate = this.parseDateFr(candidature.date);
    if (!candidatureDate) return false;

    const daysSince = Math.floor((Date.now() - candidatureDate.getTime()) / (1000 * 60 * 60 * 24));

    // Suggérer des actions pour les candidatures qui stagnent
    return daysSince > 10 && candidature.reponse !== 'Refus' && candidature.reponse !== 'Accepté';
  }

  private createActionSuggestion(candidature: Candidature): void {
    let suggestionText = '';

    switch (candidature.reponse) {
      case 'Envoyée':
        suggestionText = 'Relancer cette candidature ?';
        break;
      case 'En attente':
        suggestionText = 'Prendre des nouvelles ?';
        break;
      case 'En discussion':
        suggestionText = 'Suivre l\'avancement des entretiens ?';
        break;
    }

    if (suggestionText) {
      this.notificationService.addSystemNotification({
        type: 'info',
        title: 'Action suggérée',
        message: `${candidature.entreprise}: ${suggestionText}`,
        candidatureId: candidature.id
      });
    }
  }

  runAutomation(): void {
    this.automationRunning.set(true);

    setTimeout(() => {
      this.runPeriodicAutomation();
      this.automationRunning.set(false);
      this.showSuccessMessage('Automatisation terminée !');
    }, 2000);
  }

  cancelAutomation(): void {
    this.automationRunning.set(false);
  }

  // === FILTRES ET RECHERCHE ===

  applyQuickFilter(): void {
    const allColumns = this.columns();

    if (!this.quickFilter) {
      this.filteredColumns.set(allColumns);
      return;
    }

    const filtered = allColumns.map(column => ({
      ...column,
      candidatures: column.candidatures.filter(candidature => {
        switch (this.quickFilter) {
          case 'urgent':
            return this.isUrgent(candidature);
          case 'high-priority':
            return candidature.ranking === 1;
          case 'overdue':
            return this.isOverdue(candidature);
          case 'recent':
            const candidatureDate = this.parseDateFr(candidature.date);
            if (!candidatureDate) return false;
            const daysSince = Math.floor((Date.now() - candidatureDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysSince <= 7;
          default:
            return true;
        }
      })
    }));

    this.filteredColumns.set(filtered);
  }

  // === GESTION DES LIMITES ===

  isNearLimit(column: KanbanColumn): boolean {
    if (!column.maxItems) return false;
    return column.candidatures.length >= column.maxItems * 0.8;
  }

  isLimitExceeded(column: KanbanColumn): boolean {
    if (!column.maxItems) return false;
    return column.candidatures.length >= column.maxItems;
  }

  getLimitTooltip(column: KanbanColumn): string {
    if (this.isLimitExceeded(column)) {
      return `Limite dépassée ! (${column.candidatures.length}/${column.maxItems})`;
    }
    if (this.isNearLimit(column)) {
      return `Proche de la limite (${column.candidatures.length}/${column.maxItems})`;
    }
    return '';
  }

  // === MÉTRIQUES ET STATISTIQUES ===

  private calculateStats(): KanbanStats {
    const allCandidatures = this.candidatureService.getAllCandidatures();
    const today = new Date().toDateString();

    return {
      totalCandidatures: allCandidatures.length,
      conversionRates: this.calculateColumnConversions(),
      averageTimePerStage: this.calculateAverageTimePerStage(),
      progressToday: allCandidatures.filter(c =>
        new Date(c.date.split('/').reverse().join('-')).toDateString() === today
      ).length
    };
  }

  private calculateConversionRate(): number {
    const columns = this.columns();
    const total = columns.reduce((sum, col) => sum + col.candidatures.length, 0);
    const accepted = columns.find(col => col.id === 'finalise')?.candidatures.filter(c => c.reponse === 'Accepté').length || 0;
    return total > 0 ? Math.round((accepted / total) * 100) : 0;
  }

  private calculateColumnConversions(): { [key: string]: number } {
    // Logique améliorée pour calculer les taux de conversion
    const columns = this.columns();
    const conversions: { [key: string]: number } = {};

    columns.forEach(column => {
      const nextColumn = this.getNextColumn(column.id);
      if (nextColumn) {
        const currentCount = column.candidatures.length;
        const nextCount = nextColumn.candidatures.length;
        if (currentCount > 0) {
          conversions[column.id] = Math.round((nextCount / (currentCount + nextCount)) * 100);
        }
      }
    });

    return conversions;
  }

  private calculateAverageTimePerStage(): { [key: string]: number } {
    // Calcul simplifié - dans une vraie app, on trackrait les mouvements
    return {
      'brouillon': 2,
      'envoyee': 7,
      'en-attente': 14,
      'en-discussion': 10,
      'finalise': 0
    };
  }

  averageTimeInPipeline(): number {
    const times = Object.values(this.calculateAverageTimePerStage());
    return Math.round(times.reduce((sum, time) => sum + time, 0) / times.length);
  }

  getColumnMetrics(columnId: string) {
    const averageTimes = this.calculateAverageTimePerStage();
    const conversions = this.calculateColumnConversions();

    return {
      avgDays: averageTimes[columnId] || 0,
      conversionRate: conversions[columnId] || 0
    };
  }

  getPerformanceColor(): string {
    const rate = this.conversionRate();
    if (rate >= 15) return 'primary';
    if (rate >= 8) return 'accent';
    return 'warn';
  }

  // === ALERTES ET NOTIFICATIONS ===

  hasActiveAlerts(): boolean {
    return this.getAlertCount() > 0;
  }

  getAlertCount(): number {
    const candidatures = this.candidatureService.getAllCandidatures();
    return candidatures.filter(c =>
      this.isOverdue(c) ||
      (this.isUrgent(c) && c.reponse !== 'Accepté' && c.reponse !== 'Refus')
    ).length;
  }

  getAlertMessage(): string {
    const overdueCount = this.candidatureService.getAllCandidatures().filter(c => this.isOverdue(c)).length;
    const urgentCount = this.urgentCandidatures().length;

    if (overdueCount > 0 && urgentCount > 0) {
      return `${overdueCount} rappel(s) en retard, ${urgentCount} candidature(s) urgente(s)`;
    } else if (overdueCount > 0) {
      return `${overdueCount} rappel(s) de candidature en retard`;
    } else if (urgentCount > 0) {
      return `${urgentCount} candidature(s) urgente(s) à traiter`;
    }
    return '';
  }

  handleAlerts(): void {
    // Ouvrir une vue pour traiter toutes les alertes
    const alertCandidatures = this.candidatureService.getAllCandidatures().filter(c =>
      this.isOverdue(c) || this.isUrgent(c)
    );

    if (alertCandidatures.length > 0) {
      // Navigation vers la liste avec filtre des alertes
      this.router.navigate(['/candidatures'], {
        queryParams: { filter: 'alerts' }
      });
    }
  }

  // === ACTIONS CONTEXTUELLES ===

  getContextualQuickActions(candidature: Candidature, columnId: string): QuickAction[] {
    const baseActions = [...this.quickActions];

    // Ajouter des actions spécifiques selon la colonne
    switch (columnId) {
      case 'brouillon':
        return baseActions.filter(a => ['mark-sent', 'priority-high', 'add-note'].includes(a.id));
      case 'envoyee':
        return baseActions.filter(a => ['reminder-week', 'priority-high', 'add-note'].includes(a.id));
      case 'en-attente':
        return baseActions.filter(a => ['schedule-interview', 'reminder-week', 'add-note'].includes(a.id));
      case 'en-discussion':
        return baseActions.filter(a => ['schedule-interview', 'add-note'].includes(a.id));
      default:
        return baseActions;
    }
  }

  // === ACTIONS RAPIDES AMÉLIORÉES ===

  private setHighPriority(candidature: Candidature): void {
    candidature.ranking = 1;
    this.candidatureService.updateCandidature(candidature);
    this.showSuccessMessage(`${candidature.entreprise} marquée comme prioritaire`);

    // Créer une notification
    this.notificationService.addSystemNotification({
      type: 'info',
      title: 'Candidature prioritaire',
      message: `${candidature.entreprise} a été marquée comme prioritaire`,
      candidatureId: candidature.id
    });
  }

  private setReminderInWeek(candidature: Candidature): void {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    candidature.dateRappel = this.formatDateToFr(nextWeek);
    candidature.delaiRappel = '1 semaine';
    this.candidatureService.updateCandidature(candidature);
    this.showSuccessMessage(`Rappel programmé pour ${candidature.entreprise}`);
  }

  private markAsSent(candidature: Candidature): void {
    candidature.reponse = 'Envoyée';
    this.candidatureService.updateCandidature(candidature);
    this.showSuccessMessage(`${candidature.entreprise} marquée comme envoyée`);
  }

  private scheduleInterview(candidature: Candidature): void {
    // Créer un rappel pour préparer l'entretien
    const interviewDate = new Date();
    interviewDate.setDate(interviewDate.getDate() + 3);

    this.notificationService.addManualReminder({
      title: `Entretien ${candidature.entreprise}`,
      description: `Préparer l'entretien pour le poste ${candidature.poste}`,
      reminderDate: interviewDate
    });

    candidature.reponse = 'En discussion';
    this.candidatureService.updateCandidature(candidature);
    this.showSuccessMessage(`Entretien programmé pour ${candidature.entreprise}`);
  }

  private addNote(candidature: Candidature): void {
    // Ouvrir le dialog d'édition focalisé sur les commentaires
    this.editCandidature(candidature);
  }

  // === ACTIONS EN LOT ===

  sortColumn(columnId: string, sortBy: 'priority' | 'date'): void {
    const column = this.columns().find(col => col.id === columnId);
    if (!column) return;

    const sorted = [...column.candidatures].sort((a, b) => {
      if (sortBy === 'priority') {
        return a.ranking - b.ranking;
      } else {
        const dateA = this.parseDateFr(a.date);
        const dateB = this.parseDateFr(b.date);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      }
    });

    column.candidatures = sorted;
    this.columns.update(cols => [...cols]);
    this.showSuccessMessage(`Colonne ${column.title} triée par ${sortBy === 'priority' ? 'priorité' : 'date'}`);
  }

  bulkActionColumn(columnId: string, action: 'set-reminder' | 'mark-priority'): void {
    const column = this.columns().find(col => col.id === columnId);
    if (!column) return;

    let count = 0;
    column.candidatures.forEach(candidature => {
      if (action === 'set-reminder' && !candidature.dateRappel) {
        this.setReminderInWeek(candidature);
        count++;
      } else if (action === 'mark-priority' && candidature.ranking !== 1) {
        this.setHighPriority(candidature);
        count++;
      }
    });

    if (count > 0) {
      this.showSuccessMessage(`${count} candidature(s) mises à jour dans ${column.title}`);
    }
  }

  cleanupOldData(): void {
    const candidatures = this.candidatureService.getAllCandidatures();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const toRemove = candidatures.filter(c => {
      const candidatureDate = this.parseDateFr(c.date);
      return candidatureDate &&
             candidatureDate < sixMonthsAgo &&
             (c.reponse === 'Refus' || c.reponse === 'Accepté');
    });

    if (toRemove.length > 0) {
      const confirmDelete = confirm(`Supprimer ${toRemove.length} candidatures anciennes (plus de 6 mois) ?`);
      if (confirmDelete) {
        toRemove.forEach(c => this.candidatureService.deleteCandidature(c.id));
        this.showSuccessMessage(`${toRemove.length} candidatures anciennes supprimées`);
      }
    } else {
      this.showSuccessMessage('Aucune donnée ancienne à nettoyer');
    }
  }

  // === MÉTHODES UTILITAIRES ===

  private getUrgentCandidatures(): Candidature[] {
    return this.candidatureService.getAllCandidatures().filter(c => this.isUrgent(c));
  }

  private isUrgent(candidature: Candidature): boolean {
    return candidature.ranking === 1 || this.isOverdue(candidature);
  }

  private isOverdue(candidature: Candidature): boolean {
    if (!candidature.dateRappel) return false;
    const reminderDate = this.parseDateFr(candidature.dateRappel);
    if (!reminderDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    reminderDate.setHours(0, 0, 0, 0);

    return reminderDate < today;
  }

  private getNextColumn(columnId: string): KanbanColumn | undefined {
    const order = ['brouillon', 'envoyee', 'en-attente', 'en-discussion', 'finalise'];
    const currentIndex = order.indexOf(columnId);
    if (currentIndex >= 0 && currentIndex < order.length - 1) {
      return this.columns().find(col => col.id === order[currentIndex + 1]);
    }
    return undefined;
  }

  getEmptyColumnMessage(columnId: string): string {
    const messages = {
      'brouillon': 'Commencez par créer vos brouillons de candidatures',
      'envoyee': 'Aucune candidature envoyée pour le moment',
      'en-attente': 'Aucune réponse en attente',
      'en-discussion': 'Aucun entretien en cours',
      'finalise': 'Aucune candidature finalisée'
    };
    return messages[columnId as keyof typeof messages] || 'Aucune candidature';
  }

  getAddButtonText(columnId: string): string {
    const texts = {
      'brouillon': 'Créer un brouillon',
      'envoyee': 'Ajouter une envoyée',
      'en-attente': 'Ajouter en attente',
      'en-discussion': 'Ajouter en discussion',
      'finalise': 'Ajouter finalisée'
    };
    return texts[columnId as keyof typeof texts] || 'Ajouter ici';
  }

  getAutomationSuggestion(columnId: string): { text: string; action: string } | null {
    if (columnId === 'brouillon') {
      return {
        text: 'Créer automatiquement des brouillons depuis Indeed ?',
        action: 'auto-create-drafts'
      };
    }
    return null;
  }

  applyAutomationSuggestion(suggestion: { text: string; action: string }): void {
    this.showSuccessMessage('Fonctionnalité à venir : ' + suggestion.text);
  }

  getOldestInColumn(columnId: string): number {
    const column = this.columns().find(col => col.id === columnId);
    if (!column || column.candidatures.length === 0) return 0;

    const today = new Date();
    let maxDays = 0;

    column.candidatures.forEach(candidature => {
      const candidatureDate = this.parseDateFr(candidature.date);
      if (candidatureDate) {
        const days = Math.floor((today.getTime() - candidatureDate.getTime()) / (1000 * 60 * 60 * 24));
        maxDays = Math.max(maxDays, days);
      }
    });

    return maxDays;
  }

  getUrgentInColumn(columnId: string): number {
    const column = this.columns().find(col => col.id === columnId);
    if (!column) return 0;
    return column.candidatures.filter(c => this.isUrgent(c)).length;
  }

  getSuccessIcon(): string {
    const message = this.successMessage();
    if (message.includes('prioritaire')) return 'priority_high';
    if (message.includes('rappel') || message.includes('programmé')) return 'event_available';
    if (message.includes('envoyée')) return 'send';
    if (message.includes('accepté') || message.includes('Accepté')) return 'celebration';
    return 'check_circle';
  }

  // === DRAG & DROP AMÉLIORÉ ===

  drop(event: CdkDragDrop<Candidature[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const candidature = event.previousContainer.data[event.previousIndex];
      const targetColumnId = event.container.id;

      if (this.canMoveTo(candidature, targetColumnId)) {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );

        this.updateCandidatureStatus(candidature, targetColumnId);
        this.showSuccessMessage(`${candidature.entreprise} déplacée vers ${this.getColumnTitle(targetColumnId)}`);

        // Automatisation post-déplacement
        this.handlePostMoveAutomation(candidature, targetColumnId);

        if (targetColumnId === 'finalise' && candidature.reponse === 'Accepté') {
          this.triggerCelebration(candidature);
        }
      } else {
        this.showErrorMessage('Déplacement non autorisé');
      }
    }
  }

  canDrop = (drag: any, drop: any) => {
    const candidature = drag.data as Candidature;
    const targetColumnId = drop.id;
    return this.canMoveTo(candidature, targetColumnId);
  };

  private canMoveTo(candidature: Candidature, targetColumnId: string): boolean {
    const targetColumn = this.columns().find(col => col.id === targetColumnId);

    // Vérifier la limite stricte
    if (targetColumn?.maxItems && targetColumn.candidatures.length >= targetColumn.maxItems) {
      this.showErrorMessage(`Limite atteinte pour ${targetColumn.title} (${targetColumn.maxItems} max)`);
      return false;
    }

    // Logique métier améliorée
    const currentColumnId = STATUS_TO_COLUMN_MAP[candidature.reponse];
    const columnOrder = ['brouillon', 'envoyee', 'en-attente', 'en-discussion', 'finalise'];
    const currentIndex = columnOrder.indexOf(currentColumnId);
    const targetIndex = columnOrder.indexOf(targetColumnId);

    // Permettre tous les mouvements logiques
    if (targetIndex === currentIndex + 1) return true; // Progression normale
    if (targetIndex === currentIndex - 1) return true; // Retour d'une étape
    if (targetColumnId === 'finalise') return true; // Toujours permettre vers finalisé
    if (currentColumnId === 'finalise' && targetIndex < 4) return true; // Sortir de finalisé

    return false;
  }

  private handlePostMoveAutomation(candidature: Candidature, targetColumnId: string): void {
    switch (targetColumnId) {
      case 'envoyee':
        // Créer automatiquement un rappel dans 1 semaine
        if (!candidature.dateRappel) {
          this.setReminderInWeek(candidature);
        }
        break;
      case 'en-discussion':
        // Créer un rappel pour préparer l'entretien
        this.notificationService.addSystemNotification({
          type: 'info',
          title: 'Préparer l\'entretien',
          message: `N'oubliez pas de préparer l'entretien avec ${candidature.entreprise}`,
          candidatureId: candidature.id
        });
        break;
      case 'finalise':
        if (candidature.reponse === 'Accepté') {
          this.notificationService.addSystemNotification({
            type: 'succes',
            title: 'Félicitations !',
            message: `Candidature acceptée chez ${candidature.entreprise} !`,
            candidatureId: candidature.id
          });
        }
        break;
    }
  }

  private triggerCelebration(candidature: Candidature): void {
    this.showSuccessMessage(`🎉 Félicitations ! Candidature acceptée chez ${candidature.entreprise} !`);
    // Ici, on pourrait ajouter des confettis ou d'autres effets visuels
    console.log('🎉 CELEBRATION! Candidature acceptée!', candidature);
  }

  // === MÉTHODES EXISTANTES CONSERVÉES ===

  private updateCandidatureStatus(candidature: Candidature, columnId: string): void {
    const newStatuses = COLUMN_TO_STATUS_MAP[columnId];
    if (newStatuses && newStatuses.length > 0) {
      if (columnId === 'finalise' && (candidature.reponse === 'Refus' || candidature.reponse === 'Accepté')) {
        // Garder le statut actuel
      } else {
        candidature.reponse = newStatuses[0] as any;
      }
      this.candidatureService.updateCandidature(candidature);
    }
  }

  private getColumnTitle(columnId: string): string {
    return this.columns().find(col => col.id === columnId)?.title || columnId;
  }

  onDragStart(candidature: Candidature): void {
    this.draggingCandidature.set(candidature);
  }

  onDragEnd(): void {
    this.draggingCandidature.set(null);
  }

  addNewCandidature(): void {
    const dialogRef = this.dialog.open(CandidatureDialogComponent, {
      width: 'clamp(300px, 90vw, 800px)',
      maxWidth: '95vw',
      data: { candidature: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.candidatureService.addCandidature(result);
        this.showSuccessMessage('Nouvelle candidature ajoutée !');
      }
    });
  }

  addCandidatureToColumn(columnId: string): void {
    const defaultStatuses = COLUMN_TO_STATUS_MAP[columnId];
    const defaultStatus = defaultStatuses ? defaultStatuses[0] : 'Brouillon';

    const dialogRef = this.dialog.open(CandidatureDialogComponent, {
      width: 'clamp(300px, 90vw, 800px)',
      maxWidth: '95vw',
      data: {
        candidature: null,
        defaultStatus: defaultStatus
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        result.reponse = defaultStatus;
        this.candidatureService.addCandidature(result);
        this.showSuccessMessage(`Candidature ajoutée dans ${this.getColumnTitle(columnId)} !`);
      }
    });
  }

  canAddToColumn(columnId: string): boolean {
    return true; // Permettre l'ajout dans toutes les colonnes
  }

  editCandidature(candidature: Candidature): void {
    const dialogRef = this.dialog.open(CandidatureDialogComponent, {
      width: 'clamp(300px, 90vw, 800px)',
      maxWidth: '95vw',
      data: { candidature: { ...candidature } }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.candidatureService.updateCandidature(result);
        this.showSuccessMessage('Candidature mise à jour !');
      }
    });
  }

  viewCandidatureDetails(candidature: Candidature): void {
    this.router.navigate(['/candidatures', candidature.id]);
  }

  executeQuickAction(event: { action: QuickAction; candidature: Candidature }): void {
    event.action.action(event.candidature);
  }

  toggleView(): void {
    this.router.navigate(['/candidatures']);
  }

  exportData(): void {
    const csvContent = this.candidatureService.exportToCSV();
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kanban_candidatures_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.showSuccessMessage('Données exportées en CSV');
  }

  refreshData(): void {
    this.loadData();
    this.showSuccessMessage('Données actualisées');
  }

  showStats(): void {
    const stats = this.stats();
    this.snackBar.open(
      `${stats.totalCandidatures} candidatures • Taux de conversion: ${this.conversionRate()}% • Moyenne: ${this.averageTimeInPipeline()}j`,
      'Fermer',
      { duration: 5000 }
    );
  }

  // Feedback visuel
  private showSuccessMessage(message: string): void {
    this.successMessage.set(message);
    if (this.successTimeout) clearTimeout(this.successTimeout);
    this.successTimeout = window.setTimeout(() => {
      this.successMessage.set('');
    }, 3000);
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  // Méthodes utilitaires
  private parseDateFr(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  }

  private formatDateToFr(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  trackByColumn(index: number, column: KanbanColumn): string {
    return column.id;
  }

  trackByCandidature(index: number, candidature: Candidature): number {
    return candidature.id;
  }
}
