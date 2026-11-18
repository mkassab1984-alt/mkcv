@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8765
echo ==========================================================
echo   Local Server running at: http://localhost:%PORT%
echo   Supports YouTube + MP3 playback locally
echo   Close this window or press Ctrl+C to stop.
echo ==========================================================
start "" "http://localhost:%PORT%"
where python3 >nul 2>nul
if %errorlevel%==0 (
  python3 -m http.server %PORT%
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server %PORT%
  goto :eof
)
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server %PORT%
  goto :eof
)
echo Python is not installed. Please install Python 3 or host the folder on any web server.
pause
