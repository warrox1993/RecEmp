// src/app/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';
import { CandidatureService } from './candidature.service'; // Pour accéder aux données de base pour la simulation
import { Candidature } from '../models/candidature.model';

// Interface pour les données sommaires du tableau de bord
export interface DashboardSummaryData {
  totalCandidatures: number;
  enAttente: number;
  enDiscussion: number;
  refus: number;
  accepte: number;
  rappelsAujourdhui: number;
  // On pourrait ajouter d'autres KPIs ici
}

// Interface pour les données de graphiques (format compatible avec ngx-charts)
export interface ChartDataPoint {
  name: string;
  value: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private candidatureService: CandidatureService) { }

  // Méthode pour récupérer les données sommaires
  getDashboardSummary(): Observable<DashboardSummaryData> {
    // Simulation basée sur les données actuelles du CandidatureService
    const allCandidatures = this.candidatureService.getAllCandidatures();
    const todayStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const summary: DashboardSummaryData = {
      totalCandidatures: allCandidatures.length,
      enAttente: allCandidatures.filter(c => c.reponse === 'En attente').length,
      enDiscussion: allCandidatures.filter(c => c.reponse === 'En discussion').length,
      refus: allCandidatures.filter(c => c.reponse === 'Refus').length,
      accepte: allCandidatures.filter(c => c.reponse === 'Accepté').length,
      rappelsAujourdhui: allCandidatures.filter(c =>
        c.dateRappel === todayStr && (c.reponse === 'En attente' || c.reponse === 'En discussion')
      ).length
    };

    // Simuler une latence réseau
    return of(summary).pipe(delay(800));
  }

  // Méthode pour récupérer les données pour le graphique "Candidatures par Statut"
  getCandidaturesParStatutChartData(): Observable<ChartDataPoint[]> {
    const allCandidatures = this.candidatureService.getAllCandidatures();
    const data: ChartDataPoint[] = [
      { name: 'En Attente', value: allCandidatures.filter(c => c.reponse === 'En attente').length },
      { name: 'En Discussion', value: allCandidatures.filter(c => c.reponse === 'En discussion').length },
      { name: 'Refus', value: allCandidatures.filter(c => c.reponse === 'Refus').length },
      { name: 'Accepté', value: allCandidatures.filter(c => c.reponse === 'Accepté').length },
    ];
    // Filtrer les statuts avec 0 pour ne pas encombrer le graphique (optionnel)
    const filteredData = data.filter(item => item.value > 0);

    return of(filteredData.length > 0 ? filteredData : [{ name: 'Aucune donnée', value: 1 }]).pipe(delay(500)); // Si tout est à 0, afficher "Aucune donnée"
  }

  // Méthode pour récupérer les données pour le graphique "Candidatures par Type"
  getCandidaturesParTypeChartData(): Observable<ChartDataPoint[]> {
    const allCandidatures = this.candidatureService.getAllCandidatures();
    const data: ChartDataPoint[] = [
      { name: 'Job', value: allCandidatures.filter(c => c.type === 'Job').length },
      { name: 'Stage', value: allCandidatures.filter(c => c.type === 'Stage').length },
    ];
    const filteredData = data.filter(item => item.value > 0);
    return of(filteredData.length > 0 ? filteredData : [{ name: 'Aucune donnée', value: 1 }]).pipe(delay(600));
  }

  // On pourrait ajouter d'autres méthodes pour d'autres graphiques :
  // - Candidatures par mois/semaine
  // - Taux de succès par source
  // - etc.
}
