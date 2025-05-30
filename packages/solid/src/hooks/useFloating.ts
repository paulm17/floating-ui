// usefloating.ts
// credits to Alexis Munsayac
// "https://github.com/lxsmnsyc/solid-floating-ui/tree/main/packages/solid-floating-ui",
import {createMutable} from 'solid-js/store';
import {ReferenceElement} from '@floating-ui/dom';
import {isElement} from '@floating-ui/utils/dom';
import {access} from '@solid-primitives/utils';
import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  mergeProps,
} from 'solid-js';

import {useUnsafeFloatingTree} from '../components/FloatingTree';
import {
  ContextData,
  FloatingContext,
  NarrowedElement,
  OpenChangeReason,
  ReferenceType,
  UseFloatingOptions,
  UseFloatingReturn,
} from '../types';
import {createPubSub} from '../utils/createPubSub';
import {usePosition} from './usePosition';
import { useFloatingRootContext } from './useFloatingRootContext';

export function useFloating<R extends ReferenceElement>(
  options?: UseFloatingOptions<R>,
): UseFloatingReturn<R> {
  const floatingId = createUniqueId();
  const {
    nodeId,
    onOpenChange: userOnOpenChange,
    elements: optElements = {},
    open: openProp,
    rootContext,
  } = options || {};
  
  // Handle accessor unwrapping for root context
  const rootElements = {
    reference: (optElements.reference && typeof optElements.reference === 'function'
      ? optElements.reference()
      : optElements.reference) as Element | null,
    floating: (optElements.floating && typeof optElements.floating === 'function'
      ? optElements.floating()
      : optElements.floating) as HTMLElement | null,
  };
  
  // Create or use provided floating root context, without passing user callback
  const internalRoot = useFloatingRootContext({ 
    open: access(openProp),
    elements: mergeProps({ reference: null, floating: null }, rootElements),
  });
  const rootCtx = rootContext ?? internalRoot;

  const [_domReference, setDomReference] =
    createSignal<NarrowedElement<R> | null>(null);

  const domReference = createMemo(
    () =>
      (optElements.reference?.() || _domReference()) as NarrowedElement<R>,
  );
  let domReferenceRef: NarrowedElement<R> | null = null;

  const events = createPubSub();
  const positionProps = mergeProps({transform: true}, options || {});
  const position = usePosition(positionProps);

  const dataRef = createMutable<ContextData>({
    openEvent: undefined,
    ...position,
  });

  // Unified open-change handler: call user once, then propagate to root context
  const onOpenChange = (open: boolean, event?: Event, reason?: OpenChangeReason) => {
    if (open) {
      // store event for context
      dataRef.openEvent = event;
    }
    userOnOpenChange?.(open, event);
    rootCtx.onOpenChange(open, event, reason);
  };

  const setPositionReference = (node: ReferenceType | null) => {
    const positionReference = isElement(node)
      ? {
          getBoundingClientRect: () => node.getBoundingClientRect(),
          contextElement: node,
        }
      : node;
    position.refs.setReference(positionReference as R | null);
  };

  const setReference = (node: R | null) => {
    if (isElement(node) || node === null) {
      domReferenceRef = node as NarrowedElement<R> | null;
      // Use functional setter to satisfy overload
      setDomReference(() => node as NarrowedElement<R> | null);
    }

    if (
      isElement(position.refs.reference()) ||
      position.refs.reference() === null ||
      (node !== null && !isElement(node))
    ) {
      position.refs.setReference(node);
    }
  };

  const context = createMemo(() => {
    const refs = mergeProps(
      { domReference: domReference() },
      position.refs,
    );
    const elements = mergeProps({ domReference }, position.elements, rootCtx.elements);
    return mergeProps(
      {
        dataRef,
        nodeId,
        floatingId,
        events,
        open: openProp ? (() => access(openProp)) : (() => rootCtx.open),
        onOpenChange,
      },
      position,
      { refs, elements },
    );
  });

  // Sync context into floating tree
  const tree = useUnsafeFloatingTree<R>();
  createEffect(() => {
    if (!tree?.()) return;
    rootCtx.dataRef.openEvent = dataRef.openEvent;
    const node = tree()?.nodesRef?.find((n) => n.id === nodeId);
    if (node) node.context = context() as unknown as FloatingContext<R>;
  });

  return {
    get x() { return position.x; },
    get y() { return position.y; },
    get isPositioned() { return position.isPositioned; },
    get placement() { return position.placement; },
    get strategy() { return position.strategy; },
    get middlewareData() { return position.middlewareData; },
    get floatingStyles() { return position.floatingStyles; },
    get elements() { return { reference: position.elements.reference, floating: position.elements.floating, domReference }; },
    get refs() { return mergeProps(position.refs, { setReference, setPositionReference, domReference: domReferenceRef }); },
    get context() { return context as unknown as Accessor<FloatingContext<R>>; },
    get update() { return position.update; },
  };
}
