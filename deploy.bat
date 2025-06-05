@echo off
chcp 65001 >nul
title 🚀 Déploiement Simple Gestion-Candidatures

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                  🚀 DEPLOIEMENT SIMPLE                      ║
echo ║                  Gestion des Candidatures                   ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: 1. Vérification Docker
echo 🔍 1/5 - Vérification de Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker n'est pas installé ou démarré!
    pause
    exit /b 1
)
echo ✅ Docker OK

:: 2. Arrêt des conteneurs existants
echo ⏹️  2/5 - Arrêt des conteneurs existants...
docker stop gestion-candidatures-app 2>nul
docker rm gestion-candidatures-app 2>nul
echo ✅ Conteneurs arrêtés

:: 3. Build de l'image
echo 🔨 3/5 - Build de l'image...
docker build -t gestion-candidature .
if %errorlevel% neq 0 (
    echo ❌ Erreur pendant le build!
    pause
    exit /b 1
)
echo ✅ Build réussi

:: 4. Démarrage du conteneur
echo 🚀 4/5 - Démarrage du conteneur...
docker run -d -p 8080:80 --name gestion-candidatures-app gestion-candidature
if %errorlevel% neq 0 (
    echo ❌ Erreur pendant le démarrage!
    pause
    exit /b 1
)
echo ✅ Conteneur démarré

:: 5. Test de l'application
echo 🧪 5/5 - Test de l'application...
timeout /t 5 /nobreak >nul
curl -f http://localhost:8080 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Application en ligne!
) else (
    echo ⚠️  Application en cours de démarrage...
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    ✅ DEPLOIEMENT TERMINÉ!                  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 🌐 Application: http://localhost:8080
echo.
echo 🎯 Commandes utiles:
echo    docker logs gestion-candidatures-app     # Voir les logs
echo    docker stop gestion-candidatures-app     # Arrêter l'app
echo    docker restart gestion-candidatures-app  # Redémarrer l'app
echo.
pause
