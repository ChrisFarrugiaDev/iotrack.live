#!/bin/bash

# Check if password is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <password>"
  exit 1
fi

PASSWORD=$1

# Function to encrypt a file
encrypt_file() {
  local file=$1
  echo "Encrypting $file..."
  echo "$PASSWORD" | gpg --batch --yes --passphrase-fd 0 --symmetric --cipher-algo AES256 "$file"
}

# Files to be encrypted
files_to_encrypt=(
  docker-compose.yml
  .env
  # .env.development  
  web.backend.node.ts.auth/.env
  web.backend.node.ts.auth/.env.development  
  web.backend.node.ts.api/.env
  web.backend.node.ts.api/.env.development 
  teltonika.parser.go/.env
  teltonika.parser.go/.env.development  
  telemetry.db.writer.node.ts/.env
  telemetry.db.writer.node.ts/.env.development  
)

# Find and encrypt the files
for file in "${files_to_encrypt[@]}"; do
  if [ -f "$file" ]; then
    encrypt_file "$file"
  else
    echo "$file not found, skipping."
  fi
done
