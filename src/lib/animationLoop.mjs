export function createAnimationLoop({ canRun, render, request = requestAnimationFrame, cancel = cancelAnimationFrame, fps = 30 }) {
  let frame = null;
  let previous = null;
  let disposed = false;
  const tick = now => {
    frame = null;
    if (disposed || !canRun()) { previous = null; return; }
    if (previous === null || now - previous >= 1000 / fps) {
      const delta = previous === null ? 0 : Math.min((now - previous) / 1000, 0.1);
      previous = now;
      render(delta);
    }
    if (!disposed && canRun()) frame = request(tick);
  };
  return {
    sync() {
      if (disposed) return;
      if (!canRun()) {
        if (frame !== null) cancel(frame);
        frame = null;
        previous = null;
      } else if (frame === null) {
        previous = null;
        frame = request(tick);
      }
    },
    dispose() {
      disposed = true;
      if (frame !== null) cancel(frame);
      frame = null;
      previous = null;
    }
  };
}
