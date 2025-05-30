import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onMount,
} from 'solid-js';
import {isHTMLElement} from '@floating-ui/utils/dom';
import {
  isProd,
  MaybeAccessor,
  MaybeAccessorValue,
} from '@solid-primitives/utils';
import {
  useFloatingNodeId,
  useFloatingParentNodeId,
  useUnsafeFloatingTree,
} from '../components/FloatingTree';
import type {Dimensions, ElementProps, FloatingContext, ReferenceType} from '../types';
import {
  activeElement,
  contains,
  getDocument  
} from '../utils/element';
import {isMac,isSafari} from '../utils/platform';
import {
  isVirtualClick,
  isVirtualPointerEvent,
  stopEvent
} from '../utils/event';
import {destructure} from '../utils/destructure';
import {enqueueFocus} from '../utils/enqueueFocus';
import { ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, ARROW_UP } from '../utils/constants';

let isPreventScrollSupported = false;

function isDifferentRow(index: number, cols: number, prevRow: number) {
  return Math.floor(index / cols) !== prevRow;
}

function isIndexOutOfBounds(listRef: Array<HTMLElement | null>, index: number) {
  return index < 0 || index >= listRef.length;
}

function findNonDisabledIndex(
  listRef: Array<HTMLElement | null>,
  {
    startingIndex = -1,
    decrement = false,
    disabledIndices,
    amount = 1,
  }: {
    startingIndex?: number;
    decrement?: boolean;
    disabledIndices?: Array<number>;
    amount?: number;
  } = {},
): number {
  const list = listRef;

  let index = startingIndex;
  do {
    index = index + (decrement ? -amount : amount);
  } while (
    index >= 0 &&
    index <= list.length - 1 &&
    (disabledIndices
      ? disabledIndices.includes(index)
      : list[index] == null ||
        list[index]?.hasAttribute('disabled') ||
        list[index]?.getAttribute('aria-disabled') === 'true')
  );

  return index;
}

function doSwitch(
  orientation: Accessor<
    MaybeAccessorValue<UseListNavigationProps['orientation']>
  >,
  vertical: boolean,
  horizontal: boolean,
) {
  switch (orientation()) {
    case 'vertical':
      return vertical;
    case 'horizontal':
      return horizontal;
    default:
      return vertical || horizontal;
  }
}

function isMainOrientationKey(
  key: string,
  orientation: Accessor<
    MaybeAccessorValue<UseListNavigationProps['orientation']>
  >,
) {
  const vertical = key === ARROW_UP || key === ARROW_DOWN;
  const horizontal = key === ARROW_LEFT || key === ARROW_RIGHT;
  return doSwitch(orientation, vertical, horizontal);
}

function isMainOrientationToEndKey(
  key: string,
  orientation: Accessor<
    MaybeAccessorValue<UseListNavigationProps['orientation']>
  >,
  rtl: Accessor<MaybeAccessorValue<UseListNavigationProps['rtl']>>,
) {
  const vertical = key === ARROW_DOWN;
  const horizontal = rtl() ? key === ARROW_LEFT : key === ARROW_RIGHT;
  return (
    doSwitch(orientation, vertical, horizontal) ||
    key === 'Enter' ||
    key == ' ' ||
    key === ''
  );
}

function isCrossOrientationOpenKey(
  key: string,
  orientation: Accessor<
    MaybeAccessorValue<UseListNavigationProps['orientation']>
  >,
  rtl: Accessor<MaybeAccessorValue<UseListNavigationProps['rtl']>>,
) {
  const vertical = rtl() ? key === ARROW_LEFT : key === ARROW_RIGHT;
  const horizontal = key === ARROW_DOWN;
  // return doSwitch(orientation, vertical, horizontal);
  return (
    doSwitch(orientation, vertical, horizontal) ||
    key === 'Enter' ||
    key == ' ' ||
    key === ''
  );
}

function isCrossOrientationCloseKey(
  key: string,
  orientation: Accessor<
    MaybeAccessorValue<UseListNavigationProps['orientation']>
  >,
  rtl: Accessor<MaybeAccessorValue<UseListNavigationProps['rtl']>>,
) {
  const vertical = rtl() ? key === ARROW_RIGHT : key === ARROW_LEFT;
  const horizontal = key === ARROW_UP;
  return doSwitch(orientation, vertical, horizontal);
}

function getMinIndex(
  listRef: Accessor<MaybeAccessorValue<UseListNavigationProps['listRef']>>,
  disabledIndices: Array<number> | undefined,
) {
  return findNonDisabledIndex(listRef(), {disabledIndices});
}

function getMaxIndex(
  listRef: Accessor<MaybeAccessorValue<UseListNavigationProps['listRef']>>,
  disabledIndices: Array<number> | undefined,
) {
  return findNonDisabledIndex(listRef(), {
    decrement: true,
    startingIndex: listRef().length,
    disabledIndices,
  });
}

export interface UseListNavigationProps {
  /**
   * A ref that holds an array of list items.
   * @default empty list
   */
  listRef: MaybeAccessor<Array<HTMLElement | null>>;
  /**
   * The index of the currently active (focused or highlighted) item, which may
   * or may not be selected.
   * @default null
   */
  activeIndex: MaybeAccessor<number | null>;
  /**
   * A callback that is called when the user navigates to a new active item,
   * passed in a new `activeIndex`.
   */
  onNavigate?: (index: number | null) => void;
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeAccessor<boolean>;
  /**
   * The currently selected item index, which may or may not be active.
   * @default null
   */
  selectedIndex?: MaybeAccessor<number | null>;
  /**
   * Whether to focus the item upon opening the floating element. 'auto' infers
   * what to do based on the input type (keyboard vs. pointer), while a boolean
   * value will force the value.
   * @default 'auto'
   */
  focusItemOnOpen?: MaybeAccessor<boolean | 'auto'>;
  /**
   * Whether hovering an item synchronizes the focus.
   * @default true
   */
  focusItemOnHover?: MaybeAccessor<boolean>;
  /**
   * Whether pressing an arrow key on the navigation’s main axis opens the
   * floating element.
   * @default true
   */
  openOnArrowKeyDown?: MaybeAccessor<boolean>;
  /**
   * By default elements with either a `disabled` or `aria-disabled` attribute
   * are skipped in the list navigation — however, this requires the items to
   * be rendered.
   * This prop allows you to manually specify indices which should be disabled,
   * overriding the default logic.
   * For Windows-style select menus, where the menu does not open when
   * navigating via arrow keys, specify an empty array.
   * @default undefined
   */
  disabledIndices?: MaybeAccessor<Array<number>>;
  /**
   * Determines whether focus can escape the list, such that nothing is selected
   * after navigating beyond the boundary of the list. In some
   * autocomplete/combobox components, this may be desired, as screen
   * readers will return to the input.
   * `loop` must be `true`.
   * @default false
   */
  allowEscape?: MaybeAccessor<boolean>;
  /**
   * Determines whether focus should loop around when navigating past the first
   * or last item.
   * @default false
   */
  loop?: MaybeAccessor<boolean>;
  /**
   * If the list is nested within another one (e.g. a nested submenu), the
   * navigation semantics change.
   * @default false
   */
  nested?: MaybeAccessor<boolean>;
  /**
   * Allows to specify the orientation of the parent list, which is used to
   * determine the direction of the navigation.
   * This is useful when list navigation is used within a Composite,
   * as the hook can't determine the orientation of the parent list automatically.
   */
  parentOrientation?: UseListNavigationProps['orientation'];
  /**
   * Whether the direction of the floating element’s navigation is in RTL
   * layout.
   * @default false
   */
  rtl?: MaybeAccessor<boolean>;
  /**
   * Whether the focus is virtual (using `aria-activedescendant`).
   * Use this if you need focus to remain on the reference element
   * (such as an input), but allow arrow keys to navigate list items.
   * This is common in autocomplete listbox components.
   * Your virtually-focused list items must have a unique `id` set on them.
   * If you’re using a component role with the `useRole()` Hook, then an `id` is
   * generated automatically.
   * @default false
   */
  virtual?: MaybeAccessor<boolean>;
  /**
   * The orientation in which navigation occurs.
   * @default 'vertical'
   */
  orientation?: MaybeAccessor<'vertical' | 'horizontal' | 'both'>;
  /**
   * Specifies how many columns the list has (i.e., it’s a grid). Use an
   * orientation of 'horizontal' (e.g. for an emoji picker/date picker, where
   * pressing ArrowRight or ArrowLeft can change rows), or 'both' (where the
   * current row cannot be escaped with ArrowRight or ArrowLeft, only ArrowUp
   * and ArrowDown).
   * @default 1
   */
  cols?: MaybeAccessor<number>;
  /**
   * Whether to scroll the active item into view when navigating. The default
   * value uses nearest options.
   */
  // eslint-disable-next-line no-undef
  scrollItemIntoView?: MaybeAccessor<boolean | ScrollIntoViewOptions>;
  /**
   * When using virtual focus management, this holds a ref to the
   * virtually-focused item. This allows nested virtual navigation to be
   * enabled, and lets you know when a nested element is virtually focused from
   * the root reference handling the events. Requires `FloatingTree` to be
   * setup.
   */
  virtualItemRef?: MaybeAccessor<HTMLElement | null>;
  /**
   * Only for `cols > 1`, specify sizes for grid items.
   * `{ width: 2, height: 2 }` means an item is 2 columns wide and 2 rows tall.
   */
  itemSizes?: MaybeAccessor<Dimensions[]>;
  /**
   * Only relevant for `cols > 1` and items with different sizes, specify if
   * the grid is dense (as defined in the CSS spec for `grid-auto-flow`).
   * @default false
   */
  dense?: boolean;
}

/**
 * Adds arrow key-based navigation of a list of items, either using real DOM
 * focus or virtual focus.
 * @see https://floating-ui.com/docs/useListNavigation
 */
export function useListNavigation<RT extends ReferenceType = ReferenceType>(
  context: Accessor<FloatingContext<RT>>,
  props: UseListNavigationProps,
): Accessor<ElementProps> {
  const {open, onOpenChange, refs} = context();
  const mergedProps = mergeProps(
    {
      onNavigate: () => {},
      enabled: true,
      selectedIndex: null,
      allowEscape: false,
      loop: false,
      nested: false,
      rtl: false,
      virtual: false,
      focusItemOnOpen: 'auto',
      focusItemOnHover: true,
      openOnArrowKeyDown: true,
      orientation: 'vertical',
      parentOrientation: undefined,
      cols: 1,
      scrollItemIntoView: true,
      virtualItemRef: null,
      itemSizes: [],
      dense: false,
    },
    props,
  ) as Required<
    Omit<UseListNavigationProps, 'listRef' | 'activeIndex' | 'disabledIndices'>
  > &
    Pick<UseListNavigationProps, 'listRef' | 'activeIndex' | 'disabledIndices'>;
  const {
    listRef,
    activeIndex,
    enabled,
    selectedIndex,
    allowEscape,
    loop,
    nested,
    rtl,
    virtual,
    focusItemOnOpen,
    focusItemOnHover,
    openOnArrowKeyDown,
    disabledIndices,
    orientation,
    parentOrientation,
    cols,
    scrollItemIntoView,
    virtualItemRef,
    itemSizes,
    dense,
  } = destructure(mergedProps, {normalize: true});

  // eslint-disable-next-line solid/reactivity
  const {onNavigate: unstable_onNavigate} = mergedProps;

  if (!isProd) {
    if (allowEscape()) {
      if (!loop()) {
        console.warn(
          [
            'Floating UI: `useListNavigation` looping must be enabled to allow',
            'escaping.',
          ].join(' '),
        );
      }

      if (!virtual()) {
        console.warn(
          [
            'Floating UI: `useListNavigation` must be virtual to allow',
            'escaping.',
          ].join(' '),
        );
      }
    }

    if (orientation() === 'vertical' && cols() > 1) {
      console.warn(
        [
          'Floating UI: In grid list navigation mode (`cols` > 1), the',
          '`orientation` should be either "horizontal" or "both".',
        ].join(' '),
      );
    }
  }

  const parentId = useFloatingParentNodeId();

  const id = useFloatingNodeId(); // createUniqueId();

  // const onNavigate = useEffectEvent(unstable_onNavigate);
  const onNavigate = unstable_onNavigate;

  let focusItemOnOpenRef = focusItemOnOpen();
  let indexRef = selectedIndex() ?? -1;
  let keyRef: null | string = null;
  let isPointerModalityRef = true;
  let previousOnNavigateRef = onNavigate;
  let previousMountedRef = !!refs.floating();
  let forceSyncFocus = false;
  let forceScrollIntoViewRef = false;

  // const disabledIndicesRef = useLatestRef(disabledIndices);
  // const latestOpenRef = useLatestRef(open);
  // const scrollItemIntoViewRef = useLatestRef(scrollItemIntoView);
  const disabledIndicesRef = disabledIndices?.();
  const scrollItemIntoViewRef = scrollItemIntoView();

  const [activeId, setActiveId] = createSignal<string | undefined>();

  // const focusItem = useEffectEvent(
  const focusItem = (
    listRef: Array<HTMLElement | null>,
    indexRef: number,
    forceScrollIntoView = false,
  ) => {
    const item = listRef[indexRef];
    /* console.log('FOCUSSING ITEM', {item, listRef, indexRef}); */

    if (!item) return;

    if (virtual()) {
      setActiveId(item.id);
    } else {
      enqueueFocus(item, {
        preventScroll: true,
        // Mac Safari does not move the virtual cursor unless the focus call
        // is sync. However, for the very first focus call, we need to wait
        // for the position to be ready in order to prevent unwanted
        // scrolling. This means the virtual cursor will not move to the first
        // item when first opening the floating element, but will on
        // subsequent calls. `preventScroll` is supported in modern Safari,
        // so we can use that instead.
        // iOS Safari must be async or the first item will not be focused.
        sync:
          isMac() && isSafari()
            ? isPreventScrollSupported || forceSyncFocus
            : false,
      });
    }

    requestAnimationFrame(() => {
      const scrollIntoViewOptions = scrollItemIntoViewRef;
      const shouldScrollIntoView =
        scrollIntoViewOptions &&
        item &&
        (forceScrollIntoView || !isPointerModalityRef);

      if (shouldScrollIntoView) {
        // JSDOM doesn't support `.scrollIntoView()` but it's widely supported
        // by all browsers.

        item.scrollIntoView?.(
          typeof scrollIntoViewOptions === 'boolean'
            ? {block: 'nearest', inline: 'nearest'}
            : scrollIntoViewOptions,
        );
      }
    });
  };

  onMount(() => {
    document.createElement('div').focus({
      get preventScroll() {
        isPreventScrollSupported = true;
        return false;
      },
    });
  });

  // Sync `selectedIndex` to be the `activeIndex` upon opening the floating
  // element. Also, reset `activeIndex` upon closing the floating element.
  createEffect(() => {
    if (!enabled()) {
      return;
    }
    const floating = refs.floating();
    if (open() && floating) {
      if (focusItemOnOpenRef && selectedIndex() != null) {
        // Regardless of the pointer modality, we want to ensure the selected
        // item comes into view when the floating element is opened.
        forceScrollIntoViewRef = true;
        onNavigate(selectedIndex());
      }
    } else if (previousMountedRef) {
      // Since the user can specify `onNavigate` conditionally
      // (onNavigate: open ? setActiveIndex : setSelectedIndex),
      // we store and call the previous function.
      indexRef = -1;
      previousOnNavigateRef(null);
    }
  });

  // Sync `activeIndex` to be the focused item while the floating element is
  // open.
  createEffect(() => {
    if (!enabled()) {
      return;
    }
    /* console.log(
      'Sync `activeIndex` to be the focused item while the floating element is open',
      {previousMountedRef, focusItemOnOpenRef, listRef: listRef()}
    ); */

    const floating = refs.floating();
    if (open() && floating) {
      if (activeIndex() == null) {
        forceSyncFocus = false;

        if (selectedIndex() != null) {
          return;
        }

        // Reset while the floating element was open (e.g. the list changed).
        // if (previousMountedRef) {
        //   indexRef = -1;
        //   /* console.log(
        //     'Reset while the floating element was open (e.g. the list changed) - in sync active index'
        //   )
        // }

        // Initial sync.
        if (
          !previousMountedRef &&
          focusItemOnOpenRef &&
          (keyRef != null || (focusItemOnOpenRef === true && keyRef == null))
        ) {
          let runs = 0;
          const waitForListPopulated = () => {
            if (listRef()[0] == null) {
              // Avoid letting the browser paint if possible on the first try,
              // otherwise use rAF. Don't try more than twice, since something
              // is wrong otherwise.
              if (runs < 2) {
                const scheduler = runs ? requestAnimationFrame : queueMicrotask;
                scheduler(waitForListPopulated);
              }
              runs++;
            } else {
              indexRef =
                keyRef == null ||
                isMainOrientationToEndKey(keyRef, orientation, rtl) ||
                nested()
                  ? getMinIndex(listRef, disabledIndicesRef)
                  : getMaxIndex(listRef, disabledIndicesRef);
              keyRef = null;
              /* console.log(
                'Initial sync - in sync active index -- !previousMountedRef && focusIteOnOpenRef'
              ); */

              onNavigate(indexRef);
            }
          };

          waitForListPopulated();
        }
      } else if (!isIndexOutOfBounds(listRef(), activeIndex() as number)) {
        indexRef = activeIndex() as number;
        // console.log(
        //   'initial sync - CASE 2 else if - in sync active index -- !isIndexOutOfBounds -> activeIndex is within listItemRef scope',
        //   {indexRef, focussing: listRef()[indexRef]},
        // );

        focusItem(listRef(), indexRef, forceScrollIntoViewRef);
        forceScrollIntoViewRef = false;
      }
    }
  });

  // Ensure the parent floating element has focus when a nested child closes
  // to allow arrow key navigation to work after the pointer leaves the child.
  const floatingTree = useUnsafeFloatingTree();
  createEffect(() => {
    if (!enabled()) {
      return;
    }
    const tree = floatingTree && floatingTree();
    const floating = refs.floating();
    if (previousMountedRef && !floating && tree) {
      const nodes = tree.nodesRef;
      const parent = nodes
        .find((node) => node.id === parentId)
        ?.context?.refs.floating();
      const activeEl = activeElement(getDocument(floating));
      const treeContainsActiveEl = nodes.some(
        (node) =>
          node.context && contains(node.context.refs.floating(), activeEl),
      );
      /* console.log(
        'Ensure the parent floating element has focus when a nested child closes to allow arrow key navigation to work after the pointer leaves the child\n',
        {treeContainsActiveEl, activeEl, floating, nodes}
      ); */

      if (parent && !treeContainsActiveEl) {
        parent.focus({preventScroll: true});
      }
    }
  });

  createEffect(() => {
    previousOnNavigateRef = onNavigate;
    previousMountedRef = !!refs.floating();
  });

  createEffect(() => {
    if (!open()) {
      keyRef = null;
    }
  });

  const hasActiveIndex = createMemo(() => activeIndex() != null);

  const item = createMemo(() => {
    function syncCurrentTarget(currentTarget: HTMLElement | null) {
      if (!open()) return;
      const index = listRef().indexOf(currentTarget);

      // console.log('LISTITEM - syncCurrentTarget - indexRef', {
      //   indexRef,
      //   listRef: listRef(),

      //   currentTarget,
      // });

      if (index !== -1) {
        onNavigate(index);
      }
    }

    const props: ElementProps['item'] = {
      onFocus({currentTarget}) {
        /* console.log('FOCUS Item', currentTarget); */

        syncCurrentTarget(currentTarget);
      },
      onClick: ({currentTarget}) => currentTarget.focus({preventScroll: true}), // Safari
      ...(focusItemOnHover() && {
        onMouseMove({currentTarget}) {
          /* console.log('focusItemOnHover'); */

          syncCurrentTarget(currentTarget);
        },
        onPointerLeave({pointerType}) {
          if (!isPointerModalityRef || pointerType === 'touch') {
            return;
          }

          indexRef = -1;
          focusItem(listRef(), indexRef);
          onNavigate(null);

          if (!virtual()) {
            enqueueFocus(refs.floating(), {preventScroll: true});
          }
        },
      }),
    };

    return props;
  });

  function onKeyDown(event: KeyboardEvent) {
    isPointerModalityRef = false;
    forceSyncFocus = true;
    /* console.log('onKeyDown', {
      key: event.key,
      target: event.target,
      currentTarget: event.currentTarget,
      floating: refs.floating(),
    }); */
    // If the floating element is animating out, ignore navigation. Otherwise,
    // the `activeIndex` gets set to 0 despite not being open so the next time
    // the user ArrowDowns, the first item won't be focused.
    // if (!latestOpenRef && event.currentTarget === refs.floating()) {
    if (!open() && event.currentTarget === refs.floating()) {
      /* console.log(
        '!latestOpenRef && event.currentTarget === refs.floating()',
        'If the floating element is animating out, ignore navigation.'
      ); */
      //do I need that or refine the condition???
      return;
    }

    if (nested() && isCrossOrientationCloseKey(event.key, orientation, rtl)) {
      /* console.log(
        'nested && isCrossOrientation___CLOSE___Key -- stop event -- closing onOpenChange(false,event)'
      ); */

      stopEvent(event);
      onOpenChange(false, event);
      const domReference = refs.reference();
      if (isHTMLElement(domReference)) {
        domReference.focus();
      }

      return;
    }

    const currentIndex = indexRef;
    const minIndex = getMinIndex(listRef, disabledIndicesRef);
    const maxIndex = getMaxIndex(listRef, disabledIndicesRef);

    if (event.key === 'Home') {
      stopEvent(event);
      indexRef = minIndex;
      /* console.log('Home', {indexRef}); */

      onNavigate(indexRef);
    }

    if (event.key === 'End') {
      stopEvent(event);
      indexRef = maxIndex;
      /* console.log('End', {indexRef}); */

      onNavigate(indexRef);
    }

    // Grid navigation.
    if (cols() > 1) {
      const prevIndex = indexRef;

      if (event.key === ARROW_UP) {
        stopEvent(event);

        if (prevIndex === -1) {
          indexRef = maxIndex;
        } else {
          indexRef = findNonDisabledIndex(listRef(), {
            startingIndex: prevIndex,
            amount: cols(),
            decrement: true,
            disabledIndices: disabledIndicesRef,
          });

          if (loop() && (prevIndex - cols() < minIndex || indexRef < 0)) {
            const col = prevIndex % cols();
            const maxCol = maxIndex % cols();
            const offset = maxIndex - (maxCol - col);

            if (maxCol === col) {
              indexRef = maxIndex;
            } else {
              indexRef = maxCol > col ? offset : offset - cols();
            }
          }
        }

        if (isIndexOutOfBounds(listRef(), indexRef)) {
          indexRef = prevIndex;
        }

        onNavigate(indexRef);
      }

      if (event.key === ARROW_DOWN) {
        stopEvent(event);

        if (prevIndex === -1) {
          indexRef = minIndex;
        } else {
          indexRef = findNonDisabledIndex(listRef(), {
            startingIndex: prevIndex,
            amount: cols(),
            disabledIndices: disabledIndicesRef,
          });

          if (loop() && prevIndex + cols() > maxIndex) {
            indexRef = findNonDisabledIndex(listRef(), {
              startingIndex: (prevIndex % cols()) - cols(),
              amount: cols(),
              disabledIndices: disabledIndicesRef,
            });
          }
        }

        if (isIndexOutOfBounds(listRef(), indexRef)) {
          indexRef = prevIndex;
        }

        onNavigate(indexRef);
      }

      // Remains on the same row/column.
      if (orientation() === 'both') {
        const prevRow = Math.floor(prevIndex / cols());

        if (event.key === ARROW_RIGHT) {
          stopEvent(event);

          if (prevIndex % cols() !== cols() - 1) {
            indexRef = findNonDisabledIndex(listRef(), {
              startingIndex: prevIndex,
              disabledIndices: disabledIndicesRef,
            });

            if (loop() && isDifferentRow(indexRef, cols(), prevRow)) {
              indexRef = findNonDisabledIndex(listRef(), {
                startingIndex: prevIndex - (prevIndex % cols()) - 1,
                disabledIndices: disabledIndicesRef,
              });
            }
          } else if (loop()) {
            indexRef = findNonDisabledIndex(listRef(), {
              startingIndex: prevIndex - (prevIndex % cols()) - 1,
              disabledIndices: disabledIndicesRef,
            });
          }

          if (isDifferentRow(indexRef, cols(), prevRow)) {
            indexRef = prevIndex;
          }
        }

        if (event.key === ARROW_LEFT) {
          stopEvent(event);

          if (prevIndex % cols() !== 0) {
            indexRef = findNonDisabledIndex(listRef(), {
              startingIndex: prevIndex,
              disabledIndices: disabledIndicesRef,
              decrement: true,
            });

            if (loop() && isDifferentRow(indexRef, cols(), prevRow)) {
              indexRef = findNonDisabledIndex(listRef(), {
                startingIndex: prevIndex + (cols() - (prevIndex % cols())),
                decrement: true,
                disabledIndices: disabledIndicesRef,
              });
            }
          } else if (loop()) {
            indexRef = findNonDisabledIndex(listRef(), {
              startingIndex: prevIndex + (cols() - (prevIndex % cols())),
              decrement: true,
              disabledIndices: disabledIndicesRef,
            });
          }

          if (isDifferentRow(indexRef, cols(), prevRow)) {
            indexRef = prevIndex;
          }
        }

        const lastRow = Math.floor(maxIndex / cols()) === prevRow;

        if (isIndexOutOfBounds(listRef(), indexRef)) {
          if (loop() && lastRow) {
            indexRef =
              event.key === ARROW_LEFT
                ? maxIndex
                : findNonDisabledIndex(listRef(), {
                    startingIndex: prevIndex - (prevIndex % cols()) - 1,
                    disabledIndices: disabledIndicesRef,
                  });
          } else {
            indexRef = prevIndex;
          }
        }

        onNavigate(indexRef);
        return;
      }
    }

    if (isMainOrientationKey(event.key, orientation)) {
      stopEvent(event);

      // Reset the index if no item is focused.
      const currentTarget = event.currentTarget as HTMLElement;
      if (
        open() &&
        !virtual() &&
        activeElement(currentTarget.ownerDocument) === event.currentTarget
      ) {
        indexRef = isMainOrientationToEndKey(event.key, orientation, rtl)
          ? minIndex
          : maxIndex;
        /* console.log(
          'Reset the index if no item is focused -- open && \n!virtual && \nactiveElement(currentTarget.ownerDocument) === event.currentTarget \n now onNavigate: ',
          {indexRef, currentTarget}
        ); */
        onNavigate(indexRef);
        return;
      }

      if (isMainOrientationToEndKey(event.key, orientation, rtl)) {
        if (loop()) {
          indexRef =
            currentIndex >= maxIndex
              ? allowEscape() && currentIndex !== listRef().length
                ? -1
                : minIndex
              : findNonDisabledIndex(listRef(), {
                  startingIndex: currentIndex,
                  disabledIndices: disabledIndicesRef,
                });
        } else {
          indexRef = Math.min(
            maxIndex,
            findNonDisabledIndex(listRef(), {
              startingIndex: activeIndex() ?? currentIndex,
              disabledIndices: disabledIndicesRef,
            }),
          );
        }
      } else {
        if (loop()) {
          indexRef =
            currentIndex <= minIndex
              ? allowEscape() && currentIndex !== -1
                ? listRef().length
                : maxIndex
              : findNonDisabledIndex(listRef(), {
                  startingIndex: currentIndex,
                  decrement: true,
                  disabledIndices: disabledIndicesRef,
                });
        } else {
          indexRef = Math.max(
            minIndex,
            findNonDisabledIndex(listRef(), {
              startingIndex: activeIndex() ?? currentIndex,
              decrement: true,
              disabledIndices: disabledIndicesRef,
            }),
          );
        }
      }

      if (isIndexOutOfBounds(listRef(), indexRef)) {
        /* console.log('isIndexOutOfBounds', {indexRef, listRef: listRef(), id}); */

        onNavigate(null);
      } else {
        /* console.log('not isIndexOutOfBounds', {
          indexRef,
          listRef: listRef(),
          id,
        }); */
        onNavigate(indexRef);
      }
    }
  }

  function checkVirtualMouse(event: MouseEvent) {
    if (focusItemOnOpen() === 'auto' && isVirtualClick(event)) {
      focusItemOnOpenRef = true;
    }
  }

  function checkVirtualPointer(event: PointerEvent) {
    // `pointerdown` fires first, reset the state then perform the checks.
    focusItemOnOpenRef = focusItemOnOpen();
    if (focusItemOnOpen() === 'auto' && isVirtualPointerEvent(event)) {
      focusItemOnOpenRef = true;
    }
  }

  const userProps = createMemo(() => {
    if (!enabled()) return {};
    const ariaActiveDescendantProp = virtual() &&
      open() &&
      hasActiveIndex() && {
        'aria-activedescendant': activeId(),
      };
    return {
      reference: {
        'aria-placeholder': id,
        ...ariaActiveDescendantProp,
        onKeyDown(event: KeyboardEvent) {
          isPointerModalityRef = false;
          const isArrowKey = event.key.indexOf('Arrow') === 0;

          if (virtual() && open()) {
            return onKeyDown(event);
          }

          // If a floating element should not open on arrow key down, avoid
          // setting `activeIndex` while it's closed.
          if (!open() && !openOnArrowKeyDown() && isArrowKey) {
            return;
          }

          const isNavigationKey =
            isArrowKey || event.key === 'Enter' || event.key.trim() === '';
          // const isMainKey = isMainOrientationKey(event.key, orientation);
          const isMainKey = isMainOrientationToEndKey(
            event.key,
            orientation,
            rtl,
          );
          const isCrossKey = isCrossOrientationOpenKey(
            event.key,
            orientation,
            rtl,
          );

          if (isNavigationKey) {
            keyRef = nested() && isMainKey ? null : event.key;
          }
          /* console.log({nested: nested(), isCrossKey}); */

          if (nested()) {
            if (isCrossKey) {
              stopEvent(event);

              // if (open()) {
              //   indexRef = getMinIndex(listRef, disabledIndicesRef);
              //   /* console.log(
              //     'reference - onKeydown --- nested --- now onNavigate to',
              //     indexRef
              //   ); */

              //   onNavigate(indexRef);
              // } else {
              //   onOpenChange(true, event);
              // }
              if (!open()) {
                onOpenChange(true, event);
              }
              indexRef = getMinIndex(listRef, disabledIndicesRef);
              onNavigate(indexRef);
            }
            return;
          }

          if (isMainKey) {
            if (selectedIndex() != null) {
              indexRef = selectedIndex() as number;
            }

            stopEvent(event);

            if (!open() && openOnArrowKeyDown()) {
              onOpenChange(true, event);
              //addde MR because opening resets the indexRef through effect which are immediately triggered
              indexRef =
                (selectedIndex() as number) ??
                getMinIndex(listRef, disabledIndicesRef);

              onNavigate(indexRef);
            } else {
              onKeyDown(event);
            }

            if (open()) {
              onNavigate(indexRef);
            }
          }
        },
        onFocus() {
          if (open()) {
            onNavigate(null);
          }
        },
        onPointerDown: checkVirtualPointer,
        onMouseDown: checkVirtualMouse,
        onClick: checkVirtualMouse,
      },
      floating: {
        'aria-orientation':
          orientation() === 'both'
            ? undefined
            : (orientation() as 'horizontal' | 'vertical'),
        ...ariaActiveDescendantProp,
        onKeyDown,
        onPointerMove() {
          isPointerModalityRef = true;
        },
      },
      item: item(),
    };
  });
  return userProps;
}
