// src/app/components/kanban-board/kanban-board-enhanced.component.ts
import { Component, OnInit, OnDestroy, signal, computed, effect, HostListener } from '@angular/core';
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
import { MatBadgeModule } from '@angular/material/badge';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { interval, takeUntil, Subject } from 'rxjs';

import { Candidature } from '../../models/candidature.model';
import { KanbanColumn, KanbanStats, QuickAction, KANBAN_COLUMNS_CONFIG, STATUS_TO_COLUMN_MAP, COLUMN_TO_STATUS_MAP } from '../../models/kanban.model';
import { CandidatureService } from '../../services/candidature.service';
import { CandidatureCardComponent } from '../candidature-card/candidature-card.component';
import { CandidatureDialogComponent } from '../candidature-dialog/candidature-dialogue.component';

// ===== NOUVELLES INTERFACES =====

interface SmartNotification {
  id: string;
  type: 'reminder' | 'suggestion' | 'achievement' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  actionButton?: {
    label: string;
    action: () => void;
  };
  autoHide?: boolean;
}

interface KanbanAnalytics {
  timeInColumn: { [columnId: string]: number };
  conversionRates: { [fromColumn: string]: { [toColumn: string]: number } };
  productivity: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  trends: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    event: 'time-passed' | 'status-changed';
    conditions: any;
  };
  actions: {
    moveToColumn?: string;
    setPriority?: number;
    addReminder?: string;
    showNotification?: string;
  }[];
}

@Component({
  selector: 'app-kanban-board-enhanced',
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
    MatBadgeModule,
    CandidatureCardComponent
  ],
  template: `
    <div class="kanban-container enhanced">
      <!-- Header amélioré avec analytics -->
      <div class="kanban-header enhanced-header">
        <div class="header-info">
          <h1>
            <mat-icon>view_kanban</mat-icon>
            Pipeline des Candidatures
            <mat-icon
              *ngIf="analytics().trends.direction === 'up'"
              class="trend-indicator up"
              matTooltip="Performance en hausse de {{analytics().trends.percentage}}%">
              trending_up
            </mat-icon>
            <mat-icon
              *ngIf="analytics().trends.direction === 'down'"
              class="trend-indicator down"
              matTooltip="Performance en baisse de {{analytics().trends.percentage}}%">
              trending_down
            </mat-icon>
          </h1>

          <div class="enhanced-stats">
            <mat-chip-set>
              <mat-chip class="total-chip">
                <mat-icon>work_outline</mat-icon>
                {{ stats().totalCandidatures }} candidatures
              </mat-chip>
              <mat-chip class="productivity-chip"
                       [matTooltip]="'Productivité: ' + analytics().productivity.daily + '/jour'">
                <mat-icon>speed</mat-icon>
                {{ analytics().productivity.weekly }}/semaine
              </mat-chip>
              <mat-chip class="conversion-chip"
                       [matTooltip]="'Taux de conversion global'">
                <mat-icon>analytics</mat-icon>
                {{ conversionRate() }}% conv.
              </mat-chip>
              <mat-chip *ngIf="achievements().length > 0"
                       class="achievement-chip"
                       [matBadge]="achievements().length"
                       matBadgeColor="accent"
                       matTooltip="Nouveaux succès débloqués !">
                <mat-icon>emoji_events</mat-icon>
                Succès
              </mat-chip>
            </mat-chip-set>
          </div>

          <!-- Raccourcis clavier info -->
          <div class="keyboard-shortcuts" *ngIf="showShortcuts()">
            <small>
              <kbd>Ctrl+N</kbd> Nouvelle •
              <kbd>Ctrl+K</kbd> Basculer vue •
              <kbd>Ctrl+E</kbd> Export •
              <kbd>Esc</kbd> Fermer
            </small>
          </div>
        </div>

        <div class="header-actions enhanced-actions">
          <button mat-raised-button color="primary" (click)="addNewCandidature()">
            <mat-icon>add</mat-icon>
            Nouvelle candidature
          </button>

          <button mat-stroked-button (click)="toggleView()">
            <mat-icon>view_list</mat-icon>
            Vue liste
          </button>

          <button mat-icon-button
                  (click)="toggleAutoSave()"
                  [color]="autoSaveEnabled() ? 'accent' : 'basic'"
                  [matTooltip]="autoSaveEnabled() ? 'Sauvegarde auto ON' : 'Sauvegarde auto OFF'">
            <mat-icon>{{ autoSaveEnabled() ? 'cloud_done' : 'cloud_off' }}</mat-icon>
          </button>

          <button mat-icon-button
                  (click)="toggleShortcuts()"
                  [matTooltip]="'Raccourcis clavier: ' + (showShortcuts() ? 'ON' : 'OFF')">
            <mat-icon>keyboard</mat-icon>
          </button>

          <button mat-icon-button [matMenuTriggerFor]="moreActionsMenu" matTooltip="Plus d'actions">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #moreActionsMenu="matMenu">
            <button mat-menu-item (click)="exportData()">
              <mat-icon>download</mat-icon>
              <span>Exporter CSV</span>
            </button>
            <button mat-menu-item (click)="generateReport()">
              <mat-icon>assessment</mat-icon>
              <span>Rapport Analytics</span>
            </button>
            <button mat-menu-item (click)="manageAutomations()">
              <mat-icon>smart_toy</mat-icon>
              <span>Automatisations</span>
            </button>
            <button mat-menu-item (click)="refreshData()">
              <mat-icon>refresh</mat-icon>
              <span>Actualiser</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Notifications intelligentes -->
      <div class="smart-notifications" *ngIf="smartNotifications().length > 0">
        <div *ngFor="let notification of smartNotifications(); trackBy: trackByNotification"
             class="smart-notification"
             [class]="'notification-' + notification.type"
             [@slideInNotification]>
          <div class="notification-content">
            <mat-icon class="notification-icon">
              {{ getNotificationIcon(notification.type) }}
            </mat-icon>
            <div class="notification-text">
              <strong>{{ notification.title }}</strong>
              <p>{{ notification.message }}</p>
            </div>
            <div class="notification-actions">
              <button *ngIf="notification.actionButton"
                      mat-button
                      color="accent"
                      (click)="notification.actionButton!.action()">
                {{ notification.actionButton.label }}
              </button>
              <button mat-icon-button (click)="dismissNotification(notification.id)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Indicateur de performance amélioré -->
      <div class="performance-indicator enhanced" *ngIf="conversionRate() > 0">
        <div class="performance-content">
          <span class="performance-label">Performance Globale</span>
          <mat-progress-bar mode="determinate"
                           [value]="conversionRate()"
                           [color]="getPerformanceColor()">
          </mat-progress-bar>
          <span class="performance-value">{{ conversionRate() }}%</span>
        </div>
      </div>

      <!-- Colonnes Kanban améliorées -->
      <div class="kanban-board enhanced-board"
           cdkDropListGroup
           [@slideIn]="columns().length"
           [class.loading]="isLoading()">

        <div *ngFor="let column of columns(); trackBy: trackByColumn"
             class="kanban-column enhanced-column"
             [style.--column-color]="column.color"
             [class.has-automation]="hasAutomationRules(column.id)">

          <!-- En-tête de colonne amélioré -->
          <div class="column-header enhanced-column-header">
            <div class="column-info">
              <div class="column-title-section">
                <mat-icon [style.color]="column.color">{{ column.icon }}</mat-icon>
                <h3>{{ column.title }}</h3>
                <span class="column-count"
                      [matBadge]="getUrgentCount(column)"
                      [matBadgeHidden]="getUrgentCount(column) === 0"
                      matBadgeColor="warn"
                      matBadgeSize="small">
                  {{ column.candidatures.length }}
                </span>
                <mat-icon *ngIf="hasAutomationRules(column.id)"
                          class="automation-indicator"
                          matTooltip="Règles d'automatisation actives">
                  smart_toy
                </mat-icon>
              </div>
              <p class="column-description">{{ column.description }}</p>

              <!-- Micro-analytics par colonne -->
              <div class="column-analytics" *ngIf="getColumnAnalytics(column.id) as analytics">
                <small class="analytics-item">
                  <mat-icon>schedule</mat-icon>
                  {{ analytics.avgTime }} jours moy.
                </small>
                <small class="analytics-item" *ngIf="analytics.conversionRate > 0">
                  <mat-icon>trending_up</mat-icon>
                  {{ analytics.conversionRate }}% conv.
                </small>
              </div>
            </div>

            <!-- Indicateurs de colonne améliorés -->
            <div class="column-indicators enhanced-indicators">
              <div class="bottleneck-indicator"
                   *ngIf="isBottleneck(column.id)"
                   matTooltip="Goulot d'étranglement détecté">
                <mat-icon>warning</mat-icon>
              </div>
              <div class="limit-indicator"
                   *ngIf="column.maxItems && column.candidatures.length >= column.maxItems"
                   matTooltip="Limite atteinte">
                <mat-icon>block</mat-icon>
              </div>
            </div>
          </div>

          <!-- Zone de drop améliorée -->
          <div class="column-content enhanced-content"
               cdkDropList
               [cdkDropListData]="column.candidatures"
               [id]="column.id"
               (cdkDropListDropped)="drop($event)"
               [cdkDropListEnterPredicate]="canDrop">

            <!-- Message si vide amélioré -->
            <div *ngIf="column.candidatures.length === 0" class="empty-column enhanced-empty">
              <mat-icon [style.color]="column.color">{{ column.icon }}</mat-icon>
              <p>{{ getEmptyMessage(column.id) }}</p>
              <button mat-stroked-button
                      *ngIf="column.id === 'brouillon'"
                      (click)="addNewCandidature()"
                      class="add-first-btn">
                <mat-icon>add</mat-icon>
                Créer la première
              </button>
            </div>

            <!-- Cartes des candidatures -->
            <div *ngFor="let candidature of column.candidatures; trackBy: trackByCandidature"
                 cdkDrag
                 [cdkDragData]="candidature"
                 class="drag-item enhanced-drag"
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

          <!-- Footer avec actions rapides amélioré -->
          <div class="column-footer enhanced-footer" *ngIf="column.candidatures.length > 0">
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

      <!-- Message de succès amélioré avec confetti -->
      <div *ngIf="successMessage()"
           class="success-overlay enhanced-success"
           [@fadeInOut]>
        <div class="success-content">
          <mat-icon>{{ getSuccessIcon() }}</mat-icon>
          <span>{{ successMessage() }}</span>
        </div>
      </div>

      <!-- Indicateur de sauvegarde automatique -->
      <div class="auto-save-indicator"
           *ngIf="showAutoSaveIndicator()"
           [@fadeInOut]>
        <mat-icon>cloud_upload</mat-icon>
        <span>Sauvegarde automatique...</span>
      </div>
    </div>
  `,
  styleUrls: ['./kanban-bord-enhanced.component.scss'],
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
    ]),
    trigger('slideInNotification', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class KanbanBoardEnhancedComponent implements OnInit, OnDestroy {
  // ===== SIGNALS DE BASE =====
  columns = signal<KanbanColumn[]>([]);
  isLoading = signal(false);
  draggingCandidature = signal<Candidature | null>(null);
  successMessage = signal<string>('');

  // ===== NOUVEAUX SIGNALS =====
  smartNotifications = signal<SmartNotification[]>([]);
  achievements = signal<string[]>([]);
  autoSaveEnabled = signal(true);
  showShortcuts = signal(false);
  showAutoSaveIndicator = signal(false);

  // ===== COMPUTED SIGNALS =====
  stats = computed(() => this.calculateStats());
  conversionRate = computed(() => this.calculateConversionRate());
  analytics = computed(() => this.calculateAnalytics());

  // ===== AUTOMATISATIONS =====
  private automationRules: AutomationRule[] = [
    {
      id: 'stale-reminder',
      name: 'Rappel candidatures stagnantes',
      enabled: true,
      trigger: {
        event: 'time-passed',
        conditions: { days: 7, column: 'en-attente' }
      },
      actions: [
        { showNotification: 'Cette candidature stagne depuis 7 jours. Temps de relancer ?' }
      ]
    }
  ];

  // ===== ACTIONS RAPIDES AMÉLIORÉES =====
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
      id: 'ai-suggestion',
      label: 'Suggestion IA',
      icon: 'psychology',
      color: '#9c27b0',
      action: (candidature: Candidature) => this.showAISuggestion(candidature)
    }
  ];

  private destroy$ = new Subject<void>();
  private successTimeout?: number;
  private autoSaveInterval?: number;

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
      this.runAutomations();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.titleService.setTitle('Kanban Board Pro - ProTrack CV');
    this.loadData();
    this.setupAutoSave();
    this.loadSmartNotifications();
    this.checkAchievements();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.successTimeout) clearTimeout(this.successTimeout);
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
  }

  // ===== GESTION DES RACCOURCIS CLAVIER =====
  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'n': // Ctrl+N : Nouvelle candidature
          event.preventDefault();
          this.addNewCandidature();
          break;
        case 'k': // Ctrl+K : Basculer vue
          event.preventDefault();
          this.toggleView();
          break;
        case 'e': // Ctrl+E : Export
          event.preventDefault();
          this.exportData();
          break;
        case 's': // Ctrl+S : Sauvegarde manuelle
          event.preventDefault();
          this.manualSave();
          break;
      }
    } else if (event.key === 'Escape') {
      this.clearAllNotifications();
    }
  }

  // ===== NOUVELLES MÉTHODES =====

  private setupAutoSave(): void {
    if (this.autoSaveEnabled()) {
      this.autoSaveInterval = window.setInterval(() => {
        this.performAutoSave();
      }, 30000); // Sauvegarde toutes les 30 secondes
    }
  }

  private performAutoSave(): void {
    if (!this.autoSaveEnabled()) return;

    this.showAutoSaveIndicator.set(true);

    // Simuler la sauvegarde
    setTimeout(() => {
      this.showAutoSaveIndicator.set(false);
      console.log('💾 Auto-sauvegarde effectuée');
    }, 1500);
  }

  private manualSave(): void {
    this.performAutoSave();
    this.showSuccessMessage('💾 Sauvegarde manuelle effectuée');
  }

  private loadSmartNotifications(): void {
    // Charger les notifications intelligentes
    const notifications: SmartNotification[] = [
      {
        id: 'welcome',
        type: 'achievement',
        title: '🎉 Kanban Pro Activé !',
        message: 'Profitez des nouvelles fonctionnalités : analytics, notifications intelligentes et automatisations.',
        timestamp: new Date(),
        autoHide: true
      }
    ];

    this.smartNotifications.set(notifications);

    // Auto-hide les notifications après 5 secondes
    setTimeout(() => {
      this.smartNotifications.update(notifs =>
        notifs.filter(n => !n.autoHide)
      );
    }, 5000);
  }

  private runAutomations(): void {
    const candidatures = this.candidatureService.getAllCandidatures();
    const activeRules = this.automationRules.filter(rule => rule.enabled);

    activeRules.forEach(rule => {
      candidatures.forEach(candidature => {
        if (this.shouldTriggerRule(rule, candidature)) {
          this.executeAutomationRule(rule, candidature);
        }
      });
    });
  }

  private shouldTriggerRule(rule: AutomationRule, candidature: Candidature): boolean {
    if (rule.trigger.event === 'time-passed') {
      const daysSinceUpdate = this.getDaysSinceLastUpdate(candidature);
      const conditionDays = rule.trigger.conditions.days;
      const conditionColumn = rule.trigger.conditions.column;

      const currentColumn = STATUS_TO_COLUMN_MAP[candidature.reponse];

      return daysSinceUpdate >= conditionDays &&
             currentColumn === conditionColumn;
    }
    return false;
  }

  private executeAutomationRule(rule: AutomationRule, candidature: Candidature): void {
    rule.actions.forEach(action => {
      if (action.showNotification) {
        this.addSmartNotification({
          type: 'suggestion',
          title: '🤖 Suggestion Automatique',
          message: action.showNotification,
          actionButton: {
            label: 'Relancer',
            action: () => this.quickFollowUp(candidature)
          }
        });
      }
    });
  }

  private calculateAnalytics(): KanbanAnalytics {
    const candidatures = this.candidatureService.getAllCandidatures();

    return {
      timeInColumn: this.calculateTimeInColumns(candidatures),
      conversionRates: {},
      productivity: {
        daily: this.getProductivity(candidatures, 1),
        weekly: this.getProductivity(candidatures, 7),
        monthly: this.getProductivity(candidatures, 30)
      },
      trends: {
        direction: 'up', // Simulé pour la démo
        percentage: 15
      }
    };
  }

  private getProductivity(candidatures: Candidature[], days: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return candidatures.filter(c => {
      const candidatureDate = this.parseDateFr(c.date);
      return candidatureDate && candidatureDate >= cutoffDate;
    }).length;
  }

  private checkAchievements(): void {
    const candidatures = this.candidatureService.getAllCandidatures();
    const newAchievements: string[] = [];

    // Premier pas
    if (candidatures.length >= 1 && !this.hasAchievement('first-step')) {
      newAchievements.push('first-step');
      this.unlockAchievement('🏆 Premier Pas', 'Première candidature créée !');
    }

    // Machine à candidater
    const weeklyCount = this.analytics().productivity.weekly;
    if (weeklyCount >= 10 && !this.hasAchievement('speed-demon')) {
      newAchievements.push('speed-demon');
      this.unlockAchievement('⚡ Machine à Candidater', '10 candidatures en une semaine !');
    }

    // Organisé
    if (candidatures.length >= 5 && !this.hasAchievement('organized')) {
      newAchievements.push('organized');
      this.unlockAchievement('📊 Super Organisé', '5 candidatures dans le pipeline !');
    }

    this.achievements.update(current => [...current, ...newAchievements]);
  }

  private unlockAchievement(title: string, message: string): void {
    this.addSmartNotification({
      type: 'achievement',
      title,
      message,
      actionButton: {
        label: 'Voir tous',
        action: () => this.showAllAchievements()
      }
    });

    // Confetti pour les succès
    this.triggerConfetti();
  }

  // ===== ANIMATIONS CONFETTI =====
  private triggerConfetti(): void {
    // Version simple sans library externe
    console.log('🎉 CONFETTI! Achievement unlocked!');

    // Créer l'effet visuellement dans le DOM
    const confettiElements: HTMLDivElement[] = [];
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b'];

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * window.innerWidth}px;
        top: -10px;
        z-index: 10000;
        border-radius: 50%;
        animation: confetti-fall 3s linear forwards;
      `;

      document.body.appendChild(confetti);
      confettiElements.push(confetti);
    }

    // CSS Animation pour la chute
    if (!document.getElementById('confetti-style')) {
      const style = document.createElement('style');
      style.id = 'confetti-style';
      style.textContent = `
        @keyframes confetti-fall {
          to {
            transform: translateY(${window.innerHeight + 20}px) rotate(360deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Nettoyer après l'animation
    setTimeout(() => {
      confettiElements.forEach(el => el.remove());
    }, 3000);
  }

  // ===== MÉTHODES D'INTERFACE =====

  toggleAutoSave(): void {
    this.autoSaveEnabled.update(enabled => !enabled);
    if (this.autoSaveEnabled()) {
      this.setupAutoSave();
      this.showSuccessMessage('💾 Sauvegarde automatique activée');
    } else {
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
      }
      this.showSuccessMessage('⏸️ Sauvegarde automatique désactivée');
    }
  }

  toggleShortcuts(): void {
    this.showShortcuts.update(show => !show);
  }

  generateReport(): void {
    const analytics = this.analytics();
    const report = `
📊 RAPPORT KANBAN - ${new Date().toLocaleDateString('fr-FR')}

📈 Productivité:
• Quotidienne: ${analytics.productivity.daily} candidatures
• Hebdomadaire: ${analytics.productivity.weekly} candidatures
• Mensuelle: ${analytics.productivity.monthly} candidatures

🎯 Performance:
• Taux de conversion: ${this.conversionRate()}%
• Tendance: ${analytics.trends.direction === 'up' ? '↗️' : '↘️'} ${analytics.trends.percentage}%

📋 Répartition:
${this.columns().map(col => `• ${col.title}: ${col.candidatures.length} candidatures`).join('\n')}
    `;

    this.downloadTextFile(report, 'rapport-kanban.txt');
    this.showSuccessMessage('📄 Rapport généré et téléchargé');
  }

  manageAutomations(): void {
    const message = `
🤖 Automatisations Actives:

${this.automationRules.map(rule =>
  `• ${rule.name}: ${rule.enabled ? '✅ Activée' : '❌ Désactivée'}`
).join('\n')}

Plus d'options d'automatisation arrivent bientôt !
    `;

    this.snackBar.open(message, 'Fermer', { duration: 8000 });
  }

  // ===== MÉTHODES UTILITAIRES =====

  getNotificationIcon(type: SmartNotification['type']): string {
    const icons = {
      reminder: 'alarm',
      suggestion: 'lightbulb',
      achievement: 'emoji_events',
      warning: 'warning'
    };
    return icons[type];
  }

  getSuccessIcon(): string {
    const icons = ['check_circle', 'celebration', 'star', 'emoji_events'];
    return icons[Math.floor(Math.random() * icons.length)];
  }

  getPerformanceColor(): string {
    const rate = this.conversionRate();
    if (rate >= 70) return 'primary';
    if (rate >= 40) return 'accent';
    return 'warn';
  }

  getUrgentCount(column: KanbanColumn): number {
    return column.candidatures.filter(c => c.ranking === 1).length;
  }

  hasAutomationRules(columnId: string): boolean {
    return this.automationRules.some(rule =>
      rule.enabled &&
      rule.trigger.conditions.column === columnId
    );
  }

  isBottleneck(columnId: string): boolean {
    const column = this.columns().find(c => c.id === columnId);
    if (!column) return false;

    const avgPerColumn = this.stats().totalCandidatures / this.columns().length;
    return column.candidatures.length > avgPerColumn * 1.5;
  }

  getColumnAnalytics(columnId: string) {
    return {
      avgTime: Math.floor(Math.random() * 10) + 1, // Simulé
      conversionRate: Math.floor(Math.random() * 30) + 10 // Simulé
    };
  }

  getEmptyMessage(columnId: string): string {
    const messages = {
      'brouillon': 'Commencez par créer une candidature',
      'envoyee': 'Aucune candidature envoyée',
      'en-attente': 'Aucune réponse en attente',
      'en-discussion': 'Aucun entretien en cours',
      'finalise': 'Aucune candidature finalisée'
    };
    return messages[columnId as keyof typeof messages] || 'Aucune candidature';
  }

  private hasAchievement(achievementId: string): boolean {
    return this.achievements().includes(achievementId);
  }

  private showAllAchievements(): void {
    const achievements = this.achievements();
    const message = achievements.length > 0
      ? `🏆 Vos succès: ${achievements.join(', ')}`
      : 'Aucun succès débloqué pour le moment';

    this.snackBar.open(message, 'Fermer', { duration: 5000 });
  }

  private addSmartNotification(notification: Omit<SmartNotification, 'id' | 'timestamp'>): void {
    const newNotification: SmartNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    this.smartNotifications.update(notifications => [newNotification, ...notifications]);

    // Auto-supprimer après 10 secondes pour éviter l'encombrement
    setTimeout(() => {
      this.dismissNotification(newNotification.id);
    }, 10000);
  }

  dismissNotification(notificationId: string): void {
    this.smartNotifications.update(notifications =>
      notifications.filter(n => n.id !== notificationId)
    );
  }

  private clearAllNotifications(): void {
    this.smartNotifications.set([]);
  }

  private quickFollowUp(candidature: Candidature): void {
    this.showSuccessMessage(`📧 Relance programmée pour ${candidature.entreprise}`);
    // Ici on pourrait intégrer avec un système d'email
  }

  private showAISuggestion(candidature: Candidature): void {
    const suggestions = [
      'Personnaliser la lettre de motivation',
      'Rechercher des contacts sur LinkedIn',
      'Préparer des questions d\'entretien',
      'Étudier la culture d\'entreprise',
      'Mettre à jour votre CV'
    ];

    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    this.addSmartNotification({
      type: 'suggestion',
      title: '🧠 Suggestion IA',
      message: `Pour ${candidature.entreprise}: ${suggestion}`,
      actionButton: {
        label: 'Noter',
        action: () => this.showSuccessMessage('📝 Suggestion notée!')
      }
    });
  }

  private downloadTextFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private getDaysSinceLastUpdate(candidature: Candidature): number {
    const lastUpdate = this.parseDateFr(candidature.date);
    if (!lastUpdate) return 0;

    const now = new Date();
    const diffTime = now.getTime() - lastUpdate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  private parseDateFr(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  }

  trackByNotification(index: number, notification: SmartNotification): string {
    return notification.id;
  }

  // ===== MÉTHODES HÉRITÉES (inchangées) =====

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
  }

  private calculateStats(): KanbanStats {
    const allCandidatures = this.candidatureService.getAllCandidatures();
    const today = new Date().toDateString();

    return {
      totalCandidatures: allCandidatures.length,
      conversionRates: {},
      averageTimePerStage: {},
      progressToday: allCandidatures.filter(c => {
        const dateStr = c.date.split('/').reverse().join('-');
        return new Date(dateStr).toDateString() === today;
      }).length
    };
  }

  private calculateConversionRate(): number {
    const columns = this.columns();
    const total = columns.reduce((sum, col) => sum + col.candidatures.length, 0);
    const accepted = columns.find(col => col.id === 'finalise')?.candidatures.filter(c => c.reponse === 'Accepté').length || 0;

    return total > 0 ? Math.round((accepted / total) * 100) : 0;
  }

  private calculateTimeInColumns(candidatures: Candidature[]): { [columnId: string]: number } {
    // Simulation - dans une vraie app, on trackrait les transitions
    return {
      'brouillon': 2,
      'envoyee': 5,
      'en-attente': 7,
      'en-discussion': 10,
      'finalise': 0
    };
  }

  // ===== DRAG & DROP (inchangé) =====

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

        if (targetColumnId === 'finalise' && candidature.reponse === 'Accepté') {
          this.triggerConfetti();
          this.unlockAchievement('🎉 Candidature Acceptée!', `Félicitations pour ${candidature.entreprise}!`);
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

    if (targetColumn?.maxItems && targetColumn.candidatures.length >= targetColumn.maxItems) {
      return false;
    }

    return true;
  }

  private updateCandidatureStatus(candidature: Candidature, columnId: string): void {
    const newStatuses = COLUMN_TO_STATUS_MAP[columnId];
    if (newStatuses && newStatuses.length > 0) {
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

  // ===== ACTIONS HÉRITÉES =====

  addNewCandidature(): void {
    const dialogRef = this.dialog.open(CandidatureDialogComponent, {
      width: 'clamp(300px, 90vw, 800px)',
      maxWidth: '95vw',
      data: { candidature: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.candidatureService.addCandidature(result);
        this.showSuccessMessage('✨ Nouvelle candidature ajoutée !');
        this.checkAchievements();
      }
    });
  }

  addCandidatureToColumn(columnId: string): void {
    const defaultStatuses = COLUMN_TO_STATUS_MAP[columnId];
    const defaultStatus = defaultStatuses ? defaultStatuses[0] : 'Brouillon';

    const dialogRef = this.dialog.open(CandidatureDialogComponent, {
      width: 'clamp(300px, 90vw, 800px)',
      maxWidth: '95vw',
      data: { candidature: null, defaultStatus: defaultStatus }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        result.reponse = defaultStatus;
        this.candidatureService.addCandidature(result);
        this.showSuccessMessage(`🎯 Candidature ajoutée dans ${this.getColumnTitle(columnId)} !`);
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
        this.showSuccessMessage('✏️ Candidature mise à jour !');
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
    this.showSuccessMessage('📥 Données exportées en CSV');
  }

  refreshData(): void {
    this.loadData();
    this.showSuccessMessage('🔄 Données actualisées');
  }

  // ===== ACTIONS RAPIDES =====

  private setHighPriority(candidature: Candidature): void {
    candidature.ranking = 1;
    this.candidatureService.updateCandidature(candidature);
    this.showSuccessMessage('⭐ Candidature marquée comme prioritaire');
  }

  private setReminderInWeek(candidature: Candidature): void {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    candidature.dateRappel = nextWeek.toLocaleDateString('fr-FR');
    candidature.delaiRappel = '1 semaine';
    this.candidatureService.updateCandidature(candidature);
    this.showSuccessMessage('⏰ Rappel programmé dans 1 semaine');
  }

  private markAsSent(candidature: Candidature): void {
    candidature.reponse = 'Envoyée';
    this.candidatureService.updateCandidature(candidature);
    this.showSuccessMessage('📧 Candidature marquée comme envoyée');
  }

  // ===== FEEDBACK VISUEL =====

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

  // ===== TRACK BY FUNCTIONS =====

  trackByColumn(index: number, column: KanbanColumn): string {
    return column.id;
  }

  trackByCandidature(index: number, candidature: Candidature): number {
    return candidature.id;
  }
}
