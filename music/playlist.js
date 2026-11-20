// ============================================================================
// قائمة الموسيقى المخصصة (حصرياً لصاحب الموقع — مخفية تماماً عن تحكم الزوار)
// يمكنك إضافة مقطوعاتك بأي صيغة مرنة أو الدمج بينها بحرية في نفس القائمة:
//
// 1) الخيار الأول — ملف صوتي محلي (.mp3, .m4a, .wav, .ogg) داخل مجلد music/:
//    { title: "اسم المقطوعة", file: "my-song.mp3", duration: "3:45" }
//
// 2) الخيار الثاني — رابط يوتيوب (يعمل بالخفاء كصوت فقط عبر youtube / url / file / src أو رابط نصي مباشر):
//    { title: "اسم المقطوعة", youtube: "https://www.youtube.com/watch?v=VIDEO_ID", duration: "4:10" }
//    يدعم الطابع الزمني (&t=1073s / startSeconds) والمعرّفات الاحتياطية التلقائية (fallbackYoutubeIds).
//
// ملاحظة لتجربة روابط يوتيوب على جهازك قبل رفع الموقع:
// - يوتيوب يحجب التضمين عند فتح الملف مباشرة عبر file:// بدون خادم؛ لذا لتجربة يوتيوب محلياً
//   انقر مرتين على تشغيل-الموقع.command (ماك) أو run-site.bat (ويندوز) لفتح http://localhost:8765.
// - للتحديث التلقائي السريع لملفات mp3 أو music/youtube.txt: انقر مرتين على music/تحديث-الموسيقى.command أو music/update-music.bat.
// ============================================================================
window.CUSTOM_MUSIC_PLAYLIST = [
  {
    title: "akira yamaoka · pianissimo epilogue",
    duration: "1:37",
    youtube: "https://www.youtube.com/watch?v=dkZfID8J84A&list=RDdkZfID8J84A&start_radio=1",
    youtubeId: "dkZfID8J84A",
    fallbackYoutubeIds: ["eHUMipQnvww", "KmTXZ95yRbg"]
  },
  {
    title: "röyksopp · eple",
    duration: "3:37",
    youtube: "https://www.youtube.com/watch?v=sFP7jVIxE2c&list=RDsFP7jVIxE2c&start_radio=1",
    youtubeId: "sFP7jVIxE2c",
    fallbackYoutubeIds: ["KEQSMjP-M4g"]
  },
  {
    title: "if life was a video game, this would be the menu music",
    duration: "1:00:01",
    youtube: "https://www.youtube.com/watch?v=cScPVRLM-50&list=RDcScPVRLM-50&start_radio=1&t=1073s",
    youtubeId: "cScPVRLM-50",
    startSeconds: 1073
  },
  {
    title: "jens buchert · indiaka",
    duration: "4:46",
    youtube: "https://www.youtube.com/watch?v=zAyoDg9J1Ow&list=RDGMEMYH9CUrFO7CfLJpaD7UR85w&start_radio=1&rv=yklKIPb38PE",
    youtubeId: "zAyoDg9J1Ow",
    fallbackYoutubeIds: ["6NaMyk1O2mg"]
  },
  {
    title: "enigma · beyond the invisible",
    duration: "4:37",
    youtube: "https://www.youtube.com/watch?v=f8mMWh62XpU&list=RDf8mMWh62XpU&start_radio=1",
    youtubeId: "f8mMWh62XpU",
    fallbackYoutubeIds: ["RAjnhRcsIkA", "4fl8D5_9Boo", "jaWucnbgr9o", "C3InSkDr-ZQ"]
  }
];
