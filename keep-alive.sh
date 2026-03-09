#!/bin/bash
# HQ dev server watchdog — restarts if it dies
cd ~/based-command-center
while true; do
  echo "[$(date)] Starting HQ dev server on port 3001..."
  PORT=3001 npx next dev 2>&1
  echo "[$(date)] Server died (exit $?). Restarting in 3s..."
  sleep 3
done
