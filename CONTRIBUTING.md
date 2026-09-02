# Contributing to M3U8 Detector

Thank you for your interest in contributing to **M3U8 Detector**! We welcome bug reports, feature requests, code contributions, and documentation improvements.

---

## 🛠️ How to Get Started

### 1. Local Development Setup

1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/m3u8-detector.git
   cd m3u8-detector
   ```
2. Open Chrome (or any Chromium-based browser like Edge, Brave, Arc).
3. Navigate to `chrome://extensions`.
4. Enable **Developer mode** using the toggle in the top-right corner.
5. Click **Load unpacked** and select the root directory of this project (`m3u8-detector/`).

---

## 🚀 Development Guidelines

### Code Style & Principles
- **Vanilla JavaScript**: Use modern ECMAScript (ES2022+) without external build tools or bundlers.
- **Manifest V3 Compliance**: All background operations must use Service Workers (`background.js`). Avoid using `window` or DOM APIs inside the service worker.
- **Style Isolation**: UI components injected into host pages (`panel.js`) must be encapsulated within a **Shadow DOM** to prevent CSS leakage to or from host sites.
- **Security & Privacy**: No external tracking, telemetry, or third-party analytics scripts.

---

## 🧪 Testing Your Changes

Whenever modifying extension code:
1. Reload the extension on `chrome://extensions` by clicking the 🔄 **Reload** icon on the M3U8 Detector card.
2. Open Developer Tools on both target websites and the extension Service Worker (via `chrome://extensions` → *Inspect views: service worker*).
3. Verify HLS stream detection (`.m3u8`), network interception, and playlist segment resolution.

---

## 📥 Submitting Pull Requests (PRs)

1. **Fork the Repository**: Create a fork on GitHub and clone your fork locally.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/amazing-new-feature
   ```
3. **Commit Your Changes**: Use clear, conventional commit messages:
   ```bash
   git commit -m "feat(panel): add stream quality selector option"
   ```
4. **Push & Open a PR**: Push to your branch and open a Pull Request describing your changes, motivation, and test steps.

---

## 💬 Reporting Issues & Suggestions

If you discover a bug or have an idea for improvement:
- Search existing GitHub Issues before opening a new one.
- Provide step-by-step reproduction steps, browser version, and example site URLs (if applicable).

Thank you for helping make **M3U8 Detector** better!
