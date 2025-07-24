# Use official Node.js LTS image (change version if needed)
FROM node:22-bullseye-slim

# Set work directory
WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install dependencies (no dev dependencies for prod; use npm ci if using lock file)
RUN npm install --omit=dev

# Copy the rest of your app
COPY . .

# Expose the port your app listens on (example: 4001)
EXPOSE 4001

# Start the app (change if your main file is not server.js)
CMD ["node", "dist/server.js"]
