#!/bin/bash

# Business Calculator - Installation Script
# This script installs all required dependencies

echo "🚀 Installing Business Calculator dependencies..."
echo ""

# Navigate to the project directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "📦 node_modules already exists. Cleaning up..."
    rm -rf node_modules package-lock.json
fi

# Install dependencies
echo "📥 Installing npm packages..."
npm install

# Check installation success
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation completed successfully!"
    echo ""
    echo "🎉 Ready to start! Run the following command:"
    echo ""
    echo "   npm run dev"
    echo ""
    echo "Then open http://localhost:3000 in your browser"
else
    echo ""
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi
