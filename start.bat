@echo off
title VisionChord Launcher
cd /d "%~dp0"
echo Memulai VisionChord...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
