# Script de configuration pour le build Android
# À exécuter avant chaque build local

Write-Host "Configuration de l'environnement Android..." -ForegroundColor Green

# Configuration JAVA_HOME
$env:JAVA_HOME = "C:\Users\mondong\Android\android-studio\jbr"
Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green

# Configuration ANDROID_HOME
$env:ANDROID_HOME = "C:\Users\mondong\Android\Sdk"
Write-Host "ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green

# Ajout au PATH
$env:Path += ";$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools"

# Vérification
Write-Host "Verification des outils:" -ForegroundColor Yellow
try {
    $javaVersion = & java -version 2>&1
    Write-Host "Java: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "Java non trouve" -ForegroundColor Red
}

try {
    $adbVersion = & adb version 2>&1
    Write-Host "ADB: $adbVersion" -ForegroundColor Green
} catch {
    Write-Host "ADB non trouve" -ForegroundColor Red
}

Write-Host "Environnement pret pour le build Android !" -ForegroundColor Cyan
Write-Host "Lancez maintenant: npx expo run:android" -ForegroundColor White
