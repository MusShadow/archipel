// Composants de base d'Archipel 2, dans la finition « album illustré » : bouton rond, pastille d'activité,
// ruban de titre, bulle de Plume et carte de réponse. Ils ne lisent que les variables du système de design
// (jetons.ts) ; les écrans de la livraison 2 les assemblent. La vitrine (#vitrine) les montre tous.
import { h, ICON_PATHS } from "../ui";
import { CONSEIL, type IleId } from "./jetons";

const svgIcone = (nom: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" class="a-ico">${ICON_PATHS[nom] ?? ""}</svg>`;
export const accent = (ile?: IleId) => (ile ? `--accent:var(--ile-${ile}-vif);--accent-fonce:var(--ile-${ile}-fonce);--accent-ombre:var(--ile-${ile}-ombre);--accent-clair:var(--ile-${ile}-clair)` : null);

type Clic = (e: Event) => void;


// Bouton rond : maison, oreille, carte… Une icône, jamais de texte ; son nom est lu par VoiceOver.
// La taille « petit » (moins de 1,5 cm) est réservée aux actions de l'adulte, jamais à l'enfant.
export function boutonRond(o: { icone: string; etiquette: string; onclick?: Clic; ile?: IleId; taille?: "petit" | "grand"; html?: string }) {
  return h("button", {
    type: "button", class: `a-rond${o.taille ? ` ${o.taille}` : ""}${o.ile ? " teinte" : ""}`, "aria-label": o.etiquette,
    style: accent(o.ile), onclick: o.onclick, html: o.html ?? svgIcone(o.icone),
  }) as HTMLButtonElement;
}

// Pastille d'activité : l'étiquette d'un lieu sur l'île. « Conseillée » : la couleur de Plume et son badge.
export function pastille(o: { titre: string; ile: IleId; conseillee?: boolean; onclick?: Clic; image?: string }) {
  return h("button", { type: "button", class: `a-pastille${o.conseillee ? " conseillee" : ""}`, style: accent(o.ile), onclick: o.onclick },
    o.conseillee ? h("span", { class: "a-badge" }, "Plume conseille") : null,
    o.image ? h("span", { class: "a-pastille-img", "aria-hidden": "true", html: o.image }) : null,
    h("span", { class: "a-pastille-txt" }, o.titre),
  ) as HTMLButtonElement;
}

// Ruban de titre : le nom de l'île ou de l'activité, avec la pastille de couleur de l'île.
export function ruban(o: { texte: string; ile: IleId; cls?: string }) {
  return h("div", { class: `a-ruban${o.cls ? ` ${o.cls}` : ""}`, style: accent(o.ile) },
    h("span", { class: "a-ruban-bout g", "aria-hidden": "true" }),
    h("span", { class: "a-ruban-bout d", "aria-hidden": "true" }),
    h("span", { class: "a-ruban-corps" },
      h("span", { class: "a-ruban-pt", "aria-hidden": "true" }),
      h("span", { class: "a-ruban-txt" }, o.texte)));
}

// Bulle de Plume : ce que Plume vient de dire. Toucher la bulle le fait répéter ; le texte est facultatif
// (l'enfant ne lit pas encore : la voix compte, le texte sert à l'adulte et à la vitrine).
export function bullePlume(o: { texte?: string; onclick?: Clic; queue?: "gauche" | "droite" }) {
  const b = h("button", { type: "button", class: `a-bulle queue-${o.queue ?? "gauche"}`, "aria-label": o.texte ? `Réécouter Plume : ${o.texte}` : "Réécouter Plume", onclick: o.onclick },
    h("span", { class: "a-bulle-son", "aria-hidden": "true", html: svgIcone("sound") }),
    o.texte ? h("span", { class: "a-bulle-txt" }, o.texte) : null);
  if (!o.texte) b.classList.add("seule");
  return b as HTMLButtonElement;
}

// Carte de réponse : une image ou un mot à toucher. Jamais de rouge : « juste » pose un anneau vert,
// un essai fait seulement balancer la carte (wobble, dans ui.ts).
export type EtatCarte = "normal" | "choisie" | "juste";
export function carte(o: { contenu: Node | string; etiquette: string; onclick?: Clic; ile?: IleId; large?: boolean }) {
  const c = h("button", { type: "button", class: `a-carte${o.large ? " large" : ""}`, "aria-label": o.etiquette, "aria-pressed": "false", style: accent(o.ile), onclick: o.onclick });
  // une chaîne est affichée comme du texte (jamais interprétée comme du HTML) ; une image se passe en nœud
  if (typeof o.contenu === "string") c.textContent = o.contenu; else c.appendChild(o.contenu);
  return c as HTMLButtonElement;
}
export function etatCarte(c: Element, etat: EtatCarte) {
  c.classList.toggle("choisie", etat === "choisie");
  c.classList.toggle("juste", etat === "juste");
  c.setAttribute("aria-pressed", etat === "normal" ? "false" : "true");
}

const s = (n: number, min: number) => `max(${min}px,calc(var(--u) * ${n}))`;
// pour une marge négative (zone de toucher agrandie, débord) : la plus grande des deux, au moins |min| px
const sn = (n: number, min: number) => `min(${min}px,calc(var(--u) * ${n}))`;
export const CSS_COMPOSANTS = `
.a-ico{width:46%;height:46%;fill:none;stroke:var(--accent-fonce,var(--encre));stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round}
.a-rond{width:var(--cible-bouton);height:var(--cible-bouton);flex:0 0 auto;padding:0;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;
background:radial-gradient(circle at 34% 28%,#FFFFFF 0%,var(--surface) 55%,#F4E6CE 100%);border:${s(2.5, 2)} solid var(--bord);box-shadow:var(--ombre-posee),var(--ombre-reflet);
transition:transform var(--duree-appui) var(--courbe-douce),box-shadow var(--duree-appui) var(--courbe-douce)}
.a-rond:active{transform:translateY(2px) scale(.96);box-shadow:0 1px 0 rgba(122,86,50,.2),var(--ombre-reflet)}
.a-rond.petit{width:var(--cible-petit);height:var(--cible-petit)}
.a-rond.grand{width:calc(var(--cible-bouton) * 1.22);height:calc(var(--cible-bouton) * 1.22)}
.a-rond.teinte{background:radial-gradient(circle at 34% 28%,#FFFFFF 0%,var(--accent-clair) 60%,var(--accent-clair) 100%)}
.a-pastille{position:relative;display:inline-flex;align-items:center;gap:${s(10, 6)};min-height:${s(58, 46)};padding:0 ${s(24, 16)};border-radius:var(--rayon-pilule);cursor:pointer;
background:linear-gradient(180deg,#FFFFFF 0%,var(--surface) 60%);border:${s(2.5, 2)} solid var(--bord);box-shadow:var(--ombre-posee);color:var(--encre);font:var(--texte-etiquette);white-space:nowrap;
transition:transform var(--duree-appui) var(--courbe-douce)}
.a-pastille::after{content:"";position:absolute;left:${sn(-12, -8)};right:${sn(-12, -8)};top:min(-8px,calc((100% - var(--cible-min)) / 2 - 2px));bottom:min(-8px,calc((100% - var(--cible-min)) / 2 - 2px))}
.a-pastille:active{transform:translateY(2px) scale(.97)}
.a-pastille-img{width:${s(40, 28)};height:${s(40, 28)};border-radius:50%;overflow:hidden;flex:0 0 auto;margin-left:${sn(-12, -8)};background:var(--accent-clair)}
.a-pastille-img img,.a-pastille-img svg{display:block;width:100%;height:100%;object-fit:cover}
.a-pastille.conseillee{background:linear-gradient(180deg,${CONSEIL.haut} 0%,var(--ile-port-fonce) 55%);border-color:var(--ile-port-ombre);color:var(--blanc);box-shadow:0 3px 0 rgba(13,90,96,.35)}
.a-badge{position:absolute;left:50%;bottom:calc(100% + ${s(8, 6)});transform:translateX(-50%);padding:${s(3, 2)} ${s(12, 8)};border-radius:var(--rayon-pilule);background:var(--papier);
border:${s(2, 1.5)} solid var(--bord);box-shadow:var(--ombre-posee);color:var(--ile-port-fonce);font:600 ${s(14, 12)}/1.2 var(--police-adulte);white-space:nowrap;pointer-events:none}
.a-ruban{position:relative;display:inline-flex;isolation:isolate;margin:0 ${s(22, 14)}}
.a-ruban-corps{position:relative;z-index:1;display:inline-flex;align-items:center;gap:${s(12, 8)};padding:${s(10, 7)} ${s(30, 18)} ${s(10, 7)} ${s(20, 12)};border-radius:${s(18, 12)};
background:linear-gradient(180deg,#FFFFFF 0%,var(--surface) 55%);border:${s(2.5, 2)} solid var(--bord);box-shadow:var(--ombre-posee)}
.a-ruban-bout{position:absolute;z-index:0;top:30%;width:${s(34, 22)};height:78%;background:linear-gradient(180deg,#EFDDBD 0%,#E2CBA6 100%)}
.a-ruban-bout.g{right:calc(100% - ${s(12, 8)});clip-path:polygon(0 0,100% 0,100% 100%,0 100%,36% 50%)}
.a-ruban-bout.d{left:calc(100% - ${s(12, 8)});clip-path:polygon(0 0,100% 0,64% 50%,100% 100%,0 100%)}
.a-ruban-pt{width:${s(18, 12)};height:${s(18, 12)};border-radius:50%;flex:0 0 auto;background:var(--accent,var(--ile-port-vif));box-shadow:inset 0 -2px 0 rgba(0,0,0,.12)}
.a-ruban-txt{font:800 ${s(29, 20)}/1 var(--police-titre);color:var(--encre);white-space:nowrap}
.a-bulle{position:relative;display:inline-flex;align-items:center;gap:${s(12, 8)};max-width:${s(560, 300)};min-height:var(--cible-min);padding:${s(10, 8)} ${s(20, 14)};
border-radius:${s(22, 16)};background:var(--papier);border:${s(2.5, 2)} solid var(--bord);box-shadow:var(--ombre-posee);color:var(--encre);text-align:left;cursor:pointer}
.a-bulle.seule{width:var(--cible-min);padding:0;justify-content:center}
.a-bulle::after{content:"";position:absolute;bottom:${sn(-11, -8)};width:${s(20, 14)};height:${s(20, 14)};background:var(--papier);border-style:solid;border-color:var(--bord);border-width:0 ${s(2.5, 2)} ${s(2.5, 2)} 0}
.a-bulle.queue-gauche::after{left:${s(22, 14)};transform:rotate(45deg) skew(12deg,12deg)}
.a-bulle.queue-droite::after{right:${s(22, 14)};transform:rotate(45deg) skew(12deg,12deg)}
.a-bulle-son{width:${s(40, 30)};height:${s(40, 30)};flex:0 0 auto;display:flex;align-items:center;justify-content:center}
.a-bulle-son .a-ico{width:100%;height:100%;stroke:var(--ile-port-fonce)}
.a-bulle-txt{font:var(--texte-bulle)}
.a-carte{position:relative;display:flex;align-items:center;justify-content:center;width:${s(190, 120)};height:${s(190, 120)};padding:${s(14, 8)};border-radius:var(--rayon-moyen);cursor:pointer;
background:linear-gradient(180deg,#FFFFFF 0%,var(--papier) 70%,#FBF3E4 100%);border:${s(3, 2)} solid var(--bord);box-shadow:var(--ombre-douce),var(--ombre-reflet);color:var(--encre);
transition:transform var(--duree-appui) var(--courbe-douce),border-color var(--duree-court),box-shadow var(--duree-court)}
.a-carte.large{width:${s(300, 190)}}
.a-carte:active{transform:translateY(2px) scale(.97)}
.a-carte img,.a-carte svg{display:block;max-width:100%;max-height:100%}
.a-carte.choisie{border-color:var(--accent,var(--ile-port-vif))}
.a-carte.juste{border-color:var(--juste);box-shadow:0 0 0 ${s(6, 4)} var(--juste-halo),var(--ombre-douce);animation:a-juste var(--duree-long) var(--courbe-rebond)}
@keyframes a-juste{0%{transform:scale(1)}45%{transform:scale(1.06)}100%{transform:scale(1)}}
`;
