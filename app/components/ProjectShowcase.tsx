"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import {
  type CSSProperties,
  Fragment,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { projects, type ShowcaseProject } from "./projects";
import { ShowcaseRenderer, type Rect } from "./showcaseRenderer";
import styles from "./ProjectShowcase.module.css";

// Same condition the page uses for its other scroll effects.
const MOTION_QUERY = "(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const SHEET_RADIUS = 28;
const DRAG_SCALE = 1.5;
const DRAG_THRESHOLD = 10;
const COUNT = projects.length;

type View = "featured" | "index";
type SheetState = { index: number; phase: "opening" | "open" | "closing"; flight: "gl" | "dom" };
type Interaction = { view: View; sheet: SheetState | null; hoveredId: string | null };

type Engine = {
  pin: () => void;
  centerOn: (index: number, immediate?: boolean) => void;
  canFly: () => boolean;
  openFlight: (index: number) => void;
  closeFlight: (index: number) => void;
  suppressClick: () => boolean;
};

type EngineContext = {
  track: HTMLElement;
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  gallery: HTMLElement;
  section: HTMLElement;
  cards: HTMLElement[];
  images: HTMLImageElement[];
  progress: HTMLElement | null;
  interaction: RefObject<Interaction>;
  layer: RefObject<HTMLDivElement | null>;
  sheet: RefObject<HTMLDivElement | null>;
  onActiveChange: (index: number) => void;
  onOpened: () => void;
  onClosed: () => void;
};

const pad = (value: number) => String(value).padStart(2, "0");

function lockPage(locked: boolean) {
  document.body.classList.toggle("showcase-open", locked);
  for (const selector of [".site-main", ".rail", ".mobile-header"]) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) element.inert = locked;
  }
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Titles wrap only between words, so "E-Commerce" never splits at its hyphen.
function NoBreakWords({ text }: { text: string }) {
  return text.split(" ").map((word, index) => (
    <Fragment key={`${word}-${index}`}>
      {index > 0 && " "}
      <span className={styles.word}>{word}</span>
    </Fragment>
  ));
}

function startMotionEngine(ctx: EngineContext): { engine: Engine; stop: () => void } {
  const { track, stage, canvas, gallery, section, cards, interaction } = ctx;
  const rects = new Map<string, Rect>(projects.map((project) => [project.id, { left: 0, top: 0, width: 1, height: 1 }]));
  const state = {
    current: 0,
    pendingScroll: 0,
    velocity: 0,
    lastTime: performance.now(),
    layout: [] as { center: number; width: number; height: number }[],
    travel: 1,
    scrollTravel: 1,
    width: 1,
    height: 1,
    needsLayout: true,
    pressed: false,
    dragging: false,
    pointerId: -1,
    startX: 0,
    lastX: 0,
    lastMove: 0,
    pointerVelocity: 0,
    suppressUntil: 0,
    pointerX: -9999,
    pointerY: -9999,
    active: -1,
    visible: false,
    pendingOpen: null as number | null,
    pendingClose: null as number | null,
  };
  let raf = 0;

  const surface = (content: "visible" | "hidden" | null, solid: boolean | null) => {
    const layer = ctx.layer.current;
    if (!layer) return;
    if (content) layer.dataset.content = content;
    if (solid !== null) layer.dataset.surface = solid ? "solid" : "clear";
  };

  let renderer = ShowcaseRenderer.create(
    canvas,
    projects.map((project, index) => ({
      id: project.id,
      title: project.title,
      aspect: project.cover.width / project.cover.height,
      image: ctx.images[index],
    })),
    {
      sheetRadius: SHEET_RADIUS,
      fontFamily: getComputedStyle(stage).fontFamily,
      onOpenReveal: () => surface("visible", null),
      onOpenComplete: () => {
        surface(null, true);
        ctx.onOpened();
      },
      onCloseComplete: () => ctx.onClosed(),
      onContextLost: () => {
        renderer = null;
        stage.dataset.gl = "off";
        releaseSheet();
      },
    },
  );

  // Without a renderer mid-flight the DOM sheet has to take over on its own.
  function releaseSheet() {
    const sheet = interaction.current.sheet;
    if (!sheet || sheet.flight !== "gl") return;
    surface("visible", true);
    if (sheet.phase === "opening") ctx.onOpened();
    if (sheet.phase === "closing") ctx.onClosed();
  }

  const layout = () => {
    state.width = stage.clientWidth;
    state.height = stage.clientHeight;
    const gap = Math.round(Math.max(14, Math.min(22, state.width * 0.013)));
    const cardHeight = Math.min(560, state.height * 0.56);
    let cursor = 0;
    state.layout = projects.map((project, index) => {
      const width = cardHeight * (project.cover.width / project.cover.height);
      const center = index === 0 ? 0 : cursor + gap + width / 2;
      cursor = center + width / 2;
      cards[index].style.width = `${width}px`;
      cards[index].style.height = `${cardHeight}px`;
      return { center, width, height: cardHeight };
    });
    const first = state.layout[0];
    const last = state.layout[COUNT - 1];
    state.travel = last.center - first.center;
    state.scrollTravel = Math.round((COUNT - 1) * Math.max(320, state.height * 0.62));
    section.style.setProperty("--showcase-travel", `${state.scrollTravel}px`);
    state.needsLayout = false;
  };

  const scrollProgress = () => Math.max(0, Math.min(1, -track.getBoundingClientRect().top / state.scrollTravel));

  // The rail runs in project order from GCL to the last project and follows page scroll alone.
  // Drags and horizontal swipes scroll the page, so every input keeps the same position and order.
  const scrollRail = (railDelta: number) => {
    state.pendingScroll -= railDelta * (state.scrollTravel / state.travel);
    const whole = Math.trunc(state.pendingScroll);
    if (!whole) return;
    state.pendingScroll -= whole;
    window.scrollBy({ top: whole, behavior: "instant" });
  };

  const sheetRect = (stageRect: DOMRect): Rect | null => {
    const sheet = ctx.sheet.current;
    if (!sheet || !interaction.current.sheet) return null;
    const rect = sheet.getBoundingClientRect();
    return { left: rect.left - stageRect.left, top: rect.top - stageRect.top, width: rect.width, height: rect.height };
  };

  const tick = (time: number) => {
    raf = 0;
    if (state.needsLayout) layout();
    const dt = Math.min(34, Math.max(8, time - state.lastTime));
    state.lastTime = time;

    const progress = scrollProgress();
    const target = -progress * state.travel;
    const previous = state.current;
    state.current += (target - state.current) * (1 - Math.pow(0.9, dt / 16.67));
    if (Math.abs(target - state.current) < 0.01) state.current = target;
    const instantaneous = (state.current - previous) * (16.67 / dt);
    state.velocity += (instantaneous - state.velocity) * (1 - Math.pow(0.78, dt / 16.67));
    if (Math.abs(state.velocity) < 0.01) state.velocity = 0;

    let nearest = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    state.layout.forEach((item, index) => {
      const axis = item.center + state.current;
      const rect = rects.get(projects[index].id)!;
      rect.left = state.width / 2 + axis - item.width / 2;
      rect.top = state.height / 2 - item.height / 2;
      rect.width = item.width;
      rect.height = item.height;
      cards[index].style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
      if (Math.abs(axis) < nearestDistance) {
        nearestDistance = Math.abs(axis);
        nearest = index;
      }
    });
    if (nearest !== state.active) {
      state.active = nearest;
      ctx.onActiveChange(nearest);
    }
    if (ctx.progress) ctx.progress.style.transform = `scaleX(${progress})`;

    const { sheet, view, hoveredId } = interaction.current;
    if (renderer) {
      const stageRect = stage.getBoundingClientRect();
      const targetSheet = sheetRect(stageRect);
      if (state.pendingOpen !== null && targetSheet) {
        renderer.open(projects[state.pendingOpen].id, time);
        state.pendingOpen = null;
      }
      if (state.pendingClose !== null && targetSheet) {
        surface(null, false);
        renderer.close(projects[state.pendingClose].id, targetSheet, time);
        state.pendingClose = null;
      }
      renderer.render({
        time,
        width: state.width,
        height: state.height,
        velocity: state.velocity,
        pointerX: state.pointerX,
        pointerY: state.pointerY,
        hoveredId: sheet ? null : hoveredId,
        cards: rects,
        sheetRect: targetSheet,
        galleryVisible: view === "featured" && (!sheet || sheet.phase === "closing"),
      });
    }

    if (state.visible || interaction.current.sheet) raf = requestAnimationFrame(tick);
  };

  const kick = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || interaction.current.sheet || interaction.current.view !== "featured") return;
    state.pressed = true;
    state.dragging = false;
    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.lastX = event.clientX;
    state.lastMove = performance.now();
    state.pointerVelocity = 0;
  };

  const onPointerMove = (event: PointerEvent) => {
    const stageRect = stage.getBoundingClientRect();
    state.pointerX = event.clientX - stageRect.left;
    state.pointerY = event.clientY - stageRect.top;
    if (!state.pressed || event.pointerId !== state.pointerId) return;
    if (!state.dragging) {
      if (Math.abs(event.clientX - state.startX) <= DRAG_THRESHOLD) return;
      state.dragging = true;
      gallery.setPointerCapture(event.pointerId);
      document.documentElement.classList.add("showcase-grabbing");
      interaction.current.hoveredId = null;
    }
    const now = performance.now();
    const delta = (event.clientX - state.lastX) * DRAG_SCALE;
    scrollRail(delta);
    state.pointerVelocity = (delta / Math.max(8, now - state.lastMove)) * 16.67;
    state.lastX = event.clientX;
    state.lastMove = now;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!state.pressed || event.pointerId !== state.pointerId) return;
    if (state.dragging) {
      state.suppressUntil = performance.now() + 320;
      // Throw with the last movement only if the pointer was still moving on release.
      if (performance.now() - state.lastMove < 100) scrollRail(state.pointerVelocity * 12);
    }
    state.pressed = false;
    state.dragging = false;
    state.pointerId = -1;
    document.documentElement.classList.remove("showcase-grabbing");
    if (gallery.hasPointerCapture(event.pointerId)) gallery.releasePointerCapture(event.pointerId);
  };

  const onPointerLeave = () => {
    state.pointerX = -9999;
    state.pointerY = -9999;
  };

  // Horizontal trackpad swipes move the rail; vertical wheel keeps scrolling the page, which also drives it.
  const onWheel = (event: WheelEvent) => {
    if (interaction.current.sheet || interaction.current.view !== "featured") return;
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? state.width : 1;
    scrollRail(-Math.max(-180, Math.min(180, event.deltaX * scale)) * 0.5);
  };

  const resizeObserver = new ResizeObserver(() => {
    state.needsLayout = true;
    kick();
  });
  const visibility = new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    if (state.visible) kick();
  });

  layout();
  resizeObserver.observe(stage);
  visibility.observe(track);
  stage.dataset.gl = renderer ? "ready" : "off";
  section.dataset.engine = "motion";
  gallery.dataset.cursor = "Drag";
  gallery.addEventListener("pointerdown", onPointerDown);
  gallery.addEventListener("pointerup", onPointerUp);
  gallery.addEventListener("pointercancel", onPointerUp);
  gallery.addEventListener("wheel", onWheel, { passive: false });
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerleave", onPointerLeave);
  kick();

  const engine: Engine = {
    pin: () => {
      const top = stage.getBoundingClientRect().top;
      if (Math.abs(top) > 0.5) window.scrollTo({ top: window.scrollY + top, behavior: "instant" });
    },
    centerOn: (index, immediate = false) => {
      const center = state.layout[index].center;
      const top = track.getBoundingClientRect().top + window.scrollY + (center / state.travel) * state.scrollTravel;
      window.scrollTo({ top, behavior: "instant" });
      if (immediate) state.current = -center;
      kick();
    },
    canFly: () => renderer !== null,
    openFlight: (index) => {
      state.pendingOpen = index;
      kick();
    },
    closeFlight: (index) => {
      state.pendingClose = index;
      kick();
    },
    suppressClick: () => performance.now() < state.suppressUntil,
  };

  const stop = () => {
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    visibility.disconnect();
    gallery.removeEventListener("pointerdown", onPointerDown);
    gallery.removeEventListener("pointerup", onPointerUp);
    gallery.removeEventListener("pointercancel", onPointerUp);
    gallery.removeEventListener("wheel", onWheel);
    stage.removeEventListener("pointermove", onPointerMove);
    stage.removeEventListener("pointerleave", onPointerLeave);
    document.documentElement.classList.remove("showcase-grabbing");
    renderer?.dispose();
    renderer = null;
    releaseSheet();
    cards.forEach((card) => card.style.removeProperty("transform"));
    cards.forEach((card) => card.style.removeProperty("width"));
    cards.forEach((card) => card.style.removeProperty("height"));
    section.style.removeProperty("--showcase-travel");
    delete stage.dataset.gl;
    delete section.dataset.engine;
    delete gallery.dataset.cursor;
  };

  return { engine, stop };
}

export default function ProjectShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheetProgressRef = useRef<HTMLSpanElement>(null);
  const previewTrackRef = useRef<HTMLDivElement>(null);
  const previewPointRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, seeded: false });
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const cardButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const indexButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const engineRef = useRef<Engine | null>(null);
  const interactionRef = useRef<Interaction>({ view: "featured", sheet: null, hoveredId: null });
  const navBusyRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const dragRef = useRef<{ id: number; x: number; y: number; dx: number; axis: "x" | "y" | null } | null>(null);

  const [view, setViewState] = useState<View>("featured");
  const [sheet, setSheetState] = useState<SheetState | null>(null);
  const [active, setActive] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const later = useCallback((callback: () => void, delay: number) => {
    timersRef.current.push(window.setTimeout(callback, delay));
  }, []);

  const commitSheet = useCallback((next: SheetState | null) => {
    interactionRef.current.sheet = next;
    setSheetState(next);
  }, []);

  const setView = (next: View) => {
    interactionRef.current.view = next;
    interactionRef.current.hoveredId = null;
    setPreviewIndex(null);
    setViewState(next);
  };

  const finishClose = useCallback(() => {
    const current = interactionRef.current.sheet;
    commitSheet(null);
    lockPage(false);
    navBusyRef.current = false;
    if (!current) return;
    const buttons = interactionRef.current.view === "index" ? indexButtonRefs.current : cardButtonRefs.current;
    buttons[current.index]?.focus({ preventScroll: true });
  }, [commitSheet]);

  const markOpened = useCallback(() => {
    const current = interactionRef.current.sheet;
    if (current?.phase === "opening") commitSheet({ ...current, phase: "open" });
  }, [commitSheet]);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const gallery = galleryRef.current;
    if (!section || !track || !stage || !canvas || !gallery) return;

    const media = window.matchMedia(MOTION_QUERY);
    let stop: (() => void) | undefined;
    const sync = () => {
      stop?.();
      stop = undefined;
      engineRef.current = null;
      const cards = cardRefs.current.filter((card): card is HTMLElement => Boolean(card));
      const images = imageRefs.current.filter((image): image is HTMLImageElement => Boolean(image));
      if (!media.matches || cards.length !== COUNT || images.length !== COUNT) return;
      const started = startMotionEngine({
        track,
        stage,
        canvas,
        gallery,
        section,
        cards,
        images,
        progress: progressRef.current,
        interaction: interactionRef,
        layer: layerRef,
        sheet: sheetRef,
        onActiveChange: setActive,
        onOpened: markOpened,
        onClosed: finishClose,
      });
      engineRef.current = started.engine;
      stop = started.stop;
    };

    sync();
    media.addEventListener("change", sync);
    const timers = timersRef.current;
    const interaction = interactionRef.current;
    return () => {
      media.removeEventListener("change", sync);
      stop?.();
      engineRef.current = null;
      timers.forEach((timer) => window.clearTimeout(timer));
      if (interaction.sheet) lockPage(false);
    };
  }, [finishClose, markOpened]);

  const openProject = (index: number, origin: "card" | "index") => {
    if (interactionRef.current.sheet) return;
    const engine = engineRef.current;
    if (origin === "card" && engine?.suppressClick()) return;
    const flight = origin === "card" && engine?.canFly() ? "gl" : "dom";
    engine?.pin();
    interactionRef.current.hoveredId = null;
    setPreviewIndex(null);
    commitSheet({ index, phase: "opening", flight });
  };

  const closeProject = useCallback(() => {
    const current = interactionRef.current.sheet;
    if (current?.phase === "open") commitSheet({ ...current, phase: "closing" });
  }, [commitSheet]);

  const navigate = useCallback((direction: 1 | -1) => {
    const current = interactionRef.current.sheet;
    const layer = layerRef.current;
    if (current?.phase !== "open" || !layer || navBusyRef.current) return;
    navBusyRef.current = true;
    const nextIndex = (current.index + direction + COUNT) % COUNT;
    engineRef.current?.centerOn(nextIndex, true);
    layer.dataset.nav = direction > 0 ? "out-next" : "out-previous";
    later(() => {
      commitSheet({ ...current, index: nextIndex });
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      layer.dataset.nav = direction > 0 ? "in-next" : "in-previous";
      later(() => {
        delete layer.dataset.nav;
        navBusyRef.current = false;
      }, 380);
    }, 190);
  }, [commitSheet, later]);

  const phase = sheet?.phase;
  const flight = sheet?.flight;

  // Opening: the GPU card flies into the sheet, or the sheet rises as a curtain when there is no card to fly.
  useEffect(() => {
    if (phase !== "opening") return;
    lockPage(true);
    sheetRef.current?.focus({ preventScroll: true });
    if (flight === "gl") {
      engineRef.current?.openFlight(interactionRef.current.sheet?.index ?? 0);
      return;
    }
    const timer = window.setTimeout(markOpened, 720);
    return () => window.clearTimeout(timer);
  }, [phase, flight, markOpened]);

  useEffect(() => {
    if (phase !== "closing") return;
    const layer = layerRef.current;
    const current = interactionRef.current.sheet;
    const engine = engineRef.current;
    if (!layer || !current) return;
    layer.dataset.content = "hidden";
    if (current.flight === "gl" && engine?.canFly() && interactionRef.current.view === "featured") {
      const timer = window.setTimeout(() => engine.closeFlight(current.index), 170);
      return () => window.clearTimeout(timer);
    }
    layer.dataset.leaving = "true";
    const timer = window.setTimeout(finishClose, 560);
    return () => window.clearTimeout(timer);
  }, [phase, finishClose]);

  const sheetMounted = sheet !== null;
  useEffect(() => {
    if (!sheetMounted) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeProject();
      } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(event.key === "ArrowRight" ? 1 : -1);
      } else if (event.key === "Tab") {
        const layer = layerRef.current;
        if (!layer) return;
        const focusable = Array.from(layer.querySelectorAll<HTMLElement>("a[href], button")).filter((element) => element.getClientRects().length > 0);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const inside = layer.contains(document.activeElement);
        if (event.shiftKey && (!inside || document.activeElement === first || document.activeElement === sheetRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (!inside || document.activeElement === last)) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetMounted, closeProject, navigate]);

  // The index preview trails the pointer with frame-rate independent smoothing.
  useEffect(() => {
    const track = previewTrackRef.current;
    if (view !== "index" || !track || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const point = previewPointRef.current;
    let raf = 0;
    let last = performance.now();
    const move = (event: PointerEvent) => {
      point.targetX = event.clientX;
      point.targetY = event.clientY;
      if (!point.seeded) {
        point.x = point.targetX;
        point.y = point.targetY;
        point.seeded = true;
      }
    };
    const loop = (time: number) => {
      const follow = 1 - Math.pow(0.78, Math.min(50, time - last) / 16.67);
      last = time;
      point.x += (point.targetX - point.x) * follow;
      point.y += (point.targetY - point.y) * follow;
      track.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
      point.seeded = false;
    };
  }, [view]);

  const previewAt = (index: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const point = previewPointRef.current;
    point.x = point.targetX = rect.left + rect.width / 2;
    point.y = point.targetY = rect.top + rect.height / 2;
    point.seeded = true;
    setPreviewIndex(index);
  };

  const onSheetPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || phase !== "open" || (event.target as Element).closest("a, button")) return;
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, axis: null };
  };

  const onSheetPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const layer = layerRef.current;
    if (!drag || drag.id !== event.pointerId || !layer) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.axis && Math.max(Math.abs(dx), Math.abs(dy)) > DRAG_THRESHOLD) {
      drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (drag.axis === "x") {
        event.currentTarget.setPointerCapture(event.pointerId);
        layer.dataset.dragging = "true";
      }
    }
    if (drag.axis !== "x") return;
    drag.dx = dx;
    layer.style.setProperty("--sheet-drag", `${dx}px`);
  };

  const onSheetPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const layer = layerRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    if (!layer || drag.axis !== "x") return;
    delete layer.dataset.dragging;
    layer.style.removeProperty("--sheet-drag");
    // A quarter of the sheet width commits to the neighbouring project.
    if (Math.abs(drag.dx) >= event.currentTarget.clientWidth * 0.25) navigate(drag.dx < 0 ? 1 : -1);
  };

  const onSheetScroll = useCallback(() => {
    const scroller = scrollRef.current;
    const progress = sheetProgressRef.current;
    if (!scroller || !progress) return;
    const max = scroller.scrollHeight - scroller.clientHeight;
    progress.dataset.scrollable = max > 1 ? "true" : "false";
    progress.style.setProperty("--progress", String(max > 1 ? scroller.scrollTop / max : 1));
  }, []);

  // Content height changes as images load and when another project swaps in.
  const sheetIndex = sheet?.index;
  useEffect(() => {
    const scroller = scrollRef.current;
    if (sheetIndex === undefined || !scroller) return;
    onSheetScroll();
    const observer = new ResizeObserver(onSheetScroll);
    observer.observe(scroller);
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    return () => observer.disconnect();
  }, [sheetIndex, onSheetScroll]);

  const activeProject = projects[active];

  return (
    <section id="projects" ref={sectionRef} className={styles.section} aria-labelledby="projects-title">
      <div className={styles.intro}>
        <p className="section-kicker section-kicker--light">&#123; Selected Projects &#125;</p>
        <div className={styles.introRow}>
          <h2 id="projects-title">Production work with real complexity</h2>
          <p>A growing mix of shipped platforms spanning commerce, video, tailoring, spiritual guidance, auctions and local discovery.</p>
        </div>
      </div>

      <div ref={trackRef} className={styles.track}>
        <div ref={stageRef} className={styles.stage} data-view={view} data-sheet={sheet ? "open" : undefined}>
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

          <div className={styles.hud}>
            <p className={styles.counter} aria-hidden="true">
              <span>{activeProject.number}</span> / {pad(COUNT)}
            </p>
            <p className={styles.activeTitle} aria-hidden="true">
              <strong>{activeProject.title}</strong>
              <span>{activeProject.type}</span>
            </p>
            <div className={styles.switcher} role="group" aria-label="Project views">
              <button type="button" aria-pressed={view === "featured"} onClick={() => setView("featured")}>Featured</button>
              <span aria-hidden="true">/</span>
              <button type="button" aria-pressed={view === "index"} onClick={() => setView("index")}>Index</button>
            </div>
            <p className={styles.hint} aria-hidden="true">
              Scroll or drag
              <span className={styles.progress}><span ref={progressRef} /></span>
            </p>
          </div>

          <div ref={galleryRef} className={styles.gallery} inert={view !== "featured"}>
            {projects.map((project, index) => (
              <article
                key={project.id}
                ref={(element) => { cardRefs.current[index] = element; }}
                className={styles.card}
              >
                <button
                  ref={(element) => { cardButtonRefs.current[index] = element; }}
                  type="button"
                  className={styles.cardButton}
                  data-cursor="View"
                  aria-label={`Open ${project.title}, ${project.type}`}
                  onClick={() => openProject(index, "card")}
                  onFocus={(event) => {
                    if (event.currentTarget.matches(":focus-visible")) engineRef.current?.centerOn(index);
                  }}
                  onPointerEnter={() => { interactionRef.current.hoveredId = project.id; }}
                  onPointerLeave={() => { interactionRef.current.hoveredId = null; }}
                />
                <div className={styles.cardFrame}>
                  <Image
                    ref={(element) => { imageRefs.current[index] = element; }}
                    className={styles.cardMedia}
                    src={project.cover.src}
                    alt=""
                    width={project.cover.width}
                    height={project.cover.height}
                    sizes="(min-width: 768px) 66vw, 100vw"
                    draggable={false}
                  />
                  <p className={styles.cardCaption} aria-hidden="true">
                    <span className={styles.cardTitle}>{project.title}</span>
                    <span className={styles.cardArrow}><ArrowIcon /></span>
                  </p>
                </div>
                <p className={styles.cardMeta} aria-hidden="true"><span>{project.number}</span>{project.type}</p>
              </article>
            ))}
          </div>

          <div className={styles.index} data-visible={view === "index" ? "true" : undefined} inert={view !== "index"}>
            <ul className={styles.indexCloud} onPointerLeave={() => setPreviewIndex(null)}>
              {projects.map((project, index) => (
                <li key={project.id} style={{ "--i": index } as CSSProperties}>
                  <button
                    ref={(element) => { indexButtonRefs.current[index] = element; }}
                    type="button"
                    data-cursor="Open"
                    data-active={previewIndex === index ? "true" : undefined}
                    onClick={() => openProject(index, "index")}
                    onPointerEnter={() => setPreviewIndex(index)}
                    onFocus={(event) => previewAt(index, event.currentTarget)}
                    onBlur={() => setPreviewIndex(null)}
                  >
                    <NoBreakWords text={project.title} />
                  </button>
                  {index < COUNT - 1 && <span className={styles.indexDot} aria-hidden="true">●</span>}
                </li>
              ))}
            </ul>
            <div ref={previewTrackRef} className={styles.previewTrack} aria-hidden="true">
              <div className={styles.preview} data-active={previewIndex !== null ? "true" : undefined}>
                {projects.map((project, index) => (
                  <Image
                    key={project.id}
                    src={project.cover.src}
                    alt=""
                    width={project.cover.width}
                    height={project.cover.height}
                    sizes="380px"
                    data-active={previewIndex === index ? "true" : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {sheet && createPortal(
        <div
          ref={layerRef}
          className={styles.sheetLayer}
          data-flight={sheet.flight}
          data-surface={sheet.flight === "gl" ? "clear" : "solid"}
          data-content={sheet.flight === "gl" ? "hidden" : "visible"}
        >
          <RelatedButton project={projects[(sheet.index - 1 + COUNT) % COUNT]} side="previous" onNavigate={navigate} />
          <RelatedButton project={projects[(sheet.index + 1) % COUNT]} side="next" onNavigate={navigate} />
          <div
            ref={sheetRef}
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="showcase-sheet-title"
            tabIndex={-1}
            onPointerDown={onSheetPointerDown}
            onPointerMove={onSheetPointerMove}
            onPointerUp={onSheetPointerUp}
            onPointerCancel={onSheetPointerUp}
          >
            <div ref={scrollRef} className={styles.sheetScroll} onScroll={onSheetScroll}>
              <SheetContent
                key={projects[sheet.index].id}
                project={projects[sheet.index]}
                next={projects[(sheet.index + 1) % COUNT]}
                onNext={() => navigate(1)}
              />
            </div>
            <span ref={sheetProgressRef} className={styles.sheetProgress} aria-hidden="true" />
            <button type="button" className={styles.close} data-cursor="Close" onClick={closeProject} aria-label="Close project">
              <span />
            </button>
          </div>
        </div>,
        document.body,
      )}
    </section>
  );
}

function RelatedButton({ project, side, onNavigate }: { project: ShowcaseProject; side: "previous" | "next"; onNavigate: (direction: 1 | -1) => void }) {
  return (
    <button
      type="button"
      className={styles.related}
      data-side={side}
      data-cursor={side === "next" ? "Next" : "Prev"}
      aria-label={`${side === "next" ? "Next" : "Previous"} project: ${project.title}`}
      onClick={() => onNavigate(side === "next" ? 1 : -1)}
    >
      <span>{project.title}</span>
    </button>
  );
}

function SheetContent({ project, next, onNext }: { project: ShowcaseProject; next: ShowcaseProject; onNext: () => void }) {
  return (
    <div className={styles.sheetGrid}>
      <div className={styles.sheetCopy}>
        <p className={styles.sheetEyebrow} data-reveal style={{ "--d": 0 } as CSSProperties}>
          <span>{project.number}</span>
          {project.type}
        </p>
        <h2 id="showcase-sheet-title" data-reveal style={{ "--d": 1 } as CSSProperties}><NoBreakWords text={project.title} /></h2>
        <p className={styles.sheetDescription} data-reveal style={{ "--d": 2 } as CSSProperties}>{project.description}</p>

        <div className={styles.sheetMeta} data-reveal style={{ "--d": 3 } as CSSProperties}>
          <a className={styles.visit} href={project.url} target="_blank" rel="noreferrer" data-cursor="Visit" aria-label={`Visit ${project.title}`}>
            <ArrowIcon />
          </a>
          <ul className={styles.pills}>
            {project.links.map((link) => (
              <li key={link.label}>
                <a className={styles.pill} href={link.url} target="_blank" rel="noreferrer" data-cursor="Visit">{link.label}</a>
              </li>
            ))}
            {project.highlights?.map((highlight) => (
              <li key={highlight}><span className={styles.pill} data-tone="soft">{highlight}</span></li>
            ))}
          </ul>
        </div>

        {project.agent && (
          <div className={styles.agent} data-reveal style={{ "--d": 4 } as CSSProperties}>
            <p className={styles.agentStatus}><span className="status-dot" aria-hidden="true" />{project.agent.label}</p>
            <ul aria-label="What the AI agent does">
              {project.agent.actions.map((action) => <li key={action}>{action}</li>)}
            </ul>
            <p className={styles.agentNote}>{project.agent.note}</p>
          </div>
        )}

        {project.stackDetails ? (
          <dl className={styles.stack} data-reveal style={{ "--d": 5 } as CSSProperties}>
            {project.stackDetails.map((group) => (
              <div key={group.label}>
                <dt>{group.label}</dt>
                <dd>{group.value}</dd>
              </div>
            ))}
          </dl>
        ) : project.tech ? (
          <div className={styles.stack} data-reveal style={{ "--d": 5 } as CSSProperties}>
            <p className={styles.stackLabel}>Tech stack</p>
            <ul className={styles.tech}>
              {project.tech.map((tech) => <li key={tech}>{tech}</li>)}
            </ul>
          </div>
        ) : null}
      </div>

      <div className={styles.sheetMedia}>
        {project.media.map((image, index) => (
          <figure key={image.src} data-reveal style={{ "--d": 2 + index } as CSSProperties}>
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(min-width: 1024px) 54vw, (min-width: 768px) 84vw, 100vw"
              loading={index === 0 ? "eager" : "lazy"}
              draggable={false}
            />
          </figure>
        ))}
        <button type="button" className={styles.nextProject} data-cursor="Next" onClick={onNext}>
          <span>Next project</span>
          <strong><NoBreakWords text={next.title} /></strong>
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}
