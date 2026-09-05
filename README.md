# Seerr Search

<img src="icons/icon128.png" width="96" align="right" alt="Seerr Search icon" />

A Chrome extension for [Seerr](https://github.com/seerr-team/seerr). Select a movie or TV show title on any page, then search your Seerr instance for it — or request it directly without leaving the page.

## Features

- **Search** — right-click selected text → *Search Seerr for "…"* opens your instance's search results in a new tab.
- **Request** — via the right-click menu or a floating button that appears near selected text (configurable). A confirmation dialog shows matching movies and TV shows (people are filtered out), with posters and library/request status. Nothing is requested until you confirm.
- TV requests grab the latest season.
- UI styled to match Seerr itself, Inter Variable and all.

## Install

1. Download or clone this repo.
2. Go to `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the folder.
3. Open the extension's settings:
   - Enter your Seerr address.
   - Paste your API key (Seerr → Settings → General → API Key) — only needed for requesting; searching works without it.
   - Pick your request trigger: right-click menu, floating button, or both.
4. When you save, Chrome will ask to grant the extension access to your Seerr address — this is required for the request dialog to reach the API.

Requests are submitted as the user who owns the API key.

## Notes

- The floating button requires a content script on all pages, which is why Chrome shows the "read and change all your data on websites" warning. The script only watches text selection and renders the button.
- Works with instances reached over LAN, Tailscale, or a reverse proxy — the address is just a URL, including any subpath.

## Credits

- [Seerr](https://github.com/seerr-team/seerr) — logo mark used in the icon, and the UI this extension imitates.
- [Inter](https://github.com/rsms/inter) — bundled under the [SIL Open Font License](fonts/LICENSE).
