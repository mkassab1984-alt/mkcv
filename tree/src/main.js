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
  // WORLD-SPACE CONSTANTS & MATTE LITHOGRAPH CHALK PALETTE (ZERO PURE WHITE)
  // =========================================================================
  const SKY_CORE = "#001f3f";
  const SKY_LIFT = "#002244";
  const SKY_EDGE = "#001f3f";
  const EARTH_CORE = "#00152b";

  // Warm matte silver-chalk inks (never harsh pure white)
  const CHALK = "#C6CAD2";
  const CHALK_TREE = "#C4C8D2";
  const CHALK_BRIGHT = "#DCE0E8";
  const CHALK_MUTED = "#9AA2B2";
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
  const UNDERGROUND_DEPTH = 700;
  const TWIG_SHOOT_LEN = 58;

  const BRANCH_KEYS = ["work", "projects", "writing", "me"];
  const ITEM_COL_WIDTH = 288;
  const DETAIL_COL_WIDTH = 316;

  let lang = "en";
  let activeBranch = null;
  let activeItem = null;

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

  const mainTwigGrow = { work: 0, projects: 0, writing: 0, me: 0 };
  const mainLabelType = { work: 0, projects: 0, writing: 0, me: 0 };
  const mainLabelErasing = { work: false, projects: false, writing: false, me: false };
  const underlineProg = { work: 0, projects: 0, writing: 0, me: 0 };
  const branchLimbGrow = { work: 0, projects: 0, writing: 0, me: 0 };

  const subTwigGrow = {};
  const itemType = {};
  const itemErasing = {};
  const siblingSumFactor = {};
  const lvl2ShootGrow = {};
  const lvl2Type = {};
  const lvl2Erasing = {};
  const hoverAmt = {};

  // Viewport & Choreographed Spring Camera
  let vw = window.innerWidth;
  let vh = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  const cam = { x: 0, y: -300, zoom: 1 };
  const baseCam = { x: 0, y: -300, zoom: 1 };
  const targetCam = { x: 0, y: -300, zoom: 1 };
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
  let frameStrokeTextCalls = 0;
  let frameFillTextCalls = 0;
  let totalStrokeTextCalls = 0;
  let totalFillTextCalls = 0;

  let rootsBuffer = null;
  let tuftBuffer = null;
  let mistyCloudBuffer = null;
  let mossBuffer = null;
  let terraceBuffer = null;

  let stars = [];
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

  function computeCanopySway(wy, timeSec) {
    if (wy >= -220) return 0;
    const rise = smoothstep(220, 540, -wy);
    const phaseY = (-wy - 220) / 340;
    return Math.sin(timeSec * 0.82 + phaseY * 3.6) * rise * 2.2;
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
  // UNIVERSAL MATTE CHALK CANVAS TEXT RENDERER (strokeText + fillText)
  // Preserves 100% connected Arabic cursive shaping by passing whole line slices!
  // =========================================================================
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
    ctx.lineWidth = Math.max(2.6, fs * 0.21);
    ctx.strokeStyle = "rgba(0, 15, 32, 0.92)";
    ctx.shadowColor = "rgba(0, 9, 20, 0.85)";
    ctx.shadowBlur = 2.2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1.4;
    ctx.strokeText(str, x, y);

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = fillColor || CHALK;
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
      startX,
      endX,
      width: fullWidth,
      prog: p,
      rtl: rtlDir
    });

    ctx.save();
    ctx.strokeStyle = color || CHALK_BRIGHT;
    ctx.lineWidth = lineWidth || 1.15;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(0, 9, 20, 0.78)";
    ctx.shadowBlur = 1.6;
    ctx.shadowOffsetY = 1.1;
    ctx.beginPath();
    const step = 3.5;
    let dx = 0;
    let first = true;
    while (dx <= span) {
      const wx = rtlDir ? xRight - dx : xLeft + dx;
      const wy =
        y +
        Math.sin(dx * 0.21 + seed) * 0.65 +
        Math.cos(dx * 0.47 + seed * 1.63) * 0.32;
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
    const isPhone = vw < 640;
    const isPortraitOrCompact = vw < 960 || vh >= vw;

    if (isPortraitOrCompact) {
      const sidePad = vw < 430 ? 15 : 22;
      const topClearance = isPhone ? 86 : 74;
      const botClearance = isPhone ? 102 : 76;
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

    const sideMargin = 24;
    const treeScreenX = clamp(vw * 0.46, vw * 0.38, vw * 0.52);
    const availLeft = Math.max(160, treeScreenX - sideMargin);
    const availRight = Math.max(160, vw - treeScreenX - sideMargin);
    const horizZoom = Math.min(
      availLeft / Math.max(240, Math.abs(hb.minWX)),
      availRight / Math.max(240, hb.maxWX)
    );
    const groundScreenY = vh - 12;
    const topClearance = 38;
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
    const padX = isPhone ? 16 : isTablet ? 34 : 68;
    const padTop = isPhone ? 52 : 46;
    const padBot = typeof padBotOverride === "number" ? padBotOverride : (isPhone ? 68 : 72);
    const boxW = Math.max(200, maxX - minX);
    const boxH = Math.max(170, maxY - minY);

    const zx = (vw - padX * 2) / boxW;
    const zy = (vh - padTop - padBot) / boxH;
    const z = clamp(Math.min(zx, zy), 0.38, 1.38);

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
    const actionRowH = 21;
    const isMeBranch = branchCfg.id === "me";
    const vGap = isMeBranch ? 13 : 18;
    const maxStackBottomY = isMeBranch ? -36 : -86;

    const measuredItems = branchCfg.items.map((it) => {
      const titleLines = wrapLines(it.title, itemColWidth, canvasFont("600 13.6px", it.title));
      const sumLines = wrapLines(it.summary, itemColWidth, canvasFont("400 12.3px", it.summary));
      const actionRows = layoutActionRows(it.actions, itemColWidth);
      const metaH = it.meta ? 13.5 : 0;
      const textBodyH = metaH + titleLines.length * 17.4 + 2.5 + sumLines.length * 15.8;
      const actionsH = actionRows.length > 0 ? 6 + actionRows.length * actionRowH + 4 : 0;
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

      let detailH = 22;
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
    for (const mi of measuredItems) totalH += mi.blockH;
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

      cursorY += mi.blockH + vGap;
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
    const showBack = Boolean(activeBranch || activeItem);
    if (btnBack) {
      btnBack.hidden = !showBack;
    }
  }

  function computeMeEditorialLayout(bCfg, lay) {
    const isStackMobile = vw < 680;
    const isCompactTablet = vw >= 680 && vw < 960;

    syncCanvasFontVars();
    resetCanvasLetterSpacing();
    ctx.font = canvasFont("600 15px", `${bCfg.label}.`);
    const labelW = ctx.measureText(`${bCfg.label}.`).width;
    const openCenterX = lay.tipX + lay.dir * (lay.boughSpan * 0.46);
    const openLabelLeft = openCenterX - labelW * 0.5;
    const openLabelRight = openCenterX + labelW * 0.5;

    const bioColW = isStackMobile ? 302 : isCompactTablet ? 336 : 368;
    const baseBioLeft = isStackMobile ? 276 : 294;
    const bioLeft = Math.max(baseBioLeft, Math.ceil(openLabelRight + (isStackMobile ? 16 : 22)));
    const bioRight = bioLeft + bioColW;
    const bioTopY = isStackMobile ? -532 : -436;
    const lineH = isStackMobile ? 20.4 : 21.5;
    const paraGap = isStackMobile ? 11.0 : 13.5;

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
    const bioBottomY = bioTopY + totalBioH;
    const pw = isStackMobile ? 168 : isCompactTablet ? 204 : 228;
    const aspect = mePortraitBuffer
      ? mePortraitBuffer.height / mePortraitBuffer.width
      : 600 / 476;
    const ph = pw * aspect;
    const px = isStackMobile ? bioLeft + (bioColW - pw) * 0.5 : bioRight + (isCompactTablet ? 34 : 46);
    const py = isStackMobile ? bioBottomY + 8 : bioTopY + Math.max(-12, (visibleBioH - ph) * 0.42);

    const rotPadX = ph * 0.032 + 6;
    const rotPadY = pw * 0.032 + 6;

    const minContentX = Math.min(lay.tipX - 8, openLabelLeft - 8, bioLeft - 10);
    const maxContentX = Math.max(openLabelRight + 8, bioRight + 10, px + pw + rotPadX);
    const minContentY = Math.min(bioTopY - 18, py - rotPadY, lay.tipY - 72);
    const maxContentY = Math.max(bioBottomY + 10, py + ph + rotPadY);

    return {
      isStackMobile,
      bioColW,
      bioLeft,
      bioRight,
      bioTopY,
      bioBottomY,
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
      minContentX,
      maxContentX,
      minContentY,
      maxContentY
    };
  }

  function syncCameraToActiveState(instant) {
    const d = getLocale();
    syncBackButton();

    if (!activeBranch) {
      const h = computeHomeCamera();
      targetCam.x = h.x;
      targetCam.y = h.y;
      targetCam.zoom = h.zoom;
      if (instant) {
        baseCam.x = targetCam.x;
        baseCam.y = targetCam.y;
        baseCam.zoom = targetCam.zoom;
        cam.x = baseCam.x;
        cam.y = baseCam.y;
        cam.zoom = baseCam.zoom * (1 + 0.05 * introCamRem);
      }
      return;
    }

    hasOpenedAnyBranch = true;
    const bCfg = d.branches[activeBranch];
    if (!bCfg) return;
    const lay = computeBranchLayout(bCfg);
    const isMobile = vw < 680;
    const isCompactTablet = vw >= 680 && vw < 960;

    if (activeBranch === "me") {
      const meLay = computeMeEditorialLayout(bCfg, lay);
      if (isMobile) {
        fitWorldBox(
          meLay.minContentX - 6,
          meLay.maxContentX + 6,
          meLay.minContentY,
          meLay.maxContentY,
          68
        );
      } else {
        const groundTargetRatio = isCompactTablet ? 0.78 : 0.77;
        const groundScreenY = vh * groundTargetRatio;
        const topPad = 54;
        const botPad = 56;
        const sidePad = isCompactTablet ? 24 : 44;

        const minX = isCompactTablet ? Math.min(145, meLay.minContentX) : 75;
        const maxX = Math.max(900, meLay.maxContentX + 10);
        const reqAbove = Math.max(468, Math.abs(meLay.minContentY) + 12);
        const reqBelow = Math.max(155, meLay.maxContentY + 24);

        const zX = (vw - sidePad * 2) / Math.max(280, maxX - minX);
        const zAbove = (groundScreenY - topPad) / reqAbove;
        const zBelow = (vh - botPad - groundScreenY) / reqBelow;
        const z = clamp(Math.min(zX, zAbove, zBelow), 0.38, 1.22);

        targetCam.zoom = z;
        targetCam.x = (minX + maxX) * 0.5;
        targetCam.y = -(groundScreenY - vh * 0.5) / z;
      }

      if (instant) {
        baseCam.x = targetCam.x;
        baseCam.y = targetCam.y;
        baseCam.zoom = targetCam.zoom;
        cam.x = baseCam.x;
        cam.y = baseCam.y;
        cam.zoom = baseCam.zoom;
      }
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
        if (instant) {
          baseCam.x = targetCam.x;
          baseCam.y = targetCam.y;
          baseCam.zoom = targetCam.zoom;
          cam.x = baseCam.x;
          cam.y = baseCam.y;
          cam.zoom = baseCam.zoom;
        }
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
      } else if (activeBranch === "projects") {
        canopyAnchorX = 38;
        canopyAnchorY = -275;
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

    if (instant) {
      baseCam.x = targetCam.x;
      baseCam.y = targetCam.y;
      baseCam.zoom = targetCam.zoom;
      cam.x = baseCam.x;
      cam.y = baseCam.y;
      cam.zoom = baseCam.zoom;
    }
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

    const INK_R = 0;
    const INK_G = 20;
    const INK_B = 42;

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

        // Clamp strictly below pure white (#EAEFF6 max, centered on matte #C4C8D2)
        const cR = clamp(Math.round(outR), 0, 232);
        const cG = clamp(Math.round(outG), 0, 236);
        const cB = clamp(Math.round(outB), 0, 244);
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
            pData[o] = 0;
            pData[o + 1] = 20;
            pData[o + 2] = 42;
            pData[o + 3] = 56; // 0.22 alpha
          } else if (r < 0.45) {
            pData[o] = 235;
            pData[o + 1] = 240;
            pData[o + 2] = 248;
            pData[o + 3] = 51; // 0.20 alpha
          } else if (r < 0.56) {
            pData[o] = 0;
            pData[o + 1] = 20;
            pData[o + 2] = 42;
            pData[o + 3] = 24;
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

      sg.strokeStyle = "#001830";
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
      { wx: -177, wy: 3.4, w: 33, h: 15.0, c: "#C4C8D2", seed: 102 },
      { wx: -144, wy: 3.2, w: 32, h: 14.2, c: "#BEC3CE", seed: 103 },
      { wx: -113, wy: 3.4, w: 29, h: 13.0, c: "#C4C8D2", seed: 105 },
      { wx: -87, wy: 3.6, w: 22, h: 9.5, c: "#B8BCC6", seed: 106 },
      { wx: -188, wy: -9.8, w: 24, h: 10.2, c: "#C6CAD2", seed: 108 },
      { wx: -158, wy: -10.2, w: 27, h: 11.4, c: "#C0C5CF", seed: 104 },
      { wx: -128, wy: -8.8, w: 23, h: 9.6, c: "#C6CAD2", seed: 109 },

      { wx: 89, wy: 3.6, w: 23, h: 9.8, c: "#B8BCC6", seed: 202 },
      { wx: 116, wy: 3.4, w: 30, h: 13.6, c: "#C4C8D2", seed: 203 },
      { wx: 148, wy: 3.2, w: 33, h: 14.8, c: "#BEC3CE", seed: 204 },
      { wx: 181, wy: 3.4, w: 32, h: 14.0, c: "#C4C8D2", seed: 206 },
      { wx: 210, wy: 3.2, w: 26, h: 11.5, c: "#B8BCC6", seed: 207 },
      { wx: 132, wy: -9.4, w: 25, h: 10.6, c: "#C6CAD2", seed: 205 },
      { wx: 164, wy: -10.0, w: 27, h: 11.2, c: "#C0C5CF", seed: 208 },
      { wx: 194, wy: -8.6, w: 22, h: 9.4, c: "#C6CAD2", seed: 209 }
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
      { wx: 256, wy: 148, w: 96, h: 62, crack: -0.29, rot: -0.07, seed: 704 },
      { wx: 428, wy: 112, w: 74, h: 48, crack: 0.22, rot: 0.09, seed: 705 },
      { wx: 598, wy: 158, w: 88, h: 56, crack: -0.25, rot: -0.04, seed: 706 },
      { wx: 774, wy: 124, w: 72, h: 46, crack: 0.27, rot: 0.05, seed: 707 }
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
  }

  function drawPortraitMaskingTapes(g, ox, oy, PW, overColorPrint) {
    const tapePrng = mulberry32(31632761);
    function drawMaskingTape(cx, cy, tw, th, rotRad) {
      g.save();
      g.translate(cx, cy);
      g.rotate(rotRad);
      g.fillStyle = overColorPrint
        ? "rgba(198, 202, 210, 0.34)"
        : "rgba(196, 200, 210, 0.26)";
      g.beginPath();
      const segs = 16;
      for (let i = 0; i <= segs; i++) {
        const yy = -th * 0.5 + (i / segs) * th;
        const tear = Math.sin(i * 1.7) * 2.4;
        if (i === 0) g.moveTo(-tw * 0.5 + tear, yy);
        else g.lineTo(-tw * 0.5 + tear, yy);
      }
      for (let i = segs; i >= 0; i--) {
        const yy = -th * 0.5 + (i / segs) * th;
        const tear = Math.cos(i * 1.9) * 2.4;
        g.lineTo(tw * 0.5 + tear, yy);
      }
      g.closePath();
      g.fill();

      if (overColorPrint) {
        g.strokeStyle = "rgba(220, 224, 232, 0.24)";
        g.lineWidth = 0.8;
        g.stroke();
      }

      const dots = Math.floor((tw * th) / 5.2);
      for (let d = 0; d < dots; d++) {
        const dx = (tapePrng() - 0.5) * (tw - 4);
        const dy = (tapePrng() - 0.5) * (th - 3);
        const a = 0.22 + tapePrng() * 0.42;
        g.fillStyle = `rgba(220, 224, 232, ${a.toFixed(2)})`;
        g.fillRect(dx, dy, 1.35, 1.35);
      }
      g.restore();
    }

    drawMaskingTape(ox + PW * 0.48, oy - 2, 118, 28, -0.045);
    drawMaskingTape(ox + PW - 18, oy + 14, 78, 22, 0.68);
  }

  function initMePortraitBuffer() {
    if (typeof Image === "undefined" || !window.PORTRAIT_SRC_URI) return;
    const PW = 440;
    const PH = 544;
    const PAD_T = 38;
    const PAD_S = 18;
    const BUF_W = PW + PAD_S * 2;
    const BUF_H = PH + PAD_T + 18;
    const ox = PAD_S;
    const oy = PAD_T;

    const img = new Image();
    img.onload = function () {
      const sw = 220;
      const sh = 272;
      const samp = document.createElement("canvas");
      samp.width = sw;
      samp.height = sh;
      const sctx = samp.getContext("2d");
      sctx.drawImage(img, 0, 0, sw, sh);
      let imgData;
      try {
        imgData = sctx.getImageData(0, 0, sw, sh).data;
      } catch (_) {
        return;
      }

      const out = document.createElement("canvas");
      out.width = BUF_W;
      out.height = BUF_H;
      const g = out.getContext("2d");
      g.fillStyle = "rgba(0, 24, 48, 0.22)";
      g.fillRect(ox + 2, oy + 2, PW - 4, PH - 4);

      const pitch = 4.65;
      const ang = Math.PI * 0.25;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const diag = Math.ceil(Math.hypot(PW, PH) / pitch) + 3;
      const prng = mulberry32(31631984);

      for (let gi = -diag; gi <= diag; gi++) {
        for (let gj = -diag; gj <= diag; gj++) {
          const u = gi * pitch;
          const v = gj * pitch;
          const px = PW * 0.5 + u * ca - v * sa;
          const py = PH * 0.5 + u * sa + v * ca;
          const jit = (prng() - 0.5) * 3.2;
          if (px < 2.5 + jit || px >= PW - 2.5 - jit || py < 2.5 + jit || py >= PH - 2.5 - jit) {
            continue;
          }
          const sx = clamp(Math.floor((px / PW) * sw), 0, sw - 1);
          const sy = clamp(Math.floor((py / PH) * sh), 0, sh - 1);
          const lum = imgData[(sy * sw + sx) * 4] / 255;
          if (lum < 0.065) continue;
          const rad = pitch * 0.56 * Math.sqrt(lum);
          if (rad < 0.34) continue;
          const alpha = clamp(0.76 + 0.20 * lum, 0.72, 0.96);
          g.fillStyle = `rgba(198, 202, 210, ${alpha.toFixed(3)})`;
          g.beginPath();
          g.arc(ox + px, oy + py, rad, 0, Math.PI * 2);
          g.fill();
        }
      }

      drawPortraitMaskingTapes(g, ox, oy, PW, false);
      mePortraitBuffer = out;
    };
    img.src = window.PORTRAIT_SRC_URI;

    const colorSrc = window.PORTRAIT_COLOR_URI || window.PORTRAIT_SRC_URI;
    const colorImg = new Image();
    colorImg.onload = function () {
      const cOut = document.createElement("canvas");
      cOut.width = BUF_W;
      cOut.height = BUF_H;
      const cg = cOut.getContext("2d");

      const inset = 2.5;
      const innerX = ox + inset;
      const innerY = oy + inset;
      const innerW = PW - inset * 2;
      const innerH = PH - inset * 2;

      cg.save();
      cg.shadowColor = "rgba(0, 16, 33, 0.38)";
      cg.shadowBlur = 12;
      cg.shadowOffsetY = 3;
      cg.fillStyle = "#DCE0E8";
      cg.fillRect(ox - 2, oy - 2, PW + 4, PH + 4);
      cg.restore();

      const photoCanvas = document.createElement("canvas");
      const pW = Math.round(innerW);
      const pH = Math.round(innerH);
      photoCanvas.width = pW;
      photoCanvas.height = pH;
      const pg = photoCanvas.getContext("2d");
      if ("imageSmoothingEnabled" in pg) {
        pg.imageSmoothingEnabled = true;
        pg.imageSmoothingQuality = "high";
      }
      pg.fillStyle = "#E4E8EF";
      pg.fillRect(0, 0, pW, pH);

      const natW = colorImg.naturalWidth || colorImg.width || pW;
      const natH = colorImg.naturalHeight || colorImg.height || pH;
      const srcAspect = natW / Math.max(1, natH);
      const dstAspect = pW / pH;
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
      pg.drawImage(colorImg, sx, sy, sWidth, sHeight, 0, 0, pW, pH);

      try {
        const frame = pg.getImageData(0, 0, pW, pH);
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
              px[i] = Math.round(r + (236 - r) * wMix);
              px[i + 1] = Math.round(gCh + (239 - gCh) * wMix);
              px[i + 2] = Math.round(b + (245 - b) * wMix);
            }
          }
        }
        pg.putImageData(frame, 0, 0);
      } catch (_) {}

      cg.drawImage(photoCanvas, innerX, innerY, innerW, innerH);
      cg.strokeStyle = "rgba(198, 202, 210, 0.65)";
      cg.lineWidth = 1.0;
      cg.strokeRect(innerX + 0.5, innerY + 0.5, innerW - 1, innerH - 1);
      drawPortraitMaskingTapes(cg, ox, oy, PW, true);

      mePortraitColorBuffer = cOut;
    };
    colorImg.src = colorSrc;
  }

  function buildWorldProps() {
    const rand = mulberry32(991984);

    stars = [];
    const heroStarSpecs = [
      { wx: -458, wy: -346, scale: 0.96 },
      { wx: -334, wy: -366, scale: 0.80 },
      { wx: -236, wy: -318, scale: 0.72 },
      { wx: -512, wy: -196, scale: 0.88 },
      { wx: -388, wy: -116, scale: 0.76 },
      { wx: 230, wy: -352, scale: 0.86 },
      { wx: 368, wy: -336, scale: 1.00 },
      { wx: 496, wy: -274, scale: 0.78 },
      { wx: 334, wy: -168, scale: 0.84 },
      { wx: 476, wy: -102, scale: 0.92 }
    ];

    const SPARKLE_TOTAL = 16;
    for (let i = 0; i < SPARKLE_TOTAL; i++) {
      const isHero = i < heroStarSpecs.length;
      const period = 4.6 + rand() * 3.8;
      const staggeredPhase =
        ((i / SPARKLE_TOTAL) * Math.PI * 2 + (rand() - 0.5) * 0.36 + Math.PI * 2) %
        (Math.PI * 2);
      const wx = isHero
        ? heroStarSpecs[i].wx
        : (rand() < 0.5 ? -1 : 1) * (210 + rand() * 1180);
      const wy = isHero
        ? heroStarSpecs[i].wy
        : -64 - rand() * 510;
      const sparkleScale = isHero ? heroStarSpecs[i].scale : 0.28 + rand() * 0.58;

      stars.push({
        wx,
        wy,
        r: 0.62 + sparkleScale * 0.34,
        alpha: 0.30 + rand() * 0.28,
        speed: 0.48 + rand() * 0.85,
        phase: rand() * Math.PI * 2,
        glint: true,
        hero: isHero,
        sparkleScale,
        glintPeriod: period,
        glintSpeed: (Math.PI * 2) / period,
        glintPhase: staggeredPhase
      });
    }

    for (let i = SPARKLE_TOTAL; i < 216; i++) {
      stars.push({
        wx: (rand() - 0.5) * 3800,
        wy: -34 - rand() * 1480,
        r: 0.45 + rand() * 0.65,
        alpha: 0.15 + rand() * 0.40,
        speed: 0.38 + rand() * 1.05,
        phase: rand() * Math.PI * 2,
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

    // Meandering dotted silver trails (`• • • • •`) through the #00152b underground soil (matching 9AA84C5A!)
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
    const clampedBottom = Math.min(y + h, -4);
    const safeH = clampedBottom - y;
    if (safeH <= 2) return;
    const grad = ctx.createRadialGradient(cxWorld, cyWorld, 10, cxWorld, cyWorld, radius);
    grad.addColorStop(0, "rgba(0, 31, 63, 0.86)");
    grad.addColorStop(1, "rgba(0, 31, 63, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, safeH);
  }

  // =========================================================================
  // WORLD-SPACE MENU TWIGS, GROWN BRANCHES & DISCRETE TYPEWRITER RENDERER
  // =========================================================================
  function renderMeEditorialAndPortrait(bCfg, lay, tipX, tipY, canopySway) {
    const rtl = isRTL();
    const limbRaw = branchLimbGrow.me;
    const limbProg = easeOutCubic(limbRaw);
    const bioProg = meBioType;
    if (limbRaw <= 0.005 && bioProg <= 0.005) return;

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

    if (bioProg <= 0.004 || !bCfg.bioEditorial) return;

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
    ctx.textBaseline = "top";

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
          drawChalkText(sub, textX, cy, CHALK, 14, 1.0);

          const lineSpan = wp.lineSpans && wp.lineSpans[lIdx];
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
              const visPhrase = fullLine.slice(pos, pos + visLen);
              const prefix = fullLine.slice(0, pos);
              const prefixW = ctx.measureText(prefix).width;
              const phraseW = ctx.measureText(visPhrase).width;
              const fullPhraseW = Math.max(1, ctx.measureText(segPhrase).width);

              const fullLeft = rtl ? textX - prefixW - fullPhraseW : textX + prefixW;
              const hitId = `mebio:${pIdx}:${hIdx}:${lIdx}`;
              const isHov = hoveredHit && hoveredHit.id === hitId;
              const uProg = clamp(phraseW / fullPhraseW, 0, 1);

              drawWavyUnderline(
                fullLeft,
                cy + (meLay.isStackMobile ? 16.6 : 17.5),
                fullPhraseW,
                uProg,
                pIdx * 5.3 + hIdx * 2.7 + lIdx,
                hl.action
                  ? isHov
                    ? CHALK_BRIGHT
                    : "rgba(220, 224, 232, 0.92)"
                  : "rgba(198, 202, 210, 0.85)",
                hl.action ? (isHov ? 1.85 : 1.55) : 1.45,
                rtl
              );

              if (hl.action && activeBranch === "me" && visLen === segPhrase.length) {
                worldHitboxes.push({
                  id: hitId,
                  kind: "action",
                  action: hl.action,
                  x: fullLeft - 4,
                  y: cy - 2,
                  w: fullPhraseW + 8,
                  h: 22
                });
              }
            }
          });
        }
        cy += lineH;
      });
      cy += paraGap;
    });

    ctx.restore();

    // Mamdouh's Halftone Dot-Screen Portrait + Natural-Color Hover Reveal
    const pAlpha = smoothstep(0.12, 0.82, bioProg);
    if (pAlpha > 0.01) {
      const pw = meLay.pw;
      const ph = meLay.ph;
      const px = meLay.px + canopySway * 0.25;
      const py = meLay.py;
      const pcx = px + pw * 0.5;
      const pcy = py + ph * 0.5;
      const pAngle = -0.052;

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
        const liftScale = 1 + 0.018 * smoothHoverMix;

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
      const limbRaw = branchLimbGrow[key];
      const limbProg = easeOutCubic(limbRaw);
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
      }

      let anyChildVisible = key !== "me" && limbRaw > 0.005;
      if (!anyChildVisible && key !== "me") {
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
                drawChalkText(drawnPart, textX, cy, titleCol, 13.6, 1.0);

                if (mi.bodyParas.length > 0 && ihp > 0.03 && drawnPart) {
                  const corePart = drawnPart.slice(0, Math.min(drawnPart.length, fullLine.length));
                  const lw = ctx.measureText(corePart).width;
                  const uLeft = rtl ? textX - lw : textX;
                  drawWavyUnderline(
                    uLeft,
                    cy + 15.2,
                    lw,
                    ihp,
                    idx * 4.3 + lIdx * 1.9,
                    CHALK_BRIGHT,
                    1.1,
                    rtl
                  );
                }
              }
              cy += 17.4;
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
              15.8,
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

                  const typedAct = drawDiscreteTextLine(
                    act.label,
                    localLinkP,
                    isItErasing,
                    actAnchorX,
                    cy,
                    actHov ? CHALK_BRIGHT : CHALK,
                    12,
                    1.0,
                    2.0
                  );
                  if (!typedAct) return;

                  const typedW = ctx.measureText(typedAct).width;
                  const actUProg = clamp(typedW / Math.max(1, tw), 0, 1);
                  drawWavyUnderline(
                    actLeft,
                    cy + 15.2,
                    tw,
                    actUProg,
                    aIdx * 3.1 + rIdx * 1.7 + 0.8,
                    actHov ? CHALK_BRIGHT : "rgba(198, 202, 210, 0.82)",
                    actHov ? 1.3 : 1.05,
                    rtl
                  );

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
            const itProg = easeOutCubic(s2Raw);
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
                const typedCollapse = drawDiscreteTextLine(
                  d.collapseNote,
                  colP,
                  isD2Erasing,
                  dTextX,
                  dcy,
                  closeHov ? CHALK_BRIGHT : CHALK_MUTED,
                  colSize,
                  1.0,
                  1.8
                );
                if (typedCollapse) {
                  const cw = ctx.measureText(typedCollapse).width;
                  const uLeft = rtl ? dTextX - fullCollapseW : dTextX;
                  drawWavyUnderline(
                    uLeft,
                    dcy + 14,
                    fullCollapseW,
                    clamp((cw / fullCollapseW) * (closeHov ? 1.0 : 0.72), 0, 1),
                    idx * 2.3 + 4.1,
                    closeHov ? CHALK_BRIGHT : "rgba(154, 162, 178, 0.68)",
                    1.0,
                    rtl
                  );
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
              dcy += 22;

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
      if (twigProg > 0.01) {
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
            const labelLiftY = tipY - limbProg * 17;
            const homeAnchorX = curTipX + dir * 12;
            const openCenterX = tipX + dir * (lay.boughSpan * 0.46);
            const openAnchorX = dir < 0 ? openCenterX + fullW * 0.5 : openCenterX - fullW * 0.5;
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
            drawChalkText(subLabel, drawAnchorX, labelLiftY, labelCol, 15, 1.0);

            const waveP = Math.max(uProg, hp * 0.85 * labelTypeProg);
            if (waveP > 0.02) {
              drawWavyUnderline(
                lineLeft,
                labelLiftY + 10.5,
                fullW,
                waveP,
                key.charCodeAt(0) * 0.7,
                isSelected ? CHALK_BRIGHT : "rgba(198, 202, 210, 0.82)",
                isSelected ? 1.3 : 1.05,
                rtl
              );
            }
            ctx.restore();

            if (!activeBranch || activeBranch === key) {
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
      earthGrad.addColorStop(0, "#00162d");
      earthGrad.addColorStop(0.22, EARTH_CORE);
      earthGrad.addColorStop(0.75, "#001226");
      earthGrad.addColorStop(1, "#001021");

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

      // Meandering dotted silver trails (`• • • • •`) winding through #00152b soil (matching 9AA84C5A!)
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

    const isPhone = vw < 640;
    const isTablet = vw >= 640 && vw < 900;
    const isAr = lang === "ar";
    const sidePad = isPhone ? 14 : isTablet ? 20 : 24;
    const topY = isPhone ? 14 : isTablet ? 16 : 18;
    const x = isAr ? vw - sidePad : sidePad;
    const maxHeaderWidth = isPhone
      ? Math.max(150, vw - 96)
      : isTablet
        ? Math.min(vw - 108, 420)
        : Math.min(vw - 124, 460);

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
    const langBtnMargin = isPhone ? 12 : isTablet ? 18 : 22;
    const langBtnBox = isAr
      ? { left: langBtnMargin, right: langBtnMargin + langBtnW, top: topY - 2, bottom: topY + 28 }
      : { left: vw - langBtnMargin - langBtnW, right: vw - langBtnMargin, top: topY - 2, bottom: topY + 28 };

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

    // 2. Gentle camera zoom ease (1.05 -> 1.0) during intro
    const camAlpha = 1 - Math.exp(-7.2 * dt);
    const goalX = targetCam.x + panOffset.x;
    const goalY = targetCam.y + panOffset.y;
    baseCam.x += (goalX - baseCam.x) * camAlpha;
    baseCam.y += (goalY - baseCam.y) * camAlpha;
    baseCam.zoom += (targetCam.zoom - baseCam.zoom) * camAlpha;

    if (!activeBranch && !hasOpenedAnyBranch) {
      const camGlideP = easeOutCubic(clamp(introElapsed / 1.45, 0, 1));
      introCamRem = 1 - camGlideP;
    } else {
      introCamRem *= Math.exp(-8.5 * dt);
      if (introCamRem < 0.0005) introCamRem = 0;
    }

    cam.x = baseCam.x;
    cam.y = baseCam.y;
    cam.zoom = baseCam.zoom * (1 + 0.05 * introCamRem);

    // 3. Boot identity whisper types in crisply char-by-char (0.2s - 1.0s), erases backwards (~16ms/char)
    if (!activeBranch && !hasOpenedAnyBranch && introElapsed <= 1.05) {
      identityErasing = false;
      identityType = clamp((introElapsed - 0.20) / 0.80, 0, 1);
    } else {
      const idGoal = !activeBranch && introElapsed >= 0.20 ? 1 : 0;
      identityErasing = identityType > idGoal;
      identityType = approach(identityType, idGoal, 1 / 0.80, 1 / 0.28, dt);
    }

    // 4. Portrait hover interpolation
    if (activeBranch !== "me") {
      isPortraitHovered = false;
      portraitTouchToggled = false;
    } else if (lastPointerScreen.active && !portraitTouchToggled && portraitBounds) {
      isPortraitHovered = hitTestPortrait(lastPointerScreen.x, lastPointerScreen.y);
    }
    const hoverGoal = activeBranch === "me" && isPortraitHovered ? 1 : 0;
    portraitHoverMix = approach(portraitHoverMix, hoverGoal, 1 / 0.30, 1 / 0.30, dt);

    const d = getLocale();

    let maxAnyLimb = 0;
    for (const k of BRANCH_KEYS) {
      if (branchLimbGrow[k] > maxAnyLimb) maxAnyLimb = branchLimbGrow[k];
    }

    BRANCH_KEYS.forEach((k, bIdx) => {
      const bCfg = d.branches[k];
      if (!bCfg) return;
      const isSelected = activeBranch === k;
      const isHome = activeBranch === null;

      // Exact ~32ms/char discrete branch title typing & ~16ms/char backwards erase!
      const charCount = Math.max(4, (bCfg.label || "").length);
      const labelWriteDur = charCount * 0.032;
      const labelEraseDur = Math.max(0.08, charCount * 0.016);
      const labelRateUp = 1 / labelWriteDur;
      const labelRateDown = 1 / labelEraseDur;

      if (isHome) {
        // At 1.0s, the 4 canopy shoots extend straight out (0.38s, staggered by 85ms),
        // and as each shoot reaches 85%, its label types in crisply char-by-char!
        const twigStart = 1.00 + bIdx * 0.085;
        if (!hasOpenedAnyBranch && introElapsed < 2.2) {
          mainTwigGrow[k] =
            introElapsed <= twigStart
              ? 0
              : clamp((introElapsed - twigStart) / 0.38, 0, 1);
        } else {
          const canExtend = introElapsed > twigStart && maxAnyLimb < 0.42;
          mainTwigGrow[k] = approach(mainTwigGrow[k], canExtend ? 1 : 0, 1 / 0.38, 3.6, dt);
        }

        const labelGoal = mainTwigGrow[k] >= 0.85 ? 1 : 0;
        mainLabelErasing[k] = mainLabelType[k] > labelGoal;
        mainLabelType[k] = approach(mainLabelType[k], labelGoal, labelRateUp, labelRateDown, dt);
        underlineProg[k] = approach(underlineProg[k], 0, 3.2, 4.1, dt);
      } else if (isSelected) {
        mainTwigGrow[k] = approach(mainTwigGrow[k], 1, 3.6, 3.4, dt);
        mainLabelErasing[k] = false;
        mainLabelType[k] = approach(mainLabelType[k], 1, labelRateUp, labelRateDown, dt);
        underlineProg[k] = approach(underlineProg[k], 1, 3.0, 4.1, dt);
      } else {
        mainLabelErasing[k] = mainLabelType[k] > 0;
        mainLabelType[k] = approach(mainLabelType[k], 0, labelRateUp, labelRateDown, dt);
        const twigGoal = mainLabelType[k] > 0.2 ? 1 : 0;
        mainTwigGrow[k] = approach(mainTwigGrow[k], twigGoal, 3.2, 3.8, dt);
        underlineProg[k] = approach(underlineProg[k], 0, 3.2, 4.4, dt);
      }

      let maxChildItemType = 0;
      bCfg.items.forEach((it) => {
        if ((itemType[it.id] || 0) > maxChildItemType) maxChildItemType = itemType[it.id] || 0;
      });

      if (k === "me") {
        const bioGoal = isSelected && branchLimbGrow.me > 0.34 ? 1 : 0;
        meBioErasing = meBioType > bioGoal;
        meBioType = approach(meBioType, bioGoal, 1 / 0.96, 1 / 0.26, dt);
        const meLimbGoal = isSelected || meBioType > 0.22 ? 1 : 0;
        branchLimbGrow.me = approach(branchLimbGrow.me, meLimbGoal, 2.4, 3.2, dt);
      } else {
        const limbGoal = isSelected ? 1 : maxChildItemType > 0.58 ? 1 : 0;
        branchLimbGrow[k] = approach(branchLimbGrow[k], limbGoal, 2.4, 3.2, dt);
      }

      bCfg.items.forEach((it, idx) => {
        const id = it.id;
        const curSub = subTwigGrow[id] || 0;
        const curType = itemType[id] || 0;
        const curSumF = siblingSumFactor[id] === undefined ? 1 : siblingSumFactor[id];
        const curS2 = lvl2ShootGrow[id] || 0;
        const curT2 = lvl2Type[id] || 0;

        const isItemSelected = isSelected && activeItem === id;

        if (isItemSelected) {
          lvl2ShootGrow[id] = approach(curS2, 1, 2.5, 3.3, dt);
          const t2Goal = lvl2ShootGrow[id] > 0.58 ? 1 : 0;
          lvl2Erasing[id] = curT2 > t2Goal;
          lvl2Type[id] = approach(curT2, t2Goal, 1 / 0.92, 1 / 0.25, dt);
        } else {
          lvl2Erasing[id] = curT2 > 0;
          lvl2Type[id] = approach(curT2, 0, 1 / 0.92, 1 / 0.25, dt);
          const s2Goal = lvl2Type[id] > 0.62 ? 1 : 0;
          lvl2ShootGrow[id] = approach(curS2, s2Goal, 2.5, 3.4, dt);
        }

        const sumGoal = isSelected && activeItem && activeItem !== id ? 0.24 : 1.0;
        siblingSumFactor[id] = approach(curSumF, sumGoal, 2.6, 3.2, dt);

        if (isSelected) {
          const canSprout = branchLimbGrow[k] > 0.22 + idx * 0.08;
          subTwigGrow[id] = approach(curSub, canSprout ? 1 : 0, 2.5, 3.3, dt);
          const itemGoal = subTwigGrow[id] > 0.66 ? 1 : 0;
          itemErasing[id] = curType > itemGoal;
          itemType[id] = approach(curType, itemGoal, 1 / 0.86, 1 / 0.25, dt);
        } else {
          itemErasing[id] = curType > 0;
          itemType[id] = approach(curType, 0, 1 / 0.86, 1 / 0.25, dt);
          const subGoal = itemType[id] > 0.62 || lvl2Type[id] > 0.28 ? 1 : 0;
          subTwigGrow[id] = approach(curSub, subGoal, 2.5, 3.4, dt);
        }
      });
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

    stepAnimations(dt);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const treeScreen = worldToScreen(0, -320);
    const skyGrad = ctx.createRadialGradient(
      treeScreen.x,
      treeScreen.y,
      20,
      treeScreen.x,
      treeScreen.y,
      Math.max(vw, vh) * 0.85
    );
    ctx.fillStyle = SKY_CORE;
    ctx.fillRect(0, 0, vw, vh);
    skyGrad.addColorStop(0, SKY_LIFT);
    skyGrad.addColorStop(0.42, SKY_CORE);
    skyGrad.addColorStop(1, SKY_EDGE);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, vw, vh);

    lastUnderlineLogs = [];
    lastStarGlintLogs = [];
    lastBranchLabelScreenBoxes = [];
    lastBioScreenBox = null;
    lastPortraitScreenBox = null;

    const groundScreenAtCenter = worldToScreen(cam.x, 0).y;
    for (const s of stars) {
      const sx = (s.wx - cam.x * 0.28) * (cam.zoom * 0.65 + 0.35) + vw * 0.5;
      const sy = (s.wy - cam.y * 0.28) * (cam.zoom * 0.65 + 0.35) + vh * 0.5;
      if (sx < -12 || sx > vw + 12 || sy < -12 || sy > Math.min(vh + 12, groundScreenAtCenter - 8)) {
        continue;
      }
      const tw = 0.78 + 0.22 * Math.sin(timeSec * s.speed + s.phase);
      let glint = 0;
      if (s.glint) {
        glint = Math.pow(0.5 + 0.5 * Math.sin(timeSec * s.glintSpeed + s.glintPhase), 3.6);
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
        hGrad.addColorStop(0.45, `rgba(196, 200, 210, ${(haloPeak * 0.34).toFixed(3)})`);
        hGrad.addColorStop(1, "rgba(196, 200, 210, 0)");
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
      const coreAlpha = clamp(s.alpha * tw * 0.85 + glint * 0.26, 0, 0.72);
      ctx.fillStyle = `rgba(220, 224, 232, ${coreAlpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, coreR, 0, Math.PI * 2);
      ctx.fill();

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

  function applyPanDeltaScreen(dxScreen, dyScreen) {
    const z = Math.max(0.25, cam.zoom || 1);
    const maxPanX = activeBranch ? 460 : 180;
    const maxPanY = activeBranch ? 480 : 140;
    panOffset.x = clamp(panOffset.x - dxScreen / z, -maxPanX, maxPanX);
    panOffset.y = clamp(panOffset.y - dyScreen / z, -maxPanY, maxPanY);
    baseCam.x = targetCam.x + panOffset.x;
    baseCam.y = targetCam.y + panOffset.y;
    cam.x = baseCam.x;
    cam.y = baseCam.y;
  }

  function stepBackOneLevel() {
    resetPanOffset();
    if (activeItem) {
      activeItem = null;
      syncCameraToActiveState(false);
      return true;
    }
    if (activeBranch) {
      activeBranch = null;
      syncCameraToActiveState(false);
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

    if (hit.kind === "action") {
      if (hit.action.copy) {
        copyToClipboard(hit.action.copy);
        const msg =
          hit.action.toast || `${getLocale().copiedPrefix || "copied"} ${hit.action.copy}`;
        showToast(msg);
      } else if (hit.action.url) {
        window.location.href = hit.action.url;
      }
      return;
    }

    if (hit.kind === "branch") {
      resetPanOffset();
      if (activeBranch === hit.branchKey) {
        stepBackOneLevel();
      } else {
        activeBranch = hit.branchKey;
        activeItem = null;
        syncCameraToActiveState(false);
      }
      return;
    }

    if (hit.kind === "item") {
      resetPanOffset();
      activeBranch = hit.branchKey;
      activeItem = activeItem === hit.itemId ? null : hit.itemId;
      syncCameraToActiveState(false);
    }
  }

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

  canvas.addEventListener("mousemove", (e) => {
    if (performance.now() - recentTouchMs < 500) return;
    lastPointerScreen.x = e.clientX;
    lastPointerScreen.y = e.clientY;
    lastPointerScreen.active = true;
    portraitTouchToggled = false;
    isPortraitHovered = hitTestPortrait(e.clientX, e.clientY);
    hoveredHit = hitTestWorld(e.clientX, e.clientY);
    canvas.classList.toggle("is-pointer", Boolean(hoveredHit || isPortraitHovered));
  });

  canvas.addEventListener("mouseleave", () => {
    lastPointerScreen.active = false;
    if (!portraitTouchToggled) {
      isPortraitHovered = false;
    }
    hoveredHit = null;
    canvas.classList.remove("is-pointer");
  });

  canvas.addEventListener("click", (e) => {
    if (performance.now() - recentTouchMs < 500) return;
    handleWorldClick(e.clientX, e.clientY);
  });

  window.addEventListener(
    "wheel",
    (e) => {
      if (musicPlaylist && !musicPlaylist.hidden && e.target && typeof musicPlaylist.contains === "function" && musicPlaylist.contains(e.target)) {
        return;
      }
      e.preventDefault();
      if (activeBranch && vw < 960) {
        applyPanDeltaScreen(-(e.deltaX || 0) * 0.65, -(e.deltaY || 0) * 0.65);
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
        '<rect x="2.5" y="2.2" width="3.2" height="9.6" rx="0.7" fill="#001830"/>' +
        '<rect x="8.3" y="2.2" width="3.2" height="9.6" rx="0.7" fill="#001830"/>' +
        "</svg>";
    } else {
      btnPlay.innerHTML =
        '<svg class="play-svg" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M2.6 1.9L12.1 7L2.6 12.1V1.9Z" fill="#001830" stroke="#001830" stroke-width="0.8" stroke-linejoin="round"/>' +
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

  function handleResize() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(vw * dpr);
    canvas.height = Math.floor(vh * dpr);
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
        activeItem,
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
        skyColor: SKY_CORE,
        chalkColor: CHALK,
        chalkTreeColor: CHALK_TREE,
        chalkBrightColor: CHALK_BRIGHT,
        chalkMutedColor: CHALK_MUTED,
        fontEn: FONT_EN,
        fontAr: FONT_AR,
        activeCanvasFont: fontFamilyFor(""),
        earthColor: EARTH_CORE,
        treeSize: { w: TREE_W, h: TREE_H },
        rootsSize: { w: ROOTS_W, h: ROOTS_H },
        hasTreeGrowAt: Boolean(treeGrowAt),
        hasTreeAnimBuffer: Boolean(treeAnimBuffer),
        lastAnimBucket,
        mainTwigGrow: { ...mainTwigGrow },
        mainLabelType: { ...mainLabelType },
        underlineProg: { ...underlineProg },
        branchLimbGrow: { ...branchLimbGrow },
        subTwigGrow: { ...subTwigGrow },
        itemType: { ...itemType },
        lvl2ShootGrow: { ...lvl2ShootGrow },
        lvl2Type: { ...lvl2Type },
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
        heroStarsCount: stars.filter((s) => s.hero).length,
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
        lastBioScreenBox: lastBioScreenBox ? { ...lastBioScreenBox } : null,
        lastPortraitScreenBox: lastPortraitScreenBox ? { ...lastPortraitScreenBox } : null
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
      lastPointerScreen.x = sx;
      lastPointerScreen.y = sy;
      lastPointerScreen.active = true;
      portraitTouchToggled = false;
      isPortraitHovered = hitTestPortrait(sx, sy);
      hoveredHit = hitTestWorld(sx, sy);
      canvas.classList.toggle("is-pointer", Boolean(hoveredHit || isPortraitHovered));
    },
    openBranch(key) {
      activeBranch = key;
      activeItem = null;
      syncCameraToActiveState(false);
    },
    openItem(branchKey, itemId) {
      activeBranch = branchKey;
      activeItem = itemId;
      syncCameraToActiveState(false);
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
    sliceTypewriter,
    computeDiscreteCharCount,
    computeCanopySway,
    computeHomeCamera,
    computeHomeWorldBounds,
    computeBranchLayout,
    computeMeEditorialLayout,
    layoutActionRows,
    worldToScreen,
    screenToWorld,
    hitTestWorld,
    handleWorldClick,
    applyPanDeltaScreen,
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
  handleResize();
  initViewportGrain();
  buildBotanicalBuffers();
  initMePortraitBuffer();
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
