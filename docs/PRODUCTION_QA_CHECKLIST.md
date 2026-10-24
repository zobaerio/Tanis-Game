# Production QA Checklist

Use this checklist before calling a release production-ready. Record the browser/device, date, result, and any issue link for each test. A successful CI build does not replace these runtime checks.

## 1. Build and deployment
- [ ] GitHub Actions quality workflow passes on the exact release commit.
- [ ] Vercel deployment completes and the deployed URL loads without console errors.
- [ ] Refreshing the game page does not break the app.
- [ ] No required asset requests fail in the browser Network panel.

## 2. Core gameplay
- [ ] Start a match from the main menu.
- [ ] Ball launch, racket swing, ball collision, scoring, and game-over flow work.
- [ ] Play again starts a fresh match without stale score/state.
- [ ] Pause/settings/menu actions remain usable during and after a match.
- [ ] Character and racket customizations persist after reload if persistence is intended.
- [ ] Reset progress clearly warns before destructive action and resets only intended data.

## 3. Phone controller and multiplayer
- [ ] Open the companion controller from its in-game link.
- [ ] Confirm the displayed room ID and player role match the desktop game.
- [ ] Grant motion/orientation permission on a supported phone when prompted.
- [ ] Swing/toss telemetry reaches the correct player slot.
- [ ] Disconnect/reconnect the phone and verify status recovers gracefully.
- [ ] Create/join a multiplayer room in two separate browser sessions.
- [ ] Verify both players see consistent score, match state, and end-of-match result.
- [ ] Verify an unavailable relay/server produces a useful error rather than a silent failure.

## 4. PWA and offline behavior
- [ ] Install the app from a supported browser and confirm the app name/icon are correct.
- [ ] Launch the installed app and verify it opens the game shell.
- [ ] After a successful online load, switch to offline mode and reload.
- [ ] Confirm which gameplay assets are actually available offline; document any features that still require network access.
- [ ] Reconnect and confirm the service worker updates without leaving the app stuck.
- [ ] Test uninstall/reinstall and ensure the latest app version is served.

## 5. Mobile, accessibility, and performance
- [ ] Test a narrow phone viewport in portrait and landscape.
- [ ] Ensure menus and dialogs fit the viewport and can be closed without a keyboard.
- [ ] Confirm text inputs and controls remain usable with browser zoom enabled.
- [ ] Check reduced-motion/low-graphics settings and a lower-powered device.
- [ ] Monitor console errors, failed network requests, memory growth, and frame-rate drops during a 10-minute session.

## 6. Release sign-off
For each failed item, record:
- **Environment:** device, OS, browser and version
- **Steps:** exact reproduction steps
- **Expected vs actual:** what should happen and what happened
- **Evidence:** screenshot, console/network error, or short recording
- **Owner/status:** responsible person and issue/PR link

Do not mark a section passed unless it has been run on the deployed build. Do not claim offline support for gameplay that has not been verified with the network disabled.
