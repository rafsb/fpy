if not exist venv (
    py -m venv venv
)
.\venv\Scripts\python.exe -m pip install -r requirements.txt