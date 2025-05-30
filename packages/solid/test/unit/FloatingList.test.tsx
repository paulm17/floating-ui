import '@testing-library/jest-dom';

import {fireEvent, render, screen} from '@solidjs/testing-library';
import {
  Accessor,
  createContext,
  createMemo,
  createSignal,
  JSX,
  ParentProps,
  Show,
  useContext,
} from 'solid-js';

import {
  createFloatingListContext,
  FloatingList,
  useClick,
  useFloating,
  useInteractions,
  useListItem,
  useListNavigation,
  useTypeahead,
} from '../../src';
import {promiseRequestAnimationFrame} from '../helper';

const SelectContext = createContext<{
  getItemProps: () // userProps?: JSX.HTMLAttributes<HTMLElement> | undefined,
  => Record<string, unknown>;
  activeIndex: Accessor<number | null>;
} | null>(null);

function Select(props: ParentProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [activeIndex, setActiveIndex] = createSignal<number | null>(0);

  const {refs, context} = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
  });

  const floatingListContext = createFloatingListContext();

  const click = useClick(context);
  const listNavigation = useListNavigation(context, {
    listRef: floatingListContext.items,
    activeIndex,
    onNavigate: setActiveIndex,
  });
  const typeahead = useTypeahead(context, {
    listRef: floatingListContext.labelsRef,
    activeIndex,
    onMatch: setActiveIndex,
  });

  const {getReferenceProps, getFloatingProps, getItemProps} = useInteractions([
    click,
    listNavigation,
    typeahead,
  ]);

  return (
    <SelectContext.Provider value={{getItemProps, activeIndex}}>
      <button
        ref={refs.setReference}
        {...getReferenceProps()}
        data-testid="reference"
        role="button"
      >
        Open select menu
      </button>
      <FloatingList context={floatingListContext}>
        <Show when={isOpen()}>
          <div ref={refs.setFloating} role="listbox" {...getFloatingProps()}>
            {props.children}
          </div>
        </Show>
      </FloatingList>
    </SelectContext.Provider>
  );
}

function Option(props: {children: JSX.Element; label?: string}) {
  const [ref, setRef] = createSignal<HTMLDivElement | null>(null);
  const context = useContext(SelectContext);
  const listContext = useListItem(ref);

  const isActive = createMemo(() => {
    const itemIndex = listContext.getItemIndex(ref());
    if (!itemIndex) return false;
    return itemIndex === context?.activeIndex();
  });
  return (
    <div
      classList={{'bg-blue-500': isActive()}}
      ref={setRef}
      role="option"
      tabIndex={isActive() ? 0 : -1}
      {...context?.getItemProps()}
    >
      {props.children}
    </div>
  );
}

test('registers element ref and indexes correctly', async () => {
  render(() => (
    <Select>
      <Option>One</Option>
      <div>
        <Option>Two</Option>
        <Option>Three</Option>
        <Option>Four</Option>
      </div>
      <>
        <Option>Five</Option>
        <Option>Six</Option>
      </>
    </Select>
  ));

  expect(screen.getByTestId('reference')).toBeInTheDocument();
  // await user.click(screen.getByTestId('reference'));
  fireEvent.click(screen.getByTestId('reference'));
  await promiseRequestAnimationFrame();
  expect(screen.getAllByRole('option')[0]).toHaveFocus();

  fireEvent.keyDown(screen.getByRole('listbox'), {key: 'ArrowDown'});
  await promiseRequestAnimationFrame();
  expect(screen.getAllByRole('option')[1]).toHaveFocus();

  fireEvent.keyDown(screen.getByRole('listbox'), {key: 'ArrowDown'});
  await promiseRequestAnimationFrame();
  expect(screen.getAllByRole('option')[2]).toHaveFocus();

  fireEvent.keyDown(screen.getByRole('listbox'), {key: 'ArrowDown'});
  fireEvent.keyDown(screen.getByRole('listbox'), {key: 'ArrowDown'});
  await promiseRequestAnimationFrame();

  expect(screen.getAllByRole('option')[4]).toHaveFocus();
  expect(screen.getAllByRole('option')[4].getAttribute('tabindex')).toBe('0');
});

test('registers an element ref and index correctly', async () => {
  render(() => (
    <Select>
      <Option>One</Option>
    </Select>
  ));

  fireEvent.click(screen.getByRole('button'));
  await promiseRequestAnimationFrame();

  expect(screen.getAllByRole('option')[0]).toHaveFocus();
});

test('registers strings correctly (no value)', async () => {
  render(() => (
    <Select>
      <Option>One</Option>
      <div>
        <Option>Two</Option>
        <Option>Three</Option>
        <Option>Four</Option>
      </div>
      <>
        <Option>Five</Option>
        <Option>Six</Option>
      </>
    </Select>
  ));

  fireEvent.click(screen.getByRole('button'));
  await promiseRequestAnimationFrame();

  expect(screen.getAllByRole('option')[0]).toHaveFocus();

  fireEvent.keyDown(screen.getByRole('listbox'), {key: 'F'});
  await promiseRequestAnimationFrame();
  expect(screen.getAllByRole('option')[3]).toHaveFocus();

  fireEvent.keyDown(screen.getByRole('listbox'), {key: 'I'});
  await promiseRequestAnimationFrame();
  expect(screen.getAllByRole('option')[4]).toHaveFocus();
});

test('registers strings correctly (label)', async () => {
  render(() => (
    <Select>
      <Option label="One">One</Option>
      <div>
        <Option label="Two">Two</Option>
        <Option label="Three">Three</Option>
        <Option label="Four">Four</Option>
      </div>
      <>
        <Option label="Five">Five</Option>
        <Option label="Six">Six</Option>
      </>
    </Select>
  ));

  fireEvent.click(screen.getByRole('button'));
  await promiseRequestAnimationFrame();

  expect(screen.getAllByRole('option')[0]).toHaveFocus();

  fireEvent.keyDown(screen.getByRole('listbox'), {key: 'F'});
  await promiseRequestAnimationFrame();
  expect(screen.getAllByRole('option')[3]).toHaveFocus();

  fireEvent.keyDown(screen.getByRole('listbox'), {key: 'I'});
  await promiseRequestAnimationFrame();
  expect(screen.getAllByRole('option')[4]).toHaveFocus();
});

test('handles re-ordering', async () => {
  render(() => (
    <Select>
      <Option>One</Option>
      <div>
        <Option>Two</Option>
        <Option>Three</Option>
        <Option>Four</Option>
      </div>
      <>
        <Option>Five</Option>
        <Option>Six</Option>
      </>
    </Select>
  ));

  fireEvent.click(screen.getByRole('button'));
  await promiseRequestAnimationFrame();
  expect(screen.getAllByRole('option')[0]).toHaveFocus();

  fireEvent.keyDown(screen.getByRole('listbox'), {key: 'ArrowDown'});
  await promiseRequestAnimationFrame();
  expect(screen.getAllByRole('option')[1]).toHaveFocus();

  fireEvent.keyDown(screen.getByRole('listbox'), {key: 'ArrowDown'});
  fireEvent.keyDown(screen.getByRole('listbox'), {key: 'ArrowDown'});
  fireEvent.keyDown(screen.getByRole('listbox'), {key: 'ArrowDown'});
  fireEvent.keyDown(screen.getByRole('listbox'), {key: 'ArrowDown'});
  await promiseRequestAnimationFrame();

  expect(screen.getAllByRole('option')[5]).toHaveFocus();
});
