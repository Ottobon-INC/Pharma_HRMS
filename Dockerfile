# ====================================================================
# Stage 1: Build Frontend (Vite + React 19 + TailwindCSS + PWA)
# Using Debian-slim (glibc) ensures sharp, tailwindcss v4 oxide, and
# esbuild native binaries resolve smoothly on Ubuntu Linux VPS.
# ====================================================================
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Copy package descriptors first for optimal Docker layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies required for Vite build)
RUN npm ci --prefer-offline --no-audit || npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Build-time environment arguments (with defaults for turnkey zero-config clone & run)
ARG VITE_SUPABASE_URL="https://zaxnikpkftyfzpmmlevz.supabase.co"
ARG VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpheG5pa3BrZnR5ZnpwbW1sZXZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTc1NDQsImV4cCI6MjEwMjc3MzU0NH0.AVAwVt2Z8DJMFtTOr8NDbi0u14_hBIdrb3L2TZAJOTw"
ARG VITE_COMPANY_NAME="Orca Labs"
ARG VITE_APP_TITLE="Orca Labs Pharma HRMS"
ARG VITE_GOOGLE_MAPS_API_KEY="AIzaSyDn6JKKmDVEn8GLUBE7kcl_dtIcyU85ZYc"
ARG VITE_MAP_DEFAULT_LAT="17.3850"
ARG VITE_MAP_DEFAULT_LNG="78.4867"
ARG VITE_MAP_DEFAULT_ZOOM="12"
ARG VITE_OSRM_ENDPOINT="https://router.project-osrm.org"
ARG VITE_LIVE_BROADCAST_INTERVAL_MS="10000"

# Expose build args to Vite build environment
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_COMPANY_NAME=$VITE_COMPANY_NAME
ENV VITE_APP_TITLE=$VITE_APP_TITLE
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_MAP_DEFAULT_LAT=$VITE_MAP_DEFAULT_LAT
ENV VITE_MAP_DEFAULT_LNG=$VITE_MAP_DEFAULT_LNG
ENV VITE_MAP_DEFAULT_ZOOM=$VITE_MAP_DEFAULT_ZOOM
ENV VITE_OSRM_ENDPOINT=$VITE_OSRM_ENDPOINT
ENV VITE_LIVE_BROADCAST_INTERVAL_MS=$VITE_LIVE_BROADCAST_INTERVAL_MS

# Compile production bundle and PWA service worker into /app/dist
RUN npm run build

# ====================================================================
# Stage 2: Production Nginx Server (Lightweight ~25MB Alpine Runner)
# ====================================================================
FROM nginx:alpine

# Remove default boilerplate configuration
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy hardened Nginx configuration (SPA routing, PWA MIME types, gzip & cache controls)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static artifacts from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Health check to ensure container is healthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
