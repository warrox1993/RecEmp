// src/app/services/gamification.service.ts
import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { CandidatureService } from './candidature.service';
import { NotificationService } from './notification.service';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'progression' | 'consistency' | 'efficiency' | 'social' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  progress: number; // 0-100
  maxProgress: number;
  reward?: {
    xp: number;
    title?: string;
    feature?: string;
  };
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  totalCandidatures: number;
  totalInterviews: number;
  successRate: number;
  averageResponseTime: number;
  weeklyGoal: number;
  weeklyProgress: number;
  rank: string;
  title: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  reward: number; // XP
  expiresAt: Date;
  completed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private readonly GAMIFICATION_STORAGE_KEY = 'protrack_cv_gamification';
  private readonly STREAK_STORAGE_KEY = 'protrack_cv_streak';

  // Signals pour l'état de gamification
  private _userStats: WritableSignal<UserStats> = signal(this.getInitialStats());
  private _achievements: WritableSignal<Achievement[]> = signal(this.getInitialAchievements());
  private _dailyChallenges: WritableSignal<DailyChallenge[]> = signal([]);
  private _lastActivityDate: WritableSignal<Date> = signal(new Date());

  public readonly userStats = this._userStats.asReadonly();
  public readonly achievements = this._achievements.asReadonly();
  public readonly dailyChallenges = this._dailyChallenges.asReadonly();

  public readonly unlockedAchievements = computed(() =>
    this._achievements().filter(a => a.unlockedAt)
  );

  public readonly availableAchievements = computed(() =>
    this._achievements().filter(a => !a.unlockedAt && a.progress < a.maxProgress)
  );

  public readonly userLevel = computed(() => this.calculateLevel(this._userStats().xp));
  public readonly progressToNextLevel = computed(() => this.calculateProgressToNextLevel(this._userStats().xp));

  constructor(
    private candidatureService: CandidatureService,
    private notificationService: NotificationService
  ) {
    this.loadGamificationData();
    this.generateDailyChallenges();
    this.startDailyCheck();
    this.trackActivity();
  }

  private loadGamificationData(): void {
    try {
      const stored = localStorage.getItem(this.GAMIFICATION_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this._userStats.set({ ...this.getInitialStats(), ...data.userStats });
        if (data.achievements) {
          this._achievements.set(data.achievements.map((a: any) => ({
            ...a,
            unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined
          })));
        }
      }

      const streakData = localStorage.getItem(this.STREAK_STORAGE_KEY);
      if (streakData) {
        const streak = JSON.parse(streakData);
        this._lastActivityDate.set(new Date(streak.lastActivityDate));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de gamification:', error);
    }
  }

  private saveGamificationData(): void {
    try {
      const data = {
        userStats: this._userStats(),
        achievements: this._achievements()
      };
      localStorage.setItem(this.GAMIFICATION_STORAGE_KEY, JSON.stringify(data));

      const streakData = {
        lastActivityDate: this._lastActivityDate()
      };
      localStorage.setItem(this.STREAK_STORAGE_KEY, JSON.stringify(streakData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données de gamification:', error);
    }
  }

  private getInitialStats(): UserStats {
    return {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      currentStreak: 0,
      longestStreak: 0,
      totalCandidatures: 0,
      totalInterviews: 0,
      successRate: 0,
      averageResponseTime: 0,
      weeklyGoal: 5,
      weeklyProgress: 0,
      rank: 'Débutant',
      title: 'Novice Candidat'
    };
  }

  private getInitialAchievements(): Achievement[] {
    return [
      // Progression
      {
        id: 'first_candidature',
        title: 'Premier Pas',
        description: 'Créer votre première candidature',
        icon: 'star',
        category: 'milestone',
        rarity: 'common',
        progress: 0,
        maxProgress: 1,
        reward: { xp: 50, title: 'Candidat Débutant' }
      },
      {
        id: 'reach_level_5',
        title: 'Montée en Grade',
        description: 'Atteindre le niveau 5',
        icon: 'trending_up',
        category: 'progression',
        rarity: 'common',
        progress: 0,
        maxProgress: 1,
        reward: { xp: 200, feature: 'analytics_basic' }
      },
      {
        id: 'first_interview',
        title: 'Première Impression',
        description: 'Décrocher votre premier entretien',
        icon: 'person',
        category: 'milestone',
        rarity: 'rare',
        progress: 0,
        maxProgress: 1,
        reward: { xp: 150 }
      },
      {
        id: 'first_job',
        title: 'Mission Accomplie',
        description: 'Décrocher votre premier emploi',
        icon: 'work',
        category: 'milestone',
        rarity: 'epic',
        progress: 0,
        maxProgress: 1,
        reward: { xp: 500, title: 'Professionnel Confirmé' }
      },

      // Consistance
      {
        id: 'week_streak',
        title: 'Régularité',
        description: 'Maintenir une activité pendant 7 jours',
        icon: 'calendar_today',
        category: 'consistency',
        rarity: 'common',
        progress: 0,
        maxProgress: 7,
        reward: { xp: 100 }
      },
      {
        id: 'month_streak',
        title: 'Persévérance',
        description: 'Maintenir une activité pendant 30 jours',
        icon: 'event_available',
        category: 'consistency',
        rarity: 'rare',
        progress: 0,
        maxProgress: 30,
        reward: { xp: 300, title: 'Persévérant' }
      },

      // Efficacité
      {
        id: 'speed_demon',
        title: 'Efficacité Redoutable',
        description: 'Recevoir une réponse en moins de 48h',
        icon: 'flash_on',
        category: 'efficiency',
        rarity: 'rare',
        progress: 0,
        maxProgress: 1,
        reward: { xp: 200 }
      },
      {
        id: 'bulk_sender',
        title: 'Machine à Candidatures',
        description: 'Envoyer 10 candidatures en une journée',
        icon: 'send',
        category: 'efficiency',
        rarity: 'epic',
        progress: 0,
        maxProgress: 10,
        reward: { xp: 300 }
      },

      // Milestones
      {
        id: 'century_club',
        title: 'Club des Centenaires',
        description: 'Créer 100 candidatures',
        icon: 'military_tech',
        category: 'milestone',
        rarity: 'legendary',
        progress: 0,
        maxProgress: 100,
        reward: { xp: 1000, title: 'Maître Candidat' }
      },
      {
        id: 'perfect_week',
        title: 'Semaine Parfaite',
        description: 'Atteindre 100% de votre objectif hebdomadaire',
        icon: 'verified',
        category: 'efficiency',
        rarity: 'rare',
        progress: 0,
        maxProgress: 1,
        reward: { xp: 250 }
      }
    ];
  }

  // Actions principales qui déclenchent les récompenses
  recordCandidatureCreated(): void {
    this.addXP(25, 'Candidature créée');
    this.updateStreak();
    this.updateAchievementProgress('first_candidature', 1);
    this.updateAchievementProgress('century_club', 1);
    this.updateWeeklyProgress(1);
    this.updateDailyChallengeProgress('create_candidature', 1);
    this.saveGamificationData();
  }

  recordCandidatureSent(): void {
    this.addXP(50, 'Candidature envoyée');
    this.updateDailyChallengeProgress('send_candidature', 1);
    this.checkBulkSending();
    this.saveGamificationData();
  }

  recordInterviewScheduled(): void {
    this.addXP(150, 'Entretien programmé');
    this.updateAchievementProgress('first_interview', 1);
    this.updateDailyChallengeProgress('schedule_interview', 1);
    this.saveGamificationData();
  }

  recordJobAccepted(): void {
    this.addXP(500, 'Emploi accepté 🎉');
    this.updateAchievementProgress('first_job', 1);
    this.triggerCelebration();
    this.saveGamificationData();
  }

  recordQuickResponse(responseTimeHours: number): void {
    if (responseTimeHours <= 48) {
      this.addXP(100, 'Réponse rapide');
      this.updateAchievementProgress('speed_demon', 1);
    }
    this.saveGamificationData();
  }

  private addXP(amount: number, reason: string): void {
    this._userStats.update(stats => ({
      ...stats,
      xp: stats.xp + amount
    }));

    // Vérifier level up
    this.checkLevelUp();

    // Notification de gain XP
    if (amount >= 100) {
      this.notificationService.addSystemNotification({
        type: 'succes',
        title: `+${amount} XP`,
        message: reason
      });
    }
  }

  private updateStreak(): void {
    const today = new Date();
    const lastActivity = this._lastActivityDate();

    today.setHours(0, 0, 0, 0);
    lastActivity.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    this._userStats.update(stats => {
      let newStreak = stats.currentStreak;

      if (daysDiff === 1) {
        // Jour consécutif
        newStreak = stats.currentStreak + 1;
      } else if (daysDiff > 1) {
        // Streak cassée
        newStreak = 1;
      }
      // Si daysDiff === 0, c'est le même jour, on ne change rien

      return {
        ...stats,
        currentStreak: newStreak,
        longestStreak: Math.max(stats.longestStreak, newStreak)
      };
    });

    this._lastActivityDate.set(new Date());

    // Mettre à jour les achievements de streak
    const currentStreak = this._userStats().currentStreak;
    this.updateAchievementProgress('week_streak', Math.min(currentStreak, 7));
    this.updateAchievementProgress('month_streak', Math.min(currentStreak, 30));
  }

  private checkLevelUp(): void {
    const stats = this._userStats();
    const newLevel = this.calculateLevel(stats.xp);

    if (newLevel > stats.level) {
      this._userStats.update(s => ({
        ...s,
        level: newLevel,
        rank: this.calculateRank(newLevel),
        title: this.calculateTitle(newLevel)
      }));

      // Animation et notification de level up
      this.notificationService.addSystemNotification({
        type: 'succes',
        title: `🎉 Niveau ${newLevel} atteint !`,
        message: `Nouveau titre débloqué: ${this.calculateTitle(newLevel)}`
      });

      this.updateAchievementProgress('reach_level_5', newLevel >= 5 ? 1 : 0);

      // Récompense bonus pour level up
      this.addXP(newLevel * 10, 'Bonus de niveau');
    }
  }

  private calculateLevel(xp: number): number {
    return Math.floor(Math.sqrt(xp / 50)) + 1;
  }

  private calculateProgressToNextLevel(xp: number): number {
    const currentLevel = this.calculateLevel(xp);
    const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 50;
    const xpForNextLevel = Math.pow(currentLevel, 2) * 50;
    const progress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  private calculateRank(level: number): string {
    if (level >= 50) return 'Légende';
    if (level >= 30) return 'Expert';
    if (level >= 20) return 'Vétéran';
    if (level >= 15) return 'Professionnel';
    if (level >= 10) return 'Confirmé';
    if (level >= 5) return 'Intermédiaire';
    return 'Débutant';
  }

  private calculateTitle(level: number): string {
    if (level >= 50) return 'Légende du Recrutement';
    if (level >= 30) return 'Maître Candidat';
    if (level >= 20) return 'Expert en Candidatures';
    if (level >= 15) return 'Professionnel Confirmé';
    if (level >= 10) return 'Candidat Expérimenté';
    if (level >= 5) return 'Candidat Motivé';
    return 'Candidat Débutant';
  }

  private updateAchievementProgress(achievementId: string, progress: number): void {
    this._achievements.update(achievements =>
      achievements.map(achievement => {
        if (achievement.id === achievementId && !achievement.unlockedAt) {
          const newProgress = Math.min(achievement.progress + progress, achievement.maxProgress);

          if (newProgress >= achievement.maxProgress && !achievement.unlockedAt) {
            // Achievement débloqué !
            this.unlockAchievement(achievement);
            return {
              ...achievement,
              progress: newProgress,
              unlockedAt: new Date()
            };
          }

          return { ...achievement, progress: newProgress };
        }
        return achievement;
      })
    );
  }

  private unlockAchievement(achievement: Achievement): void {
    // Récompense XP
    if (achievement.reward?.xp) {
      this.addXP(achievement.reward.xp, `Achievement: ${achievement.title}`);
    }

    // Notification spéciale
    this.notificationService.addSystemNotification({
      type: 'succes',
      title: '🏆 Achievement débloqué !',
      message: `${achievement.title}: ${achievement.description}`
    });

    // Animation de célébration selon la rareté
    this.triggerAchievementCelebration(achievement.rarity);
  }

  private triggerAchievementCelebration(rarity: Achievement['rarity']): void {
    // Animation différente selon la rareté
    const emoji = {
      'common': '⭐',
      'rare': '🌟',
      'epic': '💫',
      'legendary': '🎆'
    }[rarity];

    console.log(`${emoji} Achievement ${rarity} débloqué !`);
    // Ici on pourrait déclencher des animations visuelles
  }

  private triggerCelebration(): void {
    console.log('🎉🎊 FÉLICITATIONS ! Emploi décrochété ! 🎊🎉');
    // Animation de confettis
  }

  // Daily Challenges
  private generateDailyChallenges(): void {
    const challenges: DailyChallenge[] = [
      {
        id: 'create_candidature',
        title: 'Créer 2 candidatures',
        description: 'Ajoutez 2 nouvelles candidatures aujourd\'hui',
        icon: 'add_circle',
        progress: 0,
        maxProgress: 2,
        reward: 50,
        expiresAt: this.getEndOfDay(),
        completed: false
      },
      {
        id: 'send_candidature',
        title: 'Envoyer 1 candidature',
        description: 'Envoyez au moins 1 candidature aujourd\'hui',
        icon: 'send',
        progress: 0,
        maxProgress: 1,
        reward: 75,
        expiresAt: this.getEndOfDay(),
        completed: false
      },
      {
        id: 'update_profile',
        title: 'Mise à jour quotidienne',
        description: 'Mettez à jour au moins 1 candidature',
        icon: 'update',
        progress: 0,
        maxProgress: 1,
        reward: 25,
        expiresAt: this.getEndOfDay(),
        completed: false
      }
    ];

    this._dailyChallenges.set(challenges);
  }

  private updateDailyChallengeProgress(challengeId: string, progress: number): void {
    this._dailyChallenges.update(challenges =>
      challenges.map(challenge => {
        if (challenge.id === challengeId && !challenge.completed) {
          const newProgress = Math.min(challenge.progress + progress, challenge.maxProgress);
          const completed = newProgress >= challenge.maxProgress;

          if (completed && !challenge.completed) {
            this.addXP(challenge.reward, `Défi quotidien: ${challenge.title}`);
          }

          return { ...challenge, progress: newProgress, completed };
        }
        return challenge;
      })
    );
  }

  private getEndOfDay(): Date {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private startDailyCheck(): void {
    // Vérifier chaque heure si c'est un nouveau jour
    setInterval(() => {
      const now = new Date();
      const challenges = this._dailyChallenges();

      if (challenges.length > 0 && now > challenges[0].expiresAt) {
        this.generateDailyChallenges();
      }
    }, 60 * 60 * 1000); // Toutes les heures
  }

  private checkBulkSending(): void {
    // Vérifier si 10 candidatures ont été envoyées aujourd'hui
    const today = new Date().toDateString();
    const candidatures = this.candidatureService.getAllCandidatures();
    const sentToday = candidatures.filter(c => {
      const candidatureDate = new Date(c.date.split('/').reverse().join('-'));
      return candidatureDate.toDateString() === today && c.reponse === 'Envoyée';
    }).length;

    if (sentToday >= 10) {
      this.updateAchievementProgress('bulk_sender', 10);
    }
  }

  private updateWeeklyProgress(amount: number): void {
    this._userStats.update(stats => {
      const newProgress = Math.min(stats.weeklyProgress + amount, stats.weeklyGoal);

      // Vérifier si objectif hebdomadaire atteint
      if (newProgress >= stats.weeklyGoal && stats.weeklyProgress < stats.weeklyGoal) {
        this.updateAchievementProgress('perfect_week', 1);
        this.addXP(100, 'Objectif hebdomadaire atteint !');
      }

      return { ...stats, weeklyProgress: newProgress };
    });
  }

  private trackActivity(): void {
    // S'abonner aux changements de candidatures pour track l'activité
    // Cette méthode serait appelée quand l'utilisateur fait des actions
  }

  // Méthodes publiques pour configurer
  setWeeklyGoal(goal: number): void {
    this._userStats.update(stats => ({ ...stats, weeklyGoal: goal }));
    this.saveGamificationData();
  }

  resetWeeklyProgress(): void {
    this._userStats.update(stats => ({ ...stats, weeklyProgress: 0 }));
    this.saveGamificationData();
  }

  // Getters pour les composants
  getAchievementsByCategory(category: Achievement['category']): Achievement[] {
    return this._achievements().filter(a => a.category === category);
  }

  getAchievementProgress(achievementId: string): number {
    const achievement = this._achievements().find(a => a.id === achievementId);
    return achievement ? (achievement.progress / achievement.maxProgress) * 100 : 0;
  }
}
