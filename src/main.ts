// Point d'entrée : styles, voix, sons, puis premier écran.
import { app } from "./app";
import { nav } from "./nav";
import { registerChildScreens } from "./screens/child";
import { registerParentScreens } from "./screens/parent";
import { SCREENS_CSS } from "./screens/styles";
import { audioPlayback, natural, sfx, speech } from "./services";
import { CSS } from "./ui";
import { FETE_CSS } from "./fete";

const style = document.createElement("style");
style.textContent = CSS + SCREENS_CSS + FETE_CSS;
document.head.appendChild(style);

app.root = document.getElementById("app")!;
speech.rate = app.data.settings.rate;
speech.init(app.data.settings.voiceURI);
// Voix naturelle de Plume : pack de phrases enregistrées (la voix de l'appareil reste en secours).
speech.mode = app.data.settings.voix;
speech.childName = () => app.profile?.name ?? null;
if (speech.mode === "naturelle") void natural.init();
// Pour les tests de bout en bout et le diagnostic : état de la voix, phrases dites par la voix de l'appareil.
(globalThis as any).__archipelVoix = { natural, speech };

// Le son ne peut démarrer qu'après un contact de l'enfant (règle des navigateurs). Safari (iPad) n'accepte que la fin
// d'un appui ou un clic, coupe le son des pages en mode silencieux et peut l'interrompre : session « playback »,
// relance à chaque contact et au retour dans l'appli.
audioPlayback();
window.addEventListener("pointerdown", () => sfx.unlock(false), { passive: true, capture: true });
for (const ev of ["pointerup", "touchend", "click", "keydown"]) window.addEventListener(ev, () => sfx.unlock(true), { passive: true, capture: true });
document.addEventListener("visibilitychange", () => { if (!document.hidden) sfx.unlock(false); });
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
