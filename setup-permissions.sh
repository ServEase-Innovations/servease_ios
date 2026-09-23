#!/bin/bash

# Script to setup react-native-permissions for iOS

echo "🔧 Setting up react-native-permissions..."

# Navigate to iOS directory
cd ios

echo "📦 Installing pods..."
pod install

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Clean build folder in Xcode (Cmd+Shift+K)"
echo "2. Rebuild the app (Cmd+B)"
echo "3. Run the app"
echo ""
echo "Or run from terminal:"
echo "  npm run ios"
