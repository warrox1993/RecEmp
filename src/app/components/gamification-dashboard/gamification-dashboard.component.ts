// src/app/components/gamification-dashboard/gamification-dashboard.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { GamificationService, Achievement } from '../../services/gamification.service';

@Component({
  selector: 'app-gamification-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatChipsModule,
    MatTabsModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="gamification-dashboard" [@slideIn]>

      <!-- En-tête avec niveau et XP -->
      <div class="level-header" [@levelAnimation]>
        <div class="level-circle">
          <div class="level-content">
            <div class="level-number">{{ userStats().level }}</div>
            <div class="level-label">NIVEAU</div>
          </div>
          <svg class="level-progress" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="#e0e0e0" stroke-width="4" fill="none"/>
            <circle
              cx="50" cy="50" r="45"
              stroke="url(#levelGradient)"
              stroke-width="4"
              fill="none"
              [attr.stroke-dasharray]="circumference"
              [attr.stroke-dashoffset]="progressOffset()"
              class="progress-circle"/>
            <defs>
              <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#10B981"/>
                <stop offset="100%" style="stop-color:#34D399"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div class="stats-info">
          <h2 class="user-title">{{ userStats().title }}</h2>
          <div class="rank-badge">{{ userStats().rank }}</div>

          <div class="xp-info">
            <div class="xp-current">{{ userStats().xp }} XP</div>
            <mat-progress-bar
              mode="determinate"
              [value]="progressToNextLevel()"
              color="accent"
              class="xp-bar">
            </mat-progress-bar>
            <div class="xp-next">{{ getXPToNextLevel() }} XP jusqu'au niveau {{ userStats().level + 1 }}</div>
          </div>

          <div class="quick-stats">
            <div class="stat-item">
              <mat-icon>local_fire_department</mat-icon>
              <span>{{ userStats().currentStreak }} jours</span>
              <small>Série actuelle</small>
            </div>
            <div class="stat-item">
              <mat-icon>emoji_events</mat-icon>
              <span>{{ unlockedAchievements().length }}</span>
              <small>Achievements</small>
            </div>
            <div class="stat-item">
              <mat-icon>trending_up</mat-icon>
              <span>{{ userStats().successRate }}%</span>
              <small>Taux de succès</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Onglets principaux -->
      <mat-tab-group class="gamification-tabs" animationDuration="300ms">

        <!-- Onglet Achievements -->
        <mat-tab label="🏆 Achievements">
          <div class="tab-content achievements-tab">

            <!-- Achievements récents -->
            <div *ngIf="recentAchievements().length > 0" class="recent-achievements">
              <h3>
                <mat-icon color="primary">new_releases</mat-icon>
                Récemment débloqués
              </h3>
              <div class="achievement-grid recent-grid" [@achievementAnimation]>
                <div
                  *ngFor="let achievement of recentAchievements(); trackBy: trackByAchievement"
                  class="achievement-card unlocked recent"
                  [attr.data-rarity]="achievement.rarity">
                  <div class="achievement-icon">
                    <mat-icon>{{ achievement.icon }}</mat-icon>
                    <div class="rarity-glow"></div>
                  </div>
                  <div class="achievement-info">
                    <h4>{{ achievement.title }}</h4>
                    <p>{{ achievement.description }}</p>
                    <div class="achievement-reward">
                      <mat-icon>star</mat-icon>
                      +{{ achievement.reward?.xp }} XP
                    </div>
                  </div>
                  <div class="achievement-rarity">{{ getRarityLabel(achievement.rarity) }}</div>
                </div>
              </div>
            </div>

            <!-- Achievements en cours -->
            <div class="in-progress-achievements">
              <h3>
                <mat-icon color="accent">trending_up</mat-icon>
                En cours de déblocage
              </h3>
              <div class="achievement-grid" [@achievementAnimation]>
                <div
                  *ngFor="let achievement of availableAchievements().slice(0, 6); trackBy: trackByAchievement"
                  class="achievement-card in-progress"
                  [attr.data-rarity]="achievement.rarity">
                  <div class="achievement-icon">
                    <mat-icon>{{ achievement.icon }}</mat-icon>
                  </div>
                  <div class="achievement-info">
                    <h4>{{ achievement.title }}</h4>
                    <p>{{ achievement.description }}</p>
                    <div class="progress-info">
                      <mat-progress-bar
                        mode="determinate"
                        [value]="getAchievementProgress(achievement.id)"
                        color="primary">
                      </mat-progress-bar>
                      <span class="progress-text">
                        {{ achievement.progress }}/{{ achievement.maxProgress }}
                      </span>
                    </div>
                  </div>
                  <div class="achievement-rarity">{{ getRarityLabel(achievement.rarity) }}</div>
                </div>
              </div>
            </div>

            <!-- Tous les achievements -->
            <div class="all-achievements">
              <h3>
                <mat-icon>military_tech</mat-icon>
                Collection complète
              </h3>

              <div class="filter-chips">
                <mat-chip-set>
                  <mat-chip
                    *ngFor="let category of achievementCategories"
                    [selected]="selectedCategory() === category.value"
                    (click)="setSelectedCategory(category.value)"
                    class="filter-chip">
                    <mat-icon>{{ category.icon }}</mat-icon>
                    {{ category.label }}
                  </mat-chip>
                </mat-chip-set>
              </div>

              <div class="achievement-grid all-grid" [@achievementAnimation]>
                <div
                  *ngFor="let achievement of filteredAchievements(); trackBy: trackByAchievement"
                  class="achievement-card"
                  [class.unlocked]="achievement.unlockedAt"
                  [class.locked]="!achievement.unlockedAt"
                  [attr.data-rarity]="achievement.rarity"
                  [matTooltip]="getAchievementTooltip(achievement)">

                  <div class="achievement-icon">
                    <mat-icon>{{ achievement.unlockedAt ? achievement.icon : 'lock' }}</mat-icon>
                    <div *ngIf="achievement.unlockedAt" class="rarity-glow"></div>
                  </div>

                  <div class="achievement-info">
                    <h4>{{ achievement.unlockedAt ? achievement.title : '???' }}</h4>
                    <p>{{ achievement.unlockedAt ? achievement.description : 'Achievement verrouillé' }}</p>

                    <div *ngIf="!achievement.unlockedAt && achievement.progress > 0" class="progress-info">
                      <mat-progress-bar
                        mode="determinate"
                        [value]="getAchievementProgress(achievement.id)"
                        color="primary">
                      </mat-progress-bar>
                      <span class="progress-text">
                        {{ achievement.progress }}/{{ achievement.maxProgress }}
                      </span>
                    </div>

                    <div *ngIf="achievement.unlockedAt" class="unlock-date">
                      Débloqué le {{ achievement.unlockedAt | date:'dd/MM/yyyy' }}
                    </div>

                    <div *ngIf="achievement.reward?.xp" class="achievement-reward">
                      <mat-icon>star</mat-icon>
                      +{{ achievement.reward.xp }} XP
                    </div>
                  </div>

                  <div class="achievement-rarity">{{ getRarityLabel(achievement.rarity) }}</div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Onglet Défis quotidiens -->
        <mat-tab label="⚡ Défis du jour">
          <div class="tab-content challenges-tab">
            <div class="challenges-header">
              <h3>
                <mat-icon color="accent">flash_on</mat-icon>
                Défis quotidiens
              </h3>
              <div class="reset-timer">
                <mat-icon>schedule</mat-icon>
                Nouveau défis dans {{ getTimeToMidnight() }}
              </div>
            </div>

            <div class="challenges-grid" [@challengeAnimation]>
              <div
                *ngFor="let challenge of dailyChallenges(); trackBy: trackByChallenge"
                class="challenge-card"
                [class.completed]="challenge.completed">

                <div class="challenge-header">
                  <div class="challenge-icon">
                    <mat-icon [color]="challenge.completed ? 'primary' : 'accent'">
                      {{ challenge.completed ? 'check_circle' : challenge.icon }}
                    </mat-icon>
                  </div>
                  <div class="challenge-reward">
                    <mat-icon>star</mat-icon>
                    +{{ challenge.reward }} XP
                  </div>
                </div>

                <div class="challenge-content">
                  <h4>{{ challenge.title }}</h4>
                  <p>{{ challenge.description }}</p>

                  <div class="challenge-progress">
                    <mat-progress-bar
                      mode="determinate"
                      [value]="(challenge.progress / challenge.maxProgress) * 100"
                      [color]="challenge.completed ? 'primary' : 'accent'">
                    </mat-progress-bar>
                    <span class="progress-label">
                      {{ challenge.progress }}/{{ challenge.maxProgress }}
                    </span>
                  </div>
                </div>

                <div *ngIf="challenge.completed" class="completion-badge">
                  <mat-icon>verified</mat-icon>
                  Terminé !
                </div>
              </div>
            </div>

            <!-- Conseils pour progresser -->
            <div class="progress-tips">
              <h4>
                <mat-icon color="primary">tips_and_updates</mat-icon>
                Conseils pour progresser
              </h4>
              <div class="tips-grid">
                <div class="tip-card">
                  <mat-icon>target</mat-icon>
                  <div>
                    <strong>Soyez régulier</strong>
                    <p>Connectez-vous chaque jour pour maintenir votre série</p>
                  </div>
                </div>
                <div class="tip-card">
                  <mat-icon>speed</mat-icon>
                  <div>
                    <strong>Agissez rapidement</strong>
                    <p>Les entreprises apprécient les candidats réactifs</p>
                  </div>
                </div>
                <div class="tip-card">
                  <mat-icon>psychology</mat-icon>
                  <div>
                    <strong>Suivez les suggestions IA</strong>
                    <p>Notre IA vous guide vers le succès</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Onglet Statistiques -->
        <mat-tab label="📊 Mes Stats">
          <div class="tab-content stats-tab">

            <div class="stats-overview">
              <h3>
                <mat-icon color="primary">analytics</mat-icon>
                Vue d'ensemble
              </h3>

              <div class="stats-cards">
                <mat-card class="stat-card primary">
                  <mat-card-content>
                    <div class="stat-icon">
                      <mat-icon>work</mat-icon>
                    </div>
                    <div class="stat-number">{{ userStats().totalCandidatures }}</div>
                    <div class="stat-label">Candidatures créées</div>
                  </mat-card-content>
                </mat-card>

                <mat-card class="stat-card accent">
                  <mat-card-content>
                    <div class="stat-icon">
                      <mat-icon>people</mat-icon>
                    </div>
                    <div class="stat-number">{{ userStats().totalInterviews }}</div>
                    <div class="stat-label">Entretiens obtenus</div>
                  </mat-card-content>
                </mat-card>

                <mat-card class="stat-card success">
                  <mat-card-content>
                    <div class="stat-icon">
                      <mat-icon>trending_up</mat-icon>
                    </div>
                    <div class="stat-number">{{ userStats().successRate }}%</div>
                    <div class="stat-label">Taux de succès</div>
                  </mat-card-content>
                </mat-card>

                <mat-card class="stat-card warning">
                  <mat-card-content>
                    <div class="stat-icon">
                      <mat-icon>local_fire_department</mat-icon>
                    </div>
                    <div class="stat-number">{{ userStats().longestStreak }}</div>
                    <div class="stat-label">Record de série</div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>

            <!-- Objectif hebdomadaire -->
            <div class="weekly-goal">
              <h4>
                <mat-icon color="accent">flag</mat-icon>
                Objectif hebdomadaire
              </h4>
              <div class="goal-progress">
                <div class="goal-info">
                  <span class="goal-current">{{ userStats().weeklyProgress }}</span>
                  <span class="goal-separator">/</span>
                  <span class="goal-target">{{ userStats().weeklyGoal }}</span>
                  <span class="goal-label">candidatures</span>
                </div>
                <mat-progress-bar
                  mode="determinate"
                  [value]="(userStats().weeklyProgress / userStats().weeklyGoal) * 100"
                  color="accent"
                  class="goal-bar">
                </mat-progress-bar>
                <div class="goal-actions">
                  <button
                    mat-stroked-button
                    color="primary"
                    (click)="adjustWeeklyGoal()">
                    <mat-icon>tune</mat-icon>
                    Ajuster l'objectif
                  </button>
                </div>
              </div>
            </div>

            <!-- Comparaisons -->
            <div class="comparisons">
              <h4>
                <mat-icon color="primary">leaderboard</mat-icon>
                Votre progression
              </h4>
              <div class="comparison-items">
                <div class="comparison-item">
                  <div class="comparison-icon">
                    <mat-icon>speed</mat-icon>
                  </div>
                  <div class="comparison-content">
                    <div class="comparison-title">Temps de réponse moyen</div>
                    <div class="comparison-value">{{ userStats().averageResponseTime }} jours</div>
                    <div class="comparison-benchmark">Moyenne du secteur: 10 jours</div>
                  </div>
                  <div class="comparison-status good">
                    <mat-icon>trending_up</mat-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .gamification-dashboard {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .level-header {
      display: flex;
      align-items: center;
      gap: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 20px;
      margin-bottom: 30px;
      position: relative;
      overflow: hidden;
    }

    .level-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grain)"/></svg>');
      opacity: 0.3;
    }

    .level-circle {
      position: relative;
      width: 120px;
      height: 120px;
      flex-shrink: 0;
    }

    .level-content {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 2;
    }

    .level-number {
      font-size: 2.5em;
      font-weight: 700;
      line-height: 1;
    }

    .level-label {
      font-size: 0.8em;
      font-weight: 500;
      opacity: 0.9;
    }

    .level-progress {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .progress-circle {
      transition: stroke-dashoffset 0.5s ease;
    }

    .stats-info {
      flex: 1;
      z-index: 1;
    }

    .user-title {
      font-size: 1.8em;
      font-weight: 600;
      margin: 0 0 10px 0;
    }

    .rank-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: 500;
      font-size: 0.9em;
      margin-bottom: 20px;
    }

    .xp-info {
      margin-bottom: 20px;
    }

    .xp-current {
      font-size: 1.3em;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .xp-bar {
      height: 8px;
      border-radius: 4px;
      margin-bottom: 5px;
    }

    .xp-next {
      font-size: 0.9em;
      opacity: 0.9;
    }

    .quick-stats {
      display: flex;
      gap: 30px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-direction: column;
      text-align: center;
    }

    .stat-item mat-icon {
      font-size: 1.5em;
      margin-bottom: 4px;
    }

    .stat-item span {
      font-weight: 600;
      font-size: 1.1em;
    }

    .stat-item small {
      font-size: 0.8em;
      opacity: 0.8;
    }

    .gamification-tabs {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .tab-content {
      padding: 30px;
    }

    .achievement-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .achievement-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      border: 2px solid #e0e0e0;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .achievement-card.unlocked {
      border-color: #10B981;
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);
    }

    .achievement-card.recent {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(52, 211, 153, 0.05) 100%);
      animation: newAchievement 0.6s ease-out;
    }

    .achievement-card[data-rarity="legendary"] {
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%);
      border-color: #FFD700;
    }

    .achievement-card[data-rarity="epic"] {
      background: linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
      border-color: #9333EA;
    }

    .achievement-card[data-rarity="rare"] {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%);
      border-color: #3B82F6;
    }

    .achievement-icon {
      position: relative;
      width: 60px;
      height: 60px;
      margin: 0 auto 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
      border-radius: 50%;
      color: white;
    }

    .achievement-icon mat-icon {
      font-size: 30px;
    }

    .rarity-glow {
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: linear-gradient(45deg, #FFD700, #FFA500);
      z-index: -1;
      animation: glow 2s ease-in-out infinite alternate;
    }

    .achievement-info h4 {
      margin: 0 0 8px 0;
      font-weight: 600;
      color: #1f2937;
    }

    .achievement-info p {
      margin: 0 0 15px 0;
      color: #6b7280;
      font-size: 0.9em;
      line-height: 1.4;
    }

    .achievement-reward {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
      color: #10B981;
      font-size: 0.9em;
    }

    .achievement-rarity {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.1);
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 0.7em;
      font-weight: 500;
      text-transform: uppercase;
    }

    .progress-info {
      margin-top: 10px;
    }

    .progress-text {
      font-size: 0.8em;
      color: #6b7280;
      margin-top: 4px;
      display: block;
    }

    .challenges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .challenge-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      border: 2px solid #e0e0e0;
      transition: all 0.3s ease;
      position: relative;
    }

    .challenge-card.completed {
      border-color: #10B981;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(52, 211, 153, 0.05) 100%);
    }

    .challenge-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .challenge-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .challenge-reward {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
      color: #10B981;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      border-radius: 16px;
      border: 2px solid;
    }

    .stat-card.primary { border-color: #3B82F6; }
    .stat-card.accent { border-color: #10B981; }
    .stat-card.success { border-color: #059669; }
    .stat-card.warning { border-color: #F59E0B; }

    .stat-card mat-card-content {
      text-align: center;
      padding: 20px !important;
    }

    .stat-icon mat-icon {
      font-size: 2em;
      margin-bottom: 10px;
    }

    .stat-number {
      font-size: 2.5em;
      font-weight: 700;
      margin-bottom: 5px;
    }

    .stat-label {
      color: #6b7280;
      font-weight: 500;
    }

    .filter-chips {
      margin-bottom: 20px;
    }

    .filter-chip {
      margin-right: 8px;
    }

    @keyframes newAchievement {
      0% { transform: scale(0.8); opacity: 0; }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes glow {
      from { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
      to { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8); }
    }

    @media (max-width: 768px) {
      .level-header {
        flex-direction: column;
        text-align: center;
        gap: 20px;
      }

      .quick-stats {
        justify-content: center;
        gap: 20px;
      }

      .achievement-grid,
      .challenges-grid {
        grid-template-columns: 1fr;
      }

      .tab-content {
        padding: 20px;
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
    trigger('levelAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.5s 0.2s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('achievementAnimation', [
      transition(':enter', [
        query('.achievement-card', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger(100, [
            animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('challengeAnimation', [
      transition(':enter', [
        query('.challenge-card', [
          style({ opacity: 0, transform: 'scale(0.8)' }),
          stagger(150, [
            animate('0.4s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class GamificationDashboardComponent implements OnInit {
  circumference = 2 * Math.PI * 45; // Pour le cercle de progression
  selectedCategory = signal<string>('all');

  achievementCategories = [
    { value: 'all', label: 'Tous', icon: 'apps' },
    { value: 'milestone', label: 'Étapes', icon: 'flag' },
    { value: 'progression', label: 'Progression', icon: 'trending_up' },
    { value: 'consistency', label: 'Régularité', icon: 'schedule' },
    { value: 'efficiency', label: 'Efficacité', icon: 'speed' },
    { value: 'social', label: 'Social', icon: 'people' }
  ];

  constructor(
    public gamificationService: GamificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Charger les données initiales
  }

  // Computed signals
  userStats = this.gamificationService.userStats;
  achievements = this.gamificationService.achievements;
  unlockedAchievements = this.gamificationService.unlockedAchievements;
  availableAchievements = this.gamificationService.availableAchievements;
  dailyChallenges = this.gamificationService.dailyChallenges;
  progressToNextLevel = this.gamificationService.progressToNextLevel;

  recentAchievements = computed(() => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    return this.unlockedAchievements()
      .filter(a => a.unlockedAt && a.unlockedAt > oneDayAgo)
      .slice(0, 3);
  });

  filteredAchievements = computed(() => {
    const category = this.selectedCategory();
    if (category === 'all') {
      return this.achievements();
    }
    return this.achievements().filter(a => a.category === category);
  });

  progressOffset = computed(() => {
    const progress = this.progressToNextLevel();
    return this.circumference - (progress / 100) * this.circumference;
  });

  // Méthodes
  getXPToNextLevel(): number {
    const stats = this.userStats();
    const currentLevel = stats.level;
    const xpForNextLevel = Math.pow(currentLevel, 2) * 50;
    return xpForNextLevel - stats.xp;
  }

  getRarityLabel(rarity: string): string {
    const labels: { [key: string]: string } = {
      'common': 'Commun',
      'rare': 'Rare',
      'epic': 'Épique',
      'legendary': 'Légendaire'
    };
    return labels[rarity] || rarity;
  }

  getAchievementProgress(achievementId: string): number {
    return this.gamificationService.getAchievementProgress(achievementId);
  }

  getAchievementTooltip(achievement: Achievement): string {
    if (achievement.unlockedAt) {
      return `Débloqué le ${achievement.unlockedAt.toLocaleDateString('fr-FR')}`;
    }
    if (achievement.progress > 0) {
      return `Progression: ${achievement.progress}/${achievement.maxProgress}`;
    }
    return 'Achievement verrouillé';
  }

  setSelectedCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  getTimeToMidnight(): string {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  adjustWeeklyGoal(): void {
    // Ouvrir un dialog pour ajuster l'objectif hebdomadaire
    const currentGoal = this.userStats().weeklyGoal;
    const newGoal = prompt(`Objectif hebdomadaire actuel: ${currentGoal}\nNouvel objectif:`, currentGoal.toString());

    if (newGoal && !isNaN(Number(newGoal))) {
      this.gamificationService.setWeeklyGoal(Number(newGoal));
    }
  }

  // TrackBy functions pour optimiser les performances
  trackByAchievement(index: number, achievement: Achievement): string {
    return achievement.id;
  }

  trackByChallenge(index: number, challenge: any): string {
    return challenge.id;
  }
}
