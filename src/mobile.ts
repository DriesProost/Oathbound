// Best-effort virtual-keyboard ergonomics; never modifies form values or campaign state.
export function startMobileViewport() {
  const viewport = window.visualViewport;
  if (!viewport) return;
  let frame = 0;
  const refresh = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const focused = document.activeElement;
      const editing =
        focused instanceof HTMLInputElement ||
        focused instanceof HTMLTextAreaElement ||
        focused instanceof HTMLSelectElement;
      const keyboard = editing && viewport.height < window.innerHeight * 0.8;
      document.documentElement.dataset.keyboard = keyboard ? "open" : "closed";
      if (keyboard) {
        const bounds = focused.getBoundingClientRect();
        const bottom = viewport.offsetTop + viewport.height - 24;
        const top = viewport.offsetTop + 64;
        if (bounds.bottom > bottom)
          window.scrollBy({ top: bounds.bottom - bottom, behavior: "instant" });
        else if (bounds.top < top)
          window.scrollBy({ top: bounds.top - top, behavior: "instant" });
      }
    });
  };
  viewport.addEventListener("resize", refresh);
  document.addEventListener("focusin", refresh);
  document.addEventListener("focusout", refresh);
}
