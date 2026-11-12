// Spiellogik Tischtennis: Best of 5, Sätze bis 11 mit 2 Punkten Vorsprung.
// Spieler sind 0 (Spieler 1) und 1 (Spieler 2).
(function (root) {
  const POINTS_TO_WIN_SET = 11;
  const SETS_TO_WIN = 3;
  const MAX_SETS = 5;

  function newMatch(firstServer) {
    return { firstServer, points: [0, 0], finishedSets: [] };
  }

  const other = (p) => (p === 0 ? 1 : 0);
  const setWinnerOf = (s) => (s[0] > s[1] ? 0 : 1);

  function setsWon(m, p) {
    return m.finishedSets.filter((s) => setWinnerOf(s) === p).length;
  }

  function winner(m) {
    if (setsWon(m, 0) >= SETS_TO_WIN) return 0;
    if (setsWon(m, 1) >= SETS_TO_WIN) return 1;
    return null;
  }

  function setNumber(m) {
    return Math.min(m.finishedSets.length + 1, MAX_SETS);
  }

  // Den ersten Aufschlag im Satz hat abwechselnd der Startspieler bzw. der andere.
  function setStarter(m) {
    return m.finishedSets.length % 2 === 0 ? m.firstServer : other(m.firstServer);
  }

  // Aufschlagwechsel alle 2 Punkte, ab 10:10 nach jedem Punkt.
  function server(m) {
    const [a, b] = m.points;
    const total = a + b;
    const changes = a >= 10 && b >= 10 ? 10 + (total - 20) : Math.floor(total / 2);
    return changes % 2 === 0 ? setStarter(m) : other(setStarter(m));
  }

  // Seitenwechsel nach jedem Satz und im 5. Satz, sobald ein Spieler 5 Punkte hat.
  function sidesSwapped(m) {
    let swaps = m.finishedSets.length;
    if (m.finishedSets.length === MAX_SETS - 1 && Math.max(m.points[0], m.points[1]) >= 5) swaps += 1;
    return swaps % 2 === 1;
  }

  function isSetWon(a, b) {
    return Math.max(a, b) >= POINTS_TO_WIN_SET && Math.abs(a - b) >= 2;
  }

  // Gibt einen neuen Spielstand zurück (das Original bleibt unverändert) und ggf. den Satzgewinner.
  function addPoint(m, p) {
    if (winner(m) !== null) return { match: m, setWinner: null };
    const next = { firstServer: m.firstServer, points: m.points.slice(), finishedSets: m.finishedSets.map((s) => s.slice()) };
    next.points[p] += 1;
    if (isSetWon(next.points[0], next.points[1])) {
      next.finishedSets.push(next.points);
      next.points = [0, 0];
      return { match: next, setWinner: p };
    }
    return { match: next, setWinner: null };
  }

  const api = { newMatch, setsWon, winner, setNumber, setStarter, server, sidesSwapped, isSetWon, addPoint, setWinnerOf, MAX_SETS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.TT = api;
})(this);
