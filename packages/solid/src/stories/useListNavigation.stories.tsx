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
  useListNavigation as useSolidListNavigation,
  FloatingPortal,
  FloatingFocusManager
} from '@floating-ui/solid';
import { createSignal, Index } from 'solid-js';

export default { title: 'Solid: UseListNavigation' };

export function UseListNavigation() {
  const [isOpen, setIsOpen] = createSignal(false);
  const [activeIndex, setActiveIndex] = createSignal<number | null>(null);
  const [selectedIndex, setSelectedIndex] = createSignal<number | null>(null);

  const listRef: Array<HTMLElement | null> = [];

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

  const floating = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({ padding: 10 }),
      shift({ padding: 10 })
    ]
  });

  const click = useClick(floating.context);
  const dismiss = useDismiss(floating.context);
  const role = useRole(floating.context, { role: 'listbox' });

  const listNavigation = useSolidListNavigation(floating.context, {
    listRef,
    activeIndex,
    selectedIndex,
    onNavigate: setActiveIndex,
    virtual: false,
    loop: true
  });

  const interactions = useInteractions([
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
    <div class="p-8 max-w-md mx-auto">
      <h1 class="text-2xl font-bold mb-6 text-gray-800">
        Floating UI List Navigation Test
      </h1>
      
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          Click the button below to open a dropdown list. Use arrow keys to navigate and Enter/Space to select.
        </p>
        
        <button
          ref={floating.refs.setReference}
          class="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          {...interactions.getReferenceProps()}
        >
          {selectedIndex() !== null ? items[selectedIndex()!] : 'Select a fruit...'}
          <span class="float-right">
            {isOpen() ? '▲' : '▼'}
          </span>
        </button>

        {selectedIndex() !== null && (
          <div class="p-3 bg-green-50 border border-green-200 rounded-md">
            <p class="text-sm text-green-800">
              Selected: <span class="font-semibold">{items[selectedIndex()!]}</span>
            </p>
          </div>
        )}
      </div>

      {isOpen() && (
        <FloatingPortal>
          <FloatingFocusManager context={floating.context} modal={false}>
            <div
              ref={floating.refs.setFloating}
              style={floating.floatingStyles()}
              class="bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 min-w-0"
              {...interactions.getFloatingProps()}
            >
              <Index each={items}>
                {(item, index) => (
                  <div
                    id={`fruit-item-${index}`}
                    ref={(node) => {
                      listRef[index] = node;
                    }}
                    role="option"
                    class={`px-4 py-2 cursor-pointer text-sm ${
                      activeIndex() === index
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    } ${
                      selectedIndex() === index
                        ? 'font-semibold bg-green-50'
                        : ''
                    }`}
                    aria-selected={activeIndex() === index}
                    {...interactions.getItemProps({
                      onClick: () => handleSelect(index),
                      onKeyDown: (event: KeyboardEvent) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleSelect(index);
                        }
                      }
                    })}
                  >
                    {item}
                    {selectedIndex() === index && (
                      <span class="float-right text-green-600">✓</span>
                    )}
                  </div>
                )}
              </Index>              
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </div>
  );
}
