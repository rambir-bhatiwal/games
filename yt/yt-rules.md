# YOUTUBE PLAYABLES DEVELOPER SPECIFICATION & COMPLIANCE RULES
**Document:** `yt/yt-rules.md`  
**Classification:** Absolute Platform Standard  
**Target Environment:** YouTube Playables (`yt-game/`)  
**Status:** Active & Permanently Enforced

---

## 1. ARCHITECTURE & ZERO-DEPENDENCY MANDATE

### 1.1 Clean HTML5 & Zero External Dependencies (Rule YT-ARCH-001)
- The YouTube Playables package MUST be 100% self-contained within HTML5, CSS, and vanilla JavaScript.
- **Strictly No External Scripts:** Never link to external CDNs, remote libraries, analytics, or Google Fonts. All styles and typography must use system font stacks or inlined web assets.
- **Strictly No External Ad SDKs:** YouTube natively handles all platform monetization, interstitial pacing, and platform framing. Integrating external ad networks (Google AdMob, Unity Ads, Facebook Audience Network) is strictly forbidden and results in immediate bundle rejection.
- All game logic, sounds, and graphics must run locally without downloading remote runtimes at startup.

---

## 2. PERFORMANCE & BUNDLE CONSTRAINTS

### 2.1 Load Time & Size Constraints (Rule YT-PERF-001)
- **Compressed Package Size:** The total zip archive must remain lightweight (recommended < 10 MB uncompressed, < 5 MB compressed).
- **Time to Interactive:** Initial game screen and interactive state must render in **under 3 seconds** on standard mobile 4G network profiles.
- **Rendering Framerate:** The canvas rendering engine must sustain **60 FPS** on mid-tier mobile devices. Avoid expensive per-frame garbage collections or heavy canvas reallocation.

### 2.2 Responsive Canvas & Mobile Portrait Clamping (Rule YT-PERF-002)
- Games must support both mobile portrait and desktop landscape viewport presentations.
- For portrait orientation, clamp layout width (e.g. `max-width: 520px; max-height: 940px; margin: 0 auto;`) to prevent distortion on ultra-wide desktop monitors while filling mobile screens edge-to-edge.
- Use `viewport-fit=cover`, `user-scalable=no`, and CSS touch-action containment (`touch-action: none;`) to prevent unwanted native browser zoom or scroll gestures.

---

## 3. AUDIO & USER EXPERIENCE

### 3.1 Procedural Synthesis & Audio Focus (Rule YT-AUD-001)
- Employ the standard Web Audio API for procedural sound synthesis to maintain zero external audio asset overhead.
- Audio contexts must initialize in a suspended state and unlock only upon direct user pointer interaction (`pointerdown`, `click`).
- The game must listen to document visibility changes (`visibilitychange`) and window blur events to immediately mute or suspend audio playback when the YouTube player tab loses focus or is backgrounded.

---

## 4. PERSISTENCE & STORAGE POLICY

### 4.1 Storage Sandboxing & Quota Handling (Rule YT-DATA-001)
- YouTube Playables are served within sandboxed `<iframe>` contexts.
- All save state (high scores, coin balances, level progression) must utilize native browser `localStorage` wrapped in `try/catch` error handling to gracefully handle browser private browsing / storage quota restrictions:
  ```javascript
  function saveYTGameState(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn("Storage quota exceeded or disabled in iframe sandbox:", err);
    }
  }
  ```
- Do not rely on third-party cookies, IndexedDB without fallbacks, or cross-origin session storage.

---

## 5. MEDIA ASSET SPECIFICATIONS

### 5.1 Playables Asset Package (Rule YT-MEDIA-001)
All YouTube Playables promotional assets must adhere to the following specifications:

| Asset Type | Target Resolution | Aspect Ratio | Format | Requirements |
| :--- | :--- | :--- | :--- | :--- |
| **Playable Icon / Thumbnail** | 512 x 512 px (or 1080 x 1080) | 1:1 Square | PNG | High-visibility branding, clear logo, no transparency padding |
| **Landscape Banner** | 1920 x 1080 px | 16:9 Landscape | PNG | Desktop & tablet discovery banner |
| **Portrait Banner** | 1080 x 1920 px | 9:16 Portrait | PNG | Mobile Shorts / in-feed promotion |
| **Feature Graphic** | 1200 x 627 px | ~1.91:1 | PNG | Platform preview card |
