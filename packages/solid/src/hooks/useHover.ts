import {
  Accessor,
  createEffect,
  createMemo,
  mergeProps,
  onCleanup,
} from 'solid-js';
import {access, MaybeAccessor} from '@solid-primitives/utils';
import {isElement} from '@floating-ui/utils/dom';
import {
  useFloatingParentNodeId,
  useUnsafeFloatingTree,
} from '../components/FloatingTree';
import type {
  ElementProps,
  FloatingContext,
  FloatingTreeType,
  OpenChangeReason,
  ReferenceType,
} from '../types';
import {contains, getDocument} from '../utils/element';
import {isMouseLikePointerType} from '../utils/event';
import {createAttribute} from '../utils/createAttribute';
import {destructure} from '../utils/destructure';

const safePolygonIdentifier = createAttribute('safe-polygon');

export interface HandleCloseFn<RT extends ReferenceType = ReferenceType> {
  (
    context: FloatingContext<RT> & {
      onClose: () => void;
      tree?: FloatingTreeType<RT> | null;
      leave?: boolean;
    },
  ): (event: MouseEvent) => void;
  __options: {
    blockPointerEvents: boolean;
  };
}

export function getDelay(
  value: MaybeAccessor<number | Partial<{open: number; close: number}>>,
  prop: 'open' | 'close',
  pointerType?: PointerEvent['pointerType'],
) {
  const valueRef = access(value);
  if (pointerType && !isMouseLikePointerType(pointerType)) {
    return 0;
  }

  if (typeof valueRef === 'number') {
    return valueRef;
  }

  if (typeof value === 'function') {
    const result = value();
    if (typeof result === 'number') {
      return result;
    }
    return result?.[prop];
  }

  return valueRef?.[prop];
}

function getRestMs(value: number | (() => number)) {
  if (typeof value === 'function') {
    return value();
  }
  return value;
}

export interface UseHoverProps<RT extends ReferenceType = ReferenceType> {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeAccessor<boolean>;
  /**
   * Accepts an event handler that runs on `mousemove` to control when the
   * floating element closes once the cursor leaves the reference element.
   * @default null
   */
  handleClose?: HandleCloseFn<RT>;
  /**
   * Waits until the user’s cursor is at “rest” over the reference element
   * before changing the `open` state.
   * @default 0
   */
  restMs?: MaybeAccessor<number>;
  /**
   * Waits for the specified time when the event listener runs before changing
   * the `open` state.
   * @default 0
   */
  delay?: MaybeAccessor<number | Partial<{open: number; close: number}>>;
  /**
   * Whether the logic only runs for mouse input, ignoring touch input.
   * Note: due to a bug with Linux Chrome, "pen" inputs are considered "mouse".
   * @default false
   */
  mouseOnly?: MaybeAccessor<boolean>;
  /**
   * Whether moving the cursor over the floating element will open it, without a
   * regular hover event required.
   * @default true
   */
  move?: MaybeAccessor<boolean>;
}

/**
 * Opens the floating element while hovering over the reference element, like
 * CSS `:hover`.
 * @see https://floating-ui.com/docs/useHover
 */
export function useHover<RT extends ReferenceType = ReferenceType>(
  context: Accessor<FloatingContext<RT>>,
  props: UseHoverProps<RT> = {},
): Accessor<ElementProps> {
  const {open, onOpenChange, refs} = context();
  const mergedProps = mergeProps(
    {
      enabled: true,
      delay: 0,
      handleClose: null,
      mouseOnly: false,
      restMs: 0,
      move: true,
    },
    props,
  ) as Required<Omit<UseHoverProps, 'handleClose'>> & {
    handleClose?: HandleCloseFn<RT>;
  };
  const {enabled, mouseOnly, restMs, move, delay} = destructure(mergedProps, {
    normalize: true,
  });

  // eslint-disable-next-line solid/reactivity
  const {handleClose} = mergedProps;
  const handleCloseRef = handleClose;
  const tree = useUnsafeFloatingTree<RT>();
  const parentId = useFloatingParentNodeId();

  let pointerTypeRef: string | undefined;
  let timeoutRef: any;
  let handlerRef: ((event: MouseEvent) => void) | null | undefined;
  let restTimeoutRef: any;
  let blockMouseMoveRef = true;
  let performedPointerEventsMutationRef = false;
  let unbindMouseMoveRef = () => {};

  const isHoverOpen = () => {
    const type = context().dataRef.openEvent?.type;

    return type?.includes('mouse') && type !== 'mousedown';
  };

  // When dismissing before opening, clear the delay timeouts to cancel it
  // from showing.
  function onDismiss() {
    clearTimeout(timeoutRef);
    clearTimeout(restTimeoutRef);
    blockMouseMoveRef = true;
  }
  createEffect(() => {
    if (!enabled()) {
      return context().events.off('dismiss', onDismiss);
    }
    context().events.on('dismiss', onDismiss);
  });
  onCleanup(() => {
    context().events.off('dismiss', onDismiss);
  });

  createEffect(() => {
    if (!enabled() || !handleClose || !open()) {
      return;
    }

    function onLeave(event: MouseEvent) {
      if (isHoverOpen()) {
        onOpenChange(false, event);
      }
    }

    const html = getDocument(refs.floating()).documentElement;
    html?.addEventListener('mouseleave', onLeave);
    onCleanup(() => {
      html?.removeEventListener('mouseleave', onLeave);
    });
  });

  const closeWithDelay = (event: Event, runElseBranch = true, reason: OpenChangeReason = 'hover') => {
    const closeDelay = getDelay(delay, 'close', pointerTypeRef);
    if (closeDelay && !handlerRef) {
      clearTimeout(timeoutRef);

      timeoutRef = setTimeout(() => onOpenChange(false, event, reason), closeDelay);
    } else if (runElseBranch) {
      clearTimeout(timeoutRef);

      onOpenChange(false, event, reason);
    }
  };

  const cleanupMouseMoveHandler = () => {
    unbindMouseMoveRef();
    handlerRef = undefined;
  };

  const clearPointerEvents = () => {
    if (performedPointerEventsMutationRef) {
      const body = getDocument(refs.floating()).body;
      body.style.pointerEvents = '';
      body.removeAttribute(safePolygonIdentifier);
      performedPointerEventsMutationRef = false;
    }
  };

  // Registering the mouse events on the reference directly to bypass React's
  // delegation system. If the cursor was on a disabled element and then entered
  // the reference (no gap), `mouseenter` doesn't fire in the delegation system.
  createEffect(() => {
    if (!enabled()) {
      return;
    }

    function isClickLikeOpenEvent() {
      return context().dataRef.openEvent
        ? ['click', 'mousedown'].includes(
            context()?.dataRef?.openEvent?.type ?? '',
          )
        : false;
    }

    function onMouseEnter(event: MouseEvent) {
      clearTimeout(timeoutRef);
      blockMouseMoveRef = false;

      if (
        (mouseOnly() && !isMouseLikePointerType(pointerTypeRef)) ||
        (restMs() > 0 && getDelay(delay, 'open') === 0)
      ) {
        return;
      }

      const openDelay = getDelay(delay, 'open', pointerTypeRef);
      if (openDelay) {
        timeoutRef = setTimeout(() => {
          onOpenChange(true, event);
        }, openDelay);
      } else {
        onOpenChange(true, event);
      }
    }

    function onMouseLeave(event: MouseEvent) {
      if (isClickLikeOpenEvent()) {
        return;
      }

      unbindMouseMoveRef();

      const doc = getDocument(refs.floating());
      clearTimeout(restTimeoutRef);

      if (handleCloseRef) {
        // Prevent clearing `onScrollMouseLeave` timeout.
        if (!open()) {
          clearTimeout(timeoutRef);
        }

        handlerRef = handleCloseRef({
          ...context(),
          tree: tree?.(),
          x: event.clientX,
          y: event.clientY,
          onClose() {
            clearPointerEvents();
            cleanupMouseMoveHandler();
            // Should the event expose that it was closed by `safePolygon`?
            closeWithDelay(event);
          },
        });

        const handler = handlerRef;

        doc.addEventListener('mousemove', handler);
        unbindMouseMoveRef = () => {
          doc.removeEventListener('mousemove', handler);
        };

        return;
      }

      // Allow interactivity without `safePolygon` on touch devices. With a
      // pointer, a short close delay is an alternative, so it should work
      // consistently.
      const shouldClose =
        pointerTypeRef === 'touch'
          ? !contains(refs.floating(), event.relatedTarget as Element | null)
          : true;
      if (shouldClose) {
        closeWithDelay(event);
      }
    }

    // Ensure the floating element closes after scrolling even if the pointer
    // did not move.
    // https://github.com/floating-ui/floating-ui/discussions/1692
    function onScrollMouseLeave(event: MouseEvent) {
      if (isClickLikeOpenEvent()) {
        return;
      }

      handleCloseRef?.({
        ...context(),
        tree: tree?.(),
        x: event.clientX,
        y: event.clientY,
        onClose() {
          clearPointerEvents();
          cleanupMouseMoveHandler();

          closeWithDelay(event);
        },
      })(event);
    }

    if (isElement(refs.reference())) {
      const ref = refs.reference() as unknown as HTMLElement;

      open() && ref.addEventListener('mouseleave', onScrollMouseLeave);
      refs.floating()?.addEventListener('mouseleave', onScrollMouseLeave);
      move() && ref.addEventListener('mousemove', onMouseEnter, {once: true});
      ref.addEventListener('mouseenter', (e) => onMouseEnter(e));
      ref.addEventListener('mouseleave', (e) => onMouseLeave(e));

      onCleanup(() => {
        open() && ref.removeEventListener('mouseleave', onScrollMouseLeave);
        refs.floating()?.removeEventListener('mouseleave', onScrollMouseLeave);
        move() && ref.removeEventListener('mousemove', onMouseEnter);
        ref.removeEventListener('mouseenter', onMouseEnter);
        ref.removeEventListener('mouseleave', onMouseLeave);
      });
    }
  });

  // Block pointer-events of every element other than the reference and floating
  // while the floating element is open and has a `handleClose` handler. Also
  // handles nested floating elements.
  // https://github.com/floating-ui/floating-ui/issues/1722
  createEffect(() => {
    if (!enabled()) {
      return;
    }

    if (
      open() &&
      handleCloseRef?.__options.blockPointerEvents &&
      isHoverOpen()
    ) {
      const floating = refs.floating();
      const domReference = refs.reference();
      const body = getDocument(floating).body;
      body.setAttribute(safePolygonIdentifier, '');
      body.style.pointerEvents = 'none';
      performedPointerEventsMutationRef = true;

      if (isElement(domReference) && floating) {
        const ref = domReference as unknown as HTMLElement | SVGSVGElement;

        const parentFloating = tree?.()
          ?.nodesRef.find((node) => node.id === parentId)
          ?.context?.refs.floating();

        if (parentFloating) {
          parentFloating.style.pointerEvents = '';
        }

        ref.style.pointerEvents = 'auto';
        floating.style.pointerEvents = 'auto';

        onCleanup(() => {
          ref.style.pointerEvents = '';
          floating.style.pointerEvents = '';
        });
      }
    }
  });

  createEffect(() => {
    if (!open()) {
      pointerTypeRef = undefined;
      cleanupMouseMoveHandler();
      clearPointerEvents();
    }
  });

  createEffect(() => {
    //subscribe
    refs.reference();
    //end of subscribe
    cleanupMouseMoveHandler();
    clearTimeout(timeoutRef);
    clearTimeout(restTimeoutRef);
    clearPointerEvents();
  });

  function setPointerRef(event: PointerEvent) {
    pointerTypeRef = event.pointerType;
  }

  const userProps = createMemo(() => {
    if (!enabled()) return {};

    return {
      reference: {
        onPointerDown: setPointerRef,
        onPointerEnter: setPointerRef,
        onMouseMove(event: MouseEvent) {
          if (open() || restMs() === 0) {
            return;
          }
          clearTimeout(restTimeoutRef);
          restTimeoutRef = setTimeout(() => {
            if (!blockMouseMoveRef) {
              onOpenChange(true, event);
            }
          }, restMs());
        },
      },
      floating: {
        onMouseEnter() {
          clearTimeout(timeoutRef);
        },
        onMouseLeave(event: MouseEvent) {
          context().events.emit('dismiss', {
            type: 'mouseLeave',
            data: {
              returnFocus: false,
            },
          });
          closeWithDelay(event, false);
        },
      },
    };
  });
  return userProps;
}
