# META / FACEBOOK INSTANT GAMES CORE DEVELOPER & COMPLIANCE RULES
**Document:** `fb/fb-instant-game-rule.md`  
**Classification:** Core Platform Architecture & Compliance Standard  
**Target Environment:** Meta Facebook Instant Games  
**Status:** Active & Permanently Enforced

---

## 1. SDK INTEGRATION & BOOT SEQUENCE

### 1.1 SDK Inclusion & Single Initialization
- Every Facebook Instant Game MUST include the official Meta SDK script in the `<head>` of `index.html`:
  ```html
  <script src="https://connect.facebook.net/en_US/fbinstant.7.1.js"></script>
  ```
- **Single Initialization Rule:** `FBInstant.initializeAsync()` MUST be called **exactly once** during the application lifetime. Multiple calls trigger fatal `INVALID_OPERATION` exceptions. Protect initialization with a single execution guard (e.g., `window.__fbInstantInitialized`).

### 1.2 Strict Chronological Boot Lifecycle
The game boot sequence MUST strictly execute in four chronological steps:
1. **Initialize Bridge:** Call `FBInstant.initializeAsync()` and await its resolution.
2. **Asset Loading Progress:** Update asset loading progress via `FBInstant.setLoadingProgress(100)` while core resources and level data initialize.
3. **Start Game:** Call `FBInstant.startGameAsync()` to dismiss the platform loading splash and display the game canvas.
   - Always attach a `.catch()` recovery handler to `startGameAsync()` (handling cookie blocking or network dropouts) so the game falls back to local interactive gameplay rather than hanging on a black screen.
4. **Data & Context Operations:** All player data read/write calls (`FBInstant.player.getDataAsync` / `setDataAsync`) and context queries MUST occur strictly **after** `startGameAsync()` has successfully resolved.

---

## 2. PLAYER ID NULL-CHECKS & LOCAL RESILIENCE FALLBACK

### 2.1 Web Player Null Player ID Guard
- When testing in the Facebook Web Player, users in incognito windows, restricted iframe sessions, or with third-party cookies disabled will cause `FBInstant.player.getID()` to return `null`.
- Calling `getDataAsync()` or `setDataAsync()` when `getID()` is `null` causes unhandled `NETWORK_FAILURE` promise rejections.
- **Mandatory Guard:** Verify that `FBInstant.player.getID()` returns a non-null, truthy string before invoking cloud storage methods:
  ```javascript
  if (typeof FBInstant.player !== 'undefined' && typeof FBInstant.player.getID === 'function' && FBInstant.player.getID()) {
    return FBInstant.player.getDataAsync(['word_mapping_save_state']);
  } else {
    console.warn("FBInstant.player.getID() returned null. Falling back to localStorage.");
    const localData = localStorage.getItem('word_mapping_save_state');
    return Promise.resolve(localData ? JSON.parse(localData) : null);
  }
  ```
- All state persistence routines must similarly fallback to `localStorage.setItem()` when `getID()` is null.

---

## 3. ROOT-LEVEL BUNDLE CONFIGURATION (`fbapp-config.json`)

### 3.1 Absolute Root Placement & Structure
- Every production archive bundle MUST sit `fbapp-config.json` directly at the absolute root level (alongside `index.html`).
- The configuration MUST declare the `instant_games` configuration block with `RICH_GAMEPLAY` and `NAV_FLOATING` to prevent "Invalid Bundle Config" platform rejections:
  ```json
  {
    "instant_games": {
      "platform_version": "RICH_GAMEPLAY",
      "navigation_menu_version": "NAV_FLOATING"
    }
  }
  ```

---

## 4. MARKETING MEDIA ASSET DIMENSIONS & SPECIFICATIONS

All promotional graphics and marketing media uploaded to the Facebook Developer App Dashboard must strictly adhere to the following pixel dimension standards:

| Asset Type | Target Resolution | Aspect Ratio | Format | Requirements |
| :--- | :--- | :--- | :--- | :--- |
| **Cover / Banner** | 1200 x 627 px | ~1.91:1 Banner | PNG / JPG | Clear branding, high contrast, safe-zone centered |
| **Landscape Banner** | 1920 x 1080 px | 16:9 Landscape | PNG / JPG | Desktop & tablet discovery surfaces |
| **Portrait Banner** | 1080 x 1920 px | 9:16 Portrait | PNG / JPG | Mobile feed and stories placement |
| **Square Icon** | 1080 x 1080 px (or 512x512) | 1:1 Square | PNG | Transparent padding prohibited |
| **Video Previews** | 1920x1080 / 1080x1920 / 1080x1080 | 16:9, 9:16, 1:1 | MP4 | 10–15s duration, H.264 (`yuv420p`), 30 FPS, faststart |
