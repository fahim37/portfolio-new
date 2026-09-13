"use client";

import { useEffect, useRef } from "react";
import styles from "./SignalHero.module.css";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

// Direction uses `rotate` so hover nudges can use `translate` without replacing it.
function ArrowIcon({ rotate = 0 }: { rotate?: number }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={rotate ? { rotate: `${rotate}deg` } : undefined}><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

export default function SignalHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!section || !stage || !video) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Keep touch phones/tablets (including landscape) out of the scroll decoder.
    const mobile = window.matchMedia("(max-width: 767px), (max-width: 1023px) and (pointer: coarse)");
    let frame = 0;
    let progress = 0;
    let failed = false;

    // Allow one seek at a time. Each completion picks up the latest scroll target.
    const seek = () => {
      if (mobile.matches || reducedMotion.matches || failed || video.readyState < 2 || video.seeking || !Number.isFinite(video.duration)) return;
      const target = progress * Math.max(0, video.duration - 1 / 24);
      if (Math.abs(video.currentTime - target) > 1 / 48) video.currentTime = target;
    };

    const render = () => {
      frame = 0;
      const travel = section.offsetHeight - stage.offsetHeight;
      progress = reducedMotion.matches || mobile.matches ? 0 : clamp(-section.getBoundingClientRect().top / Math.max(1, travel));
      const introOpacity = 1 - clamp((progress - 0.2) / 0.18);
      const nextOpacity = clamp((progress - 0.43) / 0.18);
      section.style.setProperty("--journey", String(progress));
      section.style.setProperty("--intro-opacity", String(introOpacity));
      section.style.setProperty("--intro-y", `${(1 - introOpacity) * -24}px`);
      section.style.setProperty("--next-opacity", String(nextOpacity));
      section.style.setProperty("--next-y", `${(1 - nextOpacity) * 24}px`);
      section.dataset.chapter = progress < 0.33 ? "0" : progress < 0.67 ? "1" : "2";
      if (progressRef.current) progressRef.current.textContent = String(Math.round(progress * 100)).padStart(2, "0");
      seek();
    };

    const requestUpdate = () => {
      if (mobile.matches || reducedMotion.matches) return;
      if (!frame) frame = window.requestAnimationFrame(render);
    };
    const loaded = () => {
      section.dataset.videoReady = "true";
      requestUpdate();
    };
    const onError = () => {
      failed = true;
      section.dataset.videoReady = "false";
    };
    const configure = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      video.pause();
      failed = false;
      section.dataset.videoReady = "false";
      if (reducedMotion.matches || mobile.matches) {
        video.removeAttribute("src");
        video.load();
      } else {
        const source = "/herovid/hero-desktop.mp4";
        if (video.getAttribute("src") !== source) {
          video.src = source;
          video.load();
        } else if (video.readyState >= 2) {
          section.dataset.videoReady = "true";
        }
        window.addEventListener("scroll", requestUpdate, { passive: true });
        window.addEventListener("resize", requestUpdate);
      }
      render();
    };

    video.addEventListener("loadeddata", loaded);
    video.addEventListener("canplay", requestUpdate);
    video.addEventListener("seeked", seek);
    video.addEventListener("error", onError);
    reducedMotion.addEventListener("change", configure);
    mobile.addEventListener("change", configure);
    configure();

    return () => {
      window.cancelAnimationFrame(frame);
      video.removeEventListener("loadeddata", loaded);
      video.removeEventListener("canplay", requestUpdate);
      video.removeEventListener("seeked", seek);
      video.removeEventListener("error", onError);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      reducedMotion.removeEventListener("change", configure);
      mobile.removeEventListener("change", configure);
      video.pause();
    };
  }, []);

  return (
    <section className={styles.hero} ref={sectionRef} aria-labelledby="hero-title" data-chapter="0" data-signal-hero>
      <div className={styles.stage} ref={stageRef}>
        <div className={styles.media} aria-hidden="true">
          <video ref={videoRef} muted playsInline preload="auto" poster="/herovid/hero-poster.jpg" disablePictureInPicture tabIndex={-1} />
        </div>
        <div className={styles.shade} aria-hidden="true" />

        <div className={styles.masthead}>
          <a href="#top" className={styles.identity} aria-label="Fahim Ahmed Emon, home"><span className={styles.identityMark} aria-hidden="true">fe.</span><span>FAHIM AHMED EMON<small>FULL STACK DEVELOPER & TEAM LEAD</small></span></a>
          <a className={styles.resume} href="/Fahim_Ahmed_Emon_Resume.pdf" download>Resume <ArrowIcon rotate={90} /></a>
        </div>

        <div className={styles.story}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}><span /> ENGINEERING THE WHOLE EXPERIENCE</p>
            <h1 id="hero-title">Beyond the<br /><em>interface.</em></h1>
            <p className={styles.description}>I’m Fahim. I turn complex ideas into intuitive products and engineer the systems that power them.</p>
          </div>
          <div className={styles.reveal} aria-hidden="true">
            <p className={styles.eyebrow}><span /> FROM FIRST IDEA TO FINAL DEPLOYMENT</p>
            <p className={styles.revealTitle}>Built to<br /><em>go deeper.</em></p>
            <p className={styles.description}>Thoughtful interfaces. Resilient infrastructure.<br />Intelligent automation. One connected experience.</p>
          </div>
        </div>

        <div className={styles.bottom}>
          <div className={styles.actionRow}>
            <div className={styles.actions}>
              <a className={styles.primary} href="#projects" data-cursor="Work">Explore my work <ArrowIcon /></a>
              <a className={styles.secondary} href="#contact"><span className={styles.linkLabel}>Let’s talk</span><ArrowIcon rotate={-45} /></a>
            </div>
            <p className={styles.sideNote}>From the pixels you see<br />to the systems you don’t.</p>
          </div>
          <div className={styles.footer}>
            <a className={styles.scrollHint} href="#projects"><ArrowIcon rotate={90} /><span><span className={styles.motionHint}>SCROLL TO EXPLORE</span><span className={styles.staticHint}>EXPLORE MY WORK</span></span></a>
            <div className={styles.chapters} aria-label="Interfaces, systems, intelligence">
              <span className={styles.chapter}><i>01</i> Interfaces</span>
              <span className={styles.chapter}><i>02</i> Systems</span>
              <span className={styles.chapter}><i>03</i> Intelligence</span>
            </div>
            <span className={styles.counter} aria-hidden="true"><span ref={progressRef}>00</span><span> / 100</span></span>
          </div>
        </div>
        <div className={styles.progress} aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
