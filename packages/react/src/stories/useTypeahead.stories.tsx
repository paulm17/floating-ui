import React, { useState, useRef } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useListNavigation,
  useTypeahead as useReactTypeahead,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  size,
} from '@floating-ui/react';

export default { title: 'React: UseTypeahead' };

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
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedValue, setSelectedValue] = useState('');

  const { refs, floatingStyles, context } = useFloating({
    placement: 'bottom-start',
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({ padding: 10 }),
      shift({ padding: 10 }),
      size({
        apply({ rects, elements, availableHeight }) {
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
  const listRef = useRef<Array<HTMLElement | null>>([]);

  // Provide an array of strings for the typeahead matching
  const listContentRef = useRef<string[]>([...fruits]);

  // Tracks “am I in the middle of typing?” (used internally by useTypeahead)
  const isTypingRef = useRef(false);

  // Floating UI interactions:
  const click = useClick(context, { event: 'mousedown' });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'listbox' });

  // Arrow‐up/arrow‐down navigation (updates activeIndex + focuses the correct item)
  const listNavigation = useListNavigation(context, {
    listRef,
    activeIndex,
    selectedIndex,
    onNavigate: setActiveIndex,
    loop: true,
  });

  // Typeahead hook: typing a prefix opens + highlights the first match
  const typeahead = useReactTypeahead(context, {
    listRef: listContentRef,
    activeIndex,
    selectedIndex,
    onMatch(index) {
      setActiveIndex(index);
      setIsOpen(true);
    },
    onTypingChange(isTyping) {
      isTypingRef.current = isTyping;
    },
  });

  // Merge all interactions into getReferenceProps / getFloatingProps / getItemProps
  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNavigation,
    typeahead,
  ]);

  // When Enter is pressed on the button itself, pick the activeIndex:
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && activeIndex != null && isOpen) {
      event.preventDefault();
      handleSelect(activeIndex);
    }
  };

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    setSelectedValue(fruits[index]);
    setIsOpen(false);
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Floating UI Typeahead Test
      </h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a fruit (click or start typing):
          </label>

          <button
            ref={refs.setReference}
            className={`w-full px-4 py-2 text-left border rounded-lg bg-white shadow-sm transition-colors ${
              isOpen
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            {...getReferenceProps({
              onKeyDown: handleKeyDown,
            })}
          >
            {selectedValue || 'Choose a fruit...'}
            <span className="float-right text-gray-400">
              {isOpen ? '▲' : '▼'}
            </span>
          </button>
        </div>

        {selectedValue && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              <strong>Selected:</strong> {selectedValue}
            </p>
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <strong>Instructions:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Click the dropdown to open it</li>
            <li>Start typing to search (e.g., "ap" for Apple)</li>
            <li>Use arrow keys to navigate</li>
            <li>Press Enter or click to select</li>
            <li>Press Escape to close</li>
          </ul>
        </div>
      </div>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-auto"
            {...getFloatingProps()}
          >
            {fruits.map((fruit, index) => (
              <div
                key={fruit}
                ref={(node) => {
                  listRef.current[index] = node;
                }}
                role="option"
                tabIndex={index === activeIndex ? 0 : -1}
                aria-selected={index === selectedIndex}
                className={`px-4 py-2 cursor-pointer transition-colors ${
                  index === activeIndex
                    ? 'bg-blue-100 text-blue-900'
                    : index === selectedIndex
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                {...getItemProps({
                  onClick() {
                    handleSelect(index);
                  },
                  // ← Add onKeyDown here so that pressing “Enter” on a focused item closes the menu:
                  onKeyDown(event) {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleSelect(index);
                    }
                  },
                })}
              >
                {fruit}
              </div>
            ))}
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
