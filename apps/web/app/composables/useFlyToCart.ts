/** Animates a clone of `imageEl` flying from its position to the header cart icon. */
export function useFlyToCart() {
  const prefersReduced = usePrefersReducedMotion();

  async function fly(imageEl: HTMLElement) {
    const cartIcon = document.getElementById("cart-icon-target");
    if (!cartIcon || prefersReduced.value) return;

    const { gsap } = await import("gsap");

    const startRect = imageEl.getBoundingClientRect();
    const endRect = cartIcon.getBoundingClientRect();

    const clone = imageEl.cloneNode(true) as HTMLElement;
    clone.style.position = "fixed";
    clone.style.top = `${startRect.top}px`;
    clone.style.left = `${startRect.left}px`;
    clone.style.width = `${startRect.width}px`;
    clone.style.height = `${startRect.height}px`;
    clone.style.zIndex = "9999";
    clone.style.borderRadius = "0.5rem";
    clone.style.pointerEvents = "none";
    document.body.appendChild(clone);

    gsap.to(clone, {
      duration: 0.7,
      ease: "power1.in",
      left: endRect.left + endRect.width / 2 - 10,
      top: endRect.top + endRect.height / 2 - 10,
      width: 20,
      height: 20,
      opacity: 0.4,
      onComplete: () => clone.remove(),
    });

    gsap.fromTo(cartIcon, { scale: 1 }, { scale: 1.3, duration: 0.15, yoyo: true, repeat: 1, delay: 0.6 });
  }

  return { fly };
}
