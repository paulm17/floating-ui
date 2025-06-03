// FloatingDelayGroup.solid.tsx
/* eslint-disable solid/reactivity */
import {
  Accessor,
  JSX,
  JSXElement,
  createContext,
  createEffect,
  mergeProps,
  onCleanup,
  useContext,
} from 'solid-js';
import { createStore } from 'solid-js/store';

import { getDelay } from '../hooks/useHover';
import type { FloatingContext } from '../types';

type Delay = number | Partial<{ open: number; close: number }>;

interface GroupState {
  delay: Delay;
  initialDelay: Delay;
  currentId: any;
  timeoutMs: number;
  isInstantPhase: boolean;
}

interface GroupContext extends GroupState {
  setState: (partial: Partial<GroupState>) => void;
  setCurrentId: (id: any) => void;
}

const FloatingDelayGroupContext = createContext<GroupContext>({
  delay: 0,
  initialDelay: 0,
  currentId: null,
  timeoutMs: 0,
  isInstantPhase: false,
  setState: () => undefined,
  setCurrentId: () => undefined,
});

export const useDelayGroupContext = () => useContext(FloatingDelayGroupContext);

export interface FloatingDelayGroupProps {
  children?: JSXElement;
  delay: Delay;
  timeoutMs?: number;
}

/**
 * Provides context for a group of floating elements that should share a
 * `delay`.
 */
export const FloatingDelayGroup = (
  props: FloatingDelayGroupProps
): JSX.Element => {
  const [state, setState] = createStore<GroupState>({
    delay: props.delay,
    initialDelay: props.delay,
    currentId: null,
    timeoutMs: props.timeoutMs ?? 0,
    isInstantPhase: false,
  });

  let initialCurrentIdRef: any = null;

  const setCurrentId = (id: any) => {
    setState({ currentId: id });
  };

  // Mirror React’s useModernLayoutEffect for tracking `isInstantPhase` & `currentId`
  createEffect(() => {
    const { currentId, isInstantPhase } = state;

    if (currentId) {
      if (initialCurrentIdRef === null) {
        initialCurrentIdRef = currentId;
      } else if (!isInstantPhase) {
        setState({ isInstantPhase: true });
      }
    } else {
      if (isInstantPhase) {
        setState({ isInstantPhase: false });
      }
      initialCurrentIdRef = null;
    }
  });

  // Build a stable context object (including both setState and setCurrentId)
  const context = mergeProps({ setState, setCurrentId }, state);

  return (
    <FloatingDelayGroupContext.Provider value={context}>
      {props.children}
    </FloatingDelayGroupContext.Provider>
  );
};

interface UseGroupOptions {
  id: any;
}

/**
 * Enables grouping when called inside a component that's a child of a
 * `FloatingDelayGroup`.
 */
export const useDelayGroup = (
  floatingContext: Accessor<FloatingContext>,
  props: UseGroupOptions
) => {
  const group = useDelayGroupContext();

  // 1) When `currentId` changes, update delays and close anything that isn’t this `id`.
  createEffect(() => {
    if (group.currentId) {
      // Update delay immediately
      group.setState({
        delay: {
          open: 1,
          close: getDelay(group.initialDelay, 'close'),
        },
      });

      if (group.currentId !== props.id) {
        floatingContext().onOpenChange(false);
      }
    }
  });

  // 2) When this item closes but it was the `currentId`, start the timeout/unset logic.
  createEffect(() => {
    if (!floatingContext().open() && group.currentId === props.id) {
      const unset = () => {
        floatingContext().onOpenChange(false);
        group.setState({ delay: group.initialDelay, currentId: null });
      };

      console.log('timeoutMs', group.timeoutMs)

      if (group.timeoutMs) {
        const t = window.setTimeout(unset, group.timeoutMs);
        onCleanup(() => {
          clearTimeout(t);
        });
      } else {
        unset();
      }
    }
  });

  // 3) Whenever this item opens, set `currentId = props.id`. Whenever it closes, clear it.
  createEffect(() => {
    if (floatingContext().open()) {
      group.setCurrentId(props.id);
    } else {
      // If it’s closing, don’t immediately clear `currentId` here—
      // the “close” effect above will do that (after timeout).
      // However, React version does set `currentId = null` immediately on close only if no timeoutMs.
      if (!group.timeoutMs) {
        group.setCurrentId(null);
      }
    }
  });

  return group;
};
