@echo off
title Gestao de Convidados - Painel Administrativo
echo ===================================================
echo   Iniciando o Sistema de Gestao de Convidados
echo ===================================================
echo.

:: Tenta iniciar um servidor HTTP local caso Python esteja instalado
where python >nul 2>nul
if %errorlevel% == 0 (
    echo [Servidor Local] Iniciando servidor com Python na porta 3000...
    echo O site abrira no navegador em 2 segundos...
    echo.
    start "" powershell -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:3000'"
    python -m http.server 3000
    goto END
)

:: Caso nao tenha Python, abre o arquivo index.html diretamente no navegador
echo [Navegador] Abrindo index.html diretamente no seu navegador...
start "" "%~dp0index.html"

:END
pause
