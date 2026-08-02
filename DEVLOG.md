# VoidOS Retro - Changelog

## [v0.92] - Major Retro-Theming Update
### Added
- Authentic CRT curvature simulation (using CSS transforms + filters, not canvas)
- Scanline intensity that dynamically responds to brightness (like real phosphor decay)
- 4 vintage wallpapers: IBM green terminal, Apple II monitor, VT100 amber, and RGB composite artifact
- Terminal support for true CGA/EGA/VGA color palettes with customizable intensity
- Boot sequence rewritten to mimic POST beeps + memory count + BIOS splash
- Shutdown animation with realistic power-down surge and fading glow
- System sounds regenerated using Web Audio API to emulate SN76489 and AY-3-8910 chips
- "Degauss" command to Terminal that temporarily warps the display (with recovery animation)

### Favorite Feature: Retro Inspector DevTool
- Toggle individual CRT effects (scanlines, curvature, bloom, phosphor bloom, chromatic shift) in real-time
- Performance impact overlay showing frame cost
- Pure CSS solution keeps effects under 2ms frame cost even on integrated graphics

### Architecture Tweaks
- ThemeEngine now accepts spectral power distributions for accurate phosphor emulation
- Audio.js added noise generators for tape hiss and RF interference
- WindowManager gained "persistence" option that leaves ghost images when dragging (like long-persistence phosphor)
- FS.js now stores theme preferences per-user in IndexedDB with encrypted backup

### Fixed
- Purple theme had incorrect green channel bleed (was mixing blue+red instead of proper magenta)
- Wallpaper slideshow paused when opening settings menu (z-index conflict)
- Terminal bell sound was too sharp—now filtered through CRT speaker simulation
- Cursor blink rate wasn't respecting system accessibility settings
- Fixed a race condition where desktop icons would momentarily snap to grid on theme change

## Notes
- This is a side project of the Retro OS. Download the Retro OS from: https://github.com/mateszko090214/WebOS.git
- You can try VoidOS Retro live at: https://web-void-os.netlify.app
