# Use official Node.js LTS image
FROM node:22-slim

# Set working directory
WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apt-get update \
    && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first (for cache efficiency)
COPY package*.json ./

# Install dependencies (production-only)
RUN npm install --omit=dev

# Copy source files
COPY . .

# Build TypeScript inside container (assumes you have "build": "tsc" in package.json)
RUN npm run build

# Expose the app port
EXPOSE 4001

# Start the app
CMD ["node", "dist/server.js"]


# sudo docker compose down web-backend-auth; sudo docker compose build web-backend-auth; sudo docker compose up web-backend-auth