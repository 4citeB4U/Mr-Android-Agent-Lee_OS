FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Use a lightweight static server for the built files
FROM pierrezemb/gostatic
COPY --from=builder /app/dist /srv/http/
# Serve on port 8000 for Fly.io
CMD ["-port","8000","-https-promote", "-enable-logging"]
