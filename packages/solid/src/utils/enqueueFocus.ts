import type {FocusableElement} from 'tabbable';

interface Options {
  preventScroll?: boolean;
  cancelPrevious?: boolean;
  sync?: boolean;
}

let rafId = 0;
export function enqueueFocus(
  el: FocusableElement | null,
  options: Options = {},
) {
  const preventScroll = options.preventScroll ?? false;
  const cancelPrevious = options.cancelPrevious ?? true;
  const sync = options.sync ?? false;

  cancelPrevious && cancelAnimationFrame(rafId);

  const exec = () => {
    if (!el) return;
    // Guard against calling focus() on a node that hasn’t been attached to any window
    const win = el.ownerDocument?.defaultView;
    if (!win) return;
    el.focus({preventScroll});
  };

  if (sync) {
    exec();
  } else {
    rafId = requestAnimationFrame(exec);
  }
  
}
