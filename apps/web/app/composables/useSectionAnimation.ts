import type { Ref } from "vue";
import type { AnimationPreset } from "@bakachiki/shared";

interface SectionAnimationOptions {
  y?: number;
  duration?: number;
  delay?: number;
  stagger?: boolean;
}

/**
 * Reveals an element (or its direct children when `stagger` is set) using
 * one of the CMS-selectable `AnimationPreset`s. Lazy-loads GSAP/ScrollTrigger
 * on the client only. Hard-disables under `prefers-reduced-motion` regardless
 * of preset — the element is shown immediately with no animation.
 */
export function useSectionAnimation(
  target: Ref<HTMLElement | null>,
  preset: AnimationPreset = "fadeUp",
  options: SectionAnimationOptions = {},
) {
  const prefersReduced = usePrefersReducedMotion();

  onMounted(async () => {
    await nextTick();
    const el = target.value;
    if (!el) return;

    if (preset === "none" || prefersReduced.value) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }

    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]);
    gsap.registerPlugin(ScrollTrigger);

    const targets = options.stagger ? Array.from(el.children) : el;
    const stagger = options.stagger ? 0.08 : 0;

    if (preset === "parallax") {
      gsap.to(targets, {
        yPercent: -(options.y ?? 15),
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      });
      return;
    }

    if (preset === "scaleReveal") {
      gsap.fromTo(
        targets,
        { opacity: 0, scale: 0.92 },
        {
          opacity: 1,
          scale: 1,
          duration: options.duration ?? 0.8,
          delay: options.delay ?? 0,
          ease: "power2.out",
          stagger,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
      return;
    }

    if (preset === "fadeIn") {
      gsap.fromTo(
        targets,
        { opacity: 0 },
        {
          opacity: 1,
          duration: options.duration ?? 0.8,
          delay: options.delay ?? 0,
          stagger,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
      return;
    }

    // fadeUp / staggerUp share the same reveal shape; "marquee" as a section
    // preset falls back here too (the actual marquee loop is driven by
    // useMarquee on MarqueeSection, not by this reveal-on-scroll composable).
    gsap.fromTo(
      targets,
      { opacity: 0, y: options.y ?? 24 },
      {
        opacity: 1,
        y: 0,
        duration: options.duration ?? 0.8,
        delay: options.delay ?? 0,
        ease: "power2.out",
        stagger,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      },
    );
  });
}
