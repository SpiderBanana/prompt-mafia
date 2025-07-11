@echo off
echo ================================
echo    🎯 PROMPT MAFIA - LAUNCHER
echo ================================
echo.

echo [1/2] Démarrage du serveur backend...
start "Prompt Mafia Server" cmd /k "cd /d %~dp0server && node server.js"

timeout /t 3 > nul

echo [2/2] Démarrage du client frontend...
start "Prompt Mafia Client" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ✅ Les deux serveurs sont en cours de démarrage !
echo.
echo 📱 Client: http://localhost:5173
echo 🖥️  Serveur: http://localhost:4000
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause > nul
