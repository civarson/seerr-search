(() => {
  let trigger = "menu";
  let host = null;
  let button = null;

  chrome.storage.sync.get({ trigger: "menu" }, (s) => (trigger = s.trigger));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.trigger) {
      trigger = changes.trigger.newValue;
      if (!buttonEnabled()) hide();
    }
  });

  function buttonEnabled() {
    return trigger === "button" || trigger === "both";
  }

  function ensureButton() {
    if (host) return;

    host = document.createElement("div");
    host.style.cssText =
      "position:absolute;z-index:2147483647;top:0;left:0;width:0;height:0;";
    const shadow = host.attachShadow({ mode: "closed" });

    // Seerr primary button: border-indigo-500, bg-indigo-600/80, hover solid
    const style = document.createElement("style");
    style.textContent = `
      button {
        position: absolute;
        display: none;
        padding: 6px 12px;
        border: 1px solid #6366f1;
        border-radius: 6px;
        background: rgba(79, 70, 229, 0.9);
        color: #fff;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        font-weight: 500;
        line-height: 1.25;
        white-space: nowrap;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
        transition: background 150ms ease-in-out;
      }
      button:hover { background: #4f46e5; }
    `;

    button = document.createElement("button");
    button.textContent = "Request on Seerr";

    // mousedown, not click: fires before the page clears the selection.
    button.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const text = window.getSelection()?.toString().trim();
      if (text) chrome.runtime.sendMessage({ type: "open-request-dialog", text });
      hide();
    });

    shadow.append(style, button);
    document.documentElement.appendChild(host);
  }

  function hide() {
    if (button) button.style.display = "none";
  }

  function showNearSelection() {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text || text.length > 200 || sel.rangeCount === 0) {
      hide();
      return;
    }

    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      hide();
      return;
    }

    ensureButton();
    button.style.display = "block";
    const left = Math.max(8, Math.min(window.innerWidth - 160, rect.left + window.scrollX));
    button.style.left = `${left}px`;
    button.style.top = `${rect.bottom + window.scrollY + 8}px`;
  }

  document.addEventListener("mouseup", (e) => {
    if (!buttonEnabled()) return;
    if (host && e.composedPath().includes(host)) return;
    setTimeout(showNearSelection, 10);
  });

  document.addEventListener("mousedown", (e) => {
    if (host && e.composedPath().includes(host)) return;
    hide();
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "Escape") hide();
  });
})();
