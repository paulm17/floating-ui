import {MaybeAccessor} from '@solid-primitives/utils';
import {Accessor, mergeProps} from 'solid-js';

import {isHTMLElement} from '@floating-ui/utils/dom';
import type {ElementProps, FloatingContext, ReferenceType} from '../types';
import {isTypeableElement} from '../utils/element';
import {isMouseLikePointerType} from '../utils/event';
import {destructure} from '../utils/destructure';

function isButtonTarget(event: KeyboardEvent) {
  return isHTMLElement(event.target) && event.target.tagName === 'BUTTON';
}

function isAnchorTarget(event: KeyboardEvent) {
  return isHTMLElement(event.target) && event.target.tagName === 'A';
}

function isSpaceIgnored(element: Element | null) {
  return isTypeableElement(element);
}

export interface UseClickProps {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeAccessor<boolean>;
  /**
   * The type of event to use to determine a “click” with mouse input.
   * Keyboard clicks work as normal.
   * @default 'click'
   */
  event?: MaybeAccessor<'click' | 'mousedown'>;
  /**
   * Whether to toggle the open state with repeated clicks.
   * @default true
   */
  toggle?: MaybeAccessor<boolean>;
  /**
   * Whether to ignore the logic for mouse input (for example, if `useHover()`
   * is also being used).
   * @default false
   */
  ignoreMouse?: MaybeAccessor<boolean>;
  /**
   * Whether to add keyboard handlers (Enter and Space key functionality) for
   * non-button elements (to open/close the floating element via keyboard
   * “click”).
   * @default true
   */
  keyboardHandlers?: MaybeAccessor<boolean>;
  /**
   * If already open from another event such as the `useHover()` Hook,
   * determines whether to keep the floating element open when clicking the
   * reference element for the first time.
   * @default true
   */
  stickIfOpen?: boolean;
}
type PointerType = 'mouse' | 'pen' | 'touch';
/**
 * Opens or closes the floating element when clicking the reference element.
 * @see https://floating-ui.com/docs/useClick
 */
export function useClick<RT extends ReferenceType = ReferenceType>(
  context: Accessor<FloatingContext<RT>>,
  props: UseClickProps = {},
): Accessor<ElementProps> {
  const {open, onOpenChange, refs} = context();
  const mergedProps = mergeProps(
    {
      enabled: true,
      event: 'click',
      toggle: true,
      ignoreMouse: false,
      keyboardHandlers: true,
    },
    props,
  );
  const {
    enabled,
    toggle,
    ignoreMouse,
    keyboardHandlers,
    event: eventOption,
  } = destructure(mergedProps, {normalize: true});

  let pointerTypeRef: PointerType | undefined;
  let didKeyDownRef = false;

  return () =>
    !enabled()
      ? {}
      : {
          reference: {
            onPointerDown(event) {
              pointerTypeRef = event.pointerType as PointerType;
            },
            onMouseDown(event) {
              // const {dataRef} = context();
              // Ignore all buttons except for the "main" button.
              // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
              if (event.button !== 0) {
                return;
              }

              if (eventOption() === 'click') {
                return;
              }

              if (
                isMouseLikePointerType(pointerTypeRef, true) &&
                ignoreMouse()
              ) {
                return;
              }

              if (
                open() &&
                toggle() &&
                (context().dataRef.openEvent
                  ? context().dataRef.openEvent?.type === 'mousedown'
                  : true)
              ) {
                onOpenChange(false, event);
              } else {
                // Prevent stealing focus from the floating element
                event.preventDefault();
                onOpenChange(true, event);
              }
            },
            onClick(event) {
              if (eventOption() === 'mousedown' && pointerTypeRef) {
                pointerTypeRef = undefined;
                return;
              }

              if (
                isMouseLikePointerType(pointerTypeRef, true) &&
                ignoreMouse()
              ) {
                return;
              }
              const {dataRef} = context();
              if (
                open() &&
                toggle() &&
                (dataRef.openEvent ? dataRef.openEvent.type === 'click' : true)
              ) {
                onOpenChange(false, event);
              } else {
                onOpenChange(true, event);
              }
            },
            onKeyDown(event) {
              pointerTypeRef = undefined;

              if (
                event.defaultPrevented ||
                !keyboardHandlers ||
                isButtonTarget(event)
              ) {
                return;
              }

              if (
                event.key === ' ' &&
                !isSpaceIgnored(refs.reference() as Element)
              ) {
                // Prevent scrolling
                event.preventDefault();
                didKeyDownRef = true;
              }

              if (isAnchorTarget(event)) {
                return;
              }

              if (event.key === 'Enter') {
                if (open() && toggle()) {
                  onOpenChange(false, event);
                } else {
                  onOpenChange(true, event);
                }
              }
            },
            onKeyUp(event) {
              if (
                event.defaultPrevented ||
                !keyboardHandlers ||
                isButtonTarget(event) ||
                isSpaceIgnored(refs.reference() as Element)
              ) {
                return;
              }

              if (event.key === ' ' && didKeyDownRef) {
                didKeyDownRef = false;
                if (open() && toggle()) {
                  onOpenChange(false, event);
                } else {
                  onOpenChange(true, event);
                }
              }
            },
          },
        };
}
