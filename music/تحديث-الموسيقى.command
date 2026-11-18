#!/usr/bin/env bash
set -e
cd "$(dirname "$0")" || exit 1

shopt -s nullglob nocaseglob

ENTRIES=()
SEEN=()

is_seen() {
  local needle="$1"
  local item
  for item in ${SEEN[@]+"${SEEN[@]}"}; do
    if [[ "$item" == "$needle" ]]; then
      return 0
    fi
  done
  return 1
}

esc_js() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  printf '%s' "$s"
}

trim_str() {
  local s="$1"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

# 1. Scan local audio files (.mp3, .m4a, .wav, .ogg) in music/ and ../tree/music/
for f in ./*.mp3 ./*.m4a ./*.wav ./*.ogg; do
  base="$(basename "$f")"
  lower="$(printf '%s' "$base" | tr '[:upper:]' '[:lower:]')"
  if ! is_seen "file:$lower"; then
    SEEN+=("file:$lower")
    title="${base%.*}"
    ENTRIES+=("  { title: \"$(esc_js "$title")\", file: \"$(esc_js "$base")\" }")
  fi
done

if [[ -d "../tree/music" ]]; then
  for f in ../tree/music/*.mp3 ../tree/music/*.m4a ../tree/music/*.wav ../tree/music/*.ogg; do
    base="$(basename "$f")"
    lower="$(printf '%s' "$base" | tr '[:upper:]' '[:lower:]')"
    if ! is_seen "file:$lower"; then
      SEEN+=("file:$lower")
      title="${base%.*}"
      ENTRIES+=("  { title: \"$(esc_js "$title")\", file: \"$(esc_js "$base")\" }")
    fi
  done
fi

# 2. Scan optional youtube.txt (format: اسم المقطوعة | https://www.youtube.com/watch?v=... or bare URL, ignoring # comments)
for ytfile in "./youtube.txt" "../tree/music/youtube.txt"; do
  if [[ -f "$ytfile" ]]; then
    while IFS= read -r rawline || [[ -n "$rawline" ]]; do
      line="${rawline%$'\r'}"
      line="$(trim_str "$line")"
      if [[ -z "$line" || "$line" == \#* ]]; then
        continue
      fi
      yt_title=""
      yt_url=""
      yt_dur=""
      if [[ "$line" == *"|"* ]]; then
        yt_title="$(trim_str "${line%%|*}")"
        rest="${line#*|}"
        if [[ "$rest" == *"|"* ]]; then
          yt_url="$(trim_str "${rest%%|*}")"
          yt_dur="$(trim_str "${rest#*|}")"
        else
          yt_url="$(trim_str "$rest")"
        fi
      else
        yt_url="$line"
      fi
      if [[ -z "$yt_url" ]]; then
        continue
      fi
      if ! is_seen "yt:$yt_url"; then
        SEEN+=("yt:$yt_url")
        if [[ -n "$yt_title" && -n "$yt_dur" ]]; then
          ENTRIES+=("  { title: \"$(esc_js "$yt_title")\", youtube: \"$(esc_js "$yt_url")\", duration: \"$(esc_js "$yt_dur")\" }")
        elif [[ -n "$yt_title" ]]; then
          ENTRIES+=("  { title: \"$(esc_js "$yt_title")\", youtube: \"$(esc_js "$yt_url")\" }")
        elif [[ -n "$yt_dur" ]]; then
          ENTRIES+=("  { youtube: \"$(esc_js "$yt_url")\", duration: \"$(esc_js "$yt_dur")\" }")
        else
          ENTRIES+=("  { youtube: \"$(esc_js "$yt_url")\" }")
        fi
      fi
    done < "$ytfile"
  fi
done

COUNT="${#ENTRIES[@]}"

{
  printf '// ============================================================================\n'
  printf '// قائمة الموسيقى المخصصة — تم التحديث تلقائياً (%d مقطوعة)\n' "$COUNT"
  printf '// لإعادة التحديث بعد إضافة ملفات صوتية أو تعديل youtube.txt: انقر مرتين على تحديث-الموسيقى.command\n'
  printf '// ============================================================================\n'
  printf 'window.CUSTOM_MUSIC_PLAYLIST = [\n'
  if [[ "$COUNT" -eq 0 ]]; then
    printf '  // الخيار 1 (ملف صوتي محلي): { title: "اسم المقطوعة", file: "my-song.mp3", duration: "3:45" },\n'
    printf '  // الخيار 2 (رابط يوتيوب):  { title: "اسم المقطوعة", youtube: "https://www.youtube.com/watch?v=VIDEO_ID", duration: "4:10" }\n'
  else
    idx=0
    for entry in "${ENTRIES[@]}"; do
      idx=$((idx + 1))
      if [[ "$idx" -lt "$COUNT" ]]; then
        printf '%s,\n' "$entry"
      else
        printf '%s\n' "$entry"
      fi
    done
  fi
  printf '];\n'
} > "./playlist.js"

echo "✓ تم تحديث music/playlist.js بنجاح (${COUNT} مقطوعة)."
echo "✓ Updated music/playlist.js (${COUNT} track(s)). For local YouTube testing, open ../تشغيل-الموقع.command!"
