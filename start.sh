find . | grep -E "(/__pycache__$|\.pyc$|\.pyo$)" | xargs rm -rf
source ./venv/bin/activate
python app.py