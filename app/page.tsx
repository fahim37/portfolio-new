"use client";

import Image from "next/image";
import SignalHero from "./components/SignalHero";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const themeStorageKey = "fahim-portfolio-theme";
const themeChangeEvent = "fahim-portfolio-theme-change";

const getThemeSnapshot = (): Theme => document.documentElement.dataset.theme === "dark" ? "dark" : "light";
const getServerThemeSnapshot = (): Theme => "light";
const subscribeToTheme = (callback: () => void) => {
  window.addEventListener(themeChangeEvent, callback);
  return () => window.removeEventListener(themeChangeEvent, callback);
};

const applyTheme = (theme: Theme, persist: boolean) => {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  if (persist) window.localStorage.setItem(themeStorageKey, theme);
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#101211" : "#fcfcfc");
  window.dispatchEvent(new Event(themeChangeEvent));
};

const expertise = [
  {
    number: "01",
    title: "Frontend",
    detail: "Next.js / React",
    description:
      "Fast, typed interfaces built with Next.js App Router, React, TypeScript, Tailwind, shadcn/ui and modern state tooling.",
    image: "/expertise/frontend-interface.webp",
  },
  {
    number: "02",
    title: "Backend",
    detail: "APIs / Data",
    description:
      "Production APIs and services with Node.js, Express, NestJS, PostgreSQL, MongoDB, Redis, queues and real-time systems.",
    image: "/expertise/backend-data-flow.webp",
  },
  {
    number: "03",
    title: "Cloud & DevOps",
    detail: "AWS / Nginx",
    description:
      "Complete delivery ownership across AWS EC2, VPS infrastructure, Nginx, Docker, SSL, DNS, CI/CD and media pipelines.",
    image: "/expertise/cloud-devops.webp",
  },
  {
    number: "04",
    title: "AI Agents",
    detail: "Tools / Automation",
    description:
      "Business automation agents built on frontier model APIs with tool calling, background jobs and third-party integrations.",
    image: "/expertise/ai-agents.webp",
  },
];

const navItems = [
  { label: "Home", href: "#top" },
  { label: "About", href: "#about" },
  { label: "Expertise", href: "#expertise" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

const stats = [
  { value: "2+", label: "Years building production products" },
  { value: "15+", label: "Client web projects delivered" },
  { value: "Lead", label: "Mobile app team delivery" },
  { value: "3.75", label: "CSE degree CGPA out of 4.00" },
];

const stack = [
  "Next.js",
  "TypeScript",
  "Node.js",
  "PostgreSQL",
  "AWS",
  "Redis",
  "Docker",
  "AI Agents",
  "Cloudflare R2",
  "System Design",
];

const projects = [
  {
    number: "01",
    type: "AI commerce platform",
    title: "GCL E-Commerce",
    url: "https://gcl-ecom.vercel.app",
    description:
      "A Bangladesh-focused multi-vendor commerce platform with central administration, vendor workspaces and a full responsive store builder. One customer cart splits into vendor sub-orders, with bKash and COD payments, plus AI-assisted listings, chatbot and search.",
    stackDetails: [
      {
        label: "Frontend",
        value: "Next.js 16 App Router · strict TypeScript · Tailwind v4 · shadcn-style primitives · Radix · lucide · TanStack Query · Zustand · URL search params · React Hook Form + Zod",
      },
      {
        label: "Backend",
        value: "PostgreSQL 16 · Drizzle ORM · Express 4 · Redis 7 · BullMQ · Socket.IO · NodeNext TypeScript · typed schema → controller",
      },
    ],
    tech: [],
    visual: "commerce",
    live: true,
  },
  {
    number: "02",
    type: "Video-first recruitment",
    title: "Elevator Video Pitch",
    url: "https://evpitch.com",
    description:
      "A video-first careers platform where candidates record 30-second elevator pitches and apply to jobs, while recruiters post roles, hear the person behind the résumé and send one-click feedback. Companies can also share 60-second culture pitches.",
    tech: ["Next.js", "Express", "Cloudflare R2", "HLS", "Nginx", "VPS"],
    visual: "video",
    live: true,
  },
  {
    number: "03",
    type: "Bespoke business platform",
    title: "G-TEN Bespoke",
    url: "https://gtenbespoke.com/",
    description:
      "A responsive bespoke tailoring website paired with a full admin workspace for generating receipts and controlling bookings, expenses, galleries, content, users and day-to-day operations.",
    tech: ["Next.js", "Express", "MongoDB", "Receipt Generator", "Admin Dashboard"],
    visual: "tailoring",
    live: true,
  },
  {
    number: "04",
    type: "Concept placeholder",
    title: "AI Workflow Studio",
    url: "#contact",
    description:
      "A visual automation workspace for connecting AI agents, business tools, approvals and background tasks into reliable workflows.",
    tech: ["AI Agents", "Tool Calling", "Queues", "TypeScript", "APIs"],
    visual: "agents",
    live: false,
  },
  {
    number: "05",
    type: "Concept placeholder",
    title: "Cloud Control Plane",
    url: "#contact",
    description:
      "An infrastructure console concept for deployment visibility, service health, logs and incident response across cloud environments.",
    tech: ["AWS", "Docker", "Nginx", "CI/CD", "Observability"],
    visual: "cloud",
    live: false,
  },
];

function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 32 32" fill="none">
      <path
        d="M5 4a4 4 0 1 1 4 4H8a4 4 0 0 0-4 4v1a4 4 0 1 1-4-4V8a4 4 0 0 1 4-4h1Zm14 0a4 4 0 1 1 4 4h-2a4 4 0 0 0-4 4v1a4 4 0 1 1-4-4V8a4 4 0 0 1 4-4h2Zm9 11a4 4 0 1 1 0 8h-1a4 4 0 0 0-4 4v1a4 4 0 1 1-8 0v-1a12 12 0 0 1 12-12h1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Arrow({ direction = "right" }: { direction?: "right" | "down" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={direction === "down" ? "arrow arrow--down" : "arrow"}
      fill="none"
    >
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg className="theme-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g className="theme-icon-sun">
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <path className="theme-icon-moon" d="M19.2 15.3A8.1 8.1 0 0 1 8.7 4.8 8.1 8.1 0 1 0 19.2 15.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ThemeToggle({ theme, toggleTheme, mobile = false }: { theme: Theme; toggleTheme: () => void; mobile?: boolean }) {
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      className={`theme-toggle ${mobile ? "theme-toggle--mobile" : ""}`}
      data-cursor="Theme"
      type="button"
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === "dark"}
      title={`Switch to ${nextTheme} mode`}
      onClick={toggleTheme}
    >
      <ThemeIcon />
    </button>
  );
}

function Rail({ menuOpen, toggleMenu, theme, toggleTheme }: { menuOpen: boolean; toggleMenu: () => void; theme: Theme; toggleTheme: () => void }) {
  return (
    <>
      <aside className="rail">
        <button
          className="menu-toggle"
          data-cursor={menuOpen ? "Close" : "Menu"}
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          <span className="menu-line" />
          <span className="menu-line" />
        </button>

        <a className="rail-brand" href="#top" aria-label="Fahim Emon home">
          <span>FAHIM EMON</span>
          <BrandMark className="rail-mark" />
        </a>

        <div className="rail-bottom">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <div className="rail-social" aria-label="Quick links">
          <a href="https://github.com/fahim37" target="_blank" rel="noreferrer" aria-label="GitHub">GH</a>
          <a href="mailto:ahmed.fahim37@gmail.com" aria-label="Email Fahim">@</a>
          <a href="/Fahim_Ahmed_Emon_Resume.pdf" download aria-label="Download résumé">CV</a>
          <a href="#contact" aria-label="Contact section">↘</a>
        </div>
        </div>
      </aside>

      <header className="mobile-header">
        <a className="mobile-brand" href="#top" aria-label="Fahim Emon home">
          <BrandMark className="mobile-mark" />
          <span>FAHIM EMON</span>
        </a>
        <div className="mobile-controls">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} mobile />
        <button
          className="menu-toggle menu-toggle--mobile"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          <span className="menu-line" />
          <span className="menu-line" />
        </button>
        </div>
      </header>
    </>
  );
}

function Menu({ open, close }: { open: boolean; close: () => void }) {
  return (
    <div className={`menu-layer ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button className="menu-backdrop" onClick={close} aria-label="Close menu" />
      <nav className="menu-panel" aria-label="Main navigation">
        <div className="menu-links">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} onClick={close} tabIndex={open ? 0 : -1}>
              <span>{item.label}</span>
              <Arrow />
            </a>
          ))}
        </div>
        <a className="menu-contact" href="mailto:ahmed.fahim37@gmail.com" tabIndex={open ? 0 : -1}>
          <span className="status-dot" />
          Available for ambitious work
        </a>
      </nav>
    </div>
  );
}

function ProjectVisual({ type }: { type: string }) {
  if (type === "commerce") {
    return (
      <div className="project-visual project-visual--commerce parallax-layer" data-parallax="-34" aria-hidden="true">
        <div className="mock-browser">
          <Image
            className="gcl-showcase-image"
            src="/projects/gcl-storefront-showcase.webp"
            alt=""
            width={1600}
            height={822}
            sizes="(max-width: 767px) calc(100vw - 72px), 700px"
          />
        </div>
        <div className="gcl-control-suite">
          <Image
            className="gcl-control-suite-image"
            src="/projects/gcl-control-suite.webp"
            alt=""
            width={1600}
            height={800}
            sizes="(max-width: 767px) calc(100vw - 52px), 730px"
          />
        </div>
        <div className="float-card float-card--orders"><span>Platform suite</span><strong>Store builder</strong></div>
        <div className="float-card float-card--typed"><span>Operations</span><strong>Admin + vendor control</strong></div>
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="project-visual project-visual--video parallax-layer" data-parallax="-34" aria-hidden="true">
        <div className="evp-browser">
          <Image
            className="evp-showcase-image"
            src="/projects/evp-homepage-showcase.webp"
            alt=""
            width={1600}
            height={826}
            sizes="(max-width: 767px) calc(100vw - 72px), 700px"
          />
        </div>
        <div className="candidate-card"><span>Candidate pitch</span><strong>30 seconds</strong><i /></div>
        <div className="stream-card"><span>Recruiter tools</span><strong>Pitch + feedback</strong></div>
      </div>
    );
  }

  if (type === "tailoring") {
    return (
      <div className="project-visual project-visual--tailoring parallax-layer" data-parallax="-34" aria-hidden="true">
        <div className="gten-showcase">
          <Image
            className="gten-showcase-image"
            src="/projects/gten-bespoke-showcase.webp"
            alt=""
            width={1600}
            height={800}
            sizes="(max-width: 767px) calc(100vw - 56px), 720px"
          />
        </div>
        <div className="gten-badge gten-badge--receipts"><span>Operations</span><strong>Receipt generator</strong></div>
        <div className="gten-badge gten-badge--admin"><span>Admin</span><strong>Full control</strong></div>
      </div>
    );
  }

  if (type === "analytics") {
    return (
      <div className="project-visual project-visual--analytics parallax-layer" data-parallax="-34" aria-hidden="true">
        <div className="dashboard-window">
          <div className="dashboard-nav">
            <BrandMark />
            <i /><i /><i /><i />
          </div>
          <div className="dashboard-content">
            <div className="dashboard-head"><span>Operations overview</span><i /></div>
            <div className="dashboard-metrics">
              <div><span>Revenue</span><strong>$84.2k</strong><em>+18%</em></div>
              <div><span>Active jobs</span><strong>1,248</strong><em>Live</em></div>
            </div>
            <div className="analytics-chart">
              {[48, 68, 53, 82, 64, 91, 76, 100].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
            </div>
          </div>
        </div>
        <div className="concept-badge concept-badge--analytics"><span>System health</span><strong>All services normal</strong></div>
      </div>
    );
  }

  if (type === "agents") {
    return (
      <div className="project-visual project-visual--agents parallax-layer" data-parallax="-34" aria-hidden="true">
        <div className="agent-canvas">
          <div className="agent-toolbar"><span>Workflow / Lead qualification</span><i /><i /></div>
          <div className="agent-connector agent-connector--one" />
          <div className="agent-connector agent-connector--two" />
          <div className="agent-node agent-node--trigger"><span>Trigger</span><strong>New enquiry</strong><i /></div>
          <div className="agent-node agent-node--reason"><span>AI agent</span><strong>Qualify lead</strong><i /></div>
          <div className="agent-node agent-node--action"><span>Action</span><strong>Update CRM</strong><i /></div>
        </div>
        <div className="concept-badge concept-badge--agents"><span>Last run</span><strong>Completed in 1.8s</strong></div>
      </div>
    );
  }

  return (
    <div className="project-visual project-visual--cloud parallax-layer" data-parallax="-34" aria-hidden="true">
      <div className="cloud-console">
        <div className="cloud-console-head"><span>Production / Services</span><i /><i /><i /></div>
        <div className="cloud-health"><span>Global health</span><strong>99.99%</strong><i /></div>
        <div className="cloud-service-row"><i /><span>api-gateway</span><em>Healthy</em></div>
        <div className="cloud-service-row"><i /><span>media-worker</span><em>Healthy</em></div>
        <div className="cloud-service-row"><i /><span>event-queue</span><em>Healthy</em></div>
        <div className="cloud-terminal"><span>$ deploy production --safe</span><strong>Deployment completed successfully</strong></div>
      </div>
      <div className="cloud-orbit"><i /><i /><i /><span>03</span></div>
      <div className="concept-badge concept-badge--cloud"><span>Region</span><strong>ap-south-1</strong></div>
    </div>
  );
}

function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!dot || !ring || !label || !finePointer || reducedMotion) return;

    document.documentElement.classList.add("has-custom-cursor");
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let animationFrame = 0;

    const animate = () => {
      ringX += (targetX - ringX) * 0.34;
      ringY += (targetY - ringY) * 0.34;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      animationFrame = window.requestAnimationFrame(animate);
    };

    const setTargetState = (target: EventTarget | null) => {
      const element = target instanceof Element ? target : null;
      const interactive = element?.closest<HTMLElement>("a, button, [data-cursor]");
      const cursorLabel = interactive?.dataset.cursor ?? "";

      ring.classList.toggle("is-hovering", Boolean(interactive));
      ring.classList.toggle("has-label", Boolean(cursorLabel));
      label.textContent = cursorLabel;
    };

    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      dot.classList.add("is-visible");
      ring.classList.add("is-visible");
      setTargetState(event.target);
    };

    const onPointerDown = () => ring.classList.add("is-pressed");
    const onPointerUp = () => ring.classList.remove("is-pressed");
    const onScroll = () => setTargetState(document.elementFromPoint(targetX, targetY));
    const onPointerLeave = () => {
      dot.classList.remove("is-visible");
      ring.classList.remove("is-visible");
    };

    animationFrame = window.requestAnimationFrame(animate);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("mouseleave", onPointerLeave);
    };
  }, []);

  return (
    <>
      <div className="custom-cursor-dot" ref={dotRef} aria-hidden="true" />
      <div className="custom-cursor-ring" ref={ringRef} aria-hidden="true">
        <span ref={labelRef} />
      </div>
    </>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");

    const onSystemThemeChange = (event: MediaQueryListEvent) => {
      if (window.localStorage.getItem(themeStorageKey)) return;
      const nextTheme: Theme = event.matches ? "dark" : "light";
      applyTheme(nextTheme, false);
    };

    const onStoredThemeChange = (event: StorageEvent) => {
      if (event.key !== themeStorageKey) return;
      const nextTheme: Theme = event.newValue === "dark" || event.newValue === "light"
        ? event.newValue
        : (colorScheme.matches ? "dark" : "light");
      applyTheme(nextTheme, false);
    };

    colorScheme.addEventListener("change", onSystemThemeChange);
    window.addEventListener("storage", onStoredThemeChange);
    return () => {
      colorScheme.removeEventListener("change", onSystemThemeChange);
      window.removeEventListener("storage", onStoredThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    applyTheme(theme === "dark" ? "light" : "dark", true);
  };


  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]")).map((element) => ({
      element,
      amount: Number(element.dataset.parallax ?? 0),
      current: 0,
      target: 0,
    }));

    if (!layers.length) return;

    let frame = 0;
    const measure = () => {
      layers.forEach((layer) => {
        const rect = layer.element.getBoundingClientRect();
        const baseTop = rect.top - layer.current;
        const centerOffset = (window.innerHeight / 2 - (baseTop + rect.height / 2)) / window.innerHeight;
        layer.target = Math.min(1, Math.max(-1, centerOffset)) * layer.amount;
      });
    };

    const render = () => {
      let moving = false;
      layers.forEach((layer) => {
        const delta = layer.target - layer.current;
        layer.current += delta * 0.12;
        layer.element.style.setProperty("--parallax-y", `${layer.current.toFixed(2)}px`);
        if (Math.abs(delta) > 0.08) moving = true;
      });

      frame = moving ? window.requestAnimationFrame(render) : 0;
    };

    const requestUpdate = () => {
      measure();
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    measure();
    layers.forEach((layer) => {
      layer.current = layer.target;
      layer.element.style.setProperty("--parallax-y", `${layer.current.toFixed(2)}px`);
    });

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;

    const trackers = Array.from(document.querySelectorAll<HTMLElement>(".service-row")).map((row) => {
      const rect = row.getBoundingClientRect();
      return {
        row,
        active: false,
        currentX: rect.width * 0.38,
        currentY: rect.height * 0.5,
        currentRotation: 8,
        targetX: rect.width * 0.38,
        targetY: rect.height * 0.5,
        targetRotation: 8,
      };
    });

    if (!trackers.length) return;

    document.documentElement.classList.add("has-service-tracking");
    let frame = 0;

    const writePosition = (tracker: (typeof trackers)[number]) => {
      tracker.row.style.setProperty("--preview-x", `${tracker.currentX.toFixed(2)}px`);
      tracker.row.style.setProperty("--preview-y", `${tracker.currentY.toFixed(2)}px`);
      tracker.row.style.setProperty("--preview-rotate", `${tracker.currentRotation.toFixed(2)}deg`);
    };

    const render = () => {
      let moving = false;

      trackers.forEach((tracker) => {
        if (!tracker.active) return;

        const deltaX = tracker.targetX - tracker.currentX;
        const deltaY = tracker.targetY - tracker.currentY;
        const deltaRotation = tracker.targetRotation - tracker.currentRotation;
        tracker.currentX += deltaX * 0.28;
        tracker.currentY += deltaY * 0.28;
        tracker.currentRotation += deltaRotation * 0.2;
        writePosition(tracker);

        if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1 || Math.abs(deltaRotation) > 0.05) {
          moving = true;
        }
      });

      frame = moving ? window.requestAnimationFrame(render) : 0;
    };

    const updateTarget = (tracker: (typeof trackers)[number], event: PointerEvent, snap = false) => {
      const rect = tracker.row.getBoundingClientRect();
      const previewHalfWidth = Math.min(118, rect.width * 0.18);
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;

      tracker.targetX = Math.min(rect.width - previewHalfWidth, Math.max(previewHalfWidth, pointerX));
      tracker.targetY = Math.min(rect.height - 22, Math.max(22, pointerY));
      tracker.targetRotation = 8 + Math.min(5, Math.max(-5, (pointerX / rect.width - 0.5) * 10));

      if (snap) {
        tracker.currentX = tracker.targetX;
        tracker.currentY = tracker.targetY;
        tracker.currentRotation = tracker.targetRotation;
        writePosition(tracker);
      } else if (!frame) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const cleanups = trackers.map((tracker) => {
      writePosition(tracker);
      const onEnter = (event: PointerEvent) => {
        tracker.active = true;
        updateTarget(tracker, event, true);
      };
      const onMove = (event: PointerEvent) => updateTarget(tracker, event);
      const onLeave = () => {
        tracker.active = false;
      };

      tracker.row.addEventListener("pointerenter", onEnter);
      tracker.row.addEventListener("pointermove", onMove, { passive: true });
      tracker.row.addEventListener("pointerleave", onLeave);

      return () => {
        tracker.row.removeEventListener("pointerenter", onEnter);
        tracker.row.removeEventListener("pointermove", onMove);
        tracker.row.removeEventListener("pointerleave", onLeave);
      };
    });

    return () => {
      document.documentElement.classList.remove("has-service-tracking");
      cleanups.forEach((cleanup) => cleanup());
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-stack-card]")).map((element) => ({
      element,
      current: 0,
      target: 0,
    }));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (cards.length < 2 || reducedMotion) return;

    let frame = 0;
    const measure = () => {
      const stackTop = window.innerWidth < 768 ? 78 : 76;
      const travel = Math.max(240, window.innerHeight * 0.55);

      cards.forEach((card, index) => {
        const nextCard = cards[index + 1];
        if (!nextCard) {
          card.target = 0;
          return;
        }

        const nextTop = nextCard.element.getBoundingClientRect().top;
        card.target = Math.min(1, Math.max(0, (stackTop + travel - nextTop) / travel));
      });
    };

    const render = () => {
      let moving = false;
      cards.forEach((card) => {
        const delta = card.target - card.current;
        card.current += delta * 0.14;
        card.element.style.setProperty("--stack-scale", `${1 - card.current * 0.045}`);
        card.element.style.setProperty("--stack-brightness", `${1 - card.current * 0.16}`);
        if (Math.abs(delta) > 0.002) moving = true;
      });
      frame = moving ? window.requestAnimationFrame(render) : 0;
    };

    const requestUpdate = () => {
      measure();
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    measure();
    cards.forEach((card) => {
      card.current = card.target;
      card.element.style.setProperty("--stack-scale", `${1 - card.current * 0.045}`);
      card.element.style.setProperty("--stack-brightness", `${1 - card.current * 0.16}`);
    });

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.13 },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("menu-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div id="top" className="site-shell">
      <CustomCursor />
      <Rail menuOpen={menuOpen} toggleMenu={() => setMenuOpen((value) => !value)} theme={theme} toggleTheme={toggleTheme} />
      <Menu open={menuOpen} close={() => setMenuOpen(false)} />

      <main className="site-main">
        <SignalHero />

        <section id="expertise" className="services-section" aria-labelledby="expertise-title">
          <div className="services-inner">
            <p className="section-kicker">&#123; Core Expertise &#125;</p>
            <h2 id="expertise-title">From interface to infrastructure</h2>

            <div className="service-list">
              {expertise.map((service) => {
                const isExpanded = expanded === service.title;
                return (
                  <article className={`service-row ${isExpanded ? "is-expanded" : ""}`} key={service.title}>
                    <div className="service-main">
                      <span className="service-number">{service.number}</span>
                      <h3>{service.title}</h3>
                      <p className="service-detail">{service.detail}</p>
                      <Image
                        className="service-preview"
                        src={service.image}
                        alt=""
                        width={1024}
                        height={768}
                        sizes="235px"
                        aria-hidden="true"
                      />
                      <button
                        className="service-toggle"
                        data-cursor={isExpanded ? "Close" : "More"}
                        type="button"
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Close" : "Learn more about"} ${service.title}`}
                        onClick={() => setExpanded(isExpanded ? null : service.title)}
                      >
                        <span />
                        <span />
                      </button>
                    </div>
                    <div className="service-extra" aria-hidden={!isExpanded}>
                      <p>{service.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="about" className="about-section" aria-labelledby="about-title">
          <div className="about-inner">
            <div className="about-heading reveal">
              <p className="section-kicker section-kicker--light">&#123; About Me &#125;</p>
              <h2 id="about-title">I work across the whole stack—and lead the room.</h2>
            </div>

            <div className="about-content">
              <div className="about-copy reveal">
                <p className="about-lead">
                  Based in Mirpur, Dhaka, I build end-to-end web and mobile products that need to work in the real world—not just in a demo.
                </p>
                <p>
                  At Scaleup IT Limited, I translate business requirements into architecture, data models and API contracts, guide UI/UX decisions, review code and own releases across development, UAT and production. My work spans typed Next.js products, Node.js services, media pipelines, cloud infrastructure and AI automation.
                </p>
                <a className="text-link" href="#experience">My journey <Arrow /></a>
              </div>

              <div className="stat-grid parallax-layer" data-parallax="24">
                {stats.map((stat, index) => (
                  <article className="stat-card reveal" style={{ transitionDelay: `${index * 80}ms` }} key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="stack-marquee" aria-label="Technology stack">
          <div className="stack-track">
            {[...stack, ...stack].map((item, index) => (
              <span key={`${item}-${index}`}><i />{item}</span>
            ))}
          </div>
        </section>

        <section id="projects" className="projects-section" aria-labelledby="projects-title">
          <div className="projects-inner">
            <div className="section-heading reveal">
              <p className="section-kicker">&#123; Selected Projects &#125;</p>
              <h2 id="projects-title">Production work with real complexity</h2>
              <p>A growing mix of shipped platforms and temporary concepts spanning commerce, video, automation, analytics and cloud operations.</p>
            </div>

            <div className="project-list">
              {projects.map((project, index) => (
                <a
                  className={`project-card project-card--${project.visual} reveal`}
                  data-stack-card
                  href={project.url}
                  target={project.live ? "_blank" : undefined}
                  rel={project.live ? "noreferrer" : undefined}
                  data-cursor={project.live ? "View" : "Soon"}
                  key={project.title}
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <div className="project-info">
                    <div className="project-meta"><span>{project.number}</span><span>{project.type}</span></div>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    {project.stackDetails ? (
                      <div className="project-stack-details">
                        {project.stackDetails.map((group) => (
                          <p key={group.label}><strong>{group.label}</strong><span>{group.value}</span></p>
                        ))}
                      </div>
                    ) : (
                      <div className="tech-list">
                        {project.tech.map((tech) => <span key={tech}>{tech}</span>)}
                      </div>
                    )}
                    <span className="project-link">{project.live ? "View live project" : "Concept case study coming soon"} <Arrow /></span>
                  </div>
                  <ProjectVisual type={project.visual} />
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="experience" className="experience-section" aria-labelledby="experience-title">
          <div className="experience-inner">
            <div className="experience-main">
            <div className="experience-heading reveal">
              <p className="section-kicker">&#123; Experience &#125;</p>
              <h2 id="experience-title">Built by shipping, grown by leading.</h2>
              <a href="/Fahim_Ahmed_Emon_Resume.pdf" download data-cursor="PDF" className="download-link">Download full résumé <Arrow direction="down" /></a>
            </div>

            <div className="timeline">
              <article className="timeline-card reveal">
                <div className="timeline-date">Jan 2025 — Present</div>
                <div className="timeline-body">
                  <p className="timeline-company">Scaleup IT Limited · Mohakhali, Dhaka</p>
                  <h3>Team Lead — Full Stack &amp; Mobile</h3>
                  <p className="progression">Frontend Developer → Full Stack Developer → Team Lead</p>
                  <ul>
                    <li>Lead a 12-member mobile development team across planning, code review and release delivery, while building the Node.js and Express services that power the apps.</li>
                    <li>Own system design for client businesses &mdash; data models, API contracts and service topology &mdash; and brief the UI/UX team on business logic so designs reflect real workflows.</li>
                    <li>Run deployment end to end as DevOps: AWS EC2 and VPS provisioning, Nginx reverse proxy and SSL, and a dev / UAT / production branch release strategy.</li>
                    <li>Built and operate the media upload pipeline on AWS S3 and Cloudflare R2, covering presigned uploads, object-key handling and HLS video streaming.</li>
                    <li>Develop AI agents that automate client business operations using frontier model APIs, with tool calling, background job queues and third-party integrations.</li>
                    <li>Delivered 15+ client web projects with Next.js, TypeScript, Tailwind CSS and shadcn/ui, then expanded into full-stack delivery with Express and Node.js.</li>
                  </ul>
                  <ul className="timeline-stack" aria-label="Core stack">
                    {["Next.js", "TypeScript", "Node.js", "Express", "AWS EC2 / S3", "Cloudflare R2", "Nginx", "AI agents"].map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>
                </div>
              </article>

              <article className="timeline-card reveal">
                <div className="timeline-date">Jan 2024 — Jul 2024</div>
                <div className="timeline-body">
                  <p className="timeline-company">Baseit Ltd · Dhaka</p>
                  <h3>Software Engineer Intern</h3>
                  <ul>
                    <li>Shipped features and bug fixes into an existing production codebase alongside the engineering team, working within established review processes.</li>
                    <li>Designed and delivered a complete project independently, from requirement analysis and data modeling through implementation, testing and deployment.</li>
                  </ul>
                </div>
              </article>
            </div>
            </div>

            <div className="education-block reveal">
              <div>
                <p className="section-kicker">&#123; Education &#125;</p>
                <h3>Computer Science &amp; Engineering</h3>
              </div>
              <div className="education-details">
                <p><strong>American International University-Bangladesh</strong><span>B.Sc. in CSE · 2023 · CGPA 3.75/4.00</span></p>
                <p><strong>Shaheed Police Smrity College</strong><span>HSC, Science · GPA 5.00/5.00</span></p>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="contact-section" aria-labelledby="contact-title">
          <div className="contact-orbit parallax-layer" data-parallax="70" aria-hidden="true"><BrandMark /></div>
          <div className="contact-inner">
            <p className="section-kicker section-kicker--light reveal">&#123; Start a Conversation &#125;</p>
            <h2 id="contact-title" className="reveal">Let&apos;s build something <em>useful.</em></h2>
            <a className="contact-email reveal" href="mailto:ahmed.fahim37@gmail.com" data-cursor="Email">
              ahmed.fahim37@gmail.com <span><Arrow /></span>
            </a>

            <div className="contact-grid reveal">
              <div><span>Based in</span><strong>Mirpur, Dhaka<br />Bangladesh</strong></div>
              <div><span>Call</span><a href="tel:+8801975820796">+880 1975-820796</a></div>
              <div><span>Find me</span><a href="https://github.com/fahim37" target="_blank" rel="noreferrer">GitHub ↗</a></div>
              <div><span>Résumé</span><a href="/Fahim_Ahmed_Emon_Resume.pdf" download>Download PDF ↓</a></div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <span>© {new Date().getFullYear()} Fahim Ahmed Emon</span>
          <span>Full Stack Developer · Team Lead</span>
          <a href="#top">Back to top ↑</a>
        </footer>
      </main>
    </div>
  );
}
