# Etap 1: Budowanie aplikacji
FROM node:20 AS build

WORKDIR /praca_licencjacka

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build --if-present || true

# Etap 2: Serwowanie z Nginx
FROM nginx:alpine

# Skopiuj zbudowane pliki do katalogu Nginx
COPY --from=build /praca_licencjacka/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Opcjonalnie: dodaj własną konfigurację Nginx
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
