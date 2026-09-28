import type { Ref } from "vue";

/** Continuous scroll-scrubbed vertical drift, for decorative elements (not reveal-once content). */
export function useParallax(target: Ref<HTMLElement | null>, options: { speed?: number } = {}) {
  const prefersReduced = usePrefersReducedMotion();

  onMounted(async () => {
    await nextTick();
    const el = target.value;
    if (!el || prefersReduced.value) return;

    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]);
    gsap.registerPlugin(ScrollTrigger);

    gsap.to(el, {
      yPercent: options.speed ?? 20,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
}
