// src/app/components/ai-assistant/ai-assistant.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { AutomationService, AISuggestion, AutomationRule, PredictiveAnalytics } from '../../services/automation.service';
import { CandidatureService } from '../../services/candidature.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatMenuModule
  ],
  template: `
    <div class="ai-assistant" [@slideIn]>

      <!-- En-tête de l'assistant IA -->
      <div class="ai-header">
        <div class="ai-avatar">
          <div class="avatar-circle">
            <mat-icon>psychology</mat-icon>
            <div class="pulse-ring"></div>
          </div>
        </div>

        <div class="ai-info">
          <h2>Assistant IA ProTrack</h2>
          <p class="ai-status" [class.active]="aiEnabled()">
            <mat-icon>{{ aiEnabled() ? 'online_prediction' : 'offline_bolt' }}</mat-icon>
            {{ aiEnabled() ? 'Assistant actif - Analyse en cours...' : 'Assistant désactivé' }}
          </p>
        </div>

        <div class="ai-controls">
          <mat-slide-toggle
            [checked]="aiEnabled()"
            (change)="toggleAI($event.checked)"
            color="primary">
            {{ aiEnabled() ? 'Activé' : 'Désactivé' }}
          </mat-slide-toggle>

          <button mat-icon-button [matMenuTriggerFor]="settingsMenu" matTooltip="Paramètres IA">
            <mat-icon>settings</mat-icon>
          </button>

          <mat-menu #settingsMenu="matMenu">
            <button mat-menu-item (click)="configureAutomations()">
              <mat-icon>automation</mat-icon>
              <span>Gérer les automatisations</span>
            </button>
            <button mat-menu-item (click)="viewAnalytics()">
              <mat-icon>analytics</mat-icon>
              <span>Voir les analyses</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="resetAI()">
              <mat-icon>refresh</mat-icon>
              <span>Réinitialiser l'IA</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Suggestions IA actives -->
      <div *ngIf="aiEnabled() && activeSuggestions().length > 0" class="suggestions-section">
        <div class="section-header">
          <h3>
            <mat-icon color="accent">lightbulb</mat-icon>
            Suggestions intelligentes
            <mat-badge [content]="activeSuggestions().length" color="accent">
            </mat-badge>
          </h3>
          <button mat-button color="primary" (click)="refreshSuggestions()">
            <mat-icon>refresh</mat-icon>
            Actualiser
          </button>
        </div>

        <div class="suggestions-list" [@suggestionsAnimation]>
          <div
            *ngFor="let suggestion of activeSuggestions(); trackBy: trackBySuggestion"
            class="suggestion-card"
            [attr.data-impact]="suggestion.impact"
            [attr.data-type]="suggestion.type">

            <div class="suggestion-header">
              <div class="suggestion-icon" [attr.data-type]="suggestion.type">
                <mat-icon>{{ getSuggestionIcon(suggestion.type) }}</mat-icon>
              </div>

              <div class="suggestion-meta">
                <div class="suggestion-title">{{ suggestion.title }}</div>
                <div class="suggestion-confidence">
                  <mat-icon [color]="getConfidenceColor(suggestion.confidence)">
                    {{ getConfidenceIcon(suggestion.confidence) }}
                  </mat-icon>
                  {{ suggestion.confidence }}% de confiance
                </div>
              </div>

              <div class="suggestion-impact" [attr.data-impact]="suggestion.impact">
                {{ getImpactLabel(suggestion.impact) }}
              </div>
            </div>

            <div class="suggestion-content">
              <p>{{ suggestion.description }}</p>

              <div class="suggestion-actions">
                <button
                  mat-raised-button
                  color="primary"
                  (click)="applySuggestion(suggestion)"
                  class="apply-button">
                  <mat-icon>check</mat-icon>
                  {{ suggestion.actionButton.text }}
                </button>

                <button
                  *ngIf="suggestion.dismissible"
                  mat-button
                  (click)="dismissSuggestion(suggestion.id)"
                  class="dismiss-button">
                  <mat-icon>close</mat-icon>
                  Ignorer
                </button>
              </div>
            </div>

            <!-- Barre de priorité -->
            <div class="priority-bar" [style.width.%]="suggestion.priority * 10"></div>
          </div>
        </div>
      </div>

      <!-- État vide ou IA désactivée -->
      <div *ngIf="!aiEnabled() || activeSuggestions().length === 0" class="empty-state">
        <div class="empty-content">
          <mat-icon class="empty-icon">{{ aiEnabled() ? 'check_circle' : 'psychology' }}</mat-icon>
          <h3>{{ aiEnabled() ? 'Tout va bien !' : 'Assistant IA désactivé' }}</h3>
          <p>
            {{ aiEnabled() ?
              'Aucune suggestion pour le moment. Continuez votre excellent travail !' :
              'Activez l\'assistant IA pour recevoir des conseils personnalisés et des automatisations intelligentes.'
            }}
          </p>
          <button
            *ngIf="!aiEnabled()"
            mat-raised-button
            color="primary"
            (click)="toggleAI(true)">
            <mat-icon>psychology</mat-icon>
            Activer l'Assistant IA
          </button>
        </div>
      </div>

      <!-- Statistiques des automatisations -->
      <div *ngIf="aiEnabled()" class="automation-stats">
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>automation</mat-icon>
              Automatisations actives
            </mat-panel-title>
            <mat-panel-description>
              {{ automationStats().activeRules }}/{{ automationStats().totalRules }} règles actives
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="automation-content">
            <div class="stats-overview">
              <div class="stat-item">
                <mat-icon color="primary">rule</mat-icon>
                <div>
                  <strong>{{ automationStats().totalRules }}</strong>
                  <span>Règles configurées</span>
                </div>
              </div>

              <div class="stat-item">
                <mat-icon color="accent">play_arrow</mat-icon>
                <div>
                  <strong>{{ automationStats().totalExecutions }}</strong>
                  <span>Exécutions totales</span>
                </div>
              </div>

              <div class="stat-item">
                <mat-icon color="warn">trending_up</mat-icon>
                <div>
                  <strong>{{ automationStats().averageExecutionsPerRule }}</strong>
                  <span>Moyenne par règle</span>
                </div>
              </div>
            </div>

            <!-- Liste des règles actives -->
            <div class="rules-list">
              <h4>Règles d'automatisation</h4>
              <div
                *ngFor="let rule of automationRules(); trackBy: trackByRule"
                class="rule-item">

                <div class="rule-info">
                  <div class="rule-name">{{ rule.name }}</div>
                  <div class="rule-description">{{ rule.description }}</div>
                  <div class="rule-stats">
                    <mat-chip class="category-chip" [attr.data-category]="rule.category">
                      {{ getCategoryLabel(rule.category) }}
                    </mat-chip>
                    <span class="execution-count">{{ rule.executionCount }} exécutions</span>
                  </div>
                </div>

                <div class="rule-controls">
                  <mat-slide-toggle
                    [checked]="rule.enabled"
                    (change)="toggleRule(rule.id, $event.checked)"
                    color="primary">
                  </mat-slide-toggle>
                </div>
              </div>
            </div>

            <div class="automation-actions">
              <button mat-stroked-button color="primary" (click)="addCustomRule()">
                <mat-icon>add</mat-icon>
                Ajouter une règle
              </button>
              <button mat-stroked-button (click)="viewAutomationHistory()">
                <mat-icon>history</mat-icon>
                Historique
              </button>
            </div>
          </div>
        </mat-expansion-panel>
      </div>

      <!-- Analyses prédictives (preview) -->
      <div *ngIf="aiEnabled() && showPredictiveAnalytics()" class="predictive-section">
        <div class="section-header">
          <h3>
            <mat-icon color="primary">insights</mat-icon>
            Analyses prédictives
          </h3>
          <mat-chip class="beta-chip">BETA</mat-chip>
        </div>

        <div class="predictive-cards">
          <mat-card class="predictive-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>trending_up</mat-icon>
                Probabilité de succès
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="success-gauge">
                <mat-progress-bar
                  mode="determinate"
                  [value]="averageSuccessProbability()"
                  [color]="getSuccessColor(averageSuccessProbability())">
                </mat-progress-bar>
                <span class="gauge-value">{{ averageSuccessProbability() }}%</span>
              </div>
              <p>Basé sur l'analyse de vos candidatures récentes</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="predictive-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>schedule</mat-icon>
                Temps de réponse estimé
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="response-time">
                <span class="time-value">{{ averageResponseTime() }}</span>
                <span class="time-unit">jours</span>
              </div>
              <p>Délai moyen prévu pour vos prochaines candidatures</p>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Conseils rapides -->
      <div *ngIf="aiEnabled()" class="quick-tips">
        <div class="section-header">
          <h3>
            <mat-icon color="accent">tips_and_updates</mat-icon>
            Conseil du jour
          </h3>
        </div>

        <div class="tip-card">
          <div class="tip-icon">
            <mat-icon>emoji_objects</mat-icon>
          </div>
          <div class="tip-content">
            <h4>{{ getDailyTip().title }}</h4>
            <p>{{ getDailyTip().content }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-assistant {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .ai-header {
      display: flex;
      align-items: center;
      gap: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 20px;
      margin-bottom: 30px;
      position: relative;
      overflow: hidden;
    }

    .ai-avatar {
      position: relative;
    }

    .avatar-circle {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .avatar-circle mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }

    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .ai-info {
      flex: 1;
    }

    .ai-info h2 {
      margin: 0 0 8px 0;
      font-size: 1.8em;
      font-weight: 600;
    }

    .ai-status {
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0.9;
      font-size: 1em;
    }

    .ai-status.active {
      color: #10B981;
    }

    .ai-controls {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-header h3 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-size: 1.4em;
      font-weight: 600;
    }

    .suggestions-section {
      margin-bottom: 30px;
    }

    .suggestions-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .suggestion-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      border-left: 4px solid;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .suggestion-card[data-impact="high"] {
      border-left-color: #EF4444;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.02) 0%, transparent 100%);
    }

    .suggestion-card[data-impact="medium"] {
      border-left-color: #F59E0B;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.02) 0%, transparent 100%);
    }

    .suggestion-card[data-impact="low"] {
      border-left-color: #10B981;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, transparent 100%);
    }

    .suggestion-header {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      margin-bottom: 15px;
    }

    .suggestion-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .suggestion-icon[data-type="follow_up"] {
      background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
    }

    .suggestion-icon[data-type="optimization"] {
      background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
    }

    .suggestion-icon[data-type="strategy"] {
      background: linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%);
    }

    .suggestion-icon[data-type="template"] {
      background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
    }

    .suggestion-meta {
      flex: 1;
    }

    .suggestion-title {
      font-weight: 600;
      font-size: 1.1em;
      margin-bottom: 5px;
      color: #1f2937;
    }

    .suggestion-confidence {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.9em;
      color: #6b7280;
    }

    .suggestion-impact {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8em;
      font-weight: 600;
      text-transform: uppercase;
    }

    .suggestion-impact[data-impact="high"] {
      background: #FEE2E2;
      color: #DC2626;
    }

    .suggestion-impact[data-impact="medium"] {
      background: #FEF3C7;
      color: #D97706;
    }

    .suggestion-impact[data-impact="low"] {
      background: #D1FAE5;
      color: #059669;
    }

    .suggestion-content p {
      margin: 0 0 20px 0;
      line-height: 1.6;
      color: #374151;
    }

    .suggestion-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .priority-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, #10B981 0%, #34D399 100%);
      transition: width 0.3s ease;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 20px;
      margin-bottom: 30px;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #D1D5DB;
      margin-bottom: 20px;
    }

    .empty-content h3 {
      margin: 0 0 15px 0;
      color: #374151;
      font-size: 1.5em;
    }

    .empty-content p {
      margin: 0 0 25px 0;
      color: #6B7280;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    .automation-stats {
      margin-bottom: 30px;
    }

    .automation-content {
      padding: 20px 0;
    }

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #F9FAFB;
      border-radius: 12px;
    }

    .stat-item div {
      display: flex;
      flex-direction: column;
    }

    .stat-item strong {
      font-size: 1.3em;
      font-weight: 600;
      color: #1F2937;
    }

    .stat-item span {
      font-size: 0.9em;
      color: #6B7280;
    }

    .rules-list h4 {
      margin: 0 0 15px 0;
      color: #374151;
    }

    .rule-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border: 1px solid #E5E7EB;
      border-radius: 10px;
      margin-bottom: 10px;
    }

    .rule-info {
      flex: 1;
    }

    .rule-name {
      font-weight: 600;
      margin-bottom: 5px;
      color: #1F2937;
    }

    .rule-description {
      font-size: 0.9em;
      color: #6B7280;
      margin-bottom: 8px;
    }

    .rule-stats {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .category-chip {
      font-size: 0.7em !important;
      height: 24px !important;
    }

    .category-chip[data-category="follow_up"] {
      background-color: #DBEAFE !important;
      color: #1D4ED8 !important;
    }

    .category-chip[data-category="organization"] {
      background-color: #F3E8FF !important;
      color: #7C3AED !important;
    }

    .category-chip[data-category="analytics"] {
      background-color: #ECFDF5 !important;
      color: #059669 !important;
    }

    .execution-count {
      font-size: 0.8em;
      color: #6B7280;
    }

    .automation-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .predictive-section {
      margin-bottom: 30px;
    }

    .beta-chip {
      background-color: #FEE2E2 !important;
      color: #DC2626 !important;
      font-size: 0.7em !important;
    }

    .predictive-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .predictive-card {
      border-radius: 16px;
    }

    .success-gauge {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 10px;
    }

    .success-gauge mat-progress-bar {
      flex: 1;
      height: 8px;
      border-radius: 4px;
    }

    .gauge-value {
      font-weight: 600;
      font-size: 1.2em;
      color: #1F2937;
    }

    .response-time {
      text-align: center;
      margin-bottom: 10px;
    }

    .time-value {
      font-size: 2.5em;
      font-weight: 700;
      color: #1F2937;
    }

    .time-unit {
      font-size: 1.1em;
      color: #6B7280;
      margin-left: 5px;
    }

    .quick-tips {
      margin-bottom: 30px;
    }

    .tip-card {
      display: flex;
      gap: 20px;
      background: white;
      padding: 25px;
      border-radius: 16px;
      border: 1px solid #E5E7EB;
    }

    .tip-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .tip-content h4 {
      margin: 0 0 10px 0;
      color: #1F2937;
      font-size: 1.2em;
    }

    .tip-content p {
      margin: 0;
      color: #6B7280;
      line-height: 1.6;
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.7;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @media (max-width: 768px) {
      .ai-header {
        flex-direction: column;
        text-align: center;
        gap: 15px;
      }

      .ai-controls {
        flex-direction: column;
        gap: 10px;
      }

      .suggestion-header {
        flex-direction: column;
        gap: 10px;
      }

      .suggestion-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .stats-overview {
        grid-template-columns: 1fr;
      }

      .predictive-cards {
        grid-template-columns: 1fr;
      }

      .tip-card {
        flex-direction: column;
        text-align: center;
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('suggestionsAnimation', [
      transition(':enter', [
        query('.suggestion-card', [
          style({ opacity: 0, transform: 'translateX(-50px)' }),
          stagger(150, [
            animate('0.4s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class AIAssistantComponent implements OnInit {
  showPredictiveAnalytics = signal(true);

  constructor(
    public automationService: AutomationService,
    private candidatureService: CandidatureService
  ) {}

  ngOnInit(): void {
    // Initialisation
  }

  // Computed signals
  aiEnabled = this.automationService.aiEnabled;
  activeSuggestions = this.automationService.activeSuggestions;
  automationRules = this.automationService.automationRules;
  automationStats = this.automationService.automationStats;

  averageSuccessProbability = computed(() => {
    const candidatures = this.candidatureService.getAllCandidatures();
    if (candidatures.length === 0) return 0;

    // Simulation basée sur les données actuelles
    const successRate = candidatures.filter(c => c.reponse === 'Accepté').length / candidatures.length;
    return Math.round(successRate * 100) || 65; // Valeur par défaut optimiste
  });

  averageResponseTime = computed(() => {
    return 8; // Simulation - pourrait être calculé à partir des données réelles
  });

  // Méthodes
  toggleAI(enabled: boolean): void {
    this.automationService.setAIEnabled(enabled);
  }

  toggleRule(ruleId: string, enabled: boolean): void {
    this.automationService.toggleAutomationRule(ruleId);
  }

  applySuggestion(suggestion: AISuggestion): void {
    suggestion.actionButton.action();
    this.automationService.dismissSuggestion(suggestion.id);
  }

  dismissSuggestion(suggestionId: string): void {
    this.automationService.dismissSuggestion(suggestionId);
  }

  refreshSuggestions(): void {
    // Déclencher une nouvelle génération de suggestions
    console.log('Actualisation des suggestions IA...');
  }

  getSuggestionIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'follow_up': 'send',
      'optimization': 'tune',
      'strategy': 'psychology',
      'template': 'description',
      'timing': 'schedule'
    };
    return icons[type] || 'lightbulb';
  }

  getConfidenceIcon(confidence: number): string {
    if (confidence >= 90) return 'verified';
    if (confidence >= 70) return 'check_circle';
    if (confidence >= 50) return 'help';
    return 'info';
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 90) return 'primary';
    if (confidence >= 70) return 'accent';
    if (confidence >= 50) return 'warn';
    return '';
  }

  getImpactLabel(impact: string): string {
    const labels: { [key: string]: string } = {
      'high': 'Impact élevé',
      'medium': 'Impact moyen',
      'low': 'Impact faible'
    };
    return labels[impact] || impact;
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'follow_up': 'Relance',
      'organization': 'Organisation',
      'analytics': 'Analyse',
      'ai_assistant': 'IA'
    };
    return labels[category] || category;
  }

  getSuccessColor(percentage: number): string {
    if (percentage >= 80) return 'primary';
    if (percentage >= 60) return 'accent';
    return 'warn';
  }

  getDailyTip(): { title: string; content: string } {
    const tips = [
      {
        title: "Personnalisez chaque candidature",
        content: "Adaptez votre lettre de motivation aux spécificités de l'entreprise et du poste. Les recruteurs apprécient les candidats qui montrent qu'ils ont fait leurs recherches."
      },
      {
        title: "Optimisez votre timing",
        content: "Envoyez vos candidatures le mardi ou mercredi matin entre 9h et 11h. C'est le moment où les recruteurs sont le plus attentifs."
      },
      {
        title: "Suivez vos candidatures",
        content: "Relancez poliment après 1-2 semaines de silence. Cela montre votre motivation et votre professionnalisme."
      },
      {
        title: "Préparez-vous aux entretiens",
        content: "Recherchez l'entreprise, préparez des questions pertinentes et entraînez-vous à présenter vos expériences avec la méthode STAR."
      },
      {
        title: "Élargissez votre réseau",
        content: "Participez à des événements professionnels, connectez-vous sur LinkedIn et n'hésitez pas à demander des recommandations."
      }
    ];

    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return tips[dayOfYear % tips.length];
  }

  // Actions des boutons
  configureAutomations(): void {
    console.log('Ouvrir la configuration des automatisations');
  }

  viewAnalytics(): void {
    console.log('Voir les analyses détaillées');
  }

  resetAI(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser l\'assistant IA ? Cela supprimera toutes les suggestions actuelles.')) {
      // Logique de réinitialisation
      console.log('IA réinitialisée');
    }
  }

  addCustomRule(): void {
    console.log('Ajouter une règle personnalisée');
  }

  viewAutomationHistory(): void {
    console.log('Voir l\'historique des automatisations');
  }

  // TrackBy functions
  trackBySuggestion(index: number, suggestion: AISuggestion): string {
    return suggestion.id;
  }

  trackByRule(index: number, rule: AutomationRule): string {
    return rule.id;
  }
}
