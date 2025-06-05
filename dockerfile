# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
# Copier seulement les fichiers de dépendances pour optimiser le cache
COPY package*.json ./
# Installation avec cache optimisé
RUN npm install --silent && npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app
# Copier les dépendances depuis le stage précédent
COPY --from=deps /app/node_modules ./node_modules
# Copier le code source
COPY . .
# Build optimisé pour production
RUN npm run build -- --configuration=production --optimization=true --aot=true --build-optimizer=true

# Stage 3: Production
FROM nginx:alpine AS production

# Installer des outils utiles
RUN apk add --no-cache curl

# Copier la configuration nginx optimisée
COPY nginx.conf /etc/nginx/nginx.conf

# Copier les fichiers buildés
COPY --from=builder /app/dist/gestion-candidatures/browser /usr/share/nginx/html

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && adduser -S angular -u 1001 -G nodejs

# Permissions optimales
RUN chown -R angular:nodejs /usr/share/nginx/html && \
    chown -R angular:nodejs /var/cache/nginx && \
    chown -R angular:nodejs /var/log/nginx && \
    chown -R angular:nodejs /etc/nginx/conf.d

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Exposer le port
EXPOSE 80

# Utiliser l'utilisateur non-root
USER angular

# Commande optimisée
CMD ["nginx", "-g", "daemon off;"]
