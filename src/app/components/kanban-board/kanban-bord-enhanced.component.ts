// src/app/components/kanban-board/kanban-board.component.ts - VERSION VERTICALE
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
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

import { Candidature } from '../../models/candidature.model';
import { KanbanColumn, KanbanStats, QuickAction, KANBAN_COLUMNS_CONFIG, STATUS_TO_COLUMN_MAP, COLUMN_TO_STATUS_MAP } from '../../models/kanban.model';
import { CandidatureService } from '../../services/candidature.service';
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
    CandidatureCardComponent
  ],
  template: `
    <div class="kanban-container">
      <!-- Header avec stats et actions -->
      <div class="kanban-header">
        <div class="header-info">
          <h1>
            <mat-icon>view_agenda</mat-icon>
            Pipeline des Candidatures (Vue Verticale)
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
            </mat-chip-set>
          </div>
        </div>

        <div class="header-actions">
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
          </mat-menu>
        </div>
      </div>

      <!-- Indicateur de performance -->
      <div class="performance-indicator" *ngIf="conversionRate() > 0">
        <mat-progress-bar mode="determinate" [value]="conversionRate()" color="accent"></mat-progress-bar>
        <span class="conversion-text">Taux de conversion: {{ conversionRate() }}%</span>
      </div>

      <!-- Colonnes Kanban - Version verticale -->
      <div class="kanban-board"
           cdkDropListGroup
           [@slideIn]="columns().length"
           [class.loading]="isLoading()">

        <div *ngFor="let column of columns(); trackBy: trackByColumn"
             class="kanban-column"
             [style.--column-color]="column.color"
             [style.--column-color-rgb]="getColorRGB(column.color)">

          <!-- En-tête de colonne -->
          <div class="column-header">
            <div class="column-info">
              <div class="column-title-section">
                <mat-icon [style.color]="column.color">{{ column.icon }}</mat-icon>
                <h3>{{ column.title }}</h3>
                <span class="column-count">{{ column.candidatures.length }}</span>
              </div>
              <p class="column-description">{{ column.description }}</p>
            </div>

            <!-- Indicateurs de colonne -->
            <div class="column-indicators">
              <div class="conversion-indicator" *ngIf="getColumnConversion(column.id) > 0">
                {{ getColumnConversion(column.id) }}% conv.
              </div>
              <div class="limit-indicator"
                   *ngIf="column.maxItems && column.candidatures.length >= column.maxItems"
                   matTooltip="Limite atteinte">
                <mat-icon>warning</mat-icon>
              </div>
            </div>
          </div>

          <!-- Zone de drop - Version horizontale pour chaque ligne -->
          <div class="column-content"
               cdkDropList
               [cdkDropListData]="column.candidatures"
               [id]="column.id"
               [cdkDropListOrientation]="'horizontal'"
               (cdkDropListDropped)="drop($event)"
               [cdkDropListEnterPredicate]="canDrop">

            <!-- Message si vide -->
            <div *ngIf="column.candidatures.length === 0" class="empty-column">
              <mat-icon [style.color]="column.color">{{ column.icon }}</mat-icon>
              <p>Aucune candidature dans {{ column.title.toLowerCase() }}</p>
              <button mat-stroked-button
                      *ngIf="column.id === 'brouillon'"
                      (click)="addNewCandidature()"
                      class="add-first-btn">
                <mat-icon>add</mat-icon>
                Ajouter la première
              </button>
            </div>

            <!-- Cartes des candidatures -->
            <div *ngFor="let candidature of column.candidatures; trackBy: trackByCandidature"
                 cdkDrag
                 [cdkDragData]="candidature"
                 class="drag-item"
                 (cdkDragStarted)="onDragStart(candidature)"
                 (cdkDragEnded)="onDragEnd()">

              <app-candidature-card
                [candidature]="candidature"
                [quickActions]="quickActions"
                [isDragging]="draggingCandidature() === candidature"
                (edit)="editCandidature($event)"
                (viewDetails)="viewCandidatureDetails($event)"
                (quickAction)="executeQuickAction($event)">
              </app-candidature-card>
            </div>
          </div>

          <!-- Footer avec actions rapides -->
          <div class="column-footer" *ngIf="column.candidatures.length > 0 || canAddToColumn(column.id)">
            <button mat-button
                    *ngIf="canAddToColumn(column.id)"
                    (click)="addCandidatureToColumn(column.id)"
                    class="add-to-column-btn">
              <mat-icon>add</mat-icon>
              Ajouter dans {{ column.title.toLowerCase() }}
            </button>
          </div>
        </div>
      </div>

      <!-- Message de succès pour feedback -->
      <div *ngIf="successMessage()"
           class="success-overlay"
           [@fadeInOut]>
        <div class="success-content">
          <mat-icon>check_circle</mat-icon>
          <span>{{ successMessage() }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./kanban-bord-enhanced.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        query('.kanban-column', [
          style({ opacity: 0, transform: 'translateX(-50px)' }),
          stagger(100, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
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
export class KanbanBoardEnhancedComponent implements OnInit, OnDestroy {
  columns = signal<KanbanColumn[]>([]);
  isLoading = signal(false);
  draggingCandidature = signal<Candidature | null>(null);
  successMessage = signal<string>('');

  stats = computed(() => this.calculateStats());
  conversionRate = computed(() => this.calculateConversionRate());

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
    }
  ];

  private successTimeout?: number;

  constructor(
    private candidatureService: CandidatureService,
    private router: Router,
    private titleService: Title,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // Effect pour synchroniser les données
    effect(() => {
      const candidatures = this.candidatureService.candidatures();
      this.updateColumns(candidatures);
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('Kanban Board Vertical - ProTrack CV');
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

  private loadData(): void {
    this.isLoading.set(true);

    // Simuler un petit délai pour l'animation
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
  }

  private calculateStats(): KanbanStats {
    const allCandidatures = this.candidatureService.getAllCandidatures();
    const today = new Date().toDateString();

    return {
      totalCandidatures: allCandidatures.length,
      conversionRates: this.calculateColumnConversions(),
      averageTimePerStage: {},
      progressToday: allCandidatures.filter(c =>
        new Date(c.date.split('/').reverse().join('-')).toDateString() === today
      ).length
    };
  }

  private calculateConversionRate(): number {
    const columns = this.columns();
    const total = columns.reduce((sum, col) => sum + col.candidatures.length, 0);
    const finalized = columns.find(col => col.id === 'finalise')?.candidatures.length || 0;
    const accepted = columns.find(col => col.id === 'finalise')?.candidatures.filter(c => c.reponse === 'Accepté').length || 0;

    return total > 0 ? Math.round((accepted / total) * 100) : 0;
  }

  private calculateColumnConversions(): { [key: string]: number } {
    // Logique simplifiée - dans une vraie app, on trackrait les mouvements
    return {};
  }

  getColumnConversion(columnId: string): number {
    return this.stats().conversionRates[columnId] || 0;
  }

  // Utilitaire pour convertir couleur hex en RGB pour CSS
  getColorRGB(hexColor: string): string {
    // Convertir #RRGGBB en "R, G, B"
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `${r}, ${g}, ${b}`;
  }

  // Drag & Drop - Adapté pour la version verticale
  drop(event: CdkDragDrop<Candidature[]>): void {
    if (event.previousContainer === event.container) {
      // Réorganisation dans la même colonne (horizontal)
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Déplacement entre colonnes (vertical)
      const candidature = event.previousContainer.data[event.previousIndex];
      const targetColumnId = event.container.id;

      if (this.canMoveTo(candidature, targetColumnId)) {
        // Transférer l'item
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );

        // Mettre à jour le statut
        this.updateCandidatureStatus(candidature, targetColumnId);

        // Feedback visuel
        this.showSuccessMessage(`${candidature.entreprise} déplacée vers ${this.getColumnTitle(targetColumnId)}`);

        // Effet confetti si déplacé vers "finalisé"
        if (targetColumnId === 'finalise' && candidature.reponse === 'Accepté') {
          this.triggerConfetti();
        }
      } else {
        // Annuler le déplacement
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

    // Vérifier la limite de la colonne
    if (targetColumn?.maxItems && targetColumn.candidatures.length >= targetColumn.maxItems) {
      return false;
    }

    // Logique métier: on ne peut pas revenir en arrière (sauf cas spéciaux)
    const currentColumnId = STATUS_TO_COLUMN_MAP[candidature.reponse];
    const columnOrder = ['brouillon', 'envoyee', 'en-attente', 'en-discussion', 'finalise'];
    const currentIndex = columnOrder.indexOf(currentColumnId);
    const targetIndex = columnOrder.indexOf(targetColumnId);

    // Permettre de revenir en arrière seulement de 1 étape ou d'aller vers finalisé
    return targetIndex >= currentIndex - 1;
  }

  private updateCandidatureStatus(candidature: Candidature, columnId: string): void {
    const newStatuses = COLUMN_TO_STATUS_MAP[columnId];
    if (newStatuses && newStatuses.length > 0) {
      // Pour 'finalise', on garde le statut actuel s'il est déjà Refus ou Accepté
      if (columnId === 'finalise' && (candidature.reponse === 'Refus' || candidature.reponse === 'Accepté')) {
        // Ne pas changer le statut
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

  // Actions
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
    return columnId === 'brouillon' || columnId === 'envoyee';
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

  // Quick Actions
  private setHighPriority(candidature: Candidature): void {
    candidature.ranking = 1;
    this.candidatureService.updateCandidature(candidature);
    this.showSuccessMessage('Candidature marquée comme prioritaire');
  }

  private setReminderInWeek(candidature: Candidature): void {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    candidature.dateRappel = nextWeek.toLocaleDateString('fr-FR');
    candidature.delaiRappel = '1 semaine';
    this.candidatureService.updateCandidature(candidature);
    this.showSuccessMessage('Rappel programmé dans 1 semaine');
  }

  private markAsSent(candidature: Candidature): void {
    candidature.reponse = 'Envoyée';
    this.candidatureService.updateCandidature(candidature);
    this.showSuccessMessage('Candidature marquée comme envoyée');
  }

  // Autres actions
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
      `${stats.totalCandidatures} candidatures • Taux de conversion: ${this.conversionRate()}%`,
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

  private triggerConfetti(): void {
    // Effet confetti simple - dans une vraie app, on utiliserait une lib comme canvas-confetti
    console.log('🎉 Confetti! Candidature acceptée!');
  }

  // Track by functions
  trackByColumn(index: number, column: KanbanColumn): string {
    return column.id;
  }

  trackByCandidature(index: number, candidature: Candidature): number {
    return candidature.id;
  }
}
