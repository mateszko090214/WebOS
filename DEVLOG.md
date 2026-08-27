VoidOS Retro - Changelog
[v2.5.0] - Phosphor Edition
Added
Type	Description
Advanced Live Wallpaper System	Procedural generation (starfield, matrix rain, plasma waves) with YouTube video backgrounds and intelligent fallback
Comprehensive Boot Sequence	Detailed systemd-like boot logs showing service initialization, persistence layer status detection
Enhanced Visual Effects	Authentic CRT curvature simulation, dynamic scanline intensity, chromatic aberration, bloom/glow, phosphor persistence
Degauss Command	Terminal command that temporarily warps display with recovery animation
Retro Inspector DevTool	Real-time toggling of individual CRT effects with performance impact overlay
6 Built-in Phosphor Themes	Green (classic terminal), Blue, Pink, Purple, White, and custom colors
Vintage Wallpaper Collection	4 authentic wallpapers: IBM green terminal, Apple II monitor, VT100 amber, RGB composite artifact
ThemeEngine Improvements	Accepts spectral power distributions for accurate phosphor emulation
True Terminal Color Support	CGA/EGA/VGA palettes with customizable intensity
System Sound Regeneration	Web Audio API emulation of SN76489 and AY-3-8910 chips
Enhanced Boot Animation	POST beeps + memory count + BIOS splash simulation
Realistic Shutdown Sequence	Power-down surge with fading glow animation
Accessibility Improvements	Cursor blink rate respecting system settings, terminal bell filtered through CRT speaker
Enhanced
Type	Description
Live Wallpaper System	Now supports video modes alongside procedural ones with automatic fallback
Boot Process Realism	Simulated system initialization with detailed service logging
Theme Switching	Dynamic theme persistence via IndexedDB
Terminal Utilities	Additional commands and improved history
Desktop Styling	Border radius, deep box shadow, enhanced titlebar with pulsing indicators
Window Management	Persistence option for ghost images when dragging, snap-to-edges functionality
Filesystem	Virtual FileSystem with persistence via browser storage (falls back to session-only)
Application Suite	Pre-loaded apps including Terminal, Files, Text Editor, Calculator, Music Player, Notes, Gallery, Store, Weather, Timer, Kanban, Spotlight, Window Switcher
Easter Eggs System	Konami code (confetti burst), Matrix rain terminal command, Rainbow mode (brand click)
Performance Optimizations	Rendering loop improvements, pure CSS solutions for effects under 2ms frame cost
Settings App	Comprehensive customization with live wallpaper selector, theme picker, and system controls
Fixed
Type	Description
Theme Color Bleed	Purple theme had incorrect green channel bleed (was mixing blue+red instead of proper magenta)
UI Layering	Wallpaper slideshow paused when opening settings menu (z-index conflict resolved)
Terminal Audio	Terminal bell sound was too sharp—now filtered through CRT speaker simulation
Accessibility	Cursor blink rate now respects system accessibility settings
Theme Transition Race	Fixed condition where desktop icons would momentarily snap to grid on theme change
Persistence Reliability	Improved persistence layer reliability for cross-session data retention
CRT Flicker	Fixed occasional flicker in CRT effects during rapid theme changes
[v0.96] - Text Editor Enhancement Update
Added
Type	Description
Find and Replace Functionality	Ctrl+F for find, Ctrl+H for replace with options for single/all occurrences and case-sensitive search
Go To Line Navigation	Ctrl+G to jump to specific line numbers with input validation
Enhanced Syntax Highlighting	Added support for JSON and Python languages, improved existing language definitions
Current Line Highlighting	Visual indicator of cursor line with subtle highlighting
Improved Keyboard Shortcuts	Integrated find/replace/go-to-line with standard text editor shortcuts
Enhanced
Type	Description
Text Editor Application	Overall usability and functionality approaching modern code editor standards
Developer Experience	Enhanced built-in tools for webOS system development and customization
[v0.95] - Professional Documentation Update
Added
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
