#!/bin/bash

# Script to generate all iOS app icon sizes from a source image
# Usage: ./generate-app-icons.sh

SOURCE_ICON="./assets/images/new_app_icon_transparent.png"
OUTPUT_DIR="./ios/Serveaso/Images.xcassets/AppIcon.appiconset"

echo "🎨 Generating iOS app icons from: $SOURCE_ICON"
echo "📁 Output directory: $OUTPUT_DIR"

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Error: Source icon not found at $SOURCE_ICON"
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate all required icon sizes
echo "🔨 Generating icon sizes..."

# iOS Marketing (App Store)
sips -z 1024 1024 "$SOURCE_ICON" --out "$OUTPUT_DIR/ios-marketing-1024x1024-1x.png"
sips -z 1024 1024 "$SOURCE_ICON" --out "$OUTPUT_DIR/Icon-1024.png"

# iPhone sizes
sips -z 40 40 "$SOURCE_ICON" --out "$OUTPUT_DIR/iphone-20x20-2x.png"
sips -z 60 60 "$SOURCE_ICON" --out "$OUTPUT_DIR/iphone-20x20-3x.png"
sips -z 29 29 "$SOURCE_ICON" --out "$OUTPUT_DIR/iphone-29x29-1x.png"
sips -z 58 58 "$SOURCE_ICON" --out "$OUTPUT_DIR/iphone-29x29-2x.png"
sips -z 87 87 "$SOURCE_ICON" --out "$OUTPUT_DIR/iphone-29x29-3x.png"
sips -z 80 80 "$SOURCE_ICON" --out "$OUTPUT_DIR/iphone-40x40-2x.png"
sips -z 120 120 "$SOURCE_ICON" --out "$OUTPUT_DIR/iphone-40x40-3x.png"
sips -z 57 57 "$SOURCE_ICON" --out "$OUTPUT_DIR/iphone-57x57-1x.png"
sips -z 114 114 "$SOURCE_ICON" --out "$OUTPUT_DIR/iphone-57x57-2x.png"
sips -z 120 120 "$SOURCE_ICON" --out "$OUTPUT_DIR/iphone-60x60-2x.png"
sips -z 180 180 "$SOURCE_ICON" --out "$OUTPUT_DIR/iphone-60x60-3x.png"

# Additional iPhone sizes
sips -z 40 40 "$SOURCE_ICON" --out "$OUTPUT_DIR/Icon-40.png"
sips -z 58 58 "$SOURCE_ICON" --out "$OUTPUT_DIR/Icon-58.png"
sips -z 60 60 "$SOURCE_ICON" --out "$OUTPUT_DIR/Icon-60.png"
sips -z 80 80 "$SOURCE_ICON" --out "$OUTPUT_DIR/Icon-80.png"
sips -z 87 87 "$SOURCE_ICON" --out "$OUTPUT_DIR/Icon-87.png"
sips -z 120 120 "$SOURCE_ICON" --out "$OUTPUT_DIR/Icon-120.png"
sips -z 180 180 "$SOURCE_ICON" --out "$OUTPUT_DIR/Icon-180.png"

# iPad sizes
sips -z 20 20 "$SOURCE_ICON" --out "$OUTPUT_DIR/ipad-20x20-1x.png"
sips -z 40 40 "$SOURCE_ICON" --out "$OUTPUT_DIR/ipad-20x20-2x.png"
sips -z 29 29 "$SOURCE_ICON" --out "$OUTPUT_DIR/ipad-29x29-1x.png"
sips -z 58 58 "$SOURCE_ICON" --out "$OUTPUT_DIR/ipad-29x29-2x.png"
sips -z 40 40 "$SOURCE_ICON" --out "$OUTPUT_DIR/ipad-40x40-1x.png"
sips -z 80 80 "$SOURCE_ICON" --out "$OUTPUT_DIR/ipad-40x40-2x.png"
sips -z 50 50 "$SOURCE_ICON" --out "$OUTPUT_DIR/ipad-50x50-1x.png"
sips -z 100 100 "$SOURCE_ICON" --out "$OUTPUT_DIR/ipad-50x50-2x.png"
sips -z 72 72 "$SOURCE_ICON" --out "$OUTPUT_DIR/ipad-72x72-1x.png"
sips -z 144 144 "$SOURCE_ICON" --out "$OUTPUT_DIR/ipad-72x72-2x.png"
sips -z 76 76 "$SOURCE_ICON" --out "$OUTPUT_DIR/ipad-76x76-1x.png"
sips -z 152 152 "$SOURCE_ICON" --out "$OUTPUT_DIR/ipad-76x76-2x.png"
sips -z 167 167 "$SOURCE_ICON" --out "$OUTPUT_DIR/ipad-83.5x83.5-2x.png"

echo "✅ All icon sizes generated successfully!"
echo "📝 Now open Xcode and verify the icons in Images.xcassets/AppIcon"
echo ""
echo "Next steps:"
echo "1. Open Xcode: open ./ios/Serveaso.xcworkspace"
echo "2. Select Images.xcassets in the left sidebar"
echo "3. Click on AppIcon"
echo "4. Verify all icon slots are filled with the new icon"
echo "5. Clean build: Product → Clean Build Folder (Cmd+Shift+K)"
echo "6. Archive: Product → Archive"
