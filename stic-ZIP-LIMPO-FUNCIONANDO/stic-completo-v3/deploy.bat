@echo off
echo ========================================
echo   STIC - Deploy Firebase Hosting
echo ========================================
echo.

echo [1/3] Verificando Firebase CLI...
firebase --version
if errorlevel 1 (
    echo ERRO: Firebase CLI nao instalado!
    echo Instale com: npm install -g firebase-tools
    pause
    exit /b 1
)

echo.
echo [2/3] Fazendo deploy...
firebase deploy

if errorlevel 1 (
    echo.
    echo ERRO no deploy!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   DEPLOY CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Acesse: https://stic-os-pmmg.web.app
echo.
pause
