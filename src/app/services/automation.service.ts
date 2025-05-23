// src/app/services/automation.service.ts
import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { Observable, interval, BehaviorSubject, of } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { CandidatureService } from './candidature.service';
import { NotificationService } from './notification.service';
import { Candidature } from '../models/candidature.model';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: 'time_based' | 'status_change' | 'user_action' | 'ai_suggestion';
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  priority: 'low' | 'medium' | 'high';
  category: 'follow_up' | 'organization' | 'analytics' | 'ai_assistant';
  createdAt: Date;
  lastExecuted?: Date;
  executionCount: number;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'days_since';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface AutomationAction {
  type: 'notification' | 'status_change' | 'reminder' | 'email_template' | 'suggestion';
  parameters: any;
}

export interface AISuggestion {
  id: string;
  type: 'follow_up' | 'optimization' | 'strategy' | 'template' | 'timing';
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  candidatureId?: number;
  actionButton: {
    text: string;
    action: () => void;
  };
  dismissible: boolean;
  createdAt: Date;
  priority: number;
}

export interface SmartTemplate {
  id: string;
  name: string;
  type: 'email' | 'cover_letter' | 'follow_up' | 'thank_you';
  content: string;
  variables: string[];
  category: string;
  successRate: number;
  usageCount: number;
  aiOptimized: boolean;
}

export interface PredictiveAnalytics {
  candidatureId: number;
  successProbability: number;
  responseTimeEstimate: number; // en jours
  recommendedActions: string[];
  riskFactors: string[];
  opportunityFactors: string[];
  competitionLevel: 'low' | 'medium' | 'high';
  marketTrend: 'growing' | 'stable' | 'declining';
}

@Injectable({
  providedIn: 'root'
})
export class AutomationService {
  private readonly AUTOMATION_STORAGE_KEY = 'protrack_cv_automations';
  private readonly AI_SETTINGS_KEY = 'protrack_cv_ai_settings';

  // Signals pour l'état des automatisations
  private _automationRules: WritableSignal<AutomationRule[]> = signal([]);
  private _aiSuggestions: WritableSignal<AISuggestion[]> = signal([]);
  private _smartTemplates: WritableSignal<SmartTemplate[]> = signal(this.getDefaultTemplates());
  private _aiEnabled: WritableSignal<boolean> = signal(true);
  private _automationEnabled: WritableSignal<boolean> = signal(true);

  public readonly automationRules = this._automationRules.asReadonly();
  public readonly aiSuggestions = this._aiSuggestions.asReadonly();
  public readonly smartTemplates = this._smartTemplates.asReadonly();
  public readonly aiEnabled = this._aiEnabled.asReadonly();

  public readonly activeSuggestions = computed(() =>
    this._aiSuggestions()
      .filter(s => !s.dismissible || s.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000))
      .sort((a, b) => b.priority - a.priority)
  );

  public readonly automationStats = computed(() => {
    const rules = this._automationRules();
    return {
      totalRules: rules.length,
      activeRules: rules.filter(r => r.enabled).length,
      totalExecutions: rules.reduce((sum, r) => sum + r.executionCount, 0),
      averageExecutionsPerRule: rules.length > 0 ?
        Math.round(rules.reduce((sum, r) => sum + r.executionCount, 0) / rules.length) : 0
    };
  });

  constructor(
    private candidatureService: CandidatureService,
    private notificationService: NotificationService
  ) {
    this.loadAutomationData();
    this.initializeDefaultRules();
    this.startAutomationEngine();
    this.startAIAssistant();
  }

  private loadAutomationData(): void {
    try {
      const stored = localStorage.getItem(this.AUTOMATION_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this._automationRules.set(data.rules || []);
        this._aiSuggestions.set(data.suggestions || []);
      }

      const aiSettings = localStorage.getItem(this.AI_SETTINGS_KEY);
      if (aiSettings) {
        const settings = JSON.parse(aiSettings);
        this._aiEnabled.set(settings.aiEnabled ?? true);
        this._automationEnabled.set(settings.automationEnabled ?? true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des automatisations:', error);
    }
  }

  private saveAutomationData(): void {
    try {
      const data = {
        rules: this._automationRules(),
        suggestions: this._aiSuggestions()
      };
      localStorage.setItem(this.AUTOMATION_STORAGE_KEY, JSON.stringify(data));

      const settings = {
        aiEnabled: this._aiEnabled(),
        automationEnabled: this._automationEnabled()
      };
      localStorage.setItem(this.AI_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des automatisations:', error);
    }
  }

  private initializeDefaultRules(): void {
    if (this._automationRules().length === 0) {
      const defaultRules: AutomationRule[] = [
        {
          id: 'follow_up_reminder',
          name: 'Rappel de relance automatique',
          description: 'Créer un rappel de relance 1 semaine après envoi',
          enabled: true,
          trigger: 'status_change',
          conditions: [
            { field: 'reponse', operator: 'equals', value: 'Envoyée' }
          ],
          actions: [
            {
              type: 'reminder',
              parameters: {
                delay: 7,
                message: 'Relancer cette candidature'
              }
            }
          ],
          priority: 'medium',
          category: 'follow_up',
          createdAt: new Date(),
          executionCount: 0
        },
        {
          id: 'stale_candidature_alert',
          name: 'Alerte candidatures dormantes',
          description: 'Notifier les candidatures sans suivi depuis 2 semaines',
          enabled: true,
          trigger: 'time_based',
          conditions: [
            { field: 'reponse', operator: 'equals', value: 'En attente' },
            { field: 'lastUpdate', operator: 'days_since', value: 14 }
          ],
          actions: [
            {
              type: 'notification',
              parameters: {
                title: 'Candidature dormante détectée',
                message: 'Cette candidature n\'a pas été mise à jour depuis 2 semaines'
              }
            }
          ],
          priority: 'medium',
          category: 'organization',
          createdAt: new Date(),
          executionCount: 0
        },
        {
          id: 'success_celebration',
          name: 'Célébration automatique',
          description: 'Célébrer automatiquement les succès',
          enabled: true,
          trigger: 'status_change',
          conditions: [
            { field: 'reponse', operator: 'equals', value: 'Accepté' }
          ],
          actions: [
            {
              type: 'notification',
              parameters: {
                title: '🎉 Félicitations !',
                message: 'Candidature acceptée ! Bravo pour ce succès !'
              }
            }
          ],
          priority: 'high',
          category: 'analytics',
          createdAt: new Date(),
          executionCount: 0
        }
      ];

      this._automationRules.set(defaultRules);
      this.saveAutomationData();
    }
  }

  private startAutomationEngine(): void {
    if (!this._automationEnabled()) return;

    // Vérifier les règles toutes les heures
    interval(60 * 60 * 1000).subscribe(() => {
      this.executeTimeBasedRules();
    });

    // Exécution initiale après 30 secondes
    setTimeout(() => {
      this.executeTimeBasedRules();
    }, 30000);
  }

  private startAIAssistant(): void {
    if (!this._aiEnabled()) return;

    // IA Assistant qui génère des suggestions intelligentes
    interval(30 * 60 * 1000).subscribe(() => { // Toutes les 30 minutes
      this.generateAISuggestions();
    });

    // Suggestions initiales
    setTimeout(() => {
      this.generateAISuggestions();
      this.generateWelcomeSuggestions();
    }, 5000);
  }

  private executeTimeBasedRules(): void {
    const rules = this._automationRules().filter(r => r.enabled && r.trigger === 'time_based');
    const candidatures = this.candidatureService.getAllCandidatures();

    rules.forEach(rule => {
      candidatures.forEach(candidature => {
        if (this.evaluateConditions(rule.conditions, candidature)) {
          this.executeActions(rule.actions, candidature);
          this.incrementRuleExecution(rule.id);
        }
      });
    });
  }

  private evaluateConditions(conditions: AutomationCondition[], candidature: Candidature): boolean {
    return conditions.every(condition => {
      const value = this.getCandidatureFieldValue(candidature, condition.field);

      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'contains':
          return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
        case 'days_since':
          const date = this.parseDateFr(candidature.date);
          if (!date) return false;
          const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
          return daysSince >= condition.value;
        default:
          return false;
      }
    });
  }

  private getCandidatureFieldValue(candidature: Candidature, field: string): any {
    return (candidature as any)[field];
  }

  private executeActions(actions: AutomationAction[], candidature: Candidature): void {
    actions.forEach(action => {
      switch (action.type) {
        case 'notification':
          this.notificationService.addSystemNotification({
            type: 'info',
            title: action.parameters.title,
            message: `${action.parameters.message} - ${candidature.entreprise}`,
            candidatureId: candidature.id
          });
          break;

        case 'reminder':
          const reminderDate = new Date();
          reminderDate.setDate(reminderDate.getDate() + action.parameters.delay);
          this.notificationService.addManualReminder({
            title: `Relancer ${candidature.entreprise}`,
            description: action.parameters.message,
            reminderDate
          });
          break;

        case 'status_change':
          candidature.reponse = action.parameters.newStatus;
          this.candidatureService.updateCandidature(candidature);
          break;
      }
    });
  }

  private incrementRuleExecution(ruleId: string): void {
    this._automationRules.update(rules =>
      rules.map(rule =>
        rule.id === ruleId
          ? { ...rule, executionCount: rule.executionCount + 1, lastExecuted: new Date() }
          : rule
      )
    );
    this.saveAutomationData();
  }

  // IA Suggestions
  private generateAISuggestions(): void {
    const candidatures = this.candidatureService.getAllCandidatures();
    const newSuggestions: AISuggestion[] = [];

    // Analyser chaque candidature pour des suggestions
    candidatures.forEach(candidature => {
      const suggestions = this.analyzeCandidate(candidature);
      newSuggestions.push(...suggestions);
    });

    // Suggestions générales
    newSuggestions.push(...this.generateGeneralSuggestions(candidatures));

    // Ajouter les nouvelles suggestions
    this._aiSuggestions.update(existing => {
      const filtered = existing.filter(s =>
        s.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      return [...filtered, ...newSuggestions];
    });

    this.saveAutomationData();
  }

  private analyzeCandidate(candidature: Candidature): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const daysSinceApplication = this.getDaysSince(candidature.date);

    // Suggestion de relance
    if (candidature.reponse === 'Envoyée' && daysSinceApplication >= 7 && daysSinceApplication <= 14) {
      suggestions.push({
        id: `follow_up_${candidature.id}`,
        type: 'follow_up',
        title: 'Relance recommandée',
        description: `Il est temps de relancer ${candidature.entreprise}. Les entreprises apprécient les candidats proactifs.`,
        confidence: 85,
        impact: 'medium',
        candidatureId: candidature.id,
        actionButton: {
          text: 'Programmer relance',
          action: () => this.createFollowUpReminder(candidature)
        },
        dismissible: true,
        createdAt: new Date(),
        priority: 8
      });
    }

    // Suggestion d'optimisation pour candidatures en échec
    if (candidature.reponse === 'Refus' && candidature.ranking === 1) {
      suggestions.push({
        id: `optimize_${candidature.id}`,
        type: 'strategy',
        title: 'Analyser l\'échec',
        description: `Candidature prioritaire refusée chez ${candidature.entreprise}. Analysez les raisons pour améliorer vos futures candidatures.`,
        confidence: 90,
        impact: 'high',
        candidatureId: candidature.id,
        actionButton: {
          text: 'Analyser',
          action: () => this.analyzeFailure(candidature)
        },
        dismissible: true,
        createdAt: new Date(),
        priority: 9
      });
    }

    // Suggestion de préparation d'entretien
    if (candidature.reponse === 'En discussion') {
      suggestions.push({
        id: `prepare_${candidature.id}`,
        type: 'strategy',
        title: 'Préparer l\'entretien',
        description: `Préparez-vous pour ${candidature.entreprise}. Recherchez l'entreprise et préparez vos questions.`,
        confidence: 95,
        impact: 'high',
        candidatureId: candidature.id,
        actionButton: {
          text: 'Guide de préparation',
          action: () => this.openInterviewGuide(candidature)
        },
        dismissible: false,
        createdAt: new Date(),
        priority: 10
      });
    }

    return suggestions;
  }

  private generateGeneralSuggestions(candidatures: Candidature[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Suggestion d'objectif hebdomadaire
    const thisWeek = candidatures.filter(c => this.isThisWeek(c.date)).length;
    if (thisWeek < 3) {
      suggestions.push({
        id: 'weekly_goal',
        type: 'strategy',
        title: 'Augmenter la cadence',
        description: `Vous n'avez créé que ${thisWeek} candidature(s) cette semaine. L'objectif recommandé est de 5-7 candidatures par semaine.`,
        confidence: 80,
        impact: 'medium',
        actionButton: {
          text: 'Nouvelle candidature',
          action: () => this.createNewCandidature()
        },
        dismissible: true,
        createdAt: new Date(),
        priority: 6
      });
    }

    // Suggestion de diversification des sources
    const sources = [...new Set(candidatures.map(c => c.source))];
    if (sources.length < 3) {
      suggestions.push({
        id: 'diversify_sources',
        type: 'strategy',
        title: 'Diversifier vos sources',
        description: 'Vous utilisez peu de plateformes. Explorez LinkedIn, Indeed, et les sites d\'entreprises pour plus d\'opportunités.',
        confidence: 75,
        impact: 'medium',
        actionButton: {
          text: 'Voir conseils',
          action: () => this.showSourceTips()
        },
        dismissible: true,
        createdAt: new Date(),
        priority: 5
      });
    }

    // Suggestion d'optimisation de profil
    if (candidatures.filter(c => c.reponse === 'Refus').length > candidatures.length * 0.7) {
      suggestions.push({
        id: 'optimize_profile',
        type: 'optimization',
        title: 'Optimiser votre approche',
        description: 'Taux de refus élevé détecté. Il pourrait être temps d\'optimiser votre CV ou votre lettre de motivation.',
        confidence: 88,
        impact: 'high',
        actionButton: {
          text: 'Conseils d\'optimisation',
          action: () => this.showOptimizationTips()
        },
        dismissible: true,
        createdAt: new Date(),
        priority: 9
      });
    }

    return suggestions;
  }

  private generateWelcomeSuggestions(): void {
    const candidatures = this.candidatureService.getAllCandidatures();

    if (candidatures.length === 0) {
      this._aiSuggestions.update(existing => [...existing, {
        id: 'welcome_first_candidature',
        type: 'strategy',
        title: 'Bienvenue dans ProTrack CV !',
        description: 'Commencez par créer votre première candidature pour découvrir toutes les fonctionnalités.',
        confidence: 100,
        impact: 'high',
        actionButton: {
          text: 'Créer ma première candidature',
          action: () => this.createNewCandidature()
        },
        dismissible: false,
        createdAt: new Date(),
        priority: 10
      }]);
    }
  }

  // Analyse prédictive (simulation IA)
  generatePredictiveAnalytics(candidature: Candidature): PredictiveAnalytics {
    const baseSuccessRate = this.calculateBaseSuccessRate(candidature);
    const responseTimeEstimate = this.estimateResponseTime(candidature);

    return {
      candidatureId: candidature.id,
      successProbability: baseSuccessRate,
      responseTimeEstimate,
      recommendedActions: this.getRecommendedActions(candidature, baseSuccessRate),
      riskFactors: this.identifyRiskFactors(candidature),
      opportunityFactors: this.identifyOpportunityFactors(candidature),
      competitionLevel: this.assessCompetitionLevel(candidature),
      marketTrend: this.assessMarketTrend(candidature)
    };
  }

  private calculateBaseSuccessRate(candidature: Candidature): number {
    let score = 50; // Base 50%

    // Facteurs positifs
    if (candidature.ranking === 1) score += 20;
    if (candidature.type === 'Job') score += 10;
    if (candidature.source === 'Relation') score += 25;
    if (candidature.contact && candidature.contact !== '-') score += 15;
    if (candidature.commentaires && candidature.commentaires.length > 50) score += 10;

    // Facteurs négatifs
    if (candidature.region && candidature.region.includes('distance')) score -= 15;

    return Math.min(Math.max(score, 10), 90);
  }

  private estimateResponseTime(candidature: Candidature): number {
    let days = 7; // Base 7 jours

    if (candidature.type === 'Stage') days -= 2;
    if (candidature.source === 'LinkedIn') days -= 1;
    if (candidature.source === 'Relation') days -= 3;
    if (candidature.ranking === 1) days -= 1;

    return Math.max(days, 2);
  }

  private getRecommendedActions(candidature: Candidature, successRate: number): string[] {
    const actions: string[] = [];

    if (successRate < 60) {
      actions.push('Personnaliser davantage la lettre de motivation');
      actions.push('Rechercher des contacts dans l\'entreprise');
    }

    if (!candidature.contact || candidature.contact === '-') {
      actions.push('Identifier un contact RH ou manager');
    }

    if (candidature.ranking > 1) {
      actions.push('Prioriser cette candidature si elle correspond à vos objectifs');
    }

    actions.push('Préparer un suivi proactif après envoi');

    return actions;
  }

  private identifyRiskFactors(candidature: Candidature): string[] {
    const risks: string[] = [];

    if (candidature.ranking === 3) risks.push('Faible priorité assignée');
    if (!candidature.contact || candidature.contact === '-') risks.push('Aucun contact identifié');
    if (candidature.source === 'Internet') risks.push('Candidature spontanée sans recommandation');
    if (!candidature.commentaires || candidature.commentaires.length < 20) {
      risks.push('Manque de recherche sur l\'entreprise');
    }

    return risks;
  }

  private identifyOpportunityFactors(candidature: Candidature): string[] {
    const opportunities: string[] = [];

    if (candidature.ranking === 1) opportunities.push('Candidature prioritaire');
    if (candidature.source === 'Relation') opportunities.push('Recommandation par le réseau');
    if (candidature.contact && candidature.contact !== '-') opportunities.push('Contact direct disponible');
    if (candidature.type === 'Stage') opportunities.push('Moins de compétition pour les stages');

    return opportunities;
  }

  private assessCompetitionLevel(candidature: Candidature): 'low' | 'medium' | 'high' {
    if (candidature.type === 'Stage') return 'low';
    if (candidature.source === 'Relation') return 'low';
    if (candidature.poste.toLowerCase().includes('senior')) return 'high';
    return 'medium';
  }

  private assessMarketTrend(candidature: Candidature): 'growing' | 'stable' | 'declining' {
    // Simulation basée sur des mots-clés
    const poste = candidature.poste.toLowerCase();

    if (poste.includes('ia') || poste.includes('data') || poste.includes('cloud') || poste.includes('cybersécurité')) {
      return 'growing';
    }

    if (poste.includes('cobol') || poste.includes('flash')) {
      return 'declining';
    }

    return 'stable';
  }

  // Templates intelligents
  private getDefaultTemplates(): SmartTemplate[] {
    return [
      {
        id: 'follow_up_email',
        name: 'Email de relance professionnel',
        type: 'follow_up',
        content: `Objet: Suivi de ma candidature - {poste}

Bonjour {contact},

Je me permets de revenir vers vous concernant ma candidature pour le poste de {poste} au sein de {entreprise}.

Ayant postulé le {date}, je souhaitais savoir si vous aviez eu l'occasion d'examiner mon dossier et s'il serait possible d'échanger sur cette opportunité.

Je reste à votre disposition pour tout complément d'information.

Cordialement,
{nom}`,
        variables: ['poste', 'contact', 'entreprise', 'date', 'nom'],
        category: 'Relance',
        successRate: 78,
        usageCount: 0,
        aiOptimized: true
      },
      {
        id: 'thank_you_interview',
        name: 'Remerciement post-entretien',
        type: 'thank_you',
        content: `Objet: Merci pour l'entretien - {poste}

Bonjour {contact},

Je tenais à vous remercier pour le temps que vous m'avez accordé lors de notre entretien pour le poste de {poste}.

Notre échange m'a confirmé mon intérêt pour rejoindre {entreprise} et contribuer à vos projets.

Je reste disponible pour toute information complémentaire.

Cordialement,
{nom}`,
        variables: ['poste', 'contact', 'entreprise', 'nom'],
        category: 'Entretien',
        successRate: 85,
        usageCount: 0,
        aiOptimized: true
      }
    ];
  }

  // Actions des suggestions
  private createFollowUpReminder(candidature: Candidature): void {
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 1);

    this.notificationService.addManualReminder({
      title: `Relancer ${candidature.entreprise}`,
      description: `Envoyer un email de suivi pour le poste de ${candidature.poste}`,
      reminderDate
    });

    this.dismissSuggestion(`follow_up_${candidature.id}`);
  }

  private analyzeFailure(candidature: Candidature): void {
    // Ouvrir une analyse détaillée de l'échec
    console.log('Analyse d\'échec pour:', candidature.entreprise);
    this.dismissSuggestion(`optimize_${candidature.id}`);
  }

  private openInterviewGuide(candidature: Candidature): void {
    // Ouvrir le guide de préparation d'entretien
    console.log('Guide d\'entretien pour:', candidature.entreprise);
  }

  private createNewCandidature(): void {
    // Rediriger vers la création de candidature
    console.log('Créer nouvelle candidature');
  }

  private showSourceTips(): void {
    this.notificationService.addSystemNotification({
      type: 'info',
      title: 'Conseils pour diversifier vos sources',
      message: 'LinkedIn pour le networking, Indeed pour la variété, sites d\'entreprises pour les opportunités exclusives.'
    });
  }

  private showOptimizationTips(): void {
    this.notificationService.addSystemNotification({
      type: 'info',
      title: 'Conseils d\'optimisation',
      message: 'Personnalisez chaque candidature, adaptez votre CV aux mots-clés de l\'offre, soignez votre lettre de motivation.'
    });
  }

  // Méthodes publiques
  dismissSuggestion(suggestionId: string): void {
    this._aiSuggestions.update(suggestions =>
      suggestions.filter(s => s.id !== suggestionId)
    );
    this.saveAutomationData();
  }

  toggleAutomationRule(ruleId: string): void {
    this._automationRules.update(rules =>
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    this.saveAutomationData();
  }

  addCustomRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'executionCount'>): void {
    const newRule: AutomationRule = {
      ...rule,
      id: 'custom_' + Date.now(),
      createdAt: new Date(),
      executionCount: 0
    };

    this._automationRules.update(rules => [...rules, newRule]);
    this.saveAutomationData();
  }

  setAIEnabled(enabled: boolean): void {
    this._aiEnabled.set(enabled);
    this.saveAutomationData();
  }

  setAutomationEnabled(enabled: boolean): void {
    this._automationEnabled.set(enabled);
    this.saveAutomationData();
  }

  // Utilitaires
  private getDaysSince(dateStr: string): number {
    const date = this.parseDateFr(dateStr);
    if (!date) return 0;
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  private isThisWeek(dateStr: string): boolean {
    const date = this.parseDateFr(dateStr);
    if (!date) return false;

    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);

    return date >= weekStart;
  }

  private parseDateFr(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  }
}
