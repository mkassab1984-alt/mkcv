(function () {
  "use strict";

  const canvas = document.getElementById("sheet");
  const ctx = canvas.getContext("2d");

  const btnBack = document.getElementById("btn-back");
  const btnLang = document.getElementById("btn-lang");
  const musicNoteWrap = document.getElementById("music-note-wrap");
  const musicNoteText = document.getElementById("music-note-text");
  const musicPlaylist = document.getElementById("music-playlist");
  const playlistLabel = document.getElementById("playlist-label");
  const playlistMode = document.getElementById("playlist-mode");
  const playlistList = document.getElementById("playlist-list");
  const musicPill = document.getElementById("music-pill");
  const btnPlay = document.getElementById("btn-play");
  const trackTitleBtn = document.getElementById("track-title");
  const btnExpandPlaylist = document.getElementById("btn-expand-playlist");
  const btnExternalYt = document.getElementById("btn-external-yt");
  const btnNextTrack = document.getElementById("btn-next-track");
  const toastEl = document.getElementById("toast");
  const filmGrainEl = document.getElementById("film-grain");
  const playlistYtHintEl = document.getElementById("playlist-yt-hint");

  // =========================================================================
  // WORLD-SPACE CONSTANTS & ARCHIVAL MOONLIT SLATE-CHARCOAL PALETTE (ZERO pure-white)
  // =========================================================================
  const SKY_LIFT = "#23272F";
  const SKY_CORE = "#1C1F26";
  const SKY_EDGE = "#161920";
  const EARTH_CORE = "#13161C";
  const EARTH_DEEP = "#0E1015";

  // Warm archival silver-bone chalk inks (strictly zero pure pure-white)
  const CHALK = "#C8CBD2";
  const CHALK_TREE = "#C8CBD2";
  const CHALK_BRIGHT = "#DFE2E8";
  const CHALK_MUTED = "#9499A6";
  const SHADOW_INK = "#0D1016";
  const PILL_BG = "#C3C6CD";
  const RIVER_BOULDER = "#B8BCC6";

  const TREE_W = 640;
  const TREE_H = 600;
  const TREE_BASE_PAD = 8;
  const TREE_BUF_H = TREE_H + TREE_BASE_PAD;

  const ROOTS_W = 540;
  const ROOTS_H = 240;
  const ROOTS_TOP_WY = -6;

  const TERRACE_W = 540;
  const TERRACE_H = 58;
  const TERRACE_TOP_WY = -42;

  const MOSS_W = 156;
  const MOSS_H = 72;
  const BUF_SCALE = 2.0;

  const WORLD_HORIZON_SPAN = 3200;
  const UNDERGROUND_DEPTH = 2600;
  const TWIG_SHOOT_LEN = 58;

  const BRANCH_KEYS = ["work", "experience", "writing", "me"];
  const ITEM_COL_WIDTH = 288;
  const DETAIL_COL_WIDTH = 316;

  // Arching leafy experience bough geometry (~650px span, ~60 deg crown base -> ~16 deg slender tip)
  const EXP_BOUGH_GEOM = {
    x0: 146,
    y0: -432,
    cx1: 274,
    cy1: -654,
    cx2: 476,
    cy2: -763,
    x3: 668,
    y3: -818
  };

  const EXP_PUFF_SPECS = [
    { t: 0.08, rx: 48, ry: 36, d: 260, nOff: -3, fg: false },
    { t: 0.18, rx: 44, ry: 33, d: 235, nOff: -4, fg: true },
    { t: 0.29, rx: 40, ry: 30, d: 210, nOff: -3, fg: false },
    { t: 0.41, rx: 36, ry: 27, d: 185, nOff: -4, fg: true },
    { t: 0.54, rx: 31, ry: 24, d: 160, nOff: -3, fg: false },
    { t: 0.68, rx: 22, ry: 18, d: 120, nOff: 5, fg: true },
    { t: 0.80, rx: 18, ry: 15, d: 98, nOff: -9, fg: true },
    { t: 0.89, rx: 16, ry: 14, d: 86, nOff: -8, fg: true }
  ];

  let lang = "en";
  let activeBranch = null;
  let closingBranch = null;
  let activeItem = null;
  let activeExpYear = null;
  let closingExpYear = null;
  let expYearShootRaw = 0;
  let expYearShootGrow = 0;
  const expandedItems = new Set();
  const closingItems = new Set();

  // Gentle wind-sway impulse on the olive tree crown when a retracting branch merges home
  let crownRustleImpulse = 0;
  let crownRustlePhase = 0;

  // Entrance & choreographed branch / discrete typewriter state [0..1]
  let firstFrameMs = null;
  let introElapsed = 0;
  let introTreeProgress = 0;
  let treeGrow = 0;
  let rootsGrow = 0;
  let introGrow = 0;
  let identityType = 0;
  let identityErasing = false;
  let introCamRem = 1;
  let hasOpenedAnyBranch = false;

  let expBoughRaw = 0;
  let expBoughGrow = 0;
  let expBoughRetracting = false;
  let meProjectsHeadingType = 0;
  let meProjectsHeadingErasing = false;
  let meProjectFilter = "all";

  const mainTwigGrow = { work: 0, experience: 0, writing: 0, me: 0 };
  const mainLabelType = { work: 0, experience: 0, writing: 0, me: 0 };
  const mainLabelErasing = { work: false, experience: false, writing: false, me: false };
  const underlineProg = { work: 0, experience: 0, writing: 0, me: 0 };
  const branchRaw = { work: 0, experience: 0, writing: 0, me: 0 };
  const branchRetracting = { work: false, experience: false, writing: false, me: false };
  const branchLimbGrow = { work: 0, experience: 0, writing: 0, me: 0 };
  const branchGrow = branchLimbGrow;

  const subTwigRaw = {};
  const subTwigGrow = {};
  const itemType = {};
  const itemErasing = {};
  const siblingSumFactor = {};
  const itemRaw = {};
  const lvl2ShootGrow = {};
  const itemGrow = lvl2ShootGrow;
  const lvl2Type = {};
  const lvl2Erasing = {};
  const hoverAmt = {};

  // Stippled Risograph Chalk Text Patterns (128x128 seamless CanvasPattern tiles)
  let chalkPatternPrimary = null;
  let chalkPatternActive = null;
  let chalkPatternMuted = null;
  const chalkPatternTiles = { primary: null, active: null, muted: null };
  let frameChalkPatternCalls = 0;
  let totalChalkPatternCalls = 0;

  // 10 Dual-Buffer (256x198) 45-deg Halftone + Full-Color Taped Zine Project Cards
  const projectPhotoCards = {};
  const projectHalftoneCards = projectPhotoCards;
  const projectPhotoHover = {};
  const projectPhotoLift = {};
  const projectPhotoLoadState = {};
  let lastMeProjectPhotoBoxes = [];

  // Viewport & Choreographed Spring Camera
  let vw = window.innerWidth;
  let vh = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  const cam = { x: 0, y: -300, zoom: 1 };
  const baseCam = { x: 0, y: -300, zoom: 1 };
  const targetCam = { x: 0, y: -300, zoom: 1 };
  const defaultTargetCam = { x: 0, y: -300, zoom: 1 };
  const panOffset = { x: 0, y: 0 };

  // Procedural offscreen assets, growth-order stipple buffers & world props
  let treeBuffer = null;
  let treeAnimBuffer = null;
  let treeAnimCtx = null;
  let treeAnimImgData = null;
  let treeFinalRGBA = null;
  let treeGrowAt = null;
  let treeGrowBuckets = null;
  let lastAnimBucket = -1;
  let treeGrainStats = null;

  let grainTileCanvas = null;
  let grainPattern = null;
  let pillStippleDataUri = "";
  let filmGrainAppliedToDom = false;
  let lithoNoiseTables = null;

  // Frame-level layout & visual verification telemetry
  let lastUnderlineLogs = [];
  let lastStarGlintLogs = [];
  let lastBranchLabelScreenBoxes = [];
  let lastHeaderScreenBox = null;
  let lastBioScreenBox = null;
  let lastPortraitScreenBox = null;
  let lastExpYearScreenBoxes = [];
  let lastExpLeafPuffCircles = [];
  let lastExpTextLineBoxes = [];
  let lastMeProjectsScreenBoxes = [];
  let lastBioHighlightLogs = [];
  let lastMeFilterScreenBoxes = [];
  let lastMeProjectSubBoxes = [];
  let lastMeProjectActionBoxes = [];
  let lastTriggeredAction = null;
  let frameStrokeTextCalls = 0;
  let frameFillTextCalls = 0;
  let totalStrokeTextCalls = 0;
  let totalFillTextCalls = 0;

  let rootsBuffer = null;
  let tuftBuffer = null;
  let mistyCloudBuffer = null;
  let mossBuffer = null;
  let terraceBuffer = null;
  let expLeafPuffBuffers = [];

  let stars = [];
  const starMouse = { x: 0, y: 0 };
  const starMouseTarget = { x: 0, y: 0 };
  const starCursorScreen = { x: -9999, y: -9999, active: false };
  let lastRenderedStars = [];
  let meBioType = 0;
  let meBioErasing = false;
  let mePortraitBuffer = null;
  let mePortraitColorBuffer = null;
  let portraitBounds = null;
  let isPortraitHovered = false;
  let portraitTouchToggled = false;
  let portraitHoverMix = 0;
  const lastPointerScreen = { x: -9999, y: -9999, active: false };
  let meadowBlades = [];
  let meadowFlowers = [];
  let distantStones = [];
  let mossPlacements = [];
  let soilPebbles = [];
  let buriedSeeds = [];
  let undergroundBoulders = [];
  let undergroundDotTrails = [];

  // World-space interactive hitboxes rebuilt each frame
  let worldHitboxes = [];
  let hoveredHit = null;

  let lastFrameMs = performance.now();
  let rafId = 0;

  const FONT_EN =
    '"IBM Plex Sans", "IBM Plex Sans Arabic", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const FONT_AR =
    '"IBM Plex Sans Arabic", "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, sans-serif';
  let FONT_SANS = FONT_EN;
  const ARABIC_CHAR_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const PUNCT_PAUSE_RE = /[.,—،؛:!؟]/;

  function hasArabicChars(text) {
    return Boolean(text && ARABIC_CHAR_RE.test(text));
  }

  function syncCanvasFontVars() {
    FONT_SANS = lang === "ar" ? FONT_AR : FONT_EN;
  }

  function resetCanvasLetterSpacing() {
    if ("letterSpacing" in ctx) {
      ctx.letterSpacing = "0px";
    }
  }

  function fontFamilyFor(text) {
    if (lang === "ar" || hasArabicChars(text)) {
      resetCanvasLetterSpacing();
      return FONT_AR;
    }
    return FONT_EN;
  }

  function canvasFont(weightAndSize, text) {
    if (lang === "ar" || hasArabicChars(text)) {
      resetCanvasLetterSpacing();
      return `${weightAndSize} ${FONT_AR}`;
    }
    return `${weightAndSize} ${FONT_EN}`;
  }

  function parseFontSizePx(fontStr) {
    if (!fontStr) return 14;
    const m = String(fontStr).match(/(\d+(?:\.\d+)?)px/);
    return m ? parseFloat(m[1]) : 14;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function easeOutCubic(t) {
    const u = 1 - clamp(t, 0, 1);
    return 1 - u * u * u;
  }

  function easeInOutCubic(t) {
    const x = clamp(t, 0, 1);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function easeOrganicBranch(t) {
    const x = clamp(t, 0, 1);
    return 0.42 * easeOutCubic(x) + 0.58 * easeInOutCubic(x);
  }

  function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  // Deterministic 2D blue-noise-spectrum interleaved gradient noise in [0, 1)
  function blueNoise2D(x, y) {
    const magicX = 0.06711056 * x + 0.00583715 * y;
    const f1 = magicX - Math.floor(magicX);
    const v = 52.9829189 * f1;
    return v - Math.floor(v);
  }

  function groundWaveY(wx) {
    const wave =
      Math.sin(wx * 0.0082) * 3.1 +
      Math.cos(wx * 0.021 + 1.15) * 1.55 +
      Math.sin(wx * 0.047 + 2.4) * 0.65;
    const trunkFlatten = smoothstep(68, 225, Math.abs(wx));
    return 2.4 + wave * trunkFlatten;
  }

  function triggerCrownRustle(strength) {
    crownRustleImpulse = Math.max(crownRustleImpulse, clamp(strength || 1.0, 0, 1.5));
  }

  function computeCanopySway(wy, timeSec) {
    if (wy >= -220) return 0;
    const rise = smoothstep(220, 540, -wy);
    const phaseY = (-wy - 220) / 340;
    const ambient = Math.sin(timeSec * 0.82 + phaseY * 3.6) * rise * 2.2;
    const rustle =
      crownRustleImpulse > 0.002
        ? Math.sin(crownRustlePhase * 5.6 - phaseY * 2.2) * crownRustleImpulse * 4.5 * rise
        : 0;
    return ambient + rustle;
  }

  function getLocale() {
    return window.SITE_DATA[lang] || window.SITE_DATA.en;
  }

  function isRTL() {
    return getLocale().dir === "rtl";
  }

  function safeCharTake(text, rawTake) {
    let take = clamp(Math.floor(rawTake), 0, text.length);
    if (take > 0 && take < text.length) {
      const code = text.charCodeAt(take - 1);
      if (code >= 0xd800 && code <= 0xdbff) take++;
    }
    return take;
  }

  // =========================================================================
  // PRE-BAKED 128x128 SEAMLESS STIPPLED CHALK PATTERNS & LETTERPRESS TEXT
  // Preserves 100% connected Arabic cursive shaping by passing whole line slices!
  // =========================================================================
  function buildStippledChalkPatternTile(baseRGB, poreRGB1, poreRGB2, grainRGB, seed) {
    if (typeof document === "undefined") return { tile: null, pattern: null, poreCount: 0, grainCount: 0 };
    const SIZE = 128;
    const tile = document.createElement("canvas");
    tile.width = SIZE;
    tile.height = SIZE;
    const tg = tile.getContext("2d");
    let poreCount = 0;
    let grainCount = 0;

    if (tg) {
      tg.fillStyle = `rgb(${baseRGB[0]}, ${baseRGB[1]}, ${baseRGB[2]})`;
      tg.fillRect(0, 0, SIZE, SIZE);

      let img = null;
      try {
        if (typeof tg.createImageData === "function") {
          img = tg.createImageData(SIZE, SIZE);
        } else if (typeof tg.getImageData === "function") {
          img = tg.getImageData(0, 0, SIZE, SIZE);
        }
      } catch (_) {}

      const prng = mulberry32(seed);
      if (img && img.data && img.data.length === SIZE * SIZE * 4) {
        const px = img.data;
        for (let y = 0; y < SIZE; y++) {
          for (let x = 0; x < SIZE; x++) {
            const idx = (y * SIZE + x) * 4;
            const bn = blueNoise2D((x + seed) & 127, (y + (seed >> 3)) & 127);
            const score = (bn + prng() * 0.27) % 1.0;
            let r = baseRGB[0];
            let g = baseRGB[1];
            let b = baseRGB[2];
            if (score < 0.20) {
              const useDeep = prng() < 0.46;
              const pCol = useDeep ? poreRGB2 : poreRGB1;
              r = pCol[0];
              g = pCol[1];
              b = pCol[2];
              poreCount++;
            } else if (score > 0.86) {
              r = grainRGB[0];
              g = grainRGB[1];
              b = grainRGB[2];
              grainCount++;
            } else {
              const jit = Math.round((prng() - 0.5) * 5);
              r = clamp(r + jit, 0, 236);
              g = clamp(g + jit, 0, 239);
              b = clamp(b + jit, 0, 244);
            }
            px[idx] = r;
            px[idx + 1] = g;
            px[idx + 2] = b;
            px[idx + 3] = 255;
          }
        }
        try {
          tg.putImageData(img, 0, 0);
        } catch (_) {}
      } else {
        // Fallback procedural 1px stipple rects when ImageData is unavailable
        for (let y = 0; y < SIZE; y++) {
          for (let x = 0; x < SIZE; x++) {
            const score = (blueNoise2D(x, y) + prng() * 0.27) % 1.0;
            if (score < 0.20) {
              const pCol = prng() < 0.46 ? poreRGB2 : poreRGB1;
              tg.fillStyle = `rgb(${pCol[0]}, ${pCol[1]}, ${pCol[2]})`;
              tg.fillRect(x, y, 1, 1);
              poreCount++;
            } else if (score > 0.86) {
              tg.fillStyle = `rgb(${grainRGB[0]}, ${grainRGB[1]}, ${grainRGB[2]})`;
              tg.fillRect(x, y, 1, 1);
              grainCount++;
            }
          }
        }
      }
    }

    let pat = null;
    if (ctx && typeof ctx.createPattern === "function") {
      try {
        pat = ctx.createPattern(tile, "repeat");
      } catch (_) {}
    }
    return { tile, pattern: pat, poreCount, grainCount };
  }

  function initChalkTextPatterns() {
    const prim = buildStippledChalkPatternTile(
      [200, 203, 210], // #C8CBD2 primary chalk
      [159, 164, 176], // #9FA4B0 ink pore
      [133, 138, 150], // #858A96 deep pore
      [215, 218, 226], // #D7DAE2 chalk grain (zero pure-white)
      62091411
    );
    const act = buildStippledChalkPatternTile(
      [223, 226, 232], // #DFE2E8 hover/active glow
      [172, 177, 189], // #ACB1BD ink pore
      [150, 155, 168], // #969BA8 deep pore
      [233, 236, 242], // #E9ECF2 chalk highlight (strictly < pure-white)
      62091422
    );
    const mut = buildStippledChalkPatternTile(
      [148, 153, 166], // #9499A6 muted metadata
      [118, 123, 136], // #767B88 ink pore
      [102, 107, 120], // #666B78 deep pore
      [172, 177, 190], // #ACB1BE chalk grain
      62091433
    );

    chalkPatternPrimary = prim.pattern;
    chalkPatternActive = act.pattern;
    chalkPatternMuted = mut.pattern;
    chalkPatternTiles.primary = prim;
    chalkPatternTiles.active = act;
    chalkPatternTiles.muted = mut;
  }

  function resolveChalkFillStyle(fillColor) {
    if (!fillColor) {
      if (chalkPatternPrimary) {
        frameChalkPatternCalls++;
        totalChalkPatternCalls++;
        return chalkPatternPrimary;
      }
      return CHALK;
    }
    if (typeof fillColor !== "string") return fillColor;
    const norm = fillColor.trim().toUpperCase();
    if (norm === "#C8CBD2" || norm === "#C6CAD2" || norm === "#C4C8D2") {
      if (chalkPatternPrimary) {
        frameChalkPatternCalls++;
        totalChalkPatternCalls++;
        return chalkPatternPrimary;
      }
      return CHALK;
    }
    if (norm === "#DFE2E8" || norm === "#DCE0E8") {
      if (chalkPatternActive) {
        frameChalkPatternCalls++;
        totalChalkPatternCalls++;
        return chalkPatternActive;
      }
      return CHALK_BRIGHT;
    }
    if (norm === "#9499A6" || norm === "#9AA2B2") {
      if (chalkPatternMuted) {
        frameChalkPatternCalls++;
        totalChalkPatternCalls++;
        return chalkPatternMuted;
      }
      return CHALK_MUTED;
    }
    return fillColor;
  }

  function drawChalkText(str, x, y, fillColor, fontSizePx, alphaMul) {
    if (!str) return "";
    const fs = Number.isFinite(fontSizePx) && fontSizePx > 0 ? fontSizePx : parseFontSizePx(ctx.font);
    ctx.save();
    if (alphaMul !== undefined && alphaMul < 0.999) {
      ctx.globalAlpha *= clamp(alphaMul, 0, 1);
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.miterLimit = 2;
    ctx.lineWidth = Math.max(1.25, fs * 0.09);
    ctx.strokeStyle = "rgba(9, 11, 16, 0.84)";
    ctx.shadowColor = "rgba(6, 8, 12, 0.88)";
    ctx.shadowBlur = 0.9;
    ctx.shadowOffsetX = 0.85;
    ctx.shadowOffsetY = 1.25;
    ctx.strokeText(str, x, y);

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = resolveChalkFillStyle(fillColor);
    ctx.fillText(str, x, y);
    ctx.restore();

    frameStrokeTextCalls++;
    frameFillTextCalls++;
    totalStrokeTextCalls++;
    totalFillTextCalls++;
    return str;
  }

  // Crisp discrete character stepping with 60ms micro-pause on '.', ',', '—', '،' when typing forward,
  // and uniform crisp backwards erase when closing/switching branches (ZERO blurry gradient ramp!)
  function computeDiscreteCharCount(text, progress, isErasing, pauseUnits) {
    if (!text) return 0;
    const p = clamp(progress, 0, 1);
    if (p <= 0) return 0;
    if (p >= 0.999) return text.length;
    if (isErasing) {
      return safeCharTake(text, Math.ceil(text.length * p));
    }
    const pw = pauseUnits === undefined ? 3.0 : pauseUnits;
    let totalW = 0;
    for (let i = 0; i < text.length; i++) {
      totalW += 1 + (PUNCT_PAUSE_RE.test(text[i]) ? pw : 0);
    }
    const budget = totalW * p;
    let acc = 0;
    let count = 0;
    for (let i = 0; i < text.length; i++) {
      if (acc >= budget) break;
      count = i + 1;
      acc += 1 + (PUNCT_PAUSE_RE.test(text[i]) ? pw : 0);
    }
    return safeCharTake(text, Math.max(1, count));
  }

  function sliceTypewriter(text, typeProgress, isErasing) {
    if (!text) return "";
    const count = computeDiscreteCharCount(text, typeProgress, Boolean(isErasing), 2.2);
    if (count <= 0) return "";
    return text.slice(0, count);
  }

  function drawDiscreteTextLine(fullText, progress, isErasing, x, y, fillColor, fontSizePx, alphaMul, pauseUnits) {
    if (!fullText || progress <= 0.001) return "";
    const count = computeDiscreteCharCount(fullText, progress, isErasing, pauseUnits);
    if (count <= 0) return "";
    const sub = fullText.slice(0, count);
    drawChalkText(sub, x, y, fillColor, fontSizePx, alphaMul);
    return sub;
  }

  function computeLinesCharSchedule(lines, progress, isErasing, pauseUnits) {
    if (!lines || !lines.length) return [];
    const p = clamp(progress, 0, 1);
    if (p <= 0.001) return lines.map(() => 0);
    if (p >= 0.999) return lines.map((ln) => ln.length);

    if (isErasing) {
      let totalChars = 0;
      for (let i = 0; i < lines.length; i++) totalChars += lines[i].length;
      let rem = Math.ceil(totalChars * p);
      return lines.map((ln) => {
        if (rem <= 0) return 0;
        if (rem >= ln.length) {
          rem -= ln.length;
          return ln.length;
        }
        const c = safeCharTake(ln, rem);
        rem = 0;
        return c;
      });
    }

    const pw = pauseUnits === undefined ? 3.0 : pauseUnits;
    let totalW = 0;
    for (let li = 0; li < lines.length; li++) {
      const ln = lines[li];
      for (let i = 0; i < ln.length; i++) {
        totalW += 1 + (PUNCT_PAUSE_RE.test(ln[i]) ? pw : 0);
      }
    }
    const budget = totalW * p;
    let acc = 0;
    return lines.map((ln) => {
      if (acc >= budget) return 0;
      let cnt = 0;
      for (let i = 0; i < ln.length; i++) {
        if (acc >= budget) break;
        cnt = i + 1;
        acc += 1 + (PUNCT_PAUSE_RE.test(ln[i]) ? pw : 0);
      }
      return safeCharTake(ln, cnt);
    });
  }

  function drawDiscreteWrappedLines(lines, typeProgress, isErasing, x, startY, lineStep, fillColor, fontSizePx, alphaMul) {
    if (!lines || !lines.length) return startY;
    const counts = computeLinesCharSchedule(lines, typeProgress, isErasing, 3.0);
    let cy = startY;
    for (let i = 0; i < lines.length; i++) {
      const take = counts[i] || 0;
      if (take > 0) {
        drawChalkText(lines[i].slice(0, take), x, cy, fillColor, fontSizePx, alphaMul);
      }
      cy += lineStep;
    }
    return cy;
  }

  // BiDi directional run splitter & exact visual [xLeft, xRight] span calculator for mixed RTL/LTR lines
  const BIDI_LTR_RUN_RE = /[A-Za-z0-9]+(?:[\s.\-+]+[A-Za-z0-9]+)*/g;

  function buildBiDiVisualRuns(line, lineLeftX, lineRightX, rtl) {
    if (!rtl) {
      return [
        {
          text: line,
          dir: "ltr",
          start: 0,
          end: line.length,
          left: lineLeftX,
          right: lineLeftX + ctx.measureText(line).width
        }
      ];
    }
    const runs = [];
    let lastIdx = 0;
    BIDI_LTR_RUN_RE.lastIndex = 0;
    let m;
    while ((m = BIDI_LTR_RUN_RE.exec(line)) !== null) {
      if (m.index > lastIdx) {
        runs.push({
          text: line.slice(lastIdx, m.index),
          dir: "rtl",
          start: lastIdx,
          end: m.index
        });
      }
      runs.push({
        text: m[0],
        dir: "ltr",
        start: m.index,
        end: m.index + m[0].length
      });
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < line.length) {
      runs.push({
        text: line.slice(lastIdx),
        dir: "rtl",
        start: lastIdx,
        end: line.length
      });
    }
    if (runs.length === 0) {
      runs.push({ text: "", dir: "rtl", start: 0, end: 0, left: lineRightX, right: lineRightX });
      return runs;
    }

    let curRight = lineRightX;
    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      const w = ctx.measureText(r.text).width;
      r.right = curRight;
      r.left = curRight - w;
      curRight = r.left;
    }
    return runs;
  }

  function measureBiDiPhraseSpan(line, segStart, segEnd, lineLeftX, lineRightX, rtl) {
    if (!rtl) {
      const xLeft = lineLeftX + ctx.measureText(line.slice(0, segStart)).width;
      const xRight = xLeft + ctx.measureText(line.slice(segStart, segEnd)).width;
      return { xLeft, xRight, width: Math.max(0, xRight - xLeft) };
    }
    const runs = buildBiDiVisualRuns(line, lineLeftX, lineRightX, true);
    let minL = Infinity;
    let maxR = -Infinity;
    for (let i = 0; i < runs.length; i++) {
      const R = runs[i];
      if (segEnd <= R.start || segStart >= R.end) continue;
      const subIdx = Math.max(0, segStart - R.start);
      const endIdx = Math.min(R.text.length, segEnd - R.start);
      const phraseSlice = R.text.slice(subIdx, endIdx);
      let pLeft;
      let pRight;
      if (R.dir === "rtl") {
        pLeft = R.right - ctx.measureText(R.text.slice(0, endIdx)).width;
        pRight = pLeft + ctx.measureText(phraseSlice).width;
      } else {
        pLeft = R.left + ctx.measureText(R.text.slice(0, subIdx)).width;
        pRight = pLeft + ctx.measureText(phraseSlice).width;
      }
      if (pLeft < minL) minL = pLeft;
      if (pRight > maxR) maxR = pRight;
    }
    if (!Number.isFinite(minL) || !Number.isFinite(maxR)) {
      const fbW = ctx.measureText(line.slice(segStart, segEnd)).width;
      return { xLeft: lineRightX - fbW, xRight: lineRightX, width: fbW };
    }
    return { xLeft: minL, xRight: maxR, width: Math.max(0, maxR - minL) };
  }

  // Hand-inked 14x14 lithograph micro-emblems for Selected Projects
  function drawProjectMicroEmblem(kind, cx, cy, color, glowAlpha) {
    ctx.save();
    ctx.strokeStyle = color || CHALK;
    ctx.fillStyle = color || CHALK;
    ctx.lineWidth = 1.15;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (glowAlpha && glowAlpha > 0.04) {
      ctx.shadowColor = "rgba(223, 226, 232, 0.52)";
      ctx.shadowBlur = 3.5 * glowAlpha;
    }

    if (kind === "crest") {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6.3);
      ctx.lineTo(cx + 5.5, cy - 4.1);
      ctx.lineTo(cx + 4.6, cy + 1.9);
      ctx.quadraticCurveTo(cx + 2.2, cy + 5.3, cx, cy + 6.4);
      ctx.quadraticCurveTo(cx - 2.2, cy + 5.3, cx - 4.6, cy + 1.9);
      ctx.lineTo(cx - 5.5, cy - 4.1);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy - 2.9);
      ctx.lineTo(cx, cy + 2.3);
      ctx.moveTo(cx - 2.6, cy - 0.3);
      ctx.lineTo(cx + 2.6, cy - 0.3);
      ctx.stroke();
    } else if (kind === "rail") {
      ctx.beginPath();
      ctx.moveTo(cx - 6.3, cy + 4.6);
      ctx.quadraticCurveTo(cx, cy + 1.8, cx + 6.3, cy + 4.6);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 5.8, cy + 1.4);
      ctx.lineTo(cx + 3.8, cy - 2.6);
      ctx.quadraticCurveTo(cx + 6.4, cy - 1.3, cx + 4.8, cy + 0.9);
      ctx.lineTo(cx - 4.8, cy + 2.5);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx - 3.2, cy - 4.2, 1.0, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "trail") {
      // Winding heritage Hijrah trail S-curve + 4-point desert compass star
      ctx.beginPath();
      ctx.moveTo(cx - 5.6, cy + 5.6);
      ctx.bezierCurveTo(cx - 0.8, cy + 4.9, cx - 5.0, cy + 0.6, cx + 1.8, cy - 1.0);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx - 4.8, cy + 5.4, 0.85, 0, Math.PI * 2);
      ctx.arc(cx - 1.6, cy + 2.1, 0.75, 0, Math.PI * 2);
      ctx.fill();

      const sx = cx + 3.2;
      const sy = cy - 3.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 2.9);
      ctx.lineTo(sx, sy + 2.9);
      ctx.moveTo(sx - 2.9, sy);
      ctx.lineTo(sx + 2.9, sy);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(sx, sy, 0.9, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "circuit") {
      ctx.beginPath();
      ctx.moveTo(cx - 5.6, cy + 4.8);
      ctx.bezierCurveTo(cx - 5.6, cy - 1.8, cx + 5.4, cy + 2.6, cx + 5.4, cy - 4.8);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 0.8, cy - 4.6);
      ctx.lineTo(cx - 1.3, cy - 0.6);
      ctx.lineTo(cx + 1.2, cy - 0.6);
      ctx.lineTo(cx - 0.9, cy + 3.4);
      ctx.stroke();
    } else if (kind === "crown") {
      ctx.beginPath();
      ctx.moveTo(cx - 5.4, cy + 4.2);
      ctx.lineTo(cx - 6.0, cy - 1.5);
      ctx.lineTo(cx - 2.2, cy + 1.2);
      ctx.lineTo(cx, cy - 4.5);
      ctx.lineTo(cx + 2.2, cy + 1.2);
      ctx.lineTo(cx + 6.0, cy - 1.5);
      ctx.lineTo(cx + 5.4, cy + 4.2);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy - 6.0, 0.95, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "roshan") {
      ctx.beginPath();
      ctx.moveTo(cx - 4.6, cy + 1.6);
      ctx.lineTo(cx - 4.6, cy - 2.6);
      ctx.lineTo(cx, cy - 6.0);
      ctx.lineTo(cx + 4.6, cy - 2.6);
      ctx.lineTo(cx + 4.6, cy + 1.6);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 2.5, cy - 1.2);
      ctx.lineTo(cx, cy - 3.6);
      ctx.lineTo(cx + 2.5, cy - 1.2);
      ctx.lineTo(cx, cy + 1.2);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 6.2, cy + 4.5);
      ctx.quadraticCurveTo(cx - 3.1, cy + 2.6, cx, cy + 4.5);
      ctx.quadraticCurveTo(cx + 3.1, cy + 6.3, cx + 6.2, cy + 4.5);
      ctx.stroke();
    } else if (kind === "laurel") {
      ctx.beginPath();
      ctx.moveTo(cx - 0.8, cy + 5.6);
      ctx.bezierCurveTo(cx - 6.2, cy + 3.4, cx - 6.2, cy - 2.8, cx - 1.8, cy - 5.6);
      ctx.moveTo(cx + 0.8, cy + 5.6);
      ctx.bezierCurveTo(cx + 6.2, cy + 3.4, cx + 6.2, cy - 2.8, cx + 1.8, cy - 5.6);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 4.8, cy + 1.2);
      ctx.lineTo(cx - 2.6, cy - 0.2);
      ctx.moveTo(cx - 4.8, cy - 2.0);
      ctx.lineTo(cx - 2.5, cy - 3.0);
      ctx.moveTo(cx + 4.8, cy + 1.2);
      ctx.lineTo(cx + 2.6, cy - 0.2);
      ctx.moveTo(cx + 4.8, cy - 2.0);
      ctx.lineTo(cx + 2.5, cy - 3.0);
      ctx.stroke();
    } else {
      const rx = cx - 6.1;
      const ry = cy - 4.5;
      const rw = 12.2;
      const rh = 9.0;
      ctx.beginPath();
      ctx.moveTo(rx + 2, ry);
      ctx.lineTo(rx + rw - 2, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + 2);
      ctx.lineTo(rx + rw, ry + rh - 2);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - 2, ry + rh);
      ctx.lineTo(rx + 2, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - 2);
      ctx.lineTo(rx, ry + 2);
      ctx.quadraticCurveTo(rx, ry, rx + 2, ry);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFourPointSparkle(cx, cy, armLen, color, alpha) {
    if (alpha <= 0.02) return;
    ctx.save();
    ctx.globalAlpha *= clamp(alpha, 0, 1);
    ctx.strokeStyle = color || CHALK_BRIGHT;
    ctx.fillStyle = color || CHALK_BRIGHT;
    ctx.lineWidth = 0.85;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - armLen, cy);
    ctx.lineTo(cx + armLen, cy);
    ctx.moveTo(cx, cy - armLen);
    ctx.lineTo(cx, cy + armLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 1.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRoundedCapsulePath(x, y, w, h, r) {
    const rad = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function drawWavyUnderline(xLeft, y, fullWidth, prog, seed, color, lineWidth, rtlOverride) {
    const p = clamp(prog, 0, 1);
    const span = fullWidth * p;
    if (span <= 1.0 || fullWidth <= 1.0) return;
    const rtlDir = rtlOverride !== undefined ? Boolean(rtlOverride) : isRTL();
    const xRight = xLeft + fullWidth;
    const startX = rtlDir ? xRight : xLeft;
    const endX = rtlDir ? xRight - span : xLeft + span;

    lastUnderlineLogs.push({
      xLeft,
      xRight,
      y,
      startX,
      endX,
      width: fullWidth,
      prog: p,
      rtl: rtlDir
    });

    ctx.save();
    ctx.strokeStyle = color || CHALK_BRIGHT;
    ctx.lineWidth = Math.min(1.25, lineWidth || 1.15);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(6, 8, 12, 0.86)";
    ctx.shadowBlur = 1.5;
    ctx.shadowOffsetY = 1.0;
    ctx.beginPath();
    const step = 3.5;
    let dx = 0;
    let first = true;
    while (dx <= span) {
      const wx = rtlDir ? xRight - dx : xLeft + dx;
      const wy =
        y +
        Math.sin(dx * 0.21 + seed) * 0.44 +
        Math.cos(dx * 0.47 + seed * 1.63) * 0.20;
      if (first) {
        ctx.moveTo(wx, wy);
        first = false;
      } else {
        ctx.lineTo(wx, wy);
      }
      if (dx === span) break;
      dx = Math.min(span, dx + step);
    }
    ctx.stroke();
    ctx.restore();
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("is-visible"), 2400);
  }

  function fallbackCopyText(text) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (_) {}
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopyText(text));
      return;
    }
    fallbackCopyText(text);
  }

  // =========================================================================
  // CHOREOGRAPHED CAMERA TRANSFORMS & TARGET FRAMING
  // =========================================================================
  function worldToScreen(wx, wy) {
    return {
      x: (wx - cam.x) * cam.zoom + vw * 0.5,
      y: (wy - cam.y) * cam.zoom + vh * 0.5
    };
  }

  function screenToWorld(sx, sy) {
    return {
      x: (sx - vw * 0.5) / cam.zoom + cam.x,
      y: (sy - vh * 0.5) / cam.zoom + cam.y
    };
  }

  function resetPanOffset() {
    panOffset.x = 0;
    panOffset.y = 0;
  }

  function computeHomeWorldBounds() {
    syncCanvasFontVars();
    resetCanvasLetterSpacing();
    const d = getLocale();
    let minWX = -208;
    let maxWX = 208;
    const minWY = -556;
    const maxWY = 16;

    if (d && d.branches) {
      for (const key of BRANCH_KEYS) {
        const bCfg = d.branches[key];
        if (!bCfg) continue;
        const dir = bCfg.side === "left" ? -1 : 1;
        const tipX = bCfg.attachX + dir * Math.cos(bCfg.angle) * TWIG_SHOOT_LEN;
        ctx.font = canvasFont("600 15px", `${bCfg.label}.`);
        const fullW = ctx.measureText(`${bCfg.label}.`).width;
        const anchorX = tipX + dir * 12;
        const padAllowance = 12;
        if (dir < 0) {
          minWX = Math.min(minWX, anchorX - fullW - padAllowance);
        } else {
          maxWX = Math.max(maxWX, anchorX + fullW + padAllowance);
        }
      }
    }

    return {
      minWX,
      maxWX,
      minWY,
      maxWY,
      spanX: Math.max(420, maxWX - minWX),
      spanY: maxWY - minWY
    };
  }

  function computeHomeCamera() {
    const hb = computeHomeWorldBounds();
    const isPhone = vw < 680;
    const isPortraitOrCompact = vw < 960 || vh >= vw;

    if (isPortraitOrCompact) {
      const sidePad = vw < 430 ? 22 : 28;
      const topClearance = isPhone ? 92 : 82;
      const botClearance = isPhone ? 108 : 86;
      const horizZoom = (vw - sidePad * 2) / hb.spanX;
      const vertZoom = (vh - topClearance - botClearance) / Math.max(560, hb.spanY);
      const homeZoom = clamp(Math.min(horizZoom, vertZoom), 0.38, 1.05);

      const treePxH = 560 * homeZoom;
      const availVert = Math.max(treePxH, vh - topClearance - botClearance);
      const groundScreenY = topClearance + treePxH + (availVert - treePxH) * 0.5;

      return {
        zoom: homeZoom,
        x: (hb.minWX + hb.maxWX) * 0.5,
        y: -(groundScreenY - vh * 0.5) / homeZoom
      };
    }

    const sideMargin = 34;
    const treeScreenX = clamp(vw * 0.46, vw * 0.38, vw * 0.52);
    const availLeft = Math.max(160, treeScreenX - sideMargin);
    const availRight = Math.max(160, vw - treeScreenX - sideMargin);
    const horizZoom = Math.min(
      availLeft / Math.max(240, Math.abs(hb.minWX)),
      availRight / Math.max(240, hb.maxWX)
    );
    const groundScreenY = vh - 18;
    const topClearance = 44;
    const vertZoom = (groundScreenY - topClearance) / 568;
    const homeZoom = clamp(Math.min(vertZoom, horizZoom), 0.38, 1.24);

    return {
      zoom: homeZoom,
      x: (vw * 0.5 - treeScreenX) / homeZoom,
      y: -(groundScreenY - vh * 0.5) / homeZoom
    };
  }

  function fitWorldBox(minX, maxX, minY, maxY, padBotOverride) {
    const isPhone = vw < 680;
    const isTablet = vw >= 680 && vw < 1024;
    const padX = isPhone ? 22 : isTablet ? 38 : 72;
    const padTop = isPhone ? 56 : 52;
    const padBot = typeof padBotOverride === "number" ? padBotOverride : (isPhone ? 74 : 78);
    const boxW = Math.max(200, maxX - minX);
    const boxH = Math.max(170, maxY - minY);

    const zx = (vw - padX * 2) / boxW;
    const zy = (vh - padTop - padBot) / boxH;
    const z = clamp(Math.min(zx, zy), 0.32, 1.38);

    const cx = (minX + maxX) * 0.5;
    const cy = (minY + maxY) * 0.5;
    const screenMidY = padTop + (vh - padTop - padBot) * 0.5;

    targetCam.zoom = z;
    targetCam.x = cx;
    targetCam.y = cy - (screenMidY - vh * 0.5) / z;
  }

  function wrapLines(text, maxWidth, fontSpec) {
    if (!text) return [];
    resetCanvasLetterSpacing();
    ctx.font = fontSpec;
    const words = text.split(/\s+/);
    const lines = [];
    let cur = "";
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const cand = cur ? cur + " " + w : w;
      if (ctx.measureText(cand).width <= maxWidth || !cur) {
        cur = cand;
      } else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function layoutActionRows(actions, maxWidth) {
    if (!Array.isArray(actions) || actions.length === 0) return [];
    syncCanvasFontVars();
    const gapX = 16;
    const rows = [];
    let curRow = [];
    let curWidth = 0;

    actions.forEach((act, aIdx) => {
      ctx.font = canvasFont("500 12px", act.label);
      const tw = Math.min(maxWidth, ctx.measureText(act.label).width);
      if (curRow.length > 0 && curWidth + gapX + tw > maxWidth) {
        rows.push({ items: curRow, width: curWidth });
        curRow = [];
        curWidth = 0;
      }
      const offsetX = curRow.length === 0 ? 0 : curWidth + gapX;
      curRow.push({ act, aIdx, tw, offsetX });
      curWidth = offsetX + tw;
    });

    if (curRow.length > 0) {
      rows.push({ items: curRow, width: curWidth });
    }
    return rows;
  }

  function computeBranchLayout(branchCfg) {
    const dir = branchCfg.side === "left" ? -1 : 1;
    const twigLen = TWIG_SHOOT_LEN;
    const tipX = branchCfg.attachX + dir * Math.cos(branchCfg.angle) * twigLen;
    const tipY = branchCfg.attachY + Math.sin(branchCfg.angle) * twigLen;

    syncCanvasFontVars();
    ctx.font = canvasFont("600 15px", branchCfg.label);
    const activeLabelW = ctx.measureText(`${branchCfg.label}.`).width;
    const boughSpan = Math.max(94, activeLabelW + 40);
    const forkX = tipX + dir * boughSpan;
    const forkY = tipY - 4;

    const isCompactViewport = vw < 680;
    const itemColWidth = isCompactViewport ? 268 : ITEM_COL_WIDTH;
    const detailColWidth = isCompactViewport ? 292 : DETAIL_COL_WIDTH;
    const subSpanX = isCompactViewport ? 50 : 92;
    const subTipX = forkX + dir * subSpanX;
    const isArLayout = isRTL();
    const actionRowH = isArLayout ? 27 : 23;
    const titleStepH = isArLayout ? 24.5 : 20.0;
    const sumStepH = isArLayout ? 18.5 : 16.2;
    const isMeBranch = branchCfg.id === "me";
    const vGap = isMeBranch ? 13 : 18;
    const maxStackBottomY = isMeBranch ? -36 : -54;

    const measuredItems = branchCfg.items.map((it) => {
      const titleLines = wrapLines(it.title, itemColWidth, canvasFont("600 13.6px", it.title));
      const sumLines = wrapLines(it.summary, itemColWidth, canvasFont("400 12.3px", it.summary));
      const actionRows = layoutActionRows(it.actions, itemColWidth);
      const metaH = it.meta ? 15 : 0;
      const textBodyH = metaH + titleLines.length * titleStepH + 3 + sumLines.length * sumStepH;
      const actionsH = actionRows.length > 0 ? 8 + actionRows.length * actionRowH + 4 : 0;
      const blockH = textBodyH + (actionRows.length > 0 ? actionsH : 8);

      const bodyParas = (it.body || []).map((p) =>
        wrapLines(p, detailColWidth, canvasFont("400 13px", p))
      );
      const tagText =
        Array.isArray(it.tags) && it.tags.length
          ? it.tags.map((t) => "#" + t).join("   ")
          : "";
      const tagFont = `400 ${lang === "ar" || hasArabicChars(tagText) ? "11.5px" : "11px"} ${fontFamilyFor(tagText)}`;
      const tagLines = tagText
        ? wrapLines(tagText, detailColWidth, tagFont)
        : [];

      let detailH = isArLayout ? 28 : 25;
      for (const pl of bodyParas) detailH += pl.length * 18.8 + 9;
      if (tagLines.length > 0) detailH += tagLines.length * 15.5 + 5;

      return {
        item: it,
        titleLines,
        sumLines,
        actionRows,
        actionRowH,
        textBodyH,
        bodyParas,
        tagText,
        tagLines,
        blockH,
        detailH
      };
    });

    let totalH = 0;
    for (const mi of measuredItems) {
      const expandReflow = 12 * (itemGrow[mi.item.id] || 0);
      mi.expandReflow = expandReflow;
      totalH += mi.blockH + expandReflow;
    }
    totalH += Math.max(0, measuredItems.length - 1) * vGap;

    let topY = forkY - totalH * 0.5;
    if (topY < -620) topY = -620;
    if (topY + totalH > maxStackBottomY) {
      topY = maxStackBottomY - totalH;
    }

    let cursorY = topY;
    for (const mi of measuredItems) {
      mi.topY = cursorY;
      mi.jointY = cursorY + 14;
      mi.subTipX = subTipX;
      mi.textBoxLeft = dir < 0 ? subTipX - 14 - itemColWidth : subTipX + 14;
      mi.textBoxRight = mi.textBoxLeft + itemColWidth;

      const outerEdgeX = dir < 0 ? mi.textBoxLeft - 12 : mi.textBoxRight + 12;
      mi.lvl2StartX = outerEdgeX;
      mi.lvl2StartY = mi.jointY;
      mi.lvl2TipX = outerEdgeX + dir * 74;

      let dTop = mi.topY - 6;
      if (dTop + mi.detailH > maxStackBottomY) {
        dTop = maxStackBottomY - mi.detailH;
      }
      mi.lvl2TopY = dTop;
      mi.lvl2BoxLeft = dir < 0 ? mi.lvl2TipX - 14 - detailColWidth : mi.lvl2TipX + 14;
      mi.lvl2BoxRight = mi.lvl2BoxLeft + detailColWidth;

      cursorY += mi.blockH + (mi.expandReflow || 0) + vGap;
    }

    const bottomY = cursorY - vGap;
    const minX = Math.min(...measuredItems.map((m) => m.textBoxLeft), Math.min(branchCfg.attachX, forkX));
    const maxX = Math.max(...measuredItems.map((m) => m.textBoxRight), Math.max(branchCfg.attachX, forkX));

    return {
      dir,
      tipX,
      tipY,
      boughSpan,
      forkX,
      forkY,
      itemColWidth,
      detailColWidth,
      measuredItems,
      topY,
      bottomY,
      minX,
      maxX
    };
  }

  // Preserve custom botanical twig-leaf-dot SVG inside #btn-back (never overwrite textContent!)
  function syncBackButton() {
    const showBack = Boolean(activeBranch || (activeItem && !closingExpYear));
    if (btnBack) {
      btnBack.hidden = !showBack;
    }
  }

  function computeExperienceBoughLayout(bCfg) {
    syncCanvasFontVars();
    resetCanvasLetterSpacing();
    const isMobile = vw < 680;
    const isTablet = vw >= 680 && vw < 1024;
    const detailColWidth = isMobile ? 268 : isTablet ? 314 : 344;
    const G = EXP_BOUGH_GEOM;

    // 6 authentic chronological milestones growing from Base (t=0.16, 2003–2008) to Crown Apex (t=0.92, 2023–Now)
    // Every twig tip clears all 8 leaf-puff clusters with >= 18px pure sky margin!
    const twigConfigs = [
      { t: 0.16, side: "right", isOuterTip: false, angle: 0.24,  len: 54, baseOffX: 16,  baseOffY: 10,   minCardTopY: -558, maxCardBotY: -46  },
      { t: 0.31, side: "left",  isOuterTip: false, angle: -2.36, len: 50, baseOffX: -10, baseOffY: -10,  minCardTopY: -1280, maxCardBotY: -584 },
      { t: 0.46, side: "right", isOuterTip: false, angle: 0.34,  len: 50, baseOffX: 12,  baseOffY: 10,   minCardTopY: -696, maxCardBotY: -46  },
      { t: 0.62, side: "left",  isOuterTip: false, angle: -2.08, len: 48, baseOffX: -8,  baseOffY: -10,  minCardTopY: -1280, maxCardBotY: -678 },
      { t: 0.77, side: "right", isOuterTip: false, angle: 0.44,  len: 46, baseOffX: 10,  baseOffY: 8,    minCardTopY: -784, maxCardBotY: -46  },
      { t: 0.92, side: "right", isOuterTip: true,  angle: -0.27, len: 42, baseOffX: 24,  baseOffY: -7.5, minCardTopY: -868, maxCardBotY: -46  }
    ];

    const yearNodes = (bCfg.items || []).map((it, idx) => {
      const cfg = twigConfigs[idx] || {
        t: typeof it.t === "number" ? it.t : 0.16 + idx * 0.15,
        side: it.twigSide || (idx % 2 === 0 ? "right" : "left"),
        isOuterTip: idx === 5,
        angle: idx % 2 === 0 ? 0.30 : -2.15,
        len: 48,
        baseOffX: 0,
        baseOffY: 0,
        minCardTopY: -900,
        maxCardBotY: -46
      };
      const bx = evalCubic(G.x0, G.cx1, G.cx2, G.x3, cfg.t);
      const by = evalCubic(G.y0, G.cy1, G.cy2, G.y3, cfg.t);
      const startX = bx + cfg.baseOffX;
      const startY = by + cfg.baseOffY;
      const tipX = startX + Math.cos(cfg.angle) * cfg.len;
      const tipY = startY + Math.sin(cfg.angle) * cfg.len;

      const rawLabel = it.yearLabel || it.title || "";
      const activeText = rawLabel + ".";
      ctx.font = canvasFont("600 14.8px", activeText);
      const fullW = ctx.measureText(activeText).width;
      ctx.font = canvasFont("500 14.8px", rawLabel);
      const idleW = ctx.measureText(rawLabel).width;

      const isRightSide = cfg.side === "right";
      const labelGap = 12;
      const labelY = tipY + (cfg.side === "left" ? -2 : 1);
      const boxLeft = isRightSide ? tipX + labelGap : tipX - labelGap - fullW;
      const boxRight = boxLeft + fullW;
      const idleBoxLeft = isRightSide ? tipX + labelGap : tipX - labelGap - idleW;
      const idleBoxRight = idleBoxLeft + idleW;

      // Measure Level-2 roles & bullets for this year node (wrapped strictly within detailColWidth)
      const roles = Array.isArray(it.roles) ? it.roles : [];
      const measuredRoles = roles.map((r) => {
        const metaStr = [r.company, r.period].filter(Boolean).join("  ·  ");
        const metaFont = `500 ${lang === "ar" || hasArabicChars(metaStr) ? "11.4px" : "10.8px"} ${fontFamilyFor(metaStr)}`;
        const metaLines = wrapLines(metaStr, detailColWidth - 2, metaFont);
        const roleLines = wrapLines(r.role, detailColWidth - 2, canvasFont("600 13.8px", r.role));
        const bulletLines = [];
        (r.bullets || []).forEach((bText) => {
          const prefixed = "• " + bText;
          const bWrapped = wrapLines(prefixed, detailColWidth - 12, canvasFont("400 12.6px", prefixed));
          bWrapped.forEach((ln, li) => {
            bulletLines.push({
              text: ln,
              indent: li > 0 ? 10 : 0,
              afterGap: li === bWrapped.length - 1 ? 3.5 : 0
            });
          });
        });
        const roleEndExtra = lang === "ar" ? 11.5 : 7.5;
        let h = metaLines.length * 16.5 + 3 + roleLines.length * 19.5 + roleEndExtra;
        bulletLines.forEach((bl) => {
          h += 16.8 + bl.afterGap;
        });
        return {
          raw: r,
          metaStr,
          metaLines,
          roleLines,
          bulletLines,
          height: h
        };
      });

      let detailH = lang === "ar" ? 29 : 26; // collapse header row with underline clearance
      measuredRoles.forEach((mr, rIdx) => {
        detailH += mr.height + (rIdx < measuredRoles.length - 1 ? 14 : 4);
      });

      const shootDir = isRightSide ? 1 : -1;
      const shootSpan = isMobile ? 42 : 70;
      const s2StartX = isRightSide ? boxRight + 10 : boxLeft - 10;
      const s2StartY = labelY;
      const s2TipX = s2StartX + shootDir * shootSpan;

      const cardGap = 18;
      let cardTopY = labelY - Math.min(44, detailH * 0.16);
      if (typeof cfg.minCardTopY === "number" && cardTopY < cfg.minCardTopY) {
        cardTopY = cfg.minCardTopY;
      }
      const maxAllowedBottomY = typeof cfg.maxCardBotY === "number" ? cfg.maxCardBotY : (isRightSide ? -46 : -584);
      if (cardTopY + detailH > maxAllowedBottomY) {
        cardTopY = maxAllowedBottomY - detailH;
      }

      const cardLeft = shootDir > 0 ? s2TipX + cardGap : s2TipX - cardGap - detailColWidth;
      const cardRight = cardLeft + detailColWidth;

      return {
        item: it,
        idx,
        t: cfg.t,
        side: cfg.side,
        isOuterTip: Boolean(cfg.isOuterTip),
        isRightSide,
        angle: cfg.angle,
        len: cfg.len,
        bx,
        by,
        startX,
        startY,
        tipX,
        tipY,
        rawLabel,
        activeText,
        idleW,
        fullW,
        labelY,
        boxLeft,
        boxRight,
        idleBoxLeft,
        idleBoxRight,
        shootDir,
        s2StartX,
        s2StartY,
        s2TipX,
        cardGap,
        cardTopY,
        cardLeft,
        cardRight,
        detailColWidth,
        detailH,
        measuredRoles
      };
    });

    // Subtle collar sprig & active branch title in uncluttered open sky below-right of Puff 0
    const collarStartX = 204;
    const collarStartY = -460;
    const collarTipX = 246;
    const collarTipY = -438;
    ctx.font = canvasFont("600 14.5px", `${bCfg.label}.`);
    const branchLabelW = ctx.measureText(`${bCfg.label}.`).width;
    const openBranchLabelLeft = collarTipX + 12;
    const openBranchLabelRight = openBranchLabelLeft + branchLabelW;
    const openBranchLabelY = collarTipY;

    // Exact world bounding box of arching bough + all 8 leaf puffs + collar title + all 6 year labels
    const puffBoundsMinX = Math.min(...EXP_PUFF_SPECS.map((p) => evalCubic(G.x0, G.cx1, G.cx2, G.x3, p.t) - p.rx * 1.2));
    const puffBoundsMaxX = Math.max(...EXP_PUFF_SPECS.map((p) => evalCubic(G.x0, G.cx1, G.cx2, G.x3, p.t) + p.rx * 1.2));
    const puffBoundsMinY = Math.min(...EXP_PUFF_SPECS.map((p) => evalCubic(G.y0, G.cy1, G.cy2, G.y3, p.t) - p.ry * 1.2));
    const puffBoundsMaxY = Math.max(...EXP_PUFF_SPECS.map((p) => evalCubic(G.y0, G.cy1, G.cy2, G.y3, p.t) + p.ry * 1.2));

    const minYearX = Math.min(
      G.x0 - 16,
      puffBoundsMinX,
      ...yearNodes.map((yn) => Math.min(yn.boxLeft, yn.idleBoxLeft))
    ) - 6;
    const maxYearX = Math.max(
      G.x3 + 18,
      puffBoundsMaxX,
      openBranchLabelRight,
      ...yearNodes.map((yn) => Math.max(yn.boxRight, yn.idleBoxRight))
    ) + 6;
    const minYearY = Math.min(
      G.y3 - 18,
      puffBoundsMinY,
      ...yearNodes.map((yn) => yn.labelY - 14)
    ) - 4;
    const maxYearY = Math.max(
      openBranchLabelY + 14,
      G.y0 + 12,
      puffBoundsMaxY,
      ...yearNodes.map((yn) => yn.labelY + 14)
    ) + 4;

    return {
      geom: G,
      yearNodes,
      detailColWidth,
      collarStartX,
      collarStartY,
      collarTipX,
      collarTipY,
      branchLabelW,
      openBranchLabelLeft,
      openBranchLabelRight,
      openBranchLabelY,
      minYearX,
      maxYearX,
      minYearY,
      maxYearY
    };
  }

  function isMeProjectMatchingFilter(item) {
    if (!meProjectFilter || meProjectFilter === "all") return true;
    if (!item) return false;
    if (meProjectFilter === "mega" || meProjectFilter === "national") {
      return item.category === "mega" || item.category === "national";
    }
    return item.category === meProjectFilter;
  }

  function computeMeEditorialLayout(bCfg, lay) {
    const isStackMobile = vw < 680;
    const isCompactTablet = vw >= 680 && vw < 960;
    const rtl = isRTL();

    syncCanvasFontVars();
    resetCanvasLetterSpacing();
    ctx.font = canvasFont("600 15px", `${bCfg.label}.`);
    const labelW = ctx.measureText(`${bCfg.label}.`).width;
    const openCenterX = lay.tipX + lay.dir * (lay.boughSpan * 0.46);
    const openLabelLeft = openCenterX - labelW * 0.5;
    const openLabelRight = openCenterX + labelW * 0.5;

    const bioColW = isStackMobile ? 302 : isCompactTablet ? 344 : 382;
    const baseBioLeft = isStackMobile ? 276 : 294;
    const bioLeft = Math.max(baseBioLeft, Math.ceil(openLabelRight + (isStackMobile ? 16 : 22)));
    const bioRight = bioLeft + bioColW;
    const bioTopY = isStackMobile ? -536 : -456;
    const fontSize = 14;
    const lineH = rtl ? Math.max(33, Math.round(fontSize * 2.36)) : (isStackMobile ? 25.5 : 26.5);
    const paraGap = rtl ? 15.0 : 13.5;

    const firstText =
      (bCfg &&
        bCfg.bioEditorial &&
        bCfg.bioEditorial.paragraphs &&
        bCfg.bioEditorial.paragraphs[0] &&
        bCfg.bioEditorial.paragraphs[0].text) ||
      "";
    const fontSpec = canvasFont("400 14px", firstText);

    const wrappedParas = ((bCfg && bCfg.bioEditorial && bCfg.bioEditorial.paragraphs) || []).map((p) => {
      const lines = wrapLines(p.text, bioColW, fontSpec);
      const lineSpans = [];
      let searchFrom = 0;
      lines.forEach((ln) => {
        const foundAt = p.text.indexOf(ln, searchFrom);
        const start = foundAt !== -1 ? foundAt : searchFrom;
        const end = start + ln.length;
        lineSpans.push({ start, end });
        searchFrom = end;
      });
      return {
        raw: p.text,
        highlights: p.highlights || [],
        lines,
        lineSpans
      };
    });

    let totalChars = 0;
    let totalBioH = 0;
    wrappedParas.forEach((wp) => {
      wp.lines.forEach((ln) => {
        totalChars += ln.length;
        totalBioH += lineH;
      });
      totalBioH += paraGap;
    });

    const visibleBioH = Math.max(0, totalBioH - paraGap);
    const bioBottomY = bioTopY + visibleBioH;

    const contactActions = Array.isArray(bCfg.contactActions) ? bCfg.contactActions : [];
    const contactRows = layoutActionRows(contactActions, bioColW);
    const contactRowH = 26;
    const contactTopY = bioBottomY + 14;
    const contactBottomY =
      contactRows.length > 0 ? contactTopY + contactRows.length * contactRowH : bioBottomY;

    const pw = isStackMobile ? 168 : isCompactTablet ? 204 : 228;
    const aspect = mePortraitBuffer
      ? mePortraitBuffer.height / mePortraitBuffer.width
      : 600 / 476;
    const ph = pw * aspect;
    const px = isStackMobile ? bioLeft + (bioColW - pw) * 0.5 : bioRight + (isCompactTablet ? 34 : 46);
    const py = isStackMobile ? contactBottomY + 18 : bioTopY + Math.max(-10, (visibleBioH - ph) * 0.28);

    const rotPadX = ph * 0.032 + 6;
    const rotPadY = pw * 0.032 + 6;

    const topSectionBottomY = isStackMobile
      ? py + ph + rotPadY
      : Math.max(contactBottomY, py + ph + rotPadY * 0.6);

    const projectsHeading = bCfg.projectsHeading || (lang === "ar" ? "مشاريع مختارة." : "selected projects.");
    ctx.font = canvasFont("600 15.2px", projectsHeading);
    const projectsHeadingW = ctx.measureText(projectsHeading).width;

    // Reserve dedicated outer photoColW (left in AR RTL, right in EN LTR) + 18px pure sky buffer -> 0 px² overlap!
    const photoW = isStackMobile ? 68 : 84;
    const photoH = isStackMobile ? 54 : 66;
    const photoColW = isStackMobile ? 84 : 104;
    const photoTextGap = 18;
    const projColW = isStackMobile ? 314 : isCompactTablet ? 416 : 472;
    const textColW = projColW - photoColW - photoTextGap;
    const projDetailW = isStackMobile ? 276 : isCompactTablet ? 316 : 344;
    const projLeft = bioLeft;
    const projRight = projLeft + projColW;
    const vineX = rtl ? projRight + (isStackMobile ? 18 : 24) : projLeft - (isStackMobile ? 18 : 24);
    const stemX = vineX;
    const projectsHeadingY = topSectionBottomY + (isStackMobile ? 34 : 38);

    const rawFilters = Array.isArray(bCfg.projectFilters) && bCfg.projectFilters.length > 0
      ? bCfg.projectFilters
      : [
          { id: "all", label: rtl ? "الكل" : "all" },
          { id: "sports", label: rtl ? "الرياضة العالمية" : "global sports" },
          { id: "seasons", label: rtl ? "المواسم والسياحة" : "seasons & tourism" },
          { id: "mega", label: rtl ? "المشاريع الوطنية الكبرى" : "national mega-projects" }
        ];
    const filterTopY = projectsHeadingY + (rtl ? 38 : 34);
    const filterGapX = 9;
    const filterRowH = 27;
    const filterPillH = 20.5;
    const filterRows = [];
    let curFRow = [];
    let curFWidth = 0;
    rawFilters.forEach((flt, fIdx) => {
      const fSize = rtl || hasArabicChars(flt.label) ? 11.4 : 11.0;
      ctx.font = `500 ${fSize}px ${fontFamilyFor(flt.label)}`;
      const textW = ctx.measureText(flt.label).width;
      const pillW = Math.ceil(textW + 26);
      if (curFRow.length > 0 && curFWidth + filterGapX + pillW > projColW) {
        filterRows.push({ items: curFRow, width: curFWidth });
        curFRow = [];
        curFWidth = 0;
      }
      const offX = curFRow.length === 0 ? 0 : curFWidth + filterGapX;
      curFRow.push({ flt, fIdx, fSize, textW, pillW, offsetX: offX });
      curFWidth = offX + pillW;
    });
    if (curFRow.length > 0) {
      filterRows.push({ items: curFRow, width: curFWidth });
    }
    const filtersBottomY = filterTopY + filterRows.length * filterRowH;

    const projVGap = isStackMobile ? 20 : 24;
    const titleStepY = rtl ? 24.5 : 20.2;
    const sumStepY = rtl ? 19.2 : 16.4;

    const visibleItems = (bCfg.items || []).filter((it) => isMeProjectMatchingFilter(it));
    let projCursorY = filtersBottomY + 18;

    const measuredProjects = visibleItems.map((it, idx) => {
      const badgeStr = it.impactBadge || "";
      const badgeFontPx = rtl || hasArabicChars(badgeStr) ? 10.6 : 10.2;
      ctx.font = `500 ${badgeFontPx}px ${fontFamilyFor(badgeStr)}`;
      const badgeTextW = badgeStr ? ctx.measureText(badgeStr).width : 0;
      const badgePillW = badgeStr ? Math.min(textColW - 24, Math.ceil(badgeTextW + 16)) : 0;

      const metaStr = it.meta || "";
      const metaFontPx = rtl || hasArabicChars(metaStr) ? 10.8 : 10.2;
      const metaFontSpec = `500 ${metaFontPx}px ${fontFamilyFor(metaStr)}`;
      ctx.font = metaFontSpec;
      const metaW = metaStr ? ctx.measureText(metaStr).width : 0;

      const emblemSlotW = 22;
      const metaInline = Boolean(metaStr && (emblemSlotW + badgePillW + 12 + metaW <= textColW));
      const metaLines = metaStr && !metaInline ? wrapLines(metaStr, textColW - 4, metaFontSpec) : (metaStr ? [metaStr] : []);
      const headerH = 22 + (metaStr && !metaInline ? metaLines.length * 15.5 + 1.5 : 0);

      const titleLines = wrapLines(it.title, textColW - 4, canvasFont("600 13.6px", it.title + "  +"));
      const sumLines = wrapLines(it.summary, textColW - 2, canvasFont("400 12.3px", it.summary));
      const textBlockH = headerH + titleLines.length * titleStepY + 3 + sumLines.length * sumStepY + 8;
      const minPhotoBlockH = photoH + (isStackMobile ? 16 : 20);
      const blockH = Math.max(textBlockH, minPhotoBlockH);
      const expandReflow = 12 * (itemGrow[it.id] || 0);

      // Inner text sub-column vs outer taped halftone photo sub-column
      const textLeft = rtl ? projLeft + photoColW + photoTextGap : projLeft;
      const textRight = textLeft + textColW;
      const photoSlotLeft = rtl ? projLeft : textRight + photoTextGap;
      const photoSlotRight = photoSlotLeft + photoColW;

      const bodyParas = (it.body || []).map((p) =>
        wrapLines(p, projDetailW, canvasFont("400 13px", p))
      );
      const tagText =
        Array.isArray(it.tags) && it.tags.length
          ? it.tags.map((t) => "#" + t).join("   ")
          : "";
      const tagFont = `400 ${rtl || hasArabicChars(tagText) ? "11.5px" : "11px"} ${fontFamilyFor(tagText)}`;
      const tagLines = tagText ? wrapLines(tagText, projDetailW, tagFont) : [];
      const actionRows = layoutActionRows(it.actions, projDetailW);
      const actionRowH = rtl ? 29 : 24;
      const actionsH = actionRows.length > 0 ? 10 + actionRows.length * actionRowH + 4 : 0;

      let detailH = rtl ? 30 : 25;
      for (const pl of bodyParas) detailH += pl.length * (rtl ? 20.2 : 18.8) + 9;
      if (tagLines.length > 0) detailH += tagLines.length * 16.0 + 5;
      detailH += actionsH;

      const topY = projCursorY;
      const jointY = topY + 11;
      const lvl2StartX = rtl ? vineX + 10 : projRight + 14;
      const lvl2TipX = lvl2StartX + (isStackMobile ? 42 : 66);
      const lvl2TopY = topY - 4;
      const lvl2BoxLeft = lvl2TipX + 16;
      const lvl2BoxRight = lvl2BoxLeft + projDetailW;

      projCursorY += blockH + expandReflow + projVGap;

      return {
        item: it,
        idx,
        topY,
        jointY,
        headerH,
        badgeStr,
        badgeFontPx,
        badgeTextW,
        badgePillW,
        metaStr,
        metaLines,
        metaFontPx,
        metaW,
        metaInline,
        titleStepY,
        sumStepY,
        textBlockH,
        blockH,
        expandReflow,
        detailH,
        projLeft,
        projRight,
        projColW,
        textColW,
        textLeft,
        textRight,
        photoW,
        photoH,
        photoColW,
        photoTextGap,
        photoSlotLeft,
        photoSlotRight,
        projDetailW,
        titleLines,
        sumLines,
        bodyParas,
        tagLines,
        actionRows,
        actionRowH,
        lvl2StartX,
        lvl2TipX,
        lvl2TopY,
        lvl2BoxLeft,
        lvl2BoxRight
      };
    });

    const projectsBottomY =
      measuredProjects.length > 0 ? projCursorY - projVGap : filtersBottomY + 24;

    const initialBottomY =
      measuredProjects.length > 0
        ? Math.min(
            projectsBottomY,
            measuredProjects[0].topY + measuredProjects[0].blockH
          )
        : topSectionBottomY + 12;

    const minContentX = Math.min(lay.tipX - 10, openLabelLeft - 10, vineX - 14, bioLeft - 14);
    const maxContentX = Math.max(openLabelRight + 10, bioRight + 12, projRight + 12, vineX + 14, px + pw + rotPadX);
    const minContentY = Math.min(bioTopY - 18, py - rotPadY, lay.tipY - 72);
    const maxContentY = isStackMobile ? contactBottomY + ph + rotPadY + 28 : initialBottomY;

    return {
      isStackMobile,
      bioColW,
      bioLeft,
      bioRight,
      bioTopY,
      bioBottomY,
      contactRows,
      contactRowH,
      contactTopY,
      contactBottomY,
      totalBioH,
      totalChars,
      lineH,
      paraGap,
      fontSpec,
      wrappedParas,
      pw,
      ph,
      px,
      py,
      rotPadX,
      rotPadY,
      topSectionBottomY,
      vineX,
      stemX,
      projectsHeading,
      projectsHeadingW,
      projectsHeadingY,
      filterTopY,
      filterRowH,
      filterPillH,
      filterRows,
      filtersBottomY,
      projColW,
      textColW,
      photoW,
      photoH,
      photoColW,
      photoTextGap,
      projDetailW,
      projLeft,
      projRight,
      measuredProjects,
      projectsBottomY,
      minContentX,
      maxContentX,
      minContentY,
      maxContentY
    };
  }

  function computeActiveContentBounds() {
    const d = getLocale();
    if (!activeBranch || !d || !d.branches || !d.branches[activeBranch]) {
      const hb = computeHomeWorldBounds();
      return {
        minX: hb.minWX - 160,
        maxX: hb.maxWX + 160,
        minY: hb.minWY - 120,
        maxY: hb.maxWY + 200
      };
    }

    const bCfg = d.branches[activeBranch];
    if (activeBranch === "experience") {
      const expLay = computeExperienceBoughLayout(bCfg);
      let minX = Math.min(0, expLay.minYearX - 48);
      let maxX = expLay.maxYearX + 48;
      let minY = expLay.minYearY - 48;
      let maxY = Math.max(-260, expLay.maxYearY + 48);
      if (activeItem) {
        const yn = expLay.yearNodes.find((n) => n.item.id === activeItem);
        if (yn) {
          minX = Math.min(minX, yn.cardLeft - 48);
          maxX = Math.max(maxX, yn.cardRight + 48);
          minY = Math.min(minY, yn.cardTopY - 48);
          maxY = Math.max(maxY, yn.cardTopY + yn.detailH + 56);
        }
      }
      return { minX, maxX, minY, maxY };
    }

    const lay = computeBranchLayout(bCfg);
    if (activeBranch === "me") {
      const meLay = computeMeEditorialLayout(bCfg, lay);
      let minX = Math.min(40, meLay.minContentX - 28);
      let maxX = meLay.maxContentX + 28;
      let minY = meLay.minContentY - 28;
      let maxY = meLay.projectsBottomY + 56;
      if (activeItem) {
        const mp = meLay.measuredProjects.find((p) => p.item.id === activeItem);
        if (mp) {
          maxX = Math.max(maxX, mp.lvl2BoxRight + 28);
          maxY = Math.max(maxY, mp.lvl2TopY + mp.detailH + 44);
        }
      }
      return { minX, maxX, minY, maxY };
    }

    let minX = lay.minX - 40;
    let maxX = lay.maxX + 40;
    let minY = Math.min(bCfg.attachY - 40, lay.topY - 40);
    let maxY = Math.max(-40, lay.bottomY + 40);
    if (activeItem) {
      const found = lay.measuredItems.find((m) => m.item.id === activeItem);
      if (found) {
        minX = Math.min(minX, found.lvl2BoxLeft - 32);
        maxX = Math.max(maxX, found.lvl2BoxRight + 32);
        minY = Math.min(minY, found.lvl2TopY - 32);
        maxY = Math.max(maxY, found.lvl2TopY + found.detailH + 36);
      }
    }
    return { minX, maxX, minY, maxY };
  }

  function recordDefaultTargetAndApplyInstant(instant, isHome) {
    defaultTargetCam.x = targetCam.x;
    defaultTargetCam.y = targetCam.y;
    defaultTargetCam.zoom = targetCam.zoom;
    if (instant) {
      baseCam.x = targetCam.x;
      baseCam.y = targetCam.y;
      baseCam.zoom = targetCam.zoom;
      cam.x = baseCam.x;
      cam.y = baseCam.y;
      cam.zoom = isHome ? baseCam.zoom * (1 + 0.05 * introCamRem) : baseCam.zoom;
    }
  }

  function syncCameraToActiveState(instant) {
    const d = getLocale();
    syncBackButton();

    if (!activeBranch) {
      const h = computeHomeCamera();
      targetCam.x = h.x;
      targetCam.y = h.y;
      targetCam.zoom = h.zoom;
      recordDefaultTargetAndApplyInstant(instant, true);
      return;
    }

    hasOpenedAnyBranch = true;
    const bCfg = d.branches[activeBranch];
    if (!bCfg) return;
    const isMobile = vw < 680;
    const isCompactTablet = vw >= 680 && vw < 960;

    if (activeBranch === "experience") {
      const expLay = computeExperienceBoughLayout(bCfg);
      if (activeItem && !closingExpYear) {
        const yn = expLay.yearNodes.find((n) => n.item.id === activeItem);
        if (yn) {
          if (isMobile) {
            // Readable mobile zoom >= 0.84 framing the secondary shoot + full role/bullets card comfortably
            const focusLeft = yn.isRightSide ? yn.s2StartX - 18 : yn.cardLeft - 10;
            const focusRight = yn.isRightSide ? yn.cardRight + 10 : yn.s2StartX + 18;
            const spanW = Math.max(296, focusRight - focusLeft);
            const z = clamp((vw - 28) / spanW, 0.84, 0.94);
            const topWorldY = Math.min(yn.cardTopY, yn.labelY - 16) - 10;
            const botWorldY = Math.max(yn.cardTopY + yn.detailH, yn.labelY + 16) + 12;
            const contentPxH = (botWorldY - topWorldY) * z;
            const availPxH = vh - 68 - 76;

            targetCam.zoom = z;
            targetCam.x = (focusLeft + focusRight) * 0.5;
            if (contentPxH <= availPxH) {
              const midWorldY = (topWorldY + botWorldY) * 0.5;
              const screenMidY = 68 + availPxH * 0.5;
              targetCam.y = midWorldY - (screenMidY - vh * 0.5) / z;
            } else {
              targetCam.y = topWorldY - (68 - vh * 0.5) / z;
            }
          } else {
            const padX = isCompactTablet ? 30 : 56;
            const padTop = 68;
            const padBot = 78;
            const minX = Math.min(yn.bx - 28, yn.boxLeft, yn.cardLeft) - 18;
            const maxX = Math.max(yn.bx + 28, yn.boxRight, yn.cardRight) + 18;
            const minY = Math.min(yn.cardTopY, yn.labelY - 20) - 18;
            const maxY = Math.max(yn.cardTopY + yn.detailH, yn.labelY + 20) + 18;
            const zx = (vw - padX * 2) / Math.max(280, maxX - minX);
            const zy = (vh - padTop - padBot) / Math.max(220, maxY - minY);
            const z = isCompactTablet
              ? clamp(Math.min(zx, zy), 0.86, 1.02)
              : clamp(Math.min(zx, zy), 0.95, 1.04);
            const screenMidY = padTop + (vh - padTop - padBot) * 0.5;

            targetCam.zoom = z;
            targetCam.x = (minX + maxX) * 0.5;
            if ((maxY - minY) * z <= vh - padTop - padBot + 8) {
              targetCam.y = (minY + maxY) * 0.5 - (screenMidY - vh * 0.5) / z;
            } else {
              targetCam.y = minY - (padTop - vh * 0.5) / z;
            }
          }
          recordDefaultTargetAndApplyInstant(instant, false);
          return;
        }
      }

      // Level 1 experience: fit exact world box of bough + all 6 year labels inside [14..vw-14] x [64..vh-72]!
      const leftPad = isMobile ? 20 : isCompactTablet ? 30 : 52;
      const rightPad = leftPad;
      const topPad = isMobile ? 72 : 74;
      const botPad = isMobile ? 80 : 82;
      const crownHintX = isMobile ? expLay.minYearX : Math.min(72, expLay.minYearX);
      const crownHintY = isMobile ? expLay.maxYearY : Math.max(-368, expLay.maxYearY);
      const minWX = Math.min(crownHintX, expLay.minYearX);
      const maxWX = expLay.maxYearX;
      const minWY = expLay.minYearY;
      const maxWY = Math.max(crownHintY, expLay.maxYearY);

      const zx = (vw - leftPad - rightPad) / Math.max(240, maxWX - minWX);
      const zy = (vh - topPad - botPad) / Math.max(200, maxWY - minWY);
      const z = clamp(Math.min(zx, zy), 0.36, 1.14);
      const screenMidX = leftPad + (vw - leftPad - rightPad) * 0.5;
      const screenMidY = topPad + (vh - topPad - botPad) * 0.5;

      targetCam.zoom = z;
      targetCam.x = (minWX + maxWX) * 0.5 - (screenMidX - vw * 0.5) / z;
      targetCam.y = (minWY + maxWY) * 0.5 - (screenMidY - vh * 0.5) / z;
      recordDefaultTargetAndApplyInstant(instant, false);
      return;
    }

    const lay = computeBranchLayout(bCfg);

    if (activeBranch === "me") {
      const meLay = computeMeEditorialLayout(bCfg, lay);
      if (activeItem) {
        const mp = meLay.measuredProjects.find((p) => p.item.id === activeItem);
        if (mp) {
          if (isMobile) {
            fitWorldBox(
              mp.lvl2BoxLeft - 12,
              mp.lvl2BoxRight + 12,
              mp.lvl2TopY - 18,
              mp.lvl2TopY + mp.detailH + 22,
              72
            );
          } else {
            fitWorldBox(
              Math.min(mp.projLeft, meLay.vineX) - 20,
              mp.lvl2BoxRight + 22,
              Math.min(mp.topY, mp.lvl2TopY) - 26,
              Math.max(mp.topY + mp.blockH, mp.lvl2TopY + mp.detailH) + 26,
              74
            );
          }
          recordDefaultTargetAndApplyInstant(instant, false);
          return;
        }
      }

      if (isMobile) {
        const padX = 16;
        const padTop = 54;
        const boxW = Math.max(240, meLay.maxContentX - meLay.minContentX + 12);
        const z = clamp((vw - padX * 2) / boxW, 0.56, 1.08);
        targetCam.zoom = z;
        targetCam.x = (meLay.minContentX + meLay.maxContentX) * 0.5;
        targetCam.y = (meLay.bioTopY - 14) - (padTop - vh * 0.5) / z;
      } else {
        const sidePad = isCompactTablet ? 26 : 48;
        const topPad = 56;
        const minX = isCompactTablet ? Math.min(155, meLay.minContentX) : 85;
        const maxX = Math.max(910, meLay.maxContentX + 12);
        const zX = (vw - sidePad * 2) / Math.max(320, maxX - minX);
        const desiredSpanY = Math.max(540, meLay.projectsHeadingY + 130 - (meLay.bioTopY - 24));
        const zY = (vh - topPad - 64) / desiredSpanY;
        const z = clamp(Math.min(zX, Math.max(0.76, zY)), 0.58, 1.16);

        targetCam.zoom = z;
        targetCam.x = (minX + maxX) * 0.5;
        targetCam.y = (meLay.bioTopY - 22) - (topPad - vh * 0.5) / z;
      }

      recordDefaultTargetAndApplyInstant(instant, false);
      return;
    }

    if (activeItem) {
      const found = lay.measuredItems.find((m) => m.item.id === activeItem);
      if (found) {
        if (isMobile) {
          const minX = found.lvl2BoxLeft - 14;
          const maxX = found.lvl2BoxRight + 14;
          const minY = found.lvl2TopY - 20;
          const maxY = found.lvl2TopY + found.detailH + 20;
          fitWorldBox(minX, maxX, minY, maxY, 70);
        } else {
          const canopyHintX =
            activeBranch === "writing"
              ? -75
              : lay.dir < 0
                ? lay.tipX + 46
                : lay.tipX - 46;
          const minX = Math.min(found.textBoxLeft, found.lvl2BoxLeft, canopyHintX) - 20;
          const maxX = Math.max(found.textBoxRight, found.lvl2BoxRight, canopyHintX) + 20;
          const minY = Math.min(found.topY, found.lvl2TopY, bCfg.attachY - 24) - 26;
          const maxY = Math.min(
            -52,
            Math.max(found.topY + found.blockH, found.lvl2TopY + found.detailH) + 24
          );
          fitWorldBox(minX, maxX, minY, maxY, 74);
        }
        recordDefaultTargetAndApplyInstant(instant, false);
        return;
      }
    }

    ctx.font = canvasFont("600 15px", `${bCfg.label}.`);
    const openLabelW = ctx.measureText(`${bCfg.label}.`).width;
    const openCenterX = lay.tipX + lay.dir * (lay.boughSpan * 0.46);
    const openLabelLeft = openCenterX - openLabelW * 0.5;
    const openLabelRight = openCenterX + openLabelW * 0.5;

    let xs;
    let canopyAnchorY;
    if (isMobile) {
      canopyAnchorY = lay.tipY;
      xs = [
        lay.tipX,
        openLabelLeft - 6,
        openLabelRight + 6,
        lay.forkX,
        ...lay.measuredItems.map((m) => m.textBoxLeft - 6),
        ...lay.measuredItems.map((m) => m.textBoxRight + 6)
      ];
    } else {
      let canopyAnchorX;
      if (activeBranch === "work") {
        canopyAnchorX = -38;
        canopyAnchorY = -288;
      } else {
        canopyAnchorX = 28;
        canopyAnchorY = -125;
      }
      xs = [
        canopyAnchorX,
        bCfg.attachX,
        openLabelLeft,
        openLabelRight,
        lay.forkX,
        ...lay.measuredItems.map((m) => m.textBoxLeft),
        ...lay.measuredItems.map((m) => m.textBoxRight)
      ];
    }

    const minX = Math.min(...xs) - (isMobile ? 10 : 20);
    const maxX = Math.max(...xs) + (isMobile ? 10 : 20);
    const minY = Math.min(bCfg.attachY - 34, lay.topY - 24);
    const maxY = Math.min(-34, Math.max(canopyAnchorY, lay.bottomY + 18));
    fitWorldBox(minX, maxX, minY, maxY, isMobile ? 68 : 74);

    recordDefaultTargetAndApplyInstant(instant, false);
  }

  // =========================================================================
  // BOTANICAL LEAF-DAB, TEARDROP BUD, RISOGRAPH STIPPLE & OLIVE TREE ENGINE
  // =========================================================================
  function drawSoftOvalDab(g, x, y, rx, ry, angle) {
    g.save();
    g.translate(x, y);
    g.rotate(angle);
    g.beginPath();
    g.ellipse(0, 0, Math.max(0.6, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  // Filled botanical teardrop leaf bud (4.5px x 2.1px default) attached cleanly at base (0, 0)
  function drawTeardropBud(g, baseX, baseY, len, wid, angle, fillCol) {
    if (len <= 0.3 || wid <= 0.2) return;
    const hw = wid * 0.5;
    g.save();
    g.translate(baseX, baseY);
    g.rotate(angle);
    g.fillStyle = fillCol || CHALK;
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(len * 0.28, -hw * 1.12, len * 0.78, -hw * 0.92, len, 0);
    g.bezierCurveTo(len * 0.78, hw * 0.92, len * 0.28, hw * 1.12, 0, 0);
    g.closePath();
    g.fill();
    g.restore();
  }

  function catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    );
  }

  function fillGnarledWoodRibbon(g, cx, groundY, nodes, gnarlAmp, gnarlFreq, seed) {
    if (nodes.length < 2) return;
    const samples = [];
    const sub = 16;
    const totalSegs = nodes.length - 1;

    for (let s = 0; s < totalSegs; s++) {
      const n0 = nodes[Math.max(0, s - 1)];
      const n1 = nodes[s];
      const n2 = nodes[s + 1];
      const n3 = nodes[Math.min(nodes.length - 1, s + 2)];
      const count = s === totalSegs - 1 ? sub : sub - 1;

      for (let j = 0; j <= count; j++) {
        const lt = j / sub;
        const u = (s + lt) / totalSegs;
        const wx = catmullRom(n0.x, n1.x, n2.x, n3.x, lt);
        const wy = catmullRom(n0.y, n1.y, n2.y, n3.y, lt);
        const baseHw = Math.max(0.35, catmullRom(n0.hw, n1.hw, n2.hw, n3.hw, lt));
        const burl =
          1 +
          gnarlAmp *
            (0.6 * Math.sin(u * gnarlFreq + seed) +
              0.4 * Math.cos(u * gnarlFreq * 1.73 + seed * 1.9));
        samples.push({
          bx: cx + wx,
          by: groundY + wy,
          hw: baseHw * burl
        });
      }
    }

    const leftPts = [];
    const rightPts = [];
    for (let i = 0; i < samples.length; i++) {
      const prev = samples[Math.max(0, i - 1)];
      const next = samples[Math.min(samples.length - 1, i + 1)];
      let dx = next.bx - prev.bx;
      let dy = next.by - prev.by;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      const nx = -dy;
      const ny = dx;
      const p = samples[i];
      leftPts.push({ x: p.bx + nx * p.hw, y: p.by + ny * p.hw });
      rightPts.push({ x: p.bx - nx * p.hw, y: p.by - ny * p.hw });
    }

    g.beginPath();
    g.moveTo(leftPts[0].x, leftPts[0].y);
    for (let i = 1; i < leftPts.length; i++) {
      g.lineTo(leftPts[i].x, leftPts[i].y);
    }
    for (let i = rightPts.length - 1; i >= 0; i--) {
      g.lineTo(rightPts[i].x, rightPts[i].y);
    }
    g.closePath();
    g.fill();
  }

  function strokeBarkCurve(g, cx, groundY, pts, widthStart, widthEnd) {
    if (pts.length < 2) return;
    const steps = 28;
    const totalSegs = pts.length - 1;
    let prevX = cx + pts[0][0];
    let prevY = groundY + pts[0][1];

    for (let i = 1; i <= steps; i++) {
      const u = i / steps;
      const pos = u * totalSegs;
      const idx = Math.min(totalSegs - 1, Math.floor(pos));
      const lt = pos - idx;
      const p0 = pts[Math.max(0, idx - 1)];
      const p1 = pts[idx];
      const p2 = pts[idx + 1];
      const p3 = pts[Math.min(pts.length - 1, idx + 2)];
      const nx = cx + catmullRom(p0[0], p1[0], p2[0], p3[0], lt);
      const ny = groundY + catmullRom(p0[1], p1[1], p2[1], p3[1], lt);
      g.lineWidth = widthStart + (widthEnd - widthStart) * u;
      g.beginPath();
      g.moveTo(prevX, prevY);
      g.lineTo(nx, ny);
      g.stroke();
      prevX = nx;
      prevY = ny;
    }
  }

  function ensureLithoNoiseTables() {
    if (lithoNoiseTables) return lithoNoiseTables;
    const N = 256;
    const MASK = 255;
    const prng = mulberry32(19842026);

    const fineSalt = new Float32Array(N * N);
    const stippleUniform = new Float32Array(N * N);
    const edgeTooth = new Float32Array(N * N);

    for (let i = 0; i < N * N; i++) {
      fineSalt[i] = prng() * 2 - 1;
      stippleUniform[i] = prng();
      edgeTooth[i] = prng();
    }

    lithoNoiseTables = { N, MASK, fineSalt, stippleUniform, edgeTooth };
    return lithoNoiseTables;
  }

  // Calm, cohesive monochrome risograph stipple grain (±11 luminance + ~12% fine 1px dark stipple dots,
  // ZERO dark blotch worms or dirty patches — matching E3DDD94F!)
  function applyLithographGrain(canvasBuf, seedX, seedY, stippleDensity, lumSpanOverride) {
    if (!canvasBuf || typeof canvasBuf.getContext !== "function") return null;
    const W = canvasBuf.width;
    const H = canvasBuf.height;
    if (!W || !H) return null;
    const g = canvasBuf.getContext("2d");
    if (!g || typeof g.getImageData !== "function" || typeof g.putImageData !== "function") return null;

    let imgData;
    try {
      imgData = g.getImageData(0, 0, W, H);
    } catch (_) {
      return null;
    }
    if (!imgData || !imgData.data) return null;

    const data = imgData.data;
    const totalPx = W * H;
    const origA = new Uint8Array(totalPx);
    for (let i = 0; i < totalPx; i++) {
      origA[i] = data[i * 4 + 3];
    }

    const tables = ensureLithoNoiseTables();
    const MASK = tables.MASK;
    const fineSalt = tables.fineSalt;
    const stippleUniform = tables.stippleUniform;
    const edgeTooth = tables.edgeTooth;

    const INK_R = 13;
    const INK_G = 16;
    const INK_B = 22;

    const targetStippleRate = clamp((stippleDensity === undefined ? 1.0 : stippleDensity) * 0.12, 0.04, 0.28);
    const lumAmplitude = lumSpanOverride === undefined ? 11.0 : lumSpanOverride;

    let opaquePixels = 0;
    let erodedEdgePixels = 0;
    let stippleDotPixels = 0;
    let lumSum = 0;
    let lumSqSum = 0;

    for (let y = 0; y < H; y++) {
      const rowOff = y * W;
      const ny = (y + seedY) & MASK;
      const yUp1 = y > 0 ? y - 1 : 0;
      const yDn1 = y < H - 1 ? y + 1 : H - 1;

      for (let x = 0; x < W; x++) {
        const pIdx = rowOff + x;
        const a0 = origA[pIdx];
        if (a0 === 0) continue;

        const nx = (x + seedX) & MASK;
        const tIdx = (ny << 8) + nx;
        const bn = blueNoise2D(x + seedX * 3, y + seedY * 5);

        const xLt1 = x > 0 ? x - 1 : 0;
        const xRt1 = x < W - 1 ? x + 1 : W - 1;
        const minN1 = Math.min(
          origA[yUp1 * W + x],
          origA[yDn1 * W + x],
          origA[rowOff + xLt1],
          origA[rowOff + xRt1]
        );

        let newA = a0;
        // Subtle 1px letterpress paper-tooth along outer contour
        if (minN1 < 210) {
          const tooth = 0.55 * edgeTooth[tIdx] + 0.45 * bn;
          if (tooth < 0.24) {
            newA = Math.round(newA * clamp(tooth * 2.6, 0, 0.58));
            erodedEdgePixels++;
          }
        }

        const off4 = pIdx * 4;
        if (newA <= 6) {
          data[off4 + 3] = 0;
          continue;
        }
        data[off4 + 3] = newA;

        // Cohesive ±11 monochrome luminance grain
        const jitter = fineSalt[tIdx] * lumAmplitude;
        let outR = data[off4] + jitter;
        let outG = data[off4 + 1] + jitter;
        let outB = data[off4 + 2] + jitter;

        // ~12% fine single-pixel dark stipple dots (blue-noise + uniform hash so zero clumping!)
        const stippleScore = 0.62 * bn + 0.38 * stippleUniform[tIdx];
        if (stippleScore < targetStippleRate) {
          const dotStrength = 0.24 + (1 - stippleScore / targetStippleRate) * 0.22;
          outR = outR + (INK_R - outR) * dotStrength;
          outG = outG + (INK_G - outG) * dotStrength;
          outB = outB + (INK_B - outB) * dotStrength;
          stippleDotPixels++;
        }

        // Clamp strictly below pure white (#E6E9EF max, centered on archival #C8CBD2)
        const cR = clamp(Math.round(outR), 0, 230);
        const cG = clamp(Math.round(outG), 0, 233);
        const cB = clamp(Math.round(outB), 0, 239);
        data[off4] = cR;
        data[off4 + 1] = cG;
        data[off4 + 2] = cB;

        opaquePixels++;
        const lum = cR * 0.299 + cG * 0.587 + cB * 0.114;
        lumSum += lum;
        lumSqSum += lum * lum;
      }
    }

    try {
      g.putImageData(imgData, 0, 0);
    } catch (_) {}

    const meanLum = opaquePixels > 0 ? lumSum / opaquePixels : 0;
    const variance = opaquePixels > 0 ? Math.max(0, lumSqSum / opaquePixels - meanLum * meanLum) : 0;
    return {
      width: W,
      height: H,
      opaquePixels,
      erodedEdgePixels,
      stippleDotPixels,
      stippleRatio: opaquePixels > 0 ? stippleDotPixels / opaquePixels : 0,
      meanLuminance: meanLum,
      luminanceStdDev: Math.sqrt(variance)
    };
  }

  // Generate 256x256 top-layer viewport grain + 128x128 high-DPI capsule stipple grain tile
  function initViewportGrain() {
    if (typeof document === "undefined") return;
    const TILE = 256;
    const tile = document.createElement("canvas");
    tile.width = TILE;
    tile.height = TILE;
    const tg = tile.getContext("2d");
    if (tg && typeof tg.getImageData === "function" && typeof tg.putImageData === "function") {
      let img = null;
      try {
        img = tg.createImageData ? tg.createImageData(TILE, TILE) : tg.getImageData(0, 0, TILE, TILE);
      } catch (_) {}
      if (img && img.data) {
        const px = img.data;
        const prng = mulberry32(9021077);
        for (let i = 0; i < TILE * TILE; i++) {
          const sp = (prng() - 0.5) * 184;
          const v = clamp(Math.round(128 + sp), 0, 255);
          const o = i * 4;
          px[o] = v;
          px[o + 1] = v;
          px[o + 2] = v;
          px[o + 3] = 255;
        }
        try {
          tg.putImageData(img, 0, 0);
        } catch (_) {}
        grainTileCanvas = tile;
        if (ctx && typeof ctx.createPattern === "function") {
          try {
            grainPattern = ctx.createPattern(tile, "repeat");
          } catch (_) {}
        }
        filmGrainAppliedToDom = false;
        if (filmGrainEl && typeof tile.toDataURL === "function") {
          try {
            const uri = tile.toDataURL("image/png");
            if (uri && uri.indexOf("data:image/") === 0) {
              filmGrainEl.style.backgroundImage = `url("${uri}")`;
              filmGrainAppliedToDom = true;
            }
          } catch (_) {}
        }
      }
    }

    // High-DPI 128x128 stipple grain tile (fine dark rgba(0,20,42,0.22) + light rgba(235,240,248,0.20) 1px speckles)
    const PTILE = 128;
    const pCanvas = document.createElement("canvas");
    pCanvas.width = PTILE;
    pCanvas.height = PTILE;
    const pg = pCanvas.getContext("2d");
    if (pg && typeof pg.getImageData === "function" && typeof pg.putImageData === "function") {
      let pImg = null;
      try {
        pImg = pg.createImageData ? pg.createImageData(PTILE, PTILE) : pg.getImageData(0, 0, PTILE, PTILE);
      } catch (_) {}
      if (pImg && pImg.data) {
        const pData = pImg.data;
        const pPrng = mulberry32(20261118);
        for (let i = 0; i < PTILE * PTILE; i++) {
          const r = pPrng();
          const o = i * 4;
          if (r < 0.24) {
            pData[o] = 13;
            pData[o + 1] = 16;
            pData[o + 2] = 22;
            pData[o + 3] = 58; // #0D1016 Prussian-soot speckle
          } else if (r < 0.45) {
            pData[o] = 223;
            pData[o + 1] = 226;
            pData[o + 2] = 232;
            pData[o + 3] = 52; // #DFE2E8 silver-bone speckle (zero pure-white)
          } else if (r < 0.56) {
            pData[o] = 13;
            pData[o + 1] = 16;
            pData[o + 2] = 22;
            pData[o + 3] = 26;
          } else {
            pData[o + 3] = 0;
          }
        }
        try {
          pg.putImageData(pImg, 0, 0);
          const pUri = typeof pCanvas.toDataURL === "function" ? pCanvas.toDataURL("image/png") : "";
          if (pUri && pUri.indexOf("data:image/") === 0) {
            pillStippleDataUri = pUri;
            [musicPill, musicPlaylist, btnBack].forEach((el) => {
              if (el && el.style) {
                el.style.backgroundImage = `url("${pUri}")`;
              }
            });
          }
        } catch (_) {}
      }
    }
  }

  // Cohesive Palestinian Olive Tree with braided trunk strands separated by real transparent sky channels,
  // soft rounded/oval botanical leaf-dabs (2.5px-8px), natural internal sky gaps, detached 2px-5px rounded
  // outer leaf-flecks, and precomputed path-distance stipple reveal thresholds `treeGrowAt`!
  function initTreeBuffer(rand) {
    const w = TREE_W;
    const bufH = TREE_BUF_H;
    const groundY = TREE_H;
    const cx = w * 0.5;
    const W = Math.floor(w * BUF_SCALE);
    const H = Math.floor(bufH * BUF_SCALE);

    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const g = off.getContext("2d");
    g.scale(BUF_SCALE, BUF_SCALE);

    const baseWood = CHALK_TREE; // #C4C8D2
    const softHighlight = "#CACED8";
    const softShade = "#BEC3CE";

    const canopyClusters = [
      // Upper crown billows
      { wx: -4, wy: -522, rx: 56, ry: 33, d: 280, fg: false },
      { wx: -66, wy: -500, rx: 55, ry: 34, d: 290, fg: false },
      { wx: 64, wy: -496, rx: 56, ry: 34, d: 290, fg: false },
      { wx: 0, wy: -474, rx: 48, ry: 29, d: 230, fg: true },

      // Upper-mid lateral billows (with natural sky gaps around [-35,-420] & [+42,-415])
      { wx: -118, wy: -450, rx: 52, ry: 33, d: 300, fg: false },
      { wx: -56, wy: -446, rx: 44, ry: 28, d: 220, fg: true },
      { wx: 58, wy: -442, rx: 44, ry: 28, d: 220, fg: true },
      { wx: 120, wy: -434, rx: 53, ry: 34, d: 300, fg: false },

      // Mid-wide olive crown billows
      { wx: -160, wy: -386, rx: 54, ry: 33, d: 310, fg: false },
      { wx: -98, wy: -392, rx: 46, ry: 29, d: 240, fg: true },
      { wx: -2, wy: -404, rx: 42, ry: 26, d: 205, fg: false },
      { wx: 96, wy: -386, rx: 47, ry: 30, d: 245, fg: true },
      { wx: 162, wy: -378, rx: 54, ry: 34, d: 310, fg: false },

      // Lower-canopy billowing lobes (with airy internal sky windows showing scaffold boughs)
      { wx: -144, wy: -332, rx: 46, ry: 28, d: 270, fg: true },
      { wx: -96, wy: -316, rx: 40, ry: 25, d: 215, fg: false },
      { wx: -44, wy: -352, rx: 36, ry: 22, d: 185, fg: false },
      { wx: 46, wy: -348, rx: 36, ry: 22, d: 185, fg: false },
      { wx: 98, wy: -312, rx: 41, ry: 25, d: 220, fg: false },
      { wx: 140, wy: -314, rx: 46, ry: 28, d: 275, fg: true },

      // Delicate lower skirt clusters
      { wx: -128, wy: -286, rx: 34, ry: 21, d: 190, fg: true },
      { wx: 126, wy: -280, rx: 35, ry: 21, d: 195, fg: true }
    ];

    function drawBotanicalLeafCluster(c) {
      const bx = cx + c.wx;
      const by = groundY + c.wy;
      const p1 = rand() * Math.PI * 2;
      const p2 = rand() * Math.PI * 2;

      // 1. Cohesive soft botanical sub-billows (overlapping rounded oval pads, zero harsh geometric lines)
      const subLobes = 5;
      for (let s = 0; s < subLobes; s++) {
        const ang = (s / subLobes) * Math.PI * 2 + p1 * 0.35;
        const offR = 0.28 + rand() * 0.22;
        const sx = bx + Math.cos(ang) * c.rx * offR;
        const sy = by + Math.sin(ang) * c.ry * offR * 0.9;
        g.fillStyle = baseWood;
        drawSoftOvalDab(
          g,
          sx,
          sy,
          c.rx * (0.48 + rand() * 0.14),
          c.ry * (0.48 + rand() * 0.14),
          (rand() - 0.5) * 0.45
        );
      }

      // 2. Dense overlapping soft rounded/oval botanical leaf-dabs (2.5px - 8.0px diameter, zero spiky needles!)
      for (let i = 0; i < c.d; i++) {
        const th = rand() * Math.PI * 2;
        const sinT = Math.sin(th);
        const domeSquash = sinT > 0 ? 0.84 : 0.98;
        const lobeMod =
          1 +
          0.14 * Math.sin(th * 4 + p1) +
          0.10 * Math.cos(th * 7 + p2);
        const dist = 0.32 + Math.pow(rand(), 0.58) * 0.68;
        const lx = bx + Math.cos(th) * c.rx * lobeMod * dist;
        const ly = by + sinT * c.ry * lobeMod * dist * domeSquash;

        // Diameter 2.5px - 8.0px -> semi-axes rx = 1.25..4.0, ry = rx * (0.64..0.88)
        const dabDiam = 2.5 + rand() * 5.5;
        const dabRx = dabDiam * 0.5;
        const dabRy = dabRx * (0.64 + rand() * 0.24);
        const dabAng = (rand() - 0.5) * Math.PI;

        const tonePick = rand();
        g.fillStyle = tonePick < 0.72 ? baseWood : (tonePick < 0.88 ? softHighlight : softShade);
        drawSoftOvalDab(g, lx, ly, dabRx, dabRy, dabAng);
      }

      // 3. Delicate detached 2px - 5px rounded leaf-flecks floating organically outside outer perimeter
      const fleckCount = Math.floor(24 + c.rx * 0.42);
      for (let f = 0; f < fleckCount; f++) {
        const th = rand() * Math.PI * 2;
        const sinT = Math.sin(th);
        const domeSquash = sinT > 0 ? 0.84 : 0.98;
        const lobeMod =
          1 +
          0.14 * Math.sin(th * 4 + p1) +
          0.10 * Math.cos(th * 7 + p2);
        const radial = 0.96 + Math.pow(rand(), 0.75) * 0.20;
        const fx = bx + Math.cos(th) * c.rx * lobeMod * radial;
        const fy = by + sinT * c.ry * lobeMod * radial * domeSquash;

        // Detached 2px - 5px rounded fleck -> semi-axes 1.0..2.5 x 0.8..2.0
        const fleckDiam = 2.0 + rand() * 3.0;
        const fRx = fleckDiam * 0.5;
        const fRy = fRx * (0.68 + rand() * 0.24);
        g.fillStyle = rand() < 0.78 ? baseWood : softHighlight;
        drawSoftOvalDab(g, fx, fy, fRx, fRy, rand() * Math.PI);
      }
    }

    // Step A: Draw gnarled braided Palestinian Olive trunk cords & sweeping boughs first onto a clean wood layer
    // so we capture exact wood pixel mask AND keep genuine transparent sky channels between braided trunk strands!
    g.fillStyle = baseWood;

    // 4 distinct braided Palestinian Olive trunk strands separated by real transparent sky channels (zero cartoon dark strokes!)
    const braidedTrunkStrands = [
      // Left outer ancient cord
      [
        { x: -38, y: 3, hw: 10.5 },
        { x: -29, y: -26, hw: 8.6 },
        { x: -24, y: -66, hw: 7.4 },
        { x: -29, y: -112, hw: 7.2 },
        { x: -22, y: -162, hw: 6.8 },
        { x: -24, y: -210, hw: 7.8 }
      ],
      // Left-inner weaving cord (leaves a clean 5-9px transparent sky channel next to left outer & right-inner cords!)
      [
        { x: -14, y: 3, hw: 9.2 },
        { x: -11, y: -32, hw: 7.0 },
        { x: -10, y: -78, hw: 6.2 },
        { x: -14, y: -128, hw: 6.0 },
        { x: -7, y: -176, hw: 6.4 },
        { x: -8, y: -222, hw: 7.2 }
      ],
      // Right-inner weaving cord (leaves central ancient olive sky hollow from wy -22 to -192!)
      [
        { x: 13, y: 3, hw: 9.4 },
        { x: 10, y: -34, hw: 7.2 },
        { x: 7, y: -82, hw: 6.4 },
        { x: 9, y: -132, hw: 6.2 },
        { x: 8, y: -178, hw: 6.5 },
        { x: 9, y: -222, hw: 7.4 }
      ],
      // Right outer ancient cord
      [
        { x: 37, y: 3, hw: 10.8 },
        { x: 28, y: -28, hw: 8.5 },
        { x: 22, y: -72, hw: 7.2 },
        { x: 25, y: -122, hw: 7.4 },
        { x: 24, y: -170, hw: 7.0 },
        { x: 25, y: -210, hw: 8.0 }
      ],
      // Organic diagonal wood bridge weaving two cords at crown collar (wy -196..-226)
      [
        { x: -18, y: -194, hw: 6.2 },
        { x: 0, y: -214, hw: 7.8 },
        { x: 18, y: -196, hw: 6.2 }
      ]
    ];

    for (let s = 0; s < braidedTrunkStrands.length; s++) {
      fillGnarledWoodRibbon(g, cx, groundY, braidedTrunkStrands[s], 0.08, 10.0, s * 2.9 + 1.1);
    }

    // Flared surface root buttresses anchoring into soil
    const surfaceRoots = [
      [
        { x: -34, y: -24, hw: 7.6 },
        { x: -52, y: -8, hw: 5.4 },
        { x: -74, y: 2, hw: 2.8 }
      ],
      [
        { x: -15, y: -22, hw: 6.2 },
        { x: -27, y: -5, hw: 4.4 },
        { x: -38, y: 3, hw: 2.4 }
      ],
      [
        { x: 15, y: -22, hw: 6.2 },
        { x: 28, y: -5, hw: 4.4 },
        { x: 40, y: 3, hw: 2.4 }
      ],
      [
        { x: 34, y: -24, hw: 7.8 },
        { x: 54, y: -8, hw: 5.4 },
        { x: 76, y: 2, hw: 2.8 }
      ]
    ];
    for (let r = 0; r < surfaceRoots.length; r++) {
      fillGnarledWoodRibbon(g, cx, groundY, surfaceRoots[r], 0.08, 9.0, r * 2.3 + 4.1);
    }

    // Cohesive sweeping olive scaffold limbs (zero dark stroke outlines inside!)
    const scaffoldLimbs = [
      [
        { x: -23, y: -206, hw: 8.6 },
        { x: -62, y: -236, hw: 6.2 },
        { x: -96, y: -268, hw: 4.4 },
        { x: -128, y: -294, hw: 2.8 },
        { x: -146, y: -318, hw: 1.6 }
      ],
      [
        { x: -15, y: -218, hw: 7.8 },
        { x: -46, y: -266, hw: 5.6 },
        { x: -68, y: -322, hw: 3.9 },
        { x: -90, y: -378, hw: 2.5 },
        { x: -116, y: -434, hw: 1.4 }
      ],
      [
        { x: -7, y: -222, hw: 6.8 },
        { x: -22, y: -282, hw: 4.6 },
        { x: -14, y: -344, hw: 3.1 },
        { x: -30, y: -406, hw: 1.9 },
        { x: -42, y: -462, hw: 1.1 }
      ],
      [
        { x: 8, y: -222, hw: 6.8 },
        { x: 21, y: -280, hw: 4.6 },
        { x: 12, y: -340, hw: 3.1 },
        { x: 26, y: -402, hw: 1.9 },
        { x: 38, y: -460, hw: 1.1 }
      ],
      [
        { x: 16, y: -218, hw: 7.8 },
        { x: 50, y: -264, hw: 5.6 },
        { x: 74, y: -318, hw: 3.9 },
        { x: 96, y: -374, hw: 2.5 },
        { x: 122, y: -426, hw: 1.4 }
      ],
      [
        { x: 24, y: -206, hw: 8.6 },
        { x: 66, y: -234, hw: 6.2 },
        { x: 100, y: -264, hw: 4.4 },
        { x: 130, y: -288, hw: 2.8 },
        { x: 148, y: -308, hw: 1.6 }
      ]
    ];
    for (let i = 0; i < scaffoldLimbs.length; i++) {
      fillGnarledWoodRibbon(g, cx, groundY, scaffoldLimbs[i], 0.075, 10.0, i * 1.9 + 7.2);
    }

    const secondaryForks = [
      [{ x: -92, y: -264, hw: 3.1 }, { x: -112, y: -312, hw: 2.0 }, { x: -134, y: -348, hw: 1.1 }],
      [{ x: -60, y: -236, hw: 3.0 }, { x: -76, y: -284, hw: 1.9 }, { x: -94, y: -322, hw: 1.1 }],
      [{ x: -68, y: -322, hw: 2.8 }, { x: -104, y: -356, hw: 1.8 }, { x: -136, y: -378, hw: 1.0 }],
      [{ x: -15, y: -332, hw: 2.5 }, { x: 2, y: -378, hw: 1.6 }, { x: -4, y: -492, hw: 1.0 }],
      [{ x: 72, y: -318, hw: 2.8 }, { x: 108, y: -350, hw: 1.8 }, { x: 140, y: -372, hw: 1.0 }],
      [{ x: 98, y: -260, hw: 3.1 }, { x: 116, y: -306, hw: 2.0 }, { x: 138, y: -342, hw: 1.1 }],
      [{ x: 64, y: -234, hw: 3.0 }, { x: 80, y: -280, hw: 1.9 }, { x: 96, y: -316, hw: 1.1 }]
    ];
    for (let i = 0; i < secondaryForks.length; i++) {
      fillGnarledWoodRibbon(g, cx, groundY, secondaryForks[i], 0.06, 8.0, i * 2.7 + 13.0);
    }

    // Record wood pixel mask before compositing foliage clusters
    let woodMask = null;
    try {
      const wData = g.getImageData(0, 0, W, H).data;
      woodMask = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) {
        if (wData[i * 4 + 3] > 20) woodMask[i] = 1;
      }
    } catch (_) {}

    // Step B: Draw background canopy billows BEHIND the wood boughs so boughs peek naturally through sky windows,
    // then draw foreground canopy billows OVER upper bough tips!
    g.globalCompositeOperation = "destination-over";
    for (const c of canopyClusters) {
      if (!c.fg) drawBotanicalLeafCluster(c);
    }

    g.globalCompositeOperation = "source-over";
    for (const c of canopyClusters) {
      if (c.fg) drawBotanicalLeafCluster(c);
    }

    // Carve a few organic soft oval sky-pockets inside the crown (using soft ovals, NEVER spiky needles!)
    g.globalCompositeOperation = "destination-out";
    g.fillStyle = "#000000";
    const softSkyGaps = [
      { wx: -36, wy: -304, rx: 18, ry: 11, n: 26 },
      { wx: 36, wy: -300, rx: 18, ry: 11, n: 26 },
      { wx: 0, wy: -334, rx: 15, ry: 10, n: 22 },
      { wx: -52, wy: -404, rx: 14, ry: 8, n: 18 },
      { wx: 54, wy: -400, rx: 14, ry: 8, n: 18 },
      { wx: 18, wy: -456, rx: 11, ry: 7, n: 14 }
    ];
    for (const gap of softSkyGaps) {
      const gx = cx + gap.wx;
      const gy = groundY + gap.wy;
      for (let i = 0; i < gap.n; i++) {
        const th = rand() * Math.PI * 2;
        const d = Math.pow(rand(), 0.65);
        const px = gx + Math.cos(th) * gap.rx * d;
        const py = gy + Math.sin(th) * gap.ry * d;
        // Do not erase main scaffold boughs inside sky windows!
        const bPx = clamp(Math.round(px * BUF_SCALE), 0, W - 1);
        const bPy = clamp(Math.round(py * BUF_SCALE), 0, H - 1);
        if (woodMask && woodMask[bPy * W + bPx]) continue;
        drawSoftOvalDab(g, px, py, 2.2 + rand() * 2.4, 1.6 + rand() * 1.8, rand() * Math.PI);
      }
    }
    g.globalCompositeOperation = "source-over";

    // Step C: Apply calm, cohesive monochrome risograph stipple grain (±11 lum + ~12% fine 1px dark stipple dots)
    treeGrainStats = applyLithographGrain(off, 17, 29, 1.0, 11.0);
    treeBuffer = off;

    // Step D: Precompute botanical growth-order threshold `treeGrowAt[y * W + x] ∈ [0, 1]`
    // from trunk root `(W/2, H - 15)` upward along trunk (`0.0 -> 0.32`), along boughs (`0.28 -> 0.58`),
    // and radially into foliage clusters (`0.50 -> 0.88`) + `0.12 * blueNoise(x, y)`!
    try {
      const finalImg = g.getImageData(0, 0, W, H);
      treeFinalRGBA = new Uint8ClampedArray(finalImg.data);
      treeGrowAt = new Float32Array(W * H);
      treeGrowBuckets = Array.from({ length: 256 }, () => []);

      const rootBufX = W * 0.5;
      const rootBufY = H - 15;

      for (let y = 0; y < H; y++) {
        const rowOff = y * W;
        const wy = y / BUF_SCALE - groundY;
        for (let x = 0; x < W; x++) {
          const pIdx = rowOff + x;
          if (treeFinalRGBA[pIdx * 4 + 3] === 0) {
            treeGrowAt[pIdx] = 2.0;
            continue;
          }
          const wx = x / BUF_SCALE - cx;
          const isWoodPx = woodMask ? woodMask[pIdx] === 1 : wy > -215;
          let baseOrder;

          if (wy > -216 && isWoodPx) {
            // Trunk: upward path distance from root `(W/2, H - 15)` -> [0.00 .. 0.32]
            const dyRoot = Math.max(0, (rootBufY - y) / BUF_SCALE);
            baseOrder = clamp(dyRoot / 218, 0, 1) * 0.32;
          } else if (isWoodPx && wy > -445) {
            // Sweeping boughs: outward path distance from trunk collar `(0, -212)` -> [0.28 .. 0.58]
            const dFork = Math.hypot(wx, wy + 212);
            baseOrder = 0.28 + clamp(dFork / 250, 0, 1) * 0.30;
          } else {
            // Foliage crown clusters: bough reach + radial cluster expansion -> [0.50 .. 0.88]
            let minNormR = 1.35;
            for (let ci = 0; ci < canopyClusters.length; ci++) {
              const cl = canopyClusters[ci];
              const nr = Math.hypot((wx - cl.wx) / cl.rx, (wy - cl.wy) / cl.ry);
              if (nr < minNormR) minNormR = nr;
            }
            const rNorm = clamp(minNormR / 1.22, 0, 1);
            const crownDist = clamp(Math.hypot(wx * 0.85, wy + 245) / 320, 0, 1);
            baseOrder = 0.50 + (0.42 * crownDist + 0.58 * rNorm) * 0.38;
          }

          const gVal = clamp(baseOrder + 0.12 * blueNoise2D(x, y), 0.001, 1.0);
          treeGrowAt[pIdx] = gVal;
          const bIdx = Math.min(255, Math.floor(gVal * 255));
          treeGrowBuckets[bIdx].push(pIdx);
        }
      }

      treeAnimBuffer = document.createElement("canvas");
      treeAnimBuffer.width = W;
      treeAnimBuffer.height = H;
      treeAnimCtx = treeAnimBuffer.getContext("2d");
      if (treeAnimCtx && typeof treeAnimCtx.createImageData === "function") {
        treeAnimImgData = treeAnimCtx.createImageData(W, H);
      }
      lastAnimBucket = -1;
    } catch (_) {
      treeAnimBuffer = null;
    }

    return off;
  }

  function updateTreeAnimBuffer(progress) {
    if (!treeAnimBuffer || !treeAnimCtx || !treeAnimImgData || !treeFinalRGBA || !treeGrowBuckets) {
      return;
    }
    const p = clamp(progress, 0, 1);
    if (p >= 1) return;

    const targetBucket = Math.min(255, Math.floor(p * 255));
    const dst = treeAnimImgData.data;

    if (targetBucket < lastAnimBucket) {
      dst.fill(0);
      lastAnimBucket = -1;
    }
    if (targetBucket === lastAnimBucket) return;

    for (let b = lastAnimBucket + 1; b <= targetBucket; b++) {
      const bucket = treeGrowBuckets[b];
      for (let i = 0; i < bucket.length; i++) {
        const off4 = bucket[i] * 4;
        dst[off4] = treeFinalRGBA[off4];
        dst[off4 + 1] = treeFinalRGBA[off4 + 1];
        dst[off4 + 2] = treeFinalRGBA[off4 + 2];
        dst[off4 + 3] = treeFinalRGBA[off4 + 3];
      }
    }
    lastAnimBucket = targetBucket;
    try {
      treeAnimCtx.putImageData(treeAnimImgData, 0, 0);
    } catch (_) {}
  }

  // Build stippled rounded underground river boulder sprite (#B8BCC6 + diagonal dark crack line matching 9AA84C5A)
  function createRiverBoulderSprite(wWorld, hWorld, crackAngle, seed) {
    const pad = 6;
    const cw = Math.ceil((wWorld + pad * 2) * BUF_SCALE);
    const ch = Math.ceil((hWorld + pad * 2) * BUF_SCALE);
    const bCan = document.createElement("canvas");
    bCan.width = cw;
    bCan.height = ch;
    const bg = bCan.getContext("2d");
    bg.scale(BUF_SCALE, BUF_SCALE);

    const rLocal = mulberry32(seed);
    const cx = (wWorld + pad * 2) * 0.5;
    const cy = (hWorld + pad * 2) * 0.5;
    const rx = wWorld * 0.5;
    const ry = hWorld * 0.5;

    // Smooth organic rounded river-boulder silhouette
    bg.fillStyle = RIVER_BOULDER; // #B8BCC6
    bg.beginPath();
    const steps = 40;
    const p1 = rLocal() * Math.PI * 2;
    const p2 = rLocal() * Math.PI * 2;
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * Math.PI * 2;
      const mod = 1 + 0.065 * Math.sin(th * 3 + p1) + 0.035 * Math.cos(th * 5 + p2);
      const px = cx + Math.cos(th) * rx * mod;
      const py = cy + Math.sin(th) * ry * mod;
      if (i === 0) bg.moveTo(px, py);
      else bg.lineTo(px, py);
    }
    bg.closePath();
    bg.fill();

    // Rich lithographic river-stone stipple pepper
    applyLithographGrain(bCan, (seed * 13) & 255, (seed * 29) & 255, 1.55, 13.0);

    // Crisp dark diagonal crack fissure across boulder face (matching 9AA84C5A!)
    bg.save();
    bg.translate(cx, cy + ry * 0.14);
    bg.rotate(crackAngle);
    bg.fillStyle = EARTH_CORE;
    const crackHalf = rx * 0.68;
    bg.beginPath();
    bg.moveTo(-crackHalf, 0.4);
    bg.quadraticCurveTo(-crackHalf * 0.15, -1.35, crackHalf * 0.85, -0.35);
    bg.quadraticCurveTo(0, 1.25, -crackHalf, 0.4);
    bg.closePath();
    bg.fill();
    bg.restore();

    return {
      canvas: bCan,
      drawW: wWorld + pad * 2,
      drawH: hWorld + pad * 2
    };
  }

  function buildBotanicalBuffers() {
    const rand = mulberry32(20261118);
    const chalk = CHALK_TREE;
    const shimmer = CHALK_BRIGHT;

    initTreeBuffer(rand);

    // =======================================================================
    // BRANCHING MATTE-CHALK PALESTINIAN OLIVE TREE UNDERGROUND ROOTS
    // =======================================================================
    const rOff = document.createElement("canvas");
    rOff.width = Math.floor(ROOTS_W * BUF_SCALE);
    rOff.height = Math.floor(ROOTS_H * BUF_SCALE);
    const rg = rOff.getContext("2d");
    rg.scale(BUF_SCALE, BUF_SCALE);

    const rcx = ROOTS_W * 0.5;
    const rGroundY = -ROOTS_TOP_WY;

    rg.fillStyle = chalk;
    rg.strokeStyle = chalk;
    rg.lineCap = "round";

    fillGnarledWoodRibbon(
      rg,
      rcx,
      rGroundY,
      [
        { x: -1, y: 0, hw: 34 },
        { x: 0, y: 9, hw: 24 },
        { x: 1, y: 18, hw: 14 }
      ],
      0.07,
      8.0,
      1.4
    );

    const primaryUndergroundRoots = [
      [{ x: -76, y: 2, hw: 3.4 }, { x: -120, y: 24, hw: 2.6 }, { x: -168, y: 56, hw: 1.9 }, { x: -208, y: 92, hw: 1.2 }, { x: -236, y: 124, hw: 0.5 }],
      [{ x: -54, y: 2, hw: 4.0 }, { x: -86, y: 36, hw: 2.9 }, { x: -126, y: 84, hw: 2.0 }, { x: -164, y: 136, hw: 1.2 }, { x: -192, y: 178, hw: 0.5 }],
      [{ x: -26, y: 3, hw: 4.8 }, { x: -44, y: 44, hw: 3.5 }, { x: -70, y: 102, hw: 2.4 }, { x: -90, y: 158, hw: 1.4 }, { x: -108, y: 204, hw: 0.5 }],
      [{ x: -9, y: 5, hw: 5.5 }, { x: -16, y: 52, hw: 4.0 }, { x: -25, y: 112, hw: 2.7 }, { x: -18, y: 168, hw: 1.5 }, { x: -27, y: 214, hw: 0.55 }],
      [{ x: 10, y: 5, hw: 5.5 }, { x: 18, y: 54, hw: 4.0 }, { x: 13, y: 114, hw: 2.7 }, { x: 25, y: 170, hw: 1.5 }, { x: 19, y: 215, hw: 0.55 }],
      [{ x: 26, y: 3, hw: 4.8 }, { x: 48, y: 42, hw: 3.5 }, { x: 76, y: 100, hw: 2.4 }, { x: 96, y: 156, hw: 1.4 }, { x: 114, y: 206, hw: 0.5 }],
      [{ x: 60, y: 2, hw: 4.0 }, { x: 94, y: 34, hw: 2.9 }, { x: 136, y: 82, hw: 2.0 }, { x: 172, y: 134, hw: 1.2 }, { x: 200, y: 180, hw: 0.5 }],
      [{ x: 80, y: 2, hw: 3.4 }, { x: 126, y: 24, hw: 2.6 }, { x: 176, y: 54, hw: 1.9 }, { x: 214, y: 90, hw: 1.2 }, { x: 238, y: 126, hw: 0.5 }]
    ];
    for (let i = 0; i < primaryUndergroundRoots.length; i++) {
      fillGnarledWoodRibbon(rg, rcx, rGroundY, primaryUndergroundRoots[i], 0.09, 10.0, i * 2.1 + 3.7);
    }

    const secondaryRootForks = [
      [{ x: -136, y: 32, hw: 1.9 }, { x: -158, y: 68, hw: 1.2 }, { x: -174, y: 104, hw: 0.45 }],
      [{ x: -182, y: 66, hw: 1.4 }, { x: -214, y: 74, hw: 0.9 }, { x: -236, y: 86, hw: 0.4 }],
      [{ x: -102, y: 52, hw: 2.0 }, { x: -116, y: 96, hw: 1.3 }, { x: -138, y: 142, hw: 0.45 }],
      [{ x: -56, y: 68, hw: 2.1 }, { x: -44, y: 118, hw: 1.3 }, { x: -58, y: 168, hw: 0.45 }],
      [{ x: 60, y: 64, hw: 2.1 }, { x: 48, y: 114, hw: 1.3 }, { x: 62, y: 164, hw: 0.45 }],
      [{ x: 110, y: 50, hw: 2.0 }, { x: 124, y: 94, hw: 1.3 }, { x: 146, y: 140, hw: 0.45 }],
      [{ x: 144, y: 32, hw: 1.9 }, { x: 164, y: 68, hw: 1.2 }, { x: 182, y: 106, hw: 0.45 }],
      [{ x: 188, y: 64, hw: 1.4 }, { x: 218, y: 72, hw: 0.9 }, { x: 239, y: 86, hw: 0.4 }]
    ];
    for (let i = 0; i < secondaryRootForks.length; i++) {
      fillGnarledWoodRibbon(rg, rcx, rGroundY, secondaryRootForks[i], 0.08, 9.0, i * 1.7 + 9.1);
    }

    const fineRootlets = [
      [[-208, 90], [-222, 114], [-228, 136]],
      [[-164, 134], [-154, 162], [-162, 186]],
      [[-100, 178], [-92, 200], [-98, 214]],
      [[106, 178], [98, 200], [104, 214]],
      [[170, 132], [160, 160], [168, 186]],
      [[212, 88], [226, 112], [232, 136]]
    ];
    rg.strokeStyle = chalk;
    for (const rl of fineRootlets) {
      strokeBarkCurve(rg, rcx, rGroundY, rl, 1.1, 0.45);
    }

    applyLithographGrain(rOff, 83, 141, 1.0, 11.0);
    rootsBuffer = rOff;

    // =======================================================================
    // SOFT ROUNDED LEAF-DAB SPRIG TUFT, MISTY CLOUD & MOSS BUFFERS
    // =======================================================================
    const tOff = document.createElement("canvas");
    tOff.width = 120;
    tOff.height = 120;
    const tg = tOff.getContext("2d");
    for (let i = 0; i < 95; i++) {
      const th = rand() * Math.PI * 2;
      const r = Math.pow(rand(), 0.58) * 30;
      const lx = 60 + Math.cos(th) * r;
      const ly = 60 + Math.sin(th) * r * 0.78;
      const diam = 3.2 + rand() * 4.2;
      tg.fillStyle = rand() < 0.28 ? shimmer : chalk;
      drawSoftOvalDab(tg, lx, ly, diam * 0.5, diam * 0.36, rand() * Math.PI);
    }
    applyLithographGrain(tOff, 53, 19, 1.0, 11.0);
    tuftBuffer = tOff;

    const mCloud = document.createElement("canvas");
    mCloud.width = 240;
    mCloud.height = 180;
    const mcg = mCloud.getContext("2d");
    mcg.save();
    mcg.translate(120, 90);
    mcg.scale(1, 0.7);
    const mGrad = mcg.createRadialGradient(0, 0, 6, 0, 0, 108);
    mGrad.addColorStop(0, "rgba(196, 200, 210, 0.24)");
    mGrad.addColorStop(0.55, "rgba(196, 200, 210, 0.09)");
    mGrad.addColorStop(1, "rgba(196, 200, 210, 0)");
    mcg.fillStyle = mGrad;
    mcg.beginPath();
    mcg.arc(0, 0, 108, 0, Math.PI * 2);
    mcg.fill();
    mcg.restore();

    for (let i = 0; i < 220; i++) {
      const th = rand() * Math.PI * 2;
      const r = Math.pow(rand(), 0.68);
      const px = 120 + Math.cos(th) * r * 92;
      const py = 90 + Math.sin(th) * r * 58;
      const alpha = (1 - r * 0.82) * (0.24 + rand() * 0.44);
      mcg.fillStyle = `rgba(198, 202, 210, ${alpha.toFixed(2)})`;
      const dr = 0.8 + rand() * 1.4;
      drawSoftOvalDab(mcg, px, py, dr * 1.2, dr * 0.9, rand() * Math.PI);
    }
    mistyCloudBuffer = mCloud;

    const msOff = document.createElement("canvas");
    msOff.width = Math.floor(MOSS_W * BUF_SCALE);
    msOff.height = Math.floor(MOSS_H * BUF_SCALE);
    const msg = msOff.getContext("2d");
    msg.scale(BUF_SCALE, BUF_SCALE);
    const mcx = MOSS_W * 0.5;
    const mgy = MOSS_H - 12;

    msg.save();
    msg.translate(mcx, mgy - 2);
    msg.scale(1, 0.36);
    const mossGlow = msg.createRadialGradient(0, 0, 4, 0, 0, 68);
    mossGlow.addColorStop(0, "rgba(196, 200, 210, 0.22)");
    mossGlow.addColorStop(0.55, "rgba(196, 200, 210, 0.07)");
    mossGlow.addColorStop(1, "rgba(196, 200, 210, 0)");
    msg.fillStyle = mossGlow;
    msg.beginPath();
    msg.arc(0, 0, 68, 0, Math.PI * 2);
    msg.fill();
    msg.restore();

    for (let i = 0; i < 320; i++) {
      const u = rand() + rand() - 1;
      const px = mcx + u * 64;
      const domeH = (1 - u * u) * 20;
      const py = mgy + 2 - Math.pow(rand(), 0.72) * (domeH + 4);
      const a = (1 - Math.abs(u) * 0.5) * (0.22 + rand() * 0.52);
      msg.fillStyle = `rgba(196, 200, 210, ${a.toFixed(2)})`;
      const r = 0.65 + rand() * 1.2;
      msg.beginPath();
      msg.arc(px, py, r, 0, Math.PI * 2);
      msg.fill();
    }
    mossBuffer = msOff;

    // =======================================================================
    // HILLSIDE LIMESTONE TERRACE STONES BUFFER
    // =======================================================================
    const sOff = document.createElement("canvas");
    sOff.width = Math.floor(TERRACE_W * BUF_SCALE);
    sOff.height = Math.floor(TERRACE_H * BUF_SCALE);
    const sg = sOff.getContext("2d");
    sg.scale(BUF_SCALE, BUF_SCALE);

    const scx = TERRACE_W * 0.5;
    const sGroundY = -TERRACE_TOP_WY;

    function drawLimestoneBlock(wx, wyBase, wStone, hStone, shade, bevelSeed) {
      const rLocal = mulberry32(bevelSeed);
      const sx = scx + wx;
      const sy = sGroundY + wyBase;
      const hw = wStone * 0.5;
      const pts = [
        [sx - hw, sy + 1.0],
        [sx - hw * (0.86 + rLocal() * 0.12), sy - hStone * (0.58 + rLocal() * 0.18)],
        [sx - hw * (0.36 + rLocal() * 0.22), sy - hStone * (0.95 + rLocal() * 0.08)],
        [sx + hw * (0.34 + rLocal() * 0.24), sy - hStone * (0.93 + rLocal() * 0.1)],
        [sx + hw * (0.88 + rLocal() * 0.1), sy - hStone * (0.54 + rLocal() * 0.2)],
        [sx + hw, sy + 1.0]
      ];
      sg.fillStyle = shade;
      sg.beginPath();
      sg.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) sg.lineTo(pts[i][0], pts[i][1]);
      sg.closePath();
      sg.fill();

      sg.strokeStyle = SHADOW_INK;
      sg.lineWidth = 1.2;
      sg.stroke();
    }

    sg.fillStyle = "#B8BCC6";
    sg.beginPath();
    sg.moveTo(scx - 165, sGroundY + 4.5);
    sg.quadraticCurveTo(scx - 85, sGroundY - 3.2, scx, sGroundY - 4.8);
    sg.quadraticCurveTo(scx + 88, sGroundY - 3.2, scx + 168, sGroundY + 4.5);
    sg.closePath();
    sg.fill();

    const terraceBlocks = [
      { wx: -206, wy: 3.2, w: 28, h: 12.5, c: "#B8BCC6", seed: 101 },
      { wx: -177, wy: 3.4, w: 33, h: 15.0, c: "#C8CBD2", seed: 102 },
      { wx: -144, wy: 3.2, w: 32, h: 14.2, c: "#BEC2CB", seed: 103 },
      { wx: -113, wy: 3.4, w: 29, h: 13.0, c: "#C8CBD2", seed: 105 },
      { wx: -87, wy: 3.6, w: 22, h: 9.5, c: "#B8BCC6", seed: 106 },
      { wx: -188, wy: -9.8, w: 24, h: 10.2, c: "#C8CBD2", seed: 108 },
      { wx: -158, wy: -10.2, w: 27, h: 11.4, c: "#C1C5CE", seed: 104 },
      { wx: -128, wy: -8.8, w: 23, h: 9.6, c: "#C8CBD2", seed: 109 },

      { wx: 89, wy: 3.6, w: 23, h: 9.8, c: "#B8BCC6", seed: 202 },
      { wx: 116, wy: 3.4, w: 30, h: 13.6, c: "#C8CBD2", seed: 203 },
      { wx: 148, wy: 3.2, w: 33, h: 14.8, c: "#BEC2CB", seed: 204 },
      { wx: 181, wy: 3.4, w: 32, h: 14.0, c: "#C8CBD2", seed: 206 },
      { wx: 210, wy: 3.2, w: 26, h: 11.5, c: "#B8BCC6", seed: 207 },
      { wx: 132, wy: -9.4, w: 25, h: 10.6, c: "#C8CBD2", seed: 205 },
      { wx: 164, wy: -10.0, w: 27, h: 11.2, c: "#C1C5CE", seed: 208 },
      { wx: 194, wy: -8.6, w: 22, h: 9.4, c: "#C8CBD2", seed: 209 }
    ];
    for (const st of terraceBlocks) {
      drawLimestoneBlock(st.wx, st.wy, st.w, st.h, st.c, st.seed);
    }

    applyLithographGrain(sOff, 151, 67, 1.1, 11.0);
    terraceBuffer = sOff;

    // =======================================================================
    // 7 STIPPLED #B8BCC6 UNDERGROUND RIVER BOULDERS WITH DARK DIAGONAL CRACKS
    // =======================================================================
    const boulderSpecs = [
      { wx: -288, wy: 142, w: 84, h: 54, crack: -0.28, rot: -0.08, seed: 701 },
      { wx: -142, wy: 178, w: 68, h: 44, crack: 0.24, rot: 0.06, seed: 702 },
      { wx: 76, wy: 152, w: 92, h: 58, crack: -0.26, rot: -0.05, seed: 703 },
      { wx: 204, wy: 162, w: 86, h: 54, crack: -0.29, rot: -0.07, seed: 704 },
      { wx: 1140, wy: 132, w: 74, h: 48, crack: 0.22, rot: 0.09, seed: 705 },
      { wx: 1310, wy: 168, w: 88, h: 56, crack: -0.25, rot: -0.04, seed: 706 },
      { wx: -446, wy: 156, w: 72, h: 46, crack: 0.27, rot: 0.05, seed: 707 }
    ];
    undergroundBoulders = boulderSpecs.map((spec) => {
      const spr = createRiverBoulderSprite(spec.w, spec.h, spec.crack, spec.seed);
      return {
        ...spec,
        sprite: spr.canvas,
        drawW: spr.drawW,
        drawH: spr.drawH
      };
    });

    // =======================================================================
    // 8 STIPPLED #C4C8D2 BOTANICAL LEAF-PUFF CLUSTERS FOR EXPERIENCE BOUGH
    // Exact same soft oval leaf-dab + monochrome risograph stipple grain as initTreeBuffer()!
    // =======================================================================
    const expRand = mulberry32(20262021);
    const softHighlight = "#CACED8";
    const softShade = "#BEC3CE";
    expLeafPuffBuffers = EXP_PUFF_SPECS.map((spec, pIdx) => {
      const pad = 12;
      const wWorld = spec.rx * 2 + pad * 2;
      const hWorld = spec.ry * 2 + pad * 2;
      const pCan = document.createElement("canvas");
      pCan.width = Math.ceil(wWorld * BUF_SCALE);
      pCan.height = Math.ceil(hWorld * BUF_SCALE);
      const pg = pCan.getContext("2d");
      pg.scale(BUF_SCALE, BUF_SCALE);

      const bx = wWorld * 0.5;
      const by = hWorld * 0.5;
      const p1 = expRand() * Math.PI * 2;
      const p2 = expRand() * Math.PI * 2;

      const subLobes = 5;
      for (let s = 0; s < subLobes; s++) {
        const ang = (s / subLobes) * Math.PI * 2 + p1 * 0.35;
        const offR = 0.26 + expRand() * 0.22;
        const sx = bx + Math.cos(ang) * spec.rx * offR;
        const sy = by + Math.sin(ang) * spec.ry * offR * 0.9;
        pg.fillStyle = CHALK_TREE;
        drawSoftOvalDab(
          pg,
          sx,
          sy,
          spec.rx * (0.46 + expRand() * 0.14),
          spec.ry * (0.46 + expRand() * 0.14),
          (expRand() - 0.5) * 0.45
        );
      }

      for (let i = 0; i < spec.d; i++) {
        const th = expRand() * Math.PI * 2;
        const sinT = Math.sin(th);
        const domeSquash = sinT > 0 ? 0.86 : 0.98;
        const lobeMod = 1 + 0.14 * Math.sin(th * 4 + p1) + 0.10 * Math.cos(th * 7 + p2);
        const dist = 0.28 + Math.pow(expRand(), 0.58) * 0.72;
        const lx = bx + Math.cos(th) * spec.rx * lobeMod * dist;
        const ly = by + sinT * spec.ry * lobeMod * dist * domeSquash;

        const dabDiam = (spec.rx < 24 ? 2.2 : 2.5) + expRand() * (spec.rx < 24 ? 4.2 : 5.3);
        const dabRx = dabDiam * 0.5;
        const dabRy = dabRx * (0.64 + expRand() * 0.24);
        const tonePick = expRand();
        pg.fillStyle = tonePick < 0.72 ? CHALK_TREE : tonePick < 0.88 ? softHighlight : softShade;
        drawSoftOvalDab(pg, lx, ly, dabRx, dabRy, (expRand() - 0.5) * Math.PI);
      }

      const fleckCount = Math.floor(16 + spec.rx * 0.42);
      for (let f = 0; f < fleckCount; f++) {
        const th = expRand() * Math.PI * 2;
        const sinT = Math.sin(th);
        const domeSquash = sinT > 0 ? 0.86 : 0.98;
        const lobeMod = 1 + 0.14 * Math.sin(th * 4 + p1) + 0.10 * Math.cos(th * 7 + p2);
        const radial = 0.95 + Math.pow(expRand(), 0.74) * 0.22;
        const fx = bx + Math.cos(th) * spec.rx * lobeMod * radial;
        const fy = by + sinT * spec.ry * lobeMod * radial * domeSquash;
        const fleckDiam = 1.9 + expRand() * 2.8;
        const fRx = fleckDiam * 0.5;
        const fRy = fRx * (0.68 + expRand() * 0.24);
        pg.fillStyle = expRand() < 0.78 ? CHALK_TREE : softHighlight;
        drawSoftOvalDab(pg, fx, fy, fRx, fRy, expRand() * Math.PI);
      }

      applyLithographGrain(pCan, (37 + pIdx * 29) & 255, (61 + pIdx * 43) & 255, 1.0, 11.0);
      return {
        ...spec,
        canvas: pCan,
        drawW: wWorld,
        drawH: hWorld
      };
    });
  }

  // =========================================================================
  // 45° ROTATED HALFTONE DOT-MATRIX + DECKLED ZINE EDGES + SERRATED TAPE ENGINE
  // Matches Screenshots AD403DDE & EEC92DFC 100%
  // =========================================================================
  function traceDeckledPaperPolygon(g, ox, oy, w, h, amp, seed) {
    const prng = mulberry32(seed);
    const stepPx = Math.max(3.5, Math.min(w, h) / 36);
    const nx = Math.max(16, Math.round(w / stepPx));
    const ny = Math.max(16, Math.round(h / stepPx));
    const ph1 = prng() * Math.PI * 2;
    const ph2 = prng() * Math.PI * 2;

    g.beginPath();
    // Top edge (left -> right)
    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const jit =
        (Math.sin(u * 29 + ph1) * 0.42 +
          Math.cos(u * 61 + ph2) * 0.31 +
          (prng() - 0.5) * 0.58) *
        amp;
      const px = ox + u * w;
      const py = oy + jit;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    // Right edge (top -> bottom)
    for (let j = 1; j <= ny; j++) {
      const v = j / ny;
      const jit =
        (Math.sin(v * 31 + ph2) * 0.42 +
          Math.cos(v * 57 + ph1) * 0.31 +
          (prng() - 0.5) * 0.58) *
        amp;
      g.lineTo(ox + w + jit, oy + v * h);
    }
    // Bottom edge (right -> left)
    for (let i = nx - 1; i >= 0; i--) {
      const u = i / nx;
      const jit =
        (Math.sin(u * 27 + ph1 * 1.4) * 0.42 +
          Math.cos(u * 53 + ph2 * 0.8) * 0.31 +
          (prng() - 0.5) * 0.58) *
        amp;
      g.lineTo(ox + u * w, oy + h + jit);
    }
    // Left edge (bottom -> top)
    for (let j = ny - 1; j >= 1; j--) {
      const v = j / ny;
      const jit =
        (Math.sin(v * 33 + ph2 * 1.3) * 0.42 +
          Math.cos(v * 59 + ph1 * 0.7) * 0.31 +
          (prng() - 0.5) * 0.58) *
        amp;
      g.lineTo(ox + jit, oy + v * h);
    }
    g.closePath();
  }

  function drawSerratedMaskingTape(g, cx, cy, tw, th, rotRad, seed, rimScale) {
    const tapePrng = mulberry32(seed);
    const s = rimScale || 1.0;
    const teeth = 5;
    const toothDepth = Math.max(2.6, th * 0.16);
    const topSegs = 12;

    function buildTapePath() {
      g.beginPath();
      // Top long edge (-tw/2 -> +tw/2)
      for (let i = 0; i <= topSegs; i++) {
        const u = i / topSegs;
        const x = -tw * 0.5 + u * tw;
        const y = -th * 0.5 + Math.sin(u * 13 + seed) * 0.55 * s;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      // Right serrated zig-zag torn end
      for (let t = 0; t < teeth; t++) {
        const yMid = -th * 0.5 + ((t + 0.5) / teeth) * th;
        const yNext = -th * 0.5 + ((t + 1) / teeth) * th;
        g.lineTo(tw * 0.5 + toothDepth * (0.72 + tapePrng() * 0.42), yMid);
        g.lineTo(tw * 0.5 - toothDepth * 0.25, yNext);
      }
      // Bottom long edge (+tw/2 -> -tw/2)
      for (let i = topSegs - 1; i >= 0; i--) {
        const u = i / topSegs;
        const x = -tw * 0.5 + u * tw;
        const y = th * 0.5 + Math.cos(u * 15 + seed * 0.7) * 0.55 * s;
        g.lineTo(x, y);
      }
      // Left serrated zig-zag torn end
      for (let t = teeth - 1; t >= 0; t--) {
        const yMid = -th * 0.5 + ((t + 0.5) / teeth) * th;
        const yPrev = -th * 0.5 + (t / teeth) * th;
        g.lineTo(-tw * 0.5 - toothDepth * (0.72 + tapePrng() * 0.42), yMid);
        g.lineTo(-tw * 0.5 + toothDepth * 0.25, yPrev);
      }
      g.closePath();
    }

    g.save();
    g.translate(cx, cy);
    g.rotate(rotRad);

    // Subtle lift shadow beneath tape
    g.save();
    g.shadowColor = "rgba(6, 8, 12, 0.62)";
    g.shadowBlur = 2.4 * s;
    g.shadowOffsetY = 1.2 * s;
    buildTapePath();
    g.fillStyle = "rgba(154, 159, 169, 0.86)"; // #9EA2AA grainy translucent masking tape
    g.fill();
    g.restore();

    // Dense salt-and-pepper risograph speckles clipped inside tape (#707580 / #9EA2AA / #C9CCD3)
    g.save();
    buildTapePath();
    g.clip();
    const grainDots = Math.floor((tw * th) / (2.3 * s));
    const grainSz = 1.45 * s;
    for (let d = 0; d < grainDots; d++) {
      const dx = (tapePrng() - 0.5) * (tw + toothDepth * 1.8);
      const dy = (tapePrng() - 0.5) * th;
      const pick = tapePrng();
      if (pick < 0.38) {
        g.fillStyle = "rgba(112, 117, 128, 0.82)"; // #707580 dark fiber speckle
      } else if (pick < 0.74) {
        g.fillStyle = "rgba(201, 204, 211, 0.80)"; // #C9CCD3 chalk speckle (zero pure-white)
      } else {
        g.fillStyle = "rgba(82, 87, 98, 0.66)"; // deep ink pore
      }
      g.fillRect(dx, dy, grainSz, grainSz);
    }
    g.restore();

    // Crisp 1.25px (scaled) dark ink outline around serrated perimeter (matching EEC92DFC & AD403DDE)
    buildTapePath();
    g.strokeStyle = "rgba(11, 14, 20, 0.94)";
    g.lineWidth = 1.25 * s;
    g.lineJoin = "round";
    g.stroke();

    g.restore();
  }

  function renderHalftoneZineBuffer(opts) {
    const {
      lumSampler,
      cardW,
      cardH,
      padX,
      padY,
      pitch,
      deckleAmp,
      seed,
      rimScale,
      tapes
    } = opts;
    const bufW = cardW + padX * 2;
    const bufH = cardH + padY * 2;
    const ox = padX;
    const oy = padY;
    const out = document.createElement("canvas");
    out.width = bufW;
    out.height = bufH;
    const g = out.getContext("2d");
    if (!g) return { canvas: out, dotCount: 0 };

    const s = rimScale || 1.0;

    // 1. Dark zine paper sheet (#171A21) with deckled torn perimeter + subtle relief shadow
    g.save();
    g.shadowColor = "rgba(5, 7, 11, 0.82)";
    g.shadowBlur = 5.5 * s;
    g.shadowOffsetX = 1.2 * s;
    g.shadowOffsetY = 2.4 * s;
    traceDeckledPaperPolygon(g, ox, oy, cardW, cardH, deckleAmp, seed);
    g.fillStyle = "#171A21";
    g.fill();
    g.restore();

    // 2. Clip strictly inside the deckled zine paper polygon and render 45°-rotated circular halftone dot-matrix
    let dotCount = 0;
    g.save();
    traceDeckledPaperPolygon(g, ox, oy, cardW, cardH, deckleAmp, seed);
    g.clip();

    const ang = Math.PI * 0.25; // Exact 45° halftone screen angle
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const diag = Math.ceil(Math.hypot(cardW, cardH) / pitch) + 2;

    for (let gi = -diag; gi <= diag; gi++) {
      for (let gj = -diag; gj <= diag; gj++) {
        const u = gi * pitch;
        const v = gj * pitch;
        const px = cardW * 0.5 + u * ca - v * sa;
        const py = cardH * 0.5 + u * sa + v * ca;
        if (px < -pitch || px > cardW + pitch || py < -pitch || py > cardH + pitch) {
          continue;
        }
        const nx = clamp(px / cardW, 0, 1);
        const ny = clamp(py / cardH, 0, 1);
        const lum = clamp(lumSampler(nx, ny), 0, 1);
        if (lum < 0.05) continue;
        // Dot radius proportional to local luminance in #C8CBD2 silver-bone chalk
        const rad = pitch * 0.54 * Math.pow(lum, 0.56);
        const minRad = Math.min(0.32 * s, pitch * 0.092);
        if (rad < minRad) continue;
        const alpha = clamp(0.85 + 0.13 * lum, 0.83, 0.98);
        g.fillStyle = `rgba(200, 203, 210, ${alpha.toFixed(3)})`; // #C8CBD2 archival silver-chalk
        g.beginPath();
        g.arc(ox + px, oy + py, rad, 0, Math.PI * 2);
        g.fill();
        dotCount++;
      }
    }
    g.restore();

    // Subtle dark ink edge along deckled perimeter
    g.save();
    traceDeckledPaperPolygon(g, ox, oy, cardW, cardH, deckleAmp, seed);
    g.strokeStyle = "rgba(8, 10, 14, 0.88)";
    g.lineWidth = 1.05 * s;
    g.stroke();
    g.restore();

    // 3. Serrated grainy masking tape strip(s) outlined in 1.25px dark ink
    if (Array.isArray(tapes)) {
      tapes.forEach((tp, tIdx) => {
        drawSerratedMaskingTape(
          g,
          ox + tp.rx * cardW,
          oy + tp.ry * cardH,
          tp.tw,
          tp.th,
          tp.rot,
          seed + 701 + tIdx * 97,
          s
        );
      });
    }

    return { canvas: out, dotCount };
  }

  function initMePortraitBuffer() {
    if (typeof document === "undefined") return;
    const PW = 440;
    const PH = 544;
    const PAD_T = 40;
    const PAD_S = 22;
    const BUF_W = PW + PAD_S * 2;
    const BUF_H = PH + PAD_T * 2;
    const ox = PAD_S;
    const oy = PAD_T;
    const portraitTapes = [
      // Exact EEC92DFC top-center slightly tilted serrated grainy masking tape strip
      { rx: 0.47, ry: 0.0, tw: 138, th: 34, rot: -0.082 }
    ];

    // Synchronous atmospheric portrait fallback (ensures immediate non-null buffer in Node VM / pre-decode frames)
    const fbRes = renderHalftoneZineBuffer({
      lumSampler(nx, ny) {
        const dx = nx - 0.5;
        const dy = ny - 0.44;
        const headDist = Math.hypot(dx * 1.35, dy * 1.15);
        const shDist = Math.hypot(dx * 0.92, (ny - 0.88) * 1.35);
        if (headDist < 0.24) return 0.14;
        if (headDist < 0.31) return 0.55;
        if (shDist < 0.42 && ny > 0.62) return 0.78;
        return clamp(0.82 - Math.hypot(dx, ny - 0.5) * 0.35, 0.25, 0.88);
      },
      cardW: PW,
      cardH: PH,
      padX: PAD_S,
      padY: PAD_T,
      pitch: 8.2, // ~4.2px world-space 45° halftone dot grid at ~228px portrait width!
      deckleAmp: 4.4, // ±2.2px world-space hand-torn deckled perimeter!
      seed: 31631984,
      rimScale: 1.9,
      tapes: portraitTapes
    });
    mePortraitBuffer = fbRes.canvas;

    if (typeof Image === "undefined" || !window.PORTRAIT_SRC_URI) return;

    const img = new Image();
    img.onload = function () {
      const sw = 220;
      const sh = 272;
      const samp = document.createElement("canvas");
      samp.width = sw;
      samp.height = sh;
      const sctx = samp.getContext("2d");
      if (!sctx) return;
      sctx.drawImage(img, 0, 0, sw, sh);
      let imgData;
      try {
        imgData = sctx.getImageData(0, 0, sw, sh).data;
      } catch (_) {
        return;
      }
      if (!imgData || imgData.length < sw * sh * 4) return;

      const built = renderHalftoneZineBuffer({
        lumSampler(nx, ny) {
          const sx = clamp(Math.floor(nx * (sw - 1)), 0, sw - 1);
          const sy = clamp(Math.floor(ny * (sh - 1)), 0, sh - 1);
          const off = (sy * sw + sx) * 4;
          const rawLum = (imgData[off] * 0.299 + imgData[off + 1] * 0.587 + imgData[off + 2] * 0.114) / 255;
          // Crisp zine lithograph S-curve contrast matching EEC92DFC
          return smoothstep(0.08, 0.93, rawLum);
        },
        cardW: PW,
        cardH: PH,
        padX: PAD_S,
        padY: PAD_T,
        pitch: 8.2,
        deckleAmp: 4.4,
        seed: 31631984,
        rimScale: 1.9,
        tapes: portraitTapes
      });
      mePortraitBuffer = built.canvas;
    };
    img.src = window.PORTRAIT_SRC_URI;

    const colorSrc = window.PORTRAIT_COLOR_URI || window.PORTRAIT_SRC_URI;
    const colorImg = new Image();
    colorImg.onload = function () {
      const cOut = document.createElement("canvas");
      cOut.width = BUF_W;
      cOut.height = BUF_H;
      const cg = cOut.getContext("2d");
      if (!cg) return;

      cg.save();
      cg.shadowColor = "rgba(5, 7, 11, 0.82)";
      cg.shadowBlur = 10;
      cg.shadowOffsetY = 4;
      traceDeckledPaperPolygon(cg, ox, oy, PW, PH, 4.4, 31631984);
      cg.fillStyle = "#DFE2E8";
      cg.fill();
      cg.restore();

      const photoCanvas = document.createElement("canvas");
      photoCanvas.width = PW;
      photoCanvas.height = PH;
      const pg = photoCanvas.getContext("2d");
      if ("imageSmoothingEnabled" in pg) {
        pg.imageSmoothingEnabled = true;
        pg.imageSmoothingQuality = "high";
      }
      pg.fillStyle = "#DFE2E8";
      pg.fillRect(0, 0, PW, PH);

      const natW = colorImg.naturalWidth || colorImg.width || PW;
      const natH = colorImg.naturalHeight || colorImg.height || PH;
      const srcAspect = natW / Math.max(1, natH);
      const dstAspect = PW / PH;
      let sx = 0;
      let sy = 0;
      let sWidth = natW;
      let sHeight = natH;
      if (srcAspect > dstAspect * 1.01) {
        sWidth = natH * dstAspect;
        sx = (natW - sWidth) * 0.5;
      } else if (srcAspect < dstAspect * 0.99) {
        sHeight = natW / dstAspect;
        sy = (natH - sHeight) * 0.35;
      }
      pg.drawImage(colorImg, sx, sy, sWidth, sHeight, 0, 0, PW, PH);

      try {
        const frame = pg.getImageData(0, 0, PW, PH);
        const px = frame.data;
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i];
          const gCh = px[i + 1];
          const b = px[i + 2];
          const minC = r < gCh ? (r < b ? r : b) : (gCh < b ? gCh : b);
          if (minC > 226) {
            const maxC = r > gCh ? (r > b ? r : b) : (gCh > b ? gCh : b);
            const chroma = maxC - minC;
            if (chroma < 18) {
              const wMix =
                smoothstep(226, 253, minC) * (1 - smoothstep(5, 18, chroma)) * 0.92;
              px[i] = Math.round(r + (228 - r) * wMix);
              px[i + 1] = Math.round(gCh + (231 - gCh) * wMix);
              px[i + 2] = Math.round(b + (237 - b) * wMix);
            }
          }
        }
        pg.putImageData(frame, 0, 0);
      } catch (_) {}

      cg.save();
      traceDeckledPaperPolygon(cg, ox, oy, PW, PH, 4.4, 31631984);
      cg.clip();
      cg.drawImage(photoCanvas, ox, oy, PW, PH);
      cg.restore();

      cg.save();
      traceDeckledPaperPolygon(cg, ox, oy, PW, PH, 4.4, 31631984);
      cg.strokeStyle = "rgba(11, 14, 20, 0.88)";
      cg.lineWidth = 1.8;
      cg.stroke();
      cg.restore();

      drawSerratedMaskingTape(
        cg,
        ox + 0.47 * PW,
        oy,
        138,
        34,
        -0.082,
        31631984 + 701,
        1.9
      );

      mePortraitColorBuffer = cOut;
    };
    colorImg.src = colorSrc;
  }

  // =========================================================================
  // 10 DUAL-BUFFER (256x198) 45° HALFTONE + REAL FULL-COLOR ZINE PROJECT CARDS
  // =========================================================================
  const DEFAULT_PROJECT_REAL_PHOTOS = {
    "spanish-super-cup-istanbul": [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/T%C3%BCpra%C5%9F_Stadyumu_20231011_2.jpg/640px-T%C3%BCpra%C5%9F_Stadyumu_20231011_2.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/a9/T%C3%BCpra%C5%9F_Stadyumu_20231011_2.jpg"
    ],
    "riyadh-metro": [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/KAFD_metro_station_2025.jpg/640px-KAFD_metro_station_2025.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Riyadh_Metro_-_innoTrans_2016.jpg/640px-Riyadh_Metro_-_innoTrans_2016.jpg"
    ],
    "ala-khutah": [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Jabele_thor_-_panoramio.jpg/640px-Jabele_thor_-_panoramio.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/1a/Jabele_thor_-_panoramio.jpg"
    ],
    "riyadh-season": [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/The_Boulevard_Riyadh_-_2021.jpg/640px-The_Boulevard_Riyadh_-_2021.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/54/The_Boulevard_Riyadh_-_2021.jpg"
    ],
    "jeddah-season": [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/King_Fahd%E2%80%99s_Fountain.jpg/640px-King_Fahd%E2%80%99s_Fountain.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Jeddah_Waterfront%2C_Western_Saudi_Arabia_%282026%29.jpg/640px-Jeddah_Waterfront%2C_Western_Saudi_Arabia_%282026%29.jpg"
    ],
    "qatif-season": [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/%D9%88%D8%A7%D8%AC%D9%87%D8%A9-%D9%82%D9%84%D8%B9%D8%A9-%D8%AA%D8%A7%D8%B1%D9%88%D8%AA.jpg/640px-%D9%88%D8%A7%D8%AC%D9%87%D8%A9-%D9%82%D9%84%D8%B9%D8%A9-%D8%AA%D8%A7%D8%B1%D9%88%D8%AA.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/f/f9/%D9%88%D8%A7%D8%AC%D9%87%D8%A9-%D9%82%D9%84%D8%B9%D8%A9-%D8%AA%D8%A7%D8%B1%D9%88%D8%AA.jpg"
    ],
    "tourism-visit-jeddah": [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Old_Jeddah_%28Al_Balad%29_architecture_3_Feb_2022.jpg/640px-Old_Jeddah_%28Al_Balad%29_architecture_3_Feb_2022.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/db/Old_Jeddah_%28Al_Balad%29_architecture_3_Feb_2022.jpg"
    ],
    "formula-e-jeddah-2026": [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/2023-04-22_Motorsport%2C_ABB_FIA_Formula_E_World_Championship%2C_Berlin_E-Prix_2023_1DX_1080_by_Stepro.jpg/640px-2023-04-22_Motorsport%2C_ABB_FIA_Formula_E_World_Championship%2C_Berlin_E-Prix_2023_1DX_1080_by_Stepro.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/c6/2023-04-22_Motorsport%2C_ABB_FIA_Formula_E_World_Championship%2C_Berlin_E-Prix_2023_1DX_1080_by_Stepro.jpg"
    ],
    "spanish-super-cup-jeddah-2026": [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Jawhara_Stadium.jpg/640px-Jawhara_Stadium.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/68/Jawhara_Stadium.jpg"
    ],
    "school-league-2025-26": [
      "https://upload.wikimedia.org/wikipedia/en/b/bd/King_Fahd_Int._Stadium-_Opening_Arabian_Gulf_Cup_2014.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Jawhara_Stadium.jpg/640px-Jawhara_Stadium.jpg"
    ]
  };

  function normalizeProjectSceneKey(projectId) {
    const map = {
      "spanish-super-cup-istanbul": "spanish-super-cup-istanbul",
      "riyadh-metro": "riyadh-metro",
      "ala-khutah": "ala-khutah",
      "riyadh-season": "riyadh-season",
      "jeddah-season": "jeddah-season",
      "qatif-season": "qatif-season",
      "tourism-visit-jeddah": "tourism-visit-jeddah",
      "pr-formula-e": "formula-e-jeddah-2026",
      "formula-e-jeddah-2026": "formula-e-jeddah-2026",
      "pr-super-cup": "spanish-super-cup-jeddah-2026",
      "spanish-super-cup-jeddah-2026": "spanish-super-cup-jeddah-2026",
      "pr-school-league": "school-league-2025-26",
      "school-league-2025-26": "school-league-2025-26"
    };
    return map[projectId] || projectId;
  }

  function resolveProjectPhotoUrls(projectId) {
    const sceneKey = normalizeProjectSceneKey(projectId);
    const d = getLocale();
    if (d && d.branches && d.branches.me && Array.isArray(d.branches.me.items)) {
      const found = d.branches.me.items.find(
        (it) => it.id === projectId || normalizeProjectSceneKey(it.id) === sceneKey
      );
      if (found && Array.isArray(found.photoUrls) && found.photoUrls.length > 0) {
        return found.photoUrls.slice();
      }
    }
    const extMap = (typeof window !== "undefined" && window.PROJECT_REAL_PHOTOS) || null;
    if (extMap) {
      if (Array.isArray(extMap[projectId]) && extMap[projectId].length > 0) {
        return extMap[projectId].slice();
      }
      if (Array.isArray(extMap[sceneKey]) && extMap[sceneKey].length > 0) {
        return extMap[sceneKey].slice();
      }
    }
    return (DEFAULT_PROJECT_REAL_PHOTOS[sceneKey] || []).slice();
  }

  function lerpChannel(a, b, t) {
    return a + (b - a) * t;
  }

  // Rich full-color offline fallback scenic illustrations (used at 0ms startup before real photos decode)
  function sampleProjectRichColorScene(sceneKey, nx, ny) {
    if (sceneKey === "spanish-super-cup-istanbul") {
      // Floodlit Istanbul night stadium, amber floodlight beams, emerald turf & golden Super Cup
      let r = lerpChannel(14, 28, ny);
      let g = lerpChannel(26, 48, ny);
      let b = lerpChannel(54, 88, ny);
      const beam1 = Math.max(0, 1 - Math.abs((nx - 0.14) - ny * 0.52) / 0.17) * (1 - ny * 0.22);
      const beam2 = Math.max(0, 1 - Math.abs((0.86 - nx) - ny * 0.52) / 0.17) * (1 - ny * 0.22);
      const beam = Math.max(beam1, beam2);
      r = clamp(r + beam * 228, 0, 255);
      g = clamp(g + beam * 176, 0, 255);
      b = clamp(b + beam * 88, 0, 255);

      const bowlY = 0.62 + Math.pow(nx - 0.5, 2) * 0.30;
      if (ny > 0.83) {
        const stripe = Math.sin((nx - 0.5) * 44) > 0 ? 1 : 0;
        r = stripe ? 32 : 22;
        g = stripe ? 158 : 124;
        b = stripe ? 82 : 62;
        if (Math.abs(ny - 0.88) < 0.014) {
          r = 236; g = 242; b = 246;
        }
      } else if (ny > bowlY) {
        const tierLit = Math.sin((ny - bowlY) * 62) > 0.12;
        r = tierLit ? 236 : 24;
        g = tierLit ? 182 : 34;
        b = tierLit ? 96 : 58;
      }

      const dx = Math.abs(nx - 0.5);
      const cupW =
        ny < 0.24 ? -1 :
        ny < 0.50 ? 0.14 - (ny - 0.24) * 0.26 :
        ny < 0.72 ? 0.042 + (ny - 0.50) * 0.06 :
        ny < 0.88 ? 0.12 : -1;
      const handle = ny > 0.28 && ny < 0.46 && dx > 0.12 && dx < 0.19 && Math.abs(ny - 0.37) < 0.085;
      if (cupW > 0 && dx < cupW) {
        if (dx > cupW - 0.026) {
          r = 253; g = 216; b = 106;
        } else {
          const sheen = clamp(1 - dx / Math.max(0.01, cupW), 0, 1) * 0.28;
          r = 24 + sheen * 120;
          g = 28 + sheen * 92;
          b = 38 + sheen * 40;
        }
      } else if (handle) {
        r = 250; g = 204; b = 86;
      }
      return [r, g, b];
    }

    if (sceneKey === "riyadh-metro") {
      // Twilight royal-blue & sunset sky, alabaster KAFD geometric arches, sleek blue/white/gold Riyadh Metro
      const skyT = clamp(ny / 0.68, 0, 1);
      let r = lerpChannel(26, 232, Math.pow(skyT, 1.35));
      let g = lerpChannel(76, 172, Math.pow(skyT, 1.15));
      let b = lerpChannel(152, 118, skyT);

      const arch1 = 0.58 - Math.sin(clamp((nx + 0.05) * 1.5, 0, Math.PI)) * 0.34;
      const arch2 = 0.62 - Math.sin(clamp((nx - 0.28) * 1.6, 0, Math.PI)) * 0.36;
      if (ny > Math.min(arch1, arch2) && ny < 0.64) {
        const diag = Math.abs(Math.sin((nx * 1.4 + ny) * 28)) > 0.86;
        if (Math.abs(ny - arch1) < 0.034 || Math.abs(ny - arch2) < 0.034) {
          r = 46; g = 58; b = 82;
        } else if (ny > arch1) {
          r = diag ? 186 : 238;
          g = diag ? 182 : 233;
          b = diag ? 176 : 224;
        }
      }

      const deckY = 0.64 - (1 - nx) * 0.10 + Math.sin(nx * 2.6) * 0.04;
      if (ny >= deckY && ny <= deckY + 0.09) {
        r = 28; g = 36; b = 52;
      } else if (ny > deckY + 0.09) {
        const pier = Math.abs(((nx * 3.2) % 1) - 0.5) < 0.11;
        if (pier) {
          r = 24; g = 31; b = 46;
        } else {
          r = lerpChannel(196, 92, (ny - deckY) * 1.8);
          g = lerpChannel(158, 86, (ny - deckY) * 1.8);
          b = lerpChannel(124, 98, (ny - deckY) * 1.8);
        }
      }

      const noseX = 0.80;
      if (nx > 0.06 && nx < noseX) {
        const taper = nx > 0.62 ? Math.pow((nx - 0.62) / 0.18, 1.7) * 0.13 : 0;
        const trainTop = deckY - 0.18 + taper;
        if (ny >= trainTop && ny < deckY) {
          const isWindowBand = ny > trainTop + 0.048 && ny < trainTop + 0.102 && nx < 0.73;
          const isGoldStripe = Math.abs(ny - (deckY - 0.042)) < 0.018;
          const isBlueRoof = ny < trainTop + 0.035;
          const isHeadlight = nx > 0.72 && ny > deckY - 0.07;
          if (isHeadlight) {
            r = 255; g = 248; b = 204;
          } else if (isWindowBand) {
            r = 254; g = 232; b = 148;
          } else if (isGoldStripe) {
            r = 245; g = 188; b = 28;
          } else if (isBlueRoof) {
            r = 14; g = 132; b = 206;
          } else {
            r = 34; g = 52; b = 84;
          }
        }
      }
      return [r, g, b];
    }

    if (sceneKey === "ala-khutah") {
      // Indigo-violet Hijaz sky, golden desert dusk, terracotta Jabal Thawr & glowing amber Hijrah trail
      const dusk = Math.pow(clamp(ny / 0.62, 0, 1), 1.3);
      let r = lerpChannel(22, 212, dusk);
      let g = lerpChannel(26, 118, dusk);
      let b = lerpChannel(64, 72, dusk);

      const mDist = Math.hypot((nx - 0.74) * 1.25, ny - 0.24);
      const mCut = Math.hypot((nx - 0.69) * 1.25, ny - 0.21);
      if (mDist < 0.14 && mCut > 0.12) {
        return [255, 240, 188];
      }
      if (mDist < 0.34) {
        const glow = (1 - mDist / 0.34) * 0.65;
        r = clamp(r + glow * 210, 0, 255);
        g = clamp(g + glow * 168, 0, 255);
        b = clamp(b + glow * 92, 0, 255);
      }

      const ridgeBack =
        0.48 -
        Math.exp(-Math.pow((nx - 0.28) / 0.22, 2)) * 0.24 -
        Math.exp(-Math.pow((nx - 0.72) / 0.26, 2)) * 0.16;
      const ridgeFront =
        0.62 - Math.exp(-Math.pow((nx - 0.18) / 0.25, 2)) * 0.18 + Math.sin(nx * 5.2) * 0.04;
      if (ny > ridgeBack) {
        r = 96; g = 56; b = 46;
      }
      if (ny > ridgeFront) {
        r = 38; g = 23; b = 20;
      }

      if (ny >= 0.50) {
        const t = (ny - 0.50) / 0.50;
        const trailX = 0.46 + Math.sin(t * 5.2) * (0.14 + t * 0.10);
        const trailW = 0.022 + t * 0.068;
        const dTrail = Math.abs(nx - trailX);
        if (dTrail < trailW) {
          r = 255; g = 214; b = 112;
        } else if (dTrail < trailW * 2.2) {
          const w = 1 - (dTrail - trailW) / (trailW * 1.2);
          r = lerpChannel(r, 224, w * 0.78);
          g = lerpChannel(g, 132, w * 0.78);
          b = lerpChannel(b, 54, w * 0.78);
        }
      }
      return [r, g, b];
    }

    if (sceneKey === "riyadh-season") {
      // Neon purple/magenta/gold Boulevard lights & glowing cyan-violet sphere
      let r = lerpChannel(22, 52, ny);
      let g = lerpChannel(16, 24, ny);
      let b = lerpChannel(56, 96, ny);

      const sBeam1 = Math.max(0, 1 - Math.abs((nx - 0.18) - (1 - ny) * 0.36) / 0.11) * 0.75;
      const sBeam2 = Math.max(0, 1 - Math.abs((0.84 - nx) - (1 - ny) * 0.38) / 0.11) * 0.75;
      r = clamp(r + sBeam1 * 225 + sBeam2 * 110, 0, 255);
      g = clamp(g + sBeam1 * 88 + sBeam2 * 175, 0, 255);
      b = clamp(b + sBeam1 * 165 + sBeam2 * 235, 0, 255);

      const fwD = Math.hypot((nx - 0.24) * 1.25, ny - 0.24);
      const fwAng = Math.atan2(ny - 0.24, (nx - 0.24) * 1.25);
      if (fwD < 0.20 && fwD > 0.03 && Math.abs(Math.sin(fwAng * 8)) > 0.80) {
        r = 254; g = 216; b = 92;
      }

      const spDx = (nx - 0.56) * 1.26;
      const spDy = ny - 0.54;
      const spR = Math.hypot(spDx, spDy);
      if (spR < 0.27) {
        const grid = Math.abs(Math.sin(spDy * 28)) > 0.88 || Math.abs(Math.sin(spDx * 26)) > 0.88;
        if (grid) {
          r = 32; g = 22; b = 62;
        } else {
          const hueMix = clamp((spDx + 0.27) / 0.54, 0, 1);
          const coreGlow = clamp(1 - spR / 0.27, 0, 1);
          r = lerpChannel(56, 232, hueMix) + coreGlow * 34;
          g = lerpChannel(196, 98, hueMix) + coreGlow * 48;
          b = lerpChannel(252, 246, hueMix);
        }
      }

      if (ny > 0.74) {
        const archOpen = Math.abs(((nx * 5.0) % 1) - 0.5) < 0.24 && ny > 0.80;
        if (archOpen) {
          r = 252; g = 202; b = 72;
        } else {
          r = 20; g = 16; b = 38;
        }
      }
      return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)];
    }

    if (sceneKey === "jeddah-season") {
      // Glowing sapphire & warm-gold King Fahd's Fountain over Red Sea night ripples
      let r = lerpChannel(10, 22, ny);
      let g = lerpChannel(26, 54, ny);
      let b = lerpChannel(54, 96, ny);

      const jetDx = Math.abs(nx - 0.48);
      const plumeW = 0.026 + Math.pow(ny * 0.85, 1.6) * 0.16;
      if (ny > 0.10 && ny < 0.74) {
        if (jetDx < plumeW) {
          const warmBase = clamp((ny - 0.35) / 0.39, 0, 1);
          r = lerpChannel(228, 255, warmBase);
          g = lerpChannel(242, 234, warmBase);
          b = lerpChannel(255, 176, warmBase);
        } else if (jetDx < plumeW * 2.6) {
          const mist = clamp(1 - (jetDx - plumeW) / (plumeW * 1.6), 0, 1) * (1 - Math.abs(ny - 0.38));
          r = clamp(r + mist * 115, 0, 255);
          g = clamp(g + mist * 175, 0, 255);
          b = clamp(b + mist * 235, 0, 255);
        }
      }
      const apexD = Math.hypot((nx - 0.48) * 1.2, (ny - 0.14) * 1.8);
      if (apexD < 0.13) {
        const a = 1 - apexD / 0.13;
        r = Math.max(r, 235 * a);
        g = Math.max(g, 244 * a);
        b = Math.max(b, 255 * a);
      }

      if (ny >= 0.70 && ny < 0.76) {
        if (nx > 0.43 && nx < 0.53) {
          r = 255; g = 214; b = 112;
        } else {
          r = 14; g = 22; b = 36;
        }
      } else if (ny >= 0.76) {
        const reflW = 0.06 + (ny - 0.76) * 0.55;
        const ripple = Math.sin(ny * 78 + nx * 18) > 0.0;
        if (jetDx < reflW && ripple) {
          r = 252; g = 212; b = 108;
        } else if (ripple && Math.sin(nx * 31) > 0.52) {
          r = 56; g = 168; b = 228;
        } else {
          r = 12; g = 34; b = 64;
        }
      }
      return [r, g, b];
    }

    if (sceneKey === "qatif-season") {
      // Sunlit azure sky, warm sandstone/terracotta Tarout Castle, emerald palms & Gulf dhow
      let r = lerpChannel(42, 168, ny);
      let g = lerpChannel(116, 218, ny);
      let b = lerpChannel(232, 250, ny);

      // Lush green palm canopy behind castle
      const palmD = Math.hypot((nx - 0.56) * 1.3, (ny - 0.52) * 1.4);
      if (palmD < 0.16 && ny < 0.74) {
        r = 24; g = 132; b = 64;
      }

      if (nx < 0.60 && ny > 0.32 && ny < 0.76) {
        const tower1 = nx > 0.08 && nx < 0.28 && ny > 0.30;
        const wall = nx >= 0.26 && nx < 0.56 && ny > 0.42;
        const battlement = ny < 0.46 && Math.sin(nx * 64) > 0.1;
        if (tower1 || (wall && (!battlement || ny > 0.45))) {
          const arch1 =
            Math.hypot((nx - 0.18) * 1.4, ny - 0.60) < 0.075 ||
            (Math.abs(nx - 0.18) < 0.052 && ny > 0.60);
          const arch2 =
            Math.hypot((nx - 0.41) * 1.4, ny - 0.62) < 0.075 ||
            (Math.abs(nx - 0.41) < 0.052 && ny > 0.62);
          if (arch1 || arch2) {
            r = 58; g = 34; b = 22;
          } else {
            const shade = nx > 0.25 && nx < 0.29 ? 0.84 : 1.0;
            r = 216 * shade;
            g = 154 * shade;
            b = 102 * shade;
          }
        }
      }

      if (nx > 0.64 && nx < 0.92 && ny > 0.26 && ny < 0.70) {
        const sailLeft = 0.66 + (0.70 - ny) * 0.36;
        const sailRight = 0.90 - (ny - 0.26) * 0.08;
        if (nx >= sailLeft && nx <= sailRight) {
          r = 250; g = 246; b = 236;
        }
      }
      if (ny >= 0.70 && ny < 0.76 && nx > 0.62 && nx < 0.93) {
        r = 92; g = 52; b = 28;
      }
      if (ny >= 0.76) {
        const shimmer = Math.sin(ny * 68 + nx * 22) > 0.15;
        r = shimmer ? 148 : 16;
        g = shimmer ? 228 : 132;
        b = shimmer ? 244 : 164;
      }
      return [r, g, b];
    }

    if (sceneKey === "tourism-visit-jeddah") {
      // Historic Al-Balad coral-stone facades + teal-turquoise & carved teak Rawasheen
      const laneLeft = 0.34 + ny * 0.06;
      const laneRight = 0.66 - ny * 0.06;
      if (nx >= laneLeft && nx <= laneRight) {
        if (ny > 0.78) {
          const cobble = Math.sin(ny * 55) > 0;
          return cobble ? [208, 188, 160] : [96, 78, 62];
        }
        return [
          lerpChannel(48, 148, ny),
          lerpChannel(142, 204, ny),
          lerpChannel(234, 252, ny)
        ];
      }

      let r = 234, g = 218, b = 194;
      const inLeftRoshan =
        nx > 0.06 && nx < laneLeft - 0.02 && ((ny > 0.14 && ny < 0.44) || (ny > 0.50 && ny < 0.78));
      const inRightRoshan =
        nx > laneRight + 0.02 && nx < 0.94 && ((ny > 0.18 && ny < 0.48) || (ny > 0.54 && ny < 0.82));
      if (inLeftRoshan || inRightRoshan) {
        const lattice = Math.abs(Math.sin(nx * 74)) > 0.76 && Math.abs(Math.sin(ny * 64)) > 0.76;
        const isTeal = inLeftRoshan ? ny < 0.46 : ny > 0.50;
        if (lattice) {
          r = 248; g = 216; b = 142;
        } else if (isTeal) {
          r = 18; g = 132; b = 124;
        } else {
          r = 98; g = 56; b = 32;
        }
      } else if (Math.abs(Math.sin(ny * 26)) > 0.90) {
        r = 116; g = 72; b = 44;
      }
      return [r, g, b];
    }

    if (sceneKey === "formula-e-jeddah-2026") {
      // Electric blue/crimson Formula E Gen3 car streaking past floodlit Jeddah Corniche kerbs
      let r = 14, g = 24, b = 48;
      const streak = Math.sin((nx * 0.85 + ny * 1.4) * 22);
      if (ny < 0.38) {
        if (streak > 0.55) {
          r = 56; g = 198; b = 248;
        }
      } else {
        const asph = 1 - (ny - 0.38) * 0.45;
        r = 58 * asph;
        g = 68 * asph;
        b = 86 * asph;
      }

      const kerbTop = 0.44 - nx * 0.18;
      if (Math.abs(ny - kerbTop) < 0.055) {
        const redStripe = Math.sin(nx * 46) > 0;
        r = redStripe ? 236 : 242;
        g = redStripe ? 52 : 246;
        b = redStripe ? 68 : 252;
      }
      const kerbBot = 0.94 - nx * 0.16;
      if (ny > kerbBot) {
        const blueStripe = Math.sin(nx * 42) > 0;
        r = blueStripe ? 14 : 242;
        g = blueStripe ? 165 : 246;
        b = blueStripe ? 233 : 252;
      }

      const cx = nx - 0.48;
      const cy = ny - 0.60 + cx * 0.14;
      const body = Math.abs(cx) < 0.28 && cy > -0.055 && cy < 0.055;
      const haloCockpit = Math.abs(cx + 0.02) < 0.10 && cy > -0.11 && cy <= -0.04;
      const wheelL = Math.hypot((cx + 0.20) * 1.25, cy - 0.02) < 0.085;
      const wheelR = Math.hypot((cx - 0.21) * 1.25, cy - 0.02) < 0.085;
      const rearWing = cx < -0.23 && cx > -0.32 && cy > -0.13 && cy < 0.03;
      if (wheelL || wheelR) {
        const rim =
          Math.abs(Math.hypot((cx + 0.20) * 1.25, cy - 0.02) - 0.045) < 0.016 ||
          Math.abs(Math.hypot((cx - 0.21) * 1.25, cy - 0.02) - 0.045) < 0.016;
        r = rim ? 56 : 20;
        g = rim ? 216 : 24;
        b = rim ? 248 : 32;
      } else if (body || haloCockpit || rearWing) {
        const aeroStripe = body && Math.abs(cy + 0.01) < 0.016;
        if (aeroStripe) {
          r = 244; g = 63; b = 94;
        } else if (haloCockpit) {
          r = 34; g = 211; b = 238;
        } else {
          r = 28; g = 92; b = 228;
        }
      }
      return [r, g, b];
    }

    if (sceneKey === "spanish-super-cup-jeddah-2026") {
      // Illuminated golden-amber geometric mashrabiya dome of Al-Jawhara Stadium in Jeddah
      let r = lerpChannel(12, 26, ny);
      let g = lerpChannel(24, 52, ny);
      let b = lerpChannel(48, 88, ny);

      const b1 = Math.max(0, 1 - Math.abs((nx - 0.26) + (ny - 0.45) * 0.35) / 0.12) * (1 - ny);
      const b2 = Math.max(0, 1 - Math.abs((nx - 0.74) - (ny - 0.45) * 0.35) / 0.12) * (1 - ny);
      const bm = Math.max(b1, b2);
      r = clamp(r + bm * 220, 0, 255);
      g = clamp(g + bm * 185, 0, 255);
      b = clamp(b + bm * 115, 0, 255);

      const domeTop = 0.42 + Math.pow((nx - 0.5) * 1.45, 2) * 0.46;
      if (ny >= domeTop && ny <= 0.78 && Math.abs(nx - 0.5) < 0.44) {
        const diag1 = Math.abs(Math.sin((nx * 1.3 + ny) * 34));
        const diag2 = Math.abs(Math.sin((nx * 1.3 - ny) * 34));
        const rib = diag1 > 0.84 || diag2 > 0.84;
        if (rib) {
          r = 26; g = 34; b = 52;
        } else {
          const glow = 1 - Math.abs(nx - 0.5) * 0.7;
          r = 248 * glow;
          g = 186 * glow;
          b = 82 * glow;
        }
      } else if (ny > 0.78) {
        const lit = Math.abs(nx - 0.5) < 0.38 && Math.sin(nx * 36) > -0.2;
        r = lit ? 34 : 16;
        g = lit ? 168 : 26;
        b = lit ? 92 : 42;
      }
      return [clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)];
    }

    // 10. school-league-2025-26: Floodlit emerald stadium turf, chalk touchlines & match football
    let r = 16, g = 34, b = 66;
    const fl1 = Math.hypot((nx - 0.18) * 1.25, ny - 0.18);
    const fl2 = Math.hypot((nx - 0.82) * 1.25, ny - 0.18);
    if (fl1 < 0.07 || fl2 < 0.07) return [255, 250, 224];
    const halo = Math.max(
      fl1 < 0.28 ? (1 - fl1 / 0.28) * 0.78 : 0,
      fl2 < 0.28 ? (1 - fl2 / 0.28) * 0.78 : 0
    );
    r = clamp(r + halo * 225, 0, 255);
    g = clamp(g + halo * 205, 0, 255);
    b = clamp(b + halo * 145, 0, 255);
    if ((Math.abs(nx - 0.18) < 0.016 || Math.abs(nx - 0.82) < 0.016) && ny > 0.18 && ny < 0.48) {
      r = 196; g = 206; b = 224;
    }

    if (ny >= 0.48) {
      const mowStripe = Math.sin((ny - 0.48) * 38) > 0;
      const line1 = Math.abs((nx - 0.5) - (ny - 0.42) * 0.85) < 0.022;
      const line2 = Math.abs((nx - 0.5) + (ny - 0.42) * 0.85) < 0.022;
      const midLine = Math.abs(ny - 0.60) < 0.018;
      if (line1 || line2 || midLine) {
        r = 244; g = 248; b = 252;
      } else if (mowStripe) {
        r = 34; g = 166; b = 78;
      } else {
        r = 21; g = 126; b = 58;
      }
    }

    const ballDx = (nx - 0.50) * 1.26;
    const ballDy = ny - 0.72;
    const ballR = Math.hypot(ballDx, ballDy);
    if (ballR < 0.175) {
      const centerPent = Math.hypot(ballDx, ballDy + 0.01) < 0.062;
      const sidePent1 = Math.hypot(ballDx - 0.12, ballDy - 0.04) < 0.048;
      const sidePent2 = Math.hypot(ballDx + 0.12, ballDy - 0.04) < 0.048;
      const topPent = Math.hypot(ballDx, ballDy + 0.13) < 0.044;
      if (centerPent || sidePent1 || sidePent2 || topPent) {
        r = 20; g = 26; b = 36;
      } else {
        const shade = clamp(1.04 - ballR * 1.2, 0.76, 1.0);
        r = 248 * shade;
        g = 250 * shade;
        b = 252 * shade;
      }
    }
    return [r, g, b];
  }

  function sampleProjectTonalScene(sceneKey, nx, ny) {
    const rgb = sampleProjectRichColorScene(sceneKey, nx, ny);
    const rawL = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return smoothstep(0.05, 0.94, rawL);
  }

  function createRichFallbackSourceCanvas(sceneKey, w, h) {
    const src = document.createElement("canvas");
    src.width = w;
    src.height = h;
    const sctx = src.getContext("2d");
    const rgba = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      const ny = y / Math.max(1, h - 1);
      for (let x = 0; x < w; x++) {
        const nx = x / Math.max(1, w - 1);
        const rgb = sampleProjectRichColorScene(sceneKey, nx, ny);
        const off = (y * w + x) * 4;
        rgba[off] = clamp(Math.round(rgb[0]), 0, 255);
        rgba[off + 1] = clamp(Math.round(rgb[1]), 0, 255);
        rgba[off + 2] = clamp(Math.round(rgb[2]), 0, 255);
        rgba[off + 3] = 255;
      }
    }
    src.__rgbaData = rgba;
    if (sctx && typeof sctx.createImageData === "function" && typeof sctx.putImageData === "function") {
      try {
        const imgData = sctx.createImageData(w, h);
        imgData.data.set(rgba);
        sctx.putImageData(imgData, 0, 0);
      } catch (_) {}
    }
    return { canvas: src, rgba };
  }

  function computeAdaptiveLuminanceSampler(rgba, w, h) {
    const hist = new Uint32Array(256);
    const total = w * h;
    for (let i = 0; i < total; i++) {
      const off = i * 4;
      const l = Math.round(0.299 * rgba[off] + 0.587 * rgba[off + 1] + 0.114 * rgba[off + 2]);
      hist[clamp(l, 0, 255)]++;
    }
    let acc = 0;
    let p05 = 12;
    let p96 = 242;
    const t05 = total * 0.05;
    const t96 = total * 0.96;
    let found05 = false;
    for (let b = 0; b < 256; b++) {
      acc += hist[b];
      if (!found05 && acc >= t05) {
        p05 = b;
        found05 = true;
      }
      if (acc >= t96) {
        p96 = b;
        break;
      }
    }
    const lo = clamp((p05 / 255) * 0.58, 0.02, 0.16);
    const hi = clamp(Math.max(lo + 0.36, (p96 / 255) * 0.68 + 0.30), 0.60, 0.96);

    return function (nx, ny) {
      const fx = clamp(nx, 0, 1) * (w - 1);
      const fy = clamp(ny, 0, 1) * (h - 1);
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const x1 = Math.min(w - 1, x0 + 1);
      const y1 = Math.min(h - 1, y0 + 1);
      const tx = fx - x0;
      const ty = fy - y0;

      const o00 = (y0 * w + x0) * 4;
      const o10 = (y0 * w + x1) * 4;
      const o01 = (y1 * w + x0) * 4;
      const o11 = (y1 * w + x1) * 4;

      const l00 = (0.299 * rgba[o00] + 0.587 * rgba[o00 + 1] + 0.114 * rgba[o00 + 2]) / 255;
      const l10 = (0.299 * rgba[o10] + 0.587 * rgba[o10 + 1] + 0.114 * rgba[o10 + 2]) / 255;
      const l01 = (0.299 * rgba[o01] + 0.587 * rgba[o01 + 1] + 0.114 * rgba[o01 + 2]) / 255;
      const l11 = (0.299 * rgba[o11] + 0.587 * rgba[o11 + 1] + 0.114 * rgba[o11 + 2]) / 255;

      const rawLum =
        (l00 * (1 - tx) + l10 * tx) * (1 - ty) +
        (l01 * (1 - tx) + l11 * tx) * ty;
      const norm = clamp((rawLum - lo) / Math.max(0.05, hi - lo), 0, 1);
      // Gentle lithograph S-curve contrast boost so architectural/stadium/fountain details pop
      return smoothstep(0.03, 0.97, norm) * 0.86 + norm * 0.14;
    };
  }

  function renderColorZineBuffer(opts) {
    const {
      photoSource,
      sourceRgba,
      cardW,
      cardH,
      padX,
      padY,
      deckleAmp,
      seed,
      rimScale,
      tapes
    } = opts;
    const bufW = cardW + padX * 2;
    const bufH = cardH + padY * 2;
    const ox = padX;
    const oy = padY;
    const out = document.createElement("canvas");
    out.width = bufW;
    out.height = bufH;
    const cg = out.getContext("2d");
    if (!cg) return { canvas: out, colorSampleRgb: [0, 0, 0] };

    const s = rimScale || 1.0;

    // 1. Identical deckle-edged zine paper (#171A21) + relief shadow
    cg.save();
    cg.shadowColor = "rgba(5, 7, 11, 0.82)";
    cg.shadowBlur = 5.5 * s;
    cg.shadowOffsetX = 1.2 * s;
    cg.shadowOffsetY = 2.4 * s;
    traceDeckledPaperPolygon(cg, ox, oy, cardW, cardH, deckleAmp, seed);
    cg.fillStyle = "#171A21";
    cg.fill();
    cg.restore();

    // 2. Prepare center-cropped full-color photo with subtle warm film vibrance (saturate 1.08, contrast 1.05)
    const photoCanvas = document.createElement("canvas");
    photoCanvas.width = cardW;
    photoCanvas.height = cardH;
    const pg = photoCanvas.getContext("2d");
    let colorSampleRgb = [0, 0, 0];

    if (pg) {
      if ("imageSmoothingEnabled" in pg) {
        pg.imageSmoothingEnabled = true;
        pg.imageSmoothingQuality = "high";
      }
      if (photoSource) {
        const natW = photoSource.naturalWidth || photoSource.videoWidth || photoSource.width || cardW;
        const natH = photoSource.naturalHeight || photoSource.videoHeight || photoSource.height || cardH;
        const srcAspect = natW / Math.max(1, natH);
        const dstAspect = cardW / cardH;
        let sx = 0;
        let sy = 0;
        let sWidth = natW;
        let sHeight = natH;
        if (srcAspect > dstAspect * 1.005) {
          sWidth = natH * dstAspect;
          sx = (natW - sWidth) * 0.5;
        } else if (srcAspect < dstAspect * 0.995) {
          sHeight = natW / dstAspect;
          sy = (natH - sHeight) * 0.45;
        }
        pg.drawImage(photoSource, sx, sy, sWidth, sHeight, 0, 0, cardW, cardH);
      }

      try {
        let frame = null;
        let px = null;
        if (sourceRgba && sourceRgba.length === cardW * cardH * 4) {
          frame = pg.createImageData(cardW, cardH);
          frame.data.set(sourceRgba);
          px = frame.data;
        } else if (typeof pg.getImageData === "function") {
          frame = pg.getImageData(0, 0, cardW, cardH);
          px = frame && frame.data;
        }
        if (px && px.length >= cardW * cardH * 4) {
          let sumR = 0;
          let sumG = 0;
          let sumB = 0;
          const nPx = cardW * cardH;
          for (let i = 0; i < px.length; i += 4) {
            const r = px[i];
            const gCh = px[i + 1];
            const b = px[i + 2];
            const luma = 0.299 * r + 0.587 * gCh + 0.114 * b;
            // Subtle warm film vibrance boost: saturate(1.08) + contrast(1.05) + warm archival tint
            const nr = clamp(Math.round(((luma + (r - luma) * 1.08) - 128) * 1.05 + 129.5), 0, 255);
            const ng = clamp(Math.round(((luma + (gCh - luma) * 1.08) - 128) * 1.05 + 128.4), 0, 255);
            const nb = clamp(Math.round(((luma + (b - luma) * 1.08) - 128) * 1.05 + 127.2), 0, 255);
            px[i] = nr;
            px[i + 1] = ng;
            px[i + 2] = nb;
            if (px[i + 3] === 0) px[i + 3] = 255;
            sumR += nr;
            sumG += ng;
            sumB += nb;
          }
          colorSampleRgb = [
            Math.round(sumR / nPx),
            Math.round(sumG / nPx),
            Math.round(sumB / nPx)
          ];
          photoCanvas.__rgbaData = new Uint8ClampedArray(px);
          pg.putImageData(frame, 0, 0);
        }
      } catch (_) {}
    }

    // Clip strictly to the EXACT SAME jagged deckled paper polygon as halftoneCanvas!
    cg.save();
    traceDeckledPaperPolygon(cg, ox, oy, cardW, cardH, deckleAmp, seed);
    cg.clip();
    cg.drawImage(photoCanvas, ox, oy, cardW, cardH);
    cg.restore();

    // 3. Exact same dark ink edge along deckled perimeter
    cg.save();
    traceDeckledPaperPolygon(cg, ox, oy, cardW, cardH, deckleAmp, seed);
    cg.strokeStyle = "rgba(8, 10, 14, 0.88)";
    cg.lineWidth = 1.05 * s;
    cg.stroke();
    cg.restore();

    // 4. Exact same serrated grainy masking tape strip(s) on top (100% locked during cross-fade!)
    if (Array.isArray(tapes)) {
      tapes.forEach((tp, tIdx) => {
        drawSerratedMaskingTape(
          cg,
          ox + tp.rx * cardW,
          oy + tp.ry * cardH,
          tp.tw,
          tp.th,
          tp.rot,
          seed + 701 + tIdx * 97,
          s
        );
      });
    }

    out.__colorSampleRgb = colorSampleRgb;
    return { canvas: out, colorSampleRgb };
  }

  function getProjectCardGeometryAndTapes(cardSeed) {
    // Exact 256 x 198 high-resolution offscreen buffer (cardW=212 + 2*22 = 256, cardH=164 + 2*17 = 198)
    const cardW = 212;
    const cardH = 164;
    const padX = 22;
    const padY = 17;
    const pitch = 3.2; // Crisp 3.2px 45°-rotated circular halftone dot screen
    const deckleAmp = 4.2;
    const rimScale = 1.48;

    const tapeVariant = Math.abs(cardSeed) % 4;
    let tapes;
    if (tapeVariant === 0) {
      tapes = [{ rx: 0.48, ry: 0.0, tw: 70, th: 19, rot: -0.075 }];
    } else if (tapeVariant === 1) {
      tapes = [
        { rx: 0.06, ry: 0.05, tw: 60, th: 17, rot: -0.68 },
        { rx: 0.93, ry: 0.06, tw: 60, th: 17, rot: 0.72 }
      ];
    } else if (tapeVariant === 2) {
      tapes = [{ rx: 0.07, ry: 0.05, tw: 64, th: 18, rot: -0.70 }];
    } else {
      tapes = [{ rx: 0.52, ry: 0.0, tw: 72, th: 19, rot: 0.065 }];
    }
    return { cardW, cardH, padX, padY, pitch, deckleAmp, rimScale, tapes };
  }

  function buildProjectHalftoneCard(projectId, seed) {
    const sceneKey = normalizeProjectSceneKey(projectId);
    const cardSeed = seed || 4030001;
    const geom = getProjectCardGeometryAndTapes(cardSeed);
    const { cardW, cardH, padX, padY, pitch, deckleAmp, rimScale, tapes } = geom;

    // 1. Synchronous rich full-color fallback illustration at 0ms
    const fbSrc = createRichFallbackSourceCanvas(sceneKey, cardW, cardH);
    const lumSampler = computeAdaptiveLuminanceSampler(fbSrc.rgba, cardW, cardH);

    const halftoneRes = renderHalftoneZineBuffer({
      lumSampler,
      cardW,
      cardH,
      padX,
      padY,
      pitch,
      deckleAmp,
      seed: cardSeed,
      rimScale,
      tapes
    });

    const colorRes = renderColorZineBuffer({
      photoSource: fbSrc.canvas,
      sourceRgba: fbSrc.rgba,
      cardW,
      cardH,
      padX,
      padY,
      deckleAmp,
      seed: cardSeed,
      rimScale,
      tapes
    });

    const prng = mulberry32(cardSeed ^ 0x5a17);
    const sign = cardSeed % 2 === 0 ? -1 : 1;
    const tiltRad = sign * (0.032 + prng() * 0.028);
    const photoUrls = resolveProjectPhotoUrls(projectId);

    return {
      projectId,
      sceneKey,
      seed: cardSeed,
      tapes,
      photoUrls,
      halftoneCanvas: halftoneRes.canvas,
      colorCanvas: colorRes.canvas,
      canvas: halftoneRes.canvas,
      bufW: halftoneRes.canvas.width,
      bufH: halftoneRes.canvas.height,
      cardW,
      cardH,
      padX,
      padY,
      pitch,
      dotCount: halftoneRes.dotCount,
      colorSampleRgb: colorRes.colorSampleRgb,
      tiltRad,
      tapeCount: tapes.length,
      isRealPhoto: false,
      loadedUrl: null,
      rebuildCount: 1
    };
  }

  function upgradeProjectCardFromLoadedImage(card, img, loadedUrl, hadCors) {
    if (!card || !img) return false;
    const geom = getProjectCardGeometryAndTapes(card.seed);
    const { cardW, cardH, padX, padY, pitch, deckleAmp, rimScale, tapes } = geom;

    // Draw cover-cropped real photograph into cardW x cardH source canvas
    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = cardW;
    srcCanvas.height = cardH;
    const sctx = srcCanvas.getContext("2d");
    const natW = img.naturalWidth || img.width || cardW;
    const natH = img.naturalHeight || img.height || cardH;
    const srcAspect = natW / Math.max(1, natH);
    const dstAspect = cardW / cardH;
    let sx = 0;
    let sy = 0;
    let sWidth = natW;
    let sHeight = natH;
    if (srcAspect > dstAspect * 1.005) {
      sWidth = natH * dstAspect;
      sx = (natW - sWidth) * 0.5;
    } else if (srcAspect < dstAspect * 0.995) {
      sHeight = natW / dstAspect;
      sy = (natH - sHeight) * 0.45;
    }

    let extractedRgba = null;
    if (sctx) {
      if ("imageSmoothingEnabled" in sctx) {
        sctx.imageSmoothingEnabled = true;
        sctx.imageSmoothingQuality = "high";
      }
      sctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cardW, cardH);
      if (hadCors !== false) {
        try {
          const frame = sctx.getImageData(0, 0, cardW, cardH);
          if (frame && frame.data && frame.data.length === cardW * cardH * 4) {
            // Check that buffer actually contains non-zero alpha pixels (or mock img.__rgbaData)
            let anyNonZero = false;
            for (let i = 0; i < frame.data.length; i += 16) {
              if (frame.data[i] || frame.data[i + 1] || frame.data[i + 2] || frame.data[i + 3]) {
                anyNonZero = true;
                break;
              }
            }
            if (anyNonZero) {
              extractedRgba = new Uint8ClampedArray(frame.data);
            }
          }
        } catch (_) {
          extractedRgba = null;
        }
      }
    }

    if (!extractedRgba && img.__rgbaData && img.__rgbaData.length === cardW * cardH * 4) {
      extractedRgba = new Uint8ClampedArray(img.__rgbaData);
    }

    // Regenerate halftoneCanvas whenever pixel luminance is readable via CORS
    if (extractedRgba) {
      const lumSampler = computeAdaptiveLuminanceSampler(extractedRgba, cardW, cardH);
      const halftoneRes = renderHalftoneZineBuffer({
        lumSampler,
        cardW,
        cardH,
        padX,
        padY,
        pitch,
        deckleAmp,
        seed: card.seed,
        rimScale,
        tapes
      });
      card.halftoneCanvas = halftoneRes.canvas;
      card.canvas = halftoneRes.canvas;
      card.dotCount = halftoneRes.dotCount;
    }

    // Always regenerate colorCanvas (works both with CORS pixel vibrance AND non-CORS drawImage fallback!)
    const colorRes = renderColorZineBuffer({
      photoSource: img,
      sourceRgba: extractedRgba,
      cardW,
      cardH,
      padX,
      padY,
      deckleAmp,
      seed: card.seed,
      rimScale,
      tapes
    });
    card.colorCanvas = colorRes.canvas;
    card.colorSampleRgb = colorRes.colorSampleRgb;
    card.bufW = card.halftoneCanvas.width;
    card.bufH = card.halftoneCanvas.height;
    card.isRealPhoto = true;
    card.loadedUrl = loadedUrl || null;
    card.hadCorsPixels = Boolean(extractedRgba);
    card.rebuildCount = (card.rebuildCount || 1) + 1;
    return true;
  }

  const PROJECT_CARD_SPECS = [
    { id: "spanish-super-cup-istanbul", seed: 5101 },
    { id: "riyadh-metro", seed: 5102 },
    { id: "ala-khutah", seed: 5103 },
    { id: "riyadh-season", seed: 5104 },
    { id: "jeddah-season", seed: 5105 },
    { id: "qatif-season", seed: 5106 },
    { id: "tourism-visit-jeddah", seed: 5107 },
    { id: "pr-formula-e", seed: 5108 },
    { id: "pr-super-cup", seed: 5109 },
    { id: "pr-school-league", seed: 5110 }
  ];

  function initProjectHalftoneCards() {
    PROJECT_CARD_SPECS.forEach((sp) => {
      const card = buildProjectHalftoneCard(sp.id, sp.seed);
      projectPhotoCards[sp.id] = card;
      projectPhotoCards[card.sceneKey] = card;
      if (projectPhotoHover[sp.id] === undefined) projectPhotoHover[sp.id] = 0;
    });
  }

  function loadRealProjectPhotos() {
    const ImgCtor =
      (typeof window !== "undefined" && window.Image) ||
      (typeof Image !== "undefined" ? Image : null);
    if (!ImgCtor) return;

    PROJECT_CARD_SPECS.forEach((sp) => {
      const card = projectPhotoCards[sp.id];
      if (!card) return;
      const urls = resolveProjectPhotoUrls(sp.id);
      card.photoUrls = urls.slice();
      if (!urls.length) return;

      const state = {
        id: sp.id,
        sceneKey: card.sceneKey,
        urls: urls.slice(),
        attemptIdx: 0,
        useCors: true,
        crossOrigin: "anonymous",
        status: "loading",
        loadedUrl: null,
        activeImage: null
      };
      projectPhotoLoadState[sp.id] = state;
      projectPhotoLoadState[card.sceneKey] = state;

      function tryLoad(urlIdx, withCors) {
        if (urlIdx >= urls.length) {
          if (withCors) {
            // If all CORS attempts failed, retry without crossOrigin so colorCanvas can still drawImage!
            tryLoad(0, false);
          } else {
            state.status = "fallback";
          }
          return;
        }
        const targetUrl = urls[urlIdx];
        state.attemptIdx = urlIdx;
        state.useCors = withCors;
        state.crossOrigin = withCors ? "anonymous" : null;

        const img = new ImgCtor();
        if (withCors) {
          img.crossOrigin = "anonymous";
        }
        state.activeImage = img;

        img.onload = function () {
          upgradeProjectCardFromLoadedImage(card, img, targetUrl, withCors);
          state.status = "loaded";
          state.loadedUrl = targetUrl;
        };
        img.onerror = function () {
          tryLoad(urlIdx + 1, withCors);
        };
        img.src = targetUrl;
      }

      tryLoad(0, true);
    });
  }

  function buildWorldProps() {
    const rand = mulberry32(991984);

    stars = [];
    const starRand = mulberry32(19840520);

    // 18 needle-cross sparkle stars (0.62px ray width) spanning main tree, left/right branches, AND upper-right experience bough (all wy < -18)
    const sparkleStarSpecs = [
      { wx: -560, wy: -442, scale: 0.90, depth: 0.96 },
      { wx: -448, wy: -346, scale: 0.96, depth: 1.08 },
      { wx: -328, wy: -374, scale: 0.80, depth: 0.64 },
      { wx: -236, wy: -316, scale: 0.72, depth: 0.42 },
      { wx: -518, wy: -194, scale: 0.88, depth: 0.85 },
      { wx: -384, wy: -112, scale: 0.76, depth: 0.54 },
      { wx: -164, wy: -598, scale: 0.84, depth: 0.74 },
      { wx: 48, wy: -646, scale: 0.82, depth: 0.58 },
      { wx: 228, wy: -352, scale: 0.86, depth: 0.78 },
      { wx: 372, wy: -336, scale: 1.00, depth: 1.12 },
      { wx: 504, wy: -272, scale: 0.78, depth: 0.62 },
      { wx: 336, wy: -166, scale: 0.84, depth: 0.92 },
      { wx: 482, wy: -98, scale: 0.92, depth: 1.04 },
      // Upper-right sky framing the arching experience bough
      { wx: 214, wy: -692, scale: 0.92, depth: 0.98 },
      { wx: 396, wy: -818, scale: 0.88, depth: 0.70 },
      { wx: 574, wy: -626, scale: 0.82, depth: 0.50 },
      { wx: 698, wy: -862, scale: 0.94, depth: 1.15 },
      { wx: 764, wy: -684, scale: 0.78, depth: 0.36 }
    ];

    const SPARKLE_TOTAL = sparkleStarSpecs.length; // 18
    for (let i = 0; i < SPARKLE_TOTAL; i++) {
      const sp = sparkleStarSpecs[i];
      const period = 4.6 + starRand() * 3.8;
      const staggeredPhase =
        ((i / SPARKLE_TOTAL) * Math.PI * 2 + (starRand() - 0.5) * 0.34 + Math.PI * 2) %
        (Math.PI * 2);

      stars.push({
        wx: sp.wx,
        wy: sp.wy, // strictly < -18
        depth: clamp(sp.depth, 0.22, 1.15),
        r: 0.82 + sp.scale * 0.36,
        alpha: 0.34 + starRand() * 0.28,
        speed: 0.48 + starRand() * 0.85,
        phase: starRand() * Math.PI * 2,
        bright: i % 2 === 0,
        glint: true,
        hero: i < 13,
        sparkleScale: sp.scale,
        glintPeriod: period,
        glintSpeed: (Math.PI * 2) / period,
        glintPhase: staggeredPhase
      });
    }

    // 34 matte lithograph pinpoint stars (0.75px-1.35px, #C6CAD2 / #DCE0E8) distributed across all sky zones (total = 52 stars, all wy < -18)
    const pinpointStarZones = [
      // Left sky & work/writing canopy
      { wx: -740, wy: -520 }, { wx: -655, wy: -288 }, { wx: -612, wy: -128 },
      { wx: -486, wy: -496 }, { wx: -412, wy: -256 }, { wx: -296, wy: -482 },
      { wx: -272, wy: -186 }, { wx: -198, wy: -92 },  { wx: -348, wy: -58 },
      // Central upper sky above olive crown
      { wx: -112, wy: -562 }, { wx: -28, wy: -584 },  { wx: 86, wy: -556 },
      { wx: 142, wy: -632 },  { wx: -78, wy: -714 },  { wx: 118, wy: -768 },
      // Right sky & me editorial zone
      { wx: 248, wy: -236 },  { wx: 282, wy: -74 },   { wx: 416, wy: -218 },
      { wx: 438, wy: -446 },  { wx: 562, wy: -386 },  { wx: 588, wy: -152 },
      { wx: 668, wy: -294 },  { wx: 724, wy: -108 },  { wx: 818, wy: -234 },
      // Upper-right experience bough sky (-920 .. -490)
      { wx: 256, wy: -512 },  { wx: 314, wy: -748 },  { wx: 358, wy: -568 },
      { wx: 468, wy: -644 },  { wx: 518, wy: -876 },  { wx: 618, wy: -736 },
      { wx: 652, wy: -548 },  { wx: 742, wy: -796 },  { wx: 836, wy: -618 },
      { wx: 892, wy: -842 }
    ];

    for (let i = 0; i < pinpointStarZones.length; i++) {
      const pz = pinpointStarZones[i];
      const depth = Number((0.22 + ((i * 0.37 + starRand() * 0.18) % 0.93)).toFixed(3));
      const normD = (depth - 0.22) / (1.15 - 0.22);
      const radius = Number((0.75 + normD * 0.42 + starRand() * 0.18).toFixed(3)); // 0.75px .. 1.35px
      stars.push({
        wx: pz.wx + Math.round((starRand() - 0.5) * 18),
        wy: Math.min(-28, pz.wy + Math.round((starRand() - 0.5) * 14)), // strictly < -18
        depth: clamp(depth, 0.22, 1.15),
        r: clamp(radius, 0.75, 1.35),
        alpha: 0.28 + normD * 0.26 + starRand() * 0.16,
        speed: 0.42 + starRand() * 0.95,
        phase: starRand() * Math.PI * 2,
        bright: depth > 0.74 || starRand() < 0.35,
        glint: false,
        hero: false,
        sparkleScale: 0,
        glintPeriod: 6.0,
        glintSpeed: 1.0,
        glintPhase: 0
      });
    }

    meadowBlades = [];
    for (let i = 0; i < 1120; i++) {
      let wx;
      if (i < 240) {
        wx = (rand() + rand() - 1) * 285;
      } else if (i < 420) {
        wx = 180 + rand() * 540;
      } else {
        wx = (rand() - 0.5) * (WORLD_HORIZON_SPAN * 2);
      }
      const absX = Math.abs(wx);
      const overTerrace = absX > 82 && absX < 222;
      const boost = absX < 82 ? (1 - absX / 82) * 8 : 0;
      meadowBlades.push({
        wx,
        h: 6 + Math.pow(rand(), 1.45) * (overTerrace ? 18 : 23) + boost,
        lean: (rand() - 0.46) * 13,
        w: 0.82 + rand() * 1.08,
        phase: rand() * Math.PI * 2,
        bright: rand() < 0.3,
        layer: overTerrace ? (i % 4 === 0 ? 1 : 0) : i % 2
      });
    }

    const baseFlowers = [
      { wx: -2920, h: 31, kind: "wheat" },
      { wx: -2460, h: 29, kind: "puff" },
      { wx: -1980, h: 35, kind: "wheat" },
      { wx: -1680, h: 30, kind: "puff" },
      { wx: -1360, h: 36, kind: "cup" },
      { wx: -1120, h: 34, kind: "wheat" },
      { wx: -860, h: 32, kind: "puff" },
      { wx: -680, h: 36, kind: "wheat" },
      { wx: -440, h: 35, kind: "cup" },
      { wx: -365, h: 27, kind: "puff" },
      { wx: -270, h: 41, kind: "wheat" },
      { wx: -228, h: 40, kind: "wheat" },
      { wx: -166, h: 44, kind: "wheat" },
      { wx: -102, h: 38, kind: "puff" },
      { wx: -76, h: 46, kind: "wheat" },
      { wx: 78, h: 45, kind: "wheat" },
      { wx: 106, h: 49, kind: "wheat" },
      { wx: 174, h: 36, kind: "puff" },
      { wx: 226, h: 42, kind: "wheat" },
      { wx: 292, h: 35, kind: "puff" },
      { wx: 345, h: 39, kind: "wheat" },
      { wx: 420, h: 33, kind: "cup" },
      { wx: 515, h: 38, kind: "wheat" },
      { wx: 620, h: 29, kind: "puff" },
      { wx: 790, h: 36, kind: "wheat" },
      { wx: 1020, h: 32, kind: "puff" },
      { wx: 1180, h: 34, kind: "cup" },
      { wx: 1490, h: 37, kind: "wheat" },
      { wx: 1740, h: 31, kind: "wheat" },
      { wx: 2140, h: 33, kind: "puff" },
      { wx: 2560, h: 35, kind: "wheat" },
      { wx: 2960, h: 30, kind: "cup" }
    ];
    meadowFlowers = baseFlowers.map((f) => ({
      ...f,
      lean: (rand() - 0.45) * 11,
      phase: rand() * Math.PI * 2
    }));

    distantStones = [
      { wx: -2640, w: 25, h: 8.5 },
      { wx: -1840, w: 22, h: 7.5 },
      { wx: -1240, w: 26, h: 9.0 },
      { wx: -820, w: 19, h: 6.8 },
      { wx: -520, w: 24, h: 8.5 },
      { wx: -496, w: 17, h: 6.2 },
      { wx: -315, w: 21, h: 7.5 },
      { wx: 295, w: 22, h: 7.8 },
      { wx: 318, w: 16, h: 5.8 },
      { wx: 545, w: 24, h: 8.5 },
      { wx: 860, w: 21, h: 7.2 },
      { wx: 1340, w: 25, h: 8.6 },
      { wx: 1920, w: 20, h: 7.0 },
      { wx: 2680, w: 24, h: 8.2 }
    ];

    mossPlacements = [
      { wx: -116, scale: 0.88, alpha: 0.72 },
      { wx: -48, scale: 1.02, alpha: 0.84 },
      { wx: 46, scale: 1.04, alpha: 0.84 },
      { wx: 118, scale: 0.88, alpha: 0.72 },
      { wx: 278, scale: 0.96, alpha: 0.76 },
      { wx: 368, scale: 1.12, alpha: 0.82 },
      { wx: 458, scale: 0.9, alpha: 0.68 }
    ];

    soilPebbles = [];
    for (let i = 0; i < 640; i++) {
      let wx;
      let wy;
      if (i < 240) {
        wx = -420 + rand() * 1300;
        wy = 7 + Math.pow(rand(), 0.88) * 238;
      } else {
        wx = (rand() - 0.5) * (WORLD_HORIZON_SPAN * 2);
        wy = 8 + Math.pow(rand(), 0.92) * (UNDERGROUND_DEPTH - 20);
      }
      soilPebbles.push({
        wx,
        wy,
        rx: 0.65 + rand() * 1.45,
        ry: 0.5 + rand() * 1.1,
        rot: rand() * Math.PI,
        alpha: 0.16 + rand() * 0.36,
        bright: rand() < 0.25
      });
    }

    buriedSeeds = [];
    for (let i = 0; i < 48; i++) {
      const wx = i < 24 ? -360 + rand() * 1180 : (rand() - 0.5) * (WORLD_HORIZON_SPAN * 1.9);
      const wy = 16 + Math.pow(rand(), 0.85) * 225;
      buriedSeeds.push({
        wx,
        wy,
        rot: (rand() - 0.5) * 2.4,
        scale: 0.8 + rand() * 0.5,
        alpha: 0.32 + rand() * 0.36
      });
    }

    // Meandering dotted silver trails (`• • • • •`) through the #13161C underground soil (matching 9AA84C5A!)
    const trailCurves = [
      { p0: [-375, 118], p1: [-332, 134], p2: [-295, 140], p3: [-254, 126], count: 11 },
      { p0: [-208, 152], p1: [-176, 132], p2: [-144, 128], p3: [-108, 144], count: 10 },
      { p0: [-66, 132], p1: [-28, 146], p2: [8, 144], p3: [36, 128], count: 10 },
      { p0: [12, 138], p1: [34, 118], p2: [64, 112], p3: [98, 114], count: 9 },
      { p0: [134, 156], p1: [168, 134], p2: [204, 128], p3: [236, 132], count: 10 },
      { p0: [314, 136], p1: [348, 114], p2: [382, 108], p3: [414, 118], count: 10 },
      { p0: [476, 128], p1: [512, 148], p2: [548, 152], p3: [584, 138], count: 11 },
      { p0: [656, 146], p1: [692, 124], p2: [728, 118], p3: [762, 126], count: 10 }
    ];
    undergroundDotTrails = trailCurves.map((tc, tIdx) => {
      const dots = [];
      for (let i = 0; i < tc.count; i++) {
        const t = tc.count <= 1 ? 0 : i / (tc.count - 1);
        const u = 1 - t;
        const wx =
          u * u * u * tc.p0[0] +
          3 * u * u * t * tc.p1[0] +
          3 * u * t * t * tc.p2[0] +
          t * t * t * tc.p3[0] +
          (rand() - 0.5) * 1.4;
        const wy =
          u * u * u * tc.p0[1] +
          3 * u * u * t * tc.p1[1] +
          3 * u * t * t * tc.p2[1] +
          t * t * t * tc.p3[1] +
          (rand() - 0.5) * 1.4;
        dots.push({
          wx,
          wy,
          r: 1.28 + ((i + tIdx) % 3) * 0.24,
          alpha: 0.72 + rand() * 0.20
        });
      }
      return dots;
    });
  }

  // =========================================================================
  // CLEAN BOTANICAL SHOOTS WITH ALTERNATING TEARDROP LEAF BUDS (E3DDD94F)
  // =========================================================================
  function evalCubic(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return (
      u * u * u * p0 +
      3 * u * u * t * p1 +
      3 * u * t * t * p2 +
      t * t * t * p3
    );
  }

  function evalCubicDeriv(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return (
      3 * u * u * (p1 - p0) +
      6 * u * t * (p2 - p1) +
      3 * t * t * (p3 - p2)
    );
  }

  // Clean, nearly-straight gently-tapering botanical shoot (2.3px -> 1.3px on canopy menu twigs)
  // with 3-4 tiny alternating filled teardrop leaf buds (4.5px x 2.1px) along top/bottom!
  function drawGrowingShoot(x0, y0, cx1, cy1, cx2, cy2, x3, y3, prog, wStart, wEnd, color, seed) {
    if (prog <= 0.005) return { endX: x0, endY: y0 };
    const steps = 18;
    const bowSign = Math.sin(seed * 1.7) >= 0 ? 1 : -1;

    ctx.save();
    ctx.strokeStyle = color || CHALK;
    ctx.fillStyle = color || CHALK;
    ctx.lineCap = "round";

    let prevX = x0;
    let prevY = y0;
    for (let i = 1; i <= steps; i++) {
      const u = (i / steps) * prog;
      // Whisper-subtle natural bow (<= 0.55px, ZERO wiggly S-curves!)
      const subtleBow = bowSign * 0.5 * Math.sin(u * Math.PI);
      const nx = evalCubic(x0, cx1, cx2, x3, u);
      const ny = evalCubic(y0, cy1, cy2, y3, u) + subtleBow;

      ctx.lineWidth = wStart + (wEnd - wStart) * u;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      prevX = nx;
      prevY = ny;
    }

    const approxSpan = Math.hypot(x3 - x0, y3 - y0);
    const budSpots = approxSpan >= 54 ? [0.23, 0.45, 0.67, 0.85] : [0.28, 0.56, 0.82];
    const startSide = seed % 2 >= 1 ? 1 : -1;

    budSpots.forEach((bs, idx) => {
      if (prog <= bs + 0.04) return;
      const budScale = smoothstep(bs, bs + 0.14, prog);
      const subtleBow = bowSign * 0.5 * Math.sin(bs * Math.PI);
      const bx = evalCubic(x0, cx1, cx2, x3, bs);
      const by = evalCubic(y0, cy1, cy2, y3, bs) + subtleBow;

      const dx = evalCubicDeriv(x0, cx1, cx2, x3, bs);
      const dy = evalCubicDeriv(y0, cy1, cy2, y3, bs);
      const stemAng = Math.atan2(dy, dx);
      const normX = -Math.sin(stemAng);
      const normY = Math.cos(stemAng);

      // Alternating top / bottom filled teardrop leaf bud (4.5px x 2.1px) — NO V-arrowhead!
      const side = (idx % 2 === 0 ? 1 : -1) * startSide;
      const budAng = stemAng + side * 0.56;
      const attachX = bx + normX * side * 0.45;
      const attachY = by + normY * side * 0.45;

      drawTeardropBud(
        ctx,
        attachX,
        attachY,
        4.5 * budScale,
        2.1 * budScale,
        budAng,
        idx % 2 === 0 ? color : CHALK_BRIGHT
      );
    });

    ctx.restore();
    return { endX: prevX, endY: prevY };
  }

  function drawSkyTextFeather(cxWorld, cyWorld, radius, x, y, w, h) {
    const clampedSkyBottom = Math.min(y + h, -3);
    const safeSkyH = clampedSkyBottom - y;
    if (safeSkyH > 2) {
      const grad = ctx.createRadialGradient(cxWorld, cyWorld, 10, cxWorld, cyWorld, radius);
      grad.addColorStop(0, "rgba(28, 31, 38, 0.84)");
      grad.addColorStop(1, "rgba(28, 31, 38, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, safeSkyH);
    }

    const clampedSoilTop = Math.max(y, 4);
    const safeSoilH = y + h - clampedSoilTop;
    if (safeSoilH > 2) {
      const sGrad = ctx.createRadialGradient(cxWorld, cyWorld, 10, cxWorld, cyWorld, radius);
      sGrad.addColorStop(0, "rgba(19, 22, 28, 0.90)");
      sGrad.addColorStop(1, "rgba(19, 22, 28, 0)");
      ctx.fillStyle = sGrad;
      ctx.fillRect(x, clampedSoilTop, w, safeSoilH);
    }
  }

  // =========================================================================
  // WORLD-SPACE MENU TWIGS, GROWN BRANCHES & DISCRETE TYPEWRITER RENDERER
  // =========================================================================
  function renderMeEditorialAndPortrait(bCfg, lay, tipX, tipY, canopySway) {
    const rtl = isRTL();
    const limbProg = branchLimbGrow.me;
    const limbRaw = limbProg;
    const bioProg = meBioType;
    let maxProjVis = meProjectsHeadingType;
    if (bCfg && Array.isArray(bCfg.items)) {
      for (let i = 0; i < bCfg.items.length; i++) {
        const pid = bCfg.items[i].id;
        if ((subTwigGrow[pid] || 0) > maxProjVis) maxProjVis = subTwigGrow[pid] || 0;
        if ((itemType[pid] || 0) > maxProjVis) maxProjVis = itemType[pid] || 0;
      }
    }
    if (limbProg <= 0.004 && bioProg <= 0.004 && maxProjVis <= 0.004) return;

    const boughEndX = tipX + 62 + canopySway * 0.5;
    const boughEndY = tipY - 64;

    if (mistyCloudBuffer && limbProg > 0.08) {
      const ca = smoothstep(0.08, 0.8, limbProg) * 0.9;
      ctx.save();
      ctx.globalAlpha = ca;
      ctx.drawImage(mistyCloudBuffer, boughEndX - 68, boughEndY - 46, 136, 96);
      ctx.restore();
    }

    const forkEnd = drawGrowingShoot(
      tipX - 20,
      tipY + 3,
      tipX + 10,
      tipY - 19,
      boughEndX - 20,
      boughEndY + 16,
      boughEndX,
      boughEndY,
      limbProg,
      2.6,
      1.5,
      CHALK_BRIGHT,
      7.4
    );

    if (tuftBuffer && limbProg > 0.35) {
      const ts = smoothstep(0.35, 1.0, limbProg) * 42;
      ctx.save();
      ctx.globalAlpha = smoothstep(0.35, 1.0, limbProg) * 0.92;
      ctx.drawImage(tuftBuffer, forkEnd.endX - ts * 0.5, forkEnd.endY - ts * 0.5, ts, ts);
      ctx.restore();
    }

    if (limbProg > 0.55) {
      const fp = smoothstep(0.55, 1.0, limbProg);
      ctx.save();
      ctx.strokeStyle = CHALK_BRIGHT;
      ctx.lineCap = "round";
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(boughEndX + 8, boughEndY - 4);
      ctx.lineTo(boughEndX + 8 + 26 * fp, boughEndY - 4 - 9 * fp);
      ctx.moveTo(boughEndX + 18, boughEndY - 8);
      ctx.lineTo(boughEndX + 18 + 12 * fp, boughEndY - 8 - 34 * fp);
      ctx.stroke();
      ctx.restore();
    }

    if (!bCfg.bioEditorial) return;

    const meLay = computeMeEditorialLayout(bCfg, lay);
    const bioColW = meLay.bioColW;
    const bioLeft = meLay.bioLeft + canopySway * 0.25;
    const bioRight = bioLeft + bioColW;
    const bioTopY = meLay.bioTopY;
    const fontSpec = meLay.fontSpec;
    const lineH = meLay.lineH;
    const paraGap = meLay.paraGap;
    const wrappedParas = meLay.wrappedParas;
    const totalBioH = meLay.totalBioH;

    if (bioProg > 0.004) {
    if (activeBranch === "me") {
      const tl = worldToScreen(bioLeft, bioTopY);
      const br = worldToScreen(bioRight, bioTopY + totalBioH - paraGap);
      lastBioScreenBox = {
        left: tl.x,
        right: br.x,
        top: tl.y,
        bottom: br.y
      };
    }

    ctx.save();
    resetCanvasLetterSpacing();
    ctx.font = fontSpec;
    ctx.direction = rtl ? "rtl" : "ltr";
    ctx.textAlign = rtl ? "right" : "left";
    ctx.textBaseline = "alphabetic";

    drawSkyTextFeather(
      (bioLeft + bioRight) * 0.5,
      bioTopY + totalBioH * 0.48,
      Math.max(150, totalBioH * 0.72) * clamp(bioProg * 1.25, 0.25, 1),
      bioLeft - 28,
      bioTopY - 20,
      bioColW + 56,
      totalBioH + 36
    );

    const flatBioLines = [];
    wrappedParas.forEach((wp) => {
      wp.lines.forEach((ln) => flatBioLines.push(ln));
    });
    const lineCharCounts = computeLinesCharSchedule(flatBioLines, bioProg, meBioErasing, 3.0);

    let flatIdx = 0;
    let cy = bioTopY;
    const textX = rtl ? bioRight : bioLeft;

    wrappedParas.forEach((wp, pIdx) => {
      wp.lines.forEach((fullLine, lIdx) => {
        const take = lineCharCounts[flatIdx++] || 0;
        if (take > 0) {
          ctx.font = fontSpec;
          const sub = fullLine.slice(0, take);
          const baselineY = cy + 15.0;
          const underlineY = baselineY + (rtl ? 10.6 : 7.0);
          const lineSpan = wp.lineSpans && wp.lineSpans[lIdx];
          const hoveredPhraseDraws = [];

          wp.highlights.forEach((hl, hIdx) => {
            let pos = -1;
            let segPhrase = "";
            if (lineSpan) {
              const pStart = wp.raw.indexOf(hl.phrase);
              if (pStart !== -1) {
                const ovStart = Math.max(pStart, lineSpan.start);
                const ovEnd = Math.min(pStart + hl.phrase.length, lineSpan.end);
                if (ovStart < ovEnd) {
                  pos = ovStart - lineSpan.start;
                  segPhrase = fullLine.slice(pos, ovEnd - lineSpan.start);
                }
              }
            } else {
              pos = fullLine.indexOf(hl.phrase);
              if (pos !== -1) segPhrase = hl.phrase;
            }

            if (pos !== -1 && segPhrase && take > pos) {
              const visLen = Math.min(segPhrase.length, take - pos);
              const fullSpan = measureBiDiPhraseSpan(
                fullLine,
                pos,
                pos + segPhrase.length,
                bioLeft,
                bioRight,
                rtl
              );
              const visSpan = measureBiDiPhraseSpan(
                fullLine,
                pos,
                pos + visLen,
                bioLeft,
                bioRight,
                rtl
              );
              const fullPhraseW = Math.max(1, fullSpan.width);
              const fullLeft = fullSpan.xLeft;
              const hitId = `mebio:${pIdx}:${hIdx}:${lIdx}`;
              const isInteractive = Boolean(hl.projectId || hl.action);
              const isHov = isInteractive && hoveredHit && hoveredHit.id === hitId;
              const uProg = clamp(visSpan.width / fullPhraseW, 0, 1);

              drawWavyUnderline(
                fullLeft,
                underlineY,
                fullPhraseW,
                uProg,
                pIdx * 5.3 + hIdx * 2.7 + lIdx,
                isInteractive
                  ? isHov
                    ? CHALK_BRIGHT
                    : "rgba(220, 224, 232, 0.90)"
                  : "rgba(198, 202, 210, 0.78)",
                isInteractive ? (isHov ? 1.25 : 1.18) : 1.10,
                rtl
              );

              if (activeBranch === "me" && visLen === segPhrase.length) {
                lastBioHighlightLogs.push({
                  phrase: hl.phrase,
                  segPhrase,
                  projectId: hl.projectId || null,
                  lineText: fullLine,
                  baselineY,
                  underlineY,
                  deltaY: underlineY - baselineY,
                  xLeft: fullSpan.xLeft,
                  xRight: fullSpan.xRight,
                  width: fullPhraseW
                });

                if (hl.projectId) {
                  worldHitboxes.push({
                    id: hitId,
                    kind: "project-jump",
                    projectId: hl.projectId,
                    phrase: hl.phrase,
                    x: fullLeft - 4,
                    y: baselineY - 15,
                    w: fullPhraseW + 8,
                    h: (underlineY - (baselineY - 15)) + 5
                  });
                } else if (hl.action) {
                  worldHitboxes.push({
                    id: hitId,
                    kind: "action",
                    action: hl.action,
                    x: fullLeft - 4,
                    y: baselineY - 15,
                    w: fullPhraseW + 8,
                    h: (underlineY - (baselineY - 15)) + 5
                  });
                }
              }

              if (isHov && visLen === segPhrase.length) {
                hoveredPhraseDraws.push({
                  segPhrase,
                  xLeft: fullSpan.xLeft,
                  xRight: fullSpan.xRight
                });
              }
            }
          });

          drawChalkText(sub, textX, baselineY, CHALK, 14, 1.0);

          hoveredPhraseDraws.forEach((hd) => {
            ctx.save();
            const phraseRtl = hasArabicChars(hd.segPhrase);
            ctx.direction = phraseRtl ? "rtl" : "ltr";
            ctx.textAlign = phraseRtl ? "right" : "left";
            drawChalkText(
              hd.segPhrase,
              phraseRtl ? hd.xRight : hd.xLeft,
              baselineY,
              CHALK_BRIGHT,
              14,
              1.0
            );
            drawFourPointSparkle(
              rtl ? hd.xLeft - 4 : hd.xRight + 4,
              baselineY - 10,
              3.4,
              CHALK_BRIGHT,
              0.92
            );
            ctx.restore();
            ctx.font = fontSpec;
            ctx.direction = rtl ? "rtl" : "ltr";
            ctx.textAlign = rtl ? "right" : "left";
          });
        }
        cy += lineH;
      });
      cy += paraGap;
    });

    ctx.restore();
    }

    // Mamdouh's 45° Halftone Taped Zine Portrait + Natural-Color Hover Reveal + Reverse Close Scale (1.0 -> 0.92)
    const pAlpha = smoothstep(0.06, 0.82, Math.max(bioProg, limbProg * 0.85));
    if (pAlpha > 0.01) {
      const pw = meLay.pw;
      const ph = meLay.ph;
      const px = meLay.px + canopySway * 0.25;
      const py = meLay.py;
      const pcx = px + pw * 0.5;
      const pcy = py + ph * 0.5;
      const pAngle = -0.048;

      if (activeBranch === "me") {
        const ptl = worldToScreen(px - meLay.rotPadX * 0.4, py - meLay.rotPadY * 0.4);
        const pbr = worldToScreen(px + pw + meLay.rotPadX * 0.4, py + ph + meLay.rotPadY * 0.4);
        lastPortraitScreenBox = {
          left: ptl.x,
          right: pbr.x,
          top: ptl.y,
          bottom: pbr.y
        };
      }

      if (activeBranch === "me" && pAlpha > 0.08) {
        portraitBounds = {
          cx: pcx,
          cy: pcy,
          w: pw,
          h: ph,
          angle: pAngle
        };
      }

      if (mePortraitBuffer || mePortraitColorBuffer) {
        const smoothHoverMix = smoothstep(0, 1, portraitHoverMix);
        const closeShrink = 0.92 + 0.08 * pAlpha;
        const liftScale = closeShrink * (1 + 0.022 * smoothHoverMix);

        ctx.save();
        ctx.translate(pcx, pcy);
        ctx.rotate(pAngle);
        ctx.scale(liftScale, liftScale);

        if (mePortraitBuffer) {
          ctx.globalAlpha = pAlpha;
          ctx.drawImage(mePortraitBuffer, -pw * 0.5, -ph * 0.5, pw, ph);
        }

        if (mePortraitColorBuffer && smoothHoverMix > 0.002) {
          ctx.globalAlpha = pAlpha * smoothHoverMix;
          ctx.drawImage(mePortraitColorBuffer, -pw * 0.5, -ph * 0.5, pw, ph);
        }

        ctx.restore();
      }
    }

    // Contact links row directly beneath the 3 bio paragraphs
    if (meLay.contactRows && meLay.contactRows.length > 0 && bioProg > 0.45) {
      const contactP = clamp((bioProg - 0.45) / 0.55, 0, 1);
      ctx.save();
      resetCanvasLetterSpacing();
      let ccy = meLay.contactTopY;
      meLay.contactRows.forEach((row, rIdx) => {
        row.items.forEach((entry) => {
          const { act, aIdx, tw, offsetX } = entry;
          const localP = clamp((contactP - aIdx * 0.12) / 0.88, 0, 1);
          if (localP <= 0.01) return;

          ctx.font = canvasFont("500 12.4px", act.label);
          const actHitId = `mecontact:${aIdx}`;
          const actHov = hoveredHit && hoveredHit.id === actHitId;
          const actRight = bioRight - offsetX;
          const actLeft = rtl ? actRight - tw : bioLeft + offsetX;
          const actAnchorX = rtl ? actRight : actLeft;
          const isArAct = hasArabicChars(act.label);
          ctx.direction = isArAct ? "rtl" : "ltr";
          ctx.textAlign = rtl ? "right" : "left";
          ctx.textBaseline = "alphabetic";
          const actBaseY = ccy + 13.0;
          const actUnderY = actBaseY + ((rtl || isArAct) ? 10.6 : 6.8);

          const visCnt = computeDiscreteCharCount(act.label, localP, meBioErasing, 2.0);
          if (visCnt > 0) {
            const typedAct = act.label.slice(0, visCnt);
            const typedW = ctx.measureText(typedAct).width;
            drawWavyUnderline(
              actLeft,
              actUnderY,
              tw,
              clamp(typedW / Math.max(1, tw), 0, 1),
              aIdx * 3.7 + rIdx * 1.9 + 1.2,
              actHov ? CHALK_BRIGHT : "rgba(220, 224, 232, 0.86)",
              actHov ? 1.25 : 1.12,
              rtl
            );
            drawChalkText(typedAct, actAnchorX, actBaseY, actHov ? CHALK_BRIGHT : CHALK, 12.4, 1.0);

            if (activeBranch === "me" && localP > 0.35) {
              worldHitboxes.push({
                id: actHitId,
                kind: "action",
                action: act,
                x: actLeft - 5,
                y: ccy - 2,
                w: tw + 10,
                h: 24
              });
            }
          }
        });
        ccy += meLay.contactRowH;
      });
      ctx.restore();
    }

    // =========================================================================
    // SELECTED PROJECTS LIVING OLIVE VINE, 4 BOTANICAL FILTERS & 10 EMBLEM CARDS
    // =========================================================================
    const headProg = meProjectsHeadingType;
    const vineBaseX = meLay.vineX + canopySway * 0.2;
    const headY = meLay.projectsHeadingY;
    const pLeft = meLay.projLeft + canopySway * 0.2;
    const pRight = meLay.projRight + canopySway * 0.2;
    const subShootProg = easeOutCubic(clamp((limbRaw - 0.16) / 0.78, 0, 1));

    function vineXAt(wy) {
      return vineBaseX + Math.sin(wy * 0.030 + 0.85) * 3.2;
    }

    if (subShootProg > 0.01 && meLay.measuredProjects.length > 0) {
      const vineStartX = vineXAt(headY + 10);
      const corridorY = meLay.topSectionBottomY + (headY - meLay.topSectionBottomY) * 0.48;
      if (rtl) {
        const leftCorridorX = pLeft - 20;
        const p1 = clamp(subShootProg / 0.62, 0, 1);
        drawGrowingShoot(
          boughEndX - 6,
          boughEndY + 8,
          leftCorridorX - 18,
          (boughEndY + corridorY) * 0.45,
          leftCorridorX,
          corridorY - 24,
          leftCorridorX + 12,
          corridorY,
          p1,
          2.0,
          1.45,
          CHALK,
          5.8
        );
        const p2 = clamp((subShootProg - 0.55) / 0.45, 0, 1);
        if (p2 > 0.01) {
          drawGrowingShoot(
            leftCorridorX + 12,
            corridorY,
            (leftCorridorX + vineStartX) * 0.42,
            corridorY - 4,
            vineStartX - 10,
            corridorY + 4,
            vineStartX,
            headY + 10,
            p2,
            1.45,
            1.35,
            CHALK,
            8.1
          );
        }
      } else {
        drawGrowingShoot(
          boughEndX - 6,
          boughEndY + 8,
          vineStartX - 22,
          (boughEndY + headY) * 0.45,
          vineStartX - 6,
          headY - 42,
          vineStartX,
          headY + 10,
          subShootProg,
          2.0,
          1.35,
          CHALK,
          5.8
        );
      }

      const lastProj = meLay.measuredProjects[meLay.measuredProjects.length - 1];
      const stemTopY = headY + 10;
      const stemBottomY = lastProj.jointY + 6;
      const stemGrowP = easeOutCubic(clamp((limbRaw - 0.28) / 0.72, 0, 1));
      if (stemGrowP > 0.01 && stemBottomY > stemTopY) {
        const curStemEnd = stemTopY + (stemBottomY - stemTopY) * stemGrowP;
        ctx.save();
        ctx.strokeStyle = "rgba(198, 202, 210, 0.78)";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const vineSteps = Math.max(14, Math.ceil((curStemEnd - stemTopY) / 14));
        let prevVX = vineXAt(stemTopY);
        let prevVY = stemTopY;
        for (let s = 1; s <= vineSteps; s++) {
          const u = s / vineSteps;
          const vy = stemTopY + (curStemEnd - stemTopY) * u;
          const vx = vineXAt(vy);
          ctx.lineWidth = 1.65 - 0.45 * u;
          ctx.beginPath();
          ctx.moveTo(prevVX, prevVY);
          ctx.lineTo(vx, vy);
          ctx.stroke();
          prevVX = vx;
          prevVY = vy;
        }
        if (stemGrowP > 0.85) {
          drawTeardropBud(ctx, prevVX, prevVY + 3.5, 4.0, 1.8, Math.PI * 0.5, CHALK);
        }
        ctx.restore();
      }
    }

    if (headProg > 0.005) {
      ctx.save();
      resetCanvasLetterSpacing();
      ctx.font = canvasFont("600 15.2px", meLay.projectsHeading);
      ctx.direction = rtl ? "rtl" : "ltr";
      ctx.textAlign = rtl ? "right" : "left";
      ctx.textBaseline = "alphabetic";

      const hAnchorX = rtl ? pRight : pLeft;
      const headBaseY = headY + 15.5;
      const headUnderY = headBaseY + (rtl ? 10.6 : 7.0);

      drawSkyTextFeather(
        (pLeft + pRight) * 0.5,
        headY + 14,
        118,
        pLeft - 20,
        headY - 8,
        meLay.projColW + 40,
        42
      );

      const vxHead = vineXAt(headY + 10);
      ctx.strokeStyle = CHALK_BRIGHT;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(vxHead, headY + 10);
      ctx.lineTo(rtl ? pRight + 8 : pLeft - 8, headY + 10);
      ctx.stroke();
      drawTeardropBud(
        ctx,
        vxHead + (rtl ? -4 : 4),
        headY + 9.2,
        4.4,
        2.0,
        rtl ? Math.PI + 0.45 : -0.45,
        CHALK_BRIGHT
      );

      const headVis = computeDiscreteCharCount(meLay.projectsHeading, headProg, meProjectsHeadingErasing, 2.2);
      if (headVis > 0) {
        const typedHead = meLay.projectsHeading.slice(0, headVis);
        const typedW = ctx.measureText(typedHead).width;
        const uLeft = rtl ? pRight - meLay.projectsHeadingW : pLeft;
        drawWavyUnderline(
          uLeft,
          headUnderY,
          meLay.projectsHeadingW,
          clamp(typedW / Math.max(1, meLay.projectsHeadingW), 0, 1),
          9.4,
          CHALK_BRIGHT,
          1.22,
          rtl
        );
        drawChalkText(typedHead, hAnchorX, headBaseY, CHALK_BRIGHT, 15.2, 1.0);
      }

      if (headProg > 0.35 && meLay.filterRows && meLay.filterRows.length > 0) {
        const fltP = easeOutCubic(clamp((headProg - 0.35) / 0.65, 0, 1));
        ctx.save();
        ctx.globalAlpha = fltP;
        let fRowY = meLay.filterTopY;
        meLay.filterRows.forEach((row) => {
          row.items.forEach((entry) => {
            const { flt, fSize, pillW, offsetX } = entry;
            const isActiveFlt = meProjectFilter === flt.id;
            const fltHitId = `projfilter:${flt.id}`;
            const isFltHov = hoveredHit && hoveredHit.id === fltHitId;

            const pillLeft = rtl ? pRight - offsetX - pillW : pLeft + offsetX;
            const pillRight = pillLeft + pillW;
            const pillTop = fRowY;
            const pillH = meLay.filterPillH;

            ctx.save();
            drawRoundedCapsulePath(pillLeft, pillTop, pillW, pillH, 10);
            ctx.fillStyle = isActiveFlt
              ? "rgba(220, 224, 232, 0.14)"
              : isFltHov
                ? "rgba(198, 202, 210, 0.09)"
                : "rgba(19, 22, 28, 0.68)";
            ctx.fill();
            ctx.strokeStyle = isActiveFlt
              ? "rgba(220, 224, 232, 0.82)"
              : isFltHov
                ? "rgba(198, 202, 210, 0.68)"
                : "rgba(154, 162, 178, 0.42)";
            ctx.lineWidth = isActiveFlt ? 1.15 : 0.95;
            if (!isActiveFlt && typeof ctx.setLineDash === "function") {
              ctx.setLineDash([2.5, 2.5]);
            }
            ctx.stroke();
            if (typeof ctx.setLineDash === "function") {
              ctx.setLineDash([]);
            }

            const dotX = rtl ? pillRight - 8.5 : pillLeft + 8.5;
            const dotY = pillTop + pillH * 0.5;
            ctx.fillStyle = isActiveFlt ? CHALK_BRIGHT : "rgba(154, 162, 178, 0.62)";
            ctx.beginPath();
            ctx.arc(dotX, dotY, isActiveFlt ? 2.1 : 1.4, 0, Math.PI * 2);
            ctx.fill();

            resetCanvasLetterSpacing();
            ctx.font = `${isActiveFlt ? 600 : 500} ${fSize}px ${fontFamilyFor(flt.label)}`;
            ctx.direction = rtl || hasArabicChars(flt.label) ? "rtl" : "ltr";
            ctx.textAlign = rtl ? "right" : "left";
            ctx.textBaseline = "middle";
            const fTextX = rtl ? pillRight - 15 : pillLeft + 15;
            drawChalkText(
              flt.label,
              fTextX,
              dotY + 0.5,
              isActiveFlt || isFltHov ? CHALK_BRIGHT : CHALK_MUTED,
              fSize,
              1.0
            );
            ctx.restore();

            if (activeBranch === "me") {
              const ftl = worldToScreen(pillLeft, pillTop);
              const fbr = worldToScreen(pillRight, pillTop + pillH);
              lastMeFilterScreenBoxes.push({
                id: flt.id,
                label: flt.label,
                active: isActiveFlt,
                worldLeft: pillLeft,
                worldRight: pillRight,
                worldTop: pillTop,
                worldBottom: pillTop + pillH,
                screenLeft: ftl.x,
                screenRight: fbr.x,
                screenTop: ftl.y,
                screenBottom: fbr.y
              });

              worldHitboxes.push({
                id: fltHitId,
                kind: "project-filter",
                filterKey: flt.id,
                x: pillLeft - 3,
                y: pillTop - 3,
                w: pillW + 6,
                h: pillH + 6
              });
            }
          });
          fRowY += meLay.filterRowH;
        });
        ctx.restore();
      }

      ctx.restore();
    }

    meLay.measuredProjects.forEach((mp, idx) => {
      const id = mp.item.id;
      const stRaw = subTwigGrow[id] || 0;
      const stProg = easeOutCubic(stRaw);
      const tProg = itemType[id] || 0;
      const isItErasing = Boolean(itemErasing[id]);
      const sumFactor = siblingSumFactor[id] === undefined ? 1 : siblingSumFactor[id];

      const rowLeft = mp.projLeft + canopySway * 0.2;
      const rowRight = mp.projRight + canopySway * 0.2;
      const boxL = mp.textLeft + canopySway * 0.2;
      const boxR = mp.textRight + canopySway * 0.2;
      const photoSlotL = mp.photoSlotLeft + canopySway * 0.2;
      const photoSlotR = mp.photoSlotRight + canopySway * 0.2;
      const nodeY = mp.jointY;
      const vxNode = vineXAt(nodeY - 4);
      const twigTargetX = rtl ? boxR + 6 : boxL - 6;

      const itemHitId = "item:" + id;
      const photoHitId = "proj-photo:" + id;
      const isDirectPhotoHov = Boolean(hoveredHit && hoveredHit.id === photoHitId);
      const isItemHov = Boolean(
        hoveredHit && (hoveredHit.id === itemHitId || hoveredHit.id === photoHitId)
      );
      const isItemOpen = activeItem === id || expandedItems.has(id);
      hoverAmt[itemHitId] =
        (hoverAmt[itemHitId] || 0) +
        ((isItemHov || isItemOpen ? 1 : 0) - (hoverAmt[itemHitId] || 0)) * 0.24;
      const ihp = hoverAmt[itemHitId];

      const pHover = clamp(projectPhotoHover[id] || 0, 0, 1);
      projectPhotoLift[id] = pHover;
      const pLift = pHover;
      let currentPhotoHitRect = null;

      if (stProg > 0.01) {
        const twigEnd = drawGrowingShoot(
          vxNode,
          nodeY - 5,
          vxNode + (twigTargetX - vxNode) * 0.38,
          nodeY - 3,
          vxNode + (twigTargetX - vxNode) * 0.75,
          nodeY,
          twigTargetX,
          nodeY,
          stProg,
          1.55,
          1.05,
          isItemOpen || ihp > 0.15 ? CHALK_BRIGHT : CHALK,
          idx * 2.9 + 4.2
        );

        if (tuftBuffer && stProg > 0.35) {
          const miniS = smoothstep(0.35, 1.0, stProg) * (13.5 + ihp * 2.5);
          const tuftCx = vxNode + (twigEnd.endX - vxNode) * 0.55;
          const tuftCy = nodeY - 3.5;
          ctx.save();
          ctx.globalAlpha = smoothstep(0.35, 1.0, stProg) * (0.76 + ihp * 0.22);
          ctx.drawImage(tuftBuffer, tuftCx - miniS * 0.5, tuftCy - miniS * 0.5, miniS, miniS);
          ctx.restore();
        }

        if (ihp > 0.04) {
          drawFourPointSparkle(
            twigEnd.endX + (rtl ? 3.5 : -3.5),
            nodeY - 7.5,
            3.2 + ihp * 1.4,
            CHALK_BRIGHT,
            ihp * 0.95
          );
        }
      }

      if (tProg > 0.004) {
        const siblingDim =
          activeBranch === "me" && activeItem && activeItem !== id ? 0.52 : 1.0;

        const textX = rtl ? boxR : boxL;
        const align = rtl ? "right" : "left";

        ctx.save();
        ctx.globalAlpha = siblingDim;
        ctx.direction = rtl ? "rtl" : "ltr";
        ctx.textAlign = align;
        ctx.textBaseline = "alphabetic";

        drawSkyTextFeather(
          (rowLeft + rowRight) * 0.5,
          mp.topY + mp.blockH * 0.5,
          Math.max(108, mp.blockH * 0.95) * clamp(tProg * 1.3, 0.25, 1),
          rowLeft - 22,
          mp.topY - 10,
          mp.projColW + 44,
          mp.blockH + 20
        );

        // Render Dual-Buffer (256x198) Taped 45° Halftone + Full-Color Hover Zine Picture
        // (left side in AR RTL, right side in EN LTR — strictly inside [photoSlotL .. photoSlotR]!)
        const pCard = projectPhotoCards[id];
        const photoAlpha = clamp(tProg * 1.35, 0, 1);
        if (pCard && (pCard.halftoneCanvas || pCard.canvas) && photoAlpha > 0.02) {
          const hCanvas = pCard.halftoneCanvas || pCard.canvas;
          const cCanvas = pCard.colorCanvas || null;
          const closeShrink = 0.92 + 0.08 * photoAlpha;
          const hoverScale = 1.0 + 0.09 * pHover;
          const finalScale = closeShrink * hoverScale;
          const baseTilt = pCard.tiltRad || 0;
          // Gentle 1.2° (0.0209 rad) tilt settle as hover brings full colors to life
          const tiltSign = baseTilt >= 0 ? 1 : -1;
          const finalTilt = baseTilt - tiltSign * Math.min(Math.abs(baseTilt), 0.0209) * pHover;

          const cardWWorld = mp.photoW; // 84 desktop/tablet, 68 mobile
          const cardHWorld = mp.photoH; // 66 desktop/tablet, 54 mobile
          const drawBufW = cardWWorld * (pCard.bufW / pCard.cardW);
          const drawBufH = cardHWorld * (pCard.bufH / pCard.cardH);
          const photoCx = (photoSlotL + photoSlotR) * 0.5;
          const photoCy = mp.topY + Math.max(cardHWorld * 0.5 + 4, mp.blockH * 0.48);

          const halftoneAlpha = photoAlpha * (1 - pHover * 0.92);
          const colorAlpha = cCanvas ? photoAlpha * pHover : 0;

          ctx.save();
          ctx.translate(photoCx, photoCy);
          ctx.rotate(finalTilt);
          ctx.scale(finalScale, finalScale);
          if (hCanvas && halftoneAlpha > 0.002) {
            ctx.globalAlpha = siblingDim * halftoneAlpha;
            ctx.drawImage(hCanvas, -drawBufW * 0.5, -drawBufH * 0.5, drawBufW, drawBufH);
          }
          if (cCanvas && colorAlpha > 0.002) {
            ctx.globalAlpha = siblingDim * colorAlpha;
            ctx.drawImage(cCanvas, -drawBufW * 0.5, -drawBufH * 0.5, drawBufW, drawBufH);
          }
          ctx.restore();

          // Exact axis-aligned world & screen bounding box of rotated+scaled card body for 0 px² collision audit
          const cosT = Math.abs(Math.cos(finalTilt));
          const sinT = Math.abs(Math.sin(finalTilt));
          const halfExtX = (cardWWorld * 0.5 * cosT + cardHWorld * 0.5 * sinT) * finalScale;
          const halfExtY = (cardWWorld * 0.5 * sinT + cardHWorld * 0.5 * cosT) * finalScale;
          const pWorldL = photoCx - halfExtX;
          const pWorldR = photoCx + halfExtX;
          const pWorldT = photoCy - halfExtY;
          const pWorldB = photoCy + halfExtY;

          currentPhotoHitRect = {
            x: pWorldL - 3,
            y: pWorldT - 3,
            w: (pWorldR - pWorldL) + 6,
            h: (pWorldB - pWorldT) + 6
          };

          lastMeProjectSubBoxes.push({
            projectId: id,
            part: "photo",
            left: pWorldL,
            right: pWorldR,
            top: pWorldT,
            bottom: pWorldB
          });

          const pScrTL = worldToScreen(pWorldL, pWorldT);
          const pScrBR = worldToScreen(pWorldR, pWorldB);
          lastMeProjectPhotoBoxes.push({
            projectId: id,
            sceneKey: pCard.sceneKey,
            bufW: pCard.bufW,
            bufH: pCard.bufH,
            pitch: pCard.pitch,
            dotCount: pCard.dotCount,
            tapeCount: pCard.tapeCount,
            hover: pHover,
            isDirectPhotoHov,
            halftoneAlpha,
            colorAlpha,
            isRealPhoto: Boolean(pCard.isRealPhoto),
            loadedUrl: pCard.loadedUrl || null,
            rebuildCount: pCard.rebuildCount || 1,
            scale: finalScale,
            tiltRad: finalTilt,
            worldLeft: pWorldL,
            worldRight: pWorldR,
            worldTop: pWorldT,
            worldBottom: pWorldB,
            textWorldLeft: boxL,
            textWorldRight: boxR,
            screenLeft: pScrTL.x,
            screenRight: pScrBR.x,
            screenTop: pScrTL.y,
            screenBottom: pScrBR.y
          });
        }

        let cy = mp.topY;
        const headerAlpha = clamp(tProg * 1.65, 0, 1);

        if (headerAlpha > 0.02) {
          ctx.save();
          ctx.globalAlpha *= headerAlpha;

          const emblemCx = rtl ? boxR - 7 : boxL + 7;
          const emblemCy = cy + 9.2;
          drawProjectMicroEmblem(
            mp.item.emblem || "crest",
            emblemCx,
            emblemCy,
            isItemOpen || ihp > 0.15 ? CHALK_BRIGHT : CHALK,
            ihp
          );
          lastMeProjectSubBoxes.push({
            projectId: id,
            part: "emblem",
            left: emblemCx - 7,
            right: emblemCx + 7,
            top: cy + 2,
            bottom: cy + 16.5
          });

          if (mp.badgeStr && mp.badgePillW > 0) {
            const bLeft = rtl ? boxR - 22 - mp.badgePillW : boxL + 22;
            const bTop = cy + 0.5;
            const bH = 18.0;
            drawRoundedCapsulePath(bLeft, bTop, mp.badgePillW, bH, 9);
            ctx.fillStyle = isItemOpen || ihp > 0.15
              ? "rgba(223, 226, 232, 0.15)"
              : "rgba(200, 203, 210, 0.10)";
            ctx.fill();
            ctx.strokeStyle = isItemOpen || ihp > 0.15
              ? "rgba(223, 226, 232, 0.72)"
              : "rgba(148, 153, 166, 0.55)";
            ctx.lineWidth = 0.9;
            if (typeof ctx.setLineDash === "function") {
              ctx.setLineDash([2.2, 2.2]);
            }
            ctx.stroke();
            if (typeof ctx.setLineDash === "function") {
              ctx.setLineDash([]);
            }

            resetCanvasLetterSpacing();
            ctx.font = `500 ${mp.badgeFontPx}px ${fontFamilyFor(mp.badgeStr)}`;
            ctx.direction = rtl || hasArabicChars(mp.badgeStr) ? "rtl" : "ltr";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            drawChalkText(
              mp.badgeStr,
              bLeft + mp.badgePillW * 0.5,
              bTop + bH * 0.5 + 0.4,
              isItemOpen || ihp > 0.15 ? CHALK_BRIGHT : CHALK,
              mp.badgeFontPx,
              1.0
            );
            lastMeProjectSubBoxes.push({
              projectId: id,
              part: "badge",
              left: bLeft,
              right: bLeft + mp.badgePillW,
              top: bTop,
              bottom: bTop + bH
            });
          }

          if (mp.metaStr) {
            resetCanvasLetterSpacing();
            ctx.font = `500 ${mp.metaFontPx}px ${fontFamilyFor(mp.metaStr)}`;
            ctx.direction = rtl || hasArabicChars(mp.metaStr) ? "rtl" : "ltr";
            ctx.textAlign = align;
            ctx.textBaseline = "alphabetic";
            if (mp.metaInline) {
              const mX = rtl
                ? boxR - 22 - mp.badgePillW - 12
                : boxL + 22 + mp.badgePillW + 12;
              const mBaseY = cy + 13.5;
              drawChalkText(mp.metaStr, mX, mBaseY, CHALK_MUTED, mp.metaFontPx, 1.0);
              const mLeft = rtl ? mX - mp.metaW : mX;
              lastMeProjectSubBoxes.push({
                projectId: id,
                part: "meta",
                left: mLeft,
                right: mLeft + mp.metaW,
                top: cy + 2,
                bottom: cy + 17
              });
            } else {
              const mLines = mp.metaLines && mp.metaLines.length ? mp.metaLines : [mp.metaStr];
              mLines.forEach((mLn, mIdx) => {
                const mBaseY = cy + 22 + 11.5 + mIdx * 15.5;
                drawChalkText(mLn, textX, mBaseY, CHALK_MUTED, mp.metaFontPx, 1.0);
                const mwLine = Math.min(mp.textColW, ctx.measureText(mLn).width);
                const mLeft = rtl ? boxR - mwLine : boxL;
                lastMeProjectSubBoxes.push({
                  projectId: id,
                  part: "meta-" + mIdx,
                  left: mLeft,
                  right: mLeft + mwLine,
                  top: cy + 21 + mIdx * 15.5,
                  bottom: cy + 35.5 + mIdx * 15.5
                });
              });
            }
          }
          ctx.restore();
        }
        cy += mp.headerH;

        ctx.font = canvasFont("600 13.6px", mp.item.title);
        ctx.direction = rtl ? "rtl" : "ltr";
        ctx.textAlign = align;
        ctx.textBaseline = "alphabetic";
        const titleCol = isItemHov || isItemOpen ? CHALK_BRIGHT : CHALK;
        const titleP = clamp((tProg - 0.05) / 0.50, 0, 1);
        const dispTitleLines = mp.titleLines.map((fullLine, lIdx) => {
          if (lIdx === mp.titleLines.length - 1 && mp.bodyParas.length) {
            const sym = isItemOpen ? "−" : "+";
            return fullLine + (rtl ? `\u200F  ${sym}` : `  ${sym}`);
          }
          return fullLine;
        });
        const titleCounts = computeLinesCharSchedule(dispTitleLines, titleP, isItErasing, 2.2);

        dispTitleLines.forEach((dispLine, lIdx) => {
          const fullLine = mp.titleLines[lIdx];
          const take = titleCounts[lIdx] || 0;
          if (take > 0) {
            const drawnPart = dispLine.slice(0, take);
            const tBaseY = cy + 14.2;
            if (mp.bodyParas.length > 0 && ihp > 0.03 && drawnPart) {
              const corePart = drawnPart.slice(0, Math.min(drawnPart.length, fullLine.length));
              const lw = ctx.measureText(corePart).width;
              const uLeft = rtl ? textX - lw : textX;
              drawWavyUnderline(
                uLeft,
                tBaseY + (rtl ? 10.6 : 6.6),
                lw,
                ihp,
                idx * 4.3 + lIdx * 1.9,
                CHALK_BRIGHT,
                1.12,
                rtl
              );
            }
            drawChalkText(drawnPart, textX, tBaseY, titleCol, 13.6, 1.0);
            const fullDrawnW = Math.min(mp.textColW, ctx.measureText(drawnPart).width);
            const tLeft = rtl ? boxR - fullDrawnW : boxL;
            lastMeProjectSubBoxes.push({
              projectId: id,
              part: "title-" + lIdx,
              left: tLeft,
              right: tLeft + fullDrawnW,
              top: cy + 1,
              bottom: cy + mp.titleStepY - 1
            });
          }
          cy += mp.titleStepY;
        });

        cy += 3;
        ctx.font = canvasFont("400 12.3px", mp.item.summary);
        ctx.textBaseline = "top";
        const sumProg = clamp(((tProg - 0.26) / 0.64) * sumFactor, 0, 1);
        const sumStartCy = cy;
        cy = drawDiscreteWrappedLines(
          mp.sumLines,
          sumProg,
          isItErasing,
          textX,
          cy,
          mp.sumStepY,
          CHALK,
          12.3,
          1.0
        );
        if (sumProg > 0.05) {
          mp.sumLines.forEach((sln, sIdx) => {
            const sw = Math.min(mp.textColW, ctx.measureText(sln).width);
            const sL = rtl ? boxR - sw : boxL;
            const sTop = sumStartCy + sIdx * mp.sumStepY;
            lastMeProjectSubBoxes.push({
              projectId: id,
              part: "sum-" + sIdx,
              left: sL,
              right: sL + sw,
              top: sTop + 1,
              bottom: sTop + mp.sumStepY - 1
            });
          });
        }

        const rowBottomY = Math.max(cy, mp.topY + mp.blockH - 4);
        if (activeBranch === "me") {
          const stl = worldToScreen(rowLeft, mp.topY);
          const sbr = worldToScreen(rowRight, rowBottomY);
          lastMeProjectsScreenBoxes.push({
            id,
            category: mp.item.category || "all",
            emblem: mp.item.emblem || "crest",
            impactBadge: mp.badgeStr,
            title: mp.item.title,
            screenLeft: stl.x,
            screenRight: sbr.x,
            screenTop: stl.y,
            screenBottom: sbr.y
          });
        }

        if (mp.bodyParas.length > 0 && activeBranch === "me" && tProg > 0.22) {
          worldHitboxes.push({
            id: itemHitId,
            kind: "item",
            branchKey: "me",
            itemId: id,
            x: rowLeft - 6,
            y: mp.topY - 4,
            w: mp.projColW + 12,
            h: rowBottomY - mp.topY + 8
          });
          if (currentPhotoHitRect) {
            worldHitboxes.push({
              id: photoHitId,
              kind: "project-photo",
              branchKey: "me",
              itemId: id,
              x: currentPhotoHitRect.x,
              y: currentPhotoHitRect.y,
              w: currentPhotoHitRect.w,
              h: currentPhotoHitRect.h
            });
          }
        }

        ctx.restore();
      }

      const s2Raw = lvl2ShootGrow[id] || 0;
      const dTypeProg = lvl2Type[id] || 0;
      const isD2Erasing = Boolean(lvl2Erasing[id]);
      if (s2Raw > 0.005 || dTypeProg > 0.005) {
        const itProg = s2Raw;
        const s2X = mp.lvl2StartX + canopySway * 0.2;
        const s2Y = nodeY;
        const e2X = mp.lvl2TipX + canopySway * 0.15;
        const e2Y = mp.lvl2TopY + 10;

        const endShoot = drawGrowingShoot(
          s2X,
          s2Y,
          s2X + 22,
          s2Y + (e2Y - s2Y) * 0.32,
          e2X - 22,
          e2Y,
          e2X,
          e2Y,
          itProg,
          1.75,
          1.15,
          CHALK_BRIGHT,
          idx * 5.1 + 9
        );

        if (tuftBuffer && itProg > 0.42) {
          const ts2 = smoothstep(0.42, 1.0, itProg) * 24;
          ctx.save();
          ctx.globalAlpha = smoothstep(0.42, 1.0, itProg) * 0.88;
          ctx.drawImage(
            tuftBuffer,
            endShoot.endX - ts2 * 0.5,
            endShoot.endY - ts2 * 0.5,
            ts2,
            ts2
          );
          ctx.restore();
        }

        if (dTypeProg > 0.004) {
          const d = getLocale();
          const dBoxL = mp.lvl2BoxLeft + canopySway * 0.15;
          const dBoxR = mp.lvl2BoxRight + canopySway * 0.15;
          const dTextX = rtl ? dBoxR : dBoxL;
          const align = rtl ? "right" : "left";

          ctx.save();
          ctx.globalAlpha = 1.0;
          ctx.direction = rtl ? "rtl" : "ltr";
          ctx.textAlign = align;
          ctx.textBaseline = "alphabetic";

          drawSkyTextFeather(
            (dBoxL + dBoxR) * 0.5,
            mp.lvl2TopY + mp.detailH * 0.5,
            Math.max(112, mp.detailH * 0.9) * clamp(dTypeProg * 1.3, 0.25, 1),
            dBoxL - 26,
            mp.lvl2TopY - 16,
            mp.projDetailW + 52,
            mp.detailH + 32
          );

          let dcy = mp.lvl2TopY;
          const closeId = "closeitem:" + id;
          const closeHov = hoveredHit && hoveredHit.id === closeId;
          const colP = clamp(dTypeProg * 2.1, 0, 1);
          if (colP > 0.01) {
            resetCanvasLetterSpacing();
            const colSize = lang === "ar" || hasArabicChars(d.collapseNote) ? 11.5 : 11;
            ctx.font = `500 ${colSize}px ${fontFamilyFor(d.collapseNote)}`;
            const fullCollapseW = Math.max(1, ctx.measureText(d.collapseNote).width);
            const colCnt = computeDiscreteCharCount(d.collapseNote, colP, isD2Erasing, 1.8);
            if (colCnt > 0) {
              const typedCollapse = d.collapseNote.slice(0, colCnt);
              const cw = ctx.measureText(typedCollapse).width;
              const uLeft = rtl ? dTextX - fullCollapseW : dTextX;
              const colBaseY = dcy + 12.5;
              drawWavyUnderline(
                uLeft,
                colBaseY + (rtl ? 10.6 : 6.6),
                fullCollapseW,
                clamp((cw / fullCollapseW) * (closeHov ? 1.0 : 0.72), 0, 1),
                idx * 2.3 + 4.1,
                closeHov ? CHALK_BRIGHT : "rgba(154, 162, 178, 0.68)",
                1.05,
                rtl
              );
              drawChalkText(
                typedCollapse,
                dTextX,
                colBaseY,
                closeHov ? CHALK_BRIGHT : CHALK_MUTED,
                colSize,
                1.0
              );
              if (activeItem === id) {
                worldHitboxes.push({
                  id: closeId,
                  kind: "item",
                  branchKey: "me",
                  itemId: id,
                  x: uLeft - 6,
                  y: dcy - 2,
                  w: fullCollapseW + 12,
                  h: 25
                });
              }
            }
          }
          dcy += rtl ? 30 : 25;

          ctx.textBaseline = "top";
          const allLines = [];
          mp.bodyParas.forEach((pLines, pIdx) => {
            pLines.forEach((line, lIdx) => {
              allLines.push({
                text: line,
                kind: "body",
                afterGap: lIdx === pLines.length - 1 ? 9 : 0,
                key: `${pIdx}:${lIdx}`
              });
            });
          });
          mp.tagLines.forEach((tl, tIdx) => {
            allLines.push({
              text: tl,
              kind: "tag",
              afterGap: 0,
              key: `tag:${tIdx}`
            });
          });

          const bodyRawP = clamp((dTypeProg - 0.05) / 0.95, 0, 1);
          const detailCounts = computeLinesCharSchedule(
            allLines.map((ln) => ln.text),
            bodyRawP,
            isD2Erasing,
            3.0
          );

          allLines.forEach((ln, lIdx) => {
            const take = detailCounts[lIdx] || 0;
            if (take > 0) {
              const sub = ln.text.slice(0, take);
              if (ln.kind === "body") {
                ctx.font = canvasFont("400 13px", ln.text);
                drawChalkText(sub, dTextX, dcy, CHALK, 13, 1.0);
              } else {
                resetCanvasLetterSpacing();
                const tgSize = lang === "ar" || hasArabicChars(ln.text) ? 11.5 : 11;
                ctx.font = `400 ${tgSize}px ${fontFamilyFor(ln.text)}`;
                drawChalkText(sub, dTextX, dcy, CHALK_MUTED, tgSize, 1.0);
              }
            }
            dcy += (ln.kind === "body" ? (rtl ? 20.2 : 18.8) : 16.0) + ln.afterGap;
          });

          if (mp.actionRows && mp.actionRows.length > 0) {
            dcy += 8;
            const actLinksProg = clamp((dTypeProg - 0.30) / 0.70, 0, 1);
            mp.actionRows.forEach((row, rIdx) => {
              row.items.forEach((entry) => {
                const { act, aIdx, offsetX } = entry;
                const localActP = clamp(
                  (actLinksProg - aIdx * 0.08) / Math.max(0.28, 1 - aIdx * 0.08),
                  0,
                  1
                );
                if (localActP <= 0.01) return;

                resetCanvasLetterSpacing();
                ctx.font = canvasFont("500 12.4px", act.label);
                const fullActW = Math.min(
                  mp.projDetailW,
                  Math.max(1, ctx.measureText(act.label).width)
                );
                const actHitId = `projact:${id}:${aIdx}`;
                const actHov = hoveredHit && hoveredHit.id === actHitId;
                const actRight = rtl ? dBoxR - offsetX : dBoxL + offsetX + fullActW;
                const actLeft = rtl ? actRight - fullActW : dBoxL + offsetX;
                const actAnchorX = rtl ? actRight : actLeft;
                const isArAct = hasArabicChars(act.label);
                ctx.direction = isArAct ? "rtl" : "ltr";
                ctx.textAlign = rtl ? "right" : "left";
                ctx.textBaseline = "alphabetic";
                const actBaseY = dcy + 13.5;
                const actUnderY = actBaseY + ((rtl || isArAct) ? 10.6 : 6.8);

                const visCnt = computeDiscreteCharCount(act.label, localActP, isD2Erasing, 2.0);
                if (visCnt > 0) {
                  const typedAct = act.label.slice(0, visCnt);
                  const typedW = ctx.measureText(typedAct).width;
                  drawWavyUnderline(
                    actLeft,
                    actUnderY,
                    fullActW,
                    clamp(typedW / fullActW, 0, 1),
                    idx * 3.9 + aIdx * 2.3 + rIdx + 1.4,
                    actHov ? CHALK_BRIGHT : "rgba(220, 224, 232, 0.90)",
                    actHov ? 1.25 : 1.15,
                    rtl
                  );
                  drawChalkText(
                    typedAct,
                    actAnchorX,
                    actBaseY,
                    actHov ? CHALK_BRIGHT : CHALK_BRIGHT,
                    12.4,
                    1.0
                  );

                  if (activeBranch === "me" && activeItem === id && localActP > 0.30) {
                    const hitBox = {
                      id: actHitId,
                      kind: "action",
                      itemId: id,
                      action: act,
                      x: actLeft - 6,
                      y: actBaseY - 15,
                      w: fullActW + 12,
                      h: (actUnderY - (actBaseY - 15)) + 6
                    };
                    worldHitboxes.push(hitBox);
                    const atl = worldToScreen(actLeft, actBaseY - 14);
                    const abr = worldToScreen(actRight, actUnderY + 3);
                    lastMeProjectActionBoxes.push({
                      itemId: id,
                      label: act.label,
                      href: act.href || act.url || null,
                      baselineY: actBaseY,
                      underlineY: actUnderY,
                      deltaY: actUnderY - actBaseY,
                      worldLeft: actLeft,
                      worldRight: actRight,
                      screenLeft: atl.x,
                      screenRight: abr.x,
                      screenTop: atl.y,
                      screenBottom: abr.y
                    });
                  }
                }
              });
              dcy += mp.actionRowH;
            });
          }

          ctx.restore();
        }
      }
    });
  }

  // =========================================================================
  // EXPERIENCE ARCHING LEAFY YEAR-BOUGH RENDERER (2D03B4ED ARCHITECTURE)
  // =========================================================================
  function renderExperienceArchingBough(bCfg, timeSec) {
    const rtl = isRTL();
    const d = getLocale();
    if (expBoughGrow <= 0.004) return;

    const expLay = computeExperienceBoughLayout(bCfg);
    const G = expLay.geom;
    const baseSway = computeCanopySway(G.y0, timeSec);

    function recordExpTextBox(kind, id, text, worldLeft, worldRight, worldTop, worldBottom) {
      const scrTL = worldToScreen(worldLeft, worldTop);
      const scrBR = worldToScreen(worldRight, worldBottom);
      lastExpTextLineBoxes.push({
        kind,
        id,
        text,
        worldLeft,
        worldRight,
        worldTop,
        worldBottom,
        screenLeft: scrTL.x,
        screenRight: scrBR.x,
        screenTop: scrTL.y,
        screenBottom: scrBR.y
      });
    }

    function boughPointAt(u) {
      const swayMul = 1 + u * 0.55;
      const wx = evalCubic(G.x0, G.cx1, G.cx2, G.x3, u) + baseSway * swayMul;
      const wy =
        evalCubic(G.y0, G.cy1, G.cy2, G.y3, u) +
        Math.sin(timeSec * 0.76 + u * 2.4) * (1.2 * u);
      return { x: wx, y: wy };
    }

    function drawPuffCluster(puff, pIdx) {
      if (expBoughGrow <= puff.t - 0.03) return;
      const rawBloom = clamp((expBoughGrow - (puff.t - 0.03)) / 0.17, 0, 1);
      const bloom = expBoughRetracting ? easeInOutCubic(rawBloom) : easeOutCubic(rawBloom);
      if (bloom <= 0.01 || !puff.canvas) return;

      const pt = boughPointAt(puff.t);
      const dx = evalCubicDeriv(G.x0, G.cx1, G.cx2, G.x3, puff.t);
      const dy = evalCubicDeriv(G.y0, G.cy1, G.cy2, G.y3, puff.t);
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      const cx = pt.x + nx * puff.nOff;
      const cy = pt.y + ny * puff.nOff;
      const sc = expBoughRetracting ? (0.30 + 0.70 * bloom) : (0.56 + 0.44 * bloom);
      const dw = puff.drawW * sc;
      const dh = puff.drawH * sc;

      const spec = EXP_PUFF_SPECS[pIdx];
      if (spec) {
        const scrC = worldToScreen(cx, cy);
        lastExpLeafPuffCircles.push({
          pIdx,
          t: puff.t,
          cx,
          cy,
          rx: spec.rx * sc,
          ry: spec.ry * sc,
          effRx: spec.rx * 1.15 * sc,
          effRy: spec.ry * 1.15 * sc,
          screenCx: scrC.x,
          screenCy: scrC.y
        });
      }

      ctx.save();
      ctx.globalAlpha = bloom;
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(pIdx * 1.7) * 0.08);
      ctx.drawImage(puff.canvas, -dw * 0.5, -dh * 0.5, dw, dh);
      ctx.restore();
    }

    // 1. Background leaf-puff clusters behind the silver wooden bough
    expLeafPuffBuffers.forEach((puff, pIdx) => {
      if (!puff.fg) drawPuffCluster(puff, pIdx);
    });

    // 2. Gracefully arching ~650px silver wooden bough (tapering 4.6px -> 1.4px)
    const boughSteps = 44;
    ctx.save();
    ctx.strokeStyle = CHALK_TREE;
    ctx.fillStyle = CHALK_TREE;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let prevPt = boughPointAt(0);
    for (let i = 1; i <= boughSteps; i++) {
      const u = (i / boughSteps) * expBoughGrow;
      const nextPt = boughPointAt(u);
      const gnarl = 1 + 0.05 * Math.sin(u * 19.0 + 1.3);
      ctx.lineWidth = (4.6 + (1.4 - 4.6) * u) * gnarl;
      ctx.beginPath();
      ctx.moveTo(prevPt.x, prevPt.y);
      ctx.lineTo(nextPt.x, nextPt.y);
      ctx.stroke();
      prevPt = nextPt;
    }

    // Slender outer forked tip + tiny detached botanical leaf-flecks
    if (expBoughGrow > 0.92) {
      const tipP = smoothstep(0.92, 1.0, expBoughGrow);
      const forkBase = boughPointAt(0.955);
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(forkBase.x, forkBase.y);
      ctx.lineTo(forkBase.x + 13 * tipP, forkBase.y - 10 * tipP);
      ctx.stroke();
      drawTeardropBud(ctx, prevPt.x + 3.5 * tipP, prevPt.y + 4.5 * tipP, 4.2 * tipP, 2.0 * tipP, 0.9, CHALK_TREE);
      drawSoftOvalDab(ctx, prevPt.x + 7.5 * tipP, prevPt.y + 2.0 * tipP, 1.4 * tipP, 1.0 * tipP, 0.4);
    }
    ctx.restore();

    // 3. Foreground leaf-puff clusters blooming organically along the bough
    expLeafPuffBuffers.forEach((puff, pIdx) => {
      if (puff.fg) drawPuffCluster(puff, pIdx);
    });

    // 3b. Subtle uncluttered collar sprig & active branch title ("الخبرات المهنية." / "experience.")
    if (expBoughGrow > 0.08) {
      const collarP = easeOutCubic(clamp((expBoughGrow - 0.08) / 0.28, 0, 1));
      const collarSway = baseSway * 1.05;
      const csx = expLay.collarStartX + collarSway;
      const csy = expLay.collarStartY;
      const ctxTip = expLay.collarTipX + collarSway;
      const ctyTip = expLay.collarTipY;
      const collarDim = activeItem ? 0.48 : 0.94;
      const menuHitId = "menu:experience";
      const isMenuHov = hoveredHit && hoveredHit.id === menuHitId;

      ctx.save();
      ctx.globalAlpha = collarDim * collarP;
      drawGrowingShoot(
        csx,
        csy,
        csx + (ctxTip - csx) * 0.38,
        csy + (ctyTip - csy) * 0.35 + 2.0,
        csx + (ctxTip - csx) * 0.74,
        csy + (ctyTip - csy) * 0.72 + 1.0,
        ctxTip,
        ctyTip,
        collarP,
        1.65,
        1.0,
        isMenuHov ? CHALK_BRIGHT : CHALK_MUTED,
        6.4
      );

      const titleText = `${bCfg.label}.`;
      const visTitle = computeDiscreteCharCount(titleText, collarP, activeBranch !== "experience", 2.0);
      if (visTitle > 0) {
        resetCanvasLetterSpacing();
        ctx.font = canvasFont("600 14.5px", titleText);
        ctx.direction = rtl ? "rtl" : "ltr";
        ctx.textBaseline = "middle";
        const fullTW = ctx.measureText(titleText).width;
        const tLeft = ctxTip + 12;
        const tRight = tLeft + fullTW;
        ctx.textAlign = rtl ? "right" : "left";
        const tAnchor = rtl ? tRight : tLeft;
        const subTitle = titleText.slice(0, visTitle);

        drawWavyUnderline(
          tLeft,
          ctyTip + (rtl ? 15.8 : 11.4),
          fullTW,
          collarP * 0.92,
          17.3,
          "rgba(220, 224, 232, 0.84)",
          1.18,
          rtl
        );
        drawChalkText(subTitle, tAnchor, ctyTip, isMenuHov ? CHALK_BRIGHT : CHALK_BRIGHT, 14.5, 1.0);
        recordExpTextBox("branch-title", "experience", subTitle, tLeft, tRight, ctyTip - 8, ctyTip + 10);

        if (activeBranch === "experience" && collarP > 0.35) {
          worldHitboxes.push({
            id: menuHitId,
            kind: "branch",
            branchKey: "experience",
            x: Math.min(csx, tLeft) - 8,
            y: ctyTip - 16,
            w: (tRight - Math.min(csx, tLeft)) + 16,
            h: 32
          });
        }
      }
      ctx.restore();
    }

    // 4. 6 Chronological Alternating Year Twigs + Typewriter Year Labels + Level-2 Secondary Role Shoots
    expLay.yearNodes.forEach((yn, idx) => {
      const id = yn.item.id;
      const stRaw = subTwigGrow[id] || 0;
      const stProg = easeOutCubic(stRaw);
      const tProg = itemType[id] || 0;
      const isItErasing = Boolean(itemErasing[id]);

      const hitId = "item:" + id;
      const isHov = hoveredHit && hoveredHit.id === hitId;
      const isOpen = activeItem === id;
      const siblingDim = activeItem && !isOpen ? 0.48 : 1.0;

      const swayX = baseSway * (1 + yn.t * 0.55);
      const swayY = Math.sin(timeSec * 0.76 + yn.t * 2.4) * (1.2 * yn.t);
      const sx0 = yn.startX + swayX;
      const sy0 = yn.startY + swayY;
      const sx3 = yn.tipX + swayX;
      const sy3 = yn.tipY + swayY;

      // Short slender side-twig with 3 tiny teardrop leaf buds (dimmed to 0.48 when a sibling year is open)
      if (stProg > 0.01) {
        ctx.save();
        ctx.globalAlpha = siblingDim;
        const midX1 = sx0 + (sx3 - sx0) * 0.35;
        const midY1 = sy0 + (sy3 - sy0) * 0.35 - 2.2;
        const midX2 = sx0 + (sx3 - sx0) * 0.72;
        const midY2 = sy0 + (sy3 - sy0) * 0.72 - 1.0;
        drawGrowingShoot(
          sx0,
          sy0,
          midX1,
          midY1,
          midX2,
          midY2,
          sx3,
          sy3,
          stProg,
          1.75,
          1.05,
          isOpen ? CHALK_BRIGHT : CHALK,
          idx * 3.3 + 1.8
        );
        ctx.restore();
      }

      if (tProg > 0.005) {
        hoverAmt[hitId] =
          (hoverAmt[hitId] || 0) + ((isHov || isOpen ? 1 : 0) - (hoverAmt[hitId] || 0)) * 0.24;
        const hp = hoverAmt[hitId];

        const dispText = isOpen ? yn.activeText : yn.rawLabel;
        const visCount = computeDiscreteCharCount(dispText, tProg, isItErasing, 2.0);
        if (visCount > 0) {
          ctx.save();
          ctx.globalAlpha = siblingDim;
          resetCanvasLetterSpacing();
          ctx.font = canvasFont(`${isOpen || hp > 0.15 ? 600 : 500} 14.8px`, dispText);
          ctx.direction = rtl ? "rtl" : "ltr";
          ctx.textBaseline = "middle";

          // Strict Bug Check A span:
          // - lower-right / outer-tip: [tx + 12, tx + 12 + labelWidth]
          // - upper-left: [tx - 12 - labelWidth, tx - 12]
          const measuredFullW = ctx.measureText(dispText).width;
          const bLeft = yn.isRightSide ? sx3 + 12 : sx3 - 12 - measuredFullW;
          const bRight = bLeft + measuredFullW;
          const ly = yn.labelY + swayY;

          drawSkyTextFeather(
            (bLeft + bRight) * 0.5,
            ly,
            Math.max(46, measuredFullW * 0.85),
            bLeft - 14,
            ly - 14,
            measuredFullW + 28,
            28
          );

          const alignRight = rtl ? true : !yn.isRightSide;
          ctx.textAlign = alignRight ? "right" : "left";
          const anchorX = alignRight ? bRight : bLeft;
          const subStr = dispText.slice(0, visCount);
          const subW = ctx.measureText(subStr).width;
          const actualLeft = alignRight ? anchorX - subW : anchorX;
          const actualRight = alignRight ? anchorX : anchorX + subW;

          const uWave = isOpen ? 1.0 : hp * 0.92;
          if (uWave > 0.02) {
            drawWavyUnderline(
              bLeft,
              ly + (rtl || hasArabicChars(dispText) ? 15.8 : 11.4),
              measuredFullW,
              uWave * clamp(tProg * 1.2, 0, 1),
              idx * 4.7 + 2.3,
              isOpen ? CHALK_BRIGHT : "rgba(220, 224, 232, 0.86)",
              isOpen ? 1.22 : 1.08,
              rtl
            );
          }

          drawChalkText(
            subStr,
            anchorX,
            ly,
            isOpen || hp > 0.15 ? CHALK_BRIGHT : CHALK,
            14.8,
            1.0
          );

          recordExpTextBox("year-label", id, subStr, actualLeft, actualRight, ly - 8.5, ly + 8.5);
          ctx.restore();

          if (activeBranch === "experience") {
            const scrTL = worldToScreen(bLeft, ly - 10);
            const scrBR = worldToScreen(bRight, ly + 11);
            lastExpYearScreenBoxes.push({
              id,
              idx,
              side: yn.side,
              isOuterTip: yn.isOuterTip,
              tipX: sx3,
              tipY: sy3,
              worldLeft: bLeft,
              worldRight: bRight,
              worldTop: ly - 10,
              worldBottom: ly + 11,
              yearLabel: dispText,
              screenLeft: scrTL.x,
              screenRight: scrBR.x,
              screenTop: scrTL.y,
              screenBottom: scrBR.y
            });

            if (tProg > 0.25) {
              worldHitboxes.push({
                id: hitId,
                kind: "item",
                branchKey: "experience",
                itemId: id,
                x: Math.min(sx0, bLeft) - 8,
                y: Math.min(sy0, ly) - 15,
                w: Math.max(sx3, bRight) - Math.min(sx0, bLeft) + 16,
                h: Math.abs(sy3 - sy0) + 30
              });
            }
          }
        }
      }

      // Level-2 Secondary Wooden Shoot & Typewriter Role/Bullet Card
      const s2Raw = lvl2ShootGrow[id] || 0;
      const dTypeProg = lvl2Type[id] || 0;
      const isD2Erasing = Boolean(lvl2Erasing[id]);
      if (s2Raw > 0.005 || dTypeProg > 0.005) {
        const itProg = s2Raw;
        const s2X = yn.s2StartX + swayX;
        const s2Y = yn.s2StartY + swayY;
        const shootEndX = yn.s2TipX + swayX * 0.65;
        const shootEndY = yn.cardTopY + 8;

        const endShoot = drawGrowingShoot(
          s2X,
          s2Y,
          s2X + yn.shootDir * 24,
          s2Y + (shootEndY - s2Y) * 0.35,
          shootEndX - yn.shootDir * 24,
          shootEndY,
          shootEndX,
          shootEndY,
          itProg,
          1.8,
          1.15,
          CHALK_BRIGHT,
          idx * 5.3 + 7.1
        );

        if (tuftBuffer && itProg > 0.42) {
          const ts2 = smoothstep(0.42, 1.0, itProg) * 24;
          ctx.save();
          ctx.globalAlpha = smoothstep(0.42, 1.0, itProg) * 0.86;
          ctx.drawImage(
            tuftBuffer,
            endShoot.endX - ts2 * 0.5,
            endShoot.endY - ts2 * 0.5,
            ts2,
            ts2
          );
          ctx.restore();
        }

        if (dTypeProg > 0.004) {
          // Strict Bug Check B outward card bounds:
          // - side === "right": [shootEndX + 18 .. shootEndX + 18 + colW]
          // - side === "left":  [shootEndX - 18 - colW .. shootEndX - 18]
          const colW = yn.detailColWidth;
          const cLeft = yn.shootDir > 0 ? shootEndX + 18 : shootEndX - 18 - colW;
          const cRight = cLeft + colW;
          const cTextX = rtl ? cRight : cLeft;

          ctx.save();
          resetCanvasLetterSpacing();
          ctx.direction = rtl ? "rtl" : "ltr";
          ctx.textAlign = rtl ? "right" : "left";
          ctx.textBaseline = "top";

          drawSkyTextFeather(
            (cLeft + cRight) * 0.5,
            yn.cardTopY + yn.detailH * 0.5,
            Math.max(125, yn.detailH * 0.88) * clamp(dTypeProg * 1.3, 0.25, 1),
            cLeft - 26,
            yn.cardTopY - 18,
            colW + 52,
            yn.detailH + 36
          );

          let dcy = yn.cardTopY;
          const closeId = "closeitem:" + id;
          const closeHov = hoveredHit && hoveredHit.id === closeId;
          const colP = clamp(dTypeProg * 2.2, 0, 1);
          if (colP > 0.01) {
            const colSize = lang === "ar" || hasArabicChars(d.collapseNote) ? 11.5 : 11;
            ctx.font = `500 ${colSize}px ${fontFamilyFor(d.collapseNote)}`;
            const fullCollapseW = Math.max(1, ctx.measureText(d.collapseNote).width);

            // Delicate subtle chalk stem/connector across the header when text aligns to the far edge of the card
            // (e.g., Arabic RTL on rightward shoot, or English LTR on leftward shoot)
            if ((yn.shootDir > 0 && rtl) || (yn.shootDir < 0 && !rtl)) {
              const stemFromX = yn.shootDir > 0 ? shootEndX + 8 : shootEndX - 8;
              const stemTargetX = yn.shootDir > 0
                ? Math.max(cLeft + 4, cRight - fullCollapseW - 12)
                : Math.min(cRight - 4, cLeft + fullCollapseW + 12);
              if (Math.abs(stemTargetX - stemFromX) > 12) {
                const stemCurX = stemFromX + (stemTargetX - stemFromX) * colP;
                const stemY = dcy + 7.5;
                ctx.save();
                ctx.strokeStyle = "rgba(198, 202, 210, 0.42)";
                ctx.lineWidth = 0.95;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(stemFromX, stemY);
                ctx.quadraticCurveTo(
                  (stemFromX + stemCurX) * 0.5,
                  stemY - 1.8,
                  stemCurX,
                  stemY
                );
                ctx.stroke();
                if (colP > 0.55) {
                  drawTeardropBud(
                    ctx,
                    stemFromX + (stemCurX - stemFromX) * 0.46,
                    stemY - 1.6,
                    3.1,
                    1.35,
                    yn.shootDir > 0 ? -0.32 : Math.PI + 0.32,
                    "rgba(198, 202, 210, 0.50)"
                  );
                  ctx.fillStyle = "rgba(220, 224, 232, 0.52)";
                  ctx.beginPath();
                  ctx.arc(stemCurX, stemY, 1.25, 0, Math.PI * 2);
                  ctx.fill();
                }
                ctx.restore();
              }
            }

            const expColCnt = computeDiscreteCharCount(d.collapseNote, colP, isD2Erasing, 1.8);
            const typedCollapse = expColCnt > 0 ? d.collapseNote.slice(0, expColCnt) : "";
            if (typedCollapse) {
              const cw = ctx.measureText(typedCollapse).width;
              const uLeft = rtl ? cTextX - fullCollapseW : cTextX;
              const drawnLeft = rtl ? cTextX - cw : cTextX;
              drawWavyUnderline(
                uLeft,
                dcy + (rtl ? 22.8 : 18.6),
                fullCollapseW,
                clamp((cw / fullCollapseW) * (closeHov ? 1.0 : 0.72), 0, 1),
                idx * 2.7 + 3.9,
                closeHov ? CHALK_BRIGHT : "rgba(154, 162, 178, 0.68)",
                1.05,
                rtl
              );
              drawChalkText(typedCollapse, cTextX, dcy, closeHov ? CHALK_BRIGHT : CHALK_MUTED, colSize, 1.0);
              recordExpTextBox("card-collapse", id, typedCollapse, drawnLeft, drawnLeft + cw, dcy, dcy + colSize + 3);
              if (activeItem === id) {
                worldHitboxes.push({
                  id: closeId,
                  kind: "item",
                  branchKey: "experience",
                  itemId: id,
                  x: uLeft - 6,
                  y: dcy - 4,
                  w: fullCollapseW + 12,
                  h: 20
                });
              }
            }
          }
          dcy += rtl ? 29 : 26;

          // Build flat line schedule across all roles & bullets in this year node
          const flatRoleLines = [];
          yn.measuredRoles.forEach((mr, rIdx) => {
            mr.metaLines.forEach((ml, mIdx) => {
              flatRoleLines.push({
                text: ml,
                kind: "meta",
                indent: 0,
                stepY: 16.5 + (mIdx === mr.metaLines.length - 1 ? 3 : 0)
              });
            });
            mr.roleLines.forEach((rl, rlIdx) => {
              flatRoleLines.push({
                text: rl,
                kind: "role",
                indent: 0,
                isLastRoleLine: rlIdx === mr.roleLines.length - 1,
                roleIdx: rIdx,
                stepY: 19.5 + (rlIdx === mr.roleLines.length - 1 ? (rtl ? 11.5 : 7.5) : 0)
              });
            });
            mr.bulletLines.forEach((bl, bIdx) => {
              const isLastOfRole = bIdx === mr.bulletLines.length - 1;
              const roleSep = isLastOfRole && rIdx < yn.measuredRoles.length - 1 ? 14 : 0;
              flatRoleLines.push({
                text: bl.text,
                kind: "bullet",
                indent: bl.indent || 0,
                hasDividerAfter: roleSep > 0,
                stepY: 16.8 + bl.afterGap + roleSep
              });
            });
          });

          const bodyRawP = clamp((dTypeProg - 0.05) / 0.95, 0, 1);
          const counts = computeLinesCharSchedule(
            flatRoleLines.map((fl) => fl.text),
            bodyRawP,
            isD2Erasing,
            2.6
          );

          flatRoleLines.forEach((fl, fIdx) => {
            const take = counts[fIdx] || 0;
            if (take > 0) {
              const sub = fl.text.slice(0, take);
              const xDraw = rtl ? cTextX - fl.indent : cTextX + fl.indent;
              let lineFontPx = 12.6;
              if (fl.kind === "meta") {
                resetCanvasLetterSpacing();
                const ms = lang === "ar" || hasArabicChars(fl.text) ? 11.4 : 10.8;
                lineFontPx = ms;
                ctx.font = `500 ${ms}px ${fontFamilyFor(fl.text)}`;
                drawChalkText(sub, xDraw, dcy, CHALK_MUTED, ms, 1.0);
              } else if (fl.kind === "role") {
                lineFontPx = 13.8;
                ctx.font = canvasFont("600 13.8px", fl.text);
                if (fl.isLastRoleLine) {
                  const fullRoleW = Math.max(1, ctx.measureText(fl.text).width);
                  const subW = ctx.measureText(sub).width;
                  const uL = rtl ? xDraw - fullRoleW : xDraw;
                  drawWavyUnderline(
                    uL,
                    dcy + (rtl ? 24.8 : 20.6),
                    fullRoleW,
                    clamp(subW / fullRoleW, 0, 1) * 0.78,
                    idx * 3.1 + fl.roleIdx * 2.2,
                    "rgba(220, 224, 232, 0.72)",
                    1.05,
                    rtl
                  );
                }
                drawChalkText(sub, xDraw, dcy, CHALK_BRIGHT, 13.8, 1.0);
              } else {
                lineFontPx = 12.6;
                ctx.font = canvasFont("400 12.6px", fl.text);
                drawChalkText(sub, xDraw, dcy, CHALK, 12.6, 1.0);
              }

              const subLineW = Math.min(colW - fl.indent, ctx.measureText(sub).width);
              const lineLeft = rtl ? xDraw - subLineW : xDraw;
              recordExpTextBox("card-" + fl.kind, id, sub, lineLeft, lineLeft + subLineW, dcy, dcy + lineFontPx + 3);

              if (fl.hasDividerAfter && take >= fl.text.length) {
                const divY = dcy + 22;
                ctx.fillStyle = "rgba(198, 202, 210, 0.55)";
                ctx.beginPath();
                ctx.arc(rtl ? cRight - 6 : cLeft + 6, divY, 1.5, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            dcy += fl.stepY;
          });

          ctx.restore();
        }
      }
    });
  }

  function renderMenuAndGrownBranches(timeSec) {
    syncCanvasFontVars();
    const d = getLocale();
    const rtl = isRTL();
    resetCanvasLetterSpacing();

    BRANCH_KEYS.forEach((key, bIdx) => {
      const bCfg = d.branches[key];
      if (!bCfg) return;

      const twigProg = easeOutCubic(mainTwigGrow[key]);
      const labelTypeProg = mainLabelType[key];
      const labelErasing = mainLabelErasing[key];
      const limbProg = branchLimbGrow[key];
      const limbRaw = limbProg;
      const uProg = underlineProg[key];

      const lay = computeBranchLayout(bCfg);
      const dir = lay.dir;
      const canopySway = computeCanopySway(bCfg.attachY, timeSec);

      const ax = bCfg.attachX + canopySway;
      const ay = bCfg.attachY;
      const tipX = lay.tipX + canopySway;
      const tipY = lay.tipY;

      const menuHitId = "menu:" + key;
      const isMenuHov = hoveredHit && hoveredHit.id === menuHitId;
      hoverAmt[menuHitId] =
        (hoverAmt[menuHitId] || 0) + ((isMenuHov ? 1 : 0) - (hoverAmt[menuHitId] || 0)) * 0.22;
      const hp = hoverAmt[menuHitId];

      if (key === "me") {
        renderMeEditorialAndPortrait(bCfg, lay, tipX, tipY, canopySway);
      } else if (key === "experience") {
        renderExperienceArchingBough(bCfg, timeSec);
      }

      const isCustomBranch = key === "me" || key === "experience";
      let anyChildVisible = !isCustomBranch && limbRaw > 0.005;
      if (!anyChildVisible && !isCustomBranch) {
        for (const mi of lay.measuredItems) {
          if ((itemType[mi.item.id] || 0) > 0.005 || (subTwigGrow[mi.item.id] || 0) > 0.005) {
            anyChildVisible = true;
            break;
          }
        }
      }

      if (anyChildVisible) {
        const forkX = lay.forkX + canopySway * 0.6;
        const forkY = lay.forkY;

        if (mistyCloudBuffer && limbProg > 0.08) {
          const cloudAlpha = smoothstep(0.08, 0.75, limbProg) * 0.85;
          const cw = 148 * (0.65 + 0.35 * limbProg);
          const ch = 108 * (0.65 + 0.35 * limbProg);
          const cloudX = (tipX + forkX) * 0.5;
          const cloudY = (tipY + forkY) * 0.5;
          ctx.save();
          ctx.globalAlpha = cloudAlpha;
          ctx.drawImage(mistyCloudBuffer, cloudX - cw * 0.5, cloudY - ch * 0.5, cw, ch);
          ctx.restore();
        }

        const forkEnd = drawGrowingShoot(
          tipX,
          tipY,
          tipX + dir * 32,
          tipY - 1,
          forkX - dir * 30,
          forkY + 1,
          forkX,
          forkY,
          limbProg,
          2.5,
          1.75,
          CHALK_BRIGHT,
          11.3
        );

        if (tuftBuffer && limbProg > 0.38) {
          const ts = smoothstep(0.38, 1.0, limbProg) * 36;
          ctx.save();
          ctx.globalAlpha = smoothstep(0.38, 1.0, limbProg) * 0.92;
          ctx.drawImage(tuftBuffer, forkEnd.endX - ts * 0.5, forkEnd.endY - ts * 0.5, ts, ts);
          ctx.restore();
        }

        lay.measuredItems.forEach((mi, idx) => {
          const id = mi.item.id;
          const stRaw = subTwigGrow[id] || 0;
          const stProg = easeOutCubic(stRaw);
          const tProg = itemType[id] || 0;
          const isItErasing = Boolean(itemErasing[id]);
          const sumFactor = siblingSumFactor[id] === undefined ? 1 : siblingSumFactor[id];

          const targetSubX = mi.subTipX + canopySway * 0.35;
          const targetSubY = mi.jointY + Math.sin(timeSec * 0.9 + idx * 1.3) * 1.1;

          if (stProg > 0.005) {
            drawGrowingShoot(
              forkX,
              forkY,
              forkX + dir * 38,
              forkY + (targetSubY - forkY) * 0.28,
              targetSubX - dir * 36,
              targetSubY,
              targetSubX,
              targetSubY,
              stProg,
              2.1,
              1.25,
              CHALK,
              idx * 3.7 + 2.1
            );
          }

          if (tProg > 0.004) {
            const itemHitId = "item:" + id;
            const isItemHov = hoveredHit && hoveredHit.id === itemHitId;
            const isItemOpen = activeItem === id;
            hoverAmt[itemHitId] =
              (hoverAmt[itemHitId] || 0) +
              ((isItemHov || isItemOpen ? 1 : 0) - (hoverAmt[itemHitId] || 0)) * 0.24;
            const ihp = hoverAmt[itemHitId];

            const siblingDim =
              activeBranch === key && activeItem && activeItem !== id ? 0.48 : 1.0;

            const boxL = mi.textBoxLeft + canopySway * 0.35;
            const boxR = mi.textBoxRight + canopySway * 0.35;
            const textX = rtl ? boxR : boxL;
            const align = rtl ? "right" : "left";

            ctx.save();
            ctx.globalAlpha = siblingDim;
            ctx.direction = rtl ? "rtl" : "ltr";
            ctx.textAlign = align;
            ctx.textBaseline = "top";

            drawSkyTextFeather(
              (boxL + boxR) * 0.5,
              mi.topY + mi.blockH * 0.5,
              Math.max(88, mi.blockH * 0.95) * clamp(tProg * 1.3, 0.25, 1),
              boxL - 22,
              mi.topY - 12,
              lay.itemColWidth + 44,
              mi.blockH + 24
            );

            if (stProg > 0.7) {
              ctx.strokeStyle =
                isItemHov || isItemOpen ? CHALK_BRIGHT : "rgba(198, 202, 210, 0.42)";
              ctx.lineWidth = isItemHov || isItemOpen ? 1.25 : 0.85;
              ctx.beginPath();
              ctx.moveTo(targetSubX, targetSubY);
              ctx.lineTo(dir < 0 ? boxR + 4 : boxL - 4, targetSubY);
              ctx.stroke();
            }

            let cy = mi.topY;

            if (mi.item.meta) {
              const metaP = clamp(tProg * 1.45, 0, 1);
              if (metaP > 0.005) {
                resetCanvasLetterSpacing();
                const mSize = lang === "ar" || hasArabicChars(mi.item.meta) ? 11 : 10.3;
                ctx.font = `500 ${mSize}px ${fontFamilyFor(mi.item.meta)}`;
                drawDiscreteTextLine(
                  mi.item.meta,
                  metaP,
                  isItErasing,
                  textX,
                  cy,
                  CHALK_MUTED,
                  mSize,
                  1.0,
                  2.2
                );
              }
              cy += 13.5;
            }

            ctx.font = canvasFont("600 13.6px", mi.item.title);
            const titleCol = isItemHov || isItemOpen ? CHALK_BRIGHT : CHALK;
            const titleP = clamp((tProg - 0.05) / 0.50, 0, 1);
            const dispTitleLines = mi.titleLines.map((fullLine, lIdx) => {
              if (lIdx === mi.titleLines.length - 1 && mi.bodyParas.length) {
                const sym = isItemOpen ? "−" : "+";
                return fullLine + (rtl ? `\u200F  ${sym}` : `  ${sym}`);
              }
              return fullLine;
            });
            const titleCounts = computeLinesCharSchedule(dispTitleLines, titleP, isItErasing, 2.2);

            dispTitleLines.forEach((dispLine, lIdx) => {
              const fullLine = mi.titleLines[lIdx];
              const take = titleCounts[lIdx] || 0;
              if (take > 0) {
                const drawnPart = dispLine.slice(0, take);
                if (mi.bodyParas.length > 0 && ihp > 0.03 && drawnPart) {
                  const corePart = drawnPart.slice(0, Math.min(drawnPart.length, fullLine.length));
                  const lw = ctx.measureText(corePart).width;
                  const uLeft = rtl ? textX - lw : textX;
                  drawWavyUnderline(
                    uLeft,
                    cy + (rtl ? 24.4 : 19.8),
                    lw,
                    ihp,
                    idx * 4.3 + lIdx * 1.9,
                    CHALK_BRIGHT,
                    1.1,
                    rtl
                  );
                }
                drawChalkText(drawnPart, textX, cy, titleCol, 13.6, 1.0);
              }
              cy += rtl ? 24.5 : 20.0;
            });

            cy += 2.5;
            ctx.font = canvasFont("400 12.3px", mi.item.summary);
            const sumProg = clamp(((tProg - 0.26) / 0.64) * sumFactor, 0, 1);
            cy = drawDiscreteWrappedLines(
              mi.sumLines,
              sumProg,
              isItErasing,
              textX,
              cy,
              rtl ? 18.5 : 16.2,
              CHALK,
              12.3,
              1.0
            );

            if (mi.bodyParas.length > 0 && activeBranch === key && tProg > 0.25) {
              worldHitboxes.push({
                id: itemHitId,
                kind: "item",
                branchKey: key,
                itemId: id,
                x: boxL - 6,
                y: mi.topY - 4,
                w: lay.itemColWidth + 12,
                h: cy - mi.topY + 4
              });
            }

            if (mi.actionRows.length > 0) {
              cy += 6;
              const linksProg = clamp((tProg - 0.42) / 0.58, 0, 1);
              mi.actionRows.forEach((row, rIdx) => {
                row.items.forEach((entry) => {
                  const { act, aIdx, tw, offsetX } = entry;
                  const localLinkP = clamp(
                    (linksProg - aIdx * 0.07) / Math.max(0.28, 1 - aIdx * 0.07),
                    0,
                    1
                  );
                  if (localLinkP <= 0.01) return;

                  ctx.font = canvasFont("500 12px", act.label);
                  const actHitId = `act:${id}:${aIdx}`;
                  const actHov = hoveredHit && hoveredHit.id === actHitId;
                  const actRight = boxR - offsetX;
                  const actLeft = rtl ? actRight - tw : boxL + offsetX;
                  const actAnchorX = rtl ? actRight : actLeft;
                  ctx.direction = hasArabicChars(act.label) ? "rtl" : "ltr";
                  ctx.textAlign = rtl ? "right" : "left";

                  const actVisCnt = computeDiscreteCharCount(act.label, localLinkP, isItErasing, 2.0);
                  if (actVisCnt <= 0) return;
                  const typedAct = act.label.slice(0, actVisCnt);
                  const typedW = ctx.measureText(typedAct).width;
                  const actUProg = clamp(typedW / Math.max(1, tw), 0, 1);
                  drawWavyUnderline(
                    actLeft,
                    cy + (rtl || hasArabicChars(act.label) ? 22.8 : 18.6),
                    tw,
                    actUProg,
                    aIdx * 3.1 + rIdx * 1.7 + 0.8,
                    actHov ? CHALK_BRIGHT : "rgba(198, 202, 210, 0.82)",
                    actHov ? 1.22 : 1.05,
                    rtl
                  );
                  drawChalkText(typedAct, actAnchorX, cy, actHov ? CHALK_BRIGHT : CHALK, 12, 1.0);

                  if (activeBranch === key && localLinkP > 0.35) {
                    worldHitboxes.push({
                      id: actHitId,
                      kind: "action",
                      action: act,
                      x: actLeft - 4,
                      y: cy - 2,
                      w: tw + 8,
                      h: 20
                    });
                  }
                });
                cy += mi.actionRowH;
              });
            }

            ctx.restore();
          }

          // LEVEL-2 BOTANICAL SHOOT & DISCRETE TYPEWRITER DETAIL PARAGRAPHS
          const s2Raw = lvl2ShootGrow[id] || 0;
          const dTypeProg = lvl2Type[id] || 0;
          const isD2Erasing = Boolean(lvl2Erasing[id]);
          if (s2Raw > 0.005 || dTypeProg > 0.005) {
            const itProg = s2Raw;
            const s2X = mi.lvl2StartX + canopySway * 0.35;
            const s2Y = targetSubY;
            const e2X = mi.lvl2TipX + canopySway * 0.2;
            const e2Y = mi.lvl2TopY + 18;

            const endShoot = drawGrowingShoot(
              s2X,
              s2Y,
              s2X + dir * 26,
              s2Y + (e2Y - s2Y) * 0.32,
              e2X - dir * 26,
              e2Y,
              e2X,
              e2Y,
              itProg,
              1.75,
              1.15,
              CHALK_BRIGHT,
              idx * 5.1 + 9
            );

            if (tuftBuffer && itProg > 0.42) {
              const ts2 = smoothstep(0.42, 1.0, itProg) * 26;
              ctx.save();
              ctx.globalAlpha = smoothstep(0.42, 1.0, itProg) * 0.88;
              ctx.drawImage(
                tuftBuffer,
                endShoot.endX - ts2 * 0.5,
                endShoot.endY - ts2 * 0.5,
                ts2,
                ts2
              );
              ctx.restore();
            }

            if (dTypeProg > 0.004) {
              const dBoxL = mi.lvl2BoxLeft + canopySway * 0.2;
              const dBoxR = mi.lvl2BoxRight + canopySway * 0.2;
              const dTextX = rtl ? dBoxR : dBoxL;
              const align = rtl ? "right" : "left";

              ctx.save();
              ctx.globalAlpha = 1.0;
              ctx.direction = rtl ? "rtl" : "ltr";
              ctx.textAlign = align;
              ctx.textBaseline = "top";

              drawSkyTextFeather(
                (dBoxL + dBoxR) * 0.5,
                mi.lvl2TopY + mi.detailH * 0.5,
                Math.max(108, mi.detailH * 0.88) * clamp(dTypeProg * 1.3, 0.25, 1),
                dBoxL - 26,
                mi.lvl2TopY - 16,
                lay.detailColWidth + 52,
                mi.detailH + 32
              );

              let dcy = mi.lvl2TopY;
              const closeId = "closeitem:" + id;
              const closeHov = hoveredHit && hoveredHit.id === closeId;
              const colP = clamp(dTypeProg * 2.1, 0, 1);
              if (colP > 0.01) {
                resetCanvasLetterSpacing();
                const colSize = lang === "ar" || hasArabicChars(d.collapseNote) ? 11.5 : 11;
                ctx.font = `500 ${colSize}px ${fontFamilyFor(d.collapseNote)}`;
                const fullCollapseW = Math.max(1, ctx.measureText(d.collapseNote).width);
                const wkColCnt = computeDiscreteCharCount(d.collapseNote, colP, isD2Erasing, 1.8);
                const typedCollapse = wkColCnt > 0 ? d.collapseNote.slice(0, wkColCnt) : "";
                if (typedCollapse) {
                  const cw = ctx.measureText(typedCollapse).width;
                  const uLeft = rtl ? dTextX - fullCollapseW : dTextX;
                  drawWavyUnderline(
                    uLeft,
                    dcy + (rtl ? 22.8 : 18.6),
                    fullCollapseW,
                    clamp((cw / fullCollapseW) * (closeHov ? 1.0 : 0.72), 0, 1),
                    idx * 2.3 + 4.1,
                    closeHov ? CHALK_BRIGHT : "rgba(154, 162, 178, 0.68)",
                    1.05,
                    rtl
                  );
                  drawChalkText(typedCollapse, dTextX, dcy, closeHov ? CHALK_BRIGHT : CHALK_MUTED, colSize, 1.0);
                  if (activeItem === id) {
                    worldHitboxes.push({
                      id: closeId,
                      kind: "item",
                      branchKey: key,
                      itemId: id,
                      x: uLeft - 6,
                      y: dcy - 4,
                      w: fullCollapseW + 12,
                      h: 20
                    });
                  }
                }
              }
              dcy += rtl ? 28 : 25;

              const allLines = [];
              mi.bodyParas.forEach((pLines, pIdx) => {
                pLines.forEach((line, lIdx) => {
                  allLines.push({
                    text: line,
                    kind: "body",
                    afterGap: lIdx === pLines.length - 1 ? 9 : 0,
                    key: `${pIdx}:${lIdx}`
                  });
                });
              });
              mi.tagLines.forEach((tl, tIdx) => {
                allLines.push({
                  text: tl,
                  kind: "tag",
                  afterGap: 0,
                  key: `tag:${tIdx}`
                });
              });

              const bodyRawP = clamp((dTypeProg - 0.05) / 0.95, 0, 1);
              const detailCounts = computeLinesCharSchedule(
                allLines.map((ln) => ln.text),
                bodyRawP,
                isD2Erasing,
                3.0
              );

              allLines.forEach((ln, lIdx) => {
                const take = detailCounts[lIdx] || 0;
                if (take > 0) {
                  const sub = ln.text.slice(0, take);
                  if (ln.kind === "body") {
                    ctx.font = canvasFont("400 13px", ln.text);
                    drawChalkText(sub, dTextX, dcy, CHALK, 13, 1.0);
                  } else {
                    resetCanvasLetterSpacing();
                    const tgSize = lang === "ar" || hasArabicChars(ln.text) ? 11.5 : 11;
                    ctx.font = `400 ${tgSize}px ${fontFamilyFor(ln.text)}`;
                    drawChalkText(sub, dTextX, dcy, CHALK_MUTED, tgSize, 1.0);
                  }
                }
                dcy += (ln.kind === "body" ? 18.8 : 15.5) + ln.afterGap;
              });

              ctx.restore();
            }
          }
        });
      }

      // Clean, nearly-straight gently-tapering canopy shoot (2.3px -> 1.3px) angled 3°-8° with 4 alternating teardrop buds!
      // For "experience", smoothly blend out the resting horizontal shoot as the arching bough emerges (zero clash!)
      const expRestingFade = key === "experience" ? clamp(1 - (expBoughGrow - 0.02) / 0.14, 0, 1) : 1.0;
      if (twigProg > 0.01 && expRestingFade > 0.01) {
        ctx.save();
        ctx.globalAlpha = expRestingFade;
        const stretch = limbRaw < 0.05 ? hp * 4 : 0;
        const curTipX = tipX + dir * stretch;
        const twigColor = hp > 0.1 || limbRaw > 0.05 ? CHALK_BRIGHT : CHALK;

        drawGrowingShoot(
          ax,
          ay,
          ax + (curTipX - ax) * 0.34,
          ay + (tipY - ay) * 0.34,
          ax + (curTipX - ax) * 0.68,
          ay + (tipY - ay) * 0.68,
          curTipX,
          tipY,
          twigProg,
          2.3 + limbProg * 0.45,
          1.3 + limbProg * 0.35,
          twigColor,
          bIdx + 1.4
        );

        if (labelTypeProg > 0.005) {
          const isSelected = activeBranch === key || uProg > 0.25;
          const baseText = isSelected ? `${bCfg.label}.` : bCfg.label;
          const visCount = computeDiscreteCharCount(baseText, labelTypeProg, labelErasing, 2.0);

          if (visCount > 0) {
            ctx.save();
            ctx.font = canvasFont(`${hp > 0.2 || isSelected ? 600 : 500} 15px`, baseText);
            ctx.textBaseline = "middle";
            ctx.direction = rtl ? "rtl" : "ltr";

            const fullW = ctx.measureText(baseText).width;
            const isExpKey = key === "experience";
            const labelLiftY = isExpKey ? tipY + limbProg * 6 : tipY - limbProg * 17;
            const homeAnchorX = curTipX + dir * 12;
            const openCenterX = tipX + dir * (lay.boughSpan * 0.46);
            const openAnchorX = isExpKey
              ? tipX + 12
              : dir < 0
                ? openCenterX + fullW * 0.5
                : openCenterX - fullW * 0.5;
            const labelAnchorX = homeAnchorX + (openAnchorX - homeAnchorX) * limbProg;
            const lineLeft = dir < 0 ? labelAnchorX - fullW : labelAnchorX;
            const lineRight = lineLeft + fullW;

            const scrL = worldToScreen(lineLeft, labelLiftY - 9);
            const scrR = worldToScreen(lineRight, labelLiftY + 11);
            lastBranchLabelScreenBoxes.push({
              key,
              label: baseText,
              screenLeft: scrL.x,
              screenRight: scrR.x,
              screenTop: scrL.y,
              screenBottom: scrR.y
            });

            const alignRight = rtl ? true : dir < 0;
            const drawAnchorX = alignRight ? lineRight : lineLeft;
            ctx.textAlign = alignRight ? "right" : "left";
            const labelCol = hp > 0.1 || isSelected ? CHALK_BRIGHT : CHALK;
            const subLabel = baseText.slice(0, visCount);
            const waveP = Math.max(uProg, hp * 0.85 * labelTypeProg);
            if (waveP > 0.02) {
              drawWavyUnderline(
                lineLeft,
                labelLiftY + (rtl ? 16.0 : 11.6),
                fullW,
                waveP,
                key.charCodeAt(0) * 0.7,
                isSelected ? CHALK_BRIGHT : "rgba(198, 202, 210, 0.82)",
                isSelected ? 1.22 : 1.05,
                rtl
              );
            }
            drawChalkText(subLabel, drawAnchorX, labelLiftY, labelCol, 15, 1.0);
            ctx.restore();

            if (!activeBranch || (activeBranch === key && key !== "experience")) {
              const hbLeft = dir < 0 ? labelAnchorX - fullW - 12 : Math.min(ax, labelAnchorX) - 6;
              const hbRight = dir < 0 ? Math.max(ax, labelAnchorX) + 6 : labelAnchorX + fullW + 12;
              worldHitboxes.push({
                id: menuHitId,
                kind: "branch",
                branchKey: key,
                x: hbLeft,
                y: labelLiftY - 18,
                w: hbRight - hbLeft,
                h: 36
              });
            }
          }
        }
        ctx.restore();
      }
    });
  }

  // =========================================================================
  // ABOVE-GROUND MEADOW (wy <= 0) & UNDERGROUND SOIL + BOULDERS + DOTTED TRAILS (wy > 0)
  // =========================================================================
  function renderUndergroundRoots(visLeft, visRight) {
    if (!rootsBuffer || rootsGrow <= 0.002) return;
    if (visRight <= -ROOTS_W * 0.5 || visLeft >= ROOTS_W * 0.5) return;

    // True 1:1 proportions (zero rubbery scaleX/scaleY stretching!)
    ctx.save();
    if (rootsGrow < 0.998) {
      const revealH = (ROOTS_H + 8) * rootsGrow;
      ctx.beginPath();
      ctx.rect(-ROOTS_W * 0.5 - 4, ROOTS_TOP_WY - 2, ROOTS_W + 8, revealH);
      ctx.clip();
    }
    ctx.drawImage(rootsBuffer, -ROOTS_W * 0.5, ROOTS_TOP_WY, ROOTS_W, ROOTS_H);
    ctx.restore();
  }

  function renderWorldCrossSection(timeSec) {
    ctx.save();
    ctx.lineCap = "round";

    const visLeft = screenToWorld(-50, 0).x;
    const visRight = screenToWorld(vw + 50, 0).x;
    const visBot = screenToWorld(0, vh + 60).y;

    const spanLeft = Math.min(-WORLD_HORIZON_SPAN, visLeft - 60);
    const spanRight = Math.max(WORLD_HORIZON_SPAN, visRight + 60);
    const fillBottomY = Math.max(UNDERGROUND_DEPTH, visBot + 80);

    if (visBot > -6) {
      const earthGrad = ctx.createLinearGradient(0, 0, 0, Math.max(280, fillBottomY));
      earthGrad.addColorStop(0, "#15181F");
      earthGrad.addColorStop(0.22, EARTH_CORE);
      earthGrad.addColorStop(0.72, "#101318");
      earthGrad.addColorStop(1, EARTH_DEEP);

      ctx.fillStyle = earthGrad;
      ctx.beginPath();
      const stepX = 18;
      const startX = Math.floor((visLeft - 36) / stepX) * stepX;
      const endX = Math.ceil((visRight + 36) / stepX) * stepX;
      ctx.moveTo(startX, groundWaveY(startX));
      for (let x = startX + stepX; x <= endX; x += stepX) {
        ctx.lineTo(x, groundWaveY(x));
      }
      ctx.lineTo(endX, fillBottomY);
      ctx.lineTo(startX, fillBottomY);
      ctx.closePath();
      ctx.fill();

      // Subtle soil pebbles
      for (const p of soilPebbles) {
        if (p.wx < visLeft - 8 || p.wx > visRight + 8 || p.wy > visBot + 8) continue;
        ctx.fillStyle = p.bright
          ? `rgba(220, 224, 232, ${p.alpha.toFixed(2)})`
          : `rgba(196, 200, 210, ${p.alpha.toFixed(2)})`;
        ctx.save();
        ctx.translate(p.wx, p.wy);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Buried seeds
      for (const bs of buriedSeeds) {
        if (bs.wx < visLeft - 14 || bs.wx > visRight + 14 || bs.wy > visBot + 14) continue;
        ctx.save();
        ctx.translate(bs.wx, bs.wy);
        ctx.rotate(bs.rot);
        ctx.scale(bs.scale, bs.scale);
        ctx.fillStyle = `rgba(196, 200, 210, ${bs.alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 1.9, 1.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Meandering dotted silver trails (`• • • • •`) winding through #13161C soil (matching 9AA84C5A!)
      for (let ti = 0; ti < undergroundDotTrails.length; ti++) {
        const trail = undergroundDotTrails[ti];
        for (let di = 0; di < trail.length; di++) {
          const dt = trail[di];
          if (dt.wx < visLeft - 10 || dt.wx > visRight + 10 || dt.wy > visBot + 10) continue;
          ctx.fillStyle = `rgba(198, 202, 210, ${dt.alpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(dt.wx, dt.wy, dt.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Stippled #B8BCC6 rounded underground river boulders with dark diagonal crack lines (matching 9AA84C5A!)
      for (let bi = 0; bi < undergroundBoulders.length; bi++) {
        const bd = undergroundBoulders[bi];
        if (
          bd.wx + bd.drawW < visLeft ||
          bd.wx - bd.drawW > visRight ||
          bd.wy - bd.drawH > visBot
        ) {
          continue;
        }
        ctx.save();
        ctx.translate(bd.wx, bd.wy);
        ctx.rotate(bd.rot);
        ctx.drawImage(bd.sprite, -bd.drawW * 0.5, -bd.drawH * 0.5, bd.drawW, bd.drawH);
        ctx.restore();
      }

      renderUndergroundRoots(visLeft, visRight);

      ctx.strokeStyle = "rgba(196, 200, 210, 0.52)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(startX, groundWaveY(startX));
      for (let x = startX + stepX; x <= endX; x += stepX) {
        ctx.lineTo(x, groundWaveY(x));
      }
      ctx.stroke();
    }

    if (mossBuffer) {
      for (const mp of mossPlacements) {
        const mw = MOSS_W * mp.scale;
        const mh = MOSS_H * mp.scale;
        if (mp.wx + mw * 0.5 < visLeft || mp.wx - mw * 0.5 > visRight) continue;
        const gy = groundWaveY(mp.wx);
        ctx.save();
        ctx.globalAlpha = mp.alpha;
        ctx.drawImage(mossBuffer, mp.wx - mw * 0.5, gy - mh + 12 * mp.scale, mw, mh);
        ctx.restore();
      }
    }

    for (const b of meadowBlades) {
      if (b.layer !== 0 || b.wx < visLeft || b.wx > visRight) continue;
      const gy = groundWaveY(b.wx);
      const wind = Math.sin(timeSec * 1.15 + b.phase) * (b.h * 0.09);
      ctx.strokeStyle = b.bright ? CHALK_BRIGHT : CHALK_TREE;
      ctx.lineWidth = b.w;
      ctx.beginPath();
      ctx.moveTo(b.wx, gy + 0.4);
      ctx.quadraticCurveTo(
        b.wx + b.lean * 0.4 + wind * 0.4,
        gy - b.h * 0.55,
        b.wx + b.lean + wind,
        gy - b.h
      );
      ctx.stroke();
    }

    if (terraceBuffer && visRight > -TERRACE_W * 0.5 && visLeft < TERRACE_W * 0.5) {
      ctx.drawImage(terraceBuffer, -TERRACE_W * 0.5, TERRACE_TOP_WY, TERRACE_W, TERRACE_H);
    }

    ctx.fillStyle = "rgba(196, 200, 210, 0.78)";
    for (const ds of distantStones) {
      if (ds.wx + ds.w < visLeft || ds.wx - ds.w > visRight) continue;
      const gy = groundWaveY(ds.wx) + 0.6;
      ctx.beginPath();
      ctx.moveTo(ds.wx - ds.w * 0.5, gy);
      ctx.lineTo(ds.wx - ds.w * 0.36, gy - ds.h * 0.85);
      ctx.lineTo(ds.wx + ds.w * 0.22, gy - ds.h);
      ctx.lineTo(ds.wx + ds.w * 0.5, gy);
      ctx.closePath();
      ctx.fill();
    }

    for (const b of meadowBlades) {
      if (b.layer === 0 || b.wx < visLeft || b.wx > visRight) continue;
      const gy = groundWaveY(b.wx);
      const wind = Math.sin(timeSec * 1.15 + b.phase) * (b.h * 0.09);
      ctx.strokeStyle = b.bright ? CHALK_BRIGHT : CHALK_TREE;
      ctx.lineWidth = b.w;
      ctx.beginPath();
      ctx.moveTo(b.wx, gy + 0.6);
      ctx.quadraticCurveTo(
        b.wx + b.lean * 0.4 + wind * 0.4,
        gy - b.h * 0.55,
        b.wx + b.lean + wind,
        gy - b.h
      );
      ctx.stroke();
    }

    ctx.fillStyle = CHALK_BRIGHT;
    ctx.strokeStyle = CHALK_TREE;
    for (const fl of meadowFlowers) {
      if (fl.wx < visLeft || fl.wx > visRight) continue;
      const gy = groundWaveY(fl.wx) + 0.5;
      const wind = Math.sin(timeSec * 0.95 + fl.phase) * 3.2;
      const tipX = fl.wx + fl.lean + wind;
      const tipY = gy - fl.h;

      ctx.lineWidth = 1.05;
      ctx.beginPath();
      ctx.moveTo(fl.wx, gy);
      ctx.quadraticCurveTo(fl.wx + fl.lean * 0.45, gy - fl.h * 0.5, tipX, tipY);
      ctx.stroke();

      if (fl.kind === "puff") {
        ctx.beginPath();
        ctx.arc(tipX, tipY - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (fl.kind === "cup") {
        ctx.beginPath();
        ctx.ellipse(tipX, tipY - 2, 3.6, 2.5, -0.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (fl.kind === "wheat") {
        const stemAng = Math.atan2(tipY - gy, tipX - fl.wx);
        for (let s = 0; s < 5; s++) {
          const frac = 0.54 + s * 0.095;
          const sx = fl.wx + (tipX - fl.wx) * frac;
          const sy = gy + (tipY - gy) * frac;
          drawTeardropBud(ctx, sx, sy, 3.6, 1.7, stemAng + (s % 2 === 0 ? -0.52 : 0.52), CHALK);
        }
      }
    }

    if (spanLeft > spanRight) return;
    ctx.restore();
  }

  function renderIdentityWhisper() {
    const d = getLocale();
    if (!d.identity || identityType <= 0.005) {
      lastHeaderScreenBox = null;
      return;
    }

    const isPhone = vw < 680;
    const isTablet = vw >= 680 && vw < 900;
    const isAr = lang === "ar";
    // Safe inset padding >= 24px desktop, >= 16px mobile inside #vintage-frame
    const sidePad = isPhone ? 18 : isTablet ? 25 : 28;
    const topY = isPhone ? 18 : isTablet ? 25 : 26;
    const x = isAr ? vw - sidePad : sidePad;
    const maxHeaderWidth = isPhone
      ? Math.max(146, vw - 108)
      : isTablet
        ? Math.min(vw - 122, 420)
        : Math.min(vw - 138, 460);

    const namePx = isPhone ? 12.2 : isTablet ? 13 : 13.5;
    const rolePx = isPhone ? 10.6 : isTablet ? 11.2 : 11.8;
    const metaPx = isPhone ? 9.8 : isTablet ? 10.3 : (isAr ? 11 : 10.5);

    const nameStep = isPhone ? (isAr ? 17.5 : 16) : (isAr ? 20 : 18);
    const roleStep = isPhone ? (isAr ? 15.2 : 13.8) : (isAr ? 17.5 : 15.5);
    const metaStep = isPhone ? (isAr ? 14.5 : 13.0) : (isAr ? 16.5 : 14.5);

    ctx.save();
    syncCanvasFontVars();
    resetCanvasLetterSpacing();
    ctx.direction = isAr ? "rtl" : "ltr";
    ctx.textAlign = isAr ? "right" : "left";
    ctx.textBaseline = "top";

    let y = topY;
    let maxRenderedLineW = 0;

    const nameFont = canvasFont(`600 ${namePx}px`, d.identity.name);
    const nameLines = wrapLines(d.identity.name, maxHeaderWidth, nameFont);
    ctx.font = nameFont;
    nameLines.forEach((ln) => {
      maxRenderedLineW = Math.max(maxRenderedLineW, Math.min(maxHeaderWidth, ctx.measureText(ln).width));
    });
    y = drawDiscreteWrappedLines(
      nameLines,
      clamp(identityType / 0.34, 0, 1),
      identityErasing,
      x,
      y,
      nameStep,
      CHALK_BRIGHT,
      namePx,
      1.0
    );

    const roleFont = canvasFont(`400 ${rolePx}px`, d.identity.role);
    const roleLines = wrapLines(d.identity.role, maxHeaderWidth, roleFont);
    resetCanvasLetterSpacing();
    ctx.font = roleFont;
    roleLines.forEach((ln) => {
      maxRenderedLineW = Math.max(maxRenderedLineW, Math.min(maxHeaderWidth, ctx.measureText(ln).width));
    });
    y = drawDiscreteWrappedLines(
      roleLines,
      clamp((identityType - 0.24) / 0.44, 0, 1),
      identityErasing,
      x,
      y,
      roleStep,
      CHALK,
      rolePx,
      1.0
    );

    const metaStr = `${d.identity.location} · ${d.identity.experience}`;
    const metaFont = `400 ${metaPx}px ${fontFamilyFor(metaStr)}`;
    const metaLines = wrapLines(metaStr, maxHeaderWidth, metaFont);
    resetCanvasLetterSpacing();
    ctx.font = metaFont;
    metaLines.forEach((ln) => {
      maxRenderedLineW = Math.max(maxRenderedLineW, Math.min(maxHeaderWidth, ctx.measureText(ln).width));
    });
    y += 1;
    y = drawDiscreteWrappedLines(
      metaLines,
      clamp((identityType - 0.56) / 0.44, 0, 1),
      identityErasing,
      x,
      y,
      metaStep,
      CHALK_MUTED,
      metaPx,
      1.0
    );
    ctx.restore();

    const langBtnW = isPhone ? 54 : 60;
    const langBtnMargin = isPhone ? 17 : isTablet ? 24 : 26;
    const langBtnTop = isPhone ? 17 : isTablet ? 24 : 25;
    const langBtnBox = isAr
      ? { left: langBtnMargin, right: langBtnMargin + langBtnW, top: langBtnTop, bottom: langBtnTop + 28 }
      : { left: vw - langBtnMargin - langBtnW, right: vw - langBtnMargin, top: langBtnTop, bottom: langBtnTop + 28 };

    lastHeaderScreenBox = {
      left: isAr ? x - maxRenderedLineW : x,
      right: isAr ? x : x + maxRenderedLineW,
      top: topY,
      bottom: y,
      maxHeaderWidth,
      langBtnBox
    };
  }

  // =========================================================================
  // CHOREOGRAPHED ANIMATION STEPPER & 1:1 STIPPLE REVEAL TREE RENDERER
  // =========================================================================
  function approach(cur, goal, rateUp, rateDown, dt) {
    if (cur < goal) return Math.min(goal, cur + rateUp * dt);
    if (cur > goal) return Math.max(goal, cur - rateDown * dt);
    return cur;
  }

  function renderTree(timeSec) {
    if (!treeBuffer) return;

    if (introTreeProgress > 0.001) {
      let activeSrc = treeBuffer;
      if (introTreeProgress < 0.999 && treeAnimBuffer) {
        updateTreeAnimBuffer(introTreeProgress);
        activeSrc = treeAnimBuffer;
      }

      // True 1:1 proportions (ZERO scaleX/scaleY stretching, ZERO scalloped clip, ZERO square confetti motes!)
      const slices = 40;
      const srcSliceH = activeSrc.height / slices;
      const dstSliceH = TREE_BUF_H / slices;

      ctx.save();
      for (let i = 0; i < slices; i++) {
        const wyTop = -TREE_H + i * dstSliceH;
        const wyMid = wyTop + dstSliceH * 0.5;
        const sway = computeCanopySway(wyMid, timeSec);
        ctx.drawImage(
          activeSrc,
          0,
          i * srcSliceH,
          activeSrc.width,
          srcSliceH + 1,
          -TREE_W * 0.5 + sway,
          wyTop,
          TREE_W,
          dstSliceH + 0.48
        );
      }
      ctx.restore();
    }

    // Foreground meadow blades overlapping trunk base
    ctx.save();
    ctx.strokeStyle = CHALK_TREE;
    ctx.lineCap = "round";
    for (let i = 0; i < meadowBlades.length; i += 8) {
      const b = meadowBlades[i];
      if (Math.abs(b.wx) > 90) continue;
      const gy = groundWaveY(b.wx);
      const wind = Math.sin(timeSec * 1.15 + b.phase) * (b.h * 0.08);
      const hShort = Math.min(b.h * 0.52, 12);
      ctx.lineWidth = b.w * 0.9;
      ctx.beginPath();
      ctx.moveTo(b.wx, gy + 0.8);
      ctx.quadraticCurveTo(
        b.wx + b.lean * 0.25 + wind * 0.3,
        gy + 0.8 - hShort * 0.5,
        b.wx + b.lean * 0.55 + wind,
        gy + 0.8 - hShort
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  function stepAnimations(dt) {
    // 1. ~1.45s True Botanical Growth-Order Stipple Reveal at 1:1 proportions
    const treeRaw = clamp(introElapsed / 1.45, 0, 1);
    introTreeProgress = easeOutCubic(treeRaw);
    treeGrow = introTreeProgress;
    introGrow = introTreeProgress;

    const rootsRaw = clamp(introElapsed / 1.35, 0, 1);
    rootsGrow = easeOutCubic(rootsRaw);

    // 2. Smooth, dreamy reference-faithful camera glide (damping 3.5 -> ~1.0s-1.2s glide; direct drag stays 0ms instant)
    const camEase = 1 - Math.exp(-3.5 * dt);
    const goalX = targetCam.x + panOffset.x;
    const goalY = targetCam.y + panOffset.y;
    baseCam.x += (goalX - baseCam.x) * camEase;
    baseCam.y += (goalY - baseCam.y) * camEase;
    baseCam.zoom += (targetCam.zoom - baseCam.zoom) * camEase;

    if (!activeBranch && !hasOpenedAnyBranch) {
      const camGlideP = easeOutCubic(clamp(introElapsed / 1.55, 0, 1));
      introCamRem = 1 - camGlideP;
    } else {
      introCamRem *= Math.exp(-3.5 * dt);
      if (introCamRem < 0.0005) introCamRem = 0;
    }

    cam.x = baseCam.x;
    cam.y = baseCam.y;
    cam.zoom = baseCam.zoom * (1 + 0.05 * introCamRem);

    // Silky exponential spring smoothing for 3D depth starfield mouse parallax
    const starEase = 1 - Math.exp(-6.0 * dt);
    starMouse.x += (starMouseTarget.x - starMouse.x) * starEase;
    starMouse.y += (starMouseTarget.y - starMouse.y) * starEase;

    // 3. Boot identity whisper types in calmly (~25% gentler rate) & erases smoothly (~0.38s)
    if (!activeBranch && !hasOpenedAnyBranch && introElapsed <= 1.22) {
      identityErasing = false;
      identityType = clamp((introElapsed - 0.22) / 0.98, 0, 1);
    } else {
      const idGoal = !activeBranch && introElapsed >= 0.22 ? 1 : 0;
      identityErasing = identityType > idGoal;
      identityType = approach(identityType, idGoal, 1 / 0.98, 1 / 0.38, dt);
    }

    // 4. Portrait & Project Photo hover interpolation
    if (activeBranch !== "me") {
      isPortraitHovered = false;
      portraitTouchToggled = false;
    } else if (lastPointerScreen.active && !portraitTouchToggled && portraitBounds) {
      isPortraitHovered = hitTestPortrait(lastPointerScreen.x, lastPointerScreen.y);
    }
    const hoverGoal = activeBranch === "me" && isPortraitHovered ? 1 : 0;
    portraitHoverMix = approach(portraitHoverMix, hoverGoal, 1 / 0.32, 1 / 0.32, dt);

    const d = getLocale();
    const photoHoverEase = 1 - Math.exp(-8.5 * dt);
    const meProjItems = (d && d.branches && d.branches.me && d.branches.me.items) || [];
    for (let pIdx = 0; pIdx < meProjItems.length; pIdx++) {
      const pid = meProjItems[pIdx].id;
      const isProjHov =
        activeBranch === "me" &&
        hoveredHit &&
        (hoveredHit.id === "proj-photo:" + pid || hoveredHit.id === "item:" + pid);
      const targetPHov = isProjHov ? 1 : 0;
      const prevPHov = projectPhotoHover[pid] || 0;
      let nextPHov = prevPHov + (targetPHov - prevPHov) * photoHoverEase;
      if (nextPHov < 0.001 && targetPHov === 0) nextPHov = 0;
      if (nextPHov > 0.999 && targetPHov === 1) nextPHov = 1;
      projectPhotoHover[pid] = nextPHov;
    }

    // Gentle crown wind-sway impulse decay when a retracting branch merges back into the olive crown
    if (crownRustleImpulse > 0.001) {
      crownRustlePhase += dt;
      crownRustleImpulse *= Math.exp(-2.4 * dt);
      if (crownRustleImpulse < 0.001) crownRustleImpulse = 0;
    }

    let maxAnyLimb = 0;
    for (const k of BRANCH_KEYS) {
      if (branchLimbGrow[k] > maxAnyLimb) maxAnyLimb = branchLimbGrow[k];
    }

    BRANCH_KEYS.forEach((k, bIdx) => {
      const bCfg = d.branches[k];
      if (!bCfg) return;
      const isSelected = activeBranch === k;
      const isHome = activeBranch === null;

      // ~40ms/char (~25% gentler) discrete branch title typing & ~1.85x smooth backwards erase!
      const charCount = Math.max(4, (bCfg.label || "").length);
      const labelWriteDur = charCount * 0.040;
      const labelEraseDur = Math.max(0.14, labelWriteDur / 1.85);
      const labelRateUp = 1 / labelWriteDur;
      const labelRateDown = 1 / labelEraseDur;

      if (isHome) {
        const twigStart = 1.00 + bIdx * 0.095;
        if (!hasOpenedAnyBranch && introElapsed < 2.35) {
          mainTwigGrow[k] =
            introElapsed <= twigStart
              ? 0
              : clamp((introElapsed - twigStart) / 0.50, 0, 1);
        } else {
          const canExtend = introElapsed > twigStart && maxAnyLimb < 0.44;
          mainTwigGrow[k] = approach(mainTwigGrow[k], canExtend ? 1 : 0, 1 / 0.50, 1 / 0.44, dt);
        }

        const labelGoal = mainTwigGrow[k] >= 0.52 ? 1 : 0;
        mainLabelErasing[k] = mainLabelType[k] > labelGoal;
        mainLabelType[k] = approach(mainLabelType[k], labelGoal, labelRateUp, labelRateDown, dt);
        underlineProg[k] = approach(underlineProg[k], 0, 2.2, 2.8, dt);
      } else if (isSelected && k === "experience") {
        // Smoothly retract horizontal resting label/twig as the arching experience bough takes over
        mainLabelErasing[k] = mainLabelType[k] > 0;
        mainLabelType[k] = approach(mainLabelType[k], 0, labelRateUp, labelRateDown * 1.15, dt);
        mainTwigGrow[k] = approach(mainTwigGrow[k], mainLabelType[k] > 0.18 ? 1 : 0, 2.2, 2.4, dt);
        underlineProg[k] = approach(underlineProg[k], 0, 2.2, 2.8, dt);
      } else if (isSelected) {
        mainTwigGrow[k] = approach(mainTwigGrow[k], 1, 2.2, 2.2, dt);
        mainLabelErasing[k] = false;
        mainLabelType[k] = approach(mainLabelType[k], 1, labelRateUp, labelRateDown, dt);
        underlineProg[k] = approach(underlineProg[k], 1, 2.0, 2.6, dt);
      } else {
        mainLabelErasing[k] = mainLabelType[k] > 0;
        mainLabelType[k] = approach(mainLabelType[k], 0, labelRateUp, labelRateDown, dt);
        const twigGoal = mainLabelType[k] > 0.22 ? 1 : 0;
        mainTwigGrow[k] = approach(mainTwigGrow[k], twigGoal, 2.2, 2.3, dt);
        underlineProg[k] = approach(underlineProg[k], 0, 2.2, 2.8, dt);
      }

      let maxChildItemType = 0;
      let maxChildSubTwig = 0;
      bCfg.items.forEach((it) => {
        if ((itemType[it.id] || 0) > maxChildItemType) maxChildItemType = itemType[it.id] || 0;
        if ((subTwigGrow[it.id] || 0) > maxChildSubTwig) maxChildSubTwig = subTwigGrow[it.id] || 0;
      });

      // Reference-Faithful Calm Branch Opening & Overlapping Closing Choreography:
      // - Main branches (work, writing, me): open over ~1.05s, close over ~0.92s (with ~0.36s ~1.85x backwards erase overlapping organically)
      // - Experience arching bough: opens over ~1.38s, closes over ~0.98s
      if (k === "me") {
        const bioGoal = isSelected && branchLimbGrow.me >= 0.52 ? 1 : 0;
        meBioErasing = meBioType > bioGoal;
        meBioType = approach(meBioType, bioGoal, 1 / 0.98, 1 / 0.36, dt); // ~0.36s calm backwards erase

        const headGoal = isSelected && branchLimbGrow.me >= 0.56 ? 1 : 0;
        meProjectsHeadingErasing = meProjectsHeadingType > headGoal;
        meProjectsHeadingType = approach(meProjectsHeadingType, headGoal, 1 / 0.70, 1 / 0.35, dt);

        const meHoldWhileText = meBioType > 0.85 || maxChildItemType > 0.85;
        const meGoal = isSelected ? 1 : meHoldWhileText ? 1 : 0;
        branchRetracting.me = branchRaw.me > meGoal;
        branchRaw.me = approach(branchRaw.me, meGoal, 1 / 1.14, 1 / 0.98, dt);
        branchLimbGrow.me = branchRetracting.me
          ? easeInOutCubic(branchRaw.me)
          : easeOrganicBranch(branchRaw.me);
      } else if (k === "experience") {
        const expHoldWhileText = maxChildItemType > 0.85;
        const expGoal = isSelected ? 1 : expHoldWhileText ? 1 : 0;
        expBoughRetracting = expBoughRaw > expGoal;
        expBoughRaw = approach(expBoughRaw, expGoal, 1 / 1.42, 1 / 1.04, dt);
        expBoughGrow = expBoughRetracting
          ? easeInOutCubic(expBoughRaw)
          : easeOutCubic(expBoughRaw);
        branchRaw.experience = expBoughRaw;
        branchLimbGrow.experience = expBoughGrow;
      } else {
        const stdHoldWhileText = maxChildItemType > 0.85;
        const limbGoal = isSelected ? 1 : stdHoldWhileText ? 1 : 0;
        branchRetracting[k] = branchRaw[k] > limbGoal;
        branchRaw[k] = approach(branchRaw[k], limbGoal, 1 / 1.14, 1 / 0.98, dt);
        branchLimbGrow[k] = branchRetracting[k]
          ? easeInOutCubic(branchRaw[k])
          : easeOrganicBranch(branchRaw[k]);
      }

      bCfg.items.forEach((it, idx) => {
        const id = it.id;
        const curSubRaw = subTwigRaw[id] !== undefined ? subTwigRaw[id] : (subTwigGrow[id] || 0);
        const curType = itemType[id] || 0;
        const curSumF = siblingSumFactor[id] === undefined ? 1 : siblingSumFactor[id];
        const curItemRaw = itemRaw[id] !== undefined ? itemRaw[id] : (lvl2ShootGrow[id] || 0);
        const curT2 = lvl2Type[id] || 0;

        const isExpClosingThisYear = k === "experience" && closingExpYear === id;
        const isItemSelected =
          isSelected &&
          !isExpClosingThisYear &&
          (activeItem === id || expandedItems.has(id));

        const lvl2OpenDur = k === "experience" ? 0.85 : 0.68;
        const lvl2RetractDur = k === "experience" ? 0.72 : 0.62;

        if (isItemSelected) {
          itemRaw[id] = approach(curItemRaw, 1, 1 / lvl2OpenDur, 1 / lvl2RetractDur, dt);
          lvl2ShootGrow[id] = easeOutCubic(itemRaw[id]);
          const t2Goal = lvl2ShootGrow[id] >= 0.52 ? 1 : 0;
          lvl2Erasing[id] = curT2 > t2Goal;
          lvl2Type[id] = approach(curT2, t2Goal, 1 / 0.85, 1 / 0.36, dt);
          if (k === "experience" && activeExpYear === id) {
            expYearShootRaw = itemRaw[id];
            expYearShootGrow = lvl2ShootGrow[id];
          }
        } else {
          // Calm sub-item collapse: ~0.36s backwards erase overlapping with ~0.62s (~0.72s for experience) cubic-in-out shoot folding
          lvl2Erasing[id] = curT2 > 0;
          lvl2Type[id] = approach(curT2, 0, 1 / 0.85, 1 / 0.36, dt);
          const holdShoot = lvl2Type[id] > 0.84 ? 1 : 0;
          itemRaw[id] = approach(curItemRaw, holdShoot, 1 / lvl2OpenDur, 1 / lvl2RetractDur, dt);
          lvl2ShootGrow[id] = easeInOutCubic(itemRaw[id]);

          if (lvl2ShootGrow[id] <= 0.008 && lvl2Type[id] <= 0.008) {
            itemRaw[id] = 0;
            lvl2ShootGrow[id] = 0;
            closingItems.delete(id);
          }

          if (k === "experience" && activeExpYear === id) {
            expYearShootRaw = itemRaw[id];
            expYearShootGrow = lvl2ShootGrow[id];
            if (expYearShootGrow <= 0.01 && lvl2Type[id] <= 0.01) {
              expYearShootRaw = 0;
              expYearShootGrow = 0;
              lvl2ShootGrow[id] = 0;
              itemRaw[id] = 0;
              activeExpYear = null;
              if (activeItem === id) activeItem = null;
              if (closingExpYear === id) closingExpYear = null;
              syncBackButton();
            }
          }
        }

        const sumGoal =
          isSelected && activeItem && !closingExpYear && activeItem !== id ? 0.28 : 1.0;
        siblingSumFactor[id] = approach(curSumF, sumGoal, 1.9, 2.2, dt);

        if (k === "experience") {
          const nodeT = typeof it.t === "number" ? it.t : 0.16 + idx * 0.15;
          if (isSelected) {
            const sproutThreshold = idx === 5 ? 0.93 : nodeT - 0.02;
            const canSprout = expBoughGrow >= sproutThreshold;
            subTwigRaw[id] = approach(curSubRaw, canSprout ? 1 : 0, 1 / 0.68, 1 / 0.52, dt);
            subTwigGrow[id] = canSprout ? easeOutCubic(subTwigRaw[id]) : easeInOutCubic(subTwigRaw[id]);
            const yrGoal = subTwigGrow[id] >= 0.52 ? 1 : 0;
            itemErasing[id] = curType > yrGoal;
            itemType[id] = approach(curType, yrGoal, 1 / 0.46, 1 / 0.34, dt);
          } else {
            itemErasing[id] = curType > 0;
            itemType[id] = approach(curType, 0, 1 / 0.46, 1 / 0.34, dt);
            const subGoal = (itemType[id] > 0.58 || lvl2ShootGrow[id] > 0.20) && expBoughGrow >= nodeT * 0.85 ? 1 : 0;
            subTwigRaw[id] = approach(curSubRaw, subGoal, 1 / 0.68, 1 / 0.52, dt);
            subTwigGrow[id] = easeInOutCubic(subTwigRaw[id]);
          }
        } else if (isSelected && k === "me") {
          const matchesFlt = isMeProjectMatchingFilter(it);
          const stagger = Math.min(0.52, idx * 0.062);
          const canSprout = matchesFlt && branchLimbGrow.me > 0.24 + stagger;
          subTwigRaw[id] = approach(curSubRaw, canSprout ? 1 : 0, 1 / 0.82, 1 / 0.56, dt);
          subTwigGrow[id] = canSprout ? easeOrganicBranch(subTwigRaw[id]) : easeInOutCubic(subTwigRaw[id]);
          const itemGoal = matchesFlt && subTwigGrow[id] >= 0.52 ? 1 : 0;
          itemErasing[id] = curType > itemGoal;
          itemType[id] = approach(curType, itemGoal, 1 / 0.86, 1 / 0.36, dt);
        } else if (isSelected) {
          const stagger = Math.min(0.56, idx * 0.085);
          const canSprout = branchLimbGrow[k] > 0.24 + stagger;
          subTwigRaw[id] = approach(curSubRaw, canSprout ? 1 : 0, 1 / 0.82, 1 / 0.56, dt);
          subTwigGrow[id] = canSprout ? easeOrganicBranch(subTwigRaw[id]) : easeInOutCubic(subTwigRaw[id]);
          const itemGoal = subTwigGrow[id] >= 0.52 ? 1 : 0;
          itemErasing[id] = curType > itemGoal;
          itemType[id] = approach(curType, itemGoal, 1 / 0.90, 1 / 0.36, dt);
        } else {
          itemErasing[id] = curType > 0;
          itemType[id] = approach(curType, 0, 1 / 0.90, 1 / 0.36, dt);
          const subGoal = itemType[id] > 0.62 || lvl2ShootGrow[id] > 0.22 ? 1 : 0;
          subTwigRaw[id] = approach(curSubRaw, subGoal, 1 / 0.82, 1 / 0.56, dt);
          subTwigGrow[id] = easeInOutCubic(subTwigRaw[id]);
        }
      });

      // Clear closingBranch cleanly once reverse botanical retraction completes (<= 0.005)
      if (closingBranch === k && !isSelected) {
        const limbDone = branchLimbGrow[k] <= 0.005;
        const bioDone = k !== "me" || (meBioType <= 0.005 && meProjectsHeadingType <= 0.005);
        if (limbDone && maxChildItemType <= 0.005 && maxChildSubTwig <= 0.005 && bioDone) {
          if (k === "me" && activeBranch !== "me") {
            meProjectFilter = "all";
          }
          closingBranch = null;
        }
      }
    });
  }

  function stepFrame(nowMs) {
    if (firstFrameMs === null) {
      firstFrameMs = nowMs;
      lastFrameMs = nowMs;
    }
    const rawDt = (nowMs - lastFrameMs) * 0.001;
    const dt = Math.min(0.05, Math.max(0, rawDt));
    lastFrameMs = nowMs;
    introElapsed = Math.max(0, (nowMs - firstFrameMs) * 0.001);
    const timeSec = nowMs * 0.001;

    frameStrokeTextCalls = 0;
    frameFillTextCalls = 0;
    frameChalkPatternCalls = 0;

    stepAnimations(dt);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const treeScreen = worldToScreen(0, -320);
    const skyGrad = ctx.createRadialGradient(
      treeScreen.x,
      treeScreen.y,
      18,
      treeScreen.x,
      treeScreen.y,
      Math.max(vw, vh) * 0.88
    );
    ctx.fillStyle = SKY_EDGE;
    ctx.fillRect(0, 0, vw, vh);
    skyGrad.addColorStop(0, SKY_LIFT);
    skyGrad.addColorStop(0.46, SKY_CORE);
    skyGrad.addColorStop(1, SKY_EDGE);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, vw, vh);

    lastUnderlineLogs = [];
    lastStarGlintLogs = [];
    lastBranchLabelScreenBoxes = [];
    lastBioScreenBox = null;
    lastPortraitScreenBox = null;
    lastExpYearScreenBoxes = [];
    lastExpLeafPuffCircles = [];
    lastExpTextLineBoxes = [];
    lastMeProjectsScreenBoxes = [];
    lastBioHighlightLogs = [];
    lastMeFilterScreenBoxes = [];
    lastMeProjectSubBoxes = [];
    lastMeProjectPhotoBoxes = [];
    lastMeProjectActionBoxes = [];

    lastRenderedStars = [];
    const horizonLimitY = worldToScreen(cam.x, -18).y;
    for (let sIdx = 0; sIdx < stars.length; sIdx++) {
      const s = stars[sIdx];
      const depth = typeof s.depth === "number" ? s.depth : 0.6;
      const camParallax = 0.20 + depth * 0.14;
      const starScale = cam.zoom * (0.58 + depth * 0.12) + 0.35;

      // 3D Depth Mouse Parallax (~16px for distant stars to ~42px for foreground stars)
      const mouseShiftX = -starMouse.x * (10 + depth * 28);
      const mouseShiftY = -starMouse.y * (8 + depth * 22);

      const baseSx = (s.wx - cam.x * camParallax) * starScale + vw * 0.5 + mouseShiftX;
      const baseSy = (s.wy - cam.y * camParallax) * starScale + vh * 0.5 + mouseShiftY;

      // Subtle local cursor proximity repulsion & glow (< 95px)
      let pushX = 0;
      let pushY = 0;
      let alphaBoost = 0;
      if (starCursorScreen.active) {
        const dxCur = baseSx - starCursorScreen.x;
        const dyCur = baseSy - starCursorScreen.y;
        const dist = Math.hypot(dxCur, dyCur);
        if (dist < 95) {
          const falloff = Math.pow(1 - dist / 95, 2);
          const push = falloff * 7.5;
          if (dist > 0.001) {
            pushX = (dxCur / dist) * push;
            pushY = (dyCur / dist) * push;
          } else {
            pushY = -push;
          }
          alphaBoost = falloff * 0.28;
        }
      }

      const sx = baseSx + pushX;
      const sy = baseSy + pushY;

      if (sx < -16 || sx > vw + 16 || sy < -16 || sy > Math.min(vh + 12, horizonLimitY)) {
        continue;
      }

      const tw = 0.78 + 0.22 * Math.sin(timeSec * s.speed + s.phase);
      let glint = 0;
      if (s.glint) {
        glint = clamp(
          Math.pow(0.5 + 0.5 * Math.sin(timeSec * s.glintSpeed + s.glintPhase), 3.6) + alphaBoost * 0.65,
          0,
          1
        );
      }

      let recordedHaloR = 0;
      let recordedHaloPeak = 0;
      let recordedArmLen = 0;

      if (glint > 0.04) {
        const maxHaloR = 3.2 + 2.3 * s.sparkleScale;
        const haloR = maxHaloR * (0.55 + 0.45 * glint);
        const haloPeak = 0.15 * glint;
        recordedHaloR = haloR;
        recordedHaloPeak = haloPeak;

        const hGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, haloR);
        hGrad.addColorStop(0, `rgba(220, 224, 232, ${haloPeak.toFixed(3)})`);
        hGrad.addColorStop(0.45, `rgba(198, 202, 210, ${(haloPeak * 0.36).toFixed(3)})`);
        hGrad.addColorStop(1, "rgba(198, 202, 210, 0)");
        ctx.fillStyle = hGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
        ctx.fill();

        const maxArmLen = 3.5 + 3.0 * s.sparkleScale;
        const armLen = maxArmLen * (0.45 + 0.55 * glint);
        recordedArmLen = armLen;
        const rayPeak = 0.48 * glint;
        const rayMid = 0.20 * glint;

        ctx.save();
        ctx.lineWidth = 0.62;
        ctx.lineCap = "butt";

        if (typeof ctx.createLinearGradient === "function") {
          const hRay = ctx.createLinearGradient(sx - armLen, sy, sx + armLen, sy);
          hRay.addColorStop(0, "rgba(220, 224, 232, 0)");
          hRay.addColorStop(0.36, `rgba(220, 224, 232, ${rayMid.toFixed(3)})`);
          hRay.addColorStop(0.5, `rgba(220, 224, 232, ${rayPeak.toFixed(3)})`);
          hRay.addColorStop(0.64, `rgba(220, 224, 232, ${rayMid.toFixed(3)})`);
          hRay.addColorStop(1, "rgba(220, 224, 232, 0)");
          ctx.strokeStyle = hRay;
          ctx.beginPath();
          ctx.moveTo(sx - armLen, sy);
          ctx.lineTo(sx + armLen, sy);
          ctx.stroke();

          const vRay = ctx.createLinearGradient(sx, sy - armLen, sx, sy + armLen);
          vRay.addColorStop(0, "rgba(220, 224, 232, 0)");
          vRay.addColorStop(0.36, `rgba(220, 224, 232, ${rayMid.toFixed(3)})`);
          vRay.addColorStop(0.5, `rgba(220, 224, 232, ${rayPeak.toFixed(3)})`);
          vRay.addColorStop(0.64, `rgba(220, 224, 232, ${rayMid.toFixed(3)})`);
          vRay.addColorStop(1, "rgba(220, 224, 232, 0)");
          ctx.strokeStyle = vRay;
          ctx.beginPath();
          ctx.moveTo(sx, sy - armLen);
          ctx.lineTo(sx, sy + armLen);
          ctx.stroke();
        } else {
          ctx.strokeStyle = `rgba(220, 224, 232, ${(rayPeak * 0.6).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(sx - armLen, sy);
          ctx.lineTo(sx + armLen, sy);
          ctx.moveTo(sx, sy - armLen);
          ctx.lineTo(sx, sy + armLen);
          ctx.stroke();
        }
        ctx.restore();
      }

      const coreR = s.glint ? (1.0 + 0.28 * glint * s.sparkleScale) : s.r;
      const coreAlpha = clamp(s.alpha * tw * 0.88 + glint * 0.26 + alphaBoost, 0, 0.90);
      const rgbStr = s.glint || s.bright || alphaBoost > 0.05 ? "223, 226, 232" : "200, 203, 210";
      ctx.fillStyle = `rgba(${rgbStr}, ${coreAlpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, coreR, 0, Math.PI * 2);
      ctx.fill();

      lastRenderedStars.push({
        idx: sIdx,
        wx: s.wx,
        wy: s.wy,
        depth,
        glint: Boolean(s.glint),
        r: coreR,
        baseSx,
        baseSy,
        sx,
        sy,
        mouseShiftX,
        mouseShiftY,
        pushX,
        pushY,
        alphaBoost,
        coreAlpha
      });

      if (glint > 0.04) {
        lastStarGlintLogs.push({
          sx,
          sy,
          haloR: recordedHaloR,
          haloPeak: recordedHaloPeak,
          armLen: recordedArmLen,
          lineWidth: 0.62,
          coreR,
          coreAlpha
        });
      }
    }

    ctx.save();
    ctx.translate(vw * 0.5, vh * 0.5);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    renderWorldCrossSection(timeSec);
    renderTree(timeSec);

    worldHitboxes = [];
    if (activeBranch !== "me") {
      portraitBounds = null;
    }
    renderMenuAndGrownBranches(timeSec);

    ctx.restore();

    renderIdentityWhisper();

    if (!filmGrainAppliedToDom && grainPattern) {
      ctx.save();
      ctx.globalAlpha = 0.075;
      if ("globalCompositeOperation" in ctx) {
        ctx.globalCompositeOperation = "overlay";
      }
      ctx.fillStyle = grainPattern;
      ctx.fillRect(0, 0, vw, vh);
      ctx.restore();
    }
  }

  function renderFrame(nowMs) {
    stepFrame(nowMs);
    rafId = requestAnimationFrame(renderFrame);
  }

  // =========================================================================
  // INTERACTIONS (Clicks, Botanical Back Button, Escape, Touch Pan)
  // =========================================================================
  function hitTestPortrait(sx, sy) {
    if (activeBranch !== "me" || !portraitBounds) return false;
    const pt = screenToWorld(sx, sy);
    const dx = pt.x - portraitBounds.cx;
    const dy = pt.y - portraitBounds.cy;
    const cosA = Math.cos(-portraitBounds.angle);
    const sinA = Math.sin(-portraitBounds.angle);
    const lx = dx * cosA - dy * sinA;
    const ly = dx * sinA + dy * cosA;
    return Math.abs(lx) <= portraitBounds.w * 0.5 && Math.abs(ly) <= portraitBounds.h * 0.5;
  }

  function hitTestWorld(sx, sy) {
    const pt = screenToWorld(sx, sy);
    for (let i = worldHitboxes.length - 1; i >= 0; i--) {
      const hb = worldHitboxes[i];
      if (pt.x >= hb.x && pt.x <= hb.x + hb.w && pt.y >= hb.y && pt.y <= hb.y + hb.h) {
        return hb;
      }
    }
    return null;
  }

  function computeClampedCameraLimits() {
    const z = Math.max(0.28, targetCam.zoom || cam.zoom || 1);
    if (!activeBranch) {
      return {
        minX: defaultTargetCam.x - 180,
        maxX: defaultTargetCam.x + 180,
        minY: defaultTargetCam.y - 140,
        maxY: defaultTargetCam.y + 140
      };
    }
    const bounds = computeActiveContentBounds();
    const halfVW = (vw * 0.5) / z;
    const halfVH = (vh * 0.5) / z;
    const padSideW = 28 / z;
    const padTopW = 56 / z;
    const padBotW = 84 / z;

    const minX = Math.min(defaultTargetCam.x - 80, bounds.minX - padSideW + halfVW);
    const maxX = Math.max(defaultTargetCam.x + 80, bounds.maxX + padSideW - halfVW);
    const minY = Math.min(defaultTargetCam.y - 40, bounds.minY - padTopW + halfVH);
    const maxY = Math.max(defaultTargetCam.y + 40, bounds.maxY + padBotW - halfVH);
    return { minX, maxX, minY, maxY };
  }

  // Smooth wheel scrolling: pans targetCam.y (and targetCam.x) within clamped content bounds whenever any branch is open!
  function applyWheelDelta(deltaX, deltaY, deltaMode) {
    if (!activeBranch) return false;
    const modeScale = deltaMode === 1 ? 32 : deltaMode === 2 ? vh * 0.85 : 1;
    const dxPx = (deltaX || 0) * modeScale;
    const dyPx = (deltaY || 0) * modeScale;
    const z = Math.max(0.28, targetCam.zoom || cam.zoom || 1);
    const lim = computeClampedCameraLimits();

    targetCam.x = clamp(targetCam.x + (dxPx / z) * 0.85, lim.minX - panOffset.x, lim.maxX - panOffset.x);
    targetCam.y = clamp(targetCam.y + (dyPx / z) * 0.85, lim.minY - panOffset.y, lim.maxY - panOffset.y);
    return true;
  }

  function applyPanDeltaScreen(dxScreen, dyScreen) {
    const z = Math.max(0.25, cam.zoom || 1);
    const lim = computeClampedCameraLimits();
    const nextGoalX = clamp(targetCam.x + panOffset.x - dxScreen / z, lim.minX, lim.maxX);
    const nextGoalY = clamp(targetCam.y + panOffset.y - dyScreen / z, lim.minY, lim.maxY);
    panOffset.x = nextGoalX - targetCam.x;
    panOffset.y = nextGoalY - targetCam.y;
    baseCam.x = nextGoalX;
    baseCam.y = nextGoalY;
    cam.x = baseCam.x;
    cam.y = baseCam.y;
  }

  function collapseSubItemSmoothly(itemId) {
    if (!itemId) return;
    expandedItems.delete(itemId);
    closingItems.add(itemId);
    if (activeBranch === "experience" && activeExpYear === itemId) {
      // Experience Level 2 -> Level 1: keep activeExpYear until expYearShootGrow <= 0.01!
      closingExpYear = itemId;
      triggerCrownRustle(0.5);
    } else {
      if (activeItem === itemId) activeItem = null;
      triggerCrownRustle(0.35);
    }
    syncCameraToActiveState(false);
  }

  function transitionToBranch(nextBranch) {
    const resolved = nextBranch === "projects" ? "me" : (nextBranch || null);
    if (activeBranch && activeBranch !== resolved) {
      closingBranch = activeBranch;
      triggerCrownRustle(1.0);
    }
    if (activeItem) {
      expandedItems.delete(activeItem);
      closingItems.add(activeItem);
      activeItem = null;
    }
    if (activeExpYear) {
      closingExpYear = activeExpYear;
      if (resolved !== "experience") {
        activeExpYear = null;
        closingExpYear = null;
      }
    }
    if (resolved === "me" && activeBranch !== "me") {
      meProjectFilter = "all";
    }
    if (closingBranch === resolved) {
      closingBranch = null;
    }
    activeBranch = resolved;
    syncCameraToActiveState(false);
  }

  function stepBackOneLevel() {
    resetPanOffset();
    // Level 2 -> Level 1 in Experience: retract expYearShootGrow (1.0 -> 0.0 over ~0.34s) & glide to Level-1 bough
    if (activeBranch === "experience" && activeExpYear && !closingExpYear) {
      collapseSubItemSmoothly(activeExpYear);
      return true;
    }
    // Level 2 -> Level 1 in standard branches (work, writing, me)
    if (activeItem && !closingExpYear) {
      collapseSubItemSmoothly(activeItem);
      return true;
    }
    // Level 1 -> Home: 2-stage backwards typewriter erase + reverse Bezier retraction + crown rustle!
    if (activeBranch) {
      if (activeExpYear) {
        closingItems.add(activeExpYear);
        activeExpYear = null;
        closingExpYear = null;
        activeItem = null;
      }
      transitionToBranch(null);
      return true;
    }
    return false;
  }

  function handleWorldClick(sx, sy) {
    if (playlistOpen) {
      setPlaylistOpen(false);
      const hitWhileOpen = hitTestWorld(sx, sy);
      if (!hitWhileOpen) return;
    }

    const hit = hitTestWorld(sx, sy);

    if (!hit) {
      if (hitTestPortrait(sx, sy)) {
        portraitTouchToggled = !portraitTouchToggled;
        isPortraitHovered = portraitTouchToggled;
        return;
      }
      if (Math.hypot(panOffset.x, panOffset.y) > 12) {
        resetPanOffset();
        return;
      }
      stepBackOneLevel();
      return;
    }

    if (hit.kind === "project-jump") {
      resetPanOffset();
      if (activeBranch !== "me") {
        transitionToBranch("me");
      }
      const d = getLocale();
      const targetProj =
        d && d.branches && d.branches.me && Array.isArray(d.branches.me.items)
          ? d.branches.me.items.find((it) => it.id === hit.projectId)
          : null;
      if (targetProj && !isMeProjectMatchingFilter(targetProj)) {
        meProjectFilter = "all";
      }
      subTwigRaw[hit.projectId] = 1;
      subTwigGrow[hit.projectId] = Math.max(subTwigGrow[hit.projectId] || 0, 1);
      itemType[hit.projectId] = Math.max(itemType[hit.projectId] || 0, 1);
      expandedItems.clear();
      expandedItems.add(hit.projectId);
      closingItems.delete(hit.projectId);
      activeItem = hit.projectId;
      syncCameraToActiveState(false);
      return;
    }

    if (hit.kind === "project-filter") {
      const nextFlt = hit.filterKey || "all";
      meProjectFilter = nextFlt;
      const d = getLocale();
      if (activeItem && d && d.branches && d.branches.me && Array.isArray(d.branches.me.items)) {
        const curOpen = d.branches.me.items.find((it) => it.id === activeItem);
        if (curOpen && !isMeProjectMatchingFilter(curOpen)) {
          collapseSubItemSmoothly(activeItem);
        }
      }
      resetPanOffset();
      if (d && d.branches && d.branches.me) {
        const bCfg = d.branches.me;
        const lay = computeBranchLayout(bCfg);
        const meLay = computeMeEditorialLayout(bCfg, lay);
        const z = Math.max(0.35, targetCam.zoom || cam.zoom || 1);
        targetCam.y = (meLay.projectsHeadingY - 24) - (68 - vh * 0.5) / z;
        defaultTargetCam.y = targetCam.y;
      }
      return;
    }

    if (hit.kind === "action") {
      const targetUrl = hit.action && (hit.action.href || hit.action.url);
      lastTriggeredAction = {
        ...(hit.action || {}),
        resolvedUrl: targetUrl || null,
        itemId: hit.itemId || null
      };
      if (hit.action.copy) {
        copyToClipboard(hit.action.copy);
        const msg =
          hit.action.toast || `${getLocale().copiedPrefix || "copied"} ${hit.action.copy}`;
        showToast(msg);
      } else if (targetUrl) {
        if (/^https?:\/\//i.test(targetUrl) && typeof window.open === "function") {
          window.open(targetUrl, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = targetUrl;
        }
      }
      return;
    }

    if (hit.kind === "branch") {
      resetPanOffset();
      if (activeBranch === hit.branchKey) {
        stepBackOneLevel();
      } else {
        transitionToBranch(hit.branchKey);
      }
      return;
    }

    if (hit.kind === "item" || hit.kind === "project-photo") {
      resetPanOffset();
      if (activeBranch !== hit.branchKey) {
        transitionToBranch(hit.branchKey);
      }
      const isAlreadyOpen =
        (activeItem === hit.itemId && closingExpYear !== hit.itemId) ||
        expandedItems.has(hit.itemId);
      if (isAlreadyOpen) {
        collapseSubItemSmoothly(hit.itemId);
      } else {
        if (activeItem && activeItem !== hit.itemId) {
          expandedItems.delete(activeItem);
          closingItems.add(activeItem);
        }
        expandedItems.add(hit.itemId);
        closingItems.delete(hit.itemId);
        activeItem = hit.itemId;
        if (hit.branchKey === "experience") {
          activeExpYear = hit.itemId;
          closingExpYear = null;
        }
        syncCameraToActiveState(false);
      }
    }
  }

  function updateStarPointerFromScreen(clientX, clientY) {
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
    starMouseTarget.x = clamp(((clientX / Math.max(1, vw)) - 0.5) * 2, -1, 1);
    starMouseTarget.y = clamp(((clientY / Math.max(1, vh)) - 0.5) * 2, -1, 1);
    starCursorScreen.x = clientX;
    starCursorScreen.y = clientY;
    starCursorScreen.active = true;
  }

  window.addEventListener(
    "mousemove",
    (e) => {
      updateStarPointerFromScreen(e.clientX, e.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    "pointermove",
    (e) => {
      updateStarPointerFromScreen(e.clientX, e.clientY);
    },
    { passive: true }
  );

  let recentTouchMs = 0;
  const touchGesture = {
    active: false,
    id: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    isDragging: false
  };

  canvas.addEventListener(
    "touchstart",
    (e) => {
      recentTouchMs = performance.now();
      if (!e.touches || e.touches.length !== 1) {
        touchGesture.active = false;
        return;
      }
      const t = e.touches[0];
      updateStarPointerFromScreen(t.clientX, t.clientY);
      touchGesture.active = true;
      touchGesture.id = t.identifier;
      touchGesture.startX = t.clientX;
      touchGesture.startY = t.clientY;
      touchGesture.lastX = t.clientX;
      touchGesture.lastY = t.clientY;
      touchGesture.isDragging = false;
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      recentTouchMs = performance.now();
      if (!touchGesture.active || !e.touches || e.touches.length !== 1) return;
      const t = e.touches[0];
      updateStarPointerFromScreen(t.clientX, t.clientY);
      const totalDist = Math.hypot(t.clientX - touchGesture.startX, t.clientY - touchGesture.startY);
      if (totalDist >= 8) {
        touchGesture.isDragging = true;
      }
      if (touchGesture.isDragging) {
        if (typeof e.preventDefault === "function") e.preventDefault();
        const dx = t.clientX - touchGesture.lastX;
        const dy = t.clientY - touchGesture.lastY;
        applyPanDeltaScreen(dx, dy);
      }
      touchGesture.lastX = t.clientX;
      touchGesture.lastY = t.clientY;
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    (e) => {
      recentTouchMs = performance.now();
      if (!touchGesture.active) return;
      const wasDragging = touchGesture.isDragging;
      const tapX = touchGesture.lastX;
      const tapY = touchGesture.lastY;
      touchGesture.active = false;
      touchGesture.isDragging = false;

      if (!wasDragging) {
        if (typeof e.preventDefault === "function") e.preventDefault();
        handleWorldClick(tapX, tapY);
      }
    },
    { passive: false }
  );

  canvas.addEventListener("touchcancel", () => {
    touchGesture.active = false;
    touchGesture.isDragging = false;
  });

  const mouseGesture = {
    down: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    isDragging: false,
    suppressClickUntil: 0
  };

  canvas.addEventListener("mousedown", (e) => {
    if (performance.now() - recentTouchMs < 500) return;
    if (e.button !== 0) return;
    mouseGesture.down = true;
    mouseGesture.startX = e.clientX;
    mouseGesture.startY = e.clientY;
    mouseGesture.lastX = e.clientX;
    mouseGesture.lastY = e.clientY;
    mouseGesture.isDragging = false;
  });

  canvas.addEventListener("mousemove", (e) => {
    if (performance.now() - recentTouchMs < 500) return;
    lastPointerScreen.x = e.clientX;
    lastPointerScreen.y = e.clientY;
    lastPointerScreen.active = true;

    if (mouseGesture.down) {
      const dist = Math.hypot(e.clientX - mouseGesture.startX, e.clientY - mouseGesture.startY);
      if (dist >= 7) {
        mouseGesture.isDragging = true;
      }
      if (mouseGesture.isDragging) {
        const dx = e.clientX - mouseGesture.lastX;
        const dy = e.clientY - mouseGesture.lastY;
        applyPanDeltaScreen(dx, dy);
      }
      mouseGesture.lastX = e.clientX;
      mouseGesture.lastY = e.clientY;
      if (mouseGesture.isDragging) return;
    }

    portraitTouchToggled = false;
    isPortraitHovered = hitTestPortrait(e.clientX, e.clientY);
    hoveredHit = hitTestWorld(e.clientX, e.clientY);
    canvas.classList.toggle("is-pointer", Boolean(hoveredHit || isPortraitHovered));
  });

  window.addEventListener("mouseup", () => {
    if (mouseGesture.down && mouseGesture.isDragging) {
      mouseGesture.suppressClickUntil = performance.now() + 180;
    }
    mouseGesture.down = false;
    mouseGesture.isDragging = false;
  });

  canvas.addEventListener("mouseleave", () => {
    lastPointerScreen.active = false;
    mouseGesture.down = false;
    mouseGesture.isDragging = false;
    if (!portraitTouchToggled) {
      isPortraitHovered = false;
    }
    hoveredHit = null;
    canvas.classList.remove("is-pointer");
  });

  canvas.addEventListener("click", (e) => {
    if (performance.now() - recentTouchMs < 500) return;
    if (performance.now() < mouseGesture.suppressClickUntil) return;
    handleWorldClick(e.clientX, e.clientY);
  });

  window.addEventListener(
    "wheel",
    (e) => {
      if (musicPlaylist && !musicPlaylist.hidden && e.target && typeof musicPlaylist.contains === "function" && musicPlaylist.contains(e.target)) {
        return;
      }
      e.preventDefault();
      if (activeBranch) {
        applyWheelDelta(e.deltaX || 0, e.deltaY || 0, e.deltaMode || 0);
      }
    },
    { passive: false }
  );

  if (btnBack) {
    btnBack.addEventListener("click", (e) => {
      e.stopPropagation();
      stepBackOneLevel();
    });
  }

  if (btnLang) {
    btnLang.addEventListener("click", (e) => {
      e.stopPropagation();
      resetPanOffset();
      lang = lang === "en" ? "ar" : "en";
      document.documentElement.lang = lang;
      document.documentElement.setAttribute("lang", lang);
      const d = getLocale();
      if (d.pageTitle) document.title = d.pageTitle;
      syncMusicUI();
      syncCameraToActiveState(false);
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (playlistOpen) {
        setPlaylistOpen(false);
        return;
      }
      stepBackOneLevel();
    }
  });

  // =========================================================================
  // BOTTOM-RIGHT MUSIC CAPSULE (3D4BB439 EXACT CONTROLS + HIDDEN YOUTUBE ENGINE)
  // =========================================================================
  let isPlaying = false;
  let playlistOpen = false;
  let trackIdx = 0;

  const htmlAudioEl = typeof Audio === "function" ? new Audio() : null;
  if (htmlAudioEl) {
    htmlAudioEl.preload = "auto";
    htmlAudioEl.volume = 0.88;
  }
  let htmlAudioPlaying = false;
  let activePlayToken = 0;
  let hasUserManuallyChangedTrack = false;

  let ytPlayer = null;
  let ytReady = false;
  let ytApiRequested = false;
  let ytActivelyPlaying = false;
  let loadedYtVideoId = null;
  let pendingYtVideoId = null;
  let pendingYtStartSeconds = 0;
  let ytLocalBlockedError = false;
  const fetchedNoembedIds = new Set();
  const triedFallbackYoutubeIdsByUid = new Map();

  function formatDisplayTrackTitle(rawTitle) {
    if (!rawTitle) return "—";
    return String(rawTitle).replace(/\s+—\s+/g, " · ");
  }

  function isLikelyYouTubeUrl(str) {
    if (!str || typeof str !== "string") return false;
    return /(?:^|(?:https?:)?\/\/|(?:www\.|m\.|music\.)?)(?:youtube(?:-nocookie)?\.com|youtu\.be)\b/i.test(
      str.trim()
    );
  }

  function extractYouTubeId(input) {
    if (!input) return null;
    let candidate = "";
    if (typeof input === "string") {
      candidate = input;
    } else if (typeof input === "object") {
      candidate = String(
        input.youtubeId ||
          input.youtube ||
          input.youtubeUrl ||
          input.url ||
          input.link ||
          input.src ||
          input.file ||
          ""
      );
    } else {
      return null;
    }

    const raw = candidate.trim().replace(/^[<"'`]+|[>"'`]+$/g, "").trim();
    if (!raw) return null;

    if (/\.(mp3|m4a|wav|ogg|aac|flac|opus|webm)(\?.*)?$/i.test(raw) && !isLikelyYouTubeUrl(raw)) {
      return null;
    }

    if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;

    const patterns = [
      /(?:(?:www\.|m\.|music\.)?youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/|attribution_link\?(?:[^#]*&)?u=.*v%3D))([A-Za-z0-9_-]{11})/i,
      /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/i,
      /[?&]v=([A-Za-z0-9_-]{11})(?:[&#]|$)/i
    ];
    for (let i = 0; i < patterns.length; i++) {
      const m = raw.match(patterns[i]);
      if (m && m[1]) return m[1];
    }
    return null;
  }

  function extractYouTubeStartSeconds(url) {
    if (!url) return 0;
    let candidate = "";
    if (typeof url === "string") {
      candidate = url;
    } else if (typeof url === "object") {
      if (Number.isFinite(Number(url.startSeconds)) && Number(url.startSeconds) > 0) {
        return Math.floor(Number(url.startSeconds));
      }
      candidate = String(
        url.youtube ||
          url.youtubeUrl ||
          url.url ||
          url.link ||
          url.src ||
          url.file ||
          ""
      );
    } else {
      return 0;
    }
    const raw = candidate.trim();
    if (!raw) return 0;
    const m = raw.match(/[?&](?:t|start)=(\d+)s?(?:[&#]|$)/i) || raw.match(/[?&](?:t|start)=(\d+)s?/i);
    if (m && m[1]) {
      const parsed = parseInt(m[1], 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
    return 0;
  }

  function normalizeFallbackYoutubeIds(rawFallbacks, primaryYtId) {
    if (!Array.isArray(rawFallbacks)) return [];
    const out = [];
    rawFallbacks.forEach((entry) => {
      const id = extractYouTubeId(entry) || String(entry || "").trim();
      if (id && id !== primaryYtId && out.indexOf(id) === -1) {
        out.push(id);
      }
    });
    return out;
  }

  function fetchYouTubeTitleIfNeeded(ytId, uid) {
    if (!ytId || !uid || fetchedNoembedIds.has(uid)) return;
    if (typeof fetch !== "function") return;
    fetchedNoembedIds.add(uid);
    const endpoint =
      "https://noembed.com/embed?url=" +
      encodeURIComponent("https://www.youtube.com/watch?v=" + ytId);
    try {
      Promise.resolve(fetch(endpoint))
        .then((res) => (res && res.ok && typeof res.json === "function" ? res.json() : null))
        .then((data) => {
          if (data && typeof data.title === "string" && data.title.trim()) {
            updateTrackMetaByUid(uid, { title: formatDisplayTrackTitle(data.title.trim()) });
            syncMusicUI();
          }
        })
        .catch(() => {});
    } catch (_) {}
  }

  function getInitialLocalePlaylist(locObj) {
    if (!locObj) return [];
    const srcArr = Array.isArray(locObj.playlist) && locObj.playlist.length > 0
      ? locObj.playlist
      : (Array.isArray(locObj.tracks) ? locObj.tracks : []);
    return srcArr.map((tr, i) => {
      const ytId = (tr && tr.youtubeId) || extractYouTubeId(tr) || null;
      const startSec = extractYouTubeStartSeconds(tr);
      const fallbackIds = normalizeFallbackYoutubeIds(tr && tr.fallbackYoutubeIds, ytId);
      return {
        ...tr,
        title: formatDisplayTrackTitle(tr && tr.title ? tr.title : ""),
        uid: "default-" + i,
        youtubeId: ytId,
        activeYoutubeId: (tr && tr.activeYoutubeId) || null,
        startSeconds: startSec,
        fallbackYoutubeIds: fallbackIds
      };
    });
  }

  const defaultEnTracks = getInitialLocalePlaylist(window.SITE_DATA && window.SITE_DATA.en);
  const defaultArTracks = getInitialLocalePlaylist(window.SITE_DATA && window.SITE_DATA.ar);
  let customConfigTracks = [];
  const discoveredDropInMap = new Map();
  const activeProbeElements = new Set();

  const DROP_IN_PROBE_FILES = [
    "1.mp3", "2.mp3", "3.mp3", "4.mp3", "5.mp3",
    "6.mp3", "7.mp3", "8.mp3", "9.mp3", "10.mp3",
    "track-1.mp3", "track-2.mp3", "track-3.mp3", "track-4.mp3", "track-5.mp3",
    "track-6.mp3", "track-7.mp3", "track-8.mp3", "track-9.mp3", "track-10.mp3"
  ];

  function getPlaylist(localeObj) {
    const d = localeObj || getLocale();
    if (!d) return [];
    if (Array.isArray(d.playlist)) return d.playlist;
    if (Array.isArray(d.tracks)) return d.tracks;
    return [];
  }

  function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return "";
    const total = Math.max(1, Math.round(seconds));
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hrs > 0) {
      return (
        hrs +
        ":" +
        (mins < 10 ? "0" : "") +
        mins +
        ":" +
        (secs < 10 ? "0" : "") +
        secs
      );
    }
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
  }
  const formatAudioDuration = formatDuration;

  function getCurrentTrack() {
    const list = getPlaylist();
    if (!list.length) return null;
    return list[trackIdx % list.length] || null;
  }

  function getActiveTrackYoutubeId(tr) {
    if (!tr) return null;
    return tr.activeYoutubeId || tr.youtubeId || null;
  }

  function getTrackStartSeconds(tr) {
    if (!tr) return 0;
    if (Number.isFinite(Number(tr.startSeconds)) && Number(tr.startSeconds) > 0) {
      return Math.floor(Number(tr.startSeconds));
    }
    return extractYouTubeStartSeconds(tr);
  }

  function getTrackExternalUrl(tr) {
    if (!tr) return "";
    if (tr.youtube && typeof tr.youtube === "string" && tr.youtube.trim()) {
      return tr.youtube.trim();
    }
    const vid = getActiveTrackYoutubeId(tr);
    if (vid) {
      const startSec = getTrackStartSeconds(tr);
      return "https://www.youtube.com/watch?v=" + vid + (startSec > 0 ? "&t=" + startSec + "s" : "");
    }
    if (tr.resolvedSrc || tr.src) {
      return String(tr.resolvedSrc || tr.src);
    }
    return "";
  }

  function cueYtVideoOnPlayer(player, videoId, startSeconds) {
    if (!player || !videoId || typeof player.cueVideoById !== "function") return;
    const sec = Number.isFinite(Number(startSeconds)) && Number(startSeconds) > 0
      ? Math.floor(Number(startSeconds))
      : 0;
    if (sec > 0) {
      player.cueVideoById({ videoId, startSeconds: sec });
    } else {
      player.cueVideoById(videoId);
    }
  }

  function loadYtVideoOnPlayer(player, videoId, startSeconds) {
    if (!player || !videoId || typeof player.loadVideoById !== "function") return;
    const sec = Number.isFinite(Number(startSeconds)) && Number(startSeconds) > 0
      ? Math.floor(Number(startSeconds))
      : 0;
    if (sec > 0) {
      player.loadVideoById({ videoId, startSeconds: sec });
    } else {
      player.loadVideoById(videoId);
    }
  }

  function pickNextUnusedFallbackYoutubeId(tr, failedId) {
    if (!tr || !Array.isArray(tr.fallbackYoutubeIds) || tr.fallbackYoutubeIds.length === 0) {
      return null;
    }
    const key = tr.uid || ("idx-" + (trackIdx % Math.max(1, getPlaylist().length)));
    let tried = triedFallbackYoutubeIdsByUid.get(key);
    if (!tried) {
      tried = new Set();
      triedFallbackYoutubeIdsByUid.set(key, tried);
    }
    if (tr.youtubeId) tried.add(tr.youtubeId);
    if (tr.activeYoutubeId) tried.add(tr.activeYoutubeId);
    if (failedId) tried.add(failedId);
    for (let i = 0; i < tr.fallbackYoutubeIds.length; i++) {
      const candId = String(tr.fallbackYoutubeIds[i] || "").trim();
      if (candId && !tried.has(candId)) {
        tried.add(candId);
        return candId;
      }
    }
    return null;
  }

  function getTrackCandidates(tr) {
    if (!tr) return [];
    const out = [];
    const pushUnique = (p) => {
      if (!p || typeof p !== "string") return;
      const clean = p.trim();
      if (clean && out.indexOf(clean) === -1) out.push(clean);
    };
    if (tr.resolvedSrc) pushUnique(tr.resolvedSrc);
    if (Array.isArray(tr.candidates)) {
      tr.candidates.forEach(pushUnique);
    }
    if (tr.src) {
      const raw = String(tr.src).trim();
      if (/^(data:|https?:)/i.test(raw)) {
        pushUnique(raw);
      } else {
        const cleanRel = raw.replace(/^\.\//, "");
        const base = cleanRel.split("/").pop();
        if (base) {
          pushUnique("music/" + base);
          pushUnique("tree/music/" + base);
        }
        pushUnique(cleanRel);
      }
    }
    return out;
  }

  function updateTrackMetaByUid(uid, patch) {
    if (!uid) return;
    [
      window.SITE_DATA && window.SITE_DATA.en && window.SITE_DATA.en.playlist,
      window.SITE_DATA && window.SITE_DATA.en && window.SITE_DATA.en.tracks,
      window.SITE_DATA && window.SITE_DATA.ar && window.SITE_DATA.ar.playlist,
      window.SITE_DATA && window.SITE_DATA.ar && window.SITE_DATA.ar.tracks,
      customConfigTracks
    ].forEach((list) => {
      if (!Array.isArray(list)) return;
      list.forEach((item) => {
        if (item && item.uid === uid) {
          Object.assign(item, patch);
        }
      });
    });
  }

  function cloneTrackEntry(t) {
    return {
      ...t,
      title: formatDisplayTrackTitle(t && t.title ? t.title : ""),
      candidates: Array.isArray(t.candidates) ? t.candidates.slice() : getTrackCandidates(t),
      fallbackYoutubeIds: Array.isArray(t.fallbackYoutubeIds) ? t.fallbackYoutubeIds.slice() : []
    };
  }

  function rebuildActivePlaylists(promoteFirstToZero) {
    const curBefore = getCurrentTrack();
    const prevUid = curBefore ? curBefore.uid : null;

    const promotedDefaultIndices = new Set();
    const discEn = [];
    const discAr = [];

    const sortedDiscovered = Array.from(discoveredDropInMap.values()).sort((a, b) => a.order - b.order);
    sortedDiscovered.forEach((entry) => {
      const lower = entry.fname.toLowerCase();
      let matchedDefaultIdx = -1;
      for (let i = 0; i < defaultEnTracks.length; i++) {
        const defSrc = String(defaultEnTracks[i].src || "").toLowerCase();
        if (defSrc.endsWith("/" + lower) || defSrc === lower) {
          matchedDefaultIdx = i;
          break;
        }
      }

      if (matchedDefaultIdx >= 0 && defaultEnTracks[matchedDefaultIdx]) {
        if (promotedDefaultIndices.has(matchedDefaultIdx)) return;
        promotedDefaultIndices.add(matchedDefaultIdx);
        const enBase = defaultEnTracks[matchedDefaultIdx];
        const arBase = defaultArTracks[matchedDefaultIdx] || enBase;
        const sharedPatch = {
          src: entry.resolvedSrc,
          resolvedSrc: entry.resolvedSrc,
          candidates: entry.candidates.slice(),
          duration: entry.duration || enBase.duration || "",
          isLocalVerified: true
        };
        discEn.push({ ...cloneTrackEntry(enBase), ...sharedPatch });
        discAr.push({ ...cloneTrackEntry(arBase), ...sharedPatch });
      } else {
        const customItem = {
          uid: "disc-" + lower,
          title: entry.title,
          duration: entry.duration || "",
          src: entry.resolvedSrc,
          resolvedSrc: entry.resolvedSrc,
          candidates: entry.candidates.slice(),
          fallbackYoutubeIds: [],
          startSeconds: 0,
          isLocalDiscovered: true
        };
        discEn.push(cloneTrackEntry(customItem));
        discAr.push(cloneTrackEntry(customItem));
      }
    });

    const nextEn = [];
    const nextAr = [];

    if (customConfigTracks.length > 0) {
      customConfigTracks.forEach((t) => {
        nextEn.push(cloneTrackEntry(t));
        nextAr.push(cloneTrackEntry(t));
      });
    } else {
      for (let i = 0; i < discEn.length; i++) {
        nextEn.push(discEn[i]);
        nextAr.push(discAr[i]);
      }
      for (let i = 0; i < defaultEnTracks.length; i++) {
        if (promotedDefaultIndices.has(i)) continue;
        const enDef = cloneTrackEntry(defaultEnTracks[i]);
        const arDef = cloneTrackEntry(defaultArTracks[i] || defaultEnTracks[i]);
        nextEn.push(enDef);
        nextAr.push(arDef);
      }
    }

    if (window.SITE_DATA && window.SITE_DATA.en) {
      window.SITE_DATA.en.playlist = nextEn;
      window.SITE_DATA.en.tracks = nextEn;
    }
    if (window.SITE_DATA && window.SITE_DATA.ar) {
      window.SITE_DATA.ar.playlist = nextAr;
      window.SITE_DATA.ar.tracks = nextAr;
    }

    if (nextEn.length === 0) {
      trackIdx = 0;
      if (isPlaying) {
        isPlaying = false;
        stopHtmlAudio();
        pauseYoutubePlayer();
      }
    } else if (promoteFirstToZero && !isPlaying && !hasUserManuallyChangedTrack) {
      trackIdx = 0;
    } else if (prevUid) {
      const keptIdx = nextEn.findIndex((t) => t.uid === prevUid);
      if (keptIdx >= 0) {
        trackIdx = keptIdx;
      } else {
        trackIdx = trackIdx % nextEn.length;
      }
    } else {
      trackIdx = trackIdx % nextEn.length;
    }

    syncMusicUI();
    prewarmYoutubeIfNeeded();
  }

  function probeCandidatePaths(candidates, onFound) {
    if (typeof document === "undefined" || !Array.isArray(candidates) || !candidates.length) return;
    let idx = 0;

    function tryNext() {
      if (idx >= candidates.length) return;
      const candidatePath = candidates[idx++];
      if (!candidatePath) {
        tryNext();
        return;
      }
      let probeEl;
      try {
        probeEl = document.createElement("audio");
      } catch (_) {
        return;
      }
      probeEl.preload = "metadata";
      probeEl.muted = true;
      activeProbeElements.add(probeEl);

      let done = false;
      let timerId = null;

      const cleanup = () => {
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
        }
        probeEl.onloadedmetadata = null;
        probeEl.onerror = null;
        try {
          probeEl.removeAttribute("src");
          probeEl.load();
        } catch (_) {}
        activeProbeElements.delete(probeEl);
      };

      probeEl.onloadedmetadata = () => {
        if (done) return;
        done = true;
        const durStr = formatDuration(probeEl.duration);
        cleanup();
        onFound(candidatePath, durStr);
      };

      probeEl.onerror = () => {
        if (done) return;
        done = true;
        cleanup();
        tryNext();
      };

      timerId = setTimeout(() => {
        if (done) return;
        done = true;
        cleanup();
        tryNext();
      }, 5000);

      try {
        probeEl.src = candidatePath;
      } catch (_) {
        if (!done) {
          done = true;
          cleanup();
          tryNext();
        }
      }
    }

    tryNext();
  }

  function discoverLocalMusicFiles() {
    const customBasenames = new Set();

    if (Array.isArray(window.CUSTOM_MUSIC_PLAYLIST) && window.CUSTOM_MUSIC_PLAYLIST.length > 0) {
      customConfigTracks = [];
      window.CUSTOM_MUSIC_PLAYLIST.forEach((rawItem, idx) => {
        if (!rawItem) return;

        let rawFile = "";
        let ytId = null;
        let explicitYoutubeUrl = "";

        if (typeof rawItem === "string") {
          const trimmed = rawItem.trim();
          const asYt = extractYouTubeId(trimmed);
          if (asYt && (isLikelyYouTubeUrl(trimmed) || !/\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(trimmed))) {
            ytId = asYt;
            explicitYoutubeUrl = trimmed;
          } else {
            rawFile = trimmed.replace(/^\.\//, "");
          }
        } else if (typeof rawItem === "object") {
          explicitYoutubeUrl = String(
            rawItem.youtube ||
              rawItem.youtubeUrl ||
              rawItem.url ||
              rawItem.link ||
              ""
          ).trim();
          const explicitYtIdField = String(rawItem.youtubeId || "").trim();
          const candidateFileField = String(rawItem.file || rawItem.src || "").trim();

          if (explicitYtIdField) {
            ytId = extractYouTubeId(explicitYtIdField) || explicitYtIdField;
          } else if (explicitYoutubeUrl) {
            ytId = extractYouTubeId(explicitYoutubeUrl);
          }

          if (candidateFileField) {
            const fileAsYt = extractYouTubeId(candidateFileField);
            if (
              fileAsYt &&
              (isLikelyYouTubeUrl(candidateFileField) ||
                (!explicitYoutubeUrl && !explicitYtIdField && /^[A-Za-z0-9_-]{11}$/.test(candidateFileField)))
            ) {
              if (!ytId) ytId = fileAsYt;
              if (!explicitYoutubeUrl) explicitYoutubeUrl = candidateFileField;
            } else {
              rawFile = candidateFileField.replace(/^\.\//, "");
            }
          }

          if (!ytId && !rawFile) {
            ytId = extractYouTubeId(rawItem);
          }
        }

        if (!rawFile && !ytId) return;

        const baseName = rawFile ? (rawFile.split("/").pop() || rawFile) : "";
        if (baseName) {
          customBasenames.add(baseName.toLowerCase());
        }

        const explicitTitle = (typeof rawItem === "object" && rawItem.title)
          ? String(rawItem.title).trim()
          : "";
        const fallbackTitle = baseName
          ? baseName.replace(/\.[^/.]+$/, "")
          : "youtube track";
        const cleanTitle = formatDisplayTrackTitle(explicitTitle || fallbackTitle);

        const cands = [];
        const addCand = (p) => {
          if (p && cands.indexOf(p) === -1) cands.push(p);
        };
        if (rawFile) {
          if (/^(data:|https?:)/i.test(rawFile)) {
            addCand(rawFile);
          } else {
            addCand("music/" + rawFile);
            addCand("tree/music/" + rawFile);
            addCand(rawFile);
            if (baseName && baseName !== rawFile) {
              addCand("music/" + baseName);
              addCand("tree/music/" + baseName);
            }
          }
        }

        const startSec =
          typeof rawItem === "object"
            ? extractYouTubeStartSeconds(rawItem)
            : extractYouTubeStartSeconds(explicitYoutubeUrl);
        const fallbackYoutubeIds =
          typeof rawItem === "object"
            ? normalizeFallbackYoutubeIds(rawItem.fallbackYoutubeIds, ytId)
            : [];

        const uid = "custom-" + idx + "-" + (baseName ? baseName.toLowerCase() : ytId);
        const trackEntry = {
          uid,
          title: cleanTitle,
          duration: (typeof rawItem === "object" && rawItem.duration) ? String(rawItem.duration).trim() : "",
          file: rawFile || null,
          src: cands[0] || null,
          candidates: cands,
          youtube: explicitYoutubeUrl || null,
          youtubeId: ytId || null,
          activeYoutubeId: null,
          startSeconds: startSec,
          fallbackYoutubeIds,
          isCustomPlaylist: true
        };
        customConfigTracks.push(trackEntry);

        if (ytId && !explicitTitle) {
          fetchYouTubeTitleIfNeeded(ytId, uid);
        }

        if (cands.length > 0) {
          probeCandidatePaths(cands, (resolvedPath, durStr) => {
            const patch = { resolvedSrc: resolvedPath, src: resolvedPath };
            if (durStr && !trackEntry.duration) {
              patch.duration = durStr;
            }
            updateTrackMetaByUid(uid, patch);
            renderPlaylistItems();
          });
        }
      });

      if (customConfigTracks.length > 0) {
        trackIdx = 0;
        rebuildActivePlaylists(true);
      } else {
        rebuildActivePlaylists(false);
      }
    } else {
      rebuildActivePlaylists(false);
    }

    DROP_IN_PROBE_FILES.forEach((fname, orderIdx) => {
      if (customBasenames.has(fname.toLowerCase())) return;
      const probePaths = ["music/" + fname, "tree/music/" + fname];
      probeCandidatePaths(probePaths, (resolvedPath, durStr) => {
        if (customBasenames.has(fname.toLowerCase())) return;
        discoveredDropInMap.set(fname.toLowerCase(), {
          order: orderIdx,
          fname,
          title: fname.replace(/\.[^/.]+$/, ""),
          resolvedSrc: resolvedPath,
          candidates: [resolvedPath, "music/" + fname, "tree/music/" + fname],
          duration: durStr || ""
        });
        const shouldPromoteToZero = customConfigTracks.length === 0 && !isPlaying && !hasUserManuallyChangedTrack;
        rebuildActivePlaylists(shouldPromoteToZero);
      });
    });
  }

  function stopHtmlAudio() {
    htmlAudioPlaying = false;
    if (htmlAudioEl) {
      try {
        htmlAudioEl.onended = null;
        htmlAudioEl.onerror = null;
        htmlAudioEl.onplaying = null;
        htmlAudioEl.onloadedmetadata = null;
        htmlAudioEl.pause();
        if (typeof htmlAudioEl.removeAttribute === "function") {
          htmlAudioEl.removeAttribute("src");
          htmlAudioEl.load();
        }
      } catch (_) {}
    }
  }

  function pauseYoutubePlayer() {
    ytActivelyPlaying = false;
    pendingYtVideoId = null;
    pendingYtStartSeconds = 0;
    if (ytPlayer && ytReady && typeof ytPlayer.pauseVideo === "function") {
      try {
        ytPlayer.pauseVideo();
      } catch (_) {}
    }
  }

  function buildYtPlayerVars(autoplayFlag, startSeconds) {
    const vars = {
      autoplay: autoplayFlag ? 1 : 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      rel: 0
    };
    if (Number.isFinite(Number(startSeconds)) && Number(startSeconds) > 0) {
      vars.start = Math.floor(Number(startSeconds));
    }
    if (
      typeof window !== "undefined" &&
      window.location &&
      (window.location.protocol === "http:" || window.location.protocol === "https:") &&
      window.location.origin &&
      window.location.origin !== "null"
    ) {
      vars.origin = window.location.origin;
    }
    return vars;
  }

  function ensureYoutubePlayerBootstrapped(initialVideoId, shouldAutoplay, initialStartSeconds) {
    if (!initialVideoId) return;
    if (!pendingYtVideoId) {
      pendingYtVideoId = initialVideoId;
      pendingYtStartSeconds = Number(initialStartSeconds) > 0 ? Math.floor(Number(initialStartSeconds)) : 0;
    }

    function instantiateYtPlayer() {
      if (ytPlayer || !window.YT || typeof window.YT.Player !== "function") return;
      const mountEl = document.getElementById("yt-music-mount");
      if (!mountEl) {
        if (shouldAutoplay) {
          isPlaying = false;
          syncMusicUI();
        }
        return;
      }
      const startVid = pendingYtVideoId || initialVideoId;
      const startSec = pendingYtStartSeconds || (Number(initialStartSeconds) > 0 ? Math.floor(Number(initialStartSeconds)) : 0);
      loadedYtVideoId = startVid;
      const wantPlay = Boolean(isPlaying && !htmlAudioPlaying);

      try {
        ytPlayer = new window.YT.Player("yt-music-mount", {
          width: "240",
          height: "240",
          videoId: startVid,
          playerVars: buildYtPlayerVars(wantPlay, startSec),
          events: {
            onReady(ev) {
              ytReady = true;
              const cur = getCurrentTrack();
              const desiredVid = getActiveTrackYoutubeId(cur) || pendingYtVideoId || startVid;
              const desiredStart = cur ? getTrackStartSeconds(cur) : startSec;
              if (isPlaying && !htmlAudioPlaying && desiredVid) {
                try {
                  if (typeof ev.target.unMute === "function") ev.target.unMute();
                  if (typeof ev.target.setVolume === "function") ev.target.setVolume(100);
                  if (loadedYtVideoId !== desiredVid || desiredStart > 0) {
                    loadedYtVideoId = desiredVid;
                    loadYtVideoOnPlayer(ev.target, desiredVid, desiredStart);
                  }
                  if (typeof ev.target.playVideo === "function") {
                    ev.target.playVideo();
                  }
                } catch (_) {
                  isPlaying = false;
                  ytActivelyPlaying = false;
                  syncMusicUI();
                }
              } else if (desiredVid) {
                loadedYtVideoId = desiredVid;
                try {
                  if (typeof ev.target.cueVideoById === "function") {
                    cueYtVideoOnPlayer(ev.target, desiredVid, desiredStart);
                  } else if (typeof ev.target.pauseVideo === "function") {
                    ev.target.pauseVideo();
                  }
                } catch (_) {}
              }
            },
            onStateChange(ev) {
              const cur = getCurrentTrack();
              const curVid = getActiveTrackYoutubeId(cur);
              const YTState = (window.YT && window.YT.PlayerState) || { ENDED: 0, PLAYING: 1, PAUSED: 2 };
              if (ev.data === YTState.PLAYING || ev.data === 1) {
                ytLocalBlockedError = false;
                if (!isPlaying || htmlAudioPlaying || !cur || !curVid) {
                  ytActivelyPlaying = false;
                  try { ev.target.pauseVideo(); } catch (_) {}
                  return;
                }
                if (loadedYtVideoId && curVid !== loadedYtVideoId && typeof ev.target.loadVideoById === "function") {
                  loadedYtVideoId = curVid;
                  try { loadYtVideoOnPlayer(ev.target, curVid, getTrackStartSeconds(cur)); } catch (_) {}
                  return;
                }
                ytActivelyPlaying = true;
                if (!cur.duration && typeof ev.target.getDuration === "function") {
                  const rawDur = ev.target.getDuration();
                  const durStr = formatDuration(rawDur);
                  if (durStr) {
                    cur.duration = durStr;
                    if (cur.uid) updateTrackMetaByUid(cur.uid, { duration: durStr });
                    renderPlaylistItems();
                  }
                }
                syncMusicUI();
              } else if (ev.data === YTState.ENDED || ev.data === 0) {
                if (!isPlaying || htmlAudioPlaying || !cur || !curVid) return;
                const totalTracks = getPlaylist().length;
                if (totalTracks <= 1) {
                  try {
                    const loopStart = getTrackStartSeconds(cur);
                    if (typeof ev.target.seekTo === "function") ev.target.seekTo(loopStart, true);
                    ev.target.playVideo();
                  } catch (_) {}
                } else {
                  nextTrack();
                }
              } else if (ev.data === YTState.PAUSED || ev.data === 2 || ev.data === -1) {
                ytActivelyPlaying = false;
              }
            },
            onError(ev) {
              ytActivelyPlaying = false;
              const code = ev && typeof ev.data === "number" ? ev.data : 0;
              const cur = getCurrentTrack();
              const targetPlayer = (ev && ev.target) || ytPlayer;

              if (
                cur &&
                (code === 100 || code === 101 || code === 150) &&
                Array.isArray(cur.fallbackYoutubeIds) &&
                cur.fallbackYoutubeIds.length > 0
              ) {
                const fallbackId = pickNextUnusedFallbackYoutubeId(cur, loadedYtVideoId);
                if (fallbackId && targetPlayer) {
                  const startSec = getTrackStartSeconds(cur);
                  cur.activeYoutubeId = fallbackId;
                  if (cur.uid) {
                    updateTrackMetaByUid(cur.uid, { activeYoutubeId: fallbackId });
                  }
                  loadedYtVideoId = fallbackId;
                  pendingYtVideoId = fallbackId;
                  pendingYtStartSeconds = startSec;
                  ytLocalBlockedError = false;
                  try {
                    if (isPlaying && !htmlAudioPlaying && typeof targetPlayer.loadVideoById === "function") {
                      targetPlayer.loadVideoById({
                        videoId: fallbackId,
                        startSeconds: startSec || 0
                      });
                      return;
                    }
                    if (!isPlaying && typeof targetPlayer.cueVideoById === "function") {
                      cueYtVideoOnPlayer(targetPlayer, fallbackId, startSec);
                      return;
                    }
                  } catch (_) {}
                }
              }

              const isFileProto =
                typeof window !== "undefined" &&
                window.location &&
                window.location.protocol === "file:";
              if (isFileProto && (code === 101 || code === 150 || code === 153 || code === 2 || code === 0)) {
                ytLocalBlockedError = true;
                if (isPlaying) {
                  setPlaylistOpen(true);
                  const dLoc = getLocale();
                  showToast(
                    dLoc.ytLocalHint ||
                      (lang === "ar"
                        ? "لتشغيل يوتيوب محلياً افتح الموقع عبر تشغيل-الموقع أو بعد رفعه على الإنترنت"
                        : "open via local server or web host for youtube playback")
                  );
                }
              }
              if (!isPlaying || htmlAudioPlaying || !cur || !getActiveTrackYoutubeId(cur)) {
                syncMusicUI();
                return;
              }
              isPlaying = false;
              syncMusicUI();
            }
          }
        });
      } catch (_) {
        if (shouldAutoplay) {
          isPlaying = false;
          ytActivelyPlaying = false;
          syncMusicUI();
        }
      }
    }

    if (window.YT && typeof window.YT.Player === "function") {
      instantiateYtPlayer();
      return;
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prevReady === "function" && prevReady !== window.onYouTubeIframeAPIReady) {
        try { prevReady(); } catch (_) {}
      }
      instantiateYtPlayer();
    };

    if (!ytApiRequested && typeof document !== "undefined") {
      ytApiRequested = true;
      try {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        tag.onerror = function () {
          ytActivelyPlaying = false;
          if (isPlaying && !htmlAudioPlaying) {
            isPlaying = false;
            syncMusicUI();
          }
        };
        const firstScript = document.getElementsByTagName("script")[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(tag, firstScript);
        } else if (document.head) {
          document.head.appendChild(tag);
        }
      } catch (_) {
        if (shouldAutoplay) {
          isPlaying = false;
          syncMusicUI();
        }
      }
    }
  }

  function prewarmYoutubeIfNeeded() {
    const list = getPlaylist();
    if (!Array.isArray(list) || !list.length) return;
    const firstYt = list.find((t) => t && getActiveTrackYoutubeId(t));
    const targetVid = getActiveTrackYoutubeId(firstYt);
    if (!firstYt || !targetVid) return;
    const targetStart = getTrackStartSeconds(firstYt);
    if (!ytPlayer) {
      ensureYoutubePlayerBootstrapped(targetVid, false, targetStart);
    } else if (ytReady && !isPlaying && loadedYtVideoId !== targetVid && typeof ytPlayer.cueVideoById === "function") {
      loadedYtVideoId = targetVid;
      try { cueYtVideoOnPlayer(ytPlayer, targetVid, targetStart); } catch (_) {}
    }
  }

  function createOrPlayYoutube(videoId, startSeconds) {
    if (!videoId) return;
    const startSec = Number.isFinite(Number(startSeconds)) && Number(startSeconds) > 0
      ? Math.floor(Number(startSeconds))
      : 0;
    pendingYtVideoId = videoId;
    pendingYtStartSeconds = startSec;
    ytLocalBlockedError = false;

    if (ytPlayer && ytReady && typeof ytPlayer.playVideo === "function") {
      try {
        if (typeof ytPlayer.unMute === "function") ytPlayer.unMute();
        if (typeof ytPlayer.setVolume === "function") ytPlayer.setVolume(100);
        const currentLoadedId =
          typeof ytPlayer.getVideoData === "function" && ytPlayer.getVideoData()
            ? ytPlayer.getVideoData().video_id
            : loadedYtVideoId;
        const playerState =
          typeof ytPlayer.getPlayerState === "function" ? ytPlayer.getPlayerState() : -1;
        if (currentLoadedId !== videoId && typeof ytPlayer.loadVideoById === "function") {
          loadedYtVideoId = videoId;
          loadYtVideoOnPlayer(ytPlayer, videoId, startSec);
        } else {
          loadedYtVideoId = videoId;
          if (playerState === 0 && typeof ytPlayer.seekTo === "function") {
            ytPlayer.seekTo(startSec, true);
          } else if (
            startSec > 0 &&
            (playerState === 5 || playerState === -1) &&
            typeof ytPlayer.loadVideoById === "function"
          ) {
            loadYtVideoOnPlayer(ytPlayer, videoId, startSec);
          }
        }
        ytPlayer.playVideo();
      } catch (_) {
        isPlaying = false;
        ytActivelyPlaying = false;
        syncMusicUI();
      }
      return;
    }

    ensureYoutubePlayerBootstrapped(videoId, true, startSec);
  }

  function nextTrack() {
    const list = getPlaylist();
    if (!list.length) {
      stopAudioPlayback();
      return;
    }
    trackIdx = (trackIdx + 1) % list.length;
    if (isPlaying) {
      startAudioPlayback();
    } else {
      activePlayToken++;
      stopHtmlAudio();
      pauseYoutubePlayer();
      syncMusicUI();
    }
  }

  function startAudioPlayback() {
    const list = getPlaylist();
    if (!list.length) {
      isPlaying = false;
      stopHtmlAudio();
      pauseYoutubePlayer();
      syncMusicUI();
      return;
    }

    const token = ++activePlayToken;
    stopHtmlAudio();
    pauseYoutubePlayer();

    const tr = getCurrentTrack();
    if (!tr) {
      isPlaying = false;
      syncMusicUI();
      return;
    }

    const candidates = htmlAudioEl ? getTrackCandidates(tr) : [];
    const ytId = getActiveTrackYoutubeId(tr);
    const startSec = getTrackStartSeconds(tr);

    if ((!htmlAudioEl || candidates.length === 0) && !ytId) {
      isPlaying = false;
      syncMusicUI();
      return;
    }

    isPlaying = true;
    syncMusicUI();

    if (!htmlAudioEl || candidates.length === 0) {
      createOrPlayYoutube(ytId, startSec);
      return;
    }

    const tryCandidateAt = (candIdx) => {
      if (token !== activePlayToken || !isPlaying) return;
      if (candIdx >= candidates.length) {
        stopHtmlAudio();
        const cur = getCurrentTrack();
        const fallbackYt = getActiveTrackYoutubeId(cur);
        if (cur && fallbackYt && (!tr.uid || cur.uid === tr.uid)) {
          createOrPlayYoutube(fallbackYt, getTrackStartSeconds(cur));
          return;
        }
        isPlaying = false;
        syncMusicUI();
        return;
      }

      const candidatePath = candidates[candIdx];
      let settled = false;

      const onCandidateFailed = () => {
        if (settled || token !== activePlayToken || !isPlaying) return;
        settled = true;
        tryCandidateAt(candIdx + 1);
      };

      try {
        htmlAudioEl.onerror = onCandidateFailed;
        htmlAudioEl.onloadedmetadata = () => {
          if (token !== activePlayToken) return;
          const dur = formatDuration(htmlAudioEl.duration);
          if (dur && tr.duration !== dur) {
            tr.duration = dur;
            if (tr.uid) updateTrackMetaByUid(tr.uid, { duration: dur, resolvedSrc: candidatePath });
            renderPlaylistItems();
          }
        };
        htmlAudioEl.onplaying = () => {
          if (token !== activePlayToken || !isPlaying) return;
          htmlAudioPlaying = true;
          tr.resolvedSrc = candidatePath;
          if (tr.uid) updateTrackMetaByUid(tr.uid, { resolvedSrc: candidatePath });
          pauseYoutubePlayer();
        };
        htmlAudioEl.onended = () => {
          if (token !== activePlayToken || !isPlaying) return;
          nextTrack();
        };

        htmlAudioEl.src = candidatePath;
        const playRes = htmlAudioEl.play();
        if (playRes && typeof playRes.then === "function") {
          playRes
            .then(() => {
              if (settled || token !== activePlayToken || !isPlaying) return;
              htmlAudioPlaying = true;
              tr.resolvedSrc = candidatePath;
              if (tr.uid) updateTrackMetaByUid(tr.uid, { resolvedSrc: candidatePath });
              pauseYoutubePlayer();
            })
            .catch((err) => {
              if (token !== activePlayToken || !isPlaying) return;
              if (err && err.name === "AbortError") return;
              onCandidateFailed();
            });
        }
      } catch (_) {
        onCandidateFailed();
      }
    };

    tryCandidateAt(0);
  }

  function stopAudioPlayback() {
    activePlayToken++;
    isPlaying = false;
    stopHtmlAudio();
    pauseYoutubePlayer();
    syncMusicUI();
  }

  function togglePlay() {
    if (!getPlaylist().length) return;
    if (isPlaying) {
      stopAudioPlayback();
    } else {
      startAudioPlayback();
    }
  }

  function setPlaylistOpen(nextOpen) {
    playlistOpen = Boolean(nextOpen);
    if (musicPlaylist) musicPlaylist.hidden = !playlistOpen;
    if (musicNoteWrap) musicNoteWrap.hidden = playlistOpen;
    if (btnExpandPlaylist) {
      btnExpandPlaylist.classList.toggle("is-open", playlistOpen);
      btnExpandPlaylist.setAttribute("aria-expanded", playlistOpen ? "true" : "false");
    }
  }

  function renderPlaylistItems() {
    if (!playlistList) return;
    const d = getLocale();
    const list = getPlaylist(d);
    const count = list.length;
    if (playlistLabel) {
      playlistLabel.textContent = lang === "ar"
        ? `قائمة الموسيقى · ${count} ${count === 1 ? "مقطوعة" : "مقطوعات"}`
        : `music playlist · ${count} ${count === 1 ? "track" : "tracks"}`;
    }
    if (playlistMode) {
      playlistMode.textContent = d.sequentialLabel || "sequential";
    }

    if (playlistYtHintEl) {
      if (ytLocalBlockedError) {
        playlistYtHintEl.hidden = false;
        playlistYtHintEl.textContent =
          d.ytLocalHint ||
          (lang === "ar"
            ? "لتشغيل يوتيوب محلياً افتح الموقع عبر تشغيل-الموقع أو بعد رفعه على الإنترنت"
            : "open via local server or web host for youtube playback");
      } else {
        playlistYtHintEl.hidden = true;
        playlistYtHintEl.textContent = "";
      }
    }

    playlistList.innerHTML = "";

    if (count === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "playlist-empty";
      emptyLi.textContent = d.emptyDrawerHint || (
        lang === "ar" ? "لا توجد مقطوعات حالياً" : "no tracks yet"
      );
      playlistList.appendChild(emptyLi);
      return;
    }

    list.forEach((tr, idx) => {
      const li = document.createElement("li");
      const active = idx === trackIdx % count;

      const row = document.createElement("div");
      row.className = "playlist-item-row" + (active ? " is-active" : "");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "playlist-item-btn" + (active ? " is-active" : "");
      btn.setAttribute("aria-current", active ? "true" : "false");

      const marker = document.createElement("span");
      marker.className = "playlist-marker";
      marker.textContent = active ? "▸" : "";

      const nameSpan = document.createElement("span");
      nameSpan.className = "playlist-track-name";
      nameSpan.textContent = formatDisplayTrackTitle(tr.title || "");

      btn.appendChild(marker);
      btn.appendChild(nameSpan);

      if (tr.duration) {
        const durSpan = document.createElement("span");
        durSpan.className = "playlist-track-dur";
        durSpan.textContent = tr.duration;
        btn.appendChild(durSpan);
      }

      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        hasUserManuallyChangedTrack = true;
        trackIdx = idx;
        startAudioPlayback();
      });

      row.appendChild(btn);
      li.appendChild(row);
      playlistList.appendChild(li);
    });
  }

  function renderPlayButtonIcon(playing) {
    if (!btnPlay) return;
    if (playing) {
      btnPlay.innerHTML =
        '<svg class="play-svg" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect x="2.5" y="2.2" width="3.2" height="9.6" rx="0.7" fill="#0D1016"/>' +
        '<rect x="8.3" y="2.2" width="3.2" height="9.6" rx="0.7" fill="#0D1016"/>' +
        "</svg>";
    } else {
      btnPlay.innerHTML =
        '<svg class="play-svg" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M2.6 1.9L12.1 7L2.6 12.1V1.9Z" fill="#0D1016" stroke="#0D1016" stroke-width="0.8" stroke-linejoin="round"/>' +
        "</svg>";
    }
  }

  function syncMusicUI() {
    syncCanvasFontVars();
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("lang", lang);
    const d = getLocale();
    const list = getPlaylist(d);
    const count = list.length;

    if (musicNoteText) {
      musicNoteText.innerHTML = d.musicNote;
    }
    if (btnLang) {
      btnLang.textContent = d.langBtn;
      btnLang.classList.toggle("is-ar-label", hasArabicChars(d.langBtn));
    }

    if (trackTitleBtn) {
      if (count > 0) {
        const safeIdx = trackIdx % count;
        const tr = list[safeIdx];
        trackTitleBtn.textContent = tr && tr.title ? formatDisplayTrackTitle(tr.title) : "—";
      } else {
        trackTitleBtn.textContent = d.emptyCapsuleLabel || "—";
      }
    }

    renderPlayButtonIcon(count > 0 && isPlaying);

    if (btnExpandPlaylist) {
      btnExpandPlaylist.classList.toggle("is-open", playlistOpen);
      btnExpandPlaylist.setAttribute("aria-expanded", playlistOpen ? "true" : "false");
    }
    if (musicPill) {
      musicPill.classList.toggle("is-playing", count > 0 && isPlaying);
      musicPill.classList.toggle("is-empty", count === 0);
    }

    renderPlaylistItems();
  }

  if (btnPlay) {
    btnPlay.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePlay();
    });
  }

  // Clickable .music-whisper (both text AND curved arrow) toggles music playback immediately!
  if (musicNoteWrap) {
    musicNoteWrap.addEventListener("click", (e) => {
      e.stopPropagation();
      togglePlay();
    });
    musicNoteWrap.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
      }
    });
  }

  function togglePlaylistHandler(e) {
    e.stopPropagation();
    setPlaylistOpen(!playlistOpen);
  }

  if (btnExpandPlaylist) {
    btnExpandPlaylist.addEventListener("click", togglePlaylistHandler);
  }
  if (trackTitleBtn) {
    trackTitleBtn.addEventListener("click", togglePlaylistHandler);
  }

  // Diagonal external-link ↗ button opens current track's YouTube URL in a new tab
  if (btnExternalYt) {
    btnExternalYt.addEventListener("click", (e) => {
      e.stopPropagation();
      const tr = getCurrentTrack();
      const url = getTrackExternalUrl(tr);
      if (url && typeof window.open === "function") {
        window.open(url, "_blank", "noopener");
      }
    });
  }

  if (btnNextTrack) {
    btnNextTrack.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!getPlaylist().length) return;
      hasUserManuallyChangedTrack = true;
      nextTrack();
    });
  }

  function syncVintageFrameMiterSeams() {
    if (typeof document === "undefined") return;
    const fw = vw < 680 ? 9 : 14;
    const setLine = (id, x1, y1, x2, y2) => {
      const el = document.getElementById(id);
      if (el && typeof el.setAttribute === "function") {
        el.setAttribute("x1", String(x1));
        el.setAttribute("y1", String(y1));
        el.setAttribute("x2", String(x2));
        el.setAttribute("y2", String(y2));
      }
    };
    setLine("miter-seam-tl", 0, 0, fw, fw);
    setLine("miter-seam-tr", vw, 0, vw - fw, fw);
    setLine("miter-seam-bl", 0, vh, fw, vh - fw);
    setLine("miter-seam-br", vw, vh, vw - fw, vh - fw);
  }

  function handleResize() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(vw * dpr);
    canvas.height = Math.floor(vh * dpr);
    syncVintageFrameMiterSeams();
    syncCameraToActiveState(false);
  }

  window.addEventListener("resize", handleResize);

  // =========================================================================
  // DIAGNOSTIC HANDLE FOR AUTOMATED NODE PIXEL / DOM / CANVAS VERIFICATION
  // =========================================================================
  window.__TREE_ENGINE__ = {
    getState() {
      const groundScreenY = worldToScreen(0, 0).y;
      return {
        lang,
        activeBranch,
        closingBranch,
        activeItem,
        activeExpYear,
        closingExpYear,
        expYearShootGrow,
        crownRustleImpulse,
        expandedItems: Array.from(expandedItems),
        closingItems: Array.from(closingItems),
        introElapsed,
        introTreeProgress,
        treeGrow,
        rootsGrow,
        introGrow,
        introCamRem,
        identityType,
        isPortraitHovered,
        portraitHoverMix,
        portraitBounds: portraitBounds ? { ...portraitBounds } : null,
        hasPortraitMonoBuffer: Boolean(mePortraitBuffer),
        hasPortraitColorBuffer: Boolean(mePortraitColorBuffer),
        skyGlowColor: SKY_LIFT,
        skyColor: SKY_CORE,
        skyEdgeColor: SKY_EDGE,
        chalkColor: CHALK,
        chalkTreeColor: CHALK_TREE,
        chalkBrightColor: CHALK_BRIGHT,
        chalkMutedColor: CHALK_MUTED,
        shadowInkColor: SHADOW_INK,
        pillBgColor: PILL_BG,
        fontEn: FONT_EN,
        fontAr: FONT_AR,
        activeCanvasFont: fontFamilyFor(""),
        earthColor: EARTH_CORE,
        earthDeepColor: EARTH_DEEP,
        treeSize: { w: TREE_W, h: TREE_H },
        rootsSize: { w: ROOTS_W, h: ROOTS_H },
        hasTreeGrowAt: Boolean(treeGrowAt),
        hasTreeAnimBuffer: Boolean(treeAnimBuffer),
        lastAnimBucket,
        mainTwigGrow: { ...mainTwigGrow },
        mainLabelType: { ...mainLabelType },
        underlineProg: { ...underlineProg },
        branchRaw: { ...branchRaw },
        branchGrow: { ...branchGrow },
        branchLimbGrow: { ...branchLimbGrow },
        subTwigGrow: { ...subTwigGrow },
        itemType: { ...itemType },
        itemErasing: { ...itemErasing },
        itemGrow: { ...itemGrow },
        lvl2ShootGrow: { ...lvl2ShootGrow },
        lvl2Type: { ...lvl2Type },
        lvl2Erasing: { ...lvl2Erasing },
        meBioType,
        meBioErasing,
        cam: { ...cam },
        baseCam: { ...baseCam },
        targetCam: { ...targetCam },
        groundScreenY,
        groundScreenRatio: groundScreenY / Math.max(1, vh),
        backHidden: btnBack ? btnBack.hidden : true,
        playlistOpen,
        isPlaying,
        trackIdx,
        currentTrack: getPlaylist().length > 0 ? trackIdx % getPlaylist().length : 0,
        currentTrackTitle: getCurrentTrack() ? getCurrentTrack().title : "",
        currentTrackYoutubeId: getCurrentTrack() ? (getCurrentTrack().youtubeId || null) : null,
        currentTrackActiveYoutubeId: getCurrentTrack() ? getActiveTrackYoutubeId(getCurrentTrack()) : null,
        currentTrackStartSeconds: getCurrentTrack() ? getTrackStartSeconds(getCurrentTrack()) : 0,
        currentTrackExternalUrl: getTrackExternalUrl(getCurrentTrack()),
        currentTrackFallbackYoutubeIds: getCurrentTrack() && Array.isArray(getCurrentTrack().fallbackYoutubeIds) ? getCurrentTrack().fallbackYoutubeIds.slice() : [],
        playlistIds: getPlaylist().map((t) => t.youtubeId),
        playlistTitles: getPlaylist().map((t) => t.title),
        playlistCount: getPlaylist().length,
        tracksCount: getPlaylist().length,
        worldHitboxes: worldHitboxes.slice(),
        starsCount: stars.length,
        sparklingStarsCount: stars.filter((s) => s.glint).length,
        pinpointStarsCount: stars.filter((s) => !s.glint).length,
        heroStarsCount: stars.filter((s) => s.hero).length,
        starMouse: { ...starMouse },
        starMouseTarget: { ...starMouseTarget },
        starCursorScreen: { ...starCursorScreen },
        lastRenderedStars: lastRenderedStars.slice(),
        panOffset: { ...panOffset },
        treeGrainStats: treeGrainStats ? { ...treeGrainStats } : null,
        hasGrainTile: Boolean(grainTileCanvas),
        hasPillStippleTile: Boolean(pillStippleDataUri),
        filmGrainAppliedToDom,
        frameStrokeTextCalls,
        frameFillTextCalls,
        totalStrokeTextCalls,
        totalFillTextCalls,
        undergroundBouldersCount: undergroundBoulders.length,
        undergroundDotTrailsCount: undergroundDotTrails.length,
        lastUnderlineLogs: lastUnderlineLogs.slice(),
        lastStarGlintLogs: lastStarGlintLogs.slice(),
        lastBranchLabelScreenBoxes: lastBranchLabelScreenBoxes.slice(),
        lastHeaderScreenBox: lastHeaderScreenBox ? { ...lastHeaderScreenBox } : null,
        expBoughRaw,
        expBoughGrow,
        expLeafPuffCount: expLeafPuffBuffers.length,
        meProjectsHeadingType,
        meProjectFilter,
        lastBioScreenBox: lastBioScreenBox ? { ...lastBioScreenBox } : null,
        lastPortraitScreenBox: lastPortraitScreenBox ? { ...lastPortraitScreenBox } : null,
        lastExpYearScreenBoxes: lastExpYearScreenBoxes.slice(),
        lastExpLeafPuffCircles: lastExpLeafPuffCircles.slice(),
        lastExpTextLineBoxes: lastExpTextLineBoxes.slice(),
        lastMeProjectsScreenBoxes: lastMeProjectsScreenBoxes.slice(),
        lastBioHighlightLogs: lastBioHighlightLogs.slice(),
        hasChalkPatterns: Boolean(chalkPatternPrimary && chalkPatternActive && chalkPatternMuted),
        chalkPatternTileStats: {
          primaryPores: chalkPatternTiles.primary ? chalkPatternTiles.primary.poreCount : 0,
          primaryGrains: chalkPatternTiles.primary ? chalkPatternTiles.primary.grainCount : 0,
          activePores: chalkPatternTiles.active ? chalkPatternTiles.active.poreCount : 0,
          mutedPores: chalkPatternTiles.muted ? chalkPatternTiles.muted.poreCount : 0
        },
        frameChalkPatternCalls,
        totalChalkPatternCalls,
        projectHalftoneCardIds: Object.keys(projectPhotoCards),
        projectPhotoHover: { ...projectPhotoHover },
        projectPhotoLoadState: Object.fromEntries(
          Object.entries(projectPhotoLoadState).map(([k, st]) => [
            k,
            {
              urls: st.urls ? st.urls.slice() : [],
              attemptIdx: st.attemptIdx,
              useCors: st.useCors,
              crossOrigin: st.crossOrigin,
              status: st.status,
              loadedUrl: st.loadedUrl
            }
          ])
        ),
        projectHalftoneStats: Object.fromEntries(
          Object.entries(projectPhotoCards).map(([k, v]) => [
            k,
            {
              bufW: v.bufW,
              bufH: v.bufH,
              hasHalftoneCanvas: Boolean(v.halftoneCanvas),
              hasColorCanvas: Boolean(v.colorCanvas),
              halftoneSize: v.halftoneCanvas ? `${v.halftoneCanvas.width}x${v.halftoneCanvas.height}` : null,
              colorSize: v.colorCanvas ? `${v.colorCanvas.width}x${v.colorCanvas.height}` : null,
              pitch: v.pitch,
              dotCount: v.dotCount,
              colorSampleRgb: v.colorSampleRgb,
              tapeCount: v.tapeCount,
              tiltRad: v.tiltRad,
              isRealPhoto: Boolean(v.isRealPhoto),
              loadedUrl: v.loadedUrl || null,
              rebuildCount: v.rebuildCount || 1,
              photoUrls: v.photoUrls ? v.photoUrls.slice() : []
            }
          ])
        ),
        lastMeFilterScreenBoxes: lastMeFilterScreenBoxes.slice(),
        lastMeProjectSubBoxes: lastMeProjectSubBoxes.slice(),
        lastMeProjectPhotoBoxes: lastMeProjectPhotoBoxes.slice(),
        lastMeProjectActionBoxes: lastMeProjectActionBoxes.slice(),
        lastTriggeredAction: lastTriggeredAction ? { ...lastTriggeredAction } : null
      };
    },
    fastForward(seconds) {
      if (firstFrameMs === null) {
        firstFrameMs = lastFrameMs;
      }
      const steps = Math.max(1, Math.ceil(seconds / 0.025));
      const stepMs = (seconds * 1000) / steps;
      for (let i = 0; i < steps; i++) {
        stepFrame(lastFrameMs + stepMs);
      }
    },
    togglePlay,
    hitTestPortrait,
    setPointerMove(sx, sy) {
      updateStarPointerFromScreen(sx, sy);
      lastPointerScreen.x = sx;
      lastPointerScreen.y = sy;
      lastPointerScreen.active = true;
      portraitTouchToggled = false;
      isPortraitHovered = hitTestPortrait(sx, sy);
      hoveredHit = hitTestWorld(sx, sy);
      canvas.classList.toggle("is-pointer", Boolean(hoveredHit || isPortraitHovered));
    },
    openBranch(key) {
      resetPanOffset();
      transitionToBranch(key);
    },
    openItem(branchKey, itemId) {
      resetPanOffset();
      const targetKey = branchKey === "projects" ? "me" : branchKey;
      if (activeBranch !== targetKey) {
        transitionToBranch(targetKey);
      }
      expandedItems.clear();
      if (itemId) {
        expandedItems.add(itemId);
        closingItems.delete(itemId);
      }
      activeItem = itemId;
      if (targetKey === "experience") {
        activeExpYear = itemId;
        closingExpYear = null;
      }
      syncCameraToActiveState(false);
    },
    collapseSubItemSmoothly,
    buildProjectHalftoneCard,
    loadRealProjectPhotos,
    upgradeProjectCardFromLoadedImage,
    getProjectPhotoCard(id) {
      return projectPhotoCards[id] || null;
    },
    getProjectPhotoLoadState(id) {
      return projectPhotoLoadState[id] || null;
    },
    getProjectHalftoneCard(id) {
      return projectPhotoCards[id] || null;
    },
    stepBack: stepBackOneLevel,
    setPlaylistOpen,
    extractYouTubeId,
    extractYouTubeStartSeconds,
    formatDuration,
    formatAudioDuration,
    discoverLocalMusicFiles,
    prewarmYoutubeIfNeeded,
    buildYtPlayerVars,
    initTreeBuffer,
    applyLithographGrain,
    initViewportGrain,
    drawWavyUnderline,
    buildBiDiVisualRuns,
    measureBiDiPhraseSpan,
    setProjectFilter(fKey) {
      meProjectFilter = fKey || "all";
    },
    sliceTypewriter,
    computeDiscreteCharCount,
    computeCanopySway,
    computeHomeCamera,
    computeHomeWorldBounds,
    computeBranchLayout,
    computeExperienceBoughLayout,
    computeMeEditorialLayout,
    computeActiveContentBounds,
    computeClampedCameraLimits,
    layoutActionRows,
    worldToScreen,
    screenToWorld,
    hitTestWorld,
    handleWorldClick,
    applyPanDeltaScreen,
    applyWheelDelta,
    resetPanOffset,
    getTrackExternalUrl,
    getTreeGrowAtSample(x, y) {
      if (!treeGrowAt || !treeBuffer) return null;
      const ix = clamp(Math.floor(x), 0, treeBuffer.width - 1);
      const iy = clamp(Math.floor(y), 0, treeBuffer.height - 1);
      return treeGrowAt[iy * treeBuffer.width + ix];
    },
    setLang(nextLang) {
      resetPanOffset();
      lang = nextLang === "ar" ? "ar" : "en";
      document.documentElement.lang = lang;
      document.documentElement.setAttribute("lang", lang);
      const d = getLocale();
      if (d.pageTitle) document.title = d.pageTitle;
      syncMusicUI();
      syncCameraToActiveState(true);
    },
    resizeViewport(nextW, nextH) {
      window.innerWidth = nextW;
      window.innerHeight = nextH;
      handleResize();
      syncCameraToActiveState(true);
    },
    stepFrame,
    cancelLoop() {
      if (rafId) cancelAnimationFrame(rafId);
    }
  };

  // Boot
  syncCanvasFontVars();
  initChalkTextPatterns();
  handleResize();
  initViewportGrain();
  buildBotanicalBuffers();
  initMePortraitBuffer();
  initProjectHalftoneCards();
  loadRealProjectPhotos();
  buildWorldProps();
  discoverLocalMusicFiles();
  syncMusicUI();
  syncCameraToActiveState(true);
  if (typeof document !== "undefined" && document.fonts && document.fonts.ready && typeof document.fonts.ready.then === "function") {
    Promise.resolve(document.fonts.ready).then(() => {
      syncCanvasFontVars();
      syncCameraToActiveState(false);
    }).catch(() => {});
  }
  rafId = requestAnimationFrame(renderFrame);
})();
