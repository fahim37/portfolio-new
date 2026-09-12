# Beyond the Interface — hero implementation plan

Status: superseded by [Perspective Grid implementation plan](./perspective-grid-implementation-plan.md), following the user's selection of the Codrops reference. The layered system sculpture below is an archived alternative; implement the perspective-grid plan. Neither document changes the live hero.

## Outcome

Build a professional, visually striking introduction that makes Fahim's full-stack skills clear on arrival. A real product screen opens into a spatial arrangement of interface, services, infrastructure, and automation. The final view explains the breadth of his work and leads directly to selected projects.

The hero should communicate identity, capability, and evidence before a visitor scrolls. Scrolling adds depth to that initial message.

## Visual direction

- Deep charcoal (#101211), warm white, satin silver edges, and the existing orange (#f55733) accent. Retain the site's typography and orange serif emphasis.
- Desktop composition: approximately 44% copy and 56% visual space, adjusted for the existing navigation rail. Give the scene enough room that its labels never cross the headline.
- One prominent product plane at a modest three-quarter angle, with three supporting planes partially visible beneath it. Establish depth immediately through offsets, thin edges, and soft shadows.
- Keep the screenshot in its original colors. Enclose it in a restrained graphite frame so it sits naturally in the charcoal composition.
- Render small technical labels outside the tilted planes, horizontally, at readable sizes. Use short capability descriptions and a maximum of three featured technologies per chapter.
- Use one orange path to connect the layers. Light the currently discussed layer while keeping the others subdued.
- Add a broad, faint orange background glow and a quiet grounding shadow. Motion should be deliberate: a small opening settle, controlled separation, and one signal journey.
- The main visual must look composed when paused at any scroll position. Avoid constant spinning, dense logo clouds, fake terminals, and invented live metrics.

## First viewport and copy

- Identity: Fahim Ahmed Emon / Full Stack Developer & Team Lead.
- Eyebrow: FROM INTERFACE TO INFRASTRUCTURE.
- H1: Beyond the / interface.
- Supporting copy: I build polished web products, the systems behind them, and the automation that connects it all.
- Persistent compact stack: Next.js / TypeScript / Node.js / AWS / AI Agents. Allow clean wrapping.
- Proof: 15+ client web projects delivered, matching the existing portfolio claim.
- Primary action: Explore my work, linking to #projects.
- Secondary action: Let's talk, linking to #contact.
- Scene caption: GCL E-Commerce — selected work. Place a separate readable caption on the wider scene: My engineering toolkit, to establish that the full composition represents expertise across projects.
- Keep the main heading, identity, stack, and actions stable. Update a compact chapter explanation next to the scene as visitors scroll.

## Assets and accurate representation

Use public/projects/gcl-storefront-showcase.webp for the main product plane. It is an existing flat screenshot with browser chrome; hide that strip within the CSS screen viewport when framing it. Keep the project recognizable and avoid stretching it.

public/projects/gcl-control-suite.webp is already a perspective montage. Keep it as a supporting project asset; adding a second strong perspective transform would make its screens harder to read.

The page documents GCL's Next.js, TypeScript, Express, PostgreSQL, Redis, and BullMQ stack. AWS, Docker, Cloudflare, and agent tooling describe broader portfolio expertise; do not imply they are all verified components of GCL's deployment. The scene is a conceptual explanation of capabilities, not a literal production architecture or a live system monitor.

Create the service, cloud, and automation planes with HTML and SVG. The first implementation requires no new generated video or bitmap illustration. Any later cinematic background asset is optional polish after the working scene has been assessed.

## Desktop scroll storyboard

Start with roughly 260svh total section height, including the sticky viewport; tune after browser review. Preserve native scrolling and keep the project action available throughout.

| Progress | Visual event | Chapter copy and featured technologies |
| --- | --- | --- |
| 0–15% | Product screen is the focal point; underlying planes peek out. Initial composition is complete on load. | Interface — Polished, typed product experiences. Next.js / React / TypeScript. |
| 15–40% | Screen lifts; service and data modules become visible. A restrained path draws between the screen and API plane. | Services — APIs, data, and background jobs. Node.js / PostgreSQL / Redis. |
| 40–65% | Infrastructure plane separates; the whole scene shifts slightly to preserve margins and visible connections. | Infrastructure — Deployment, storage, and delivery. AWS / Docker / Cloudflare. |
| 65–85% | An automation branch appears; the signal moves from a job node through a tool node to a result node. | Intelligence — Agents connected to useful business workflows. Tool calling / Queues / Integrations. |
| 85–100% | All four planes form one balanced composition; connections settle. The section releases into Core Expertise. | One connected experience. Interface / Services / Infrastructure / Intelligence. |

Use scroll-derived transforms so the scene reverses naturally. Chapter explanations crossfade briefly without causing layout shifts. Keep four meaningful chapter indicators and a thin progress line; replace the decorative 00/100 counter with useful chapter information.

## Responsive and accessible behavior

- Wide desktop: copy beside the full spatial scene; keep text labels outside transformed artwork.
- Tablet: adjust the scene angle and separation to preserve readable copy. Use a stacked layout when two columns stop fitting comfortably.
- Phones: show heading, compact stack, proof, and actions before a compact scene. Use normal document flow with four concise capability rows and a small scene reveal as it enters view. Avoid carrying the long desktop pinning sequence onto phones.
- Short landscape screens: prefer normal flow and a compact static scene so navigation and actions remain reachable.
- Reduced motion: present the completed arrangement with a static capability summary; disable pinning, pointer tilt, and animated signal travel.
- Baseline HTML must contain readable identity, skills, and actions before effects run. Provide a useful static scene when JavaScript is unavailable.
- Decorative planes and signal paths are hidden from assistive technology. Keep one semantic heading and one accessible capability list. Do not announce continuous scroll updates.
- Keep keyboard focus visible and targets at least 44px. If chapter navigation is interactive, use native buttons with explicit labels and retain focus during transitions.

## Implementation structure

1. Build the static composition and responsive layout first, using the existing screenshot. Assess the beginning and fully expanded states before adding motion.
2. Add a focused ProductSystemScene component with declarative layer content, screen framing, SVG routes, and external label anchors.
3. Replace the video-driven interior of SignalHero.tsx with the new scene and stable copy. Keep its existing integration in app/page.tsx unless renaming materially helps maintainability.
4. Rework SignalHero.module.css for the two-column layout, layer surfaces, mobile flow, and reduced-motion state. Keep scene-specific styles scoped.
5. Adapt the existing passive scroll and requestAnimationFrame approach to calculate one normalized progress value. Map that value to each chapter's transforms and signal position through CSS custom properties. Avoid React rerenders for every animation frame.
6. Stop animation work when the scene is inactive; recalculate geometry on resize and restore the correct scene state after back navigation or loading at a scrolled position.
7. Add small pointer tilt only for fine pointers, if browser review shows it improves the result. Keep tilt subordinate to scroll motion and disable it for reduced motion.
8. Preserve existing navigation, resume download, project links, and the transition into the expertise section.

Use the installed Next.js documentation before implementation, particularly the image and client-component guides. Use responsive image dimensions/sizes and an intentional loading strategy for the main visible screenshot. No animation dependency is required for the planned first version.

CSS implementation detail: keep the preserve-3d hierarchy separate from clipping and fading wrappers; opacity, filters, overflow, and isolation on that hierarchy can flatten descendants. Place SVG connections in the same coordinate system as their anchors, or explicitly project anchor positions into a flat overlay. Check attachment at intermediate progress values.

## Validation and completion criteria

- At 1440×900, 1280×720, 820×1180, 390×844, 320×568, and 844×390, verify readable content, reachable actions, scene boundaries, and zero horizontal overflow.
- Inspect desktop screenshots at 0%, 25%, 50%, 75%, and 100%; verify a visibly distinct reveal at each chapter, crisp external labels, and no text or plane collisions.
- Exercise forward and reverse scrolling, fast direction changes, window resizing, direct #projects navigation, and browser back restoration.
- Check keyboard navigation, reduced motion, disabled JavaScript, and a failed screenshot request. Essential content and navigation must remain usable.
- Adapt the existing tmp/hero-review browser checks to scene state; replace assertions that require video loading and seeking. Reuse its viewport and navigation coverage.
- Run the project's lint and production build. Report pre-existing failures separately if encountered.
- Inspect a browser performance trace under CPU throttling for animation jank; target smooth rendering on the tested desktop and avoid layout work on every frame. Compare loading performance with the existing hero and report measured results without promising a score in advance.
- Review Safari/WebKit if available; state explicitly if verification is limited to Chromium.

Finished means the hero is visually polished in both initial and expanded states, clearly communicates skills before scrolling, uses recognizable project imagery, and remains usable on small screens and with motion disabled.

## Technical references

- Local Next.js image guide: node_modules/next/dist/docs/01-app/01-getting-started/12-images.md.
- Local Next.js component guide: node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md.
- CSS 3D hierarchy and flattening: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style
- Reduced motion: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
