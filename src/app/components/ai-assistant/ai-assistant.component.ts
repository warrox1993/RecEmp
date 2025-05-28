// src/app/components/ai-assistant/ai-assistant.component.ts - VERSION COMPLÈTE CORRIGÉE
import { Component, OnInit, OnDestroy, signal, computed, WritableSignal, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Subscription, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Interfaces pour typer les données
interface AIMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'error' | 'success';
}

interface AISuggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
}

interface AutomationTask {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
}

interface AutomationService {
  getTasks(): AutomationTask[];
  getConfig(): any;
  getStatus(): string;
  getData(): any;
  runTask(taskId: string): Promise<void>;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatDividerModule,
    MatMenuModule
  ],
  template: `
    <div class="ai-assistant-container">
      <!-- Header avec notifications -->
      <div class="ai-header">
        <h2>
          <mat-icon>smart_toy</mat-icon>
          Assistant IA ProTrack CV
        </h2>

        <button
          mat-icon-button
          [matBadge]="notificationCount()"
          matBadgeColor="warn"
          [matBadgeHidden]="notificationCount() === 0"
          matTooltip="Notifications IA"
          [matMenuTriggerFor]="notificationMenu">
          <mat-icon>notifications_active</mat-icon>
        </button>

        <mat-menu #notificationMenu="matMenu">
          <button mat-menu-item *ngFor="let suggestion of suggestions()" (click)="applySuggestion(suggestion)">
            <mat-icon [style.color]="getSuggestionColor(suggestion.priority)">lightbulb</mat-icon>
            <span>{{ suggestion.title }}</span>
          </button>
          <mat-divider *ngIf="suggestions().length > 0"></mat-divider>
          <button mat-menu-item (click)="clearNotifications()">
            <mat-icon>clear_all</mat-icon>
            <span>Tout effacer</span>
          </button>
        </mat-menu>
      </div>

      <!-- Status de l'automation -->
      <mat-card class="automation-status" *ngIf="automationTasks().length > 0">
        <mat-card-title>
          <mat-icon>settings</mat-icon>
          Tâches d'automation
        </mat-card-title>
        <mat-card-content>
          <div *ngFor="let task of automationTasks()" class="task-item">
            <div class="task-info">
              <span class="task-name">{{ task.name }}</span>
              <span class="task-status" [class]="'status-' + task.status">{{ getStatusLabel(task.status) }}</span>
            </div>
            <mat-progress-bar
              *ngIf="task.status === 'running'"
              [value]="task.progress"
              mode="determinate">
            </mat-progress-bar>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Chat Interface -->
      <mat-card class="ai-chat">
        <mat-card-title>
          <mat-icon>chat</mat-icon>
          Conversation
        </mat-card-title>

        <mat-card-content>
          <div class="messages-container" #messagesContainer>
            <div *ngFor="let message of messages(); trackBy: trackByMessage"
                 class="message"
                 [class.user-message]="message.isUser"
                 [class.ai-message]="!message.isUser">

              <div class="message-avatar">
                <mat-icon>{{ message.isUser ? 'person' : 'smart_toy' }}</mat-icon>
              </div>

              <div class="message-content">
                <p>{{ message.content }}</p>
                <span class="message-time">{{ message.timestamp | date:'short' }}</span>
              </div>
            </div>

            <div *ngIf="isTyping()" class="typing-indicator">
              <mat-icon>smart_toy</mat-icon>
              <span>L'IA réfléchit...</span>
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          <!-- Input pour nouveau message -->
          <div class="message-input">
            <mat-form-field appearance="outline" class="input-field">
              <mat-label>Posez votre question...</mat-label>
              <input
                matInput
                [formControl]="messageControl"
                (keydown.enter)="sendMessage()"
                [disabled]="isTyping()"
                placeholder="Ex: Comment améliorer mes candidatures ?">
              <mat-icon matSuffix>chat</mat-icon>
            </mat-form-field>

            <button
              mat-fab
              color="primary"
              (click)="sendMessage()"
              [disabled]="!messageControl.valid || isTyping()"
              matTooltip="Envoyer le message">
              <mat-icon>send</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Suggestions rapides -->
      <mat-card class="quick-suggestions" *ngIf="quickSuggestions().length > 0">
        <mat-card-title>
          <mat-icon>tips_and_updates</mat-icon>
          Suggestions rapides
        </mat-card-title>
        <mat-card-content>
          <mat-chip-set>
            <mat-chip
              *ngFor="let suggestion of quickSuggestions()"
              (click)="sendQuickMessage(suggestion)"
              [class]="'priority-' + suggestion.priority">
              {{ suggestion.title }}
            </mat-chip>
          </mat-chip-set>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./ai-assistant.component.scss']
})
export class AiAssistantComponent implements OnInit, OnDestroy {

  private snackBar = inject(MatSnackBar);
  private automationService: AutomationService;

  // Signals pour l'état du composant
  private _messages: WritableSignal<AIMessage[]> = signal<AIMessage[]>([]);
  private _suggestions: WritableSignal<AISuggestion[]> = signal<AISuggestion[]>([]);
  private _automationTasks: WritableSignal<AutomationTask[]> = signal<AutomationTask[]>([]);
  private _isTyping: WritableSignal<boolean> = signal(false);

  // Signals publics en lecture seule
  public readonly messages: Signal<AIMessage[]> = this._messages.asReadonly();
  public readonly suggestions: Signal<AISuggestion[]> = this._suggestions.asReadonly();
  public readonly automationTasks: Signal<AutomationTask[]> = this._automationTasks.asReadonly();
  public readonly isTyping: Signal<boolean> = this._isTyping.asReadonly();

  // Signals calculés
  public readonly notificationCount = computed(() => this.suggestions().length);
  public readonly quickSuggestions = computed(() =>
    this.suggestions().filter(s => s.priority === 'high').slice(0, 5)
  );

  // Form control pour l'input
  public messageControl = new FormControl('', [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(500)
  ]);

  private subscriptions = new Subscription();

  constructor() {
    this.automationService = this.createMockAutomationService();
    this.setupMessageControl();
    this.loadInitialData();
  }

  ngOnInit(): void {
    this.startPeriodicUpdates();
    this.addWelcomeMessage();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupMessageControl(): void {
    this.subscriptions.add(
      this.messageControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe(value => {
        if (value && value.length > 10) {
          this.generateAutoSuggestions(value);
        }
      })
    );
  }

  private loadInitialData(): void {
    this.loadAutomationTasks();
    this.generateInitialSuggestions();
  }

  private loadAutomationTasks(): void {
    if (this.automationService) {
      try {
        const tasks = this.automationService.getTasks();
        this._automationTasks.set(tasks);
      } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
      }
    }
  }

  // ✅ CORRECTION PRINCIPALE - Ligne 304 corrigée
  private startPeriodicUpdates(): void {
    // ✅ Utilisation de timer() de RxJS au lieu de setInterval
    this.subscriptions.add(
      timer(0, 5000).subscribe(() => {
        if (this.automationService) {
          this.loadAutomationTasks();
        }
      })
    );
  }

  // Méthodes publiques pour l'interface
  public sendMessage(): void {
    const content = this.messageControl.value?.trim();
    if (!content || this.isTyping()) return;

    this.addMessage(content, true);
    this.messageControl.reset();
    this.simulateAIResponse(content);
  }

  public sendQuickMessage(suggestion: AISuggestion): void {
    this.messageControl.setValue(suggestion.description);
    this.sendMessage();
  }

  public applySuggestion(suggestion: AISuggestion): void {
    this.showSuccess(`Suggestion appliquée: ${suggestion.title}`);
    this.removeSuggestion(suggestion.id);
  }

  public clearNotifications(): void {
    this._suggestions.set([]);
    this.showSuccess('Toutes les notifications ont été effacées');
  }

  public getSuggestionColor(priority: string): string {
    const colors = {
      'high': '#f44336',
      'medium': '#ff9800',
      'low': '#4caf50'
    };
    return colors[priority as keyof typeof colors] || '#666';
  }

  public getStatusLabel(status: string): string {
    const labels = {
      'pending': 'En attente',
      'running': 'En cours',
      'completed': 'Terminé',
      'failed': 'Échec'
    };
    return labels[status as keyof typeof labels] || status;
  }

  public trackByMessage(index: number, message: AIMessage): string {
    return message.id;
  }

  // Méthodes privées utilitaires
  private addMessage(content: string, isUser: boolean): void {
    const message: AIMessage = {
      id: Date.now().toString(),
      content,
      isUser,
      timestamp: new Date(),
      type: 'text'
    };

    this._messages.update(messages => [...messages, message]);
  }

  private simulateAIResponse(userMessage: string): void {
    this._isTyping.set(true);

    setTimeout(() => {
      const response = this.generateAIResponse(userMessage);
      this.addMessage(response, false);
      this._isTyping.set(false);
      this.generateContextualSuggestions(userMessage);
    }, 1500 + Math.random() * 1000);
  }

  private generateAIResponse(userMessage: string): string {
    const responses = [
      "Excellente question ! Pour améliorer vos candidatures, je recommande de personnaliser chaque lettre de motivation.",
      "D'après vos données, votre taux de réponse pourrait être amélioré en ciblant mieux vos candidatures.",
      "Je vois que vous avez plusieurs candidatures en attente. Voulez-vous que je vous aide à planifier des relances ?",
      "Basé sur les tendances actuelles du marché, voici mes recommandations...",
      "Votre profil semble bien adapté aux postes tech. Concentrez-vous sur ces secteurs."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateInitialSuggestions(): void {
    const initialSuggestions: AISuggestion[] = [
      {
        id: '1',
        title: 'Optimiser les candidatures',
        description: 'Analyser les candidatures avec le meilleur taux de réponse',
        action: 'analyze_applications',
        priority: 'high'
      },
      {
        id: '2',
        title: 'Planifier des relances',
        description: 'Créer des rappels automatiques pour le suivi',
        action: 'create_reminders',
        priority: 'medium'
      }
    ];

    this._suggestions.set(initialSuggestions);
  }

  private generateAutoSuggestions(input: string): void {
    console.log('Génération de suggestions auto pour:', input);
  }

  private generateContextualSuggestions(context: string): void {
    const contextualSuggestion: AISuggestion = {
      id: Date.now().toString(),
      title: 'Action recommandée',
      description: 'Basé sur votre question, voici une action suggérée',
      action: 'contextual_action',
      priority: 'medium'
    };

    this._suggestions.update(suggestions => [...suggestions, contextualSuggestion]);
  }

  private addWelcomeMessage(): void {
    this.addMessage(
      "Bonjour ! Je suis votre assistant IA pour ProTrack CV. Comment puis-je vous aider aujourd'hui ?",
      false
    );
  }

  private removeSuggestion(id: string): void {
    this._suggestions.update(suggestions =>
      suggestions.filter(s => s.id !== id)
    );
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private createMockAutomationService(): AutomationService {
    return {
      getTasks: () => [
        {
          id: '1',
          name: 'Analyse des candidatures',
          status: 'completed',
          progress: 100
        },
        {
          id: '2',
          name: 'Génération de rappels',
          status: 'running',
          progress: 65
        }
      ],
      getConfig: () => ({}),
      getStatus: () => 'active',
      getData: () => ({}),
      runTask: async (taskId: string) => {
        console.log('Exécution de la tâche:', taskId);
      }
    };
  }
}
