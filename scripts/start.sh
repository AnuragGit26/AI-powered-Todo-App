#!/bin/bash

# Print header
echo "====================================="
echo "  Node Process Manager for Todo App  "
echo "====================================="
echo

# Kill all running node processes
echo "Killing all Node.js processes..."
pkill -f node || echo "No Node.js processes found to kill"
echo "✅ Node processes terminated"
echo

# Set port to 3000
export PORT=3000

# Start the application
echo "Starting Todo App on http://localhost:3000"
echo "====================================="
npm run dev 