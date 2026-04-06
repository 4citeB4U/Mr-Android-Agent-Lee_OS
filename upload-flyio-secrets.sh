#!/bin/bash
# Usage: ./upload-flyio-secrets.sh <fly-app-name>
APP=$1
while IFS='=' read -r key value; do
  if [[ $key =~ ^[A-Za-z0-9_]+$ && ! $key =~ ^# && -n $value ]]; then
    fly secrets set "$key"="$value" -a "$APP"
  fi
done < .env.local
