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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../services/auth.service';
import { RegisterPayload } from '../../../models/user.model';

// Validateur personnalisé pour la force du mot de passe
export function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumeric = /[0-9]/.test(value);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
  const isLongEnough = value.length >= 8;

  const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar && isLongEnough;

  if (!passwordValid) {
    return {
      strongPassword: {
        hasUpperCase,
        hasLowerCase,
        hasNumeric,
        hasSpecialChar,
        isLongEnough
      }
    };
  }
  return null;
}

// Validateur pour les mots de passe correspondants
export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ passwordsMismatch: true });
    return { passwordsMismatch: true };
  } else if (confirmPassword && confirmPassword.hasError('passwordsMismatch')) {
    confirmPassword.setErrors(null);
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
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  registrationError: string | null = null;
  isLoading = false;

  // Indicateurs pour les critères du mot de passe
  passwordCriteria = {
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumeric: false,
    hasSpecialChar: false,
    isLongEnough: false
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        strongPasswordValidator
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });

    // Observer les changements du mot de passe pour mettre à jour les indicateurs
    this.password?.valueChanges.subscribe(value => {
      if (value) {
        this.passwordCriteria = {
          hasUpperCase: /[A-Z]/.test(value),
          hasLowerCase: /[a-z]/.test(value),
          hasNumeric: /[0-9]/.test(value),
          hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value),
          isLongEnough: value.length >= 8
        };
      } else {
        this.passwordCriteria = {
          hasUpperCase: false,
          hasLowerCase: false,
          hasNumeric: false,
          hasSpecialChar: false,
          isLongEnough: false
        };
      }
    });
  }

  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }

  getPasswordErrorMessage(): string {
    if (this.password?.hasError('required')) {
      return 'Le mot de passe est requis.';
    }
    if (this.password?.hasError('strongPassword')) {
      const errors = this.password.getError('strongPassword');
      const missing = [];
      if (!errors.isLongEnough) missing.push('au moins 8 caractères');
      if (!errors.hasUpperCase) missing.push('une majuscule');
      if (!errors.hasLowerCase) missing.push('une minuscule');
      if (!errors.hasNumeric) missing.push('un chiffre');
      if (!errors.hasSpecialChar) missing.push('un caractère spécial');
      return `Le mot de passe doit contenir ${missing.join(', ')}.`;
    }
    return '';
  }

  onSubmit(): void {
    this.registrationError = null;
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
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
        this.router.navigate(['/login'], {
          queryParams: {
            message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.'
          }
        });
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
