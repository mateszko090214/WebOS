# VoidOS Retro - Changelog

## [v2.7.0] - Hyprland, Gadgets & Sound Update

### Added
| Feature | Description |
|---------|-------------|
| **Hyprland Mode Overhaul** | Real frosted-glass window blur (not just low opacity) and an animated conic-gradient rainbow border on the focused window — the two things that actually read as "Hyprland" |
| **System Sounds** | Synthesized retro-chip blips for window open/close and achievement unlocks, plus a denial buzz for a wrong PIN. New Settings > System sounds toggle |
| **Power-On Gate** | A "click or press any key to power on" screen before boot — also supplies the user gesture browsers require before any audio can play, so the boot POST-beep (new, two-tone, synthesized) isn't silently blocked |
| **Redesigned Boot Sequence** | A BIOS-style hardware-check phase, a terminal-window frame (titlebar + traffic lights), a circular "READY" progress ring, and a live OS/Kernel/Theme/Engine side panel, ending in a "System ready" line with a blinking cursor |
| **Redesigned Login Screen** | Restyled as an "access terminal" — a typed boot-style status log plays before the sign-in form fades in, echoing the boot sequence instead of looking like a bolted-on modern form. Fully skippable via click or keypress |
| **8-Direction Window Resize** | All four edges and four corners are now resizable, not just the bottom-right corner |
| **Draggable Desktop Gadgets** | The Clock, System, and Signal widgets can be dragged anywhere on the desktop instead of being pinned to a fixed sidebar column; position persists across reloads |
| **Sticky Note Gadget** | A new draggable, editable desktop note; its text and position both persist |
| **Touch & Pen Support** | Window drag and resize now run on Pointer Events instead of mouse-only events, so they work with touch and pen input too |
| **Keyboard Accessibility** | Dock icons, desktop icons, and every Settings toggle are now Tab-focusable and Enter/Space-activatable, with a visible focus outline |
| **Music Player: Shuffle & Repeat** | New shuffle (with a proper play-history stack for accurate Prev) and repeat-current-track controls |
| **Music Player: Redesigned Import** | A proper drag-and-drop drop-zone for importing local tracks, replacing the old plain button |
| **Dock Magnification** | macOS-style icon scale/lift based on cursor proximity along the dock |
| **Genie Window-Open Animation** | Windows now burst open from the dock or desktop icon that was actually clicked, instead of always popping in at their own center |
| **Export / Import Backup** | Settings > Backup your data downloads every app's data (notes, files, kanban, mail, calendar, achievements, and more) as one JSON file, with a matching Import to restore it |
| **PWA Support** | Installable, with offline support via a network-first service worker — always serves the latest version when online, only falls back to the cache when there's genuinely no network |
| **Favicon & Meta Tags** | A proper browser-tab icon, meta description, and Open Graph/Twitter card tags for link previews |
| **Richer Neofetch** | Host, Kernel, Resolution, current Theme, and live CPU/Memory readings, plus a color palette swatch row |

### Changed
| Feature | Description |
|---------|-------------|
| **Window Drag/Resize** | Rebuilt on Pointer Events throughout (was mouse-only) |
| **Global UI Pass** | Buttons, cards, scrollbars, and toggles across every app now share consistent hover/transition treatment, instead of only a few having any hover feedback at all |
| **Weather App** | Condition icon, and high/low stats alongside the current temperature |
| **Calendar App** | Rebuilt from inline styles to proper CSS classes — clean grid, highlighted today/selected days, polished event cards, Enter-to-add |
| **Version Display** | Was inconsistently showing "2.5" in most places despite the app being on 2.6 — now consistent everywhere |

### Fixed
| Feature | Description |
|---------|-------------|
| **"Forget Saved Data" Did Nothing** | It called an API (`window.storage`) that was never defined anywhere in the app — the click silently failed every time behind a fake success message. Now properly clears every persisted key and the IndexedDB stores |
| **Gallery Ignored Requested Image** | Opening a specific photo from Files or Spotlight just showed the generic grid instead of that photo |
| **"Distro Hopper" Achievement Unreachable** | The unlock condition checked for an empty list, but the tracker ships pre-seeded with 3 entries, so a new user's first real entry never unlocked it |
| **Default Wallpaper Was Broken** | Pointed at image files that didn't exist, so the desktop background rendered blank by default |
| **Music/Wallpaper Auto-Detection Failed Under `file://`** | Double-clicking `index.html` instead of running a server made every detection method silently fail (the Fetch API doesn't work under `file://` at all) |
| **Music Playback Was Completely Silent Under `file://`** | Web Audio treats local files as CORS-restricted and zeroes their output the moment they're routed through an analyser — no error, just silence, even though the track appeared to be playing |
| **README Had Unresolved Merge-Conflict Markers** | Along with a duplicate title and stale links pointing at a different repository |
| **Missing Fallback Manifests** | `music/tracks.txt`, `music/README.txt`, and `wallpapers/wallpapers.txt` were documented but never actually created |

---

## [v2.6.0] - Wallpaper & Music Update

### Added
| Feature | Description |
|---------|-------------|
| **Photo Wallpapers** | Two bundled real-image wallpapers alongside the existing procedural/video live wallpapers |
| **Parallax Wallpaper Drift** | Photo wallpapers now shift gently opposite the cursor and ease back with inertia, for a sense of depth |
| **Upload Your Own Wallpaper** | New **+** control in Settings > Wallpaper — pick any image from your device and it's added to the picker and applied immediately, no code editing needed |
| **Labeled Wallpaper Thumbnails** | Every wallpaper swatch (built-in and custom) now shows a readable caption underneath, instead of an unlabeled color/photo chip |
| **Bundled Music Folder** | New `music/` folder — drop `.mp3`/`.m4a`/`.ogg`/`.wav` files in and they're preloaded into the Music Player playlist automatically |
| **GitHub Pages Auto-Detection** | When hosted on GitHub Pages, the Music Player reads the `music/` folder straight from the public GitHub API — no manifest file needed at all |
| **Directory-Listing Detection** | For local dev servers or hosts that expose folder listings (e.g. `python3 -m http.server`), tracks are found automatically the same way |
| **`tracks.txt` Fallback** | For any other static host without a listing, a plain-text `music/tracks.txt` (one filename per line, no code/JSON syntax) lists the bundled tracks |

### Changed
| Feature | Description |
|---------|-------------|
| **Project Restructured Into Multiple Files** | Split from a single monolithic HTML file into `index.html` (markup), `style.css` (styles), and `script.js` (logic), matching a conventional static-site layout |
| **Default Wallpaper** | Desktop now defaults to a bundled photo wallpaper instead of a procedural gradient |

### Fixed
| Feature | Description |
|---------|-------------|
| **Live Wallpaper Hiding Photo Wallpapers** | The animated live-wallpaper canvas (e.g. Starfield) painted an opaque layer over the whole desktop every frame, completely hiding any photo wallpaper underneath. Selecting a photo wallpaper now automatically switches the live wallpaper off. |

---

## [v2.5.0] - Phosphor Edition

### Added
| Feature | Description |
|---------|-------------|
| **Advanced Live Wallpaper System** | Procedural generation (starfield, matrix rain, plasma waves) with YouTube video backgrounds and intelligent fallback |
| **Comprehensive Boot Sequence** | Detailed systemd-like boot logs showing service initialization, persistence layer status detection |
| **Enhanced Visual Effects** | Authentic CRT curvature simulation, dynamic scanline intensity, chromatic aberration, bloom/glow, phosphor persistence |
| **Degauss Command** | Terminal command that temporarily warps display with recovery animation |
| **Retro Inspector DevTool** | Real-time toggling of individual CRT effects with performance impact overlay |
| **6 Built-in Phosphor Themes** | Green (classic terminal), Blue, Pink, Purple, White, and custom colors |
| **Vintage Wallpaper Collection** | 4 authentic wallpapers: IBM green terminal, Apple II monitor, VT100 amber, RGB composite artifact |
| **ThemeEngine Improvements** | Accepts spectral power distributions for accurate phosphor emulation |
| **True Terminal Color Support** | CGA/EGA/VGA palettes with customizable intensity |
| **System Sound Regeneration** | Web Audio API emulation of SN76489 and AY-3-8910 chips |
| **Enhanced Boot Animation** | POST beeps + memory count + BIOS splash simulation |
| **Realistic Shutdown Sequence** | Power-down surge with fading glow animation |
| **Accessibility Improvements** | Cursor blink rate respecting system settings, terminal bell filtered through CRT speaker |

### Enhanced
| Feature | Description |
|---------|-------------|
| **Live Wallpaper System** | Now supports video modes alongside procedural ones with automatic fallback |
| **Boot Process Realism** | Simulated system initialization with detailed service logging |
| **Theme Switching** | Dynamic theme persistence via IndexedDB |
| **Terminal Utilities** | Additional commands and improved history |
| **Desktop Styling** | Border radius, deep box shadow, enhanced titlebar with pulsing indicators |
| **Window Management** | Persistence option for ghost images when dragging, snap-to-edges functionality |
| **Filesystem** | Virtual FileSystem with persistence via browser storage (falls back to session-only) |
| **Application Suite** | Pre-loaded apps including Terminal, Files, Text Editor, Calculator, Music Player, Notes, Gallery, Store, Weather, Timer, Kanban, Spotlight, Window Switcher |
| **Easter Eggs System** | Konami code (confetti burst), Matrix rain terminal command, Rainbow mode (brand click) |
| **Performance Optimizations** | Rendering loop improvements, pure CSS solutions for effects under 2ms frame cost |
| **Settings App** | Comprehensive customization with live wallpaper selector, theme picker, and system controls |

### Fixed
| Feature | Description |
|---------|-------------|
| **Theme Color Bleed** | Purple theme had incorrect green channel bleed (was mixing blue+red instead of proper magenta) |
| **UI Layering** | Wallpaper slideshow paused when opening settings menu (z-index conflict resolved) |
| **Terminal Audio** | Terminal bell sound was too sharp—now filtered through CRT speaker simulation |
| **Accessibility** | Cursor blink rate now respects system accessibility settings |
| **Theme Transition Race** | Fixed condition where desktop icons would momentarily snap to grid on theme change |
| **Persistence Reliability** | Improved persistence layer reliability for cross-session data retention |
| **CRT Flicker** | Fixed occasional flicker in CRT effects during rapid theme changes |

---

## [v0.96] - Text Editor Enhancement Update

### Added
| Feature | Description |
|---------|-------------|
| **Find and Replace Functionality** | Ctrl+F for find, Ctrl+H for replace with options for single/all occurrences and case-sensitive search |
| **Go To Line Navigation** | Ctrl+G to jump to specific line numbers with input validation |
| **Enhanced Syntax Highlighting** | Added support for JSON and Python languages, improved existing language definitions |
| **Current Line Highlighting** | Visual indicator of cursor line with subtle highlighting |
| **Improved Keyboard Shortcuts** | Integrated find/replace/go-to-line with standard text editor shortcuts |

### Enhanced
| Feature | Description |
|---------|-------------|
| **Text Editor Application** | Overall usability and functionality approaching modern code editor standards |
| **Developer Experience** | Enhanced built-in tools for webOS system development and customization |

---

## [v0.95] - Professional Documentation Update

### Added
- Updated `README.md` and `DEVLOG.md` to have a more professional presentation with tables and structured information
- Enhanced documentation clarity and readability

---

## [v0.94] - Video Backgrounds & Boot Enhancements

### Added
| Feature | Description |
|---------|-------------|
| **Video Background Live Wallpaper Options** | YouTube embeds with fallback to procedural starfield |
| **Enhanced Boot Sequence** | Detailed systemd-like boot logs (Journal Service, udev, etc.) |
| **Persistence Layer Status Detection** | Shown in boot logs |

### Enhanced
| Feature | Description |
|---------|-------------|
| **Live Wallpaper System** | Support for video modes alongside procedural ones |
| **Boot Process Realism** | Simulated system initialization |
| **Background Video Fallback** | Falls back to starfield if embed fails to load |

---

## [v0.93] - Live Wallpaper & Polish Update

### Added
| Feature | Description |
|---------|-------------|
| **Custom Hand-Drawn Cursor Sprite** | For authentic retro feel |
| **Enhanced Desktop Styling** | Border radius and deep box shadow |
| **Procedural Live Wallpaper System** | Starfield, matrix rain, plasma waves |
| **Enhanced Titlebar** | Pulsing indicators and uppercase text |
| **Improved Scrollbar Styling** | Throughout all applications |
| **Retro Beveled Button Styling** | For windows and menus |
| **Live Wallpaper Toggle** | In Settings > Display |
| **Achievements App** | Added to the Store, tracks unlocked easter eggs |

### Enhanced
| Feature | Description |
|---------|-------------|
| **Terminal Utilities** | Additional commands and better history |
| **Files App** | Drag-and-drop functionality between folders |
| **Settings App** | Live wallpaper selector |
| **Achievement System** | Integration with toast notifications |
| **Performance Optimizations** | To rendering loops |

### Fixed
- Minor alignment issues in titlebar elements
- Improved persistence layer reliability
- Fixed occasional flicker in CRT effects during rapid theme changes

---

## [v0.92] - Major Retro-Theming Update

### Added
| Feature | Description |
|---------|-------------|
| **Authentic CRT Curvature Simulation** | Using CSS transforms + filters, not canvas |
| **Dynamic Scanline Intensity** | Responds to brightness like real phosphor decay |
| **4 Vintage Wallpapers** | IBM green terminal, Apple II monitor, VT100 amber, and RGB composite artifact |
| **True CGA/EGA/VGA Color Palettes** | With customizable intensity |
| **Rewritten Boot Sequence** | Mimics POST beeps + memory count + BIOS splash |
| **Shutdown Animation** | Realistic power-down surge and fading glow |
| **Regenerated System Sounds** | Web Audio API emulation of SN76489 and AY-3-8910 chips |
| **"Degauss" Command** | Temporarily warps the display, with recovery animation |

### Favorite Feature: Retro Inspector DevTool
| Feature | Description |
|---------|-------------|
| **Real-Time CRT Toggling** | Scanlines, curvature, bloom, phosphor bloom, chromatic shift |
| **Performance Impact Overlay** | Shows frame cost |
| **Pure CSS Solution** | Keeps effects under 2ms frame cost even on integrated graphics |

### Architecture Tweaks
| Component | Change |
|-----------|--------|
| **ThemeEngine** | Now accepts spectral power distributions for accurate phosphor emulation |
| **Audio.js** | Added noise generators for tape hiss and RF interference |
| **WindowManager** | Gained a "persistence" option that leaves ghost images when dragging (like long-persistence phosphor) |
| **FS.js** | Now stores theme preferences per-user in IndexedDB with encrypted backup |

### Fixed
- Purple theme had incorrect green channel bleed (was mixing blue+red instead of proper magenta)
- Wallpaper slideshow paused when opening settings menu (z-index conflict)
- Terminal bell sound was too sharp — now filtered through CRT speaker simulation
- Cursor blink rate wasn't respecting system accessibility settings
- Fixed a race condition where desktop icons would momentarily snap to grid on theme change

---

## Notes

No live demo is deployed for this fork yet — clone the repo and open `index.html` locally to try it.
