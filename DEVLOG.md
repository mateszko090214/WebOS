VoidOS Retro - Changelog
[v0.95] 
Type	Description
Updated README.md and DEVLOG.md	to have a more professional presentation with tables and structured information
Enhanced documentation	clarity and readability
[v0.94] - Video Backgrounds & Boot Enhancements
Added
Type	Description
Video background live wallpaper options	(YouTube embeds) with fallback to procedural starfield
Enhanced boot sequence	with detailed systemd-like boot logs (Journal Service, udev, etc.)
Persistence layer status detection	shown in boot logs
Enhanced
Type	Description
Live wallpaper system	to support video modes alongside procedural ones
Boot process realism	with simulated system initialization
Background video fallback	to starfield if embed fails to load
[v0.93] - Live Wallpaper & Polish Update
Added
Type	Description
Custom hand-drawn cursor sprite	for authentic retro feel
Enhanced desktop styling	with border radius and deep box shadow
Procedural live wallpaper system	(starfield, matrix rain, plasma waves)
Enhanced titlebar	with pulsing indicators and uppercase text
Improved scrollbar styling	throughout all applications
Retro beveled button styling	for windows and menus
Live wallpaper toggle	in Settings > Display
Added Achievements app	to the Store (tracks unlocked easter eggs)
Enhanced
Type	Description
Terminal utilities	with additional commands and better history
Files app drag-and-drop functionality	between folders
Settings app	with live wallpaper selector
Achievement system integration	with toast notifications
Performance optimizations	to rendering loops
Fixed
Type	Description
Minor alignment issues	in titlebar elements
Improved persistence layer	reliability
Fixed occasional flicker	in CRT effects during rapid theme changes
[v0.92] - Major Retro-Theming Update
Added
Type	Description
Authentic CRT curvature simulation	(using CSS transforms + filters, not canvas)
Scanline intensity	that dynamically responds to brightness (like real phosphor decay)
4 vintage wallpapers	IBM green terminal, Apple II monitor, VT100 amber, and RGB composite artifact
Terminal support	for true CGA/EGA/VGA color palettes with customizable intensity
Boot sequence rewritten	to mimic POST beeps + memory count + BIOS splash
Shutdown animation	with realistic power-down surge and fading glow
System sounds regenerated	using Web Audio API to emulate SN76489 and AY-3-8910 chips
"Degauss" command	to Terminal that temporarily warps the display (with recovery animation)
Favorite Feature: Retro Inspector DevTool
Type	Description
Toggle individual CRT effects	(scanlines, curvature, bloom, phosphor bloom, chromatic shift) in real-time
Performance impact overlay	showing frame cost
Pure CSS solution	keeps effects under 2ms frame cost even on integrated graphics
Architecture Tweaks
Type	Description
ThemeEngine	now accepts spectral power distributions for accurate phosphor emulation
Audio.js	added noise generators for tape hiss and RF interference
WindowManager	gained "persistence" option that leaves ghost images when dragging (like long-persistence phosphor)
FS.js	now stores theme preferences per-user in IndexedDB with encrypted backup
Fixed
Type	Description
Purple theme	had incorrect green channel bleed (was mixing blue+red instead of proper magenta)
Wallpaper slideshow	paused when opening settings menu (z-index conflict)
Terminal bell sound	was too sharp—now filtered through CRT speaker simulation
Cursor blink rate	wasn't respecting system accessibility settings
Fixed a race condition	where desktop icons would momentarily snap to grid on theme change
Notes
You can try VoidOS Retro live at: https://web-void-os.netlify.app
