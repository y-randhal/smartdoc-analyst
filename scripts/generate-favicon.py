#!/usr/bin/env python3
"""
Generate favicon.ico from SVG design
Creates a simple 16x16 and 32x32 ICO file
"""
try:
    from PIL import Image, ImageDraw
    import os
    import sys

    # Create 32x32 image
    size = 32
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Document background (emerald green)
    doc_x, doc_y = 8, 6
    doc_w, doc_h = 16, 20
    draw.rounded_rectangle(
        [doc_x, doc_y, doc_x + doc_w, doc_y + doc_h],
        radius=1,
        fill=(16, 185, 129, 230)  # #10b981 with opacity
    )

    # Document lines (white)
    line_y_positions = [12, 16, 20]
    for y in line_y_positions:
        draw.line([12, y, 20 if y < 20 else 18, y], fill=(255, 255, 255, 255), width=2)

    # AI sparkles (small circles)
    sparkles = [
        (22, 8, 2, (251, 191, 36)),   # yellow
        (10, 10, 1, (96, 165, 250)),  # blue
        (24, 22, 1, (167, 139, 250)) # purple
    ]
    for x, y, r, color in sparkles:
        draw.ellipse([x-r, y-r, x+r, y+r], fill=color)

    # Save as ICO with multiple sizes
    ico_path = os.path.join(os.path.dirname(__file__), '..', 'apps', 'frontend', 'src', 'favicon.ico')
    
    # Create 16x16 version
    img16 = img.resize((16, 16), Image.Resampling.LANCZOS)
    
    # Save as ICO (supports multiple sizes)
    img.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32)])
    
    print(f"Generated favicon.ico at {ico_path}")
    sys.exit(0)

except ImportError:
    print("PIL/Pillow not available. Creating minimal ICO file...")
    # Fallback: create minimal valid ICO file
    import os
    import sys
    import struct
    
    ico_path = os.path.join(os.path.dirname(__file__), '..', 'apps', 'frontend', 'src', 'favicon.ico')
    
    # Minimal ICO file structure (16x16, 1-bit)
    # ICO header
    ico_data = bytearray([
        0x00, 0x00,  # Reserved (must be 0)
        0x01, 0x00,  # Type (1 = ICO)
        0x01, 0x00,  # Number of images
    ])
    
    # Image directory entry (16x16, 1-bit, 40 bytes)
    ico_data.extend([
        0x10,        # Width (16)
        0x10,        # Height (16)
        0x00,        # Color palette (0 = no palette)
        0x00,        # Reserved
        0x01, 0x00,  # Color planes
        0x01, 0x00,  # Bits per pixel
        0x40, 0x00, 0x00, 0x00,  # Image data size (64 bytes)
        0x16, 0x00, 0x00, 0x00,  # Offset to image data (22 bytes)
    ])
    
    # BMP header (40 bytes)
    bmp_header = bytearray([
        0x28, 0x00, 0x00, 0x00,  # Header size (40)
        0x10, 0x00, 0x00, 0x00,  # Width (16)
        0x20, 0x00, 0x00, 0x00,  # Height (32, double for ICO)
        0x01, 0x00,              # Planes
        0x01, 0x00,              # Bits per pixel
        0x00, 0x00, 0x00, 0x00,  # Compression
        0x40, 0x00, 0x00, 0x00,  # Image size
        0x00, 0x00, 0x00, 0x00,  # X pixels per meter
        0x00, 0x00, 0x00, 0x00,  # Y pixels per meter
        0x00, 0x00, 0x00, 0x00,  # Colors used
        0x00, 0x00, 0x00, 0x00,  # Important colors
    ])
    
    # Simple 16x16 bitmap (green square)
    bitmap_data = bytearray(64)  # 16x16 / 8 = 32 bytes for bitmap + 32 for mask
    # Set some pixels to create a simple pattern
    for i in range(4, 12):
        bitmap_data[i] = 0xFF  # Some pattern
    
    ico_data.extend(bmp_header)
    ico_data.extend(bitmap_data)
    
    with open(ico_path, 'wb') as f:
        f.write(ico_data)
    
    print(f"Generated minimal favicon.ico at {ico_path}")
    sys.exit(0)

except Exception as e:
    print(f"Error generating favicon: {e}")
    sys.exit(1)
