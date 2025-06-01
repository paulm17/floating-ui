import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useListNavigation,
  useTypeahead as useSolidTypeahead,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  size,
} from '@floating-ui/solid';
import { createEffect, createSignal, Index } from 'solid-js';

export default { title: 'Solid: UseTypeahead' };

const fruits = [
  'Apple',
  'Banana',
  'Cherry',
  'Date',
  'Elderberry',
  'Fig',
  'Grape',
  'Honeydew',
  'Kiwi',
  'Lemon',
  'Mango',
  'Orange',
  'Papaya',
  'Quince',
  'Raspberry',
  'Strawberry',
  'Tangerine',
  'Watermelon',
];

export function UseTypeahead() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [activeIndex, setActiveIndex] = createSignal<number | null>(null);
  const [selectedIndex, setSelectedIndex] = createSignal<number | null>(null);
  const [selectedValue, setSelectedValue] = createSignal('');

  const floating = useFloating({
    placement: 'bottom-start',
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({ padding: 10 }),
      shift({ padding: 10 }),
      size({
        apply({ rects, elements, availableHeight }: any) {
          Object.assign(elements.floating.style, {
            maxHeight: `${availableHeight}px`,
            width: `${rects.reference.width}px`,
          });
        },
        padding: 10,
      }),
    ],
  });

  // Keep DOM refs for each rendered item so useListNavigation can focus them
  const listRef: Array<HTMLElement | null> = ([]);

  // Provide an array of strings for the typeahead matching
  const listContentRef: string[] = [...fruits];

  // Floating UI interactions:
  const click = useClick(floating.context, { event: 'mousedown' });
  const dismiss = useDismiss(floating.context);
  const role = useRole(floating.context, { role: 'listbox' });

  // Arrow‐up/arrow‐down navigation (updates activeIndex + focuses the correct item)
  const listNavigation = useListNavigation(floating.context, {
    listRef,
    activeIndex: () => activeIndex(),
    selectedIndex: () => selectedIndex(),
    onNavigate: setActiveIndex,
    loop: true,
  });

  // Typeahead hook: typing a prefix opens + highlights the first match
  const typeahead = useSolidTypeahead(floating.context, {
    listRef: listContentRef,
    activeIndex: () => activeIndex(),
    selectedIndex: () => selectedIndex(),
    onMatch(index: number) {
      setActiveIndex(index);
      setIsOpen(true);
    },
    onTypingChange(isTyping: boolean) {
        console.log('Typing state changed:', isTyping);
    //   setIsTypingRef(isTyping);
    },
  });

  // Merge all interactions into getReferenceProps / getFloatingProps / getItemProps
  const interactions = useInteractions([
    click,
    dismiss,
    role,
    listNavigation,
    typeahead,
  ]);

  // When Enter is pressed on the button itself, pick the activeIndex:
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && activeIndex != null && isOpen()) {
      event.preventDefault();
      handleSelect(activeIndex()!);
    }
  };

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    setSelectedValue(fruits[index]);
    setIsOpen(false);
  };

  return (
    <div class="p-8 max-w-md mx-auto">
      <h1 class="text-2xl font-bold mb-6 text-gray-800">
        Floating UI Typeahead Test
      </h1>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Select a fruit (click or start typing):
          </label>

          <button
            ref={floating.refs.setReference}
            class={`w-full px-4 py-2 text-left border rounded-lg bg-white shadow-sm transition-colors ${
              isOpen()
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            {...interactions.getReferenceProps({
              onKeyDown: handleKeyDown,
            })}
          >
            {selectedValue() || 'Choose a fruit...'}
            <span class="float-right text-gray-400">
              {isOpen() ? '▲' : '▼'}
            </span>
          </button>
        </div>

        {selectedValue() && (
          <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-green-800">
              <strong>Selected:</strong> {selectedValue()}
            </p>
          </div>
        )}

        <div class="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Instructions:</strong>
          </p>
          <ul class="list-disc list-inside space-y-1 ml-2">
            <li>Click the dropdown to open it</li>
            <li>Start typing to search (e.g., "ap" for Apple)</li>
            <li>Use arrow keys to navigate</li>
            <li>Press Enter or click to select</li>
            <li>Press Escape to close</li>
          </ul>
        </div>
      </div>

      {isOpen() && (
        <FloatingPortal>
          <div
            ref={floating.refs.setFloating}
            style={floating.floatingStyles()}
            class="bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-auto"
            {...interactions.getFloatingProps()}
          >
            <Index each={fruits}>
              {(fruit, index) => (
                <div
                  ref={(node) => {
                    listRef[index] = node;
                  }}
                  role="option"
                  tabIndex={index === activeIndex() ? 0 : -1}
                  aria-selected={index === selectedIndex()}
                  class={`px-4 py-2 cursor-pointer transition-colors ${
                    index === activeIndex()
                      ? 'bg-blue-100 text-blue-900'
                      : index === selectedIndex()
                      ? 'bg-blue-50 text-blue-800'
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                  {...interactions.getItemProps({
                    onClick() {
                      handleSelect(index);
                    },
                    // ← Add onKeyDown here so that pressing “Enter” on a focused item closes the menu:
                    onKeyDown(event: KeyboardEvent) {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleSelect(index);
                      }
                    },
                  })}
                >
                  {fruit}
                </div>
              )}
            </Index>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
