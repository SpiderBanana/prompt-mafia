# Script PowerShell pour lancer Prompt Mafia
Write-Host "================================" -ForegroundColor Cyan
Write-Host "   🎯 PROMPT MAFIA - LAUNCHER" -ForegroundColor Cyan  
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Démarrage du serveur backend..." -ForegroundColor Yellow
$serverPath = Join-Path $PSScriptRoot "server"
Start-Process powershell -ArgumentList "-Command", "cd '$serverPath'; node server.js; Read-Host 'Appuyez sur Entrée pour fermer'"

Start-Sleep -Seconds 3

Write-Host "[2/2] Démarrage du client frontend..." -ForegroundColor Yellow  
$clientPath = Join-Path $PSScriptRoot "client"
Start-Process powershell -ArgumentList "-Command", "cd '$clientPath'; npm run dev; Read-Host 'Appuyez sur Entrée pour fermer'"

Write-Host ""
Write-Host "✅ Les deux serveurs sont en cours de démarrage !" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Client: http://localhost:5173" -ForegroundColor Blue
Write-Host "🖥️  Serveur: http://localhost:4000" -ForegroundColor Blue
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
