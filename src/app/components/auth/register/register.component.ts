// src/app/components/auth/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Pour l'indicateur de chargement
import { AuthService } from '../../../services/auth.service'; // Importer AuthService
import { RegisterPayload } from '../../../models/user.model'; // Importer RegisterPayload

// Custom validator for matching passwords
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordsMismatch: true }); // Mettre l'erreur sur le champ de confirmation
    return { passwordsMismatch: true };
  } else if (confirmPassword && confirmPassword.hasError('passwordsMismatch')) {
    confirmPassword.setErrors(null); // Effacer l'erreur si les mots de passe correspondent à nouveau
  }
  return null;
}

@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  registrationError: string | null = null;
  isLoading = false; // Pour gérer l'état de chargement

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService // Injecter AuthService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }

  onSubmit(): void {
    this.registrationError = null;
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true; // Activer le chargement
    // On ne prend que les champs nécessaires pour le payload d'inscription
    const payload: RegisterPayload = {
      firstName: this.firstName?.value,
      lastName: this.lastName?.value,
      email: this.email?.value,
      password: this.password?.value
    };

    this.authService.register(payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Inscription réussie via AuthService:', response);
        // Rediriger vers la page de connexion avec un message de succès
        // ou vers une page de "veuillez confirmer votre email" si c'est le flux
        this.router.navigate(['/login'], { queryParams: { message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' } });
      },
      error: (err) => {
        this.isLoading = false;
        this.registrationError = err.message || 'Erreur lors de l\'inscription. Veuillez réessayer.';
        console.error('Erreur d\'inscription via AuthService:', err);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}
