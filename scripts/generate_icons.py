#!/usr/bin/env python3
import math
from PIL import Image, ImageDraw

def render_woven_v(size, bg_color=None, squircle=False, corner_radius=0):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    if bg_color:
        if squircle and corner_radius > 0:
            draw.rounded_rectangle([0, 0, size, size], radius=corner_radius, fill=bg_color)
        else:
            draw.rectangle([0, 0, size, size], fill=bg_color)
            
    # Base scale 48x48 icon
    # Centered in size x size
    # Icon bounds in 48x48:
    # V: (13, 13.5) -> (24, 35) -> (35, 13.5)
    # Thread: (8.5, 22) -> (28.2, 22), (33.4, 22) -> (39.5, 22)
    # Stroke: V = 4.2, Thread = 3.0
    scale = (size * 0.6) / 48.0
    ox = (size - 48.0 * scale) / 2.0
    oy = (size - 48.0 * scale) / 2.0
    
    def pt(x, y):
        return (ox + x * scale, oy + y * scale)

    v_pts = [pt(13.0, 13.5), pt(24.0, 35.0), pt(35.0, 13.5)]
    v_width = max(2, int(round(4.2 * scale)))
    
    thread_pts_1 = [pt(8.5, 22.0), pt(28.2, 22.0)]
    thread_pts_2 = [pt(33.4, 22.0), pt(39.5, 22.0)]
    thread_width = max(2, int(round(3.0 * scale)))
    
    # Draw White Warp V
    draw.line(v_pts, fill="#FFFFFF", width=v_width, joint="round")
    
    # Draw endpoints round caps for V
    r_v = v_width / 2.0
    for p in v_pts:
        draw.ellipse([p[0]-r_v, p[1]-r_v, p[0]+r_v, p[1]+r_v], fill="#FFFFFF")
        
    # Draw Violet Weft Thread
    draw.line(thread_pts_1, fill="#5B3DF5", width=thread_width)
    draw.line(thread_pts_2, fill="#5B3DF5", width=thread_width)
    
    r_t = thread_width / 2.0
    for p in [thread_pts_1[0], thread_pts_1[1], thread_pts_2[0], thread_pts_2[1]]:
        draw.ellipse([p[0]-r_t, p[1]-r_t, p[0]+r_t, p[1]+r_t], fill="#5B3DF5")
        
    return img

def main():
    # 1. assets/icon-background.png (1024x1024 solid #0E0E12)
    bg = Image.new("RGBA", (1024, 1024), "#0E0E12")
    bg.save("assets/icon-background.png", "PNG")
    print("Saved assets/icon-background.png")
    
    # 2. assets/icon-foreground.png (1024x1024 transparent with woven V)
    fg = render_woven_v(1024, bg_color=None)
    fg.save("assets/icon-foreground.png", "PNG")
    print("Saved assets/icon-foreground.png")
    
    # 3. assets/icon-only.png (1024x1024 with Graphite squircle)
    icon_only = render_woven_v(1024, bg_color="#0E0E12", squircle=True, corner_radius=280)
    icon_only.save("assets/icon-only.png", "PNG")
    print("Saved assets/icon-only.png")
    
    # 4. www/icons/icon-192.png
    i192 = render_woven_v(192, bg_color="#0E0E12", squircle=True, corner_radius=54)
    i192.save("www/icons/icon-192.png", "PNG")
    print("Saved www/icons/icon-192.png")
    
    # 5. www/icons/icon-512.png
    i512 = render_woven_v(512, bg_color="#0E0E12", squircle=True, corner_radius=144)
    i512.save("www/icons/icon-512.png", "PNG")
    print("Saved www/icons/icon-512.png")
    
    # 6. www/icons/maskable-512.png (full background, slightly inset logo for safe zone)
    imask = render_woven_v(512, bg_color="#0E0E12")
    imask.save("www/icons/maskable-512.png", "PNG")
    print("Saved www/icons/maskable-512.png")
    
    # 7. assets/splash.png & splash-dark.png (1284x2778 or similar splash centered logo)
    splash = Image.new("RGBA", (1284, 2778), "#0E0E12")
    logo_splash = render_woven_v(360, bg_color="#1C1B24", squircle=True, corner_radius=100)
    splash.paste(logo_splash, ((1284 - 360) // 2, (2778 - 360) // 2 - 120), logo_splash)
    splash.save("assets/splash.png", "PNG")
    splash.save("assets/splash-dark.png", "PNG")
    print("Saved splash.png and splash-dark.png")

if __name__ == "__main__":
    main()
