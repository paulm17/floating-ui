import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
  useListNavigation,
  FloatingList as SolidFloatingList,
  useListItem,
} from '@floating-ui/solid';
import { createSignal, Index } from 'solid-js';

import { mergeProps, splitProps } from "solid-js";

export default { title: 'Solid: FloatingList' };

const ListItem = (props: any) => {
  const merged = mergeProps({ active: false }, props);
  const [local, others] = splitProps(merged, ['children', 'active']);
  const { ref: itemRef } = useListItem();

  return (
    <div
      ref={itemRef}
      role="option"
      tabIndex={local.active ? 0 : -1}
      class={`px-4 py-2 cursor-pointer transition-colors ${
        local.active ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
      }`}
      {...others}
    >
      {local.children}
    </div>
  );
};

export function FloatingList() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [activeIndex, setActiveIndex] = createSignal<number | null>(null);
  const [selectedOption, setSelectedOption] = createSignal('Select an option');

  // Holds refs to each <ListItem> DOM node for virtual navigation
  const [listRef, setListRef] = createSignal<Array<HTMLElement | null>>([]);

  const options = [
    'Apple',
    'Banana',
    'Cherry',
    'Date',
    'Elderberry',
    'Fig',
    'Grape',
  ];

  const floating = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(5), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(floating.context);
  const dismiss = useDismiss(floating.context);
  const role = useRole(floating.context, { role: 'listbox' });
  const listNav = useListNavigation(floating.context, {
    listRef: listRef(),
    activeIndex,
    onNavigate: setActiveIndex,
    virtual: true,
    loop: true,
  });

  const interactions = useInteractions([
    click,
    dismiss,
    role,
    listNav,
  ]);

  const handleSelect = (option: string) => {
    setSelectedOption(option);
    setIsOpen(false);
    setActiveIndex(null);
  };

  return (
    <div class="max-w-md mx-auto p-8">
      <h1 class="text-2xl font-bold mb-6 text-gray-800">
        FloatingList Test
      </h1>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Choose a fruit:
          </label>

          <button
            ref={floating.refs.setReference}
            class="relative w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            {...interactions.getReferenceProps()}
          >
            <span class="block truncate">{selectedOption()}</span>
            <span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                class="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
          </button>
        </div>

        {isOpen() && (
          <FloatingFocusManager context={floating.context} modal={false}>
            <div
              ref={floating.refs.setFloating}
              style={floating.floatingStyles()}
              class="bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto z-10"
              {...interactions.getFloatingProps()}
            >
              <SolidFloatingList elementsRef={setListRef}>
                <Index each={options}>
                  {(option, index) => {
                    const itemProps = interactions.getItemProps({
                      index,
                      onClick() {
                        handleSelect(option());
                      },
                    });

                    return (
                      <ListItem
                        active={activeIndex() === index}
                        {...itemProps}
                      >
                        {option()}
                      </ListItem>
                    );
                  }}
                </Index>
              </SolidFloatingList>
            </div>
          </FloatingFocusManager>
        )}
      </div>

      <div class="mt-8 p-4 bg-blue-50 rounded-md">
        <h3 class="text-sm font-medium text-blue-800 mb-2">
          Features Demonstrated:
        </h3>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• Click to open/close dropdown</li>
          <li>• Keyboard navigation (arrow keys)</li>
          <li>• Auto-positioning with flip/shift</li>
          <li>• Focus management</li>
          <li>• Click outside to dismiss</li>
          <li>• Hover effects</li>
        </ul>
      </div>
    </div>
  );
}
