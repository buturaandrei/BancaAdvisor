@echo off
echo ========================================
echo  BancaAdvisor - Avvio in Produzione
echo ========================================
echo.

REM Build frontend if dist doesn't exist
if not exist "frontend\dist" (
    echo Building frontend...
    cd frontend
    call npm run build
    cd ..
    echo.
)

REM Generate SSL certs if they don't exist
if not exist "backend\certs\server-cert.pem" (
    echo Generazione certificati SSL...
    cd backend
    python generate_certs.py
    cd ..
    echo.
)

REM Copy CA cert to frontend dist for download
if exist "backend\certs\ca.pem" (
    copy /Y "backend\certs\ca.pem" "frontend\dist\ca.pem" >nul 2>&1
)

REM Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

echo ========================================
echo  Server HTTPS attivo su porta 8443!
echo ========================================
echo.
echo  Da PC:       https://localhost:8443
echo  Da telefono: https://%LOCAL_IP%:8443
echo.
echo  --- SETUP iPHONE (solo la prima volta) ---
echo  1. Apri Safari su iPhone e vai a:
echo     https://%LOCAL_IP%:8443/ca.pem
echo  2. Installa il profilo scaricato:
echo     Impostazioni - Generali - VPN e gestione dispositivi
echo  3. Attiva attendibilita certificato:
echo     Impostazioni - Generali - Info - Attendibilita certificati
echo  4. Poi vai a https://%LOCAL_IP%:8443
echo ========================================
echo.

cd backend
python serve.py
