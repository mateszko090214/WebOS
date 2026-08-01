# Devlog

This is a side project of the Retro OS. Download the Retro OS from my GitHub: https://github.com/mateszko090214/WebOS.git

**RetroWebOS**  
Just pushed a major retro-theming update that dials the nostalgia to 11. This isn’t just a skin change—it’s a full immersion retrofit.

## What’s new in the Retro Edition:
- Authentic CRT curvature simulation (using CSS transforms + filters, not canvas)
- Scanline intensity now dynamically responds to brightness (like real phosphor decay)
- Added 4 vintage wallpapers: IBM green terminal, Apple II monitor, VT100 amber, and RGB composite artifact
- Terminal now supports true CGA/EGA/VGA color palettes with customizable intensity
- Boot sequence rewritten to mimic POST beeps + memory count + BIOS splash
- Shutdown animation includes realistic power-down surge and fading glow
- System sounds regenerated using Web Audio API to emulate SN76489 and AY-3-8910 chips
- Added “degauss” command to Terminal that temporarily warps the display (with recovery animation)

### Favorite feature: The new “Retro Inspector” DevTool
It lets you toggle individual CRT effects (scanlines, curvature, bloom, phosphor bloom, chromatic shift) in real-time while seeing the performance impact overlay. Pure CSS solutions mean these effects stay under 2ms frame cost even on integrated graphics.

### The architecture tweaks:
- ThemeEngine now accepts spectral power distributions for accurate phosphor emulation
- Audio.js added noise generators for tape hiss and RF interference
- WindowManager gained “persistence” option that leaves ghost images when dragging (like long-persistence phosphor)
- FS.js now stores theme preferences per-user in IndexedDB with encrypted backup

## What I fixed:
- Purple theme had incorrect green channel bleed (was mixing blue+red instead of proper magenta)
- Wallpaper slideshow paused when opening settings menu (z-index conflict)
- Terminal bell sound was too sharp—now filtered through CRT speaker simulation
- Cursor blink rate wasn’t respecting system accessibility settings
- Fixed a race condition where desktop icons would momentarily snap to grid on theme change

## v0.91 roadmap (Retro polish):
- Add “TV mode” with overscan, color bleed, and RF noise

**Special note:** This is a side project of the Retro OS. Download the retro OS you find on my GitHub. And you can try my side project Void OS here: https://web-void-os.netlify.app