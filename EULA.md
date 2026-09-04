# End User License Agreement (EULA)

**M3U8 Detector**
**Last updated: September 2026**

---

## 1. Acceptance of Terms

By installing, enabling, or using the **M3U8 Detector** browser extension ("the Extension"), you ("the User") agree to be bound by this End User License Agreement ("EULA"). If you do not agree to these terms, you must not install or use the Extension.

---

## 2. License Grant

The author ("Licensor") grants you a **free, non-exclusive, non-transferable, revocable license** to install and use the Extension solely for your personal, non-commercial purposes, subject to the terms of this EULA.

This Extension is also distributed under the **MIT License**. In the event of any conflict between the MIT License terms and this EULA, the MIT License shall prevail with respect to source code redistribution.

---

## 3. Description of the Extension

M3U8 Detector is a browser extension for Google Chrome, Mozilla Firefox, and compatible Chromium-based browsers (Manifest V3). It automatically detects HLS (`.m3u8`) video streams and direct media requests (`.mp4`, `.webm`, `.mkv`) on web pages you visit, resolves media playlist segments directly inside the browser service worker (bypassing IP-locked playlist tokens), and allows exporting stream data to companion scripts or Google Colab notebooks. All processing occurs **entirely locally** within the User's browser.

---

## 4. Restrictions

You agree **not** to:

- Reverse-engineer, decompile, or disassemble the Extension for purposes outside those permitted by the MIT License.
- Use the Extension for any unlawful purpose or in violation of any applicable laws or regulations.
- Modify and redistribute the Extension under a different name without clearly attributing the original work.
- Use the Extension to circumvent digital rights management (DRM) systems, content access controls, or website terms of service in an unauthorized manner.

---

## 5. Privacy & Data Collection

The Extension collects **no personal data whatsoever**. All user settings and pinned streams are stored exclusively in the browser's native `chrome.storage.local` API and are **never transmitted to any external server**.

For full details, please review our [Privacy Policy](PRIVACY_POLICY.md).

---

## 6. Permissions

The Extension requests only the minimum browser permissions necessary for its operation:

| Permission | Purpose |
| --- | --- |
| `webRequest` | Intercept network requests to detect `.m3u8` playlist URLs and direct video streams |
| `storage` | Store pinned streams and UI preferences locally in `chrome.storage.local` |
| `tabs` | Retrieve tab title and URL to associate detected streams with the active web page |
| `cookies` | Access session cookies necessary to resolve protected HLS playlists and format export metadata |
| Host permissions (`<all_urls>`) | Monitor web requests on visited sites to identify media streams |

No permission is used to access, read, or transmit personal user browsing history or data to any third party.

---

## 7. Intellectual Property

The Extension, its source code, icons, and documentation are the intellectual property of the Licensor and contributors. The source code is open-source and available at:

> https://github.com/albertolicea00/m3u8-detector

All contributions submitted via Pull Requests are accepted under the MIT License.

---

## 8. Disclaimer of Warranties

The Extension is provided **"as is"**, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.

The Licensor does not warrant that:

- The Extension will be error-free or uninterrupted.
- The Extension will work correctly on all websites or browser versions.
- Streams detected by the Extension will always be playable or downloadable.

---

## 9. Limitation of Liability

To the maximum extent permitted by applicable law, the Licensor shall **not be liable** for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Extension, even if advised of the possibility of such damages.

---

## 10. Third-Party Services

The Extension does not integrate with, depend on, or communicate with any third-party service, API, or analytics platform. All functionality is self-contained within your browser.

---

## 11. Updates and Modifications

The Licensor reserves the right to update, modify, or discontinue the Extension at any time without notice. Updated versions distributed through browser extension stores or the GitHub repository may be subject to revised terms. Continued use of the Extension after an update constitutes acceptance of the new terms.

---

## 12. Termination

This license is effective until terminated. Your rights under this EULA will terminate automatically if you fail to comply with any of its terms. Upon termination, you must uninstall and cease all use of the Extension.

---

## 13. Governing Law

This EULA shall be governed by and construed in accordance with applicable law. Any disputes arising under or in connection with this EULA shall be resolved in good faith between the parties.

---

## 14. Contact

For questions, concerns, or feedback regarding this EULA, please open an issue on the GitHub repository:

> https://github.com/albertolicea00/m3u8-detector/issues

---

_By using M3U8 Detector, you acknowledge that you have read and understood this EULA and agree to be bound by its terms._
