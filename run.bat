@echo off
setlocal
title Resume Builder Bot - Python Edition

:: Check for .env
if not exist .env (
    echo [MISSING] .env file not found. 
    echo Please copy .env.example to .env and add your Telegram token.
    pause
    exit /b 1
)

:: Check for Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found. Please install it from python.org
    pause
    exit /b 1
)

:: Check for pdflatex
where pdflatex >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARNING] pdflatex not found in PATH!
    echo PDF generation will fail unless you install TeX Live or MiKTeX.
)

:: Check/Install Requirements
echo Checking dependencies...
python -m pip install -r requirements.txt --quiet
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pip failed to install requirements.
    pause
    exit /b 1
)

:: Ensure required directories exist
if not exist logs mkdir logs
if not exist data mkdir data
if not exist tmp mkdir tmp

echo Starting ResumeBot (Python)...
python main.py
pause
