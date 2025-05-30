import {
  Accessor,
  createMemo,
  createSignal,
  JSX,
  mergeProps,
  ParentComponent,
  Setter,
  Show,
  splitProps,
  untrack,
} from 'solid-js';
import {MaybeAccessor} from '@solid-primitives/utils';
import {
  findNonDisabledIndex,
  getGridNavigatedIndex,
  getMaxIndex,
  getMinIndex,
  isIndexOutOfBounds,
  getGridCellIndices,
  getGridCellIndexOfCorner,
  createGridCellMap,
  isListIndexDisabled,
} from '../utils/composite';
import {destructure} from '../utils/destructure';
import {enqueueFocus} from '../utils/enqueueFocus';
import {
  createFloatingListContext,
  FloatingList,
  useListItem,
} from './FloatingList';
import {
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
} from '../utils/constants';
import type {Dimensions} from '../types';

type CompositeContextProps = {
  activeIndex: Accessor<number>;
  onNavigate(index: number): void;
};

type RenderProp =
  | (() => JSX.Element)
  | ((
      props: Accessor<Omit<JSX.HTMLAttributes<HTMLElement>, 'ref'>>,
    ) => JSX.Element);

interface CompositeProps {
  /**
   * Determines the element to render.
   * @example
   * ```jsx
   * <Composite render={<ul />} />
   * <Composite render={(htmlProps) => <ul {...htmlProps} />} />
   * ```
   */
  render?: RenderProp;
  /**
   * Determines the orientation of the composite.
   */
  orientation?: MaybeAccessor<'horizontal' | 'vertical' | 'both'>;
  /**
   * Determines whether focus should loop around when navigating past the first
   * or last item.
   */
  loop?: MaybeAccessor<boolean>;
  /**
   * Whether the direction of the composite’s navigation is in RTL layout.
   */
  rtl?: MaybeAccessor<boolean>;
  /**
   * Determines the number of columns there are in the composite
   * (i.e. it’s a grid).
   */
  cols?: MaybeAccessor<number>;
  /**
   * Determines which items are disabled. The `disabled` or `aria-disabled`
   * attributes are used by default.
   */
  disabledIndices?: MaybeAccessor<number[]>;
  /**
   * Determines which item is active. Used to externally control the active
   * item.
   */
  activeIndex?: Accessor<number>;
  /**
   * Called when the user navigates to a new item. Used to externally control
   * the active item.
   */
  onNavigate?: Setter<number>;
  /**
   * Only for `cols > 1`, specify sizes for grid items.
   * `{ width: 2, height: 2 }` means an item is 2 columns wide and 2 rows tall.
   */
  itemSizes?: Dimensions[];
  /**
   * Only relevant for `cols > 1` and items with different sizes, specify if
   * the grid is dense (as defined in the CSS spec for grid-auto-flow).
   */
  dense?: boolean;
}

const horizontalKeys = [ARROW_LEFT, ARROW_RIGHT];
const verticalKeys = [ARROW_UP, ARROW_DOWN];
const allKeys = [...horizontalKeys, ...verticalKeys];

export const Composite: ParentComponent<
  JSX.HTMLAttributes<HTMLElement> & CompositeProps
> = (props) => {
  const [internalActiveIndex, internalSetActiveIndex] = createSignal(0);
  const [_, local, compositeProps] = splitProps(
    props,
    ['children'],
    [
      'orientation',
      'loop',
      'rtl',
      'cols',
      'activeIndex',
      'onNavigate',
      'disabledIndices',
      'itemSizes',
      'dense',
      'render'
    ],
  );
  const mergedProps = mergeProps(
    {
      orientation: 'both',
      loop: true,
      rtl: false,
      cols: 1,
      activeIndex: internalActiveIndex,
      onNavigate: internalSetActiveIndex,
      itemSizes: [] as Dimensions[],
      dense: false,
    } as Required<
      Pick<
        CompositeProps,
        'orientation' | 'loop' | 'rtl' | 'cols' | 'activeIndex' | 'onNavigate' | 'itemSizes' | 'dense'
      >
    >,
    local,
  );

  const {orientation, loop, rtl, cols, disabledIndices, activeIndex, onNavigate, itemSizes, dense, render} =
    destructure(mergedProps, {normalize: true});

  const listContext = createFloatingListContext<CompositeContextProps>({
    activeIndex,
    onNavigate,
  });

  const isGrid = createMemo(() => cols() > 1);

  function handleKeyDown(event: KeyboardEvent) {
    if (!allKeys.includes(event.key)) return;
    const elementsRef = listContext.items();

    const minIndex = getMinIndex(elementsRef, disabledIndices?.());
    const maxIndex = getMaxIndex(elementsRef, disabledIndices?.());
    let nextIndex = activeIndex();
    const prevIndex = activeIndex();

    const horizontalEndKey = rtl() ? ARROW_LEFT : ARROW_RIGHT;
    const horizontalStartKey = rtl() ? ARROW_RIGHT : ARROW_LEFT;


    if (isGrid()) {
      // create grid cell map similar to React version
      const sizes = itemSizes?.().length
        ? itemSizes()!
        : Array.from({ length: elementsRef.length }, () => ({ width: 1, height: 1 }));
      const cellMap = createGridCellMap(sizes, cols(), dense());
      const minGridIndex = cellMap.findIndex(
        (index) => index != null && !isListIndexDisabled(elementsRef, index, disabledIndices?.()),
      );
      const maxGridIndex = cellMap.reduce(
        (foundIndex: number, index, cellIndex) =>
          index != null && !isListIndexDisabled(elementsRef, index, disabledIndices?.())
            ? cellIndex
            : foundIndex,
        -1,
      );
      const maybeNextIndex =
        cellMap[
          getGridNavigatedIndex(
            elementsRef,
            {
              event,
              orientation: orientation(),
              loop: loop(),
              cols: cols(),
              rtl: rtl(),
              disabledIndices: getGridCellIndices(
                [
                  ...((disabledIndices?.() || []).map((d) => d)),
                  // treat undefined for empty cells
                ],
                cellMap,
              ),
              minIndex: minGridIndex,
              maxIndex: maxGridIndex,
              prevIndex: getGridCellIndexOfCorner(
                prevIndex > maxIndex ? minIndex : prevIndex,
                sizes,
                cellMap,
                cols(),
                event.key === ARROW_DOWN
                  ? 'bl'
                  : event.key === horizontalEndKey
                  ? 'tr'
                  : 'tl',
              ),
            },
          )
        ];
      if (maybeNextIndex != null) {
        nextIndex = maybeNextIndex;
      }
    }

    const toEndKeys = {
      horizontal: [horizontalEndKey],
      vertical: [ARROW_DOWN],
      both: [horizontalEndKey, ARROW_DOWN],
    }[orientation()];

    const toStartKeys = {
      horizontal: [horizontalStartKey],
      vertical: [ARROW_UP],
      both: [horizontalStartKey, ARROW_UP],
    }[orientation()];

    const preventedKeys = isGrid()
      ? allKeys
      : {
          horizontal: horizontalKeys,
          vertical: verticalKeys,
          both: allKeys,
        }[orientation()];

    if (
      nextIndex === activeIndex() &&
      [...toEndKeys, ...toStartKeys].includes(event.key)
    ) {
      if (loop() && nextIndex === maxIndex && toEndKeys.includes(event.key)) {
        nextIndex = minIndex;
      } else if (
        loop() &&
        nextIndex === minIndex &&
        toStartKeys.includes(event.key)
      ) {
        nextIndex = maxIndex;
      } else {
        nextIndex = findNonDisabledIndex(elementsRef, {
          startingIndex: nextIndex,
          decrement: toStartKeys.includes(event.key),
          disabledIndices: disabledIndices?.(),
        });
      }
    }

    if (
      nextIndex !== activeIndex() &&
      !isIndexOutOfBounds(elementsRef, nextIndex)
    ) {
      event.stopPropagation();

      if (preventedKeys.includes(event.key)) {
        event.preventDefault();
      }

      onNavigate(nextIndex);

      // Wait for FocusManager `returnFocus` to execute.
      queueMicrotask(() => {
        enqueueFocus(elementsRef[nextIndex]);
      });
    }
  }

  const computedProps = createMemo(() => {
    const orientationRef = orientation();
    return {
      ...compositeProps,
      'aria-orientation':
        orientationRef === 'both' ? undefined : orientationRef,
      onKeyDown(e) {
        typeof compositeProps.onKeyDown === 'function' &&
          compositeProps.onKeyDown(e);
        handleKeyDown(e);
      },
    } as Omit<JSX.HTMLAttributes<HTMLElement>, 'ref'>;
  });

  return (
    <FloatingList context={listContext}>
      <Show
        when={!render}
        fallback={
          <>
            {untrack(() => {
              render?.(computedProps);
            })}
          </>
        }
      >
        <div {...computedProps()}>{_.children}</div>
      </Show>
    </FloatingList>
  );
};

export const CompositeItem: ParentComponent<
  JSX.HTMLAttributes<HTMLElement | HTMLDivElement> & {
    render?: RenderProp;
  }
> = (props) => {
  const [ref, setRef] = createSignal<HTMLElement | HTMLDivElement | null>(null);
  const [local, itemProps] = splitProps(props, ['render', 'children']);
  const context = useListItem<CompositeContextProps>(ref);

  const isActive = createMemo(
    () => context.activeIndex() === context.getItemIndex(ref()),
  );

  const computedProps = createMemo(() => {
    const index = context.getItemIndex(ref());

    return {
      ...itemProps,
      ref: (el: HTMLElement | HTMLDivElement) => {
        setRef(el);
        typeof itemProps.ref === 'function'
          ? itemProps.ref(el)
          : // eslint-disable-next-line solid/reactivity
            (itemProps.ref = el);
      },
      tabIndex: isActive() ? 0 : -1,
      'data-active': isActive() ? '' : undefined,
      onFocus(
        e: FocusEvent & {
          currentTarget: HTMLElement | HTMLDivElement;
          target: Element;
        },
      ) {
        itemProps.onFocus &&
          typeof itemProps.onFocus === 'function' &&
          itemProps.onFocus(e);
        context.onNavigate(index);
      },
    };
  });

  return (
    <Show
      when={!local.render}
      fallback={<>{untrack(() => local.render?.(computedProps))}</>}
    >
      <div {...computedProps()}>
        {local.children}
      </div>
    </Show>
  );
};
