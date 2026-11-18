@echo off
title Formulario RH - Lube (porta 3116)
cd /d "%~dp0web"
if not exist node_modules (
  echo Instalando a primeira vez...
  call npm install --no-audit --no-fund
)
start "" http://localhost:3116
node servidor_local.js
pause
