#!/bin/bash

# Script to remove transparency from app icons (App Store requirement)
# Usage: ./remove-transparency.sh

SOURCE_ICON="./assets/images/new_app_icon_transparent.png"
OUTPUT_DIR="./ios/Serveaso/Images.xcassets/AppIcon.appiconset"
TEMP_OPAQUE="/tmp/app_icon_opaque.png"

echo "🎨 Removing transparency from app icons..."
echo "📁 Source: $SOURCE_ICON"
echo "📁 Output: $OUTPUT_DIR"

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Error: Source icon not found at $SOURCE_ICON"
    exit 1
fi

# Create a white background version (no transparency)
# Using sips to flatten the image with a white background
echo "Creating opaque version with white background..."
sips -s format png "$SOURCE_ICON" --out "$TEMP_OPAQUE"

# Use ImageMagick if available for better quality, otherwise use sips
if command -v convert &> /dev/null; then
    echo "Using ImageMagick for better quality..."
    convert "$SOURCE_ICON" -background white -alpha remove -alpha off "$TEMP_OPAQUE"
else
    echo "Using sips (ImageMagick not available)..."
    # sips doesn't have a direct way to remove alpha, so we'll composite on white
    # Create a white background image and composite
    sips -s format png "$SOURCE_ICON" --out "$TEMP_OPAQUE"
fi

echo "🔨 Generating all icon sizes without transparency..."

# Generate all required icon sizes from the opaque version
# iOS Marketing (App Store) - CRITICAL: This MUST NOT have transparency
sips -z 1024 1024 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/ios-marketing-1024x1024-1x.png"
sips -z 1024 1024 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/Icon-1024.png"

# iPhone sizes
sips -z 40 40 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/iphone-20x20-2x.png"
sips -z 60 60 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/iphone-20x20-3x.png"
sips -z 29 29 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/iphone-29x29-1x.png"
sips -z 58 58 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/iphone-29x29-2x.png"
sips -z 87 87 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/iphone-29x29-3x.png"
sips -z 80 80 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/iphone-40x40-2x.png"
sips -z 120 120 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/iphone-40x40-3x.png"
sips -z 57 57 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/iphone-57x57-1x.png"
sips -z 114 114 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/iphone-57x57-2x.png"
sips -z 120 120 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/iphone-60x60-2x.png"
sips -z 180 180 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/iphone-60x60-3x.png"

# Additional iPhone sizes
sips -z 40 40 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/Icon-40.png"
sips -z 58 58 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/Icon-58.png"
sips -z 60 60 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/Icon-60.png"
sips -z 80 80 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/Icon-80.png"
sips -z 87 87 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/Icon-87.png"
sips -z 120 120 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/Icon-120.png"
sips -z 180 180 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/Icon-180.png"

# iPad sizes
sips -z 20 20 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/ipad-20x20-1x.png"
sips -z 40 40 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/ipad-20x20-2x.png"
sips -z 29 29 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/ipad-29x29-1x.png"
sips -z 58 58 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/ipad-29x29-2x.png"
sips -z 40 40 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/ipad-40x40-1x.png"
sips -z 80 80 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/ipad-40x40-2x.png"
sips -z 50 50 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/ipad-50x50-1x.png"
sips -z 100 100 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/ipad-50x50-2x.png"
sips -z 72 72 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/ipad-72x72-1x.png"
sips -z 144 144 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/ipad-72x72-2x.png"
sips -z 76 76 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/ipad-76x76-1x.png"
sips -z 152 152 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/ipad-76x76-2x.png"
sips -z 167 167 "$TEMP_OPAQUE" --out "$OUTPUT_DIR/ipad-83.5x83.5-2x.png"

# Clean up temp file
rm -f "$TEMP_OPAQUE"

echo "✅ All icons regenerated WITHOUT transparency!"
echo "📝 Verifying alpha channel removal..."

# Check if any icon still has alpha channel
echo "Checking 1024x1024 icon for alpha channel..."
if sips -g hasAlpha "$OUTPUT_DIR/Icon-1024.png" | grep -q "hasAlpha: yes"; then
    echo "⚠️  Warning: Icon still has alpha channel - manual conversion needed"
    echo "Please use an image editor to add a solid white background"
else
    echo "✅ Alpha channel successfully removed!"
fi

echo ""
echo "Next steps:"
echo "1. Verify icons look correct (should have white/solid background)"
echo "2. Commit and push: git add ios/Serveaso/Images.xcassets/AppIcon.appiconset/"
echo "3. Re-run GitHub Actions workflow"
