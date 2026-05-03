@echo off
REM Bizpark.Runner.Py launcher — uses the venv's Python directly.
setlocal
set SCRIPT_DIR=%~dp0
set VENV_PY=%SCRIPT_DIR%venv\Scripts\python.exe

if not exist "%VENV_PY%" (
    echo ERROR: Venv not found at %VENV_PY%
    echo Run: python -m venv venv ^&^& venv\Scripts\python -m pip install -r requirements.txt
    exit /b 1
)

"%VENV_PY%" "%SCRIPT_DIR%run.py" %*
