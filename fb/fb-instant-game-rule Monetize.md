# META / FACEBOOK INSTANT GAMES MONETIZATION SPECIFICATION
**Document:** `fb/fb-instant-game-rule Monetize.md`  
**Classification:** Monetization Standard & Rewarded Video Architecture  
**Target Environment:** Meta Facebook Instant Games  
**Status:** Active & Permanently Enforced

---

## 1. REWARDED VIDEO ADS ARCHITECTURE

### 1.1 Rewarded Video Standard Workflow
Monetization in Meta Instant Games is powered by Facebook Audience Network Rewarded Video ads. The implementation MUST strictly adhere to the asynchronous three-step promise workflow:
1. **Ad Instance Creation (`FBInstant.getRewardedVideoAsync`)**: Request an ad instance bound to the configured placement ID.
2. **Ad Preloading (`loadAsync`)**: Preload the video creative into memory.
3. **Ad Presentation (`showAsync`)**: Display the full-screen rewarded video when the player actively taps a rewarded trigger.

```javascript
let preloadedRewardedVideo = null;

function loadRewardedVideoAd(placementId) {
  return FBInstant.getRewardedVideoAsync(placementId)
    .then(function(rewardedVideo) {
      preloadedRewardedVideo = rewardedVideo;
      return preloadedRewardedVideo.loadAsync();
    })
    .then(function() {
      console.log("Facebook Rewarded Video preloaded successfully.");
      return true;
    })
    .catch(function(err) {
      console.warn("Failed to load rewarded video ad:", err);
      preloadedRewardedVideo = null;
      return false;
    });
}

function showRewardedVideoAd(placementId, onRewardSuccess, onRewardFail) {
  const adPromise = preloadedRewardedVideo 
    ? Promise.resolve(preloadedRewardedVideo) 
    : FBInstant.getRewardedVideoAsync(placementId).then(ad => {
        preloadedRewardedVideo = ad;
        return ad.loadAsync().then(() => ad);
      });

  adPromise
    .then(function(ad) {
      return ad.showAsync();
    })
    .then(function() {
      // User watched the video to completion
      preloadedRewardedVideo = null; // Invalidate used ad
      if (typeof onRewardSuccess === 'function') {
        onRewardSuccess();
      }
      // Trigger preload for the next opportunity
      loadRewardedVideoAd(placementId);
    })
    .catch(function(err) {
      console.warn("Rewarded video playback rejected or dismissed early:", err);
      preloadedRewardedVideo = null;
      if (typeof onRewardFail === 'function') {
        onRewardFail(err);
      }
    });
}
```

---

## 2. ERROR HANDLING & RESILIENCE REQUIREMENTS

### 2.1 Ad Load & Playback Failure Modes
Ad requests can fail under several routine conditions:
- **`ADS_NO_FILL` / Inventory Exhaustion**: No ad creative available in the user's geographic region.
- **`ADS_FREQUENT_LOAD` / Rate Limiting**: The client requested ads too frequently within a short time window.
- **`NETWORK_FAILURE`**: Connection timeout or connectivity loss.
- **User Dismissal / Close Before Completion**: The player closed the ad before the reward threshold.

### 2.2 Graceful UI Fallbacks & User Feedback
- When an ad fails to load or cannot display, the game MUST NOT crash, hang, or freeze the user interface.
- Provide clear, non-intrusive feedback (e.g. a toast message: *"Ad currently unavailable. Please try again shortly."*).
- Never penalize the player or block game progression due to ad network unavailability.
- Pre-cache and re-attempt ad requests during natural game breaks (e.g., between levels or on level clear screens).

---

## 3. COIN REWARD ECONOMY & COMPLETION SYNC

### 3.1 Reward Granularity & Balance
- **Tied directly to Completion:** Coin rewards MUST only be granted after the `showAsync()` promise resolves successfully, confirming full video view.
- **Standard Reward Tier:**
  - Level Clear Summary Screen: **+25 Coins** for watching a rewarded video.
  - Shop / Economy Refill: **+25 to +50 Coins** per completed video view.
- **Immediate Economy Sync:** Upon reward resolution, update the internal coin balance immediately, trigger the coin jingle audio effect, update the DOM counter display, and persist the new balance to storage (`FBInstant.player.setDataAsync` with fallback to `localStorage`).
