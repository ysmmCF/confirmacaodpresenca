@echo off
title Enviar Projeto para o GitHub - ysmmCF
echo ===================================================
echo   Limpando arquivos desnecessarios e enviando ao GitHub
echo ===================================================
echo.

:: Removendo diretorios de build antigos
if exist src rmdir /s /q src
if exist public rmdir /s /q public
if exist .github rmdir /s /q .github
if exist node_modules rmdir /s /q node_modules

:: Removendo arquivos de configuracao desnecessarios de versoes anteriores
if exist vite.config.ts del /f /q vite.config.ts
if exist tsconfig.json del /f /q tsconfig.json
if exist tailwind.config.js del /f /q tailwind.config.js
if exist postcss.config.js del /f /q postcss.config.js
if exist netlify.toml del /f /q netlify.toml
if exist vercel.json del /f /q vercel.json

echo [OK] Limpeza concluida! Estrutura pura Vanilla JS + Firebase Firestore preservada.
echo.
echo Enviando atualizacao para o GitHub: ysmmCF/confirmacaodpresenca...
echo.

git init
git add .
git commit -m "Sistema Real de Gerenciamento de Convidados (Firebase Auth + Firestore)"
git branch -M main
git remote remove origin >nul 2>nul
git remote add origin https://github.com/ysmmCF/confirmacaodpresenca.git
git push -u origin main --force

echo.
echo ===================================================
echo   ENVIO CONCLUIDO COM SUCESSO!
echo ===================================================
echo.
pause
