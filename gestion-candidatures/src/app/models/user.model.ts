// src/app/models/user.model.ts

export interface User {
  id: string; // Ou number, selon ce que ton backend utilisera
  firstName: string;
  lastName: string;
  email: string;
  roles?: string[]; // Optionnel, pour la gestion des rôles plus tard
  // Tu pourras ajouter d'autres propriétés comme la date d'inscription, etc.
}

// Optionnel: Interface pour les identifiants de connexion
export interface LoginCredentials {
  email: string;
  password: string;
}

// Optionnel: Interface pour les informations d'inscription
export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  // confirmPassword n'est généralement pas envoyé au backend, la validation se fait au front
}
