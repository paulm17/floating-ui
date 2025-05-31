import React, { useState, useRef } from 'react';
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
  FloatingList as ReactFloatingList,
  useListItem,
} from '@floating-ui/react';

export default { title: 'React: FloatingList' };

// Helper to merge multiple refs into one callback ref
function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(node);
      } else {
        // @ts-ignore
        ref.current = node;
      }
    });
  };
}

const ListItem = React.forwardRef<HTMLDivElement, { children: React.ReactNode; active?: boolean }>(
  ({ children, active, ...props }, forwardedRef) => {
    const { ref: itemRef } = useListItem();

    return (
      <div
        ref={mergeRefs(itemRef, forwardedRef)}
        role="option"
        tabIndex={active ? 0 : -1}
        className={`px-4 py-2 cursor-pointer transition-colors ${
          active ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
        }`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export function FloatingList() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState('Select an option');

  // Holds refs to each <ListItem> DOM node for virtual navigation
  const listRef = useRef<Array<HTMLElement | null>>([]);

  const options = [
    'Apple',
    'Banana',
    'Cherry',
    'Date',
    'Elderberry',
    'Fig',
    'Grape',
  ];

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(5), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'listbox' });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    virtual: true,
    loop: true,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
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
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        FloatingList Test
      </h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose a fruit:
          </label>

          <button
            ref={refs.setReference}
            className="relative w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            {...getReferenceProps()}
          >
            <span className="block truncate">{selectedOption}</span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </button>
        </div>

        {isOpen && (
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto z-10"
              {...getFloatingProps()}
            >
              <ReactFloatingList elementsRef={listRef}>
                {options.map((option, index) => {
                  // 1) Create a temporary `any`‐typed object
                  const rawItemOptions: any = {
                    index,
                    onClick() {
                      handleSelect(option);
                    },
                  };

                  // 2) Pass the `any` object into getItemProps
                  const itemProps = getItemProps(rawItemOptions);

                  return (
                    <ListItem
                      key={option}
                      active={activeIndex === index}
                      {...itemProps}
                    >
                      {option}
                    </ListItem>
                  );
                })}
              </ReactFloatingList>
            </div>
          </FloatingFocusManager>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Features Demonstrated:
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
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
