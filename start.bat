@echo off
if "%~1"=="" (
    echo Remove __pycache__ directories
    for /d /r %%i in (__pycache__) do if exist "%%i" rd /s /q "%%i"

    REM Check if the folder exists before removing files
    if exist .\src\var\db\.cache (
        echo Remove all files in .\src\var\db\.cache
        del /q .\src\var\db\.cache\*
    )
)

REM run the python script
.\venv\Scripts\python.exe app.py %*
