// src/app/services/candidature.service.ts
import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core'; // Importer signal, WritableSignal, Signal
import { Candidature } from '../models/candidature.model';
// Observable et 'of' ne sont plus nécessaires pour getCandidatureById si on le rend synchrone pour la simulation
// import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CandidatureService {
  private STORAGE_KEY = 'candidatures_data_fr_v2';

  private initialData: Candidature[] = [
    { id: 1, date: "09/08/2024", type: "Stage", ranking: 1, entreprise: "Odoo", poste: "Développeur Python / Ruby", ville: "Namur", region: "Wallonie", contact: "jobs@odoo.com", reponse: "Refus", source: "LinkedIn", commentaires: "Postulé via LinkedIn", delaiRappel: "Aucun" },
    { id: 2, date: "19/08/2024", type: "Job", ranking: 1, entreprise: "Odoo", poste: "Developer Full Stack", ville: "Louvain-la-Neuve", region: "Wallonie", contact: "-", reponse: "Refus", source: "Internet", commentaires: "Postulé via le site web", delaiRappel: "Aucun" },
    { id: 3, date: "20/08/2024", type: "Stage", ranking: 1, entreprise: "Ballo Studio", poste: "Programmeur FV", ville: "Mons", region: "Wallonie", contact: "job@ballostudio.com", reponse: "En attente", source: "Internet", commentaires: "Postulé par email", delaiRappel: "1 semaine", dateRappel: "27/08/2024" },
    { id: 4, date: "20/08/2024", type: "Stage", ranking: 2, entreprise: "Fishing Cactus", poste: "Programmeur FV", ville: "Mons", region: "Wallonie", contact: "contact@fishingcactus.com", reponse: "En attente", source: "Internet", commentaires: "Postulé par email", delaiRappel: "Aucun" },
    { id: 5, date: "20/08/2024", type: "Stage", ranking: 2, entreprise: "Exiin", poste: "Programmeur FV", ville: "Bruxelles", region: "Bruxelles-Capitale", contact: "-", reponse: "En attente", source: "Internet", commentaires: "Postulé via le site web", delaiRappel: "1 semaine", dateRappel: "27/08/2024" },
    { id: 13, date: "21/08/2024", type: "Job", ranking: 1, entreprise: "Ankama", poste: "Développeur web PHP", ville: "Roubaix", region: "Hauts-de-France (FR)", contact: "-", reponse: "En discussion", source: "Internet", commentaires: "Postulé via le site web", delaiRappel: "2 semaines", dateRappel: "04/09/2024" },
  ];

  // Utilisation d'un WritableSignal pour la liste des candidatures
  private _candidatures: WritableSignal<Candidature[]> = signal<Candidature[]>([]);
  // Signal public en lecture seule pour les candidatures
  public readonly candidatures: Signal<Candidature[]> = this._candidatures.asReadonly();

  // On peut aussi exposer un Observable si certains composants préfèrent cette API ou pour interopérabilité
  // public candidatures$: Observable<Candidature[]> = toObservable(this._candidatures); // Nécessite @angular/core/rxjs-interop

  constructor() {
    this.chargerDonnees();
  }

  private chargerDonnees(): void {
    try {
      const donneesStockees = localStorage.getItem(this.STORAGE_KEY);
      let dataToSet: Candidature[];
      if (donneesStockees) {
        const parsedData = JSON.parse(donneesStockees) as Candidature[];
        dataToSet = parsedData.map(c => ({
            ...c,
            region: c.region || '',
            delaiRappel: c.delaiRappel || 'Aucun',
            dateRappel: c.dateRappel || undefined
        }));
      } else {
        dataToSet = this.initialData.map(c => ({
            ...c,
            region: c.region || '',
            delaiRappel: c.delaiRappel || 'Aucun',
            dateRappel: c.dateRappel || undefined
        }));
        // Sauvegarder les données initiales si localStorage était vide
        this.sauvegarderDonnees(dataToSet);
      }
      this._candidatures.set(dataToSet);
    } catch (erreur) {
      console.error('Erreur lors du chargement des données depuis localStorage', erreur);
      const initialDataOnError = this.initialData.map(c => ({
        ...c,
        region: c.region || '',
        delaiRappel: c.delaiRappel || 'Aucun',
        dateRappel: c.dateRappel || undefined
      }));
      this._candidatures.set(initialDataOnError);
      this.sauvegarderDonnees(initialDataOnError);
    }
  }

  private sauvegarderDonnees(donnees: Candidature[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(donnees));
    } catch (erreur) {
      console.error('Erreur lors de la sauvegarde des données dans localStorage', erreur);
    }
  }

  // Retourne la valeur actuelle du signal (array)
  getAllCandidatures(): Candidature[] {
    return this._candidatures();
  }

  // Retourne une candidature spécifique de manière synchrone pour la simulation
  // Si c'était un appel API, ce serait un Observable<Candidature | null>
  getCandidatureById(id: number): Candidature | null {
    const candidature = this._candidatures().find(c => c.id === id);
    if (candidature) {
      console.log(`CandidatureService (Signal): Candidature trouvée pour ID ${id}`, candidature);
      return candidature;
    } else {
      console.warn(`CandidatureService (Signal): Aucune candidature trouvée pour ID ${id}`);
      return null;
    }
  }

  addCandidature(candidature: Candidature): void {
    let newId = candidature.id;
    if (!newId || this._candidatures().some(c => c.id === newId)) {
        newId = Date.now() + Math.floor(Math.random() * 1000);
    }
    const candidatureAvecDefauts: Candidature = {
        ...candidature,
        id: newId, // Assigner le nouvel ID
        region: candidature.region || '',
        delaiRappel: candidature.delaiRappel || 'Aucun',
        dateRappel: candidature.dateRappel
    };

    this._candidatures.update(currentCandidatures => {
      const nouvellesDonnees = [...currentCandidatures, candidatureAvecDefauts];
      this.sauvegarderDonnees(nouvellesDonnees); // Sauvegarder après mise à jour du signal
      return nouvellesDonnees;
    });
  }

  updateCandidature(candidatureModifiee: Candidature): void {
    this._candidatures.update(currentCandidatures => {
      const index = currentCandidatures.findIndex(c => c.id === candidatureModifiee.id);
      if (index !== -1) {
        const nouvellesDonnees = [...currentCandidatures];
        nouvellesDonnees[index] = {
            ...currentCandidatures[index],
            ...candidatureModifiee,
            region: candidatureModifiee.region || currentCandidatures[index].region || '',
        };
        this.sauvegarderDonnees(nouvellesDonnees);
        return nouvellesDonnees;
      } else {
        console.warn(`Tentative de mise à jour d'une candidature non trouvée avec ID: ${candidatureModifiee.id}`);
        return currentCandidatures; // Retourner l'état actuel si non trouvé
      }
    });
  }

  deleteCandidature(id: number): void {
    this._candidatures.update(currentCandidatures => {
      const nouvellesDonnees = currentCandidatures.filter(c => c.id !== id);
      this.sauvegarderDonnees(nouvellesDonnees);
      return nouvellesDonnees;
    });
  }

  resetData(): void {
    const initialDataWithDefaults = this.initialData.map(c => ({
        ...c,
        region: c.region || '',
        delaiRappel: c.delaiRappel || 'Aucun',
        dateRappel: c.dateRappel || undefined
    }));
    this._candidatures.set(initialDataWithDefaults);
    this.sauvegarderDonnees(initialDataWithDefaults);
  }

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
    const candidatures = this._candidatures(); // Lire la valeur du signal
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
    }
    return this.formatDateToFr(rappelDate);
  }

  private formatDateToFr(date: Date | undefined): string | undefined {
    if (!date) return undefined;
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }
}
