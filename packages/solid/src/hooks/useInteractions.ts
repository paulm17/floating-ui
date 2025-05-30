import {JSX} from 'solid-js';
import {access, MaybeAccessor} from '@solid-primitives/utils';
import type {ElementProps} from '../types';
import {
  ACTIVE_KEY,
  FOCUSABLE_ATTRIBUTE,
  SELECTED_KEY,
} from '../utils/constants';

export type ExtendedUserProps = {
  [ACTIVE_KEY]?: boolean;
  [SELECTED_KEY]?: boolean;
};

function extractAndMergeElementProps(
  userProps:
    | (JSX.HTMLAttributes<HTMLElement> | JSX.HTMLAttributes<Element>)
    & ExtendedUserProps
    | undefined,
  propsList: Array<MaybeAccessor<ElementProps | void>>,
  elementKey: 'reference' | 'floating' | 'item',
): Record<string, unknown> {
  const map = new Map<string, Array<(...args: unknown[]) => void>>();
  const isItem = elementKey === 'item';

  let domUserProps = userProps;
  if (isItem && userProps) {
    const {[ACTIVE_KEY]: _, [SELECTED_KEY]: __, ...validProps} = userProps;
    domUserProps = validProps;
  }

  return {
    ...(elementKey === 'floating' && {
      tabIndex: -1,
      [FOCUSABLE_ATTRIBUTE]: '',
    }),
    ...userProps,
    ...propsList
      .map((value) => {
        const val = access(value);
        return val ? val[elementKey] : null;
      })
      .concat(userProps)
      .reduce((acc: Record<string, unknown>, props) => {
        if (!props) {
          return acc;
        }

        Object.entries(props).forEach(([key, value]) => {
          if (isItem && [ACTIVE_KEY, SELECTED_KEY].includes(key)) {
            return;
          }

          if (key.indexOf('on') === 0) {
            if (!map.has(key)) {
              map.set(key, []);
            }

            if (typeof value === 'function') {
              map.get(key)?.push(value);

              acc[key] = (...args: unknown[]) => {
                return map
                  .get(key)
                  ?.map((fn) => fn(...args))
                  .find((val) => val !== undefined);
              };
            }
          } else {
            acc[key] = value;
          }
        });

        return acc;
      }, {}),
  };
}

/**
 * Merges an array of interaction hooks' props into prop getters, allowing
 * event handler functions to be composed together without overwriting one
 * another.
 * @see https://floating-ui.com/docs/useInteractions
 */
export function useInteractions(
  propsList: Array<MaybeAccessor<ElementProps | void>> = [],
) {
  const getReferenceProps = (userProps?: JSX.HTMLAttributes<Element>) =>
    extractAndMergeElementProps(userProps, propsList, 'reference');

  const getFloatingProps = (userProps?: JSX.HTMLAttributes<HTMLElement>) =>
    extractAndMergeElementProps(userProps, propsList, 'floating');

  const getItemProps = (userProps?: JSX.HTMLAttributes<HTMLElement>) =>
    extractAndMergeElementProps(userProps, propsList, 'item');

  // return () => ({getReferenceProps, getFloatingProps, getItemProps});
  return {getReferenceProps, getFloatingProps, getItemProps};
}
