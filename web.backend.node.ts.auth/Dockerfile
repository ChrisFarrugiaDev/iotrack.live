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

# Install dependencies (omit dev-deps for production)
RUN npm install --omit=dev

# Copy production build artifacts and Prisma client
COPY dist ./dist
COPY generated ./generated

# Expose the app port
EXPOSE 4001

# Start the app
CMD ["node", "dist/server.js"]


# sudo docker compose down web-backend-auth; sudo docker compose build web-backend-auth; sudo docker compose up web-backend-auth