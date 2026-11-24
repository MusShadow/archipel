// Point d'entrée : styles, voix, sons, puis premier écran.
import { app } from "./app";
import { nav } from "./nav";
import { registerChildScreens } from "./screens/child";
import { registerParentScreens } from "./screens/parent";
import { SCREENS_CSS } from "./screens/styles";
import { audioPlayback, natural, sfx, speech } from "./services";
import { CSS } from "./ui";
import { FETE_CSS } from "./fete";
import { CSS_COMPOSANTS } from "./design/composants";
import { cssVariables } from "./design/jetons";
import { estVitrine, pageVitrine } from "./vitrine";
import { ILE_CSS } from "./screens/ile";
import { VIVANT_CSS } from "./screens/vivant";
import { CADRE_CSS, PEAU_ACTIVITE_CSS } from "./host";
import { STYLES_L2 } from "./screens/styles2";
import { DESSINS_CSS } from "./design/dessins";
import { STYLES_L3 } from "./screens/styles3";
import { STYLES_L4 } from "./screens/styles4";

const style = document.createElement("style");
// Système de design d'Archipel 2 (variables et composants album), puis les styles des écrans.
style.textContent = cssVariables() + CSS_COMPOSANTS + CSS + PEAU_ACTIVITE_CSS + SCREENS_CSS + FETE_CSS + ILE_CSS + VIVANT_CSS + CADRE_CSS + STYLES_L2 + DESSINS_CSS + STYLES_L3 + STYLES_L4;
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
// Vitrine du système de design (adresse …#vitrine) : page cachée, pour juger les fondations sur l'iPad.
if (estVitrine()) app.show(pageVitrine());
else if (app.data.profiles.length) nav.start(); else nav.setup();
window.addEventListener("hashchange", () => {
  if (estVitrine()) app.show(pageVitrine());
  else if (document.querySelector(".v-page")) location.reload(); // retour arrière : on quitte la vitrine
});
