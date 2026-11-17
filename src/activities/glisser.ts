// Plateau « glisser dans la bonne caisse » : des objets en haut (le panier de Basile, le tapis du centre de tri), des
// zones en bas (les poubelles, les caisses). On glisse au doigt ; ou bien on touche l'objet, puis la zone.
// Sert au grand tri (les poubelles) et au voyage des déchets (le centre de tri).
import type { View } from "../host";
import { sfx } from "../services";
import { glow, h, sleep, wobble } from "../ui";

export interface SortZone { id: string; label: string; art: string; say: string }
export interface SortThing { id: string; art: string; name: string }
export interface SortOpts {
  zones: SortZone[]; things: SortThing[]; answers: Record<string, string>;
  head?: string; trayCls?: string; zonesCls?: string;
  // Phrase dite quand l'objet est glissé dans la mauvaise zone.
  wrong: (thing: string, zone: string) => string;
}
export interface SortBoard { current: () => string | null; show: (id: string) => void; place: (id: string, after?: Promise<unknown>) => void }

export function sortBoard(view: View, o: SortOpts): SortBoard {
  const zoneEl = new Map<string, HTMLElement>();
  const row = h("div", { class: `tbins n${o.zones.length}${o.zonesCls ? ` ${o.zonesCls}` : ""}` });
  let selected: string | null = null, focus: string | null = null;
  let lastUp = { t: -1e9, x: NaN, y: NaN };
  const echo = (e: MouseEvent) => e.timeStamp - lastUp.t < 350 && Math.hypot(e.clientX - lastUp.x, e.clientY - lastUp.y) < 4;
  for (const z of o.zones) {
    const el = h("button", { type: "button", class: "tbin", "data-bin": z.id, "aria-label": z.label },
      h("span", { class: "tbinart", html: z.art }), h("span", { class: "tlab" }, z.label));
    el.addEventListener("click", (e) => {
      if (echo(e)) return;
      if (selected) drop(selected, z.id);
      else { sfx.tap(); view.say(z.say); }
    });
    zoneEl.set(z.id, el); row.appendChild(el);
  }
  const tray = h("div", { class: `panel tbasket${o.trayCls ? ` ${o.trayCls}` : ""}` }, o.head ? h("span", { class: "twho", html: o.head }) : null);
  const thingEl = new Map<string, HTMLElement>();
  const art = new Map(o.things.map((t) => [t.id, t.art]));
  const name = new Map(o.things.map((t) => [t.id, t.name]));
  for (const t of o.things) {
    const el = h("span", { class: "titem", "data-item": t.id, role: "button", "aria-label": t.name, html: t.art });
    el.addEventListener("pointerdown", (e) => startDrag(e as PointerEvent, el, t.id));
    thingEl.set(t.id, el); tray.appendChild(el);
  }
  const select = (id: string | null) => {
    selected = id;
    if (id) focus = id;
    thingEl.forEach((el, k) => el.classList.toggle("selected", k === id));
  };
  const flyInto = (src: Element, zone: HTMLElement, id: string) => {
    const a = src.getBoundingClientRect(), t = zone.querySelector(".tbinart")!.getBoundingClientRect();
    if (!a.width || !t.width || !document.body.animate) return;
    const g = h("span", { class: "tghost", html: art.get(id)!, style: `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px` });
    document.body.appendChild(g);
    const dx = t.left + t.width / 2 - (a.left + a.width / 2), dy = t.top + t.height * 0.3 - (a.top + a.height / 2);
    const anim = g.animate([{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 60}px) scale(.9)`, offset: 0.55 },
      { transform: `translate(${dx}px,${dy}px) scale(.25)`, opacity: 0.4 }], { duration: 480, easing: "ease-in-out" });
    anim.onfinish = anim.oncancel = () => g.remove();
  };
  function drop(id: string, zoneId: string, after?: Promise<unknown>) {
    const el = thingEl.get(id), zone = zoneEl.get(zoneId);
    if (!el || !zone || !el.isConnected) return;
    select(null);
    if (o.answers[id] === zoneId) {
      flyInto(el, zone, id);
      el.remove(); thingEl.delete(id);
      if (focus === id) focus = null;
      zoneEl.forEach((z) => glow(z, false));
      zone.classList.add("open"); setTimeout(() => zone.classList.remove("open"), 650);
      sfx.drum();
      if (!thingEl.size) Promise.all([after, sleep(500)]).then(() => { if (view.stage.isConnected) view.answer(true, zone); });
    } else {
      focus = id;
      wobble(el);
      view.answer(false, zone, o.wrong(id, zoneId));
    }
  }
  function startDrag(e: PointerEvent, src: HTMLElement, id: string) {
    if (e.button > 0 || !e.isPrimary) return;
    e.preventDefault();
    const pid = e.pointerId, r = src.getBoundingClientRect(), size = r.width * 1.1;
    const ghost = h("span", { class: "tghost", html: art.get(id)!, style: `width:${size}px;height:${size}px;visibility:hidden` });
    document.body.appendChild(ghost);
    const x0 = e.clientX, y0 = e.clientY;
    let moved = false, over: string | null = null;
    const zoneAt = (x: number, y: number) => {
      const t = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-bin]");
      return t && view.stage.contains(t) ? t.dataset.bin! : null;
    };
    const mark = (z: string | null) => {
      if (z === over) return;
      if (over) zoneEl.get(over)?.classList.remove("over");
      over = z;
      if (over) zoneEl.get(over)?.classList.add("over");
    };
    const place = (x: number, y: number) => { ghost.style.left = `${x - size / 2}px`; ghost.style.top = `${y - size / 2}px`; };
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return;
      if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
      if (!moved) { moved = true; ghost.style.visibility = "visible"; src.classList.add("lifted"); select(null); focus = id; }
      place(ev.clientX, ev.clientY);
      mark(zoneAt(ev.clientX, ev.clientY));
    };
    const end = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      ghost.remove(); src.classList.remove("lifted"); mark(null);
      lastUp = { t: ev.timeStamp, x: ev.clientX, y: ev.clientY };
      if (!view.stage.isConnected) return;
      if (!moved) {
        sfx.tap();
        if (selected === id) { select(null); return; }
        select(id); view.say(`${name.get(id)}.`);
        return;
      }
      const z = ev.type === "pointercancel" ? null : zoneAt(ev.clientX, ev.clientY);
      if (z) drop(id, z);
    };
    place(x0, y0);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }
  view.stage.appendChild(tray);
  view.stage.appendChild(row);
  return {
    current: () => [selected, focus].find((k) => k && thingEl.has(k)) ?? (thingEl.size ? [...thingEl.keys()][0] : null),
    show: (id) => { const z = zoneEl.get(o.answers[id]); if (z) glow(z); select(id); },
    place: (id, after) => drop(id, o.answers[id], after),
  };
}
