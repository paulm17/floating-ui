import '@testing-library/jest-dom';

import {cleanup, render, screen} from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import {Accessor, createSignal, For, JSX, mergeProps, Show} from 'solid-js';
import {vi} from 'vitest';

import {useClick, useFloating, useInteractions, useTypeahead} from '../../src';
import type {UseTypeaheadProps} from '../../src/hooks/useTypeahead';
import {promiseRequestAnimationFrame} from '../helper';
import {Main} from '../visual/components/Menu';

vi.useFakeTimers();
const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});

const useImpl = (
  props: Pick<UseTypeaheadProps, 'onMatch' | 'onTypingChange'> & {
    list?: Array<string>;
    open?: Accessor<boolean>;
    onOpenChange?: (open: boolean) => void;
    addUseClick?: Accessor<boolean>;
  },
) => {
  const [open, setOpen] = createSignal(true);
  const [activeIndex, setActiveIndex] = createSignal<null | number>(null);
  const {refs, context} = useFloating({
    open: props.open ?? open,
    onOpenChange: props.onOpenChange ?? setOpen,
  });
  const listRef = () => props.list ?? ['one', 'two', 'three'];
  const typeahead = useTypeahead(context, {
    listRef,
    activeIndex,
    onMatch(index) {
      setActiveIndex(index);
      props.onMatch?.(index);
    },
    onTypingChange: props.onTypingChange,
  });
  const click = useClick(context, {
    enabled: () => !!props.addUseClick,
  });

  const {getReferenceProps, getFloatingProps} = useInteractions([
    typeahead,
    click,
  ]);

  return {
    activeIndex,
    open,
    getReferenceProps: (userProps?: JSX.HTMLAttributes<Element>) =>
      getReferenceProps({
        role: 'combobox',
        ...userProps,
        ref: refs.setReference,
      }),
    getFloatingProps: () =>
      getFloatingProps({
        role: 'listbox',
        ref: refs.setFloating,
      }),
  };
};

function Combobox(
  props: Pick<UseTypeaheadProps, 'onMatch' | 'onTypingChange'> & {
    list?: Array<string>;
  },
) {
  const {getReferenceProps, getFloatingProps} = useImpl(props);
  return (
    <>
      <input {...getReferenceProps()} />
      <div {...getFloatingProps()} />
    </>
  );
}

function Select(
  props: Pick<UseTypeaheadProps, 'onMatch' | 'onTypingChange'> & {
    list?: Array<string>;
  },
) {
  const [isOpen, setIsOpen] = createSignal(false);
  const mergedProps = mergeProps(props, {
    open: isOpen,
    onOpenChange: setIsOpen,
    addUseClick: () => true,
  });
  const {getReferenceProps, getFloatingProps} = useImpl(mergedProps);
  return (
    <>
      <div tabIndex={0} {...getReferenceProps()} />
      <Show when={isOpen()}>
        <div {...getFloatingProps()} />
      </Show>
    </>
  );
}

test('rapidly focuses list items when they start with the same letter', async () => {
  const spy = vi.fn();
  render(() => <Combobox onMatch={spy} />);

  await user.click(screen.getByRole('combobox'));

  await user.keyboard('t');
  expect(spy).toHaveBeenCalledWith(1);

  await user.keyboard('t');
  expect(spy).toHaveBeenCalledWith(2);

  await user.keyboard('t');
  expect(spy).toHaveBeenCalledWith(1);

  cleanup();
});

test('bails out of rapid focus of first letter if the list contains a string that starts with two of the same letter', async () => {
  const spy = vi.fn();
  render(() => <Combobox onMatch={spy} list={['apple', 'aaron', 'apricot']} />);

  await user.click(screen.getByRole('combobox'));

  await user.keyboard('a');
  expect(spy).toHaveBeenCalledWith(0);

  await user.keyboard('a');
  expect(spy).toHaveBeenCalledWith(0);

  cleanup();
});

test('starts from the current activeIndex and correctly loops', async () => {
  const spy = vi.fn();
  render(() => (
    <Combobox
      onMatch={spy}
      list={['Toy Story 2', 'Toy Story 3', 'Toy Story 4']}
    />
  ));

  await user.click(screen.getByRole('combobox'));

  await user.keyboard('t');
  await user.keyboard('o');
  await user.keyboard('y');
  expect(spy).toHaveBeenCalledWith(0);

  spy.mockReset();

  await user.keyboard('t');
  await user.keyboard('o');
  await user.keyboard('y');
  expect(spy).not.toHaveBeenCalled();

  vi.advanceTimersByTime(750);

  await user.keyboard('t');
  await user.keyboard('o');
  await user.keyboard('y');
  expect(spy).toHaveBeenCalledWith(1);

  vi.advanceTimersByTime(750);

  await user.keyboard('t');
  await user.keyboard('o');
  await user.keyboard('y');
  expect(spy).toHaveBeenCalledWith(2);

  vi.advanceTimersByTime(750);

  await user.keyboard('t');
  await user.keyboard('o');
  await user.keyboard('y');
  expect(spy).toHaveBeenCalledWith(0);

  cleanup();
});

test('capslock characters continue to match', async () => {
  const spy = vi.fn();
  render(() => <Combobox onMatch={spy} />);

  user.click(screen.getByRole('combobox'));

  await user.keyboard('{CapsLock}t');
  expect(spy).toHaveBeenCalledWith(1);

  cleanup();
});

function App1(
  props: Pick<UseTypeaheadProps, 'onMatch'> & {list: Array<string>},
) {
  const {getReferenceProps, getFloatingProps, activeIndex, open} =
    useImpl(props);
  let inputRef!: HTMLInputElement;

  return (
    <>
      <div
        {...getReferenceProps({
          onClick: () => inputRef?.focus(),
        })}
      >
        <input ref={inputRef} readOnly={true} />
      </div>

      <Show when={open()}>
        <div {...getFloatingProps()}>
          <For each={props.list}>
            {(item, index) => (
              <div
                role="option"
                tabIndex={index() === activeIndex() ? 0 : -1}
                aria-selected={index() === activeIndex()}
              >
                {item}
              </div>
            )}
          </For>
        </div>
      </Show>
    </>
  );
}

test('matches when focus is withing reference', async () => {
  const spy = vi.fn();
  render(() => <App1 onMatch={spy} list={['one', 'two', 'three']} />);

  await user.click(screen.getByRole('combobox'));

  await user.keyboard('t');
  expect(spy).toHaveBeenCalledWith(1);

  cleanup();
});

test('matches when focus is withing floating', async () => {
  const spy = vi.fn();
  render(() => <App1 onMatch={spy} list={['one', 'two', 'three']} />);

  await user.click(screen.getByRole('combobox'));

  await user.keyboard('t');
  const option = await screen.findByRole('option', {selected: true});
  expect(option.textContent).toBe('two');
  option.focus();
  expect(option).toHaveFocus();

  await user.keyboard('h');
  expect(
    (await screen.findByRole('option', {selected: true})).textContent,
  ).toBe('three');

  cleanup();
});

test('onTypingChange is called when typing starts or stops', async () => {
  const spy = vi.fn();
  render(() => (
    <Combobox onTypingChange={spy} list={['one', 'two', 'three']} />
  ));

  screen.getByRole('combobox').focus();

  await user.keyboard('t');
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith(true);

  await Promise.resolve(vi.advanceTimersByTime(750));
  expect(spy).toHaveBeenCalledTimes(2);
  expect(spy).toHaveBeenCalledWith(false);

  cleanup();
});

test('Menu - skips disabled items and opens submenu on 2x space if no match', async () => {
  vi.useRealTimers();

  render(() => <Main />);

  await userEvent.click(screen.getByText('Edit'));

  expect(screen.getByRole('menu')).toBeInTheDocument();
  expect(screen.getByTestId('floating')).toBeInTheDocument();
  await userEvent.keyboard('c');
  await promiseRequestAnimationFrame();

  expect(screen.getByText('Copy as')).toHaveFocus();

  await userEvent.keyboard('opy as');
  await promiseRequestAnimationFrame();

  expect(screen.getByText('Copy as').getAttribute('aria-expanded')).toBe(
    'false',
  );

  //resets isTyping to false
  await userEvent.keyboard(' ');
  await promiseRequestAnimationFrame();
  //triggers keyNav
  await userEvent.keyboard(' ');
  await promiseRequestAnimationFrame();

  expect(screen.getByText('Copy as').getAttribute('aria-expanded')).toBe(
    'true',
  );
  cleanup();
});

test('Menu - resets once a match is no longer found', async () => {
  vi.useRealTimers();
  const user = userEvent.setup();
  render(() => <Main />);

  await user.click(screen.getByText('Edit'));

  expect(screen.getByRole('menu')).toBeInTheDocument();
  expect(screen.getByTestId('floating')).toBeInTheDocument();
  expect(screen.getByText('Undo')).toBeInTheDocument();

  await user.keyboard('undr');
  await promiseRequestAnimationFrame();

  expect(screen.getByText('Undo')).toHaveFocus();

  await user.keyboard('r');
  await promiseRequestAnimationFrame();
  expect(screen.getByText('Redo')).toHaveFocus();
  cleanup();
});

test('typing spaces on <div> references does not open the menu', async () => {
  const spy = vi.fn();
  vi.useFakeTimers();
  render(() => <Select onMatch={spy} />);

  await user.click(screen.getByRole('combobox'));
  await user.keyboard('h');
  await user.keyboard(' ');

  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

  await user.keyboard(' ');
  await Promise.resolve(vi.advanceTimersByTime(750));
  expect(screen.queryByRole('listbox')).toBeInTheDocument();
  cleanup();
});
