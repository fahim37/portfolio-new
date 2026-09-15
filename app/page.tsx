"use client";

import ProjectShowcase from "./components/ProjectShowcase";
import SignalHero from "./components/SignalHero";
import { type CSSProperties, type MouseEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const themeStorageKey = "fahim-portfolio-theme";
const themeChangeEvent = "fahim-portfolio-theme-change";

// Detach scroll effects as soon as the viewport or motion preference changes.
function desktopMotion(setup: () => (() => void) | undefined) {
  const media = window.matchMedia("(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  let cleanup: (() => void) | undefined;
  const sync = () => {
    cleanup?.();
    cleanup = media.matches ? setup() : undefined;
  };
  sync();
  media.addEventListener("change", sync);
  return () => {
    media.removeEventListener("change", sync);
    cleanup?.();
  };
}

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
    outcome: "Interfaces people can use with confidence.",
    description: "Responsive storefronts, dashboards and admin workspaces, with typed forms, clear loading states and predictable client-side data.",
    tech: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    proof: "See the GCL storefront",
    href: "https://gcl-ecom.vercel.app",
  },
  {
    number: "02",
    title: "Backend",
    outcome: "The business logic behind the product.",
    description: "API contracts, database models, payments, background jobs and real-time updates. From a customer checkout to separate vendor orders.",
    tech: ["Node.js", "Express", "PostgreSQL", "Redis"],
    proof: "Explore GCL E-Commerce",
    href: "https://gcl-ecom.vercel.app",
  },
  {
    number: "03",
    title: "Cloud & DevOps",
    outcome: "From a working build to a live service.",
    description: "Deployments across development, UAT and production, with SSL, reverse proxies, CI/CD and video storage and streaming pipelines.",
    tech: ["AWS", "Docker", "Nginx", "Cloudflare R2"],
    proof: "See Elevator Video Pitch",
    href: "https://evpitch.com",
  },
  {
    number: "04",
    title: "AI Agents",
    outcome: "Automation connected to business tools.",
    description: "Agents that take real actions in live systems, like the GCL shopping agent that places, updates, cancels and tracks orders, plus third-party integrations and background tasks.",
    tech: ["Model APIs", "Tool calling", "Queues", "Integrations"],
    proof: "See the GCL AI agent",
    href: "https://gcl-ecom.vercel.app",
  },
];

const navItems = [
  { label: "Home", href: "#top" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "Expertise", href: "#expertise" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

// The last section whose top has passed the upper third of the viewport is the one being read.
const currentSectionHref = () => {
  const line = window.innerHeight * 0.35;
  let current = navItems[0].href;
  for (const item of navItems) {
    const top = document.querySelector(item.href)?.getBoundingClientRect().top;
    if (top !== undefined && top <= line) current = item.href;
  }
  return current;
};

const stats = [
  { value: "15+", label: "Web apps delivered" },
  { value: "10+", label: "Mobile apps delivered" },
  { value: "E2E", label: "Deployments owned, from server setup to production" },
  { value: "2+", label: "Years building production products" },
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

type ArrowDirection = "right" | "down" | "up" | "up-right" | "down-right";

function Arrow({ direction = "right" }: { direction?: ArrowDirection }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`arrow arrow--${direction}`} fill="none">
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

function Rail({ menuOpen, toggleMenu, theme, toggleTheme }: { menuOpen: boolean; toggleMenu: (event: MouseEvent<HTMLButtonElement>) => void; theme: Theme; toggleTheme: () => void }) {
  return (
    <>
      <aside className="rail">
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-controls="site-menu"
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
            <a href="/Fahim_Ahmed_Emon_Resume.pdf" download aria-label="Download resume">CV</a>
            <a href="#contact" aria-label="Contact section"><Arrow direction="down-right" /></a>
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
            aria-controls="site-menu"
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

function Menu({ open, activeHref, close }: { open: boolean; activeHref: string; close: (restoreFocus?: boolean) => void }) {
  return (
    <div className={`menu-layer ${open ? "is-open" : ""}`} inert={!open}>
      <button className="menu-backdrop" type="button" tabIndex={-1} data-cursor="Close" onClick={() => close(true)} aria-label="Close menu" />
      <nav id="site-menu" className="menu-panel" aria-label="Main navigation">
        <ol className="menu-links">
          {navItems.map((item, index) => (
            <li key={item.label} style={{ "--i": index } as CSSProperties}>
              <a href={item.href} onClick={() => close()} aria-current={activeHref === item.href ? "location" : undefined}>
                <span className="menu-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="menu-label">{item.label}</span>
                <Arrow />
              </a>
            </li>
          ))}
        </ol>
        <div className="menu-footer" style={{ "--i": navItems.length } as CSSProperties}>
          <a className="menu-contact" href="mailto:ahmed.fahim37@gmail.com">
            <span className="status-dot" aria-hidden="true" />
            Available for ambitious work
          </a>
          <div className="menu-social">
            <a href="https://github.com/fahim37" target="_blank" rel="noreferrer">GitHub <Arrow direction="up-right" /></a>
            <a href="/Fahim_Ahmed_Emon_Resume.pdf" download>Resume <Arrow direction="down" /></a>
            <a href="tel:+8801975820796">Call</a>
          </div>
        </div>
      </nav>
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
    const onPointerUp = () => {
      ring.classList.remove("is-pressed");
      // A click can change what sits under the pointer (menu open/close), so refresh without waiting for movement.
      window.requestAnimationFrame(() => setTargetState(document.elementFromPoint(targetX, targetY)));
    };
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
  const [activeHref, setActiveHref] = useState(navItems[0].href);
  const menuOpenerRef = useRef<HTMLButtonElement | null>(null);
  const focusMenuOnOpenRef = useRef(false);
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

  const toggleMenu = (event: MouseEvent<HTMLButtonElement>) => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    menuOpenerRef.current = event.currentTarget;
    // Keyboard activation reports zero clicks; only then move focus into the menu.
    focusMenuOnOpenRef.current = event.detail === 0;
    setActiveHref(currentSectionHref());
    setMenuOpen(true);
  };

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) menuOpenerRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => desktopMotion(() => {
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
      layers.forEach(({ element }) => element.style.removeProperty("--parallax-y"));
    };
  }), []);

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
    if (!menuOpen) return;
    document.body.classList.add("menu-open");
    if (focusMenuOnOpenRef.current) document.querySelector<HTMLElement>(".menu-links a")?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuOpenerRef.current?.focus({ preventScroll: true });
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
      <Rail menuOpen={menuOpen} toggleMenu={toggleMenu} theme={theme} toggleTheme={toggleTheme} />
      <Menu open={menuOpen} activeHref={activeHref} close={closeMenu} />
      {/* Inert while the menu is open so Tab stays within the rail, header and overlay. */}
      <main className="site-main" inert={menuOpen}>
        <SignalHero />

        <ProjectShowcase />

        <section id="experience" className="experience-section" aria-labelledby="experience-title">
          <div className="experience-inner">
            <div className="experience-main">
            <div className="experience-heading reveal">
              <p className="section-kicker">&#123; Experience &#125;</p>
              <h2 id="experience-title">Built by shipping, grown by leading.</h2>
              <a href="/Fahim_Ahmed_Emon_Resume.pdf" download data-cursor="PDF" className="download-link">Download full resume <Arrow direction="down" /></a>
            </div>

            <div className="timeline">
              <article className="timeline-card reveal">
                <div className="timeline-date">Jan 2025 to Present</div>
                <div className="timeline-body">
                  <p className="timeline-company">Scaleup IT Limited · Mohakhali, Dhaka</p>
                  <h3>Team Lead, Full Stack &amp; Mobile</h3>
                  <p className="progression">Frontend Developer → Full Stack Developer → Team Lead</p>
                  <ul>
                    <li>Lead a 12-member mobile development team across planning, code review and release delivery for 10+ mobile apps, while building the Node.js and Express services that power them.</li>
                    <li>Own system design for client businesses (data models, API contracts and service topology) and brief the UI/UX team on business logic so designs reflect real workflows.</li>
                    <li>Run deployments end to end as DevOps across web and mobile products: AWS EC2 and VPS provisioning, Nginx reverse proxy and SSL, and a dev / UAT / production branch release strategy.</li>
                    <li>Built and operate the media upload pipeline on AWS S3 and Cloudflare R2, covering presigned uploads, object-key handling and HLS video streaming.</li>
                    <li>Develop AI agents that automate client business operations using frontier model APIs, with tool calling, background job queues and third-party integrations.</li>
                    <li>Delivered 15+ client web apps with Next.js, TypeScript, Tailwind CSS and shadcn/ui, then expanded into full-stack delivery with Express and Node.js.</li>
                  </ul>
                  <ul className="timeline-stack" aria-label="Core stack">
                    {["Next.js", "TypeScript", "Node.js", "Express", "AWS EC2 / S3", "Cloudflare R2", "Nginx", "AI agents"].map((tech) => (
                      <li key={tech}>{tech}</li>
                    ))}
                  </ul>
                </div>
              </article>

              <article className="timeline-card reveal">
                <div className="timeline-date">Jan 2024 to Jul 2024</div>
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

        <section id="expertise" className="services-section" aria-labelledby="expertise-title">
          <div className="services-inner">
            <div className="section-heading reveal">
              <p className="section-kicker">&#123; Core Expertise &#125;</p>
              <h2 id="expertise-title">What I bring to your product</h2>
              <p>Hands-on delivery across the stack, from the first interface to the production release.</p>
            </div>
            <div className="expertise-grid">
              {expertise.map((service, index) => (
                <article className="capability-card reveal" style={{ "--reveal-delay": `${(index % 2) * 90}ms` } as CSSProperties} key={service.title}>
                  <div className="capability-heading"><span>{service.number}</span><h3>{service.title}</h3></div>
                  <p className="capability-outcome">{service.outcome}</p>
                  <p className="capability-description">{service.description}</p>
                  <ul className="capability-tools" aria-label={service.title + " tools"}>
                    {service.tech.map((tech) => <li key={tech}>{tech}</li>)}
                  </ul>
                  <a className="capability-proof" href={service.href} target={service.href.startsWith("https:") ? "_blank" : undefined} rel={service.href.startsWith("https:") ? "noreferrer" : undefined}>
                    {service.proof}<Arrow />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="about-section" aria-labelledby="about-title">
          <div className="about-inner">
            <div className="about-heading reveal">
              <p className="section-kicker section-kicker--light">&#123; About Me &#125;</p>
              <h2 id="about-title">I work across the whole stack and lead the room.</h2>
            </div>

            <div className="about-content">
              <div className="about-copy reveal">
                <p className="about-lead">
                  Based in Mirpur, Dhaka, I build end-to-end web and mobile products that need to work in the real world, not just in a demo.
                </p>
                <p>
                  At Scaleup IT Limited, I translate business requirements into architecture, data models and API contracts, guide UI/UX decisions, review code and own releases across development, UAT and production. My work spans typed Next.js products, Node.js services, media pipelines, cloud infrastructure and AI automation.
                </p>
                <a className="text-link" href="#experience">My journey <Arrow /></a>
              </div>

              <div className="stat-grid parallax-layer" data-parallax="24">
                {stats.map((stat, index) => (
                  <article className="stat-card reveal" style={{ "--reveal-delay": `${index * 80}ms` } as CSSProperties} key={stat.label}>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </article>
                ))}
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
              <div><span>Find me</span><a href="https://github.com/fahim37" target="_blank" rel="noreferrer">GitHub <Arrow direction="up-right" /></a></div>
              <div><span>Resume</span><a href="/Fahim_Ahmed_Emon_Resume.pdf" download>Download PDF <Arrow direction="down" /></a></div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <span>© {new Date().getFullYear()} Fahim Ahmed Emon</span>
          <span>Full Stack Developer · Team Lead</span>
          <a href="#top">Back to top <Arrow direction="up" /></a>
        </footer>
      </main>
    </div>
  );
}
