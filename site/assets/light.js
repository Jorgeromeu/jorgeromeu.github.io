// Light/dark toggle (sun/moon in the nav). Remembers the choice.
(() => {
  const SUN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>';

  const root = document.documentElement;
  const btn = document.createElement("button");
  btn.className = "theme-toggle";
  document.querySelector("nav").append(btn);
  btn.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));

  function setTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch {}
    btn.innerHTML = t === "dark" ? MOON : SUN;
    btn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }

  setTheme(root.dataset.theme || "light");
})();
