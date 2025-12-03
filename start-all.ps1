# Open frontend in a new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ./frontend; npm run dev"

# Open backend in a new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ./backend; node index.js"

# Open ML microservice in a new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ./ml; python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000"
