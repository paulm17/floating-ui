import {
  Accessor,
  createEffect,
  createMemo,
  mergeProps,
  splitProps,
} from 'solid-js';
import {MaybeAccessor} from '@solid-primitives/utils';
import type {ElementProps, FloatingContext, ReferenceType} from '../types';
import {stopEvent} from '../utils/event';
import {destructure} from '../utils/destructure';

type ListType = Accessor<Array<string | null>>;
export interface UseTypeaheadProps {
  /**
   * A ref which contains an array of strings whose indices match the HTML
   * elements of the list.
   * @default empty list
   */
  listRef: ListType;
  /**
   * The index of the active (focused or highlighted) item in the list.
   * @default null
   */
  activeIndex: MaybeAccessor<number | null>;
  /**
   * Callback invoked with the matching index if found as the user types.
   */
  onMatch?: (index: number) => void;
  /**
   * Callback invoked with the typing state as the user types.
   */
  onTypingChange?: (isTyping: boolean) => void;
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: MaybeAccessor<boolean>;
  /**
   * A function that returns the matching string from the list.
   * @default lowercase-finder
   */
  findMatch?:
    | null
    | ((
        list: Array<string | null>,
        typedString: string,
      ) => string | null | undefined);
  /**
   * The number of milliseconds to wait before resetting the typed string.
   * @default 750
   */
  resetMs?: MaybeAccessor<number>;
  /**
   * An array of keys to ignore when typing.
   * @default []
   */
  ignoreKeys?: MaybeAccessor<Array<string>>;
  /**
   * The index of the selected item in the list, if available.
   * @default null
   */
  selectedIndex?: MaybeAccessor<number | null>;
}

/**
 * Provides a matching callback that can be used to focus an item as the user
 * types, often used in tandem with `useListNavigation()`.
 * 
 * **Changes from original:**
 *  1. On `context().open() === true`, immediately call `refs.floating.focus()`.
 *  2. Add `tabIndex: -1` to the floating props so it can be focused.
 */
export function useTypeahead<RT extends ReferenceType = ReferenceType>(
  context: Accessor<FloatingContext<RT>>,
  props: UseTypeaheadProps,
): Accessor<ElementProps> {
  const [local, rest] = splitProps(props, [
    'onMatch',
    'onTypingChange',
    'findMatch',
  ]);
  const mergedProps = mergeProps(
    {
      listRef: () => [],
      activeIndex: null,
      enabled: true,
      findMatch: null,
      resetMs: 750,
      ignoreKeys: [],
      selectedIndex: null,
    },
    rest,
  ) as Required<
    Omit<UseTypeaheadProps, 'onMatch' | 'onTypingChange' | 'findMatch'>
  >;

  const {listRef, activeIndex, ignoreKeys, enabled, resetMs, selectedIndex} =
    destructure(mergedProps, {normalize: true});

  let timeoutIdRef: number | ReturnType<typeof setTimeout>;
  let stringRef = '';
  let prevIndexRef: number | null = selectedIndex() ?? activeIndex() ?? -1;
  let matchIndexRef: number | null = null;

  // Whenever the menu opens, reset typeahead state AND focus the floating element.
  createEffect(() => {
    if (context().open()) {
      // Clear any leftover typing state
      clearTimeout(timeoutIdRef);
      matchIndexRef = null;
      stringRef = '';

      // Only focus the floating container if no item is already active.
      if (activeIndex() == null) {
        const floatingEl = context().refs.floating();
        if (floatingEl) {
          // Delay so the element is mounted first
          setTimeout(() => floatingEl.focus(), 0);
        }
      }
    }
  });

  createEffect(() => {
    // Sync arrow‐key navigation but not typeahead navigation.
    if (context().open() && stringRef === '') {
      prevIndexRef = selectedIndex() ?? activeIndex() ?? -1;
    }
  });

  function setTypingChange(value: boolean) {
    if (context().dataRef.typing !== value) {
      context().dataRef.typing = value;
      local.onTypingChange?.(value);
    }
  }

  function getMatchingIndex(
    list: Array<string | null>,
    orderedList: Array<string | null>,
    string: string,
  ) {
    const str = local.findMatch
      ? local.findMatch(orderedList, string)
      : orderedList.find(
          (text) =>
            text?.toLocaleLowerCase().indexOf(string.toLocaleLowerCase()) ===
            0,
        );

    return str ? list.indexOf(str) : -1;
  }

  function onKeyDown(event: KeyboardEvent) {
    const listContent = listRef;

    if (stringRef.length > 0 && stringRef[0] !== ' ') {
      if (getMatchingIndex(listContent(), listContent(), stringRef) === -1) {
        setTypingChange(false);
      } else if (event.key === ' ') {
        stopEvent(event);
      }
    }

    if (
      listContent() == null ||
      ignoreKeys().includes(event.key) ||
      // Character key?
      event.key.length !== 1 ||
      // Modifier key?
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }

    if (context().open() && event.key !== ' ') {
      stopEvent(event);
      setTypingChange(true);
    }

    // Allow rapid succession of the same first letter only if no two items
    // start with the same letter.
    const allowRapidSuccessionOfFirstLetter = listContent().every((text) =>
      text
        ? text[0]?.toLocaleLowerCase() !== text[1]?.toLocaleLowerCase()
        : true,
    );

    if (allowRapidSuccessionOfFirstLetter && stringRef === event.key) {
      stringRef = '';
      prevIndexRef = matchIndexRef;
    }

    stringRef += event.key;

    clearTimeout(timeoutIdRef);
    timeoutIdRef = setTimeout(() => {
      stringRef = '';
      prevIndexRef = matchIndexRef;
      setTypingChange(false);
    }, resetMs());

    const prevIndex = prevIndexRef ?? 0;

    const index = getMatchingIndex(
      listContent(),
      [
        ...listContent().slice(prevIndex + 1),
        ...listContent().slice(0, prevIndex + 1),
      ],
      stringRef,
    );

    if (index !== -1) {
      if (event.key === ' ') {
        stopEvent(event);
      }
      local.onMatch?.(index);
      matchIndexRef = index;
    } else if (event.key !== ' ') {
      // No match: reset
      stringRef = '';
      setTypingChange(false);
    }
  }

  return createMemo(() => {
    if (!enabled()) {
      return {};
    }
    return {
      reference: {
        onKeyDown,
      },
      floating: {
        // Now that the floating container has a tabIndex, this will allow
        // it to be focused (via the createEffect above).
        tabIndex: -1,
        onKeyDown,
        onKeyUp(event) {
          if (event.key === ' ') {
            setTypingChange(false);
          }
        },
      },
    };
  });
}
