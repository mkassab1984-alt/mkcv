Mamdouh Kassab Ismail — Owner Music Configuration (`music/` & `tree/music/`)
============================================================================

The music capsule is 100% owner-controlled (zero visitor upload buttons, zero
URL inputs, zero external link icons, zero preloaded tracks, and zero Web Audio
synthesized sounds).

3 Owner Ways to Add Songs (MP3 + Hidden YouTube Audio, Freely Mixable):
-----------------------------------------------------------------------
1. Edit `music/playlist.js` (`window.CUSTOM_MUSIC_PLAYLIST`):
   - Local Audio (`.mp3`, `.m4a`, `.wav`, `.ogg` inside `music/`):
     `{ title: "اسم المقطوعة", file: "my-song.mp3", duration: "3:45" }`
   - Hidden YouTube Audio (supports `youtube`, `url`, `link`, `file`, `src`, or a bare string URL — `watch?v=`, `youtu.be/`, `music.youtube.com/`, `m.youtube.com/`, `shorts/`, `embed/`, or 11-char ID; auto-fetches title via `noembed.com` if `title` is omitted):
     `{ title: "اسم المقطوعة", youtube: "https://www.youtube.com/watch?v=VIDEO_ID", duration: "4:10" }`

   Local YouTube Testing Tip:
   YouTube blocks `file://` embeds without an HTTP Referer. To test YouTube tracks locally
   before deploying to a web host, double-click `تشغيل-الموقع.command` (macOS) or
   `run-site.bat` (Windows) in the root folder to open `http://localhost:8765`.

2. One-click auto-generator (`تحديث-الموسيقى.command` on Mac / `update-music.bat` on Windows):
   - Drop `.mp3`/`.m4a`/`.wav`/`.ogg` files into `music/`
   - Optionally list YouTube tracks in `music/youtube.txt` (`اسم المقطوعة | https://www.youtube.com/watch?v=VIDEO_ID` or bare URL)
   - Double-click the updater script to regenerate `music/playlist.js` automatically!

3. Zero-script auto-discovery:
   - Name local files `1.mp3`..`10.mp3` or `track-1.mp3`..`track-10.mp3` inside `music/` (or `tree/music/`).
