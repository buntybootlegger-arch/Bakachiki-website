import type { Ref } from "vue";

/**
 * Drives an infinite horizontal scroll on `track` (expected to contain the
 * marquee content duplicated twice back-to-back so the loop is seamless).
 * Freezes to a static, fully-visible state under reduced motion.
 */
export function useMarquee(track: Ref<HTMLElement | null>, options: { speed?: number } = {}) {
  const prefersReduced = usePrefersReducedMotion();

  onMounted(async () => {
    await nextTick();
    const el = track.value;
    if (!el || prefersReduced.value) return;

    const { gsap } = await import("gsap");
    const distance = el.scrollWidth / 2;
    const duration = distance / (options.speed ?? 60);

    gsap.to(el, {
      x: -distance,
      duration,
      ease: "none",
      repeat: -1,
    });
  });
}
