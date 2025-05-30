import { createSignal, createMemo } from 'solid-js';
import { createUniqueId } from 'solid-js';
import { isElement } from '@floating-ui/utils/dom';

import type {
  FloatingRootContext,
  ReferenceElement,
} from '../types';
import type { ContextData, OpenChangeReason } from '../types';
import { createPubSub } from '../utils/createPubSub';
import { useFloatingParentNodeId } from '../components/FloatingTree';
import { error } from '../utils/log';

export interface UseFloatingRootContextOptions {
  open?: boolean;
  onOpenChange?: (
    open: boolean,
    event?: Event,
    reason?: OpenChangeReason,
  ) => void;
  elements: {
    reference: Element | null;
    floating: HTMLElement | null;
  };
}

export function useFloatingRootContext(
  options: UseFloatingRootContextOptions,
): FloatingRootContext {
  const {
    open = false,
    onOpenChange: onOpenChangeProp,
    elements: elementsProp,
  } = options;

  // Solid’s unique ID generator
  const floatingId = createUniqueId();

  // In React you had useRef<ContextData>, here we just keep a simple mutable object:
  const dataRef: { current: ContextData } = { current: {} };

  // Create a single event emitter instance
  const events = createPubSub();

  // Determine if we’re nested under another FloatingRoot
  const nested = useFloatingParentNodeId() != null;

  // DEV‐only sanity check (identical to React version)
  // @ts-ignore
  if (__DEV__) {
    const optionDomReference = elementsProp.reference;
    if (optionDomReference && !isElement(optionDomReference)) {
      error(
        'Cannot pass a virtual element to the `elements.reference` option,',
        'as it must be a real DOM element. Use `refs.setPositionReference()`',
        'instead.',
      );
    }
  }

  // positionReference ↔ useState
  const [positionReference, setPositionReference] = createSignal<ReferenceElement | null>(
    elementsProp.reference
  );

  // Directly define a stable callback for onOpenChange
  const onOpenChange = (
    nextOpen: boolean,
    event?: Event,
    reason?: OpenChangeReason,
  ) => {
    // Store the latest event in dataRef
    dataRef.current.openEvent = nextOpen ? event : undefined;

    // Emit “openchange” for any subscribers
    events.emit('openchange', {
      open: nextOpen,
      event,
      reason,
      nested,
    });

    // Forward to the user’s callback, if provided
    onOpenChangeProp?.(nextOpen, event, reason);
  };

  // “refs” object (only contains setPositionReference)
  const refs = {
    setPositionReference,
  };

  // Recompute `elements` whenever positionReference or elementsProp changes
  const elements = createMemo(() => ({
    reference: positionReference() || elementsProp.reference || null,
    floating: elementsProp.floating || null,
    domReference: (elementsProp.reference as Element) || null,
  }));

  // Return a single context object. We wrap it in createMemo so that
  // if `open` or `elements()` change, downstream users can react.
  return createMemo<FloatingRootContext>(() => ({
    dataRef,
    open,
    onOpenChange,
    elements: elements(),
    events,
    floatingId,
    refs,
  }))();
}
