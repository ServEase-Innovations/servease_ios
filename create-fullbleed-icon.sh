#!/bin/bash

# Script to create a full-bleed app icon without white corner frames
# Uses assets/images/iconlogo.png and extends the #22A5FD blue background to all edges

set -e

SOURCE_ICON="./assets/images/iconlogo.png"
OUTPUT_ICON="./assets/images/app_icon_fullbleed.png"

echo "🎨 Creating full-bleed ServEaso app icon (removing white corners)"
echo "📁 Source: $SOURCE_ICON"
echo "📁 Output: $OUTPUT_ICON"

if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Error: Source icon not found at $SOURCE_ICON"
    exit 1
fi

magick -size 1254x1254 xc:"#22A5FD" \
    \( "$SOURCE_ICON" -gravity center -crop 1040x1040+0+0 +repage \) \
    -gravity center \
    -composite \
    -resize 1024x1024 \
    -alpha off \
    -strip \
    -quality 100 \
    "$OUTPUT_ICON"

echo "✅ Full-bleed icon created successfully at $OUTPUT_ICON"
