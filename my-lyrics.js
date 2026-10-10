(function MyLyrics() {
  if (!Spicetify.Player || !Spicetify.showNotification) {
    setTimeout(MyLyrics, 300);
    return;
  }


  // ---------- ЗАПОМИНАЕМ, ОТКРЫТО ЛИ ОКНО ----------
  const STORE_KEY = "my-lyrics-open";
  function loadOpenState() {
    try { return localStorage.getItem(STORE_KEY) === "1"; } catch (e) { return false; }
  }
  function saveOpenState(v) {
    try { localStorage.setItem(STORE_KEY, v ? "1" : "0"); } catch (e) {}
  }

  // ---------- СТИЛИ ----------
  const style = document.createElement("style");
  style.textContent = `
    @property --c1 { syntax: "<color>"; inherits: true; initial-value: #3a3a3a; }
    @property --c2 { syntax: "<color>"; inherits: true; initial-value: #2a2a2a; }
    @property --c3 { syntax: "<color>"; inherits: true; initial-value: #202020; }

    #my-lyrics {
      position: fixed; inset: 0; z-index: 9999;
      display: none;
      align-items: center; justify-content: center; gap: 40px;
      background: #111; color: white; overflow: hidden;
      border-radius: 8px;
      --u: 1;
      transition: --c1 1.5s ease, --c2 1.5s ease, --c3 1.5s ease;
    }
    #my-lyrics.open { display: flex; }

    #my-lyrics .bg {
      position: absolute; inset: -60px;
      background-size: cover; background-position: center;
      filter: blur(60px) saturate(1.6) brightness(0.6);
      opacity: 0.6;
      animation: lyricsDrift 40s ease-in-out infinite alternate;
    }
    @keyframes lyricsDrift {
      from { transform: scale(1.3) rotate(0deg); }
      to   { transform: scale(1.6) rotate(12deg); }
    }

    #my-lyrics .glow {
      position: absolute; inset: -10%;
      background:
        radial-gradient(60% 70% at 15% 20%, var(--c1), transparent 70%),
        radial-gradient(55% 65% at 85% 30%, var(--c2), transparent 70%),
        radial-gradient(70% 60% at 50% 100%, var(--c3), transparent 70%);
      opacity: 0.85;
      animation: glowShift 25s ease-in-out infinite alternate;
    }
    @keyframes glowShift {
      from { transform: scale(1) translate(0, 0); }
      to   { transform: scale(1.2) translate(3%, -3%); }
    }

    #my-lyrics .shade { position: absolute; inset: 0; background: rgba(0,0,0,0.28); }

    #my-lyrics .left, #my-lyrics .right { position: relative; }
    #my-lyrics .left { width: 36%; max-width: 340px; text-align: center; }
    #my-lyrics .cover {
      width: 100%; aspect-ratio: 1 / 1; object-fit: cover;
      border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    #my-lyrics .title {
      font-size: calc(26px * var(--u)); font-weight: 800; margin-top: 18px;
    }
    #my-lyrics .artist {
      font-size: calc(14px * var(--u)); opacity: 0.7; margin-top: 6px;
      text-transform: uppercase; letter-spacing: 0.12em;
    }

    #my-lyrics .right {
      width: 48%; height: 88%; overflow-y: auto; scrollbar-width: none;
      -webkit-mask-image: linear-gradient(transparent, #000 15%, #000 85%, transparent);
      mask-image: linear-gradient(transparent, #000 15%, #000 85%, transparent);
    }
    #my-lyrics .right::-webkit-scrollbar { display: none; }

    /* Отступ справа, чтобы увеличенная строка не обрезалась */
    #my-lyrics .lines { padding: 34% 32px 34% 0; }

    #my-lyrics .line {
      font-size: calc(28px * var(--u)); font-weight: 700;
      margin: calc(16px * var(--u)) 0;
      opacity: 0.35; cursor: pointer; filter: blur(1.5px);
      transform-origin: left center;
      transition: opacity 0.4s, transform 0.4s, filter 0.4s;
    }
    #my-lyrics .line:hover { filter: blur(0); opacity: 0.7; }
    #my-lyrics .line.active { opacity: 1; transform: scale(1.04); filter: blur(0); }
    #my-lyrics .status { font-size: calc(22px * var(--u)); opacity: 0.85; }

    .ml-btn {
      background: none; border: none; color: #b3b3b3; cursor: pointer;
      padding: 0 8px; height: 32px; display: inline-flex; align-items: center;
    }
    .ml-btn:hover { color: #fff; }
    .ml-btn.on { color: #1db954; }
    .ml-btn.float {
      position: fixed; bottom: 90px; right: 20px; z-index: 10000;
      width: 40px; height: 40px; border-radius: 50%; justify-content: center;
      background: #1db954; color: #000; padding: 0;
    }
    .ml-btn.float:hover { color: #000; }
  `;
  document.head.appendChild(style);

  // ---------- РАЗМЕТКА ----------
  const root = document.createElement("div");
  root.id = "my-lyrics";
  root.innerHTML = `
    <div class="bg"></div>
    <div class="glow"></div>
    <div class="shade"></div>
    <div class="left">
      <img class="cover" />
      <div class="title"></div>
      <div class="artist"></div>
    </div>
    <div class="right"><div class="lines"></div></div>
  `;
  document.body.appendChild(root);

  const rightEl = root.querySelector(".right");
  const linesEl = root.querySelector(".lines");

  // ---------- ПОДГОНКА ПОД ЦЕНТРАЛЬНУЮ ОБЛАСТЬ ----------
  function place() {
    const host =
      document.querySelector(".Root__main-view") ||
      document.querySelector("main");
    if (!host) return;
    const r = host.getBoundingClientRect();
    root.style.inset = "auto";
    root.style.left = r.left + "px";
    root.style.top = r.top + "px";
    root.style.width = r.width + "px";
    root.style.height = r.height + "px";

    const u = Math.max(0.6, Math.min(1.6, Math.min(r.width / 1070, r.height / 610)));
    root.style.setProperty("--u", u.toFixed(2));
  }
  setInterval(() => {
    if (root.classList.contains("open")) place();
  }, 300);
  window.addEventListener("resize", place);

  // ---------- ТЕКСТЫ ----------
  let lyrics = [];      // { time: секунды, text: "фраза", el: элемент }
  let lastUri = null;
  let activeIdx = -1;

  function setStatus(text) {
    linesEl.innerHTML = "";
    const d = document.createElement("div");
    d.className = "status";
    d.textContent = text;
    linesEl.appendChild(d);
  }

  // Формат LRCLIB: "[01:23.45] фраза"
  function parseLrc(lrc) {
    const result = [];
    for (const raw of lrc.split("\n")) {
      const m = raw.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/);
      if (!m) continue;
      result.push({
        time: parseInt(m[1]) * 60 + parseFloat(m[2]),
        text: m[3] || "♪",
      });
    }
    return result;
  }

  function renderLyrics() {
    linesEl.innerHTML = "";
    lyrics.forEach((l) => {
      const d = document.createElement("div");
      d.className = "line";
      d.textContent = l.text;
      d.onclick = () => Spicetify.Player.seek(l.time * 1000);
      l.el = d;
      linesEl.appendChild(d);
    });
    activeIdx = -1;
  }

  // Источник 1: тексты самого Spotify (те, что вы видите в приложении)
  async function fetchSpotifyLyrics(item) {
    if (!item.uri || item.uri.indexOf("spotify:track:") !== 0) return null;
    const id = item.uri.split(":")[2];
    try {
      const res = await Spicetify.CosmosAsync.get(
        "https://spclient.wg.spotify.com/color-lyrics/v2/track/" + id +
        "?format=json&vocalRemoval=false&market=from_token"
      );
      const data = res && res.lyrics;
      if (!data || data.syncType !== "LINE_SYNCED" || !data.lines) return null;
      const lines = data.lines
        .map((l) => ({
          time: parseInt(l.startTimeMs) / 1000,
          text: (l.words || "").trim() || "♪",
        }))
        .filter((l) => !isNaN(l.time));
      return lines.length ? lines : null;
    } catch (e) {
      console.warn("Тексты Spotify недоступны:", e);
      return null;
    }
  }

  // Источник 2 (запасной): LRCLIB
  async function fetchLrclibLyrics(item) {
    const title = item.metadata.title || "";
    const artist = item.metadata.artist_name || "";
    const cleanTitle = title.replace(/\s*[\(\[].*?[\)\]]\s*/g, " ").trim();
    const duration = Math.round(Spicetify.Player.getDuration() / 1000);

    try {
      let data = null;

      let res = await fetch(
        "https://lrclib.net/api/get?track_name=" + encodeURIComponent(title) +
        "&artist_name=" + encodeURIComponent(artist) +
        "&duration=" + duration
      );
      if (res.ok) data = await res.json();

      if (!data || !data.syncedLyrics) {
        res = await fetch(
          "https://lrclib.net/api/search?track_name=" + encodeURIComponent(cleanTitle) +
          "&artist_name=" + encodeURIComponent(artist)
        );
        if (res.ok) {
          const list = await res.json();
          data = list.find((x) => x.syncedLyrics) || null;
        }
      }

      if (data && data.syncedLyrics) {
        const lines = parseLrc(data.syncedLyrics);
        return lines.length ? lines : null;
      }
      return null;
    } catch (e) {
      console.warn("LRCLIB недоступен:", e);
      return null;
    }
  }

  async function loadLyrics() {
    const item = Spicetify.Player.data?.item;
    if (!item || item.uri === lastUri) return;
    lastUri = item.uri;
    lyrics = [];
    setStatus("Ищу текст...");

    const uri = item.uri;

    let found = await fetchSpotifyLyrics(item);
    if (lastUri !== uri) return;

    if (!found) {
      found = await fetchLrclibLyrics(item);
      if (lastUri !== uri) return;
    }

    if (found) {
      lyrics = found;
      renderLyrics();
    } else {
      setStatus("Для этой песни нет синхронизированного текста");
    }
  }

  // ---------- ЦВЕТА ИЗ ОБЛОЖКИ ----------
  async function updateColors(uri) {
    try {
      if (!Spicetify.colorExtractor) return;
      const c = await Spicetify.colorExtractor(uri);
      if (!c || Spicetify.Player.data?.item?.uri !== uri) return;
      const c1 = c.VIBRANT_NON_ALARMING || c.VIBRANT || c.PROMINENT || "#3a3a3a";
      const c2 = c.PROMINENT || c.DESATURATED || c1;
      const c3 = c.LIGHT_VIBRANT || c.DESATURATED || c1;
      root.style.setProperty("--c1", c1);
      root.style.setProperty("--c2", c2);
      root.style.setProperty("--c3", c3);
    } catch (e) {
      console.error("Не удалось взять цвета обложки:", e);
    }
  }

  // ---------- ПОДСВЕТКА ТЕКУЩЕЙ СТРОКИ ----------
  setInterval(() => {
    if (!root.classList.contains("open") || lyrics.length === 0 || !lyrics[0].el) return;

    const pos = Spicetify.Player.getProgress() / 1000;
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= pos) idx = i;
      else break;
    }
    if (idx === activeIdx) return;

    if (lyrics[activeIdx]?.el) lyrics[activeIdx].el.classList.remove("active");
    activeIdx = idx;

    const cur = lyrics[idx];
    if (cur?.el) {
      cur.el.classList.add("active");
      rightEl.scrollTo({
        top: cur.el.offsetTop - rightEl.clientHeight / 2 + cur.el.clientHeight / 2,
        behavior: "smooth",
      });
    }
  }, 100);

  // ---------- ОБНОВЛЕНИЕ ПРИ СМЕНЕ ТРЕКА ----------
  function update() {
    const item = Spicetify.Player.data?.item;
    if (!item) return;

    const m = item.metadata;
    const raw = m.image_xlarge_url || m.image_large_url || m.image_url || "";
    const cover = raw.replace("spotify:image:", "https://i.scdn.co/image/");

    root.querySelector(".cover").src = cover;
    root.querySelector(".bg").style.backgroundImage = `url(${cover})`;
    root.querySelector(".title").textContent = m.title || "";
    root.querySelector(".artist").textContent = m.artist_name || "";

    updateColors(item.uri);
    loadLyrics();
  }

  update();
  Spicetify.Player.addEventListener("songchange", update);

  // ---------- КНОПКА ----------
  const btn = document.createElement("button");
  btn.className = "ml-btn float";
  btn.title = "Мои тексты (Alt+L)";
  btn.innerHTML =
    '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">' +
    '<path d="M2 3h12v1.5H2zM2 7h12v1.5H2zM2 11h8v1.5H2z"/></svg>';
  document.body.appendChild(btn);

  function mountButton() {
    const anchor =
      document.querySelector('[data-testid="lyrics-button"]') ||
      Array.from(document.querySelectorAll(".main-nowPlayingBar-extraControls button"))
        .find((b) => b !== btn);

    if (anchor && anchor.parentElement) {
      if (btn.parentElement !== anchor.parentElement) {
        anchor.parentElement.insertBefore(btn, anchor);
      }
      btn.classList.remove("float");
    } else if (btn.parentElement !== document.body) {
      document.body.appendChild(btn);
      btn.classList.add("float");
    }
  }
  mountButton();
  setInterval(mountButton, 1000);

  // ---------- ОТКРЫТИЕ И ЗАКРЫТИЕ ----------
  function setOpen(v) {
    if (v) {
      update();
      place();
    }
    root.classList.toggle("open", v);
    btn.classList.toggle("on", v);
    saveOpenState(v);
  }
  function toggle() {
    setOpen(!root.classList.contains("open"));
  }

  btn.onclick = toggle;

  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.code === "KeyL") toggle();
    if (e.key === "Escape" && root.classList.contains("open")) setOpen(false);
  });

  // Если окно было открыто при прошлом закрытии Spotify — открываем снова
  if (loadOpenState()) setTimeout(() => setOpen(true), 1500);
})();
