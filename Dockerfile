# --- etap 1: budowanie aplikacji ---
FROM node:22-alpine AS build
WORKDIR /build

# Zaleznosci osobno, zeby Docker cache'owal npm ci
# i nie instalowal wszystkiego przy kazdej zmianie w kodzie.
COPY package*.json ./
RUN npm ci

COPY . .
# Konfiguracja production podmienia environment.ts na environment.prod.ts
# (sciezki wzgledne zamiast localhost:8080).
RUN npm run build -- --configuration production

# --- etap 2: serwer ---
FROM caddy:2-alpine
COPY --from=build /build/dist/nf-frontend/browser /srv
COPY Caddyfile /etc/caddy/Caddyfile
