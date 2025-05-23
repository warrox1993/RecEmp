// src/app/services/candidature.service.ts - MISE À JOUR POUR KANBAN
import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core';
import { Candidature } from '../models/candidature.model';

@Injectable({
  providedIn: 'root'
})
export class CandidatureService {
  private STORAGE_KEY = 'candidatures_data_fr_v3'; // Nouvelle version avec support Kanban

  private initialData: Candidature[] = [
    { id: 1, date: "09/08/2024", type: "Stage", ranking: 1, entreprise: "Odoo", poste: "Développeur Python / Ruby", ville: "Namur", region: "Wallonie", contact: "jobs@odoo.com", reponse: "Refus", source: "LinkedIn", commentaires: "Excellente entreprise, mais le poste ne correspondait pas exactement à mon profil. À retenter plus tard.", delaiRappel: "Aucun" },
    { id: 2, date: "19/08/2024", type: "Job", ranking: 1, entreprise: "Odoo", poste: "Developer Full Stack", ville: "Louvain-la-Neuve", region: "Wallonie", contact: "-", reponse: "En discussion", source: "Internet", commentaires: "Second poste chez Odoo, entretien technique prévu la semaine prochaine", delaiRappel: "1 semaine", dateRappel: "26/08/2024" },
    { id: 3, date: "20/08/2024", type: "Stage", ranking: 1, entreprise: "Ballo Studio", poste: "Programmeur Jeux Vidéo", ville: "Mons", region: "Wallonie", contact: "job@ballostudio.com", reponse: "En attente", source: "Internet", commentaires: "Studio de jeux indépendant très prometteur. Équipe jeune et dynamique.", delaiRappel: "1 semaine", dateRappel: "27/08/2024" },
    { id: 4, date: "20/08/2024", type: "Stage", ranking: 2, entreprise: "Fishing Cactus", poste: "Développeur Unity", ville: "Mons", region: "Wallonie", contact: "contact@fishingcactus.com", reponse: "En attente", source: "Internet", commentaires: "Studio reconnu, travaille sur des projets AAA", delaiRappel: "2 semaines", dateRappel: "03/09/2024" },
    { id: 5, date: "21/08/2024", type: "Job", ranking: 1, entreprise: "Exiin", poste: "Développeur Frontend React", ville: "Bruxelles", region: "Bruxelles-Capitale", contact: "hr@exiin.com", reponse: "Envoyée", source: "LinkedIn", commentaires: "Startup en forte croissance, technologies modernes", delaiRappel: "1 semaine", dateRappel: "28/08/2024" },
    { id: 6, date: "22/08/2024", type: "Job", ranking: 1, entreprise: "Ankama", poste: "Développeur Web PHP/Symfony", ville: "Roubaix", region: "Hauts-de-France (FR)", contact: "recrutement@ankama.com", reponse: "En discussion", source: "Internet", commentaires: "Créateurs de Dofus et Wakfu, environnement gaming passionnant", delaiRappel: "3 jours", dateRappel: "25/08/2024" },
    { id: 7, date: "23/08/2024", type: "Job", ranking: 2, entreprise: "Proximus", poste: "Développeur Cloud Solutions", ville: "Bruxelles", region: "Bruxelles-Capitale", contact: "career@proximus.be", reponse: "Envoyée", source: "Indeed", commentaires: "Grande entreprise, nombreux avantages, télétravail possible", delaiRappel: "2 semaines", dateRappel: "06/09/2024" },
    { id: 8, date: "24/08/2024", type: "Stage", ranking: 3, entreprise: "StartupXYZ", poste: "Stagiaire Développeur", ville: "Gand", region: "Flandre", contact: "hello@startupxyz.be", reponse: "Brouillon", source: "Relation", commentaires: "Contact via un ami, à finaliser la candidature", delaiRappel: "1 semaine", dateRappel: "31/08/2024" }
  ];

  // Utilisation d'un WritableSignal pour la liste des candidatures
  private _candidatures: WritableSignal<Candidature[]> = signal<Candidature[]>([]);
  // Signal public en lecture seule pour les candidatures
  public readonly candidatures: Signal<Candidature[]> = this._candidatures.asReadonly();

  // Signals dérivés pour les statistiques Kanban
  public readonly kanbanStats = computed(() => this.calculateKanbanStats());
  public readonly urgentCandidatures = computed(() =>
    this._candidatures().filter(c => c.ranking === 1 || this.isReminderUrgent(c))
  );

  constructor() {
    this.chargerDonnees();
  }

  private chargerDonnees(): void {
    try {
      const donneesStockees = localStorage.getItem(this.STORAGE_KEY);
      let dataToSet: Candidature[];

      if (donneesStockees) {
        const parsedData = JSON.parse(donneesStockees) as Candidature[];
        dataToSet = parsedData.map(c => this.normalizeCandidate(c));
      } else {
        // Migrer depuis l'ancienne version si elle existe
        const oldData = localStorage.getItem('candidatures_data_fr_v2');
        if (oldData) {
          const oldParsedData = JSON.parse(oldData) as Candidature[];
          dataToSet = oldParsedData.map(c => this.normalizeCandidate(c));
          localStorage.removeItem('candidatures_data_fr_v2'); // Nettoyer l'ancienne version
        } else {
          dataToSet = this.initialData.map(c => this.normalizeCandidate(c));
        }
        this.sauvegarderDonnees(dataToSet);
      }

      this._candidatures.set(dataToSet);
      console.log('✅ Candidatures chargées:', dataToSet.length);
    } catch (erreur) {
      console.error('❌ Erreur lors du chargement des données depuis localStorage', erreur);
      const initialDataOnError = this.initialData.map(c => this.normalizeCandidate(c));
      this._candidatures.set(initialDataOnError);
      this.sauvegarderDonnees(initialDataOnError);
    }
  }

  private normalizeCandidate(candidature: Candidature): Candidature {
    return {
      ...candidature,
      region: candidature.region || '',
      delaiRappel: candidature.delaiRappel || 'Aucun',
      dateRappel: candidature.dateRappel || undefined,
      // S'assurer que les nouveaux statuts sont supportés
      reponse: this.normalizeStatus(candidature.reponse)
    };
  }

  private normalizeStatus(status: string): Candidature['reponse'] {
    // Mapper les anciens statuts vers les nouveaux si nécessaire
    const statusMap: { [key: string]: Candidature['reponse'] } = {
      'En attente': 'En attente',
      'En discussion': 'En discussion',
      'Refus': 'Refus',
      'Accepté': 'Accepté',
      'Envoyée': 'Envoyée',
      'Brouillon': 'Brouillon'
    };

    return statusMap[status] || 'En attente';
  }

  private sauvegarderDonnees(donnees: Candidature[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(donnees));
    } catch (erreur) {
      console.error('❌ Erreur lors de la sauvegarde des données dans localStorage', erreur);
    }
  }

  private calculateKanbanStats() {
    const candidatures = this._candidatures();
    return {
      total: candidatures.length,
      brouillon: candidatures.filter(c => c.reponse === 'Brouillon').length,
      envoyee: candidatures.filter(c => c.reponse === 'Envoyée').length,
      enAttente: candidatures.filter(c => c.reponse === 'En attente').length,
      enDiscussion: candidatures.filter(c => c.reponse === 'En discussion').length,
      finalise: candidatures.filter(c => c.reponse === 'Refus' || c.reponse === 'Accepté').length,
      accepte: candidatures.filter(c => c.reponse === 'Accepté').length,
      refus: candidatures.filter(c => c.reponse === 'Refus').length,
      urgent: candidatures.filter(c => c.ranking === 1).length,
      rappelsAujourdhui: candidatures.filter(c => this.isReminderToday(c)).length
    };
  }

  private isReminderUrgent(candidature: Candidature): boolean {
    if (!candidature.dateRappel) return false;
    const reminderDate = this.parseDateFr(candidature.dateRappel);
    if (!reminderDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    reminderDate.setHours(0, 0, 0, 0);

    return reminderDate <= today;
  }

  private isReminderToday(candidature: Candidature): boolean {
    if (!candidature.dateRappel) return false;
    const reminderDate = this.parseDateFr(candidature.dateRappel);
    if (!reminderDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    reminderDate.setHours(0, 0, 0, 0);

    return reminderDate.getTime() === today.getTime();
  }

  // Méthodes existantes
  getAllCandidatures(): Candidature[] {
    return this._candidatures();
  }

  getCandidatureById(id: number): Candidature | null {
    const candidature = this._candidatures().find(c => c.id === id);
    if (candidature) {
      console.log(`✅ Candidature trouvée pour ID ${id}`, candidature);
      return candidature;
    } else {
      console.warn(`⚠️ Aucune candidature trouvée pour ID ${id}`);
      return null;
    }
  }

  addCandidature(candidature: Candidature): void {
    let newId = candidature.id;
    if (!newId || this._candidatures().some(c => c.id === newId)) {
        newId = Date.now() + Math.floor(Math.random() * 1000);
    }

    const candidatureAvecDefauts: Candidature = {
        ...this.normalizeCandidate(candidature),
        id: newId
    };

    this._candidatures.update(currentCandidatures => {
      const nouvellesDonnees = [...currentCandidatures, candidatureAvecDefauts];
      this.sauvegarderDonnees(nouvellesDonnees);
      return nouvellesDonnees;
    });

    console.log('✅ Candidature ajoutée:', candidatureAvecDefauts.entreprise);
  }

  updateCandidature(candidatureModifiee: Candidature): void {
    this._candidatures.update(currentCandidatures => {
      const index = currentCandidatures.findIndex(c => c.id === candidatureModifiee.id);
      if (index !== -1) {
        const nouvellesDonnees = [...currentCandidatures];
        nouvellesDonnees[index] = {
            ...this.normalizeCandidate(candidatureModifiee)
        };
        this.sauvegarderDonnees(nouvellesDonnees);
        console.log('✅ Candidature mise à jour:', candidatureModifiee.entreprise);
        return nouvellesDonnees;
      } else {
        console.warn(`⚠️ Tentative de mise à jour d'une candidature non trouvée avec ID: ${candidatureModifiee.id}`);
        return currentCandidatures;
      }
    });
  }

  deleteCandidature(id: number): void {
    this._candidatures.update(currentCandidatures => {
      const candidature = currentCandidatures.find(c => c.id === id);
      const nouvellesDonnees = currentCandidatures.filter(c => c.id !== id);
      this.sauvegarderDonnees(nouvellesDonnees);
      console.log('✅ Candidature supprimée:', candidature?.entreprise || id);
      return nouvellesDonnees;
    });
  }

  // Nouvelles méthodes pour le Kanban
  moveToColumn(candidatureId: number, newStatus: Candidature['reponse']): void {
    this._candidatures.update(currentCandidatures => {
      const index = currentCandidatures.findIndex(c => c.id === candidatureId);
      if (index !== -1) {
        const nouvellesDonnees = [...currentCandidatures];
        nouvellesDonnees[index] = {
          ...nouvellesDonnees[index],
          reponse: newStatus
        };
        this.sauvegarderDonnees(nouvellesDonnees);
        console.log('✅ Candidature déplacée:', nouvellesDonnees[index].entreprise, 'vers', newStatus);
        return nouvellesDonnees;
      }
      return currentCandidatures;
    });
  }

  setHighPriority(candidatureId: number): void {
    this._candidatures.update(currentCandidatures => {
      const index = currentCandidatures.findIndex(c => c.id === candidatureId);
      if (index !== -1) {
        const nouvellesDonnees = [...currentCandidatures];
        nouvellesDonnees[index] = {
          ...nouvellesDonnees[index],
          ranking: 1
        };
        this.sauvegarderDonnees(nouvellesDonnees);
        console.log('✅ Candidature marquée prioritaire:', nouvellesDonnees[index].entreprise);
        return nouvellesDonnees;
      }
      return currentCandidatures;
    });
  }

  setReminder(candidatureId: number, reminderDate: string, delai: string = 'Personnalisé'): void {
    this._candidatures.update(currentCandidatures => {
      const index = currentCandidatures.findIndex(c => c.id === candidatureId);
      if (index !== -1) {
        const nouvellesDonnees = [...currentCandidatures];
        nouvellesDonnees[index] = {
          ...nouvellesDonnees[index],
          dateRappel: reminderDate,
          delaiRappel: delai as any
        };
        this.sauvegarderDonnees(nouvellesDonnees);
        console.log('✅ Rappel défini pour:', nouvellesDonnees[index].entreprise, 'le', reminderDate);
        return nouvellesDonnees;
      }
      return currentCandidatures;
    });
  }

  batchUpdateStatus(candidatureIds: number[], newStatus: Candidature['reponse']): void {
    this._candidatures.update(currentCandidatures => {
      const nouvellesDonnees = currentCandidatures.map(candidature => {
        if (candidatureIds.includes(candidature.id)) {
          return { ...candidature, reponse: newStatus };
        }
        return candidature;
      });
      this.sauvegarderDonnees(nouvellesDonnees);
      console.log('✅ Mise à jour par lot:', candidatureIds.length, 'candidatures vers', newStatus);
      return nouvellesDonnees;
    });
  }

  // Méthodes existantes conservées
  toggleType(id: number): void {
    this._candidatures.update(currentCandidatures => {
      const index = currentCandidatures.findIndex(c => c.id === id);
      if (index !== -1) {
        const nouvellesDonnees = [...currentCandidatures];
        nouvellesDonnees[index] = {
          ...nouvellesDonnees[index],
          type: nouvellesDonnees[index].type === 'Job' ? 'Stage' : 'Job'
        };
        this.sauvegarderDonnees(nouvellesDonnees);
        return nouvellesDonnees;
      }
      return currentCandidatures;
    });
  }

  updateDate(id: number, nouvelleDateStr: string): void {
    this._candidatures.update(currentCandidatures => {
      const index = currentCandidatures.findIndex(c => c.id === id);
      if (index !== -1) {
        const nouvellesDonnees = [...currentCandidatures];
        const candidatureModifiee = { ...nouvellesDonnees[index] };
        candidatureModifiee.date = nouvelleDateStr;

        if (candidatureModifiee.delaiRappel &&
            candidatureModifiee.delaiRappel !== 'Aucun' &&
            candidatureModifiee.delaiRappel !== 'Personnalisé') {
            const dateCandidature = this.parseDateFr(nouvelleDateStr);
            if (dateCandidature) {
              candidatureModifiee.dateRappel = this.calculateDateRappelInterne(dateCandidature, candidatureModifiee.delaiRappel);
            }
        }
        nouvellesDonnees[index] = candidatureModifiee;
        this.sauvegarderDonnees(nouvellesDonnees);
        return nouvellesDonnees;
      }
      return currentCandidatures;
    });
  }

  exportToCSV(): string {
    const candidatures = this._candidatures();
    if (candidatures.length === 0) {
        return "Aucune donnée à exporter.";
    }
    const allPossibleKeys: (keyof Candidature)[] = ['id', 'date', 'type', 'ranking', 'entreprise', 'poste', 'ville', 'region', 'contact', 'reponse', 'source', 'delaiRappel', 'dateRappel', 'commentaires'];
    const entetes = allPossibleKeys.join(',');
    const lignes = candidatures.map(c => {
        return allPossibleKeys.map(key => {
            const val = c[key];
            return `"${String(val !== undefined && val !== null ? val : '').replace(/"/g, '""')}"`;
        }).join(',');
    });
    return [entetes, ...lignes].join('\n');
  }

  resetData(): void {
    const initialDataWithDefaults = this.initialData.map(c => this.normalizeCandidate(c));
    this._candidatures.set(initialDataWithDefaults);
    this.sauvegarderDonnees(initialDataWithDefaults);
    console.log('✅ Données réinitialisées');
  }

  // Méthodes utilitaires privées
  private parseDateFr(dateStr: string | undefined): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  }

  private calculateDateRappelInterne(baseDate: Date, delai: Candidature['delaiRappel']): string | undefined {
    if (!delai || delai === 'Aucun' || delai === 'Personnalisé' || !baseDate) return undefined;
    const rappelDate = new Date(baseDate);
    switch (delai) {
        case '1 semaine': rappelDate.setDate(rappelDate.getDate() + 7); break;
        case '2 semaines': rappelDate.setDate(rappelDate.getDate() + 14); break;
        case '1 mois': rappelDate.setMonth(rappelDate.getMonth() + 1); break;
        case '3 jours': rappelDate.setDate(rappelDate.getDate() + 3); break;
    }
    return this.formatDateToFr(rappelDate);
  }

  private formatDateToFr(date: Date | undefined): string | undefined {
    if (!date) return undefined;
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }
}
