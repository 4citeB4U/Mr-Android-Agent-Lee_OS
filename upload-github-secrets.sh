#!/bin/bash
# Usage: ./upload-github-secrets.sh <github-repo>
REPO=$1
while IFS='=' read -r key value; do
  if [[ $key =~ ^[A-Za-z0-9_]+$ && ! $key =~ ^# && -n $value ]]; then
    gh secret set "$key" -b"${value}" -R "$REPO"
  fi
done < .env.local
