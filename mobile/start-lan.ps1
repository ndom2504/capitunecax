Set-Location $PSScriptRoot
$env:PATH = "$PSScriptRoot\node_modules\.bin;$env:PATH"

$ip = (
	Get-NetIPAddress -AddressFamily IPv4 |
		Where-Object {
			$_.IPAddress -notlike '127.*' -and
			$_.AddressState -eq 'Preferred'
		} |
		Select-Object -First 1 -ExpandProperty IPAddress
)

if (-not $ip) {
	try {
		$ip = (
			Get-NetIPConfiguration |
				Where-Object { $_.IPv4DefaultGateway -ne $null -and $_.IPv4Address -ne $null } |
				Select-Object -First 1 -ExpandProperty IPv4Address
		).IPAddress
	} catch {
		$ip = $null
	}
}

if (-not $ip) {
	Write-Host "Aucune IPv4 LAN detectee. Expo risque d'afficher 127.0.0.1." -ForegroundColor Yellow
} else {
	$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
	Write-Host "REACT_NATIVE_PACKAGER_HOSTNAME=$ip" -ForegroundColor Cyan
}

# URL web pour les WebViews (Jobs/CV) — surcharge via variable d'env.
if (-not $env:EXPO_PUBLIC_API_BASE_URL -or [string]::IsNullOrWhiteSpace($env:EXPO_PUBLIC_API_BASE_URL)) {
	if ($ip) {
		$env:EXPO_PUBLIC_API_BASE_URL = "http://$ip:3000"
	} else {
		$env:EXPO_PUBLIC_API_BASE_URL = "http://localhost:3000"
	}
}
Write-Host "EXPO_PUBLIC_API_BASE_URL=$($env:EXPO_PUBLIC_API_BASE_URL)" -ForegroundColor Cyan

Write-Host "Demarrage Expo LAN avec cache reset..." -ForegroundColor Green
$port = if ($env:EXPO_PORT) { $env:EXPO_PORT } else { '8082' }
Write-Host "Port Metro: $port" -ForegroundColor Cyan
npx expo start --lan --clear --port $port
