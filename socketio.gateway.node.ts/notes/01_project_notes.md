# Create directories
mkdir -p notes src/{config,utils/redis,socketio}

# Create root files
touch Dockerfile package.json package-lock.json tsconfig.json .env .env.development

# Create note file
touch notes/01_project_notes.md

# Create src files
touch src/{App.ts,server.ts}


# Config files
touch src/config/{env.config.ts,redis.config.ts}

# Utils
touch src/utils/logger.utils.ts
touch src/utils/redis/subscriber.ts

# Socket.io
touch src/socketio/server.ts