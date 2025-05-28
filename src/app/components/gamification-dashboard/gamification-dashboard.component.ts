// src/app/components/gamification-dashboard/gamification-dashboard.component.ts - CORRECTIONS COMPLÈTES

import { Component, OnInit, OnDestroy, signal, computed, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

// Interfaces pour typer les données
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface UserStats {
  level: number;
  experience: number;
  nextLevelExp: number;
  totalApplications: number;
  successRate: number;
  streak: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: string;
  deadline: Date;
  isCompleted: boolean;
  isActive: boolean; // ✅ CORRECTION pour ligne 174
}

// Service simulé
interface GamificationService {
  getUserStats(): UserStats;
  getAchievements(): Achievement[];
  getChallenges(): Challenge[];
  completeChallenge(challengeId: string): Promise<void>;
}

@Component({
  selector: 'app-gamification-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  template: `
    <div class="gamification-container">
      <!-- User Stats Card -->
      <mat-card class="stats-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>emoji_events</mat-icon>
            Vos Statistiques
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="user-level">
            <h2>Niveau {{ userStats()?.level || 1 }}</h2>
            <mat-progress-bar
              [value]="getExperienceProgress()"
              mode="determinate">
            </mat-progress-bar>
            <p>{{ userStats()?.experience || 0 }} / {{ userStats()?.nextLevelExp || 100 }} XP</p>
          </div>

          <div class="stats-grid">
            <div class="stat-item">
              <mat-icon>work</mat-icon>
              <span class="stat-value">{{ userStats()?.totalApplications || 0 }}</span>
              <span class="stat-label">Candidatures</span>
            </div>
            <div class="stat-item">
              <mat-icon>trending_up</mat-icon>
              <span class="stat-value">{{ userStats()?.successRate || 0 }}%</span>
              <span class="stat-label">Taux de succès</span>
            </div>
            <div class="stat-item">
              <mat-icon>local_fire_department</mat-icon>
              <span class="stat-value">{{ userStats()?.streak || 0 }}</span>
              <span class="stat-label">Série active</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Achievements -->
      <mat-card class="achievements-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>military_tech</mat-icon>
            Succès & Achievements
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="achievements-grid">
            <div *ngFor="let achievement of achievements(); trackBy: trackByAchievement"
                 class="achievement-item"
                 [class.unlocked]="achievement.isUnlocked">

              <div class="achievement-icon">
                <mat-icon [style.color]="achievement.isUnlocked ? '#4caf50' : '#ccc'">
                  {{ achievement.icon }}
                </mat-icon>
              </div>

              <div class="achievement-info">
                <h4>{{ achievement.title }}</h4>
                <p>{{ achievement.description }}</p>
                <mat-progress-bar
                  *ngIf="!achievement.isUnlocked"
                  [value]="(achievement.progress / achievement.maxProgress) * 100"
                  mode="determinate">
                </mat-progress-bar>
                <span *ngIf="!achievement.isUnlocked" class="progress-text">
                  {{ achievement.progress }} / {{ achievement.maxProgress }}
                </span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Active Challenges -->
      <mat-card class="challenges-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>flag</mat-icon>
            Défis Actifs
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="challenges-list">
            <div *ngFor="let challenge of activeChallenges(); trackBy: trackByChallenge"
                 class="challenge-item">

              <div class="challenge-info">
                <h4>{{ challenge.title }}</h4>
                <p>{{ challenge.description }}</p>
                <p class="challenge-reward">
                  <mat-icon>star</mat-icon>
                  Récompense: {{ challenge.reward }}
                </p>
                <p class="challenge-deadline">
                  <mat-icon>schedule</mat-icon>
                  Échéance: {{ challenge.deadline | date:'short' }}
                </p>
              </div>

              <!-- ✅ CORRECTION - Remplacement de [selected] par [class.selected] -->
              <mat-chip
                [class.selected]="challenge.isActive"
                [class.completed]="challenge.isCompleted"
                (click)="toggleChallenge(challenge)">
                {{ challenge.isCompleted ? 'Terminé' : 'En cours' }}
              </mat-chip>

              <button
                mat-button
                color="primary"
                *ngIf="!challenge.isCompleted"
                (click)="completeChallenge(challenge)">
                Compléter
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./gamification-dashboard.component.scss']
})
export class GamificationDashboardComponent implements OnInit, OnDestroy {

  // ✅ CORRECTION - Service initialisé correctement avec valeur par défaut
  private gamificationService: GamificationService;

  // Signals pour l'état
  private _userStats: WritableSignal<UserStats | null> = signal<UserStats | null>(null);
  private _achievements: WritableSignal<Achievement[]> = signal<Achievement[]>([]);
  private _challenges: WritableSignal<Challenge[]> = signal<Challenge[]>([]);

  // Signals publics
  public readonly userStats: Signal<UserStats | null> = this._userStats.asReadonly();
  public readonly achievements: Signal<Achievement[]> = this._achievements.asReadonly();
  public readonly challenges: Signal<Challenge[]> = this._challenges.asReadonly();

  // Signal calculé pour les défis actifs
  public readonly activeChallenges = computed(() =>
    this.challenges().filter(challenge => challenge.isActive && !challenge.isCompleted)
  );

  private subscriptions = new Subscription();

  constructor() {
    // ✅ CORRECTION - Initialisation dans le constructeur
    this.gamificationService = this.createMockGamificationService();
    this.loadInitialData();
  }

  ngOnInit(): void {
    this.setupPeriodicUpdates();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ✅ CORRECTION - Méthodes d'initialisation sûres
  private loadInitialData(): void {
    try {
      // ✅ CORRECTION lignes 875-880 - Service utilisé après initialisation
      const stats = this.gamificationService.getUserStats();
      const achievements = this.gamificationService.getAchievements();
      const challenges = this.gamificationService.getChallenges();

      this._userStats.set(stats);
      this._achievements.set(achievements);
      this._challenges.set(challenges);

    } catch (error) {
      console.error('Erreur lors du chargement des données de gamification:', error);
      this.setDefaultData();
    }
  }

  private setDefaultData(): void {
    this._userStats.set({
      level: 1,
      experience: 0,
      nextLevelExp: 100,
      totalApplications: 0,
      successRate: 0,
      streak: 0
    });
    this._achievements.set([]);
    this._challenges.set([]);
  }

  private setupPeriodicUpdates(): void {
    // Mise à jour des stats toutes les 30 secondes
    const interval = setInterval(() => {
      this.refreshStats();
    }, 30000);

    // Nettoyer l'interval au destroy
    this.subscriptions.add(() => clearInterval(interval));
  }

  private refreshStats(): void {
    if (this.gamificationService) {
      const updatedStats = this.gamificationService.getUserStats();
      this._userStats.set(updatedStats);
    }
  }

  // Méthodes publiques
  public getExperienceProgress(): number {
    const stats = this.userStats();
    if (!stats) return 0; // ✅ CORRECTION ligne 218 - Gestion du undefined

    return (stats.experience / stats.nextLevelExp) * 100;
  }

  public toggleChallenge(challenge: Challenge): void {
    this._challenges.update(challenges =>
      challenges.map(c =>
        c.id === challenge.id ? { ...c, isActive: !c.isActive } : c
      )
    );
  }

  public async completeChallenge(challenge: Challenge): Promise<void> {
    try {
      await this.gamificationService.completeChallenge(challenge.id);

      this._challenges.update(challenges =>
        challenges.map(c =>
          c.id === challenge.id ? { ...c, isCompleted: true } : c
        )
      );

      // Rafraîchir les stats après completion
      this.refreshStats();

    } catch (error) {
      console.error('Erreur lors de la completion du défi:', error);
    }
  }

  // TrackBy functions pour les performances
  public trackByAchievement(index: number, achievement: Achievement): string {
    return achievement.id;
  }

  public trackByChallenge(index: number, challenge: Challenge): string {
    return challenge.id;
  }

  // ✅ SERVICE SIMULÉ - Remplacez par votre vraie implémentation
  private createMockGamificationService(): GamificationService {
    return {
      getUserStats: (): UserStats => ({
        level: 3,
        experience: 150,
        nextLevelExp: 200,
        totalApplications: 25,
        successRate: 68,
        streak: 5
      }),

      getAchievements: (): Achievement[] => [
        {
          id: '1',
          title: 'Premier Pas',
          description: 'Créer votre première candidature',
          icon: 'first_page',
          isUnlocked: true,
          progress: 1,
          maxProgress: 1
        },
        {
          id: '2',
          title: 'Productif',
          description: 'Créer 10 candidatures',
          icon: 'productivity',
          isUnlocked: false,
          progress: 7,
          maxProgress: 10
        }
      ],

      getChallenges: (): Challenge[] => [
        {
          id: '1',
          title: 'Challenge Hebdomadaire',
          description: 'Postuler à 5 emplois cette semaine',
          reward: '50 XP',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isCompleted: false,
          isActive: true
        },
        {
          id: '2',
          title: 'Perfectionniste',
          description: 'Obtenir un taux de réponse de 80%',
          reward: '100 XP + Badge Spécial',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isCompleted: false,
          isActive: true
        }
      ],

      completeChallenge: async (challengeId: string): Promise<void> => {
        console.log('Défi complété:', challengeId);
        // Simulation d'API call
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    };
  }
}
