# Użyj obrazu z Node.js
FROM node:20

# Ustaw katalog roboczy
WORKDIR /praca_licencjacka

# Skopiuj package.json i zainstaluj zależności
COPY package*.json ./
RUN npm install

# Skopiuj cały kod źródłowy
COPY . .

# Otwórz port backendu
EXPOSE 8000

# Uruchom backend przez tsx
CMD ["npx", "tsx", "server.ts"]
