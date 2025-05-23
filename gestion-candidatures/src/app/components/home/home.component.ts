// src/app/components/home/home.component.ts
import { Component, OnInit, OnDestroy, Renderer2, Inject, HostListener, ElementRef, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DOCUMENT, ViewportScroller } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card'; // Optionnel, si utilisé
import { MatTooltipModule } from '@angular/material/tooltip';

interface OracleRevelation {
  icon: string;
  text: string;
  title?: string; // Titre optionnel pour la révélation
}

interface TerritoryInfo {
  id: string;
  text: string;
  // Potentiellement d'autres propriétés comme une image spécifique au territoire
}

interface WisdomArtifact {
  id: string;
  text: string;
  title?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {

  public currentYear: number = new Date().getFullYear();
  public activeSection: string = 'hero-section';

  // Pour l'Oracle des Opportunités
  public currentOracleRevelation: OracleRevelation | null = null;
  public oracleInteracted: boolean = false; // Pour savoir si l'utilisateur a cliqué sur un défi
  private oracleRevelationsData: { [key: string]: OracleRevelation } = {
    desorganisation: {
      title: "Labyrinthe Apprivoisé !",
      text: "L'Oracle révèle : L'Étendard de Ralliement de ProTrack CV transformera votre chaos en une carte claire de toutes vos pistes, centralisant chaque candidature et document.",
      icon: "all_inbox" // Fonctionnalité de centralisation
    },
    oublis: {
      title: "Le Temps Maîtrisé !",
      text: "L'Oracle prédit : Avec la Corne de Vigilance de ProTrack CV, plus aucun rappel crucial ne sombrera dans l'oubli. Chaque relance et suivi sera votre allié.",
      icon: "notifications_active" // Fonctionnalité de rappels
    },
    manque_de_visibilite: {
      title: "Clarté Retrouvée !",
      text: "L'Oracle discerne : La Carte du Conquérant de ProTrack CV illuminera vos progrès. Des statistiques claires pour affûter votre stratégie et avancer avec assurance.",
      icon: "trending_up" // Fonctionnalité de statistiques
    },
    demotivation: {
      title: "Flamme Ravivée !",
      text: "L'Oracle inspire : En voyant chaque petite victoire et chaque progrès tracé par ProTrack CV, votre motivation deviendra une armure contre le doute. Chaque pas compte !",
      icon: "local_fire_department" // Icône pour la motivation/énergie
    }
  };

  // Pour la Carte des Territoires Inexplorés
  public activeTerritory: string | null = null;
  public questMapImageLoaded: boolean = true; // Mettre à false si on charge l'image dynamiquement
  // Les infos des territoires pourraient être plus riches et venir d'un service
  private territoryInfosData: { [key: string]: TerritoryInfo } = {
    relances: { id: 'relances', text: "ProTrack CV vous équipe de rappels et de modèles pour des relances percutantes qui ne passent pas inaperçues." },
    reseau: { id: 'reseau', text: "Suivez vos contacts, notez les échanges clés et transformez votre réseau en un puissant levier pour votre quête." },
    entretiens: { id: 'entretiens', text: "Préparez chaque entrevue avec sérénité : notes, questions types, suivi post-entretien, tout est centralisé." }
  };


  // Pour les Artefacts de Sagesse Disséminés
  public activeWisdom: string | null = null;
  // Les textes des artefacts pourraient aussi venir d'un service
  private wisdomArtifactsData: { [key: string]: WisdomArtifact } = {
    oracle_wisdom: { id: 'oracle_wisdom', text: "Connaître ses propres défis est le premier pas vers la maîtrise de sa quête. ProTrack CV éclaire votre chemin." },
    centralisation_wisdom: { id: 'centralisation_wisdom', text: "Un esprit organisé est un esprit conquérant. La centralisation réduit le stress et libère votre énergie pour l'essentiel." }
    // Ajouter d'autres artefacts ici
  };


  private sectionIds: string[] = ['hero-section', 'oracle-section', 'problem-solution-section', 'map-section', 'features-section', 'final-cta-section', 'homepage-footer'];
  private sectionElements: HTMLElement[] = [];
  private scrollTimeout: any;

  constructor(
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    private viewportScroller: ViewportScroller,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Initialisation
  }

  ngAfterViewInit(): void {
    this.sectionIds.forEach(id => {
      const el = this.document.getElementById(id);
      if (el) {
        this.sectionElements.push(el);
      }
    });
    // Déclencher une première fois pour définir la section active au chargement
    // Un léger délai peut être nécessaire si les hauteurs des sections ne sont pas immédiatement disponibles
    setTimeout(() => this.updateActiveSection(), 100);
  }

  navigateToRegister(): void { this.router.navigate(['/register']); }
  navigateToLogin(): void { this.router.navigate(['/login']); }

  getOracleRevelation(challengeType: string): void {
    this.oracleInteracted = true;
    if (this.oracleRevelationsData[challengeType]) {
      this.currentOracleRevelation = this.oracleRevelationsData[challengeType];
      const revelationArea = this.document.getElementById('oracleRevelationArea');
      if (revelationArea) {
        setTimeout(() => revelationArea.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      }
    } else {
      this.currentOracleRevelation = null; // Ou un message par défaut
    }
  }

  showTerritoryInfo(territoryId: string): void {
    this.activeTerritory = territoryId;
  }

  hideTerritoryInfo(territoryId: string): void {
    // On ne cache que si la souris quitte le territoire actuellement actif
    // Cela évite de cacher si on passe rapidement sur un autre avant que le mouseenter ne se déclenche
    if (this.activeTerritory === territoryId) {
        this.activeTerritory = null;
    }
  }

  toggleWisdom(wisdomId: string): void {
    if (this.activeWisdom === wisdomId) {
      this.activeWisdom = null; // Fermer si on clique sur le même
    } else {
      this.activeWisdom = wisdomId; // Ouvrir le nouveau
    }
  }

  scrollToSection(sectionId: string, event?: MouseEvent): void {
    if (event) { event.preventDefault(); }
    this.viewportScroller.scrollToAnchor(sectionId);
    this.activeSection = sectionId; // Mise à jour immédiate pour la sidebar
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.updateActiveSection();
    }, 50);
  }

  private updateActiveSection(): void {
    const scrollPosition = this.viewportScroller.getScrollPosition()[1];
    // Un offset pour que la section soit considérée active un peu avant qu'elle n'atteigne le haut exact de la fenêtre
    const offset = window.innerHeight * 0.4;


    let currentSection = this.sectionIds[0]; // Par défaut

    for (const sectionEl of this.sectionElements) {
        // Vérifier si l'élément existe et a une propriété offsetTop
        if (sectionEl && typeof sectionEl.offsetTop === 'number') {
            if (sectionEl.offsetTop <= scrollPosition + offset) {
                currentSection = sectionEl.id;
            } else {
                // Si la première section qui est en dessous du point de scroll est trouvée,
                // la section active est la précédente (ou la première si aucune n'a été dépassée).
                break;
            }
        }
    }
    this.activeSection = currentSection;
  }

  shareOnLinkedIn(): void {
    const pageUrl = encodeURIComponent(this.document.location.href);
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
    this.openShareWindow(shareUrl, 'Partager sur LinkedIn');
  }

  shareByEmail(): void {
    const pageUrl = this.document.location.href;
    const subject = encodeURIComponent("Découvrez ProTrack CV - L'allié de votre recherche d'emploi !");
    const body = encodeURIComponent(
      `Salut,\n\nJe pense que cet outil pourrait vraiment t'aider dans ta recherche d'emploi :\n${pageUrl}\n\nProTrack CV aide à organiser ses candidatures, suivre les rappels et bien plus encore !\n\nÀ bientôt !`
    );
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    const tempLink = this.renderer.createElement('a') as HTMLAnchorElement;
    this.renderer.setAttribute(tempLink, 'href', mailtoLink);
    tempLink.click();
  }

  private openShareWindow(url: string, title: string): void {
    const windowFeatures = 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600';
    window.open(url, title, windowFeatures);
  }

  ngOnDestroy(): void {
    clearTimeout(this.scrollTimeout);
  }
}
