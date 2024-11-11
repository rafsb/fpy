@echo off
REM Remove __pycache__ directories
for /d /r %%i in (__pycache__) do if exist "%%i" rd /s /q "%%i"

REM Check if the folder exists before removing files
if exist .\src\var\db\ (
    REM Remove all files in .\src\var\db\
    del /q .\src\var\db\*
)

REM Run the Python application
if "%~1" neq "" (
    .\venv\Scripts\flask.exe --app app.py --debug run
) else (
    .\venv\Scripts\python.exe app.py
)
