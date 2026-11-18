#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
PORT=8765
echo "=========================================================="
echo "  تشغيل الموقع محلياً (يدعم مشغل يوتيوب + MP3 بالكامل)"
echo "  Local Server running at: http://localhost:${PORT}"
echo "  Press Ctrl+C to stop / اضغط Ctrl+C للإيقاف"
echo "=========================================================="
(sleep 0.6 && open "http://localhost:${PORT}" >/dev/null 2>&1 || xdg-open "http://localhost:${PORT}" >/dev/null 2>&1 || true) &
if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "${PORT}"
elif command -v python >/dev/null 2>&1; then
  exec python -m http.server "${PORT}"
else
  echo "Python is required to run the local HTTP server."
  exit 1
fi
