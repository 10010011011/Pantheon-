window.addEventListener("DOMContentLoaded", () => {
  const results = Game.SelfTest.run();
  const diagEl = document.getElementById("diag");
  const failCount = Game.SelfTest.renderTo(diagEl, results);
  const btn = document.getElementById("diagBtn");
  btn.textContent = failCount === 0 ? "\u2713 " + results.length + " checks" : "\u2717 " + failCount + " FAILED";
  btn.className = failCount === 0 ? "ok" : "bad";
  btn.addEventListener("click", () => { document.body.classList.toggle("diagOpen"); });
  if (failCount > 0) console.error("[FOUNDATION] failed:", results.filter((r) => !r.pass));
  else console.log("[FOUNDATION] all checks passed.");
  Game.Boot.start();
});
window.Game = Game;
