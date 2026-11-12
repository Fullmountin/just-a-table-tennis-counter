// Oberfläche der Tischtennis-Web-App. Die Spielregeln stehen in match.js (TT).
(function () {
  const KEY = "tischtennis.spielstand.v1";
  const NAMES = ["Spieler 1", "Spieler 2"];
  const app = document.getElementById("app");
  const toast = document.getElementById("toast");
  const modal = document.getElementById("modal");
  const UNDO_ICON = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  let state = load(); // { match: Match|null, history: Match[] }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === "object" && "match" in s && Array.isArray(s.history)) return s;
    } catch (e) {}
    return { match: null, history: [] };
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function buzz(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
  }

  // ---------- Aktionen ----------
  function start(server) {
    state = { match: TT.newMatch(server), history: [] };
    save();
    render();
  }

  function point(p) {
    const m = state.match;
    if (!m || TT.winner(m) !== null) return;
    const wasSwapped = TT.sidesSwapped(m);
    const { match: next, setWinner } = TT.addPoint(m, p);
    state.history.push(m);
    state.match = next;
    save();
    render();

    const over = TT.winner(next) !== null;
    if (over) {
      hideToast();
      buzz([80, 80, 80, 80, 200]);
    } else if (setWinner !== null) {
      showToast("Satz an " + NAMES[setWinner] + "!<br>Seitenwechsel");
      buzz([60, 60, 60]);
    } else if (TT.sidesSwapped(next) !== wasSwapped) {
      showToast("Seitenwechsel!");
      buzz([60, 60, 60]);
    } else {
      buzz(25);
    }
  }

  function undo() {
    if (!state.history.length) return;
    state.match = state.history.pop();
    hideToast();
    save();
    render();
  }

  function newGame() {
    state = { match: null, history: [] };
    hideToast();
    save();
    render();
  }

  // ---------- Hinweis ----------
  let toastTimer = null;
  function showToast(html) {
    toast.innerHTML = html;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 2500);
  }
  function hideToast() {
    clearTimeout(toastTimer);
    toast.classList.remove("show");
  }

  // ---------- Darstellung ----------
  function render() {
    const m = state.match;
    if (!m) app.innerHTML = startScreen();
    else if (TT.winner(m) !== null) app.innerHTML = winnerScreen(m);
    else app.innerHTML = gameScreen(m);
  }

  function startScreen() {
    return `
      <h1 class="start-title">Wer hat Aufschlag?</h1>
      <div class="pair">
        ${[0, 1].map((p) => `
          <button class="choice p${p}" data-action="start" data-p="${p}">
            <span class="emoji">🏓</span>
            <span class="label">${NAMES[p]}</span>
          </button>`).join("")}
      </div>`;
  }

  function gameScreen(m) {
    const server = TT.server(m);
    const order = TT.sidesSwapped(m) ? [1, 0] : [0, 1];
    const past = m.finishedSets.map((s) => s[0] + ":" + s[1]).join(" ");
    return `
      <div class="header">
        <div>
          <div class="title">Satz ${TT.setNumber(m)}</div>
          ${past ? `<div class="past">${past}</div>` : ""}
        </div>
        <button class="small-btn" data-action="ask-new">Neues Spiel</button>
      </div>
      <div class="pair">
        ${order.map((p) => {
          const serving = server === p;
          const pts = m.points[p];
          const sets = TT.setsWon(m, p);
          return `
          <button class="field p${p}${serving ? " serving" : ""}" data-action="point" data-p="${p}"
                  aria-label="${NAMES[p]}: ${pts} Punkte, ${sets} Sätze${serving ? ", hat Aufschlag" : ""}. Tippen für einen Punkt.">
            <span class="name">${NAMES[p]}</span>
            <span class="score">${pts}</span>
            <span class="sets">Sätze: ${sets}</span>
            <span class="badge">🏓 Aufschlag</span>
          </button>`;
        }).join("")}
      </div>
      <button class="undo" data-action="undo" ${state.history.length ? "" : "disabled"}>${UNDO_ICON} Rückgängig</button>`;
  }

  function winnerScreen(m) {
    const w = TT.winner(m);
    return `
      <div class="winner">
        <div class="headline p${w}">
          <div class="who">🏆 ${NAMES[w]}<br>hat gewonnen!</div>
          <div class="result">Sätze&nbsp; ${TT.setsWon(m, 0)} : ${TT.setsWon(m, 1)}</div>
        </div>
        <div class="sets-table">
          <div class="sets-head"><span></span><span class="p0">${NAMES[0]}</span><span class="p1">${NAMES[1]}</span></div>
          ${m.finishedSets.map((s, i) => {
            const sw = TT.setWinnerOf(s);
            return `
            <div class="set-row" aria-label="Satz ${i + 1}: ${s[0]} zu ${s[1]}, gewonnen von ${NAMES[sw]}">
              <div class="inner">
                <span class="label">Satz ${i + 1}</span>
                <span class="chip c0${sw === 0 ? " won" : ""}">${s[0]}</span>
                <span class="chip c1${sw === 1 ? " won" : ""}">${s[1]}</span>
              </div>
            </div>`;
          }).join("")}
        </div>
        <div class="buttons">
          <button class="big-white" data-action="new">Neues Spiel</button>
          <button class="outline" data-action="undo">${UNDO_ICON} Rückgängig</button>
        </div>
      </div>`;
  }

  // ---------- Eingaben ----------
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    keepAwake();
    const p = Number(el.dataset.p);
    switch (el.dataset.action) {
      case "start": start(p); break;
      case "point": point(p); break;
      case "undo": undo(); break;
      case "new": newGame(); break;
      case "ask-new": modal.classList.add("show"); break;
      case "confirm-new": modal.classList.remove("show"); newGame(); break;
      case "cancel-new": modal.classList.remove("show"); break;
    }
  });

  // ---------- Bildschirm wach halten (wo der Browser es erlaubt) ----------
  let wakeLock = null;
  async function keepAwake() {
    try {
      if (!wakeLock && "wakeLock" in navigator && document.visibilityState === "visible") {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => { wakeLock = null; });
      }
    } catch (e) { wakeLock = null; }
  }
  document.addEventListener("visibilitychange", keepAwake);

  // ---------- Offline-Betrieb ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  render();
  keepAwake();
})();
