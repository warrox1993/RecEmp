// src/app/components/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Pour l'indicateur de chargement
import { AuthService } from '../../../services/auth.service'; // Importer AuthService
import { LoginCredentials } from '../../../models/user.model'; // Importer LoginCredentials

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
    MatProgressSpinnerModule // Ajouter MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;
  loginError: string | null = null;
  isLoading = false; // Pour gérer l'état de chargement

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService // Injecter AuthService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]] // Garder minlength à 6 pour la simulation
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit(): void {
    this.loginError = null;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true; // Activer le chargement
    const credentials: LoginCredentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (user) => {
        this.isLoading = false; // Désactiver le chargement
        if (user) {
          console.log('Connexion réussie via AuthService pour:', user.email);
          this.router.navigate(['/candidatures']); // Rediriger vers la liste des candidatures
        } else {
          // Ce cas ne devrait pas arriver si le login réussit et retourne un utilisateur
          this.loginError = 'Réponse de connexion inattendue.';
        }
      },
      error: (err) => {
        this.isLoading = false; // Désactiver le chargement
        this.loginError = err.message || 'Erreur de connexion. Veuillez vérifier vos identifiants.';
        console.error('Erreur de connexion via AuthService:', err);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}
