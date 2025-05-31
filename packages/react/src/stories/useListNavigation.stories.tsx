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
  useListNavigation as useReactListNavigation,
  FloatingPortal,
  FloatingFocusManager
} from '@floating-ui/react';

export default { title: 'React: UseListNavigation' };

export function UseListNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const listRef = useRef<Array<HTMLElement | null>>([]);

  const items = [
    'Apple',
    'Banana', 
    'Cherry',
    'Date',
    'Elderberry',
    'Fig',
    'Grape',
    'Honeydew'
  ];

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({ padding: 10 }),
      shift({ padding: 10 })
    ]
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'listbox' });

  const listNavigation = useReactListNavigation(context, {
    listRef,
    activeIndex,
    selectedIndex,
    onNavigate: setActiveIndex,
    virtual: true,
    loop: true
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNavigation
  ]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    setIsOpen(false);
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Floating UI List Navigation Test
      </h1>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Click the button below to open a dropdown list. Use arrow keys to navigate and Enter/Space to select.
        </p>
        
        <button
          ref={refs.setReference}
          className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          {...getReferenceProps()}
        >
          {selectedIndex !== null ? items[selectedIndex] : 'Select a fruit...'}
          <span className="float-right">
            {isOpen ? '▲' : '▼'}
          </span>
        </button>

        {selectedIndex !== null && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              Selected: <span className="font-semibold">{items[selectedIndex]}</span>
            </p>
          </div>
        )}
      </div>

      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 min-w-0"
              {...getFloatingProps()}
            >
              {items.map((item, index) => (
                <div
                  key={item}
                  ref={(node) => {
                    listRef.current[index] = node;
                  }}
                  role="option"
                  className={`px-4 py-2 cursor-pointer text-sm ${
                    activeIndex === index
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${
                    selectedIndex === index
                      ? 'font-semibold bg-green-50'
                      : ''
                  }`}
                  aria-selected={activeIndex === index}
                  {...getItemProps({
                    onClick: () => handleSelect(index),
                    onKeyDown: (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleSelect(index);
                      }
                    }
                  })}
                >
                  {item}
                  {selectedIndex === index && (
                    <span className="float-right text-green-600">✓</span>
                  )}
                </div>
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </div>
  );
}
