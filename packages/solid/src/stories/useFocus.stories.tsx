import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useFocus as useSolidFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal
} from '@floating-ui/solid';
import { createSignal } from 'solid-js';

export default { title: 'Solid: useFocus' };

export function useFocus() {
  const [isOpen, setIsOpen] = createSignal(false);

  const floating = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(10),
      flip({
        fallbackAxisSideDirection: "start",
      }),
      shift()
    ],
    whileElementsMounted: autoUpdate,
  });

  const focus = useSolidFocus(floating.context);
  const dismiss = useDismiss(floating.context);
  const role = useRole(floating.context, {
    role: "tooltip",
  });

  const interactions = useInteractions([
    focus,
    dismiss,
    role,
  ]);

  return (
    <div class="p-8 max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-800 mb-8">
        Floating UI useFocus Hook Test
      </h1>
      
      <div class="space-y-6">
        <p class="text-gray-600">
          Focus on the input field below to see the floating tooltip appear. 
          The tooltip will automatically dismiss when you blur the input.
        </p>
        
        <div class="flex flex-col space-y-4">
          <label html-for="test-input" class="text-sm font-medium text-gray-700">
            Test Input Field
          </label>
          
          <input
            id="test-input"
            ref={floating.refs.setReference}
            {...interactions.getReferenceProps()}
            type="text"
            placeholder="Focus me to show tooltip"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        <div class="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold text-gray-800 mb-2">How it works:</h3>
          <ul class="text-sm text-gray-600 space-y-1">
            <li>• The <code class="bg-gray-200 px-1 rounded">useFocus</code> hook shows the tooltip when the input gains focus</li>
            <li>• The <code class="bg-gray-200 px-1 rounded">useDismiss</code> hook hides it when focus is lost</li>
            <li>• Positioning is handled by the core <code class="bg-gray-200 px-1 rounded">useFloating</code> hook</li>
            <li>• The tooltip has proper ARIA attributes via <code class="bg-gray-200 px-1 rounded">useRole</code></li>
          </ul>
        </div>
      </div>

      {isOpen() && (
        <FloatingPortal>
          <div
            ref={floating.refs.setFloating}
            style={floating.floatingStyles()}
            {...interactions.getFloatingProps()}
            class="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs z-50"
          >
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Tooltip triggered by focus! This appears when you focus the input field.</span>
            </div>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}