const urlInput = document.getElementById("baseUrl");
const keyInput = document.getElementById("apiKey");
const saveBtn = document.getElementById("save");
const status = document.getElementById("status");

chrome.storage.sync.get({ baseUrl: "", apiKey: "", trigger: "menu", tvSeason: "first" }, (s) => {
  if (s.baseUrl) urlInput.value = s.baseUrl;
  if (s.apiKey) keyInput.value = s.apiKey;
  const triggerRadio = document.querySelector(`input[name="trigger"][value="${s.trigger}"]`);
  if (triggerRadio) triggerRadio.checked = true;
  const seasonRadio = document.querySelector(`input[name="tvSeason"][value="${s.tvSeason}"]`);
  if (seasonRadio) seasonRadio.checked = true;
});

function setStatus(message, kind) {
  status.textContent = message;
  status.className = kind || "";
}

function normalize(raw) {
  let value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = "https://" + value;
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  return (url.origin + url.pathname).replace(/\/+$/, "");
}

async function save() {
  const baseUrl = normalize(urlInput.value);
  if (!baseUrl) {
    setStatus("Enter a valid address, like https://seerr.home.example", "err");
    return;
  }

  const apiKey = keyInput.value.trim();
  const trigger = document.querySelector('input[name="trigger"]:checked').value;
  const tvSeason = document.querySelector('input[name="tvSeason"]:checked').value;

  // Host access so the dialog can call the Seerr API. Must happen in this
  // click handler (needs a user gesture).
  const origin = new URL(baseUrl).origin + "/*";
  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) {
    setStatus("Access to that address was declined — requesting won't work.", "err");
  }

  chrome.storage.sync.set({ baseUrl, apiKey, trigger, tvSeason }, async () => {
    urlInput.value = baseUrl;

    if (granted && apiKey) {
      setStatus("Saved. Testing connection…");
      try {
        const res = await fetch(`${baseUrl}/api/v1/settings/main`, {
          headers: { "X-Api-Key": apiKey },
        });
        if (res.ok) setStatus("Saved. Connected to Seerr ✓", "ok");
        else if (res.status === 403) setStatus("Saved, but Seerr rejected the API key.", "err");
        else setStatus(`Saved, but Seerr returned ${res.status}.`, "err");
      } catch {
        setStatus("Saved, but couldn't reach that address from here.", "err");
      }
    } else {
      setStatus("Saved.", "ok");
    }
  });
}

saveBtn.addEventListener("click", save);
[urlInput, keyInput].forEach((i) =>
  i.addEventListener("keydown", (e) => {
    if (e.key === "Enter") save();
  })
);
