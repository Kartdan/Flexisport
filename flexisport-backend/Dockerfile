FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

# Uploads directory persisted via a Docker volume
RUN mkdir -p uploads/courts uploads/avatars

EXPOSE 5000

CMD ["node", "server.js"]
