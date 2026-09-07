# Seerr Search

<img src="icons/icon128.png" width="96" align="right" alt="Seerr Search icon" />

A Chrome extension for [Seerr](https://github.com/seerr-team/seerr). Select a movie or TV show title on any page, then search your Seerr instance for it — or request it directly without leaving the page.

## Features

- **Search** — right-click selected text → *Search Seerr for "…"* opens your instance's search results in a new tab.
- **Request** — via the right-click menu or a floating button that appears near selected text (configurable). A confirmation dialog shows matching movies and TV shows (people are filtered out), with posters and library/request status. Nothing is requested until you confirm.
- TV requests let you pick individual seasons, multiple seasons, or all seasons directly in the dialog. Your preferred default is configurable in settings.
- UI styled to match Seerr itself, Inter Variable and all.

## Screenshots

<img src="screenshots/dialog.png" width="420" alt="Right-click context menu showing Seerr Search options, with the floating Request button visible" />
<img src="screenshots/dialog-add.png" width="420" alt="Request dialog showing TV season checkboxes" />
<img src="screenshots/options.png" width="420" alt="Seerr Search settings page" />

## Install

1. Download or clone this repo.
2. Go to `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the folder.
3. Open the extension's settings:
   - Enter your Seerr address.
   - Paste your API key (Seerr → Settings → General → API Key) — only needed for requesting; searching works without it.
   - Pick your request trigger: right-click menu, floating button, or both.
   - Pick your default TV season selection (select individual seasons or all seasons).
4. When you save, Chrome will ask to grant the extension access to your Seerr address — this is required for the request dialog to reach the API.

Requests are submitted as the user who owns the API key.

## Notes

- The floating button requires a content script on all pages, which is why Chrome shows the "read and change all your data on websites" warning. The script only watches text selection and renders the button.
- Works with instances reached over LAN, Tailscale, or a reverse proxy — the address is just a URL, including any subpath.

## Credits

- [Seerr](https://github.com/seerr-team/seerr) — logo mark used in the icon, and the UI this extension imitates. This extension is not created by or related to the actual Seerr project. Huge thank you to that team for creating and maintaining such an incredible application.
- [Inter](https://github.com/rsms/inter) — bundled under the [SIL Open Font License](fonts/LICENSE).
