#!/usr/bin/env python3
"""
Remove transparency from app icons (App Store requirement).
App Store icons cannot have transparency or alpha channels.
"""

import os
import sys
from PIL import Image

SOURCE_ICON = "./assets/images/new_app_icon_transparent.png"
OUTPUT_DIR = "./ios/Serveaso/Images.xcassets/AppIcon.appiconset"

# Icon sizes to generate
ICON_SIZES = {
    # iOS Marketing
    "ios-marketing-1024x1024-1x.png": 1024,
    "Icon-1024.png": 1024,
    
    # iPhone
    "iphone-20x20-2x.png": 40,
    "iphone-20x20-3x.png": 60,
    "iphone-29x29-1x.png": 29,
    "iphone-29x29-2x.png": 58,
    "iphone-29x29-3x.png": 87,
    "iphone-40x40-2x.png": 80,
    "iphone-40x40-3x.png": 120,
    "iphone-57x57-1x.png": 57,
    "iphone-57x57-2x.png": 114,
    "iphone-60x60-2x.png": 120,
    "iphone-60x60-3x.png": 180,
    "Icon-40.png": 40,
    "Icon-58.png": 58,
    "Icon-60.png": 60,
    "Icon-80.png": 80,
    "Icon-87.png": 87,
    "Icon-120.png": 120,
    "Icon-180.png": 180,
    
    # iPad
    "ipad-20x20-1x.png": 20,
    "ipad-20x20-2x.png": 40,
    "ipad-29x29-1x.png": 29,
    "ipad-29x29-2x.png": 58,
    "ipad-40x40-1x.png": 40,
    "ipad-40x40-2x.png": 80,
    "ipad-50x50-1x.png": 50,
    "ipad-50x50-2x.png": 100,
    "ipad-72x72-1x.png": 72,
    "ipad-72x72-2x.png": 144,
    "ipad-76x76-1x.png": 76,
    "ipad-76x76-2x.png": 152,
    "ipad-83.5x83.5-2x.png": 167,
}

def remove_transparency(img, bg_color=(255, 255, 255)):
    """
    Remove transparency from image by compositing on solid background.
    
    Args:
        img: PIL Image object
        bg_color: RGB tuple for background color (default: white)
    
    Returns:
        PIL Image without alpha channel
    """
    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Create white background
    background = Image.new('RGB', img.size, bg_color)
    
    # Composite image onto background
    background.paste(img, mask=img.split()[3])  # Use alpha channel as mask
    
    return background

def main():
    print("🎨 Removing transparency from app icons...")
    print(f"📁 Source: {SOURCE_ICON}")
    print(f"📁 Output: {OUTPUT_DIR}\n")
    
    # Check if source exists
    if not os.path.exists(SOURCE_ICON):
        print(f"❌ Error: Source icon not found at {SOURCE_ICON}")
        sys.exit(1)
    
    # Load source image
    try:
        source_img = Image.open(SOURCE_ICON)
        print(f"✓ Loaded source image: {source_img.size[0]}x{source_img.size[1]}, mode={source_img.mode}")
        
        # Remove transparency from source
        if source_img.mode == 'RGBA':
            print("  Removing alpha channel...")
            source_img_opaque = remove_transparency(source_img)
            print(f"  ✓ Alpha removed, new mode={source_img_opaque.mode}")
        else:
            print("  (No alpha channel detected)")
            source_img_opaque = source_img.convert('RGB')
            
    except Exception as e:
        print(f"❌ Error loading source image: {e}")
        sys.exit(1)
    
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Generate all icon sizes
    print("\n🔨 Generating icon sizes...")
    for filename, size in ICON_SIZES.items():
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        try:
            # Resize with high-quality resampling
            resized = source_img_opaque.resize((size, size), Image.Resampling.LANCZOS)
            
            # Save as RGB PNG (no alpha)
            resized.save(output_path, 'PNG', optimize=True)
            
            # Verify no alpha channel
            check_img = Image.open(output_path)
            has_alpha = check_img.mode in ('RGBA', 'LA', 'PA')
            
            if has_alpha:
                print(f"  ⚠️  {filename} ({size}x{size}) - WARNING: still has alpha!")
            else:
                print(f"  ✓ {filename} ({size}x{size})")
                
        except Exception as e:
            print(f"  ❌ {filename} - Error: {e}")
    
    print("\n✅ All icons generated WITHOUT transparency!")
    print("\nNext steps:")
    print("1. Verify icons look correct")
    print("2. git add ios/Serveaso/Images.xcassets/AppIcon.appiconset/")
    print("3. git commit -m 'Remove transparency from app icons'")
    print("4. git push origin main")
    print("5. Re-run GitHub Actions workflow")

if __name__ == "__main__":
    main()
