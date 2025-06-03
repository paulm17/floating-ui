import {isHTMLElement} from '@floating-ui/utils/dom';
import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  JSX,
  mergeProps,
  onCleanup,
  onMount,
  ParentComponent,
  ParentProps,
  Show,
  splitProps,
} from 'solid-js';
import {FocusableElement, tabbable} from 'tabbable';

import type {DismissPayload} from '../hooks/useDismiss';
import type {FloatingContext, ReferenceType} from '../types';
import {
  activeElement,
  contains,
  getDocument,
  getTarget,
  isTypeableElement,
} from '../utils/element';
import {stopEvent} from '../utils/event';
import {createAttribute} from '../utils/createAttribute';
import {destructure} from '../utils/destructure';
import {enqueueFocus} from '../utils/enqueueFocus';
import {markOthers, supportsInert} from '../utils/markOthers';
import {
  getNextTabbable,
  getPreviousTabbable,
  getTabbableOptions,
  isOutsideEvent,
} from '../utils/tabbable';
import {usePortalContext} from './FloatingPortal';
import {useUnsafeFloatingTree} from './FloatingTree';
import {FocusGuard, HIDDEN_STYLES} from './FocusGuard';
import {getNodeAncestors, getNodeChildren} from '../utils/nodes';

const VisuallyHiddenDismiss: ParentComponent<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>
> = (props) => {
  return (
    <button {...props} type="button" tabIndex={-1} style={HIDDEN_STYLES} />
  );
};

export interface FloatingFocusManagerProps<
  RT extends ReferenceType = ReferenceType,
> {
  /**
   * The floating context returned from `useFloatingRootContext`.
   */
  context: Accessor<FloatingContext<RT>>;
  /**
   * Whether or not the focus manager should be disabled. Useful to delay focus
   * management until after a transition completes or some other conditional
   * state.
   * @default false
   */
  disabled?: boolean;
  /**
   * The order in which focus cycles.
   * @default ['content']
   */
  order?: Array<'reference' | 'floating' | 'content'>;
  /**
   * Which element to initially focus. Can be either a number (tabbable index as
   * specified by the `order`) or a ref.
   * @default 0
   */
  initialFocus?: number | HTMLElement | null;
  /**
   * Determines if the focus guards are rendered. If not, focus can escape into
   * the address bar/console/browser UI, like in native dialogs.
   * @default true
   */
  guards?: boolean;
  /**
   * Determines if focus should be returned to the reference element once the
   * floating element closes/unmounts (or if that is not available, the
   * previously focused element). This prop is ignored if the floating element
   * lost focus.
   * It can be also set to a ref to explicitly control the element to return focus to.
   * @default true
   */
  returnFocus?: boolean;
  /**
   * Determines if focus should be restored to the nearest tabbable element if
   * focus inside the floating element is lost (such as due to the removal of
   * the currently focused element from the DOM).
   * @default false
   */
  restoreFocus?: boolean;
  /**
   * Determines if focus is “modal”, meaning focus is fully trapped inside the
   * floating element and outside content cannot be accessed. This includes
   * screen reader virtual cursors.
   * @default true
   */
  modal?: boolean;
  /**
   * If your focus management is modal and there is no explicit close button
   * available, you can use this prop to render a visually-hidden dismiss
   * button at the start and end of the floating element. This allows
   * touch-based screen readers to escape the floating element due to lack of
   * an `esc` key.
   * @default undefined
   */
  visuallyHiddenDismiss?: boolean | string;
  /**
   * Determines whether `focusout` event listeners that control whether the
   * floating element should be closed if the focus moves outside of it are
   * attached to the reference and floating elements. This affects non-modal
   * focus management.
   * @default true
   */
  closeOnFocusOut?: boolean;
  /**
   * Determines whether outside elements are `inert` when `modal` is enabled.
   * This enables pointer modality without a backdrop.
   * @default false
   */
  outsideElementsInert?: boolean;
  /**
   * Returns any extra “inside” elements that should not be hidden/inerted.
   */
  getInsideElements?: () => Element[];
}

/**
 * Provides focus management for the floating element.
 * @see https://floating-ui.com/docs/FloatingFocusManager
 */
export function FloatingFocusManager<RT extends ReferenceType = ReferenceType>(
  props: ParentProps<FloatingFocusManagerProps<RT>>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['children']);
  const mergedProps = mergeProps(
    {
      disabled: false,
      order: ['content'],
      guards: true,
      initialFocus: 0,
      returnFocus: true,
      restoreFocus: false,
      modal: true,
      visuallyHiddenDismiss: false,
      closeOnFocusOut: true,
      outsideElementsInert: false,
      getInsideElements: () => [] as Element[],
    } as Required<FloatingFocusManagerProps>,
    rest,
  );
  const {
    context,
    disabled,
    order,
    guards: _guards,
    initialFocus,
    returnFocus,
    restoreFocus,
    modal,
    visuallyHiddenDismiss,
    closeOnFocusOut,
    outsideElementsInert,
    getInsideElements
  } = destructure(mergedProps, {normalize: true});

  const {open, refs, nodeId, events, dataRef} = destructure(context());
  const {onOpenChange} = context();

  // Force the guards to be rendered if the `inert` attribute is not supported.
  const guards = () => (supportsInert() ? _guards() : true);
  
  const tree = useUnsafeFloatingTree();
  const portalContext = usePortalContext();

  // Controlled by `useListNavigation`.
  const ignoreInitialFocus = createMemo(
    () => typeof initialFocus() === 'number' && (initialFocus() as number) < 0,
  );

  let startDismissButtonRef: HTMLButtonElement | null = null;
  let endDismissButtonRef: HTMLButtonElement | null = null;
  let preventreturnFocus = false;
  let previouslyFocusedElementRef: Element | null = null;
  let isPointerDownRef = false;
  const tabbableIndexRef = { current: -1 };
  // let initialGetTabbableElements = true;
  const isInsidePortal = portalContext != null;

  // If the reference is a combobox and is typeable (e.g. input/textarea),
  // there are different focus semantics. The guards should not be rendered, but
  // aria-hidden should be applied to all nodes still. Further, the visually
  // hidden dismiss button should only appear at the end of the list, not the
  // start.
  const isTypeableCombobox = createMemo(() => {
    const domReference = refs().reference() as HTMLElement | null;
    return (
      domReference &&
      domReference.getAttribute('role') === 'combobox' &&
      isTypeableElement(domReference)
    );
  });

  function getTabbableContent(container: HTMLElement | null = refs().floating()) {
    const opts = getTabbableOptions();
    if (!container) return [] as HTMLElement[];
    const all = tabbable(container, opts);
    // In React version, they gave priority to any child with “autofocus” on mount:
    const autoFocusEls = all.filter((el) => el.hasAttribute("autofocus"));
    if (autoFocusEls.length > 0) {
      return autoFocusEls as HTMLElement[];
    }

    return all as HTMLElement[];
  }

  const getTabbableElements = (container?: HTMLElement) => {
    const content = getTabbableContent(container);
    const domReference = refs().reference() as HTMLElement | null;
    const floating = refs().floating() as HTMLElement | null;
    return order()
      ?.map((type: string) => {
        if (domReference && type === 'reference') {
          return domReference;
        }

        if (floating && type === 'floating') {
          return floating;
        }

        return content;
      })
      .filter(Boolean)
      .flat() as Array<FocusableElement>;
  };

  createEffect(() => {
    if (disabled() || !modal()) return;
    const domReference = refs().reference();
    const floating = refs().floating();
    if (!(domReference && floating)) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        // The focus guards have nothing to focus, so we need to stop the event.
        if (
          contains(floating, activeElement(getDocument(floating))) &&
          getTabbableContent().length === 0 &&
          !isTypeableCombobox
        ) {
          stopEvent(event);
        }

        const els = getTabbableElements();
        const target = getTarget(event);

        if (order()[0] === 'reference' && target === domReference) {
          stopEvent(event);
          if (event.shiftKey) {
            enqueueFocus(els[els.length - 1]);
          } else {
            enqueueFocus(els[1]);
          }
        }

        if (
          order()[1] === 'floating' &&
          target === floating &&
          event.shiftKey
        ) {
          stopEvent(event);
          enqueueFocus(els[0]);
        }
      }
    }

    const doc = getDocument(floating);
    doc.addEventListener('keydown', onKeyDown);
    onCleanup(() => {
      doc.removeEventListener('keydown', onKeyDown);
    });

    createEffect(() => {
      if (disabled() || !modal()) return;
      const floatingEl = refs().floating() as HTMLElement | null;

      if (!floatingEl) return;

      function handleFocusIn(event: FocusEvent) {
        const target = event.target as Element;
        const content = getTabbableContent();
        const idx = content.indexOf(target as any);

        if (idx !== -1) {
          tabbableIndexRef.current = idx;
        }
      }

      floatingEl.addEventListener("focusin", handleFocusIn);
      onCleanup(() => floatingEl.removeEventListener("focusin", handleFocusIn));
    });
  });

  createEffect(() => {
    if (disabled() || !closeOnFocusOut()) return;
    const domReference = refs().reference();
    const floating = refs().floating();
    // In Safari, buttons lose focus when pressing them.
    function handlePointerDown() {
      isPointerDownRef = true;
      setTimeout(() => {
        isPointerDownRef = false;
      });
    }

    function handleFocusOutside(event: FocusEvent) {
      const relatedTarget = event.relatedTarget as Element | null;
      if (relatedTarget === floating || relatedTarget === domReference) return;
      // queueMicrotask(() => {
      const movedToUnrelatedNode = !(
        contains(domReference as Element, relatedTarget) ||
        contains(floating, relatedTarget) ||
        contains(relatedTarget, floating) ||
        contains(portalContext?.portalNode(), relatedTarget) ||
        relatedTarget?.hasAttribute(createAttribute('focus-guard')) ||
        (tree?.() &&
          (getNodeChildren(tree().nodesRef, nodeId()).find(
            (node) =>
              contains(node.context?.refs.floating(), relatedTarget) ||
              contains(
                node.context?.refs.reference() as Element,
                relatedTarget,
              ),
          ) ||
            getNodeAncestors(tree().nodesRef, nodeId()).find(
              (node) =>
                node.context?.refs.floating() === relatedTarget ||
                node.context?.refs.reference() === relatedTarget,
            )))
      );

      // console.log('FOCUSMANAGER - handleFocusOutside - closing', {
      //   relatedTarget,
      //   movedToUnrelatedNode,
      // });
      // Focus did not move inside the floating tree, and there are no tabbable
      // portal guards to handle closing.
      if (
        relatedTarget &&
        movedToUnrelatedNode &&
        !isPointerDownRef &&
        // Fix React 18 Strict Mode returnFocus due to double rendering.
        relatedTarget !== previouslyFocusedElementRef
      ) {
        preventreturnFocus = true;

        onOpenChange(false, event);
      }
      // });

      if (
        restoreFocus() &&
        activeElement(getDocument(floating)) === getDocument(floating).body
      ) {
        // Focus the last tabbable index inside
        const prevIdx = tabbableIndexRef.current;
        const content = getTabbableContent();
        const toFocus =
          content[prevIdx] || content[content.length - 1] || floating;
        if (toFocus instanceof HTMLElement) {
          toFocus.focus();
        }
      }
    }

    if (floating && isHTMLElement(domReference)) {
      domReference.addEventListener('focusout', handleFocusOutside);
      domReference.addEventListener('pointerdown', handlePointerDown);
      !modal() && floating.addEventListener('focusout', handleFocusOutside);

      onCleanup(() => {
        domReference.removeEventListener('focusout', handleFocusOutside);
        domReference.removeEventListener('pointerdown', handlePointerDown);
        !modal() &&
          floating.removeEventListener('focusout', handleFocusOutside);
      });
    }
  });

  createEffect(() => {
  if (disabled()) return;
  const domReference = refs().reference();
  const floating = refs().floating();
  // Don't hide portals nested within the parent portal.
  const portalNodes = Array.from(
    portalContext
      ?.portalNode()
      ?.querySelectorAll(`[${createAttribute('portal')}]`) || [],
  );
  if (floating) {
    const insideElements = [
      floating,
      ...portalNodes,
      startDismissButtonRef,
      endDismissButtonRef,
      ...(Array.isArray(getInsideElements())
        ? getInsideElements()
        : []),
      // Add reference element when it's in focus order and modal is enabled
      ...(modal() && order().includes('reference') && isHTMLElement(domReference) 
        ? [domReference] 
        : [])
    ].filter((x): x is Element => x != null);

    const cleanup = modal()
      ? markOthers(insideElements, !outsideElementsInert(), outsideElementsInert())
      : markOthers(insideElements);

    onCleanup(() => {
      cleanup();
    });
  }
});

  createEffect(() => {
    const floating = refs().floating();
    if (disabled() || !floating) return;

    const doc = getDocument(floating);
    const previouslyFocusedElement = activeElement(doc);

    // Wait for any layout effect state setters to execute to set `tabIndex`.
    const initialFocusValue = initialFocus();
    queueMicrotask(() => {
      const focusableElements = getTabbableElements(floating);

      const elToFocus =
        (typeof initialFocusValue === 'number'
          ? focusableElements[initialFocusValue]
          : initialFocusValue) || floating;
      const focusAlreadyInsideFloatingEl = contains(
        floating,
        previouslyFocusedElement,
      );

      if (!ignoreInitialFocus() && !focusAlreadyInsideFloatingEl && open()) {
        // console.log(
        //   'FOCUSMANAGER - Wait for any layout effect state setters to execute to set `tabIndex`. - enqueueFocus - elToFocus',
        //   {
        //     elToFocus,
        //     focusableElements,
        //     initialFocusValue,
        //     focusAlreadyInsideFloatingEl,
        //     ignoreInitialFocus: ignoreInitialFocus(),
        //     previouslyFocusedElement,
        //   },
        // );

        enqueueFocus(elToFocus, {preventScroll: elToFocus === floating});
      }
    });
  });

  createEffect(() => {
    const floating = refs().floating();
    if (disabled() || !floating) return;

    let preventReturnFocusScroll = false;

    const doc = getDocument(floating);
    const previouslyFocusedElement = activeElement(doc);
    const contextData = dataRef;

    previouslyFocusedElementRef = previouslyFocusedElement;

    // Dismissing via outside press should always ignore `returnFocus` to
    // prevent unwanted scrolling.
    function onDismiss(payload: DismissPayload) {
      if (payload.type === 'escapeKey' && refs().reference()) {
        previouslyFocusedElementRef = refs().reference() as Element | null;
      }

      if (['referencePress', 'escapeKey'].includes(payload.type)) {
        return;
      }

      const returnFocus = payload.data.returnFocus;

      if (typeof returnFocus === 'object') {
        preventreturnFocus = false;
        preventReturnFocusScroll = returnFocus.preventScroll;
      } else {
        preventreturnFocus = !returnFocus;
      }
    }

    events().on('dismiss', onDismiss);

    onCleanup(() => {
      events().off('dismiss', onDismiss);
      const activeEl = activeElement(doc);
      const openEvent = contextData().openEvent;
      const shouldFocusReference =
        contains(floating, activeEl) ||
        (tree?.() &&
          getNodeChildren(tree().nodesRef, nodeId()).some((node) =>
            contains(node.context?.refs.floating(), activeEl),
          )) ||
        (openEvent && ['click', 'mousedown'].includes(openEvent.type));

      if (shouldFocusReference && refs().reference()) {
        previouslyFocusedElementRef = refs().reference() as Element | null;
      }

      if (
        returnFocus() &&
        isHTMLElement(previouslyFocusedElementRef) &&
        !preventreturnFocus
      ) {
        // console.log(
        //   'FOCUSMANAGER - enqueueFocus - previouslyFocusedElementRef',
        //   previouslyFocusedElementRef,
        // );
        enqueueFocus(previouslyFocusedElementRef, {
          // When dismissing nested floating elements, by the time the rAF has
          // executed, the menus will all have been unmounted. When they try
          // to get focused, the calls get ignored — leaving the root
          // reference focused as desired.
          cancelPrevious: false,
          preventScroll: preventReturnFocusScroll,
        });
      }
    });
  });

  // Synchronize the `context` & `modal` value to the FloatingPortal context.
  // It will decide whether or not it needs to render its own guards.
  createEffect(() => {
    if (disabled() || !portalContext) return;

    portalContext.setFocusManagerState({
      modal: modal(),
      closeOnFocusOut: closeOnFocusOut(),
      open: context().open(),
      onOpenChange,
      refs: refs(),
    });
  });
  onCleanup(() => {
    portalContext?.setFocusManagerState(null);
  });

  const handleMutation = () => {
    const floating = refs().floating();
    if (floating) {
      const tabIndex = floating.getAttribute('tabindex');
      if (
        order().includes('floating') ||
        (activeElement(getDocument(floating)) !==
          (refs().reference() as Element) &&
          getTabbableContent().length === 0)
      ) {
        if (tabIndex !== '0') {
          floating.setAttribute('tabindex', '0');
        }
      } else if (tabIndex !== '-1') {
        floating.setAttribute('tabindex', '-1');
      }
    }
  };

  createEffect(() => {
    if (disabled()) return;
    const floating = refs().floating();

    if (floating && typeof MutationObserver === 'function') {
      handleMutation();
      const observer = new MutationObserver(handleMutation);

      observer.observe(floating, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      onCleanup(() => {
        observer.disconnect();
      });
    }
  });

  function RenderDismissButton(props: {location: 'start' | 'end'}) {
    const [_, btnRest] = splitProps(props, ["location"]);
    const [ref, setRef] = createSignal<HTMLButtonElement | null>(null);
    onMount(() => {
      props.location === 'start'
        ? (startDismissButtonRef = ref())
        : (endDismissButtonRef = ref());
    });
    return (
      <Show when={!disabled() || !!visuallyHiddenDismiss() || !!modal()}>
        <VisuallyHiddenDismiss
          ref={(el) => setRef(el)}
          onClick={(event) => onOpenChange(false, event)}
          {...btnRest}
        >
          {typeof visuallyHiddenDismiss === 'string'
            ? visuallyHiddenDismiss
            : 'Dismiss'}
        </VisuallyHiddenDismiss>
      </Show>
    );
  }

  const shouldRenderGuards = createMemo(
    () =>
      !disabled() &&
      guards() &&
      !isTypeableCombobox() &&
      (isInsidePortal || modal()),
  );

  return (
    <>
      <Show when={shouldRenderGuards()}>
        <FocusGuard
          data-type="inside"
          ref={(el) => {
            const pc = usePortalContext();
            if (pc) pc.setRefs({ beforeInsideRef: el });
          }}
          onFocus={(event) => {
            if (modal()) {
              const els = getTabbableElements();
              enqueueFocus(
                order()[0] === 'reference' ? els[0] : els[els.length - 1],
              );
            } else if (
              portalContext?.preserveTabOrder &&
              portalContext.portalNode()
            ) {
              preventreturnFocus = false;
              if (
                isOutsideEvent(
                  event,
                  portalContext.portalNode() as HTMLElement | undefined,
                )
              ) {
                //Call handleMutation directly to ensure tabindexes are correct
                // Probably different event propagation as in React
                handleMutation();
                const nextTabbable = getNextTabbable() || refs().reference();
                nextTabbable?.focus();
              } else {
                portalContext.refs.beforeOutsideRef?.focus();
              }
            }
          }}
        />
      </Show>
      {/*
        Ensure the first swipe is the list item. The end of the listbox popup
        will have a dismiss button.
      */}
      <Show when={!isTypeableCombobox()}>
        <RenderDismissButton location="start" />
      </Show>

      {local.children}
      <RenderDismissButton location="end" />
      <Show when={shouldRenderGuards()}>
        <FocusGuard
          data-type="inside"
          ref={(el) => {
            const pc = usePortalContext();
            if (pc) pc.setRefs({ afterInsideRef: el });
          }}
          onFocus={(event) => {
            if (modal()) {
              enqueueFocus(getTabbableElements()[0]);
            } else if (
              portalContext?.preserveTabOrder &&
              portalContext.portalNode()
            ) {
              if (closeOnFocusOut()) {
                preventreturnFocus = true;
              }

              if (
                isOutsideEvent(
                  event,
                  portalContext.portalNode() as Element | undefined,
                )
              ) {
                //Call handleMutation directly to ensure tabindexes are correct
                // Probably different event propagation as in React
                handleMutation();
                const prevTabbable =
                  getPreviousTabbable() || refs().reference();
                prevTabbable?.focus();
              } else {
                portalContext.refs.afterOutsideRef?.focus();
              }
            }
          }}
        />
      </Show>
    </>
  );
}
