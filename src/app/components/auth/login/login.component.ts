// src/app/components/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { LoginCredentials } from '../../../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;
  loginError: string | null = null;
  isLoading = false;
  returnUrl: string = '/candidatures'; // URL de redirection par défaut

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Créer le formulaire
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Récupérer l'URL de retour des paramètres de route
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/candidatures';

    // Vérifier s'il y a un message à afficher (ex: après inscription ou session expirée)
    const message = this.route.snapshot.queryParams['message'];
    if (message) {
      this.showMessage(message, 'info-snackbar');
      // Nettoyer l'URL des paramètres
      this.router.navigate([], {
        queryParams: {},
        queryParamsHandling: 'merge'
      });
    }

    // Si l'utilisateur est déjà connecté, rediriger
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit(): void {
    this.loginError = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const credentials: LoginCredentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (user) => {
        this.isLoading = false;
        if (user) {
          console.log('Connexion réussie pour:', user.email);
          this.showMessage(`Bienvenue ${user.firstName} !`, 'success-snackbar');

          // Rediriger vers l'URL de retour ou la page par défaut
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loginError = this.getErrorMessage(err);
        console.error('Erreur de connexion:', err);

        // Réinitialiser le mot de passe en cas d'erreur
        this.loginForm.patchValue({ password: '' });
        this.password?.markAsUntouched();
      }
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  private getErrorMessage(error: any): string {
    // Gérer différents types d'erreurs
    if (error.message) {
      return error.message;
    } else if (error.error?.message) {
      return error.error.message;
    } else if (error.status === 0) {
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
    } else if (error.status === 401) {
      return 'Email ou mot de passe incorrect.';
    } else {
      return 'Erreur de connexion. Veuillez réessayer.';
    }
  }

  private showMessage(message: string, panelClass: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: [panelClass, 'custom-snackbar']
    });
  }
}
