# META / FACEBOOK INSTANT GAMES DEVELOPER SPECIFICATION & COMPLIANCE RULES
**Document:** `fb/fb-rules.md`  
**Classification:** Absolute Platform Standard  
**Target Environment:** Meta Facebook Instant Games (`fb-instant-game/`)  
**Status:** Active & Permanently Enforced

---

## 1. SDK INTEGRATION & BOOT SEQUENCE

### 1.1 SDK Inclusion & Single Initialization (Rule FB-SDK-001)
- The official Meta Instant Games SDK script MUST be included directly within the `<head>` of `index.html`:
  ```html
  <script src="https://connect.facebook.net/en_US/fbinstant.7.1.js"></script>
  ```
- `FBInstant.initializeAsync()` MUST be called **exactly once** during the game's lifetime. Duplicate invocations trigger fatal `INVALID_OPERATION` exceptions.
- Implement an explicit boolean guard (e.g. `window.__fbInstantInitialized = true`) to prevent race conditions or re-entrancy.

### 1.2 Strict Chronological Boot Sequence (Rule FB-SDK-002)
The game boot sequence MUST strictly execute in the following four chronological steps:
1. `FBInstant.initializeAsync()` — Initialize the platform bridge.
2. `FBInstant.setLoadingProgress(percentage)` — Update loading progress (up to 100) while core assets compile.
3. `FBInstant.startGameAsync()` — Notify Meta that the game is ready for user interaction. Must include a `.catch()` recovery handler (e.g., handling cookie blocking or network dropouts) to prevent black screens.
4. Player Data & Context Operations — All read/write operations (`getDataAsync`, `setDataAsync`, `getPlayersAsync`) MUST occur strictly **after** `startGameAsync()` has resolved.

---

## 2. BUNDLE CONFIGURATION & ARCHITECTURE

### 2.1 Root-Level `fbapp-config.json` (Rule FB-CFG-001)
- Every production archive MUST contain `fbapp-config.json` sitting at the absolute root level (alongside `index.html`).
- The configuration MUST specify the `instant_games` dictionary with `RICH_GAMEPLAY` and `NAV_FLOATING` to prevent "Invalid Bundle Config" rejection:
  ```json
  {
    "instant_games": {
      "platform_version": "RICH_GAMEPLAY",
      "navigation_menu_version": "NAV_FLOATING"
    }
  }
  ```

### 2.2 Strict Prohibition of PWA Service Workers (Rule FB-ARCH-001)
- Meta Instant Games execute inside cross-origin sandboxed `<iframe>` elements.
- PWA Service Workers (`sw.js`) and `navigator.serviceWorker.register()` MUST NOT be included or executed in Facebook Instant Game builds. Service worker registrations inside sandboxed iframes throw security errors or return `400 Bad Request`.

---

## 3. RESILIENCE, FALLBACKS & SAFEGUARDS

### 3.1 Player ID Null-Checks & Local Fallback (Rule FB-RES-001)
- In the Facebook Web Player, unauthenticated sessions, incognito windows, or third-party cookie restrictions cause `FBInstant.player.getID()` to return `null`.
- Calling `FBInstant.player.getDataAsync()` or `setDataAsync()` when `getID()` is `null` causes unhandled `NETWORK_FAILURE` rejections.
- The game MUST check if `FBInstant.player.getID()` is valid before calling player APIs:
  ```javascript
  if (typeof FBInstant.player !== 'undefined' && typeof FBInstant.player.getID === 'function' && FBInstant.player.getID()) {
    return FBInstant.player.getDataAsync(['save_key']);
  } else {
    // Fall back gracefully to localStorage
    const local = localStorage.getItem('save_key');
    return Promise.resolve(local ? JSON.parse(local) : null);
  }
  ```

### 3.2 Context Type Guards (Rule FB-RES-002)
- `FBInstant.context.getPlayersAsync()` throws an `INVALID_OPERATION` error when called during a `SOLO` context session.
- Always guard context calls:
  ```javascript
  if (FBInstant.context && typeof FBInstant.context.getType === 'function' && FBInstant.context.getType() !== 'SOLO') {
    return FBInstant.context.getPlayersAsync();
  }
  return Promise.resolve([]);
  ```

### 3.3 Deprecated APIs Purge (Rule FB-RES-003)
- Never call `FBInstant.context.isPublicAsync()`; it is deprecated and triggers `CLIENT_UNSUPPORTED_OPERATION`.
- Purge all obsolete SDK methods and rely exclusively on current 7.x APIs.

### 3.4 Tournament API Safeguards (Rule FB-RES-004)
- Calling `FBInstant.getTournamentAsync()` blindly on auto-boot throws `TOURNAMENT_NOT_FOUND` if no tournament is currently active.
- Tournament integrations MUST be attached to explicit user-driven actions and MUST include a `.catch(err => console.log('No tournament active', err))` handler to fail silently.

---

## 4. MONETIZATION: REWARDED VIDEO ADS

### 4.1 Official Rewarded Video API (Rule FB-ADS-001)
- All rewarded ads (e.g. "Watch Video for 25 Coins") MUST strictly utilize the official `FBInstant.getRewardedVideoAsync()` API:
  ```javascript
  FBInstant.getRewardedVideoAsync(placementId)
    .then(function(rewardedVideo) {
      return rewardedVideo.loadAsync().then(function() {
        return rewardedVideo.showAsync();
      });
    })
    .then(function() {
      // Grant player reward
    })
    .catch(function(err) {
      console.warn("Rewarded video ad failure:", err);
    });
  ```
- Simulated or external generic ad loops are strictly prohibited in Meta builds.

---

## 5. MARKETING & MEDIA ASSET SPECIFICATIONS

### 5.1 Required Dimensions & Formats (Rule FB-MEDIA-001)
All promotional assets for Meta Instant Games must strictly conform to these standardized dimensions:

| Asset Type | Dimensions | Aspect Ratio | Format | Requirements |
| :--- | :--- | :--- | :--- | :--- |
| **App Icon** | 1080 x 1080 px | 1:1 Square | PNG | No transparent padding, crisp icon art |
| **Cover / Banner** | 1200 x 627 px | ~1.91:1 Banner | PNG | High-contrast branding, safe-zones respected |
| **Landscape Banner** | 1920 x 1080 px | 16:9 Landscape | PNG | Full HD promotional backdrop |
| **Portrait Banner** | 1080 x 1920 px | 9:16 Portrait | PNG | Mobile feed portrait orientation |
| **Square Banner** | 1080 x 1080 px | 1:1 Square | PNG | In-feed square promo asset |
| **Video Previews** | 1920x1080 / 1080x1920 / 1080x1080 | 16:9, 9:16, 1:1 | MP4 | 10–15s duration, H.264 (`yuv420p`), 30 FPS, faststart |
