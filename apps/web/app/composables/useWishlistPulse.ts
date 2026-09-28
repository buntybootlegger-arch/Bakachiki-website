/** Small heart-burst micro-interaction for wishlist toggles. */
export function useWishlistPulse() {
  const prefersReduced = usePrefersReducedMotion();

  async function pulse(el: HTMLElement) {
    if (prefersReduced.value) return;
    const { gsap } = await import("gsap");

    gsap.fromTo(
      el,
      { scale: 1 },
      { scale: 1.4, duration: 0.15, ease: "power1.out", yoyo: true, repeat: 1 },
    );

    const rect = el.getBoundingClientRect();
    for (let i = 0; i < 4; i++) {
      const particle = document.createElement("span");
      particle.textContent = "♥";
      particle.style.position = "fixed";
      particle.style.left = `${rect.left + rect.width / 2}px`;
      particle.style.top = `${rect.top + rect.height / 2}px`;
      particle.style.color = "var(--accent-primary)";
      particle.style.fontSize = "10px";
      particle.style.pointerEvents = "none";
      particle.style.zIndex = "9999";
      document.body.appendChild(particle);

      const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2;
      gsap.to(particle, {
        x: Math.cos(angle) * 24,
        y: Math.sin(angle) * 24,
        opacity: 0,
        duration: 0.5,
        ease: "power1.out",
        onComplete: () => particle.remove(),
      });
    }
  }

  return { pulse };
}
