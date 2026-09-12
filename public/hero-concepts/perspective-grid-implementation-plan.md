# Beyond the Interface — perspective-grid hero

Status: current implementation plan. User selected the Codrops perspective-grid demo as the visual reference. Planning only; the hero has not yet been changed.

## Direction

A full-width field of project screens, arranged in a deliberate perspective grid around oversized typography. Scrolling brings cards through depth and into a composed gallery, revealing the skills behind the work. Use the existing charcoal, warm white, and orange palette.

This replaces the earlier exploded system sculpture direction. Retain its objective: visitors can understand Fahim's identity, skills, and evidence of delivery before they scroll.

Reference: https://tympanus.net/Development/Scroll3DGrid/

The reference contains several sequences. Use its first image-grid sequence as the default motion reference: staggered cards at varying depths and angles, coordinated travel through perspective, and large typography. Adapt it into one concise hero sequence. Browser reference captures are in tmp/hero-review/codrops-reference-*.png.

## Composition

- Use approximately seven cards: four real project images and three compact capability diagrams. Project imagery occupies most of the visual area.
- Arrange cards on a loose three-column grid with deliberate differences in size, angle, depth, and offset. Keep enough visible at the opening to signal what scrolling will reveal.
- Place the headline centrally in a protected area of negative space. Keep foreground cards clear of the text and actions; background cards may sit behind a controlled dark gradient.
- Keep image colors intact inside graphite frames with fine borders, modest corner rounding, and soft shadows. Use orange for active emphasis and small labels.
- Use horizontal captions alongside the moving imagery for readable project names and technologies. Tiny text within screenshots serves as visual context; the captions convey the useful information.
- Choose one coordinated motion sequence and maintain a balanced composition throughout. No perpetual card spinning or random motion.

## Opening content

Identity: Fahim Ahmed Emon — Full Stack Developer & Team Lead.

Eyebrow: FROM INTERFACE TO INFRASTRUCTURE.

Headline: Beyond the / interface.

Supporting copy: I build polished web products, the systems behind them, and the automation that connects it all.

Visible stack: Next.js / TypeScript / Node.js / AWS / AI Agents.

Proof: 15+ client web projects delivered, matching the existing portfolio claim.

Actions: Explore my work (#projects) and Let's talk (#contact). Keep the resume download and existing navigation available.

## Card content

| Card | Source / treatment | Caption |
| --- | --- | --- |
| GCL storefront | public/projects/gcl-storefront-showcase.webp; frame the screenshot and hide browser chrome within its screen viewport | Commerce interfaces — Next.js / TypeScript |
| GCL control suite | public/projects/gcl-control-suite.webp; use a mild transform because this asset already contains perspective | Admin and vendor workspaces — React / TypeScript |
| Elevator Video Pitch | public/projects/evp-homepage-showcase.webp | Video platforms — Express / Cloudflare R2 / HLS |
| G-TEN Bespoke | public/projects/gten-bespoke-showcase.webp | Business tools — Next.js / Express / MongoDB |
| APIs and data | Original HTML/SVG diagram: Request → API → Database, with a queue branch | Backend expertise — Node.js / PostgreSQL / Redis |
| Cloud and delivery | Original HTML/SVG diagram with deploy, storage, and delivery nodes | Cloud expertise — AWS / Docker / Nginx |
| Agent workflow | Original HTML/SVG diagram: Task → Tool → Result | AI expertise — Tool calling / Queues / Integrations |

Capability diagrams describe portfolio-wide expertise. Label them accordingly; do not imply that every technology is used in every pictured project. Use existing project claims and avoid invented metrics, fake live status, or presenting concept placeholders as delivered work.

## Scroll sequence

Start with approximately 240–260svh total desktop hero height, including the sticky viewport. Tune the length during visual review.

| Progress | Motion | Information |
| --- | --- | --- |
| 0–15% | Several project cards are already visible around the headline, at varied depths and modest angles. | Identity, stack, proof, and actions are readable immediately. |
| 15–45% | The gallery advances through perspective; cards move by different amounts and begin facing the viewer. Preserve the central text area. | Featured project names and concise stack captions become prominent. |
| 45–75% | The grid spreads into a broader composition; capability cards come forward among the project images. | Backend, cloud, and AI expertise becomes visible alongside real work. |
| 75–100% | Cards settle into a composed gallery with reduced rotation. Keep a short reading interval, then release into Core Expertise. | Close with Built across the whole stack and the persistent work action. |

Keep the main H1 and actions stable. A separate short chapter caption can change as the grid moves. Use a thin scroll-progress treatment if helpful; avoid crowding the composition with both many chapter controls and counters.

## Responsive and motion behavior

- Desktop: full spatial composition with seven cards, oversized heading, and protected text margins.
- Tablet: reduce depth, card size, and lateral travel; preserve readable captions.
- Phone: heading, stack, and actions above a compact two-column gallery in normal flow. Reduce motion to short local reveals and keep capability text accessible beneath the imagery.
- Short landscape viewports: use normal flow so content is never clipped by a viewport-height stage.
- Reduced motion and no JavaScript: static composed gallery, readable capability descriptions, and working links; no long pinned region.
- Decorative transformed content should not produce repeated screen-reader announcements. Provide semantic project/capability text once, and never announce per-frame scroll values.
- Any clickable project image must retain visible focus and a stable target; decorative moving cards may instead pair with a stable selected-work link. Ensure 44px action targets.

## Build order

1. Create the static opening and final gallery compositions in the browser using existing images and three custom HTML/SVG diagrams. Inspect every image before deciding crops.
2. Implement PerspectiveProjectGrid.tsx and scoped styles; keep card content and per-card transform ranges in a small declarative configuration.
3. Integrate the grid into SignalHero.tsx and revise SignalHero.module.css for the central composition, persistent copy, and responsive layouts.
4. Adapt the existing passive scroll/requestAnimationFrame logic to one normalized progress value. Derive predictable card transforms from that value so reverse scrolling and fast input settle correctly.
5. Build with CSS perspective and transform-style: preserve-3d. Keep clipping, filters, opacity, and isolation wrappers separate from the 3D hierarchy to avoid flattening descendants. Keep essential labels outside strongly transformed planes.
6. Stop animation work offscreen; remeasure on resize and handle browser back restoration. Use the installed Next.js image guide for responsive images and intentional loading of first-viewport assets.
7. Add subtle hover emphasis on fine pointers after the scroll sequence works. Disable optional motion for reduced-motion users.
8. Preserve existing navigation, theme integration, resume link, project/contact anchors, and the transition to Core Expertise.

The first implementation uses existing React, CSS, and SVG capabilities. No new video generation or animation dependency is required. If reproducing the reference's exact choreography later requires a library, assess that separately against the browser prototype.

## Validation

- Capture start, quarter, middle, three-quarter, and end positions at 1440×900 and 1280×720. Verify distinct visual progression, balanced card placement, readable captions, and no obstruction of actions.
- Check 820×1180, 390×844, 320×568, and 844×390 for content fit, image crops, and horizontal overflow.
- Exercise reverse scrolling, rapid input, resizing, direct #projects navigation, and back restoration.
- Verify keyboard access, reduced motion, disabled JavaScript, and image-load failure fallbacks.
- Adapt existing tmp/hero-review checks from video timing to grid state and geometry. Retain meaningful viewport and navigation checks.
- Run lint and production build; separate existing failures from regressions. Inspect browser performance under CPU throttling and avoid per-frame layout calculations.
- Review Chromium and Safari/WebKit where available; report coverage and limitations accurately.

Success: visitors see real work and the main stack immediately; scrolling delivers the depth and movement of the chosen reference; every major skill has a readable explanation; mobile remains quick to navigate.

## References

- Codrops demo: https://tympanus.net/Development/Scroll3DGrid/
- Motion explanation: https://tympanus.net/codrops/2023/08/03/on-scroll-perspective-grid-animations/
- CSS 3D hierarchy: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style
- Installed Next.js guides: node_modules/next/dist/docs/01-app/01-getting-started/12-images.md and 05-server-and-client-components.md.
