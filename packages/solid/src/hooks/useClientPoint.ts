import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
} from 'solid-js';
import {MaybeAccessor} from '@solid-primitives/utils';
import {getWindow} from '@floating-ui/utils/dom';
import {contains, getTarget} from '../utils/element';
import {isMouseLikePointerType} from '../utils/event';
import {destructure} from '../utils/destructure';
import type {
  ContextData,
  ElementProps,
  FloatingContext,
  ReferenceType,
} from '../types';

function createVirtualElement(
  domRef: Element | null,
  data: {
    dataRef: ContextData;
    axis: 'x' | 'y' | 'both';
    pointerType: string | undefined;
    x: number | null;
    y: number | null;
  },
) {
  let offsetX: number | null = null;
  let offsetY: number | null = null;
  let isAutoUpdateEvent = false;

  return {
    contextElement: domRef || undefined,
    getBoundingClientRect() {
      const domRect = domRef?.getBoundingClientRect() || {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      };

      const isXAxis = data.axis === 'x' || data.axis === 'both';
      const isYAxis = data.axis === 'y' || data.axis === 'both';
      const canTrackCursorOnAutoUpdate =
        ['mouseenter', 'mousemove'].includes(
          data.dataRef.openEvent?.type || '',
        ) && data.pointerType !== 'touch';

      let width = domRect.width;
      let height = domRect.height;
      let x = domRect.x;
      let y = domRect.y;

      if (offsetX == null && data.x && isXAxis) {
        offsetX = domRect.x - data.x;
      }

      if (offsetY == null && data.y && isYAxis) {
        offsetY = domRect.y - data.y;
      }

      x -= offsetX || 0;
      y -= offsetY || 0;
      width = 0;
      height = 0;

      if (!isAutoUpdateEvent || canTrackCursorOnAutoUpdate) {
        width = data.axis === 'y' ? domRect.width : 0;
        height = data.axis === 'x' ? domRect.height : 0;
        x = isXAxis && data.x != null ? data.x : x;
        y = isYAxis && data.y != null ? data.y : y;
      } else if (isAutoUpdateEvent && !canTrackCursorOnAutoUpdate) {
        height = data.axis === 'x' ? domRect.height : height;
        width = data.axis === 'y' ? domRect.width : width;
      }

      isAutoUpdateEvent = true;

      return {
        width,
        height,
        x,
        y,
        top: y,
        right: x + width,
        bottom: y + height,
        left: x,
      };
    },
  };
}

function isMouseBasedEvent(event: Event | undefined): event is MouseEvent {
  return event != null && (event as MouseEvent).clientX != null;
}

export interface UseClientPointProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeAccessor<boolean>;
  /**
   * Whether to restrict the client point to an axis and use the reference
   * element (if it exists) as the other axis. This can be useful if the
   * floating element is also interactive.
   * @default 'both'
   */
  axis?: MaybeAccessor<'x' | 'y' | 'both'>;
  /**
   * An explicitly defined `x` client coordinate.
   * @default null
   */
  x?: MaybeAccessor<number | null>;
  /**
   * An explicitly defined `y` client coordinate.
   * @default null
   */
  y?: MaybeAccessor<number | null>;
}

/**
 * Positions the floating element relative to a client point (in the viewport),
 * such as the mouse position. By default, it follows the mouse cursor.
 * @see https://floating-ui.com/docs/useClientPoint
 */
// export function useClientPoint<RT extends ReferenceType = ReferenceType>(
//   context: Accessor<FloatingContext<RT>>,
//   props: UseClientPointProps = {},
// ): Accessor<ElementProps> {
//   return () => ({});
// }

export function useClientPoint<RT extends ReferenceType = ReferenceType>(
  context: Accessor<FloatingContext<RT>>,
  props: UseClientPointProps = {},
): Accessor<ElementProps> {
  const mergedProps = mergeProps(
    {
      enabled: true,
      axis: 'both',
      x: null,
      y: null,
    } as Required<UseClientPointProps>,
    props,
  );
  const {open, dataRef, refs} = context();
  const {enabled, axis, x, y} = destructure(mergedProps, {
    normalize: true,
  });

  let initialRef = false;
  let cleanupListenerRef: null | (() => void) = null;  

  const [pointerType, setPointerType] = createSignal<string | undefined>();
  const [reactive, setReactive] = createSignal([]);

  const setReference = (x: number | null, y: number | null) => {
    if (initialRef) return;

    // Prevent setting if the open event was not a mouse-like one
    // (e.g. focus to open, then hover over the reference element).
    // Only apply if the event exists.
    if (dataRef.openEvent && !isMouseBasedEvent(dataRef.openEvent)) {
      return;
    }
    const node = createVirtualElement(refs.reference() as Element, {
      x,
      y,
      axis: axis(),
      dataRef,
      pointerType: pointerType(),
    });
    refs.setReference(node as RT); //changed by MR
  };

  const handleReferenceEnterOrMove = (event: MouseEvent) => {
    if (x() != null || y() != null) return;

    // console.log('handleReferenceEnterOrMove');
    if (!open()) {
      setReference(event.clientX, event.clientY);
    } else if (!cleanupListenerRef) {
      // If there's no cleanup, there's no listener, but we want to ensure
      // we add the listener if the cursor landed on the floating element and
      // then back on the reference (i.e. it's interactive).
      setReactive([]);
    }
  };

  // If the pointer is a mouse-like pointer, we want to continue following the
  // mouse even if the floating element is transitioning out. On touch
  // devices, this is undesirable because the floating element will move to
  // the dismissal touch point.
  const openCheck = () =>
    isMouseLikePointerType(pointerType())
      ? context().refs.floating()
      : context().open();

  function handleMouseMove(event: MouseEvent) {
    const target = getTarget(event) as Element | null;
    const win = getWindow(refs.floating());
    if (!contains(refs.floating(), target)) {
      setReference(event.clientX, event.clientY);
    } else {
      win.removeEventListener('mousemove', handleMouseMove);
      cleanupListenerRef = null;
    }
  }

  const addListener = () => {
    // Explicitly specified `x`/`y` coordinates shouldn't add a listener.
    if (!enabled() || !openCheck() || x() != null || y() != null) {
      return;
    }

    const {refs, dataRef} = context();
    const win = getWindow(refs.floating());

    if (!dataRef.openEvent || isMouseBasedEvent(dataRef.openEvent)) {
      win.addEventListener('mousemove', handleMouseMove);
      const cleanup = () => {
        win.removeEventListener('mousemove', handleMouseMove);
        cleanupListenerRef = null;
      };
      cleanupListenerRef = cleanup;
      return cleanup;
    }

    // refs.setReference(refs.reference());
  };
  onCleanup(() => window.removeEventListener('mousemove', handleMouseMove));

  createEffect(() => {
    if (enabled() && !context().refs.floating()) {
      initialRef = false;
    }
  });

  createEffect(() => {
    if (!enabled() && context().open()) {
      initialRef = true;
    }
  });

  createEffect(() => reactive() && addListener());

  createEffect((prev: {x: number | null; y: number | null} | undefined) => {
    if (
      enabled() &&
      (x() != null || y() != null) &&
      (x() !== prev?.x || y() !== prev?.y)
    ) {
      initialRef = false;
      setReference(x(), y());
      return {x: x(), y: y()};
    }
  });

  function setPointerTypeRef({pointerType}: PointerEvent) {
    setPointerType(pointerType);
  }
  const elementProps = createMemo(() => {
    if (!enabled()) return {};
    return {
      reference: {
        onPointerDown: setPointerTypeRef,
        onPointerEnter: setPointerTypeRef,
        onMouseMove: handleReferenceEnterOrMove,
        onMouseEnter: handleReferenceEnterOrMove,
      },
    };
  });
  return elementProps;
}
