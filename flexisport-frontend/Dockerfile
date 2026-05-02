# Stage 1 — build Angular
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npx ng build --configuration production

# Stage 2 — serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist/flexisport-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
