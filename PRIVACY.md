# Privacy Policy for Seerr Search

Last updated: September 21, 2026

**Seerr Search** is an open-source browser extension designed to help you search and request media on your personal, self-hosted Seerr, Overseerr, or Jellyseerr instance.

Your privacy is a primary design principle of this extension.

---

## 1. What Information We Collect

Seerr Search collects and stores only the minimum settings necessary to operate:
- **Server Address**: The URL of your Seerr, Overseerr, or Jellyseerr instance (e.g., `https://seerr.home.example`).
- **API Key**: The API authentication token you provide from your Seerr instance to authenticate your search and request actions.
- **Preferences**: Your selected trigger preference (menu, floating button, or both) and your default TV season preference.

**We do NOT collect**:
- Browsing history or search queries outside of explicit requests sent to your own server.
- Personal identifying information (name, email address, IP address).
- Analytics, telemetry, crash reports, or diagnostic trackers.

---

## 2. How Your Information Is Stored and Transmitted

- **Local & Sync Storage**: Your settings (server URL, API key, and preferences) are stored using Chrome's built-in `chrome.storage.sync` (or `chrome.storage.local`) API. If you have Chrome Sync enabled, Google securely syncs these settings across your logged-in browser profiles.
- **Direct Server Communication**: All search queries, media inspection, and request submissions are transmitted **exclusively and directly** between your browser and your configured Seerr server address.
- **No Intermediaries**: Your API key, server address, and queries are never routed through any third-party servers, proxy services, or developer infrastructure.

---

## 3. Third-Party Services and Analytics

Seerr Search does not include any third-party advertising, analytics scripts (such as Google Analytics), or tracking libraries.

The extension may load media poster artwork directly from The Movie Database (TMDB) image servers (`https://image.tmdb.org`) when displaying search results. No user credentials or personal data are sent to TMDB.

---

## 4. Data Sharing and Sale

We do **not** sell, rent, trade, or share any user data with third parties for any purpose.

---

## 5. Data Retention and Control

You maintain complete control over your data:
- You can update or remove your server address and API key at any time in the extension's Settings page.
- Uninstalling the extension from your browser automatically deletes all locally stored settings and data.

---

## 6. Open Source Code

The complete source code for Seerr Search is publicly available for review and audit at:  
https://github.com/civarson/seerr-search

---

## 7. Contact

If you have any questions or feedback regarding this privacy policy or the extension's data practices, please open an issue on GitHub or reach out to:

**Chris Ivarson**  
Email: civarson@gmail.com  
GitHub: https://github.com/civarson/seerr-search
