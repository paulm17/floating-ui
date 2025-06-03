import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
} from 'solid-js';
import {getOverflowAncestors} from '@floating-ui/dom';
import {
  getComputedStyle,
  getParentNode,
  isElement,
  isHTMLElement,
  isLastTraversableNode,
} from '@floating-ui/utils/dom';
import {access, MaybeAccessor} from '@solid-primitives/utils';
import {
  useFloatingParentNodeId,
  useUnsafeFloatingTree,
} from '../components/FloatingTree';
import {isVirtualClick, isVirtualPointerEvent} from '../utils/event';
import {
  contains,
  getDocument,
  getTarget,
  isEventTargetWithin,
  isRootElement,
} from '../utils/element';
import {createAttribute} from '../utils/createAttribute';
import {destructure} from '../utils/destructure';
import {getNodeChildren} from '../utils/nodes';
import type {ElementProps, FloatingContext, ReferenceType} from '../types';

const bubbleHandlerKeys = {
  pointerdown: 'onPointerDown',
  mousedown: 'onMouseDown',
  click: 'onClick',
};

// const captureHandlerKeys = {
//   pointerdown: 'oncapture:pointerdown',
//   mousedown: 'oncapture:mousedown',
//   click: 'oncapture:click',
// };

export const normalizeBubblesProp = (_bubbles?: UseDismissProps['bubbles']) => {
  const bubbles = access(_bubbles);
  return {
    escapeKeyBubbles:
      typeof bubbles === 'boolean' ? bubbles : bubbles?.escapeKey ?? false,
    outsidePressBubbles:
      typeof bubbles === 'boolean' ? bubbles : bubbles?.outsidePress ?? true,
  };
};

export interface DismissPayload {
  type: 'outsidePress' | 'referencePress' | 'escapeKey' | 'mouseLeave';
  data: {
    returnFocus: boolean | {preventScroll: boolean};
  };
}

const defaultUseDismissProps: Required<UseDismissProps> = {
  enabled: true,
  escapeKey: true,
  outsidePress: true,
  outsidePressEvent: 'pointerdown',
  referencePress: false,
  referencePressEvent: 'pointerdown',
  ancestorScroll: false,
  bubbles: null,
  capture: null,
};

// Helper function to safely check if an element is valid for getOverflowAncestors

function isValidElementForOverflow(element: any): element is Element {
  return element && 
    isElement(element) && 
    element.nodeType === Node.ELEMENT_NODE &&
    typeof element.getBoundingClientRect === 'function' &&
    element.isConnected; // Ensure element is actually in the DOM
}

export interface UseDismissProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeAccessor<boolean>;
  /**
   * Whether to dismiss the floating element upon pressing the `esc` key.
   * @default true
   */
  escapeKey?: MaybeAccessor<boolean>;
  /**
   * Whether to dismiss the floating element upon pressing the reference
   * element. You likely want to ensure the `move` option in the `useHover()`
   * Hook has been disabled when this is in use.
   * @default false
   */
  referencePress?: MaybeAccessor<boolean>;
  /**
   * The type of event to use to determine a “press”.
   * - `pointerdown` is eager on both mouse + touch input.
   * - `mousedown` is eager on mouse input, but lazy on touch input.
   * - `click` is lazy on both mouse + touch input.
   * @default 'pointerdown'
   */
  referencePressEvent?: MaybeAccessor<'pointerdown' | 'mousedown' | 'click'>;
  /**
   * Whether to dismiss the floating element upon pressing outside of the
   * floating element.
   * If you have another element, like a toast, that is rendered outside the
   * floating element’s React tree and don’t want the floating element to close
   * when pressing it, you can guard the check like so:
   * ```jsx
   * useDismiss(context, {
   *   outsidePress: (event) => !event.target.closest('.toast'),
   * });
   * ```
   * @default true
   */
  outsidePress?: MaybeAccessor<boolean> | ((event: MouseEvent) => boolean);
  /**
   * The type of event to use to determine an outside “press”.
   * - `pointerdown` is eager on both mouse + touch input.
   * - `mousedown` is eager on mouse input, but lazy on touch input.
   * - `click` is lazy on both mouse + touch input.
   * @default 'pointerdown'
   */
  outsidePressEvent?: MaybeAccessor<'pointerdown' | 'mousedown' | 'click'>;
  /**
   * Whether to dismiss the floating element upon scrolling an overflow
   * ancestor.
   * @default false
   */
  ancestorScroll?: MaybeAccessor<boolean>;
  /**
   * Determines whether event listeners bubble upwards through a tree of
   * floating elements.
   */
  bubbles?: MaybeAccessor<
    boolean | {escapeKey?: boolean; outsidePress?: boolean} | null
  >
  /**
   * Determines whether to use capture phase event listeners.
   */
  capture?: MaybeAccessor<
    boolean | {escapeKey?: boolean; outsidePress?: boolean} | null
  >;
}

/**
 * Closes the floating element when a dismissal is requested — by default, when
 * the user presses the `escape` key or outside of the floating element.
 * @see https://floating-ui.com/docs/useDismiss
 */
export function useDismiss<RT extends ReferenceType = ReferenceType>(
  context: Accessor<FloatingContext<RT>>,
  props?: UseDismissProps,
): Accessor<ElementProps> {
  const {open, events, nodeId} = destructure(context, {
    normalize: true,
  });
  const {onOpenChange} = context();
  const mergedProps = mergeProps(
    defaultUseDismissProps,
    props,
  ) as Required<UseDismissProps>;

  const {
    enabled,
    escapeKey,
    outsidePressEvent,
    referencePress,
    referencePressEvent,
    ancestorScroll,
    bubbles,
    capture,
  } = destructure(mergedProps, {memo: true, normalize: true});

  // eslint-disable-next-line solid/reactivity
  const {outsidePress: unstable_outsidePress} = mergedProps;
  const tree = useUnsafeFloatingTree();

  const nested = useFloatingParentNodeId() != null;
  const outsidePressFn =
    typeof unstable_outsidePress === 'function'
      ? unstable_outsidePress
      : () => false;

  const outsidePress =
    typeof unstable_outsidePress === 'function'
      ? outsidePressFn
      : unstable_outsidePress;

  // let insideReactTreeRef = false;
  const [insideReactTreeRef, setInsideReactTreeRef] = createSignal(false);

  const {escapeKeyBubbles, outsidePressBubbles} = destructure(() =>
    normalizeBubblesProp(bubbles),
  );

  const closeOnEscapeKeyDown = (event: KeyboardEvent) => {
    if (!open() || !enabled() || !escapeKey() || event.key !== 'Escape') {
      return;
    }
    const children = tree?.() ? getNodeChildren(tree().nodesRef, nodeId()) : [];

    if (!escapeKeyBubbles()) {
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (children.length > 0) {
        let shouldDismiss = true;

        children.forEach((child) => {
          if (
            child.context?.open() &&
            !child.context.dataRef.__escapeKeyBubbles?.()
          ) {
            shouldDismiss = false;
            return;
          }
        });

        if (!shouldDismiss) {
          return;
        }
      }
    }

    events().emit('dismiss', {
      type: 'escapeKey',
      data: {
        returnFocus: {preventScroll: false},
      },
    });

    onOpenChange(false, event);
  };

  const closeOnPressOutside = (event: MouseEvent) => {
    // Given developers can stop the propagation of the synthetic event,
    // we can only be confident with a positive value.
    const insideReactTree = insideReactTreeRef();
    setInsideReactTreeRef(false);

    if (insideReactTree) {
      return;
    }

    if (typeof outsidePress === 'function' && !outsidePress(event)) {
      return;
    }

    const target = getTarget(event);
    const floating = context().refs.floating();
    const inertSelector = `[${createAttribute('inert')}]`;
    const markers = getDocument(floating).querySelectorAll(inertSelector);

    let targetRootAncestor = isElement(target) ? target : null;
    while (targetRootAncestor && !isLastTraversableNode(targetRootAncestor)) {
      const nextParent = getParentNode(targetRootAncestor);
      if (nextParent === getDocument(floating).body || !isElement(nextParent)) {
        break;
      } else {
        targetRootAncestor = nextParent;
      }
    }

    // Check if the click occurred on a third-party element injected after the
    // floating element rendered.
    if (
      markers.length &&
      isElement(target) &&
      !isRootElement(target) &&
      // Clicked on a direct ancestor (e.g. FloatingOverlay).
      !contains(target, floating) &&
      // If the target root element contains none of the markers, then the
      // element was injected after the floating element rendered.
      Array.from(markers).every(
        (marker) => !contains(targetRootAncestor, marker),
      )
    ) {
      return;
    }

    // Check if the click occurred on the scrollbar
    if (isHTMLElement(target) && floating) {
      const lastTraversableNode = isLastTraversableNode(target);
      const style = getComputedStyle(target);
      const scrollRe = /auto|scroll/;
      const isScrollableX =
        lastTraversableNode || scrollRe.test(style.overflowX);
      const isScrollableY =
        lastTraversableNode || scrollRe.test(style.overflowY);

      // In Firefox, `target.scrollWidth > target.clientWidth` for inline
      // elements.
      const canScrollX =
        isScrollableX && target.clientWidth > 0 && target.scrollWidth > target.clientWidth;
      const canScrollY =
      isScrollableY && target.clientHeight > 0 && target.scrollHeight > target.clientHeight;

      // Check click position relative to scrollbar.
      // In some browsers it is possible to change the <body> (or window)
      // scrollbar to the left side, but is very rare and is difficult to
      // check for. Plus, for modal dialogs with backdrops, it is more
      // important that the backdrop is checked but not so much the window.
      const isRTL = getComputedStyle(target).direction === 'rtl';

      const pressedVerticalScrollbar =
        canScrollY &&
        (isRTL
          ? event.offsetX <= target.offsetWidth - target.clientWidth
          : event.offsetX > target.clientWidth);

      const pressedHorizontalScrollbar =
        canScrollX && event.offsetY > target.clientHeight;

      if (pressedVerticalScrollbar || pressedHorizontalScrollbar) {
        return;
      }
    }

    const targetIsInsideChildren =
      tree?.() &&
      getNodeChildren(tree().nodesRef, nodeId()).some((node) =>
        isEventTargetWithin(event, node.context?.refs.floating()),
      );
    const domRef = context().refs.reference() as HTMLElement | null;

    if (
      isEventTargetWithin(event, floating) ||
      isEventTargetWithin(event, domRef) ||
      targetIsInsideChildren
    ) {
      return;
    }
    const children = tree?.() ? getNodeChildren(tree().nodesRef, nodeId()) : [];

    if (children.length > 0) {
      let shouldDismiss = true;

      children.forEach((child) => {
        if (
          child.context?.open() &&
          !child.context.dataRef.__outsidePressBubbles?.()
        ) {
          shouldDismiss = false;
          return;
        }
      });

      if (!shouldDismiss) {
        return;
      }
    }

    context().events.emit('dismiss', {
      type: 'outsidePress',
      data: {
        returnFocus: nested
          ? {preventScroll: true}
          : isVirtualClick(event) ||
            isVirtualPointerEvent(event as PointerEvent),
      },
    });

    onOpenChange(false, event);
  };

  let ancestors: (Element | Window | VisualViewport)[] = [];

  function onScroll(event: Event) {
    onOpenChange(false, event);
  }

  //onMount ??
  createEffect(() => {
    if (!open() || !enabled()) {
      return;
    }

    const {floating, reference} = context().refs;
    const domReference = reference() as Node | null;
    const floatingRef = floating();

    // Wait for elements to be properly mounted in the DOM
    if (!domReference || !floatingRef) {
      return;
    }

    // Clear previous ancestors
    ancestors = [];

    // batch(() => {
    context().dataRef.__escapeKeyBubbles = escapeKeyBubbles;
    context().dataRef.__outsidePressBubbles = outsidePressBubbles;
    // });
    const doc = getDocument(floatingRef);
    escapeKey() && doc.addEventListener('keydown', closeOnEscapeKeyDown);
    outsidePress &&
      doc.addEventListener(outsidePressEvent(), closeOnPressOutside);

    if (ancestorScroll()) {
      if (isValidElementForOverflow(domReference)) {
        try {
          ancestors = getOverflowAncestors(domReference);
        } catch (error) {
          console.warn('Error getting overflow ancestors for reference:', error);
          ancestors = [];
        }
      }

      if (isValidElementForOverflow(floatingRef)) {
        try {
          const floatingAncestors = getOverflowAncestors(floatingRef);
          ancestors = ancestors.concat(floatingAncestors);
        } catch (error) {
          console.warn('Error getting overflow ancestors for floating element:', error);
        }
      }
    }

    // Ignore the visual viewport for scrolling dismissal (allow pinch-zoom)
    ancestors = ancestors.filter(
      (ancestor) => ancestor !== doc.defaultView?.visualViewport,
    );

    ancestors.forEach((ancestor) => {
      ancestor.addEventListener('scroll', onScroll, {passive: true});
    });
    //Cleanup !!
    onCleanup(() => {
      const doc = getDocument(floatingRef);
      escapeKey() && doc.removeEventListener('keydown', closeOnEscapeKeyDown);
      outsidePress &&
        doc.removeEventListener(outsidePressEvent(), closeOnPressOutside);
        ancestors.forEach((ancestor) => {
          if (ancestor && typeof ancestor.removeEventListener === 'function') {
            ancestor.removeEventListener('scroll', onScroll);
          }
        });
    });
  });

  createEffect(() => {
    outsidePress;
    outsidePressEvent();
    // insideReactTreeRef = false;
    setInsideReactTreeRef(false);
  });

  const userProps = createMemo(() => {
    if (!enabled()) return {};
    return {
      reference: {
        onKeyDown: closeOnEscapeKeyDown,
        [bubbleHandlerKeys[referencePressEvent()]]: (event: Event) => {
          if (referencePress()) {
            events().emit('dismiss', {
              type: 'referencePress',
              data: {returnFocus: false},
            });

            onOpenChange(false, event);
          }
        },
      },
      floating: {
        onKeyDown: closeOnEscapeKeyDown,
        // [captureHandlerKeys[outsidePressEvent()]]: () => {
        [bubbleHandlerKeys[outsidePressEvent()]]: () => {
          setInsideReactTreeRef(true);
        },
      },
    };
  });
  return userProps;
}
