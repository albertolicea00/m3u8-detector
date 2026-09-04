# Privacy Policy

**M3U8 Detector**
**Last updated: September 2026**

---

## Our Commitment to Privacy

**M3U8 Detector** was built with privacy as a core principle, not an afterthought. This Privacy Policy explains, in plain language, what data (if any) is accessed, stored, or transmitted when you use the Extension.

**TL;DR — we collect absolutely nothing. Zero. Nada.**

---

## 1. Who We Are

M3U8 Detector is an open-source browser extension developed and maintained by its contributors on GitHub:

> https://github.com/albertolicea00/m3u8-detector

The project is maintained by **albertolicea00** and open-source contributors. There is no company, legal entity, or data processing organization behind this Extension.

---

## 2. Data We Do NOT Collect

We want to be completely transparent. The Extension does **not** collect, store, transmit, share, or sell any of the following:

- ❌ Browsing history or visited URLs
- ❌ Website content or media you view
- ❌ Personal information (name, email, IP address, device identifiers)
- ❌ Crash reports or diagnostic telemetry
- ❌ Analytics or usage statistics
- ❌ Cookies or tracking identifiers of any kind

There are **no servers**, **no databases**, **no third-party SDKs**, and **no analytics platforms** involved in the operation of this Extension.

---

## 3. Data Stored Locally (On Your Device Only)

The Extension stores the following **user preferences and stream data** using the browser's native `chrome.storage.local` API. This data lives **only on your device**:

| Data           | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `pinnedStreams`   | List of streams pinned by the user for export               |

This data is **never read, accessed, or transmitted by us**. It is used solely to allow you to persist detected media streams across tab navigation and browser restarts.

---

## 4. Permissions Explained

The Extension requests only the permissions required for its core functionality:

### `webRequest`

Used to inspect HTTP request traffic to detect `.m3u8` playlist URLs and direct video requests (`.mp4`, `.webm`, `.mkv`). The Extension **does not modify or log** un-related network traffic.

### `storage`

Used to save and retrieve your pinned streams locally via `chrome.storage.local`. Data is never sent to any external server.

### `tabs`

Used to obtain the page title and URL of the active tab so detected media streams can be clearly identified and grouped by page in the panel interface.

### `cookies`

Used to read session cookies associated with the current media origin, allowing the Service Worker to resolve protected/signed HLS playlist segments directly within your browser. Cookies are included only in your export file if requested, and never sent to us.

### Host Permissions (`<all_urls>`)

Required to monitor video network requests across websites you visit to identify HLS streams and inject the floating detection panel.

---

## 5. No Third Parties

This Extension does **not** integrate with any third-party services, APIs, advertising networks, analytics platforms, or crash reporting tools.

There are no:

- Google Analytics, Mixpanel, or similar trackers
- Firebase or cloud databases
- Remote feature flags or A/B testing services
- Affiliate or monetization networks

---

## 6. Open Source Transparency

The Extension is fully open-source. You can inspect every line of code that runs in your browser:

> https://github.com/albertolicea00/m3u8-detector

We encourage you to review the source code if you have any concerns about what the Extension does. Community audits and contributions are welcome.

---

## 7. Children's Privacy

The Extension does not knowingly collect data from anyone, including children under the age of 13. Since we collect no data at all, there is no special handling required.

---

## 8. Changes to This Policy

We may update this Privacy Policy if the Extension's behavior changes in a way that affects data handling. Any updates will be reflected in the `Last updated` date at the top of this document and committed to the public GitHub repository.

We encourage you to periodically review this document.

---

## 9. Contact

If you have any questions about this Privacy Policy or the Extension's behavior, please open an issue on GitHub:

> https://github.com/albertolicea00/m3u8-detector/issues

---

_M3U8 Detector respects your privacy completely. What you browse is your business — not ours._
