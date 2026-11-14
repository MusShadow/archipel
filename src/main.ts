// Point d'entrée : styles, voix, sons, puis premier écran.
import { app } from "./app";
import { nav } from "./nav";
import { registerChildScreens } from "./screens/child";
import { registerParentScreens } from "./screens/parent";
import { SCREENS_CSS } from "./screens/styles";
import { sfx, speech } from "./services";
import { CSS } from "./ui";

const style = document.createElement("style");
style.textContent = CSS + SCREENS_CSS;
document.head.appendChild(style);

app.root = document.getElementById("app")!;
speech.rate = app.data.settings.rate;
speech.init(app.data.settings.voiceURI);

// Le son ne peut démarrer qu'après un premier contact de l'enfant (règle des navigateurs).
window.addEventListener("pointerdown", () => sfx.unlock(), { passive: true });
// Appli en arrière-plan : le temps de séance s'arrête.
document.addEventListener("visibilitychange", () => (document.hidden ? app.pause("cache") : app.resume("cache")));
// Pas de zoom accidentel au double appui ni de menu contextuel sur les images.
document.addEventListener("dblclick", (e) => e.preventDefault(), { passive: false });
document.addEventListener("contextmenu", (e) => { if (!(e.target as HTMLElement).closest(".parent")) e.preventDefault(); });

// Appli ouverte depuis son adresse (et non intégrée dans une autre page) : copie gardée pour le hors-ligne.
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost") && window.top === window) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => { /* hors-ligne indisponible */ }); });
}

registerChildScreens();
registerParentScreens();
if (app.data.profiles.length) nav.start(); else nav.setup();
