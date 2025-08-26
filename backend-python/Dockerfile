# Użyj lekkiego obrazu z Pythonem
FROM python:3.12-slim


# 🧩 Dodaj zależności systemowe do OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
    
# Ustaw katalog roboczy w kontenerze
WORKDIR /praca_licencjacka

# Skopiuj pliki requirements.txt i zainstaluj zależności
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Skopiuj resztę kodu
COPY . .

# Otwórz port aplikacji FastAPI
EXPOSE 8001

# Ustaw domyślny punkt wejścia (zmień na właściwy plik, np. analyzer lub train)
CMD ["python", "analyzer.py"]
