// src/app/components/candidature-card/candidature-card.component.ts
import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Candidature } from '../../models/candidature.model';
import { QuickAction } from '../../models/kanban.model';

@Component({
  selector: 'app-candidature-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule,
    MatProgressBarModule
  ],
  template: `
    <mat-card class="candidature-card" [class.urgent]="isUrgent()" [class.overdue]="isOverdue()">
      <!-- Header avec entreprise et actions rapides -->
      <div class="card-header">
        <div class="entreprise-info">
          <h3 class="entreprise-name">{{ candidature.entreprise }}</h3>
          <div class="card-badges">
            <mat-chip-set>
              <mat-chip class="type-chip" [class.job]="candidature.type === 'Job'" [class.stage]="candidature.type === 'Stage'">
                <mat-icon>{{ candidature.type === 'Job' ? 'work' : 'school' }}</mat-icon>
                {{ candidature.type }}
              </mat-chip>
              <mat-chip *ngIf="isUrgent()" class="urgent-chip">
                <mat-icon>notification_important</mat-icon>
                Urgent
              </mat-chip>
            </mat-chip-set>
          </div>
        </div>

        <!-- Menu actions rapides -->
        <button mat-icon-button [matMenuTriggerFor]="quickActionsMenu" class="quick-actions-btn" (click)="$event.stopPropagation()">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #quickActionsMenu="matMenu">
          <button mat-menu-item *ngFor="let action of quickActions" (click)="executeQuickAction(action)">
            <mat-icon [style.color]="action.color">{{ action.icon }}</mat-icon>
            <span>{{ action.label }}</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="onEdit()">
            <mat-icon>edit</mat-icon>
            <span>Modifier</span>
          </button>
          <button mat-menu-item (click)="onViewDetails()">
            <mat-icon>visibility</mat-icon>
            <span>Voir détails</span>
          </button>
        </mat-menu>
      </div>

      <!-- Contenu principal -->
      <div class="card-content">
        <h4 class="poste-title">{{ candidature.poste }}</h4>

        <!-- Informations clés -->
        <div class="card-info">
          <div class="info-item">
            <mat-icon class="info-icon">location_on</mat-icon>
            <span>{{ candidature.ville }}{{ candidature.region ? ', ' + candidature.region : '' }}</span>
          </div>

          <div class="info-item">
            <mat-icon class="info-icon">event</mat-icon>
            <span>{{ candidature.date }} ({{ getTimeAgo() }})</span>
          </div>

          <div class="info-item" *ngIf="candidature.contact">
            <mat-icon class="info-icon">person</mat-icon>
            <span>{{ candidature.contact }}</span>
          </div>
        </div>

        <!-- Priorité -->
        <div class="priority-section">
          <span class="priority-label">Priorité :</span>
          <div class="priority-stars">
            <mat-icon *ngFor="let star of [1,2,3]"
                     [class.active]="star <= candidature.ranking"
                     class="priority-star">
              {{ star <= candidature.ranking ? 'star' : 'star_border' }}
            </mat-icon>
          </div>
        </div>

        <!-- Barre de progression -->
        <div class="progress-section" *ngIf="progressValue() > 0">
          <div class="progress-label">
            <span>Progression</span>
            <span class="progress-percentage">{{ progressValue() }}%</span>
          </div>
          <mat-progress-bar mode="determinate" [value]="progressValue()" [color]="getProgressColor()"></mat-progress-bar>
        </div>

        <!-- Source et rappel -->
        <div class="card-footer">
          <div class="source-info">
            <mat-icon class="source-icon">{{ getSourceIcon() }}</mat-icon>
            <span class="source-text">{{ candidature.source }}</span>
          </div>

          <div class="reminder-info" *ngIf="candidature.dateRappel">
            <mat-icon [class.reminder-urgent]="isReminderUrgent()" class="reminder-icon">
              {{ getReminderIcon() }}
            </mat-icon>
            <span class="reminder-text" [class.reminder-urgent]="isReminderUrgent()">
              {{ getReminderText() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Overlay pour feedback visuel pendant le drag -->
      <div class="drag-overlay" [class.dragging]="isDragging()"></div>
    </mat-card>
  `,
  styleUrls: ['./candidature-card.component.scss']
})
export class CandidatureCardComponent {
  @Input({ required: true }) candidature!: Candidature;
  @Input() quickActions: QuickAction[] = [];
  @Input() isDragging = signal(false);

  @Output() edit = new EventEmitter<Candidature>();
  @Output() viewDetails = new EventEmitter<Candidature>();
  @Output() quickAction = new EventEmitter<{ action: QuickAction; candidature: Candidature }>();

  private today = new Date();

  constructor() {
    this.today.setHours(0, 0, 0, 0);
  }

  progressValue = computed(() => {
    const statusProgress: { [key: string]: number } = {
      'Brouillon': 10,
      'Envoyée': 25,
      'En attente': 50,
      'En discussion': 75,
      'Accepté': 100,
      'Refus': 0
    };
    return statusProgress[this.candidature.reponse] || 0;
  });

  getProgressColor(): string {
    const value = this.progressValue();
    if (value >= 75) return 'primary';
    if (value >= 50) return 'accent';
    return 'warn';
  }

  isUrgent(): boolean {
    return this.candidature.ranking === 1 || this.isReminderUrgent();
  }

  isOverdue(): boolean {
    if (!this.candidature.dateRappel) return false;
    const reminderDate = this.parseDateFr(this.candidature.dateRappel);
    return reminderDate ? reminderDate < this.today : false;
  }

  isReminderUrgent(): boolean {
    if (!this.candidature.dateRappel) return false;
    const reminderDate = this.parseDateFr(this.candidature.dateRappel);
    if (!reminderDate) return false;

    const diffTime = reminderDate.getTime() - this.today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 0; // Aujourd'hui ou passé
  }

  getTimeAgo(): string {
    const candidatureDate = this.parseDateFr(this.candidature.date);
    if (!candidatureDate) return '';

    const diffTime = this.today.getTime() - candidatureDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  }

  getSourceIcon(): string {
    const sourceIcons: { [key: string]: string } = {
      'LinkedIn': 'link',
      'Indeed': 'search',
      'Internet': 'language',
      'Welcome!ToTheJungle': 'nature',
      'Relation': 'people',
      'Autre': 'more_horiz'
    };
    return sourceIcons[this.candidature.source] || 'source';
  }

  getReminderIcon(): string {
    if (this.isReminderUrgent()) return 'notification_important';
    return 'event_upcoming';
  }

  getReminderText(): string {
    if (!this.candidature.dateRappel) return '';

    const reminderDate = this.parseDateFr(this.candidature.dateRappel);
    if (!reminderDate) return this.candidature.dateRappel;

    const diffTime = reminderDate.getTime() - this.today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `En retard de ${Math.abs(diffDays)} jour(s)`;
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Demain';
    return `Dans ${diffDays} jour(s)`;
  }

  private parseDateFr(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  }

  executeQuickAction(action: QuickAction): void {
    this.quickAction.emit({ action, candidature: this.candidature });
  }

  onEdit(): void {
    this.edit.emit(this.candidature);
  }

  onViewDetails(): void {
    this.viewDetails.emit(this.candidature);
  }
}
