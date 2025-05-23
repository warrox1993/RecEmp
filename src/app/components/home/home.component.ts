import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly sections = ['hero', 'impact', 'solution', 'features', 'demo', 'cta'];
  private readonly currentUrl = window.location.href;

  constructor(
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Initialiser la navigation active
    this.updateActiveNavigation();
  }

  ngOnDestroy(): void {
    // Cleanup si nécessaire
  }

  /**
   * Gestion des clics sur la navigation
   */
  onNavClick(event: Event, targetId: string): void {
    event.preventDefault();

    // Mise à jour de l'état actif
    this.updateActiveLinks(targetId);

    // Scroll vers la section
    this.scrollToSection(targetId);
  }

  /**
   * Gestion du scroll pour détecter la section active
   */
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    const scrollPos = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    let activeSection = 'hero';
    let maxVisibleArea = 0;

    // Trouver la section la plus visible à l'écran
    this.sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top;
        const elementBottom = rect.bottom;

        // Calculer la partie visible de cette section
        const visibleTop = Math.max(0, -elementTop);
        const visibleBottom = Math.min(windowHeight, windowHeight - Math.max(0, elementBottom - windowHeight));
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        // Si cette section est plus visible que les autres
        if (visibleHeight > maxVisibleArea && visibleHeight > 100) {
          maxVisibleArea = visibleHeight;
          activeSection = sectionId;
        }
      }
    });

    // Cas spécial : si on est tout en bas de la page
    if (scrollPos + windowHeight >= documentHeight - 50) {
      activeSection = 'cta';
    }

    // Mettre à jour la navigation
    this.updateActiveLinks(activeSection);

    // Mise à jour de la barre de progression
    this.updateProgressIndicator(scrollPos, documentHeight, windowHeight);
  }

  /**
   * Actions des boutons CTA
   */
  startFree(): void {
    // Navigation vers la page d'inscription
    console.log('Redirection vers inscription gratuite');
    this.router.navigate(['/register']);
  }

  login(): void {
    // Navigation vers la page de connexion
    console.log('Redirection vers connexion');
    this.router.navigate(['/login']);
  }

  /**
   * Fonctions de partage sur les réseaux sociaux
   */
  shareOnFacebook(): void {
    const url = encodeURIComponent(this.currentUrl);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    this.openShareWindow(shareUrl, 'facebook-share');
  }

  shareOnLinkedIn(): void {
    const url = encodeURIComponent(this.currentUrl);
    const title = encodeURIComponent('ProTrack CV - Transformez votre recherche d\'emploi');
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`;
    this.openShareWindow(shareUrl, 'linkedin-share');
  }

  shareOnTwitter(): void {
    const url = encodeURIComponent(this.currentUrl);
    const text = encodeURIComponent('Découvrez ProTrack CV - La plateforme qui révolutionne la recherche d\'emploi ! 🚀');
    const shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    this.openShareWindow(shareUrl, 'twitter-share');
  }

  shareOnInstagram(): void {
    this.copyToClipboard(this.currentUrl).then(() => {
      alert('Lien copié ! Collez-le dans votre story Instagram 📱');
    }).catch(() => {
      alert('Copiez ce lien pour Instagram : ' + this.currentUrl);
    });
  }

  shareOnTikTok(): void {
    this.copyToClipboard(this.currentUrl).then(() => {
      alert('Lien copié ! Partagez-le dans votre vidéo TikTok 🎵');
    }).catch(() => {
      alert('Copiez ce lien pour TikTok : ' + this.currentUrl);
    });
  }

  shareOnYouTube(): void {
    this.copyToClipboard(this.currentUrl).then(() => {
      alert('Lien copié ! Utilisez-le dans votre description YouTube 📺');
    }).catch(() => {
      alert('Copiez ce lien pour YouTube : ' + this.currentUrl);
    });
  }

  shareOnWhatsApp(): void {
    const text = encodeURIComponent(`Découvrez ProTrack CV - La plateforme qui révolutionne la recherche d'emploi ! ${this.currentUrl}`);
    const shareUrl = `https://api.whatsapp.com/send?text=${text}`;
    window.open(shareUrl, 'whatsapp-share');
  }

  shareByEmail(): void {
    const subject = encodeURIComponent('Découvrez ProTrack CV - Optimisez votre recherche d\'emploi');
    const body = encodeURIComponent(
      `Bonjour,\n\nJe vous recommande ProTrack CV, une plateforme innovante qui révolutionne la recherche d'emploi :\n\n${this.currentUrl}\n\nUne solution complète pour organiser, suivre et optimiser toutes vos candidatures avec des résultats prouvés !\n\nCordialement`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  /**
   * Méthodes privées utilitaires
   */
  private updateActiveNavigation(): void {
    // Détection initiale de la section active si nécessaire
    this.onWindowScroll();
  }

  private updateActiveLinks(activeSection: string): void {
    const navLinks = this.elementRef.nativeElement.querySelectorAll('.quest-sidebar a');
    navLinks.forEach((link: HTMLElement) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + activeSection) {
        link.classList.add('active');
      }
    });
  }

  private scrollToSection(targetId: string): void {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  private updateProgressIndicator(scrollPos: number, documentHeight: number, windowHeight: number): void {
    const scrollProgress = Math.min((scrollPos / (documentHeight - windowHeight)) * 100, 100);
    const progressIndicator = this.elementRef.nativeElement.querySelector('.progress-indicator');

    if (progressIndicator) {
      const sidebar = this.elementRef.nativeElement.querySelector('.quest-sidebar');
      if (sidebar) {
        const maxHeight = sidebar.offsetHeight - 32;
        const newHeight = Math.min((scrollProgress / 100) * maxHeight, maxHeight);
        progressIndicator.style.height = `${Math.max(0, newHeight)}px`;
      }
    }
  }

  private openShareWindow(url: string, name: string): void {
    window.open(url, name, 'width=600,height=400');
  }

  private async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback pour les navigateurs qui ne supportent pas l'API Clipboard
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
      } catch (copyErr) {
        console.error('Erreur lors de la copie:', copyErr);
        throw copyErr;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }
}
